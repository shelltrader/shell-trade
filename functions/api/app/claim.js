import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  readAppJson,
  requestIdempotencyKey,
  sha256Hex,
} from '../../_lib/app.js';
import {
  authError,
  authJson,
  createPasswordCredential,
  issueSession,
  normalizeEmail,
  passwordRequestFingerprint,
  validPassword,
} from '../../_lib/app_auth.js';
import { findReceipt, outboxStatement, receiptShape, receiptStatement } from '../../_lib/app_data.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const unsafe = mutationGuard(request);
  if (unsafe) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  const parsed = await readAppJson(request, 20 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_request', 'Claim request is invalid.');
  const email = normalizeEmail(parsed.body.email);
  const claimToken = typeof parsed.body.claim_token === 'string' ? parsed.body.claim_token : '';
  const password = parsed.body.password;
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!email || claimToken.length < 16 || claimToken.length > 256 || !validPassword(password)) {
    return authError(request, 400, 'invalid_claim', 'Claim details are invalid or expired.');
  }
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'claim', 8, 300);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many attempts. Try again shortly.');
    const claimHash = await sha256Hex(claimToken);
    const passwordFingerprint = await passwordRequestFingerprint(email, password, context.env);
    const digest = await payloadDigest({ email, claim_fingerprint: claimHash, password_fingerprint: passwordFingerprint });
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.operation !== 'account.claim' || prior.payload_hash !== digest) {
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
    const nowIso = new Date().toISOString();
    const claim = await context.env.APP_DB.prepare(`
      SELECT c.claim_id, c.user_id, i.email_original, i.source_provider, i.status
      FROM app_account_claims c JOIN app_identities i ON i.id = c.user_id
      WHERE i.email_normalized = ? AND c.claim_token_hash = ? AND c.claimed_at IS NULL
        AND c.expires_at > ? AND c.attempts < 20 AND i.status = 'pending_claim'
      LIMIT 1
    `).bind(email, claimHash, nowIso).first();
    if (!claim) {
      await context.env.APP_DB.prepare(`UPDATE app_account_claims SET attempts = attempts + 1
        WHERE user_id IN (SELECT id FROM app_identities WHERE email_normalized = ?)
          AND claimed_at IS NULL AND attempts < 20`).bind(email).run();
      return authError(request, 400, 'invalid_claim', 'Claim details are invalid or expired.');
    }
    const credential = await createPasswordCredential(password, context.env);
    const values = {
      id: key, userScope: claim.user_id, operation: 'account.claim', payloadHash: digest,
      accepted: 1, result: { user_id: claim.user_id }, nowIso,
    };
    await context.env.APP_DB.batch([
      context.env.APP_DB.prepare(`INSERT INTO app_account_claim_redemptions
        (claim_id, user_id, request_id, created_at) VALUES (?, ?, ?, ?)`
      ).bind(claim.claim_id, claim.user_id, key, nowIso),
      context.env.APP_DB.prepare(`UPDATE app_identities SET
        status = 'active', password_scheme = ?, password_salt = ?, password_hash = ?,
        password_iterations = ?, claimed_at = ?, updated_at = ?
        WHERE id = ? AND status = 'pending_claim'`
      ).bind(credential.scheme, credential.salt, credential.hash, credential.iterations,
        nowIso, nowIso, claim.user_id),
      context.env.APP_DB.prepare(`UPDATE app_account_claims SET claimed_at = ?
        WHERE claim_id = ? AND claimed_at IS NULL`).bind(nowIso, claim.claim_id),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'account', aggregateId: claim.user_id,
        eventType: 'account.claimed', payload: { source: 'supabase' }, nowIso,
      }),
      receiptStatement(context.env.APP_DB, values),
    ]);
    const identity = { id: claim.user_id, email_original: claim.email_original, source_provider: claim.source_provider };
    const session = await issueSession(context.env.APP_DB, identity, request);
    return authJson(request, 200, {
      ok: true, user: session.user, csrf_token: session.csrf, expires_at: session.expiresAt,
      receipt: receiptShape({ receipt_id: key, operation: values.operation, accepted: 1, result_json: JSON.stringify(values.result) }, false),
    }, session.cookies);
  } catch (error) {
    if (/unique|claim_redemptions/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'claim_already_used', 'This account claim has already been used.');
    }
    return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  }
}
