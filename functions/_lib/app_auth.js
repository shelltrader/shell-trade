/* Cloudflare-native ChartQuest account, password, session-cookie and CSRF helpers. */

import {
  appCorsHeaders,
  base64Url,
  enforceAppRateLimit,
  mutationGuard,
  randomToken,
  sha256Hex,
} from './app.js';

export const SESSION_COOKIE = '__Host-cq_session';
export const CSRF_COOKIE = '__Host-cq_csrf';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
// Cloudflare Workers currently rejects WebCrypto PBKDF2 requests above 100,000
// iterations. Keep the stored per-identity count so this can be raised safely
// when the runtime limit changes.
export const PASSWORD_ITERATIONS = 100000;

function cookies(request) {
  const result = {};
  const raw = request?.headers?.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const at = part.indexOf('=');
    if (at < 1) continue;
    const key = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (key && !Object.prototype.hasOwnProperty.call(result, key)) result[key] = value;
  }
  return result;
}

function bytesFromBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  let binary;
  try { binary = atob(padded); } catch (_) { return null; }
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) result[index] = binary.charCodeAt(index);
  return result;
}

function timingSafeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index % left.length] || 0) ^ (right[index % right.length] || 0);
  }
  return difference === 0;
}

function pepper(env) {
  const value = typeof env?.APP_AUTH_PEPPER === 'string' ? env.APP_AUTH_PEPPER : '';
  if (value.length < 32) throw new Error('APP_AUTH_PEPPER is not configured');
  return value;
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || /[\u0000-\u001f\u007f\s]/.test(email)) return null;
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1 || email.indexOf('@') !== at) return null;
  if (!email.slice(at + 1).includes('.') || email.endsWith('.')) return null;
  return email;
}

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

async function derivePassword(password, salt, iterations, env) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(`${password}\u0000${pepper(env)}`),
    'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt, iterations,
  }, keyMaterial, 256);
  return new Uint8Array(bits);
}

export async function createPasswordCredential(password, env, options) {
  if (!validPassword(password)) throw new Error('Password must be 8 to 128 characters');
  const iterations = Number.isInteger(options?.iterations) ? options.iterations : PASSWORD_ITERATIONS;
  if (iterations < 100000 || iterations > 2000000) throw new Error('Invalid password iteration count');
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derivePassword(password, salt, iterations, env);
  return {
    scheme: 'pbkdf2-sha256-v1', salt: base64Url(salt), hash: base64Url(hash), iterations,
  };
}

export async function passwordRequestFingerprint(email, password, env) {
  if (!validPassword(password)) throw new Error('Invalid password');
  return sha256Hex(`${pepper(env)}\u0000${email}\u0000${password}`);
}

export async function verifyPassword(password, identity, env) {
  if (!validPassword(password) || identity?.password_scheme !== 'pbkdf2-sha256-v1') return false;
  const salt = bytesFromBase64Url(identity.password_salt);
  const expected = bytesFromBase64Url(identity.password_hash);
  const iterations = Number(identity.password_iterations);
  if (!salt || !expected || !Number.isInteger(iterations) || iterations < 100000 || iterations > 2000000) return false;
  const actual = await derivePassword(password, salt, iterations, env);
  return timingSafeEqual(actual, expected);
}

const DUMMY_IDENTITY = Object.freeze({
  password_scheme: 'pbkdf2-sha256-v1',
  password_salt: 'AAAAAAAAAAAAAAAAAAAAAA',
  password_hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  password_iterations: PASSWORD_ITERATIONS,
});

export async function authenticatePassword(password, identity, env) {
  // Always perform one full derivation, including for an unknown email or malformed password,
  // so response timing does not become an account-existence oracle.
  const passwordValid = validPassword(password);
  const candidate = identity?.password_scheme === 'pbkdf2-sha256-v1' ? identity : DUMMY_IDENTITY;
  const matched = await verifyPassword(passwordValid ? password : 'invalid-password-placeholder', candidate, env);
  return !!identity && identity.status === 'active' && passwordValid && matched;
}

function userShape(row) {
  return Object.freeze({
    id: row.user_id || row.id,
    email: row.email_original,
    source: row.source_provider,
  });
}

function cookieLine(name, value, maxAge, httpOnly) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax${httpOnly ? '; HttpOnly' : ''}`;
}

export function clearSessionCookies() {
  return [
    cookieLine(SESSION_COOKIE, '', 0, true),
    cookieLine(CSRF_COOKIE, '', 0, false),
  ];
}

export function authJson(request, status, body, setCookies) {
  const headers = new Headers(appCorsHeaders(request.headers.get('Origin') || ''));
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (Array.isArray(setCookies)) {
    for (const value of setCookies) headers.append('Set-Cookie', value);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function authError(request, status, code, message, setCookies) {
  return authJson(request, status, { error: code, message }, setCookies);
}

export async function issueSession(db, user, request, nowMs) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const token = randomToken(32);
  const csrf = randomToken(24);
  const sessionHash = await sha256Hex(token);
  const csrfHash = await sha256Hex(csrf);
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + SESSION_SECONDS * 1000).toISOString();
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 512);
  const userAgentHash = userAgent ? await sha256Hex(userAgent) : null;
  await db.prepare(`
    INSERT INTO app_sessions (
      session_hash, user_id, csrf_hash, source, created_at,
      expires_at, last_seen_at, user_agent_hash
    ) VALUES (?, ?, ?, 'cloudflare', ?, ?, ?, ?)
  `).bind(sessionHash, user.id || user.user_id, csrfHash, createdAt, expiresAt, createdAt, userAgentHash).run();
  return {
    user: userShape(user), csrf, expiresAt,
    cookies: [
      cookieLine(SESSION_COOKIE, token, SESSION_SECONDS, true),
      cookieLine(CSRF_COOKIE, csrf, SESSION_SECONDS, false),
    ],
  };
}

export async function findIdentityByEmail(db, email) {
  return db.prepare(`
    SELECT id, email_normalized, email_original, source_provider, source_subject,
           status, password_scheme, password_salt, password_hash, password_iterations,
           claimed_at, created_at, updated_at
    FROM app_identities WHERE email_normalized = ? LIMIT 1
  `).bind(email).first();
}

export async function requireSession(request, env, options) {
  if (!env?.APP_DB) return { error: authError(request, 503, 'app_unavailable', 'Account service is unavailable.') };
  const jar = cookies(request);
  const token = jar[SESSION_COOKIE];
  if (!token || token.length > 128) {
    return { error: authError(request, 401, 'authentication_required', 'Please sign in.') };
  }
  const sessionHash = await sha256Hex(token);
  const nowIso = new Date(Number.isFinite(options?.nowMs) ? options.nowMs : Date.now()).toISOString();
  const revokedClause = options?.allowRevoked ? '' : 'AND s.revoked_at IS NULL';
  const row = await env.APP_DB.prepare(`
    SELECT s.session_hash, s.user_id, s.csrf_hash, s.expires_at, s.revoked_at,
           i.email_original, i.source_provider
    FROM app_sessions s
    JOIN app_identities i ON i.id = s.user_id
    WHERE s.session_hash = ? ${revokedClause} AND s.expires_at > ?
      AND i.status = 'active'
    LIMIT 1
  `).bind(sessionHash, nowIso).first();
  if (!row) {
    return { error: authError(request, 401, 'authentication_required', 'Please sign in.', clearSessionCookies()) };
  }
  const csrf = jar[CSRF_COOKIE] || null;
  let csrfValid = false;
  if (csrf && csrf.length <= 128) csrfValid = (await sha256Hex(csrf)) === row.csrf_hash;
  return { session: Object.freeze({ ...row, user: userShape(row), csrf, csrfValid }) };
}

export async function requireAuthenticatedMutation(request, env, options) {
  const unsafe = mutationGuard(request);
  if (unsafe) return { error: authError(request, unsafe.status, 'request_rejected', 'Request security checks failed.') };
  const checked = await requireSession(request, env, options);
  if (checked.error) return checked;
  const header = request.headers.get('X-CSRF-Token') || '';
  if (!checked.session.csrfValid || !header || header !== checked.session.csrf) {
    return { error: authError(request, 403, 'csrf_failed', 'Security token is missing or expired.') };
  }
  try {
    const rate = await enforceAppRateLimit(env.APP_DB, request, env, 'auth-write', 240, 60, options?.nowMs);
    if (!rate.allowed) {
      return { error: authError(request, 429, 'rate_limited', 'Too many requests. Try again shortly.') };
    }
  } catch (_) {
    return { error: authError(request, 503, 'app_unavailable', 'Account service is unavailable.') };
  }
  return checked;
}

export async function revokeSession(db, sessionHash, nowIso) {
  await db.prepare(`
    UPDATE app_sessions SET revoked_at = ?
    WHERE session_hash = ? AND revoked_at IS NULL
  `).bind(nowIso, sessionHash).run();
}
