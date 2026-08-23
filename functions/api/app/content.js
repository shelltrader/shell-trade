import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  readAppJson,
  validIdempotencyKey,
} from '../../_lib/app.js';
import { authError, authJson } from '../../_lib/app_auth.js';
import {
  contentLogicalKeyStatement,
  contentPreflight,
  contentStatements,
  outboxStatement,
  shapeContentBatch,
  writeWithReceipt,
} from '../../_lib/app_data.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const unsafe = mutationGuard(request);
  if (unsafe) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Content service is unavailable.');
  const parsed = await readAppJson(request);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_content_batch', 'Content batch is invalid.');
  const nowIso = new Date().toISOString();
  const shaped = shapeContentBatch(parsed.body);
  if (!shaped) return authError(request, 400, 'invalid_content_batch', 'Content batch is invalid.');
  if (!validIdempotencyKey(shaped.batch_id)) {
    return authError(request, 400, 'idempotency_required', 'A valid batch ID is required.');
  }
  if (request.headers.get('X-Idempotency-Key') && request.headers.get('X-Idempotency-Key') !== shaped.batch_id) {
    return authError(request, 400, 'idempotency_mismatch', 'Batch IDs do not match.');
  }
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'content', 120, 60);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many requests. Try again shortly.');
    const digest = await payloadDigest({ table: shaped.table, rows: shaped.rows });
    const operation = `content.${shaped.table}`;
    const preflight = await contentPreflight(context.env.APP_DB, shaped);
    if (preflight.conflict) {
      return authError(request, 409, 'content_key_conflict', 'A content key already exists with different data.');
    }
    const values = {
      id: shaped.batch_id, userScope: 'public:content', operation, payloadHash: digest,
      accepted: shaped.rows.length, result: {}, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      contentLogicalKeyStatement(context.env.APP_DB, shaped, preflight.entries, nowIso),
      ...contentStatements(context.env.APP_DB, shaped, nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: shaped.batch_id, aggregateType: 'content_batch', aggregateId: shaped.batch_id,
        eventType: 'content.batch_ingested',
        payload: { table: shaped.table, accepted: shaped.rows.length }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Batch ID was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (error) {
    if (/content_key_conflict/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'content_key_conflict', 'A content key already exists with different data.');
    }
    return authError(request, 503, 'app_unavailable', 'Content service is unavailable.');
  }
}
