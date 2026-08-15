import { noStoreHeaders } from './beta.js';

const JWKS_CACHE = new Map();
const DEFAULT_JWKS_TTL_MS = 5 * 60 * 1000;
const MAX_JWT_BYTES = 16 * 1024;

export class AccessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccessError';
  }
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new AccessError('Malformed JWT');
  }
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  let binary;
  try { binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding); }
  catch (_) { throw new AccessError('Malformed JWT'); }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function decodeJsonSegment(value) {
  let parsed;
  try { parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(value))); }
  catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError('Malformed JWT JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new AccessError('Malformed JWT JSON');
  }
  return parsed;
}

function accessConfig(env) {
  const issuer = typeof env?.CF_ACCESS_ISSUER === 'string' ? env.CF_ACCESS_ISSUER.trim() : '';
  const audience = typeof env?.CF_ACCESS_AUD === 'string' ? env.CF_ACCESS_AUD.trim() : '';
  if (!issuer || !audience) throw new AccessError('Cloudflare Access is not configured');

  let url;
  try { url = new URL(issuer); }
  catch (_) { throw new AccessError('Invalid Cloudflare Access issuer'); }
  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.cloudflareaccess.com') ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search || url.hash || url.username || url.password
  ) {
    throw new AccessError('Invalid Cloudflare Access issuer');
  }
  const canonicalIssuer = `${url.protocol}//${url.host}`;
  if (issuer.replace(/\/$/, '') !== canonicalIssuer) {
    throw new AccessError('Invalid Cloudflare Access issuer');
  }
  return { issuer: canonicalIssuer, audience };
}

function cacheTtl(response) {
  const cacheControl = response.headers && response.headers.get
    ? response.headers.get('Cache-Control') || ''
    : '';
  const match = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl);
  if (!match) return DEFAULT_JWKS_TTL_MS;
  const seconds = Math.max(60, Math.min(3600, Number(match[1])));
  return seconds * 1000;
}

async function fetchJwks(issuer, fetcher, nowMs, force) {
  const cached = JWKS_CACHE.get(issuer);
  if (!force && cached && cached.expiresAt > nowMs) return cached.keys;

  let response;
  try {
    response = await fetcher(`${issuer}/cdn-cgi/access/certs`, {
      method: 'GET',
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });
  } catch (_) {
    throw new AccessError('Cloudflare Access keys unavailable');
  }
  if (!response || !response.ok) throw new AccessError('Cloudflare Access keys unavailable');

  let body;
  try { body = await response.json(); }
  catch (_) { throw new AccessError('Invalid Cloudflare Access keys'); }
  const keys = Array.isArray(body && body.keys) ? body.keys : [];
  if (!keys.length) throw new AccessError('Invalid Cloudflare Access keys');
  JWKS_CACHE.set(issuer, { keys, expiresAt: nowMs + cacheTtl(response) });
  return keys;
}

function matchingKey(keys, kid) {
  return keys.find((key) => key && key.kid === kid && key.kty === 'RSA' &&
    (!key.alg || key.alg === 'RS256') && (!key.use || key.use === 'sig')) || null;
}

function audienceAllowed(claim, expected) {
  if (typeof claim === 'string') return claim === expected;
  return Array.isArray(claim) && claim.some((value) => value === expected);
}

async function verifySignature(signingInput, signature, jwk) {
  let key;
  try {
    key = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify'],
    );
    return await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' }, key, signature,
      new TextEncoder().encode(signingInput),
    );
  } catch (_) {
    throw new AccessError('Invalid Cloudflare Access signing key');
  }
}

export async function validateAccessJwt(token, env, options) {
  if (typeof token !== 'string' || !token || token.length > MAX_JWT_BYTES) {
    throw new AccessError('Missing Cloudflare Access token');
  }
  const config = accessConfig(env);
  const parts = token.split('.');
  if (parts.length !== 3) throw new AccessError('Malformed JWT');
  const header = decodeJsonSegment(parts[0]);
  const claims = decodeJsonSegment(parts[1]);
  const signature = decodeBase64Url(parts[2]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new AccessError('Unsupported JWT');
  }

  const nowMs = Number.isFinite(options?.nowMs) ? options.nowMs : Date.now();
  const nowSeconds = Math.floor(nowMs / 1000);
  if (claims.iss !== config.issuer) throw new AccessError('Invalid JWT issuer');
  if (!audienceAllowed(claims.aud, config.audience)) throw new AccessError('Invalid JWT audience');
  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) <= nowSeconds) {
    throw new AccessError('Expired JWT');
  }
  if (claims.nbf != null && (!Number.isFinite(Number(claims.nbf)) || Number(claims.nbf) > nowSeconds + 30)) {
    throw new AccessError('JWT is not active');
  }
  if (claims.iat != null && (!Number.isFinite(Number(claims.iat)) || Number(claims.iat) > nowSeconds + 60)) {
    throw new AccessError('Invalid JWT issued-at time');
  }

  const fetcher = options?.fetcher || fetch;
  let keys = await fetchJwks(config.issuer, fetcher, nowMs, false);
  let jwk = matchingKey(keys, header.kid);
  if (!jwk) {
    keys = await fetchJwks(config.issuer, fetcher, nowMs, true);
    jwk = matchingKey(keys, header.kid);
  }
  if (!jwk) throw new AccessError('Unknown JWT signing key');
  const valid = await verifySignature(`${parts[0]}.${parts[1]}`, signature, jwk);
  if (!valid) throw new AccessError('Invalid JWT signature');

  return Object.freeze({
    sub: typeof claims.sub === 'string' ? claims.sub : null,
    email: typeof claims.email === 'string' ? claims.email : null,
    issuer: claims.iss,
    audience: config.audience,
    expiresAt: Number(claims.exp),
    claims,
  });
}

export function forbiddenResponse() {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: noStoreHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
  });
}

export async function requireAccess(request, env, options) {
  const token = request && request.headers
    ? request.headers.get('Cf-Access-Jwt-Assertion')
    : null;
  try { return await validateAccessJwt(token, env, options); }
  catch (_) { return null; }
}

// Test-only state reset; exporting it also makes key rotation behavior deterministic in local QA.
export function clearAccessKeyCacheForTests() {
  JWKS_CACHE.clear();
}
