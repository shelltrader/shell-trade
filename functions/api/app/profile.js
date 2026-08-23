import { optionsResponse, payloadDigest, readAppJson, requestIdempotencyKey } from '../../_lib/app.js';
import { authError, authJson, requireAuthenticatedMutation, requireSession } from '../../_lib/app_auth.js';
import {
  findReceipt,
  outboxStatement,
  pristineProfile,
  receiptShape,
  shapeExpectedVersion,
  shapeProfile,
  validateProfileDelta,
  writeWithReceipt,
} from '../../_lib/app_data.js';

async function readProfile(context) {
  const auth = await requireSession(context.request, context.env);
  if (auth.error) return auth.error;
  try {
    const row = await context.env.APP_DB.prepare(`SELECT shells, player_level, xp, version, source_updated_at,
      initial_sync_receipt_id, updated_at
      FROM app_profiles WHERE user_id = ?`).bind(auth.session.user_id).first();
    return authJson(context.request, 200, { ok: true, profile: row ? {
      shells: row.shells, player_level: row.player_level, xp: row.xp,
      version: row.version, updated_at: row.updated_at, bootstrap_available: pristineProfile(row),
    } : {
      shells: 0, player_level: 1, xp: 0, version: 0, updated_at: null, bootstrap_available: true,
    } });
  } catch (_) { return authError(context.request, 503, 'app_unavailable', 'Progress service is unavailable.'); }
}

async function writeProfile(context) {
  const request = context.request;
  const auth = await requireAuthenticatedMutation(request, context.env);
  if (auth.error) return auth.error;
  const parsed = await readAppJson(request, 32 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_profile', 'Progress data is invalid.');
  const profile = shapeProfile(parsed.body);
  const expectedVersion = shapeExpectedVersion(parsed.body);
  const bootstrap = parsed.body.bootstrap === true;
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!profile || expectedVersion == null ||
      (parsed.body.bootstrap != null && typeof parsed.body.bootstrap !== 'boolean')) {
    return authError(request, 400, 'invalid_profile', 'Progress data and expected version are required.');
  }
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  const operation = bootstrap ? 'profile.bootstrap' : 'profile.put';
  const digest = await payloadDigest({ profile, expected_version: expectedVersion, bootstrap });
  const userId = auth.session.user_id;
  try {
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.user_scope !== userId || prior.operation !== operation || prior.payload_hash !== digest) {
        return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
      }
      return authJson(request, 200, { ok: true, receipt: receiptShape(prior, true) });
    }
    const current = await context.env.APP_DB.prepare(`SELECT shells, player_level, xp, version,
      source_updated_at, initial_sync_receipt_id
      FROM app_profiles WHERE user_id = ?`).bind(userId).first();
    const baseline = current || { shells: 0, player_level: 1, xp: 0, version: 0 };
    if (Number(baseline.version) !== expectedVersion) {
      return authError(request, 409, 'profile_version_conflict', 'Progress changed on another device. Please reload.');
    }
    if (bootstrap && (expectedVersion !== 0 || !pristineProfile(current))) {
      return authError(request, 409, 'profile_bootstrap_unavailable', 'Initial progress was already synchronized.');
    }
    if (!bootstrap && !validateProfileDelta(baseline, profile)) {
      return authError(request, 409, 'progress_delta_rejected', 'Progress changed too quickly. Please reload and try again.');
    }
    const version = expectedVersion + 1;
    const nowIso = new Date().toISOString();
    const values = {
      id: key, userScope: userId, operation, payloadHash: digest,
      accepted: 1, result: { version }, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      context.env.APP_DB.prepare(`INSERT INTO app_profiles
        (user_id, shells, player_level, xp, version, initial_sync_completed_at,
         initial_sync_receipt_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET shells = excluded.shells,
          player_level = excluded.player_level, xp = excluded.xp,
          version = excluded.version,
          initial_sync_completed_at = COALESCE(excluded.initial_sync_completed_at, app_profiles.initial_sync_completed_at),
          initial_sync_receipt_id = COALESCE(excluded.initial_sync_receipt_id, app_profiles.initial_sync_receipt_id),
          updated_at = excluded.updated_at`
      ).bind(userId, profile.shells, profile.player_level, profile.xp, version,
        bootstrap ? nowIso : null, bootstrap ? key : null, nowIso, nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'profile', aggregateId: userId,
        eventType: bootstrap ? 'profile.bootstrapped' : 'profile.updated', payload: { version }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (error) {
    if (/profile_bootstrap_conflict/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'profile_bootstrap_unavailable', 'Initial progress was already synchronized.');
    }
    if (/profile_version_conflict/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'profile_version_conflict', 'Progress changed on another device. Please reload.');
    }
    return authError(request, 503, 'app_unavailable', 'Progress service is unavailable.');
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return optionsResponse(context.request, 'GET, PUT, OPTIONS');
  if (context.request.method === 'GET') return readProfile(context);
  if (context.request.method === 'PUT') return writeProfile(context);
  return authError(context.request, 405, 'method_not_allowed', 'Method not allowed.');
}
