import {
  enforceAppRateLimit,
  mutationGuard,
  optionsResponse,
  payloadDigest,
  readAppJson,
  requestIdempotencyKey,
} from '../../_lib/app.js';
import { authError, authJson } from '../../_lib/app_auth.js';
import { shapeVisit, writeWithReceipt } from '../../_lib/app_data.js';

export async function onRequest(context) {
  const request = context.request;
  if (request.method === 'OPTIONS') return optionsResponse(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return authError(request, 405, 'method_not_allowed', 'Method not allowed.');
  const unsafe = mutationGuard(request);
  if (unsafe) return authError(request, 403, 'request_rejected', 'Request security checks failed.');
  if (!context.env?.APP_DB) return authError(request, 503, 'app_unavailable', 'Visit service is unavailable.');
  const parsed = await readAppJson(request, 16 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_visit', 'Visit data is invalid.');
  const visit = shapeVisit(parsed.body, request);
  const key = requestIdempotencyKey(request, parsed.body, 'visit_id');
  if (!visit) return authError(request, 400, 'invalid_visit', 'Visit data is invalid.');
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid visit ID is required.');
  if (request.headers.get('X-Idempotency-Key') && request.headers.get('X-Idempotency-Key') !== parsed.body.visit_id) {
    return authError(request, 400, 'idempotency_mismatch', 'Visit IDs do not match.');
  }
  try {
    const rate = await enforceAppRateLimit(context.env.APP_DB, request, context.env, 'visit', 60, 60);
    if (!rate.allowed) return authError(request, 429, 'rate_limited', 'Too many requests. Try again shortly.');
    const nowIso = new Date().toISOString();
    // Country is Cloudflare-derived enrichment and can change across a retry/VPN hop. Bind the
    // receipt only to client-controlled canonical fields so same-key + same-body always replays.
    const digest = await payloadDigest({
      player_id: visit.player_id, path: visit.path, referrer_host: visit.referrer_host,
      build: visit.build, device: visit.device,
    });
    const values = {
      id: key, userScope: `public:${visit.player_id || 'guest'}`, operation: 'visit.create',
      payloadHash: digest, accepted: 1, result: {}, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      context.env.APP_DB.prepare(`INSERT INTO app_site_visits
        (visit_id, player_id, path, referrer_host, build, device, country, ingest_source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'cloudflare', ?)
        ON CONFLICT(visit_id) DO NOTHING`
      ).bind(key, visit.player_id, visit.path, visit.referrer_host, visit.build, visit.device, visit.country, nowIso),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Visit ID was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (_) { return authError(request, 503, 'app_unavailable', 'Visit service is unavailable.'); }
}
