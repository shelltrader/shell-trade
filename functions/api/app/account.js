import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  randomUuid,
  readAppJson,
  requestIdempotencyKey,
} from '../../_lib/app.js';
import {
  authError,
  authJson,
  createPasswordCredential,
  findIdentityByEmail,
  issueSession,
  normalizeEmail,
  passwordRequestFingerprint,
  validPassword,
} from '../../_lib/app_auth.js';
import {
  findReceipt,
  outboxStatement,
  receiptShape,
  receiptStatement,
} from '../../_lib/app_data.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const unsafe = mutationGuard(request);
  if (unsafe) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  const parsed = await readAppJson(request, 16 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_request', 'Account request is invalid.');
  const email = normalizeEmail(parsed.body.email);
  const password = parsed.body.password;
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!email || !validPassword(password) || parsed.body.consent !== true) {
    return authError(request, 400, 'invalid_account', 'Use a valid email, an 8+ character password, and accept the terms.');
  }
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'account', 5, 300);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many attempts. Try again shortly.');
    const passwordFingerprint = await passwordRequestFingerprint(email, password, context.env);
    const digest = await payloadDigest({ email, consent: true, password_fingerprint: passwordFingerprint });
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.operation !== 'account.create' || prior.payload_hash !== digest) {
        return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
      }
      const result = JSON.parse(prior.result_json || '{}');
      const identity = await context.env.APP_DB.prepare(`SELECT id, email_original, source_provider, status
        FROM app_identities WHERE id = ?`).bind(result.user_id).first();
      if (!identity || identity.status !== 'active') throw new Error('identity unavailable');
      const session = await issueSession(context.env.APP_DB, identity, request);
      return authJson(request, 200, {
        ok: true, user: session.user, csrf_token: session.csrf, expires_at: session.expiresAt,
        receipt: receiptShape(prior, true),
      }, session.cookies);
    }
    if (await findIdentityByEmail(context.env.APP_DB, email)) {
      return authError(request, 409, 'account_exists', 'An account already exists for this email.');
    }
    const credential = await createPasswordCredential(password, context.env);
    const userId = randomUuid();
    const nowIso = new Date().toISOString();
    const values = {
      id: key, userScope: userId, operation: 'account.create', payloadHash: digest,
      accepted: 1, result: { user_id: userId }, nowIso,
    };
    await context.env.APP_DB.batch([
      context.env.APP_DB.prepare(`INSERT INTO app_identities (
        id, email_normalized, email_original, source_provider, status,
        password_scheme, password_salt, password_hash, password_iterations,
        consent_at, claimed_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'cloudflare', 'active', ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(userId, email, String(parsed.body.email).trim(), credential.scheme, credential.salt,
        credential.hash, credential.iterations, nowIso, nowIso, nowIso, nowIso),
      context.env.APP_DB.prepare(`INSERT INTO app_profiles
        (user_id, shells, player_level, xp, version, created_at, updated_at)
        VALUES (?, 0, 1, 0, 0, ?, ?)`).bind(userId, nowIso, nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'account', aggregateId: userId,
        eventType: 'account.created', payload: { source: 'cloudflare' }, nowIso,
      }),
      receiptStatement(context.env.APP_DB, values),
    ]);
    const identity = { id: userId, email_original: String(parsed.body.email).trim(), source_provider: 'cloudflare' };
    const session = await issueSession(context.env.APP_DB, identity, request);
    return authJson(request, 201, {
      ok: true, user: session.user, csrf_token: session.csrf, expires_at: session.expiresAt,
      receipt: receiptShape({ receipt_id: key, operation: values.operation, accepted: 1, result_json: JSON.stringify(values.result) }, false),
    }, session.cookies);
  } catch (error) {
    if (/unique/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'account_exists', 'An account already exists for this email.');
    }
    return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  }
}
