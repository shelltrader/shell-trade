import {
  appHeaders,
  appJson,
  enforceAppRateLimit,
  hmacSha256Hex,
  mutationGuard,
  payloadDigest,
  randomUuid,
  readAppJson,
  requestIdempotencyKey,
  rowsToCsv,
  sha256Hex,
} from '../../_lib/app.js';
import {
  APP_DATASETS,
  findReceipt,
  normalizeAppRows,
  outboxStatement,
  receiptShape,
  writeWithReceipt,
} from '../../_lib/app_data.js';
import { forbiddenResponse } from '../../_lib/access.js';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;
const MAX_EXPORT_ROWS = 100000;
const MAX_SNAPSHOT_ROWS_PER_DATASET = 20000;
const MAX_SNAPSHOT_ROWS_TOTAL = 50000;
const SNAPSHOT_VERSION = 1;

// Closed, deterministic order for every dataset exposed by APP_DATASETS. Page cursors are
// positions in a content-addressed snapshot, never mutable SQL offsets. Mastery uses its
// physical owner_key + category_raw order here; analysis uses owner_key + category_normalized.
const DATASET_ORDER = Object.freeze({
  identities: ['id'], profiles: ['user_id'], journal_versions: ['id'],
  journal_trades: ['user_id', 'trade_id'], journal_notes: ['user_id', 'note_id'],
  journal_changes: ['id'], streaks: ['user_id'], mastery: ['owner_key', 'category_raw'],
  mastery_quarantine: ['id'], bugs: ['id'], visits: ['id'], visit_days: ['visit_date', 'path'],
  content_events: ['id'], content_replays: ['id'], content_briefs: ['id'], content_assets: ['id'],
  content_generated: ['id'], content_exports: ['id'], published_posts: ['id'], performance: ['id'],
  outbox: ['outbox_id'], migration_runs: ['run_id'], migration_ledger: ['id'],
  migration_quarantine: ['id'], reconciliation: ['id'],
});

const SNAPSHOT_TOKEN_RE = /^[a-f0-9]{64}$/;

function integer(value, fallback) {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function parseRequest(url) {
  const datasetName = url.searchParams.get('dataset') || 'summary';
  const dataset = APP_DATASETS[datasetName];
  const special = datasetName === 'summary' || datasetName === 'snapshot';
  if (!special && !dataset) return { error: 'Unknown dataset' };
  const mode = (url.searchParams.get('mode') || 'page').toLowerCase();
  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  const cursor = integer(url.searchParams.get('cursor'), 0);
  const limit = integer(url.searchParams.get('limit'), DEFAULT_LIMIT);
  const snapshotToken = url.searchParams.get('snapshot_token');
  if (!['page', 'export'].includes(mode)) return { error: 'mode must be page or export' };
  if (!['json', 'csv'].includes(format)) return { error: 'format must be json or csv' };
  if (cursor == null) return { error: 'cursor must be a non-negative integer' };
  if (limit == null || limit < 1 || limit > MAX_LIMIT) return { error: `limit must be between 1 and ${MAX_LIMIT}` };
  if (datasetName === 'summary' && (mode !== 'page' || format !== 'json')) return { error: 'summary supports JSON page mode only' };
  if (datasetName === 'snapshot' && (mode !== 'page' || format !== 'json' || cursor !== 0 || snapshotToken)) {
    return { error: 'snapshot supports JSON page mode without cursor or token only' };
  }
  if (snapshotToken != null && !SNAPSHOT_TOKEN_RE.test(snapshotToken)) return { error: 'snapshot_token must be a SHA-256 digest' };
  if (mode === 'page' && cursor > 0 && !snapshotToken) return { error: 'continued pages require snapshot_token' };
  if (mode === 'export' && (cursor !== 0 || snapshotToken)) return { error: 'export mode does not accept a cursor or snapshot token' };
  return { datasetName, dataset, mode, format, cursor, limit, snapshotToken };
}

function datasetStatement(db, name, dataset, limit) {
  const order = DATASET_ORDER[name];
  if (!order || order.some((column) => !dataset.columns.includes(column))) throw new Error('Dataset order is not configured');
  return db.prepare(`SELECT ${dataset.columns.join(', ')} FROM ${dataset.table} ORDER BY ${order.join(', ')} LIMIT ?`)
    .bind(limit);
}

async function querySnapshotRows(db, name, dataset, maxRows) {
  // One ordered SELECT is one coherent SQLite snapshot. It never advances through mutable
  // OFFSET windows; the extra row is a hard fail-closed size guard.
  const result = await datasetStatement(db, name, dataset, maxRows + 1).all();
  return normalizeAppRows(dataset, result?.results);
}

async function datasetDigest(name, rows) {
  return payloadDigest({ snapshot_version: SNAPSHOT_VERSION, dataset: name, rows });
}

async function page(db, parsed) {
  const frozen = await querySnapshotRows(db, parsed.datasetName, parsed.dataset, MAX_EXPORT_ROWS);
  if (frozen.length > MAX_EXPORT_ROWS) {
    const error = new Error('Dataset is too large for a coherent founder snapshot');
    error.status = 413;
    throw error;
  }
  const snapshotToken = await datasetDigest(parsed.datasetName, frozen);
  if (parsed.snapshotToken && parsed.snapshotToken !== snapshotToken) {
    const error = new Error('Dataset changed during pagination; restart from the first page');
    error.status = 409;
    error.code = 'snapshot_changed';
    throw error;
  }
  if (parsed.cursor > frozen.length) {
    const error = new Error('Cursor is outside this dataset snapshot');
    error.status = 400;
    error.code = 'invalid_cursor';
    throw error;
  }
  const rows = frozen.slice(parsed.cursor, parsed.cursor + parsed.limit);
  const nextCursor = parsed.cursor + rows.length;
  const hasMore = nextCursor < frozen.length;
  return { rows, hasMore, nextCursor: hasMore ? nextCursor : null, snapshotToken, snapshotCount: frozen.length };
}

async function allRows(db, name, dataset) {
  const rows = await querySnapshotRows(db, name, dataset, MAX_EXPORT_ROWS);
  if (rows.length > MAX_EXPORT_ROWS) {
    const error = new Error('Export too large for one coherent snapshot');
    error.status = 413;
    throw error;
  }
  return rows;
}

async function summary(db) {
  const names = Object.keys(APP_DATASETS);
  const statements = names.map((name) => db.prepare(`SELECT COUNT(*) AS row_count FROM ${APP_DATASETS[name].table}`));
  const results = await db.batch(statements);
  const counts = {};
  for (let index = 0; index < names.length; index += 1) {
    const result = results[index];
    const row = result?.results?.[0] || result;
    counts[names[index]] = Number(row?.row_count || 0);
  }
  return { datasets: names, counts };
}

async function completeSnapshot(db) {
  const names = Object.keys(APP_DATASETS);
  const statements = names.map((name) => datasetStatement(
    db, name, APP_DATASETS[name], MAX_SNAPSHOT_ROWS_PER_DATASET + 1,
  ));
  // D1 batch executes as one transaction. Every table therefore reflects one database state,
  // rather than 25 independently-timed HTTP pages.
  const results = await db.batch(statements);
  const rows = {};
  const counts = {};
  let total = 0;
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const normalized = normalizeAppRows(APP_DATASETS[name], results[index]?.results);
    if (normalized.length > MAX_SNAPSHOT_ROWS_PER_DATASET) {
      const error = new Error(`${name} exceeds the per-dataset snapshot limit`);
      error.status = 413;
      throw error;
    }
    rows[name] = normalized;
    counts[name] = normalized.length;
    total += normalized.length;
  }
  if (total > MAX_SNAPSHOT_ROWS_TOTAL) {
    const error = new Error('Application data exceeds the complete-snapshot limit');
    error.status = 413;
    throw error;
  }
  const token = await payloadDigest({ snapshot_version: SNAPSHOT_VERSION, datasets: names, rows });
  return { version: SNAPSHOT_VERSION, token, datasets: names, counts, total, rows };
}

function attachment(name, format) {
  return appHeaders({
    'Content-Disposition': `attachment; filename="chartquest-app-${name}.${format}"`,
    'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
  });
}

async function issueClaim(context) {
  const unsafe = mutationGuard(context.request);
  if (unsafe) return appJson(403, { error: 'request_rejected', message: 'Request security checks failed.' });
  const parsed = await readAppJson(context.request, 16 * 1024);
  if (parsed.error) return appJson(parsed.error.status, { error: 'invalid_request', message: 'Claim request is invalid.' });
  if (parsed.body.action !== 'issue_claim') {
    return appJson(400, { error: 'invalid_action', message: 'Unknown founder action.' });
  }
  const key = requestIdempotencyKey(context.request, parsed.body, 'request_id');
  if (!key) return appJson(400, { error: 'idempotency_required', message: 'A valid request ID is required.' });
  if (context.request.headers.get('X-Idempotency-Key') && parsed.body.request_id &&
      context.request.headers.get('X-Idempotency-Key') !== parsed.body.request_id) {
    return appJson(400, { error: 'idempotency_mismatch', message: 'Request IDs do not match.' });
  }
  const userId = typeof parsed.body.user_id === 'string' ? parsed.body.user_id : '';
  const hours = parsed.body.expires_hours == null ? 72 : Number(parsed.body.expires_hours);
  if (userId.length < 32 || userId.length > 64 || !Number.isInteger(hours) || hours < 1 || hours > 168) {
    return appJson(400, { error: 'invalid_claim', message: 'Claim details are invalid.' });
  }
  const issuer = String(context.data.access.sub || context.data.access.email || '').slice(0, 256);
  if (!issuer) return forbiddenResponse();
  const rate = await enforceAppRateLimit(context.env.APP_DB, context.request, context.env, 'founder-claim', 20, 3600);
  if (!rate.allowed) return appJson(429, { error: 'rate_limited', message: 'Too many claim requests.' }, { 'Retry-After': '3600' });
  const issuerHash = await sha256Hex(issuer);
  const userScope = `founder:${issuerHash.slice(0, 48)}`;
  const operation = 'account.claim.issue';
  const digest = await payloadDigest({ action: 'issue_claim', user_id: userId, expires_hours: hours });
  const token = await hmacSha256Hex(context.env.APP_AUTH_PEPPER, `account-claim-v1\u0000${userId}\u0000${key}`);
  const tokenHash = await sha256Hex(token);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const prior = await findReceipt(context.env.APP_DB, key);
  if (prior) {
    if (prior.user_scope !== userScope || prior.operation !== operation || prior.payload_hash !== digest) {
      return appJson(409, { error: 'idempotency_conflict', message: 'Request ID was already used.' });
    }
    const result = JSON.parse(prior.result_json || '{}');
    const stored = await context.env.APP_DB.prepare(`SELECT claim_id, user_id, claim_token_hash, expires_at, claimed_at
      FROM app_account_claims WHERE claim_id = ? LIMIT 1`).bind(result.claim_id).first();
    if (!stored || stored.user_id !== userId || stored.claim_token_hash !== tokenHash ||
        stored.claimed_at || stored.expires_at <= nowIso) {
      return appJson(409, { error: 'claim_unavailable', message: 'This one-time claim is no longer available.' });
    }
    return appJson(200, {
      ok: true,
      claim: { claim_id: stored.claim_id, user_id: userId, claim_token: token, expires_at: stored.expires_at },
      receipt: receiptShape(prior, true),
    });
  }
  const identity = await context.env.APP_DB.prepare(`SELECT id, status FROM app_identities
    WHERE id = ? LIMIT 1`).bind(userId).first();
  if (!identity || identity.status !== 'pending_claim') {
    return appJson(409, { error: 'identity_not_claimable', message: 'This identity is not awaiting a claim.' });
  }
  const claimId = `claim-${randomUuid()}`;
  const expiresAt = new Date(nowMs + hours * 60 * 60 * 1000).toISOString();
  const values = {
    id: key, userScope, operation, payloadHash: digest, accepted: 1,
    result: { claim_id: claimId, user_id: userId, expires_at: expiresAt }, nowIso,
  };
  const written = await writeWithReceipt(context.env.APP_DB, values, [
    // Preserve prior claim records for audit while making every older unused token invalid.
    context.env.APP_DB.prepare(`UPDATE app_account_claims SET expires_at = ?
      WHERE user_id = ? AND claimed_at IS NULL AND expires_at > ?`).bind(nowIso, userId, nowIso),
    context.env.APP_DB.prepare(`INSERT INTO app_account_claims
      (claim_id, user_id, claim_token_hash, expires_at, attempts, issued_by_access_sub, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)`
    ).bind(claimId, userId, tokenHash, expiresAt, issuer, nowIso),
    outboxStatement(context.env.APP_DB, {
      receiptId: key, aggregateType: 'account_claim', aggregateId: userId,
      eventType: 'account.claim_issued', payload: { claim_id: claimId, expires_at: expiresAt }, nowIso,
    }),
  ]);
  if (written.conflict) return appJson(409, { error: 'idempotency_conflict', message: 'Request ID was already used.' });
  const storedClaimId = written.receipt.claim_id;
  const storedExpiry = written.receipt.expires_at;
  // The raw one-time token exists only in this no-store, Access-protected response.
  return appJson(written.receipt.replayed ? 200 : 201, {
    ok: true,
    claim: { claim_id: storedClaimId, user_id: userId, claim_token: token, expires_at: storedExpiry },
    receipt: written.receipt,
  });
}

export async function onRequest(context) {
  if (!context.data?.access) return forbiddenResponse();
  if (!context.env?.APP_DB) return appJson(503, { error: 'app_unavailable', message: 'Application data service is unavailable.' });
  if (context.request.method === 'POST') {
    try { return await issueClaim(context); }
    catch (_) { return appJson(503, { error: 'app_unavailable', message: 'Application data service is unavailable.' }); }
  }
  if (context.request.method !== 'GET') {
    return appJson(405, { error: 'method_not_allowed', message: 'Method not allowed.' }, { Allow: 'GET, POST' });
  }
  const parsed = parseRequest(new URL(context.request.url));
  if (parsed.error) return appJson(400, { error: 'invalid_query', message: parsed.error });
  try {
    if (parsed.datasetName === 'summary') {
      return appJson(200, { ok: true, summary: await summary(context.env.APP_DB), generated_at: new Date().toISOString() });
    }
    if (parsed.datasetName === 'snapshot') {
      return appJson(200, { ok: true, snapshot: await completeSnapshot(context.env.APP_DB), generated_at: new Date().toISOString() });
    }
    if (parsed.mode === 'export') {
      const rows = await allRows(context.env.APP_DB, parsed.datasetName, parsed.dataset);
      if (parsed.format === 'csv') {
        return new Response(rowsToCsv(parsed.dataset.columns, rows), {
          status: 200, headers: attachment(parsed.datasetName, 'csv'),
        });
      }
      return appJson(200, {
        dataset: parsed.datasetName, exported_at: new Date().toISOString(), count: rows.length, rows,
      }, attachment(parsed.datasetName, 'json'));
    }
    const result = await page(context.env.APP_DB, parsed);
    if (parsed.format === 'csv') {
      const headers = attachment(parsed.datasetName, 'csv');
      headers['X-Result-Count'] = String(result.rows.length);
      headers['X-Snapshot-Token'] = result.snapshotToken;
      headers['X-Snapshot-Count'] = String(result.snapshotCount);
      if (result.nextCursor != null) headers['X-Next-Cursor'] = String(result.nextCursor);
      return new Response(rowsToCsv(parsed.dataset.columns, result.rows), { status: 200, headers });
    }
    return appJson(200, {
      dataset: parsed.datasetName,
      rows: result.rows,
      page: {
        cursor: parsed.cursor, limit: parsed.limit, count: result.rows.length,
        next_cursor: result.nextCursor, has_more: result.hasMore,
        snapshot_token: result.snapshotToken, snapshot_count: result.snapshotCount,
      },
    });
  } catch (error) {
    if (error?.status === 413) return appJson(413, {
      error: parsed.datasetName === 'snapshot' ? 'snapshot_too_large' : 'export_too_large',
      message: error.message,
    });
    if (error?.status === 409) return appJson(409, { error: error.code || 'snapshot_changed', message: error.message });
    if (error?.status === 400) return appJson(400, { error: error.code || 'invalid_query', message: error.message });
    return appJson(503, { error: 'app_unavailable', message: 'Application data service is unavailable.' });
  }
}
