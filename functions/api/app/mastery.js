import { optionsResponse, payloadDigest, readAppJson, requestIdempotencyKey } from '../../_lib/app.js';
import { authError, authJson, requireAuthenticatedMutation, requireSession } from '../../_lib/app_auth.js';
import { findReceipt, masteryStatements, outboxStatement, receiptShape, shapeMastery, writeWithReceipt } from '../../_lib/app_data.js';

async function readMastery(context) {
  const auth = await requireSession(context.request, context.env);
  if (auth.error) return auth.error;
  try {
    const result = await context.env.APP_DB.prepare(`SELECT category_raw AS category,
      category_normalized, score, updated_at FROM app_mastery
      WHERE user_id = ? ORDER BY category_normalized, category_raw`).bind(auth.session.user_id).all();
    return authJson(context.request, 200, { ok: true, mastery: { rows: result?.results || [] } });
  } catch (_) { return authError(context.request, 503, 'app_unavailable', 'Mastery service is unavailable.'); }
}

async function writeMastery(context) {
  const request = context.request;
  const auth = await requireAuthenticatedMutation(request, context.env);
  if (auth.error) return auth.error;
  const parsed = await readAppJson(request, 64 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_mastery', 'Mastery data is invalid.');
  const shaped = shapeMastery(parsed.body);
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!shaped) return authError(request, 400, 'invalid_mastery', 'Mastery data is invalid.');
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  const digest = await payloadDigest({ rows: shaped.rows });
  const userId = auth.session.user_id;
  try {
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.user_scope !== userId || prior.operation !== 'mastery.put' || prior.payload_hash !== digest) {
        return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
      }
      return authJson(request, 200, { ok: true, receipt: receiptShape(prior, true) });
    }
    const nowIso = new Date().toISOString();
    const values = {
      id: key, userScope: userId, operation: 'mastery.put', payloadHash: digest,
      accepted: shaped.rows.length, result: { quarantined: shaped.quarantined.length }, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      ...masteryStatements(context.env.APP_DB, userId, shaped, key, nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'mastery', aggregateId: userId,
        eventType: 'mastery.updated',
        payload: { accepted: shaped.rows.length, quarantined: shaped.quarantined.length }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (_) { return authError(request, 503, 'app_unavailable', 'Mastery service is unavailable.'); }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return optionsResponse(context.request, 'GET, PUT, OPTIONS');
  if (context.request.method === 'GET') return readMastery(context);
  if (context.request.method === 'PUT') return writeMastery(context);
  return authError(context.request, 405, 'method_not_allowed', 'Method not allowed.');
}
