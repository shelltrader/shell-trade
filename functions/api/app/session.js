import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  readAppJson,
  requestIdempotencyKey,
} from '../../_lib/app.js';
import {
  authError,
  authJson,
  authenticatePassword,
  clearSessionCookies,
  findIdentityByEmail,
  issueSession,
  normalizeEmail,
  requireAuthenticatedMutation,
  requireSession,
} from '../../_lib/app_auth.js';
import { findReceipt, outboxStatement, receiptShape, writeWithReceipt } from '../../_lib/app_data.js';

async function getSession(context) {
  const checked = await requireSession(context.request, context.env);
  if (checked.error) {
    if (checked.error.status === 401) {
      return authJson(context.request, 200, { ok: true, user: null }, clearSessionCookies());
    }
    return checked.error;
  }
  return authJson(context.request, 200, {
    ok: true,
    user: checked.session.user,
    csrf_token: checked.session.csrfValid ? checked.session.csrf : null,
    expires_at: checked.session.expires_at,
  });
}

async function signIn(context) {
  const request = context.request;
  const guarded = mutationGuard(request);
  if (guarded) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  const parsed = await readAppJson(request, 16 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_request', 'Sign-in request is invalid.');
  const email = normalizeEmail(parsed.body.email);
  const password = parsed.body.password;
  if (!email || typeof password !== 'string') {
    return authError(request, 400, 'invalid_credentials', 'Email or password is incorrect.');
  }
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'login', 10, 300);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many attempts. Try again shortly.');
    const identity = await findIdentityByEmail(context.env.APP_DB, email);
    const accepted = await authenticatePassword(password, identity, context.env);
    if (!accepted) return authError(request, 401, 'invalid_credentials', 'Email or password is incorrect.');
    const session = await issueSession(context.env.APP_DB, identity, request);
    return authJson(request, 200, {
      ok: true, user: session.user, csrf_token: session.csrf, expires_at: session.expiresAt,
    }, session.cookies);
  } catch (_) {
    return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  }
}

async function signOut(context) {
  const request = context.request;
  const auth = await requireAuthenticatedMutation(request, context.env, { allowRevoked: true });
  if (auth.error) return auth.error;
  const key = requestIdempotencyKey(request, null, null);
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  const nowIso = new Date().toISOString();
  const digest = await payloadDigest({ operation: 'session.signout' });
  try {
    if (auth.session.revoked_at) {
      const prior = await findReceipt(context.env.APP_DB, key);
      if (!prior || prior.user_scope !== auth.session.user_id ||
          prior.operation !== 'session.signout' || prior.payload_hash !== digest) {
        return authError(request, 401, 'authentication_required', 'Please sign in.', clearSessionCookies());
      }
      return authJson(request, 200, { ok: true, receipt: receiptShape(prior, true) }, clearSessionCookies());
    }
    const values = {
      id: key, userScope: auth.session.user_id, operation: 'session.signout',
      payloadHash: digest, accepted: 1, result: {}, nowIso,
    };
    const statements = [
      context.env.APP_DB.prepare(`UPDATE app_sessions SET revoked_at = ?
        WHERE session_hash = ? AND revoked_at IS NULL`).bind(nowIso, auth.session.session_hash),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'session', aggregateId: auth.session.user_id,
        eventType: 'session.signed_out', payload: {}, nowIso,
      }),
    ];
    const result = await writeWithReceipt(context.env.APP_DB, values, statements);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt }, clearSessionCookies());
  } catch (_) {
    return authError(request, 503, 'app_unavailable', 'Account service is unavailable.');
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return optionsResponse(context.request, 'GET, POST, DELETE, OPTIONS');
  if (context.request.method === 'GET') return getSession(context);
  if (context.request.method === 'POST') return signIn(context);
  if (context.request.method === 'DELETE') return signOut(context);
  return authError(context.request, 405, 'method_not_allowed', 'Method not allowed.');
}
