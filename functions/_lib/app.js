/* Shared Cloudflare application-plane HTTP, validation, hashing and throttle helpers. */

export const APP_ALLOWED_ORIGINS = Object.freeze([
  'https://playchartquest.com',
  'https://www.playchartquest.com',
  'https://chartquest.pages.dev',
  'https://chart-quest-game.netlify.app',
  'https://shelltrader.github.io',
]);

const ORIGIN_SET = new Set(APP_ALLOWED_ORIGINS);
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;
const PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.chartquest\.pages\.dev$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/;

export const APP_MAX_BODY_BYTES = 512 * 1024;

export function appOriginAllowed(origin) {
  return typeof origin === 'string' && (
    ORIGIN_SET.has(origin) || LOCAL_ORIGIN_RE.test(origin) || PREVIEW_ORIGIN_RE.test(origin)
  );
}

export function appHeaders(extra) {
  return Object.assign({
    'Cache-Control': 'no-store, private, max-age=0',
    Pragma: 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  }, extra || {});
}

export function appCorsHeaders(origin, methods) {
  const headers = appHeaders({
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'content-type, x-csrf-token, x-idempotency-key',
    'Access-Control-Allow-Methods': methods || 'GET, POST, PUT, DELETE, OPTIONS',
    Vary: 'Origin',
  });
  if (appOriginAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function appJson(status, body, headers) {
  const responseHeaders = new Headers(appHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  }));
  if (headers) {
    const incoming = headers instanceof Headers ? headers : new Headers(headers);
    incoming.forEach((value, key) => responseHeaders.set(key, value));
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

export function appError(status, code, message, headers) {
  return appJson(status, { error: code, message }, headers);
}

export function optionsResponse(request, methods) {
  const origin = request.headers.get('Origin') || '';
  if (!appOriginAllowed(origin)) return appError(403, 'forbidden_origin', 'Request origin is not allowed.');
  return new Response(null, { status: 204, headers: appCorsHeaders(origin, methods) });
}

export function mutationGuard(request) {
  const origin = request.headers.get('Origin') || '';
  if (!appOriginAllowed(origin)) {
    return appError(403, 'forbidden_origin', 'Request origin is not allowed.', appCorsHeaders(origin));
  }
  const fetchSite = (request.headers.get('Sec-Fetch-Site') || '').toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
    return appError(403, 'cross_site_request', 'Cross-site requests are not allowed.', appCorsHeaders(origin));
  }
  const fetchMode = (request.headers.get('Sec-Fetch-Mode') || '').toLowerCase();
  if (fetchMode && fetchMode !== 'cors' && fetchMode !== 'same-origin' && fetchMode !== 'navigate') {
    return appError(403, 'invalid_fetch_mode', 'Request mode is not allowed.', appCorsHeaders(origin));
  }
  return null;
}

export function withCors(request, response, methods) {
  const headers = new Headers(response.headers);
  const cors = appCorsHeaders(request.headers.get('Origin') || '', methods);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function readAppJson(request, maxBytes = APP_MAX_BODY_BYTES) {
  const type = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!/^application\/json(?:\s*;|$)/.test(type)) {
    return { error: appError(415, 'json_required', 'Content-Type must be application/json.') };
  }
  const length = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(length) && length > maxBytes) {
    return { error: appError(413, 'request_too_large', 'Request is too large.') };
  }
  let raw;
  try { raw = await request.text(); }
  catch (_) { return { error: appError(400, 'bad_json', 'Request body could not be read.') }; }
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { error: appError(413, 'request_too_large', 'Request is too large.') };
  }
  let body;
  try { body = JSON.parse(raw); }
  catch (_) { return { error: appError(400, 'bad_json', 'Request body must be valid JSON.') }; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: appError(400, 'bad_json', 'Request body must be a JSON object.') };
  }
  return { body, raw };
}

export function validIdempotencyKey(value) {
  return typeof value === 'string' && IDEMPOTENCY_RE.test(value);
}

export function requestIdempotencyKey(request, body, fallbackField) {
  const header = request.headers.get('X-Idempotency-Key');
  const fallback = fallbackField && body ? body[fallbackField] : null;
  const value = header || fallback;
  return validIdempotencyKey(value) ? value : null;
}

export function boundedString(value, max, options) {
  if (value == null) return options?.nullable ? null : '';
  const string = String(value);
  if (string.length > max || (options?.present && !string.trim())) return null;
  return string;
}

export function boundedObject(value, maxBytes) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  let encoded;
  try { encoded = JSON.stringify(value); } catch (_) { return null; }
  return new TextEncoder().encode(encoded).byteLength <= maxBytes ? value : null;
}

export function clampInteger(value, low, high) {
  const number = Number(value);
  return Number.isInteger(number) && number >= low && number <= high ? number : null;
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

function bytesToHex(bytes) {
  let result = '';
  for (const byte of bytes) result += byte.toString(16).padStart(2, '0');
  return result;
}

export async function sha256Hex(value) {
  const data = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export function canonicalJson(value) {
  return canonical(value);
}

export async function payloadDigest(value) {
  return sha256Hex(canonicalJson(value));
}

export function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export function randomUuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function hmacSha256Hex(secret, message) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('HMAC secret is not configured');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(digest));
}

export async function enforceAppRateLimit(db, request, env, scope, limit, windowSeconds, nowMs) {
  const salt = typeof env?.APP_RATE_SALT === 'string' ? env.APP_RATE_SALT : '';
  if (salt.length < 32) throw new Error('APP_RATE_SALT is not configured');
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bucket = await hmacSha256Hex(salt, `${scope}:${windowStart}:${ip}`);
  const row = await db.prepare(`
    INSERT INTO app_rate_limits (bucket_hash, scope, window_start, request_count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(bucket_hash, scope, window_start) DO UPDATE SET
      request_count = app_rate_limits.request_count + 1
    RETURNING request_count
  `).bind(bucket, scope, windowStart).first();
  await db.prepare('DELETE FROM app_rate_limits WHERE window_start < ?')
    .bind(windowStart - (10 * windowSeconds)).run();
  const count = Number(row?.request_count);
  if (!Number.isFinite(count) || count < 1) throw new Error('Rate limiter did not return a count');
  return { allowed: count <= limit, count, retryAfter: windowSeconds };
}

export function formulaSafe(value) {
  if (value == null) return '';
  let string = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^\s*[=+\-@]/u.test(string) || /^[\t\r]/u.test(string)) string = `'${string}`;
  return string;
}

export function rowsToCsv(columns, rows) {
  const cell = (value) => `"${formulaSafe(value).replace(/"/g, '""')}"`;
  const lines = [columns.map(cell).join(',')];
  for (const row of rows) lines.push(columns.map((column) => cell(row?.[column])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}
