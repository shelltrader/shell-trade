import { optionsResponse, payloadDigest, readAppJson, requestIdempotencyKey } from '../../_lib/app.js';
import { authError, authJson, requireAuthenticatedMutation, requireSession } from '../../_lib/app_auth.js';
import {
  findReceipt,
  outboxStatement,
  receiptShape,
  shapeExpectedVersion,
  shapeStreak,
  validateStreakTransition,
  writeWithReceipt,
} from '../../_lib/app_data.js';

async function readStreak(context) {
  const auth = await requireSession(context.request, context.env);
  if (auth.error) return auth.error;
  try {
    const row = await context.env.APP_DB.prepare(`SELECT streak, best_streak, last_drill_date, version, updated_at
      FROM app_daily_streak WHERE user_id = ?`).bind(auth.session.user_id).first();
    return authJson(context.request, 200, { ok: true, streak: row || {
      streak: 0, best_streak: 0, last_drill_date: null, version: 0, updated_at: null,
    } });
  } catch (_) { return authError(context.request, 503, 'app_unavailable', 'Streak service is unavailable.'); }
}

async function writeStreak(context) {
  const request = context.request;
  const auth = await requireAuthenticatedMutation(request, context.env);
  if (auth.error) return auth.error;
  const parsed = await readAppJson(request, 32 * 1024);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_streak', 'Streak data is invalid.');
  const streak = shapeStreak(parsed.body);
  const expectedVersion = shapeExpectedVersion(parsed.body);
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!streak || expectedVersion == null) {
    return authError(request, 400, 'invalid_streak', 'Streak data and expected version are required.');
  }
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  const digest = await payloadDigest({ streak, expected_version: expectedVersion });
  const userId = auth.session.user_id;
  try {
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.user_scope !== userId || prior.operation !== 'streak.put' || prior.payload_hash !== digest) {
        return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
      }
      return authJson(request, 200, { ok: true, receipt: receiptShape(prior, true) });
    }
    const current = await context.env.APP_DB.prepare(`SELECT streak, best_streak, last_drill_date, version
      FROM app_daily_streak WHERE user_id = ?`)
      .bind(userId).first();
    const baseline = current || { streak: 0, best_streak: 0, last_drill_date: null, version: 0 };
    if (Number(baseline.version) !== expectedVersion) {
      return authError(request, 409, 'streak_version_conflict', 'Streak changed on another device. Please reload.');
    }
    if (!validateStreakTransition(baseline, streak)) {
      return authError(request, 409, 'streak_regression_rejected', 'Streak data would overwrite newer progress. Please reload.');
    }
    const version = expectedVersion + 1;
    const nowIso = new Date().toISOString();
    const values = {
      id: key, userScope: userId, operation: 'streak.put', payloadHash: digest,
      accepted: 1, result: { version }, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      context.env.APP_DB.prepare(`INSERT INTO app_daily_streak
        (user_id, streak, best_streak, last_drill_date, version, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET streak = excluded.streak,
          best_streak = excluded.best_streak, last_drill_date = excluded.last_drill_date,
          version = excluded.version, updated_at = excluded.updated_at`
      ).bind(userId, streak.streak, streak.best_streak, streak.last_drill_date, version, nowIso),
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'streak', aggregateId: userId,
        eventType: 'streak.updated', payload: { version }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (error) {
    if (/streak_version_conflict/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'streak_version_conflict', 'Streak changed on another device. Please reload.');
    }
    return authError(request, 503, 'app_unavailable', 'Streak service is unavailable.');
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return optionsResponse(context.request, 'GET, PUT, OPTIONS');
  if (context.request.method === 'GET') return readStreak(context);
  if (context.request.method === 'PUT') return writeStreak(context);
  return authError(context.request, 405, 'method_not_allowed', 'Method not allowed.');
}
