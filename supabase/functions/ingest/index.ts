// Chart Quest — content + mastery ingest gateway
// ---------------------------------------------------------------------------
// The game used to POST directly to /rest/v1/content_events, content_replays,
// content_briefs, content_exports, content_generated and player_mastery with
// the public anon key. That let anyone write arbitrary columns (e.g. forge a
// processed_status='published' event, or an absurd significance_score) and
// flood the tables. This function is the single validated write path:
//   • whitelists columns per table (unknown keys dropped)
//   • clamps / forces server-controlled fields
//   • caps row counts and payload sizes
//   • rate-limits per IP
//   • writes with the service role
// After the updated client is deployed, drop the anon INSERT/UPDATE policies
// (migration 0009) so this is the ONLY way in.
// ---------------------------------------------------------------------------
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ORIGINS = [
  'https://chart-quest-game.netlify.app',
  'https://shelltrader.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

const MAX_ROWS = 100;               // per request
const RATE_LIMIT = 120;             // requests per window, per IP
const RATE_WINDOW_S = 60;

const MASTERY_CATS = new Set([
  'trend', 'momentum', 'structure', 'risk', 'psychology', 'entries', 'confluence', 'patience',
]);

const clampInt = (v: unknown, lo: number, hi: number, dflt = 0): number => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
};
const str = (v: unknown, max: number): string | null =>
  v == null ? null : String(v).slice(0, max);
const obj = (v: unknown, maxBytes: number): Record<string, unknown> => {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return {};
  const s = JSON.stringify(v);
  return s.length > maxBytes ? {} : (v as Record<string, unknown>);
};

// Per-table sanitizers → return a clean row or null to reject it.
const SHAPERS: Record<string, (r: Record<string, unknown>) => Record<string, unknown> | null> = {
  content_events: (r) => {
    if (!r.event_id || !r.event_type) return null;
    return {
      event_id: str(r.event_id, 80), event_type: str(r.event_type, 80),
      ts: str(r.ts, 40) || new Date().toISOString(), player_id: str(r.player_id, 64), session_id: str(r.session_id, 64),
      faction: str(r.faction, 16), player_level: clampInt(r.player_level, 0, 100),
      player_rank: str(r.player_rank, 40),
      payload: obj(r.payload, 8192), educational_metadata: obj(r.educational_metadata, 4096),
      content_flags: obj(r.content_flags, 4096),
      significance_score: clampInt(r.significance_score, 0, 100),
      processed_status: 'new',   // server-controlled; clients can never publish
    };
  },
  content_replays: (r) => {
    if (!r.replay_id) return null;
    return {
      replay_id: str(r.replay_id, 80), event_id: str(r.event_id, 80),
      kind: str(r.kind, 32), meta: obj(r.meta, 8192), data: obj(r.data, 65536),
    };
  },
  content_briefs: (r) => {
    if (!r.event_id) return null;
    return {
      event_id: str(r.event_id, 80), pillar: str(r.pillar, 40),
      platforms: Array.isArray(r.platforms) ? (r.platforms as unknown[]).slice(0, 12).map((p) => str(p, 32)) : [],
      urgency: str(r.urgency, 24), angle: str(r.angle, 200), format: str(r.format, 40),
      priority: clampInt(r.priority, 0, 1000), status: 'proposed',
    };
  },
  content_exports: (r) => ({
    platform: str(r.platform, 40), event_count: clampInt(r.event_count, 0, 1_000_000),
    filter: obj(r.filter, 8192),
  }),
  content_generated: (r) => ({
    platform: str(r.platform, 40), body: str(r.body, 20000),
    meta: obj(r.meta, 8192), status: str(r.status, 24),
  }),
  player_mastery: (r) => {
    if (!r.player_id || !MASTERY_CATS.has(String(r.category))) return null;
    return {
      player_id: str(r.player_id, 64), category: String(r.category),
      score: clampInt(r.score, 0, 100), updated_at: new Date().toISOString(),
    };
  },
};

// How each table de-duplicates on insert.
const CONFLICT: Record<string, { onConflict?: string; ignore?: boolean }> = {
  content_events:  { onConflict: 'event_id',  ignore: true },
  content_replays: { onConflict: 'replay_id', ignore: true },
  player_mastery:  { onConflict: 'player_id,category', ignore: false },
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.find((o) => origin.startsWith(o)) ?? '';
  const cors = {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!allowedOrigin) return json(403, { error: 'Forbidden origin' });

  let body: { table?: string; rows?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: 'Bad JSON' }); }

  const table = String(body.table ?? '');
  const shaper = SHAPERS[table];
  if (!shaper) return json(400, { error: 'Unknown table' });
  if (!Array.isArray(body.rows) || body.rows.length === 0) return json(400, { error: 'No rows' });
  if (body.rows.length > MAX_ROWS) return json(413, { error: 'Too many rows' });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY);

  // --- Rate limit per IP (fixed window, atomic increment in one RPC) ---
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const windowStart = new Date(Math.floor(Date.now() / (RATE_WINDOW_S * 1000)) * RATE_WINDOW_S * 1000).toISOString();
  const { data: count } = await supa.rpc('bump_ingest_throttle', { p_ip: ip, p_window: windowStart });
  if (typeof count === 'number' && count > RATE_LIMIT) {
    return json(429, { error: 'Rate limited' });
  }

  // --- Shape + reject bad rows ---
  const clean: Record<string, unknown>[] = [];
  for (const raw of body.rows as Record<string, unknown>[]) {
    if (!raw || typeof raw !== 'object') continue;
    const shaped = shaper(raw);
    if (shaped) clean.push(shaped);
  }
  if (clean.length === 0) return json(400, { error: 'No valid rows' });

  // --- Write with the service role ---
  const conf = CONFLICT[table];
  const q = conf
    ? supa.from(table).upsert(clean, { onConflict: conf.onConflict, ignoreDuplicates: !!conf.ignore })
    : supa.from(table).insert(clean);
  const { error } = await q;
  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, written: clean.length });
});
