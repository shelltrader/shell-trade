import { optionsResponse, payloadDigest, readAppJson, requestIdempotencyKey } from '../../_lib/app.js';
import { authError, authJson, requireAuthenticatedMutation, requireSession } from '../../_lib/app_auth.js';
import {
  findReceipt,
  journalRead,
  journalStatements,
  outboxStatement,
  receiptShape,
  shapeJournalSnapshot,
  writeWithReceipt,
} from '../../_lib/app_data.js';

async function readJournal(context) {
  const auth = await requireSession(context.request, context.env);
  if (auth.error) return auth.error;
  try {
    const url = new URL(context.request.url);
    const journal = await journalRead(context.env.APP_DB, auth.session.user_id, {
      tradeCursor: url.searchParams.get('trade_cursor') ?? 0,
      noteCursor: url.searchParams.get('note_cursor') ?? 0,
      limit: url.searchParams.get('limit') ?? 100,
      expectedVersion: url.searchParams.has('version') ? url.searchParams.get('version') : null,
    });
    if (journal.invalid) return authError(context.request, 400, 'invalid_journal_page', 'Journal page is invalid.');
    if (journal.conflict) {
      return authJson(context.request, 409, {
        error: 'journal_version_conflict', message: 'Journal changed while it was loading. Please retry.',
        current_version: journal.version,
      });
    }
    return authJson(context.request, 200, {
      ok: true, journal,
    });
  } catch (_) { return authError(context.request, 503, 'app_unavailable', 'Journal service is unavailable.'); }
}

async function writeJournal(context) {
  const request = context.request;
  const auth = await requireAuthenticatedMutation(request, context.env);
  if (auth.error) return auth.error;
  const parsed = await readAppJson(request);
  if (parsed.error) return authError(request, parsed.error.status, 'invalid_journal', 'Journal snapshot is invalid.');
  const snapshot = shapeJournalSnapshot(parsed.body);
  const key = requestIdempotencyKey(request, parsed.body, 'request_id');
  if (!snapshot) return authError(request, 400, 'invalid_journal', 'Journal snapshot is invalid.');
  if (!key) return authError(request, 400, 'idempotency_required', 'A valid idempotency key is required.');
  const digest = await payloadDigest(snapshot);
  const userId = auth.session.user_id;
  try {
    const prior = await findReceipt(context.env.APP_DB, key);
    if (prior) {
      if (prior.user_scope !== userId || prior.operation !== 'journal.put' || prior.payload_hash !== digest) {
        return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
      }
      return authJson(request, 200, { ok: true, receipt: receiptShape(prior, true) });
    }
    const nowIso = new Date().toISOString();
    const journal = await journalStatements(context.env.APP_DB, userId, key, digest, snapshot, nowIso);
    const accepted = snapshot.trades.length + snapshot.notes.length +
      snapshot.delete_trade_ids.length + snapshot.delete_note_ids.length;
    const values = {
      id: key, userScope: userId, operation: 'journal.put', payloadHash: digest,
      accepted, result: { version: journal.version, tombstoned: journal.tombstoned }, nowIso,
    };
    const result = await writeWithReceipt(context.env.APP_DB, values, [
      ...journal.statements,
      outboxStatement(context.env.APP_DB, {
        receiptId: key, aggregateType: 'journal', aggregateId: userId,
        eventType: 'journal.changes_saved',
        payload: { version: journal.version, accepted, tombstoned: journal.tombstoned }, nowIso,
      }),
    ]);
    if (result.conflict) return authError(request, 409, 'idempotency_conflict', 'Idempotency key was already used.');
    return authJson(request, 200, { ok: true, receipt: result.receipt });
  } catch (error) {
    if (/journal_version_conflict/i.test(String(error?.message || ''))) {
      return authError(request, 409, 'journal_version_conflict', 'Journal changed on another device. Please reload.');
    }
    return authError(request, 503, 'app_unavailable', 'Journal service is unavailable.');
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return optionsResponse(context.request, 'GET, PUT, OPTIONS');
  if (context.request.method === 'GET') return readJournal(context);
  if (context.request.method === 'PUT') return writeJournal(context);
  return authError(context.request, 405, 'method_not_allowed', 'Method not allowed.');
}
