import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  readAppJson,
  requestIdempotencyKey,
} from '../../_lib/app.js';
import { authError, authJson } from '../../_lib/app_auth.js';
import { outboxStatement, shapeBug, writeWithReceipt } from '../../_lib/app_data.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const unsafe = mutationGuard(request);
  if (unsafe) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Feedback service is unavailable.');
  const parsed = await readAppJson(request, 32 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_bug_report', 'Feedback is invalid.');
  const bug = shapeBug(parsed.body);
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!bug) return authError(request, 400, 'invalid_bug_report', 'Feedback is invalid.');
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid request ID is required.');
  if (request.headers.get('X-Idempotency-Key') && request.headers.get('X-Idempotency-Key') !== parsed.body.request_id) {
    return authError(request, 400, 'idempotency_mismatch', 'Request IDs do not match.');
  }
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'bug', 10, 300);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many reports. Try again shortly.');
    const nowIso = new Date().toISOString();
    const digest = await payloadDigest(bug);
    const values = {
      id: key, userScope: `public:${bug.player_id || 'guest'}`, operation: 'bug.create',
      payloadHash: digest, accepted: 1, result: {}, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      context.env.APP_DB.prepare(`INSERT INTO app_bug_reports
        (request_id, user_id, player_id, message, context, status, ingest_source, created_at)
        VALUES (?, NULL, ?, ?, ?, 'open', 'cloudflare', ?)
        ON CONFLICT(request_id) DO NOTHING`
      ).bind(key, bug.player_id, bug.message, JSON.stringify(bug.context), nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'bug_report', aggregateId: key,
        eventType: 'bug_report.created', payload: { player_id: bug.player_id }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Request ID was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (_) { return authError(request, 503, 'app_unavailable', 'Feedback service is unavailable.'); }
}
