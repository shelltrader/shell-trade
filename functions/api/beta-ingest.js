import {
  MAX_BODY_BYTES,
  corsHeaders,
  enforceRateLimit,
  jsonResponse,
  originAllowed,
  validateIngestBody,
  writeIngestRows,
} from '../_lib/beta.js';

function response(status, body, origin, extraHeaders) {
  return jsonResponse(status, body, Object.assign(corsHeaders(origin), extraHeaders || {}));
}

export async function onRequest(context) {
  const request = context.request;
  const origin = request.headers.get('Origin') || '';

  if (request.method === 'OPTIONS') {
    if (!originAllowed(origin)) return response(403, { error: 'Forbidden origin' }, origin);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return response(405, { error: 'Method not allowed' }, origin, { Allow: 'POST, OPTIONS' });
  }
  if (!originAllowed(origin)) return response(403, { error: 'Forbidden origin' }, origin);
  if (!context.env || !context.env.BETA_DB) {
    return response(503, { error: 'Beta data service unavailable' }, origin);
  }

  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return response(413, { error: 'Request too large' }, origin);
  }

  let rawBody;
  try { rawBody = await request.text(); }
  catch (_) { return response(400, { error: 'Bad JSON' }, origin); }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return response(413, { error: 'Request too large' }, origin);
  }

  let body;
  try { body = JSON.parse(rawBody); }
  catch (_) { return response(400, { error: 'Bad JSON' }, origin); }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const checked = validateIngestBody(body, nowIso);
  if (checked.error) return response(checked.error.status, { error: checked.error.message }, origin);

  try {
    const rate = await enforceRateLimit(context.env.BETA_DB, request, nowMs, context.env);
    if (!rate.allowed) {
      return response(429, { error: 'Rate limited' }, origin, { 'Retry-After': String(rate.retryAfter) });
    }
    const receipt = await writeIngestRows(
      context.env.BETA_DB, checked.kind, checked.rows, nowIso,
    );
    return response(200, Object.assign({ ok: true }, receipt), origin);
  } catch (_) {
    // No database or SQL detail is exposed to the public write route.
    return response(503, { error: 'Beta data service unavailable' }, origin);
  }
}
