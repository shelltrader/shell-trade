/* ChartQuest closed-beta data contract shared by the public ingest and founder export routes. */

export const EVENT_NAMES = Object.freeze([
  'session_start', 'session_end', 'return_visit',
  'play_clicked', 'movement_tutorial_completed',
  'tutorial_started', 'tutorial_completed', 'tutorial_step_reached',
  'first_trade_started', 'first_trade_won', 'first_trade_lost',
  'boss_started', 'boss_defeated',
  'journal_unlocked', 'journal_discovery_started',
  'journal_discovery_completed', 'journal_discovery_skipped',
  'beta_completed', 'survey_started', 'survey_submitted', 'crash',
]);

const EVENT_NAME_SET = new Set(EVENT_NAMES);
const CONTINUE_VALUES = new Set(['immediately', 'later', 'not_interested']);

export const ALLOWED_ORIGINS = Object.freeze([
  'https://playchartquest.com',
  'https://www.playchartquest.com',
  'https://chartquest.pages.dev',
  'https://chart-quest-game.netlify.app',
  'https://shelltrader.github.io',
]);

const ALLOWED_ORIGIN_SET = new Set(ALLOWED_ORIGINS);
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;
const PAGES_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.chartquest\.pages\.dev$/;

export const MAX_ROWS = 60;
export const MAX_BODY_BYTES = 256 * 1024;
export const RATE_LIMIT = 120;
export const RATE_WINDOW_SECONDS = 60;

export function originAllowed(origin) {
  return typeof origin === 'string' && (
    ALLOWED_ORIGIN_SET.has(origin) ||
    LOCAL_ORIGIN_RE.test(origin) ||
    PAGES_PREVIEW_RE.test(origin)
  );
}

export function noStoreHeaders(extra) {
  return Object.assign({
    'Cache-Control': 'no-store, private, max-age=0',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  }, extra || {});
}

export function corsHeaders(origin) {
  const headers = noStoreHeaders({
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  });
  if (originAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function jsonResponse(status, body, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: noStoreHeaders(Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {})),
  });
}

function str(value, max) {
  return value == null ? null : String(value).slice(0, max);
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function cleanProps(value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {};
  const encoded = JSON.stringify(value);
  return encoded.length > 4096 ? {} : value;
}

export function shapeEvent(raw, nowIso) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const name = String(raw.name ?? '');
  if (
    !present(raw.event_id) ||
    !present(raw.player_id) ||
    !present(raw.session_id) ||
    !EVENT_NAME_SET.has(name)
  ) return null;
  return {
    event_id: str(raw.event_id, 80),
    player_id: str(raw.player_id, 64),
    session_id: str(raw.session_id, 64),
    name,
    ts: str(raw.ts, 40) ?? nowIso,
    props: cleanProps(raw.props),
    device: str(raw.device, 16),
    browser: str(raw.browser, 32),
    os: str(raw.os, 32),
    screen: str(raw.screen, 24),
    viewport: str(raw.viewport, 24),
  };
}

export function shapeSurvey(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const continuation = String(raw.q4_continue ?? '');
  const rating = Number(raw.q1_rating);
  const seconds = Number(raw.seconds_taken);
  if (
    !present(raw.response_id) ||
    !present(raw.player_id) ||
    !present(raw.session_id) ||
    !Number.isInteger(rating) || rating < 1 || rating > 10 ||
    !present(raw.q2_hook) || raw.q2_hook.length > 2000 ||
    !present(raw.q3_improvement) || raw.q3_improvement.length > 2000 ||
    !CONTINUE_VALUES.has(continuation) ||
    (raw.q5_anything != null && (typeof raw.q5_anything !== 'string' || raw.q5_anything.length > 2000)) ||
    !Number.isInteger(seconds) || seconds < 0 || seconds > 86400
  ) return null;
  return {
    response_id: str(raw.response_id, 80),
    player_id: str(raw.player_id, 64),
    session_id: str(raw.session_id, 64),
    q1_rating: rating,
    q2_hook: str(raw.q2_hook, 2000),
    q3_improvement: str(raw.q3_improvement, 2000),
    q4_continue: continuation,
    q5_anything: str(raw.q5_anything, 2000),
    seconds_taken: seconds,
  };
}

export function validateIngestBody(body, nowIso) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: { status: 400, message: 'Bad JSON body' } };
  }
  const kind = String(body.kind ?? '');
  if (kind !== 'events' && kind !== 'survey') {
    return { error: { status: 400, message: 'Unknown kind' } };
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return { error: { status: 400, message: 'No rows' } };
  }
  if (body.rows.length > MAX_ROWS) {
    return { error: { status: 413, message: 'Too many rows' } };
  }
  const shape = kind === 'events'
    ? (row) => shapeEvent(row, nowIso)
    : shapeSurvey;
  const rows = body.rows.map(shape);
  if (rows.some((row) => !row)) {
    return { error: { status: 400, message: 'Invalid row' } };
  }
  return { kind, rows };
}

function eventStatement(db, row, nowIso) {
  return db.prepare(`
    INSERT INTO beta_events (
      event_id, player_id, session_id, name, ts, props,
      device, browser, os, screen, viewport, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(event_id) DO NOTHING
  `).bind(
    row.event_id, row.player_id, row.session_id, row.name, row.ts,
    JSON.stringify(row.props), row.device, row.browser, row.os,
    row.screen, row.viewport, nowIso,
  );
}

function surveyStatement(db, row, nowIso) {
  return db.prepare(`
    INSERT INTO beta_surveys (
      response_id, player_id, session_id, q1_rating, q2_hook,
      q3_improvement, q4_continue, q5_anything, seconds_taken,
      created_at, updated_at, ingest_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cloudflare')
    ON CONFLICT(response_id) DO UPDATE SET
      player_id = excluded.player_id,
      session_id = excluded.session_id,
      q1_rating = excluded.q1_rating,
      q2_hook = excluded.q2_hook,
      q3_improvement = excluded.q3_improvement,
      q4_continue = excluded.q4_continue,
      q5_anything = excluded.q5_anything,
      seconds_taken = excluded.seconds_taken,
      updated_at = excluded.updated_at,
      ingest_source = 'cloudflare'
  `).bind(
    row.response_id, row.player_id, row.session_id, row.q1_rating,
    row.q2_hook, row.q3_improvement, row.q4_continue, row.q5_anything,
    row.seconds_taken, nowIso, nowIso,
  );
}

export async function writeIngestRows(db, kind, rows, nowIso) {
  const statements = rows.map((row) => kind === 'events'
    ? eventStatement(db, row, nowIso)
    : surveyStatement(db, row, nowIso));
  await db.batch(statements);
  // This intentionally matches the previous endpoint: duplicates are accepted idempotently,
  // and `written` reports the number of valid rows acknowledged rather than SQLite changes().
  return rows.length;
}

function bytesToHex(bytes) {
  let result = '';
  for (const byte of bytes) result += byte.toString(16).padStart(2, '0');
  return result;
}

async function rateBucket(request, env, windowStart) {
  // BETA_RATE_SALT is a required Cloudflare secret (32+ characters), separate from BETA_DB.
  // A bare SHA-256 of IPv4 is dictionary-reversible; HMAC keeps even the ten-minute bucket opaque.
  const salt = typeof env?.BETA_RATE_SALT === 'string' ? env.BETA_RATE_SALT : '';
  if (salt.length < 32) throw new Error('BETA_RATE_SALT is not configured');
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(salt),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  // Bind the digest to the minute as well, so even retained buckets cannot link an IP over time.
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${windowStart}:${ip}`));
  return bytesToHex(new Uint8Array(digest));
}

export async function enforceRateLimit(db, request, nowMs, env) {
  const windowStart = Math.floor(nowMs / (RATE_WINDOW_SECONDS * 1000)) * RATE_WINDOW_SECONDS;
  const bucket = await rateBucket(request, env, windowStart);
  const row = await db.prepare(`
    INSERT INTO beta_ingest_throttle (ip_hash, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(ip_hash, window_start) DO UPDATE SET
      request_count = beta_ingest_throttle.request_count + 1
    RETURNING request_count
  `).bind(bucket, windowStart).first();

  // Bound even a long-running beta without retaining a visit/IP history.
  await db.prepare('DELETE FROM beta_ingest_throttle WHERE window_start < ?')
    .bind(windowStart - (10 * RATE_WINDOW_SECONDS)).run();

  const rawCount = row && row.request_count;
  const count = rawCount == null ? NaN : Number(rawCount);
  if (!Number.isFinite(count) || count < 1) throw new Error('Rate limiter did not return a count');
  return { allowed: count <= RATE_LIMIT, count, retryAfter: RATE_WINDOW_SECONDS };
}

export const DATASETS = Object.freeze({
  events: {
    table: 'beta_events',
    columns: Object.freeze([
      'id', 'event_id', 'player_id', 'session_id', 'name', 'ts', 'props',
      'device', 'browser', 'os', 'screen', 'viewport', 'created_at',
    ]),
    jsonColumns: Object.freeze(['props']),
  },
  surveys: {
    table: 'beta_surveys',
    columns: Object.freeze([
      'id', 'response_id', 'player_id', 'session_id', 'q1_rating',
      'q2_hook', 'q3_improvement', 'q4_continue', 'q5_anything',
      'seconds_taken', 'created_at', 'updated_at', 'ingest_source',
    ]),
    jsonColumns: Object.freeze([]),
  },
});

export function normalizeRows(dataset, rows) {
  const jsonColumns = new Set(dataset.jsonColumns);
  return (Array.isArray(rows) ? rows : []).map((source) => {
    const row = {};
    for (const column of dataset.columns) {
      let value = source && Object.prototype.hasOwnProperty.call(source, column)
        ? source[column]
        : null;
      if (jsonColumns.has(column) && typeof value === 'string') {
        try { value = JSON.parse(value); } catch (_) { value = {}; }
      }
      row[column] = value;
    }
    return row;
  });
}

export function formulaSafe(value) {
  if (value == null) return '';
  let string = typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Excel/Sheets can execute a quoted CSV cell as a formula. Neutralise formula-leading text,
  // including leading whitespace/BOM tricks and the tab/CR control prefixes used by CSV injection.
  if (/^\s*[=+\-@]/u.test(string) || /^[\t\r]/u.test(string)) string = `'${string}`;
  return string;
}

function csvCell(value) {
  return `"${formulaSafe(value).replace(/"/g, '""')}"`;
}

export function rowsToCsv(dataset, rows) {
  const lines = [dataset.columns.map(csvCell).join(',')];
  for (const row of normalizeRows(dataset, rows)) {
    lines.push(dataset.columns.map((column) => csvCell(row[column])).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
}
