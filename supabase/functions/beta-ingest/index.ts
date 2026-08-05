// ChartQuest — CLOSED BETA analytics + survey write path
// ---------------------------------------------------------------------------
// Deliberately a SEPARATE function from `ingest`. The beta needs a new write
// path, and `ingest` is the live route for player_mastery + the content
// pipeline — a mistake in here must not be able to take that down.
//
// DEPLOYED: version 4.
// ---------------------------------------------------------------------------
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ORIGIN ALLOWLIST — EXACT MATCH, NOT PREFIX.
//
// v1-v3 used `ALLOWED.some(o => origin.startsWith(o))`, which accepts
// `https://playchartquest.com.evil.com` — verified live before this fix: three
// look-alike origins all returned {"ok":true,"written":1}. Any attacker page
// could therefore write schema-valid rows into the closed-beta dataset and
// quietly poison the founder's learning data.
//
// The sibling `ingest` function was migrated off prefix matching for this exact
// reason during the Netlify->Cloudflare move; this one inherited the old shape
// when it was written from that stale repo copy. Do not reintroduce startsWith.
const ALLOWED_EXACT = new Set([
  'https://playchartquest.com',
  'https://www.playchartquest.com',
  'https://chart-quest-game.netlify.app',
  'https://shelltrader.github.io',
]);
// Local dev needs an arbitrary port, so it gets an anchored pattern rather than
// a prefix — `http://localhost.evil.com` must NOT match.
const LOCAL_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;
// Cloudflare Pages preview deployments, e.g. https://a1b2c3d4.chartquest.pages.dev
const PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.chartquest\.pages\.dev$/;

function originAllowed(origin: string): boolean {
  return ALLOWED_EXACT.has(origin) || LOCAL_RE.test(origin) || PREVIEW_RE.test(origin);
}

const MAX_ROWS      = 60;
const RATE_LIMIT    = 120;
const RATE_WINDOW_S = 60;

// The complete set of milestones the beta records. Anything not on this list is
// dropped, so a typo in the client can never quietly create a funnel stage the
// Founder Report then fails to explain.
const EVENT_NAMES = new Set([
  'session_start', 'session_end', 'return_visit',
  'tutorial_started', 'tutorial_completed',
  'first_trade_started', 'first_trade_won', 'first_trade_lost',
  'boss_started', 'boss_defeated',
  'journal_unlocked', 'journal_discovery_started', 'journal_discovery_completed',
  'journal_discovery_skipped',
  'beta_completed',
  'survey_started', 'survey_submitted',
  'crash',
]);

const CONTINUE = new Set(['immediately', 'later', 'not_interested']);

const str = (v: unknown, max: number): string | null =>
  v == null ? null : String(v).slice(0, max);

const clampInt = (v: unknown, lo: number, hi: number): number | null => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
};

const props = (v: unknown): Record<string, unknown> => {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return {};
  const s = JSON.stringify(v);
  return s.length > 4096 ? {} : (v as Record<string, unknown>);
};

function shapeEvent(r: Record<string, unknown>) {
  const name = String(r.name ?? '');
  if (!r.event_id || !EVENT_NAMES.has(name)) return null;
  return {
    event_id:   str(r.event_id, 80),
    player_id:  str(r.player_id, 64),
    session_id: str(r.session_id, 64),
    name,
    ts:         str(r.ts, 40) ?? new Date().toISOString(),
    props:      props(r.props),
    device:     str(r.device, 16),
    browser:    str(r.browser, 32),
    os:         str(r.os, 32),
    screen:     str(r.screen, 24),
    viewport:   str(r.viewport, 24),
  };
}

function shapeSurvey(r: Record<string, unknown>) {
  if (!r.response_id) return null;
  const cont = String(r.q4_continue ?? '');
  return {
    response_id:    str(r.response_id, 80),
    player_id:      str(r.player_id, 64),
    session_id:     str(r.session_id, 64),
    q1_rating:      clampInt(r.q1_rating, 1, 10),
    q2_hook:        str(r.q2_hook, 2000),
    q3_improvement: str(r.q3_improvement, 2000),
    q4_continue:    CONTINUE.has(cont) ? cont : null,
    q5_anything:    str(r.q5_anything, 2000),
    seconds_taken:  clampInt(r.seconds_taken, 0, 86400),
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  const isAllowed = originAllowed(origin);

  // CORS requires an EXACT origin echo. Returning a prefix makes every browser
  // call fail with an opaque "Failed to fetch" while curl still succeeds, because
  // curl does not enforce CORS.
  const cors: Record<string, string> = {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://playchartquest.com',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')    return json(405, { error: 'Method not allowed' });
  if (!isAllowed)               return json(403, { error: 'Forbidden origin' });

  let body: { kind?: string; rows?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: 'Bad JSON' }); }

  const kind = String(body.kind ?? '');
  if (kind !== 'events' && kind !== 'survey') return json(400, { error: 'Unknown kind' });
  if (!Array.isArray(body.rows) || body.rows.length === 0) return json(400, { error: 'No rows' });
  if (body.rows.length > MAX_ROWS) return json(413, { error: 'Too many rows' });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY);

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const windowStart = new Date(
    Math.floor(Date.now() / (RATE_WINDOW_S * 1000)) * RATE_WINDOW_S * 1000,
  ).toISOString();
  const { data: count } = await supa.rpc('bump_ingest_throttle', { p_ip: ip, p_window: windowStart });
  if (typeof count === 'number' && count > RATE_LIMIT) return json(429, { error: 'Rate limited' });

  const shape = kind === 'events' ? shapeEvent : shapeSurvey;
  const clean: Record<string, unknown>[] = [];
  for (const raw of body.rows as Record<string, unknown>[]) {
    if (!raw || typeof raw !== 'object') continue;
    const s = shape(raw);
    if (s) clean.push(s);
  }
  if (clean.length === 0) return json(400, { error: 'No valid rows' });

  // Idempotent on the client id. Surveys UPDATE on conflict (one row per player);
  // events IGNORE duplicates so a retry cannot double-count a funnel stage.
  const table = kind === 'events' ? 'beta_events' : 'beta_surveys';
  const conflict = kind === 'events' ? 'event_id' : 'response_id';
  const { error } = await supa.from(table).upsert(clean, { onConflict: conflict, ignoreDuplicates: kind === 'events' });
  if (error) return json(500, { error: error.message });

  return json(200, { ok: true, written: clean.length });
});
