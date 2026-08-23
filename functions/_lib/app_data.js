/* ChartQuest application-plane shapes, transactional receipts, journal snapshots and exports. */

import {
  boundedObject,
  boundedString,
  clampInteger,
  payloadDigest,
  randomUuid,
} from './app.js';

export const MAX_JOURNAL_TRADES = 200;
export const MAX_JOURNAL_NOTES = 500;
export const MAX_MASTERY_ROWS = 40;
export const MAX_CONTENT_ROWS = 100;

function json(value) { return JSON.stringify(value); }

function parseJson(value, fallback) {
  if (typeof value !== 'string') return value == null ? fallback : value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function validItemId(value) {
  if (value == null) return null;
  const id = String(value);
  return id.length >= 1 && id.length <= 100 ? id : null;
}

export function shapeProfile(body) {
  const shells = clampInteger(body?.shells, 0, 10000000);
  const playerLevel = clampInteger(body?.player_level, 1, 10);
  const xp = clampInteger(body?.xp, 0, 999999);
  return shells == null || playerLevel == null || xp == null
    ? null : { shells, player_level: playerLevel, xp };
}

export function shapeExpectedVersion(body) {
  return clampInteger(body?.expected_version, 0, Number.MAX_SAFE_INTEGER);
}

export function validateProfileDelta(current, next) {
  if (!current) return true;
  const oldShells = Number(current.shells);
  const oldLevel = Number(current.player_level);
  const oldXp = Number(current.xp);
  const shellGain = next.shells - oldShells;
  const shellLimit = Math.max(1000, Math.ceil(Math.max(0, oldShells) * 0.10));
  return next.shells >= oldShells && next.player_level >= oldLevel && next.xp >= oldXp &&
    shellGain <= shellLimit && next.player_level <= oldLevel + 1 && next.xp - oldXp <= 500;
}

export function pristineProfile(row) {
  return (!row || (
    Number(row.version) === 0 && Number(row.shells) === 0 && Number(row.player_level) === 1 &&
    Number(row.xp) === 0 && row.source_updated_at == null && row.initial_sync_receipt_id == null
  ));
}

function shapeJournalRows(rows, kind) {
  const maxRows = kind === 'trade' ? MAX_JOURNAL_TRADES : MAX_JOURNAL_NOTES;
  const maxBytes = kind === 'trade' ? 51200 : 20480;
  if (!Array.isArray(rows) || rows.length > maxRows) return null;
  const seen = new Set();
  const clean = [];
  for (const source of rows) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    const dataKey = kind === 'trade' ? 'trade_data' : 'note_data';
    const idKey = kind === 'trade' ? 'trade_id' : 'note_id';
    const data = boundedObject(source[dataKey], maxBytes);
    const id = validItemId(source[idKey] ?? source[dataKey]?.id);
    if (!id || !data || seen.has(id)) return null;
    seen.add(id);
    const createdAt = source.created_at == null
      ? null : boundedString(source.created_at, 40, { present: true });
    if (source.created_at != null && !createdAt) return null;
    clean.push({ id, data, created_at: createdAt });
  }
  return clean;
}

export function shapeJournalSnapshot(body) {
  const baseVersion = clampInteger(body?.base_version, 0, Number.MAX_SAFE_INTEGER);
  const trades = shapeJournalRows(body?.trades, 'trade');
  const notes = shapeJournalRows(body?.notes, 'note');
  const deleteTrades = shapeDeleteIds(body?.delete_trade_ids);
  const deleteNotes = shapeDeleteIds(body?.delete_note_ids);
  if (baseVersion == null || !trades || !notes || !deleteTrades || !deleteNotes) return null;
  const tradeIds = new Set(trades.map((row) => row.id));
  const noteIds = new Set(notes.map((row) => row.id));
  if (deleteTrades.some((id) => tradeIds.has(id)) || deleteNotes.some((id) => noteIds.has(id))) return null;
  return {
    base_version: baseVersion, trades, notes,
    delete_trade_ids: deleteTrades, delete_note_ids: deleteNotes,
  };
}

function shapeDeleteIds(values) {
  if (values == null) return [];
  if (!Array.isArray(values) || values.length > MAX_JOURNAL_TRADES + MAX_JOURNAL_NOTES) return null;
  const seen = new Set();
  const ids = [];
  for (const value of values) {
    const id = validItemId(value);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function shapeStreak(body) {
  const streak = clampInteger(body?.streak, 0, 3660);
  const best = clampInteger(body?.best_streak, 0, 3660);
  const date = body?.last_drill_date == null || body.last_drill_date === ''
    ? null : String(body.last_drill_date);
  if (streak == null || best == null || best < streak || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) return null;
  return { streak, best_streak: best, last_drill_date: date };
}

export function validateStreakTransition(current, next) {
  if (!current) return true;
  const currentStreak = Number(current.streak);
  const currentBest = Number(current.best_streak);
  const currentDate = current.last_drill_date == null ? null : String(current.last_drill_date);
  const nextDate = next.last_drill_date == null ? null : String(next.last_drill_date);
  if (next.best_streak < currentBest) return false;
  if (currentDate && (!nextDate || nextDate < currentDate)) return false;
  if (next.streak < currentStreak) {
    // A streak can reset only as time moves forward, and a reset starts at zero or one.
    if (!currentDate || !nextDate || nextDate <= currentDate || next.streak > 1) return false;
  }
  return true;
}

const MASTERY_ALIASES = Object.freeze({
  trend: 'trend',
  structure: 'structure',
  liquidity: 'liquidity',
  orderblocks: 'order_blocks',
  riskmgmt: 'risk_management',
  trademgmt: 'trade_management',
  multitf: 'multi_timeframe',
});

export function normalizeMasteryCategory(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 80) return null;
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return MASTERY_ALIASES[key] || null;
}

export function shapeMastery(body) {
  if (!Array.isArray(body?.rows) || body.rows.length === 0 || body.rows.length > MAX_MASTERY_ROWS) return null;
  const seen = new Set();
  const seenNormalized = new Set();
  const valid = [];
  const quarantined = [];
  for (const row of body.rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    const categoryRaw = boundedString(row.category, 80, { present: true });
    const score = clampInteger(row.score, 0, 100);
    if (!categoryRaw || score == null || seen.has(categoryRaw)) return null;
    seen.add(categoryRaw);
    const normalized = normalizeMasteryCategory(categoryRaw);
    if (normalized && seenNormalized.has(normalized)) return null;
    if (normalized) seenNormalized.add(normalized);
    const shaped = { category_raw: categoryRaw, category_normalized: normalized, score };
    if (normalized) valid.push(shaped); else quarantined.push({ ...shaped, raw: row });
  }
  return { rows: [...valid, ...quarantined], valid, quarantined };
}

export function shapeBug(body) {
  const message = boundedString(body?.message, 4000, { present: true });
  const playerId = body?.player_id == null ? null : boundedString(body.player_id, 64, { present: true });
  const context = body?.context == null ? {} : boundedObject(body.context, 8192);
  return !message || (body?.player_id != null && !playerId) || !context
    ? null : { player_id: playerId, message: message.trim(), context };
}

function referrerHost(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.hostname.slice(0, 253) : null;
  } catch (_) { return null; }
}

export function shapeVisit(body, request) {
  const path = boundedString(body?.path ?? '/', 256, { present: true });
  const playerId = body?.player_id == null ? null : boundedString(body.player_id, 64, { present: true });
  const build = body?.build == null ? null : boundedString(body.build, 40, { present: true });
  const device = body?.device == null ? null : boundedString(body.device, 24, { present: true });
  if (!path || !path.startsWith('/') || path.startsWith('//') ||
      (body?.player_id != null && !playerId) || (body?.build != null && !build) ||
      (body?.device != null && !device)) return null;
  const countryHeader = request?.cf?.country || request?.headers?.get('CF-IPCountry') || '';
  const country = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
  return {
    player_id: playerId, path, referrer_host: referrerHost(body?.referrer), build, device, country,
  };
}

function contentObject(value, max) {
  return value == null ? {} : boundedObject(value, max);
}

function shapeContentEvent(row) {
  const eventId = boundedString(row?.event_id, 80, { present: true });
  const eventType = boundedString(row?.event_type, 80, { present: true });
  const timestamp = boundedString(row?.ts, 40, { present: true });
  const payload = contentObject(row?.payload, 8192);
  const educational = contentObject(row?.educational_metadata, 4096);
  const flags = contentObject(row?.content_flags, 4096);
  const significance = row?.significance_score == null ? 0 : clampInteger(row.significance_score, 0, 100);
  if (!eventId || !eventType || !timestamp || !payload || !educational || !flags || significance == null) return null;
  return {
    event_id: eventId, event_type: eventType,
    ts: timestamp,
    player_id: row.player_id == null ? null : boundedString(row.player_id, 64, { present: true }),
    session_id: row.session_id == null ? null : boundedString(row.session_id, 64, { present: true }),
    faction: row.faction == null ? null : boundedString(row.faction, 16, { present: true }),
    player_level: row.player_level == null ? null : clampInteger(row.player_level, 0, 100),
    player_rank: row.player_rank == null ? null : boundedString(row.player_rank, 40, { present: true }),
    payload, educational_metadata: educational, content_flags: flags,
    significance_score: significance,
  };
}

function shapeContentReplay(row) {
  const replayId = boundedString(row?.replay_id, 80, { present: true });
  const meta = contentObject(row?.meta, 8192);
  const data = contentObject(row?.data, 65536);
  if (!replayId || !meta || !data) return null;
  return {
    replay_id: replayId,
    event_id: row.event_id == null ? null : boundedString(row.event_id, 80, { present: true }),
    kind: row.kind == null ? null : boundedString(row.kind, 32, { present: true }), meta, data,
  };
}

function shapeContentBrief(row, batchId, index) {
  const eventId = boundedString(row?.event_id, 80, { present: true });
  const platforms = Array.isArray(row?.platforms) && row.platforms.length <= 12
    ? row.platforms.map((value) => boundedString(value, 32, { present: true })) : null;
  const priority = row?.priority == null ? 0 : clampInteger(row.priority, 0, 1000);
  if (!eventId || !platforms || platforms.some((value) => !value) || priority == null) return null;
  return {
    brief_key: boundedString(row.brief_key, 140, { present: true }) || `${batchId}:${index}`,
    event_id: eventId,
    pillar: row.pillar == null ? null : boundedString(row.pillar, 40), platforms,
    urgency: row.urgency == null ? null : boundedString(row.urgency, 24),
    angle: row.angle == null ? null : boundedString(row.angle, 200),
    format: row.format == null ? null : boundedString(row.format, 40),
    priority,
  };
}

function shapeContentExport(row, batchId, index) {
  const filter = contentObject(row?.filter, 8192);
  const count = row?.event_count == null ? 0 : clampInteger(row.event_count, 0, 1000000);
  if (!filter || count == null) return null;
  return {
    export_key: boundedString(row.export_key, 140, { present: true }) || `${batchId}:${index}`,
    platform: row.platform == null ? null : boundedString(row.platform, 40),
    event_count: count, filter,
  };
}

function shapeContentGenerated(row, batchId, index) {
  const body = row?.body == null ? null : boundedString(row.body, 20000);
  const meta = contentObject(row?.meta, 8192);
  if ((row?.body != null && body == null) || !meta) return null;
  return {
    generated_key: boundedString(row.generated_key, 140, { present: true }) || `${batchId}:${index}`,
    brief_key: row.brief_key == null ? null : boundedString(row.brief_key, 140, { present: true }),
    platform: row.platform == null ? null : boundedString(row.platform, 40), body, meta,
    status: boundedString(row.status ?? 'draft', 24, { present: true }),
  };
}

const CONTENT_SHAPERS = Object.freeze({
  content_events: shapeContentEvent,
  content_replays: shapeContentReplay,
  content_briefs: shapeContentBrief,
  content_exports: shapeContentExport,
  content_generated: shapeContentGenerated,
});

const CONTENT_CONFIG = Object.freeze({
  content_events: {
    table: 'app_content_events', key: 'event_id',
    columns: 'event_id,event_type,ts,player_id,session_id,faction,player_level,player_rank,payload,educational_metadata,content_flags,significance_score',
  },
  content_replays: {
    table: 'app_content_replays', key: 'replay_id',
    columns: 'replay_id,event_id,kind,meta,data',
  },
  content_briefs: {
    table: 'app_content_briefs', key: 'brief_key',
    columns: 'brief_key,event_id,pillar,platforms,urgency,angle,format,priority',
  },
  content_exports: {
    table: 'app_content_exports', key: 'export_key',
    columns: 'export_key,platform,event_count,filter_json',
  },
  content_generated: {
    table: 'app_content_generated', key: 'generated_key',
    columns: 'generated_key,brief_key,platform,body,meta,status',
  },
});

function existingContentRow(table, row) {
  if (table === 'content_events') return {
    event_id: row.event_id, event_type: row.event_type, ts: row.ts,
    player_id: row.player_id, session_id: row.session_id, faction: row.faction,
    player_level: row.player_level, player_rank: row.player_rank,
    payload: parseJson(row.payload, {}),
    educational_metadata: parseJson(row.educational_metadata, {}),
    content_flags: parseJson(row.content_flags, {}),
    significance_score: Number(row.significance_score),
  };
  if (table === 'content_replays') return {
    replay_id: row.replay_id, event_id: row.event_id, kind: row.kind,
    meta: parseJson(row.meta, {}), data: parseJson(row.data, {}),
  };
  if (table === 'content_briefs') return {
    brief_key: row.brief_key, event_id: row.event_id, pillar: row.pillar,
    platforms: parseJson(row.platforms, []), urgency: row.urgency,
    angle: row.angle, format: row.format, priority: Number(row.priority),
  };
  if (table === 'content_exports') return {
    export_key: row.export_key, platform: row.platform,
    event_count: Number(row.event_count), filter: parseJson(row.filter_json, {}),
  };
  if (table === 'content_generated') return {
    generated_key: row.generated_key, brief_key: row.brief_key,
    platform: row.platform, body: row.body, meta: parseJson(row.meta, {}), status: row.status,
  };
  return null;
}

export function shapeContentBatch(body) {
  const table = String(body?.table || '');
  const shaper = CONTENT_SHAPERS[table];
  const batchId = boundedString(body?.batch_id, 100, { present: true });
  if (!shaper || !batchId || !Array.isArray(body.rows) || body.rows.length === 0 || body.rows.length > MAX_CONTENT_ROWS) return null;
  const rows = body.rows.map((row, index) => shaper(row, batchId, index));
  if (rows.some((row) => !row)) return null;
  const key = CONTENT_CONFIG[table].key;
  const seen = new Set();
  for (const row of rows) {
    const logicalKey = String(row[key]);
    if (seen.has(logicalKey)) return null;
    seen.add(logicalKey);
  }
  return { table, batch_id: batchId, rows };
}

export async function contentPreflight(db, shaped) {
  const config = CONTENT_CONFIG[shaped.table];
  if (!config) return { invalid: true };
  const entries = await Promise.all(shaped.rows.map(async (row) => ({
    logical_key: String(row[config.key]),
    payload_hash: await payloadDigest({ table: shaped.table, row }),
  })));
  const keys = json(entries.map((entry) => entry.logical_key));
  const results = await db.batch([
    db.prepare(`SELECT ${config.columns} FROM ${config.table}
      WHERE ${config.key} IN (SELECT CAST(value AS TEXT) FROM json_each(?))`).bind(keys),
    db.prepare(`SELECT logical_key, payload_hash FROM app_content_logical_keys
      WHERE table_name = ? AND logical_key IN (SELECT CAST(value AS TEXT) FROM json_each(?))`)
      .bind(shaped.table, keys),
  ]);
  const existing = new Map((results?.[0]?.results || []).map((row) => [String(row[config.key]), row]));
  const registered = new Map((results?.[1]?.results || []).map((row) => [String(row.logical_key), String(row.payload_hash)]));
  for (const entry of entries) {
    let priorHash = registered.get(entry.logical_key);
    if (!priorHash && existing.has(entry.logical_key)) {
      const prior = existingContentRow(shaped.table, existing.get(entry.logical_key));
      priorHash = await payloadDigest({ table: shaped.table, row: prior });
    }
    if (priorHash && priorHash !== entry.payload_hash) {
      return { conflict: true, logical_key: entry.logical_key };
    }
  }
  return { entries, equivalent: entries.filter((entry) => registered.has(entry.logical_key) || existing.has(entry.logical_key)).length };
}

export function contentLogicalKeyStatement(db, shaped, entries, nowIso) {
  const rows = json(entries);
  return db.prepare(`INSERT INTO app_content_logical_keys
    (table_name, logical_key, payload_hash, first_batch_id, created_at)
    SELECT ?, json_extract(value, '$.logical_key'), json_extract(value, '$.payload_hash'), ?, ?
    FROM json_each(?) WHERE 1
    ON CONFLICT(table_name, logical_key) DO UPDATE SET payload_hash = excluded.payload_hash`
  ).bind(shaped.table, shaped.batch_id, nowIso, rows);
}

export function receiptShape(row, replayed) {
  const extra = parseJson(row?.result_json, {});
  return Object.assign({
    id: row.receipt_id,
    operation: row.operation,
    replayed: !!replayed,
    accepted: Number(row.accepted),
  }, extra && typeof extra === 'object' && !Array.isArray(extra) ? extra : {});
}

export async function findReceipt(db, receiptId) {
  return db.prepare(`
    SELECT receipt_id, user_scope, operation, payload_hash, accepted, result_json, created_at
    FROM app_mutation_receipts WHERE receipt_id = ? LIMIT 1
  `).bind(receiptId).first();
}

export function receiptStatement(db, values) {
  return db.prepare(`
    INSERT INTO app_mutation_receipts (
      receipt_id, user_scope, operation, payload_hash, accepted, result_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    values.id, values.userScope, values.operation, values.payloadHash,
    values.accepted, json(values.result || {}), values.nowIso,
  );
}

export function outboxStatement(db, values) {
  return db.prepare(`
    INSERT INTO app_outbox (
      outbox_id, aggregate_type, aggregate_id, event_type, payload,
      status, attempts, available_at, created_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)
  `).bind(
    values.receiptId, values.aggregateType, values.aggregateId,
    values.eventType, json(values.payload || {}), values.nowIso, values.nowIso,
  );
}

export async function writeWithReceipt(db, values, statements) {
  const existing = await findReceipt(db, values.id);
  if (existing) {
    if (existing.user_scope !== values.userScope || existing.operation !== values.operation || existing.payload_hash !== values.payloadHash) {
      return { conflict: true };
    }
    return { receipt: receiptShape(existing, true) };
  }
  try {
    await db.batch([...statements, receiptStatement(db, values)]);
    return { receipt: receiptShape({
      receipt_id: values.id, operation: values.operation, accepted: values.accepted,
      result_json: json(values.result || {}),
    }, false) };
  } catch (error) {
    const raced = await findReceipt(db, values.id);
    if (raced && raced.user_scope === values.userScope && raced.operation === values.operation && raced.payload_hash === values.payloadHash) {
      return { receipt: receiptShape(raced, true) };
    }
    throw error;
  }
}

export async function journalRead(db, userId, options) {
  const limit = clampInteger(options?.limit ?? 100, 1, 200);
  const tradeCursor = clampInteger(options?.tradeCursor ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const noteCursor = clampInteger(options?.noteCursor ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const expectedVersion = options?.expectedVersion == null
    ? null : clampInteger(options.expectedVersion, 0, Number.MAX_SAFE_INTEGER);
  if (limit == null || tradeCursor == null || noteCursor == null ||
      (options?.expectedVersion != null && expectedVersion == null)) return { invalid: true };
  const results = await db.batch([
    db.prepare('SELECT current_version FROM app_journal_heads WHERE user_id = ?').bind(userId),
    db.prepare(`SELECT trade_id, trade_data, created_at, updated_at FROM app_journal_trades
      WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC, trade_id ASC LIMIT ? OFFSET ?`)
      .bind(userId, limit + 1, tradeCursor),
    db.prepare(`SELECT note_id, note_data, created_at, updated_at FROM app_journal_notes
      WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC, note_id ASC LIMIT ? OFFSET ?`)
      .bind(userId, limit + 1, noteCursor),
    db.prepare('SELECT current_version FROM app_journal_heads WHERE user_id = ?').bind(userId),
  ]);
  const before = Number(results?.[0]?.results?.[0]?.current_version || 0);
  const after = Number(results?.[3]?.results?.[0]?.current_version || 0);
  if (before !== after || (expectedVersion != null && expectedVersion !== before)) {
    return { conflict: true, version: after };
  }
  const tradeRows = results?.[1]?.results || [];
  const noteRows = results?.[2]?.results || [];
  const trades = tradeRows.slice(0, limit);
  const notes = noteRows.slice(0, limit);
  return {
    version: before,
    trades: trades.map((row) => ({
      trade_id: row.trade_id, trade_data: parseJson(row.trade_data, {}),
      created_at: row.created_at, updated_at: row.updated_at,
    })),
    notes: notes.map((row) => ({
      note_id: row.note_id, note_data: parseJson(row.note_data, {}),
      created_at: row.created_at, updated_at: row.updated_at,
    })),
    page: {
      limit,
      trade_cursor: tradeCursor,
      trade_next_cursor: tradeRows.length > limit ? tradeCursor + trades.length : null,
      trade_has_more: tradeRows.length > limit,
      note_cursor: noteCursor,
      note_next_cursor: noteRows.length > limit ? noteCursor + notes.length : null,
      note_has_more: noteRows.length > limit,
    },
  };
}

export async function journalStatements(db, userId, requestId, payloadHash, snapshot, nowIso) {
  const version = snapshot.base_version + 1;
  const tradeRows = json(snapshot.trades);
  const noteRows = json(snapshot.notes);
  const deleteTradeIds = json(snapshot.delete_trade_ids);
  const deleteNoteIds = json(snapshot.delete_note_ids);
  const statements = [db.prepare(`
    INSERT INTO app_journal_versions (user_id, version, base_version, request_id, payload_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, version, snapshot.base_version, requestId, payloadHash, nowIso)];

  // json_each keeps a maximum-size legacy snapshot to nine SQL statements. D1 therefore
  // commits trades, notes, history, tombstones, the version and receipt as one small batch.
  statements.push(db.prepare(`
    INSERT INTO app_journal_trades
      (user_id, trade_id, trade_data, row_version, created_at, updated_at, deleted_at)
    SELECT ?, json_extract(value, '$.id'), json(json_extract(value, '$.data')), ?,
      COALESCE(json_extract(value, '$.created_at'), ?), ?, NULL
    FROM json_each(?) WHERE 1
    ON CONFLICT(user_id, trade_id) DO UPDATE SET
      trade_data = excluded.trade_data, row_version = excluded.row_version,
      updated_at = excluded.updated_at, deleted_at = NULL
  `).bind(userId, version, nowIso, nowIso, tradeRows));
  statements.push(db.prepare(`
    INSERT INTO app_journal_changes
      (user_id, journal_version, item_kind, item_id, operation, item_data, created_at)
    SELECT ?, ?, 'trade', json_extract(value, '$.id'), 'upsert',
      json(json_extract(value, '$.data')), ? FROM json_each(?)
  `).bind(userId, version, nowIso, tradeRows));
  statements.push(db.prepare(`
    INSERT INTO app_journal_changes
      (user_id, journal_version, item_kind, item_id, operation, item_data, created_at)
    SELECT ?, ?, 'trade', CAST(value AS TEXT), 'delete', NULL, ? FROM json_each(?)
  `).bind(userId, version, nowIso, deleteTradeIds));
  statements.push(db.prepare(`
    UPDATE app_journal_trades SET row_version = ?, updated_at = ?, deleted_at = ?
    WHERE user_id = ? AND trade_id IN (SELECT CAST(value AS TEXT) FROM json_each(?))
  `).bind(version, nowIso, nowIso, userId, deleteTradeIds));

  statements.push(db.prepare(`
    INSERT INTO app_journal_notes
      (user_id, note_id, note_data, row_version, created_at, updated_at, deleted_at)
    SELECT ?, json_extract(value, '$.id'), json(json_extract(value, '$.data')), ?,
      COALESCE(json_extract(value, '$.created_at'), ?), ?, NULL
    FROM json_each(?) WHERE 1
    ON CONFLICT(user_id, note_id) DO UPDATE SET
      note_data = excluded.note_data, row_version = excluded.row_version,
      updated_at = excluded.updated_at, deleted_at = NULL
  `).bind(userId, version, nowIso, nowIso, noteRows));
  statements.push(db.prepare(`
    INSERT INTO app_journal_changes
      (user_id, journal_version, item_kind, item_id, operation, item_data, created_at)
    SELECT ?, ?, 'note', json_extract(value, '$.id'), 'upsert',
      json(json_extract(value, '$.data')), ? FROM json_each(?)
  `).bind(userId, version, nowIso, noteRows));
  statements.push(db.prepare(`
    INSERT INTO app_journal_changes
      (user_id, journal_version, item_kind, item_id, operation, item_data, created_at)
    SELECT ?, ?, 'note', CAST(value AS TEXT), 'delete', NULL, ? FROM json_each(?)
  `).bind(userId, version, nowIso, deleteNoteIds));
  statements.push(db.prepare(`
    UPDATE app_journal_notes SET row_version = ?, updated_at = ?, deleted_at = ?
    WHERE user_id = ? AND note_id IN (SELECT CAST(value AS TEXT) FROM json_each(?))
  `).bind(version, nowIso, nowIso, userId, deleteNoteIds));
  return {
    statements, version,
    tombstoned: snapshot.delete_trade_ids.length + snapshot.delete_note_ids.length,
  };
}

export function masteryStatements(db, userId, shaped, requestId, nowIso) {
  const statements = [];
  for (const row of shaped.valid) {
    statements.push(db.prepare(`
      INSERT INTO app_mastery (
        owner_key, owner_kind, user_id, category_raw, category_normalized,
        score, source_updated_at, updated_at
      ) VALUES (?, 'account', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_key, category_normalized) DO UPDATE SET
        score = excluded.score,
        source_updated_at = COALESCE(app_mastery.source_updated_at, excluded.source_updated_at),
        updated_at = excluded.updated_at
    `).bind(userId, userId, row.category_raw, row.category_normalized, row.score, nowIso, nowIso));
  }
  for (let index = 0; index < shaped.quarantined.length; index += 1) {
    const row = shaped.quarantined[index];
    statements.push(db.prepare(`
      INSERT INTO app_mastery_quarantine (
        quarantine_key, owner_key, user_id, category_raw, raw_row,
        reason_code, source_provider, created_at
      ) VALUES (?, ?, ?, ?, ?, 'unknown_mastery_category', 'cloudflare', ?)
      ON CONFLICT(quarantine_key) DO NOTHING
    `).bind(`${requestId}:${index}`, userId, userId, row.category_raw, json(row.raw), nowIso));
  }
  return statements;
}

export function contentStatements(db, shaped, nowIso) {
  const rows = json(shaped.rows);
  // Keep a 100-row client batch to one D1 statement. Besides being atomic, this stays well
  // below the per-invocation query budget on Cloudflare's Free plan.
  switch (shaped.table) {
    case 'content_events':
      return [db.prepare(`INSERT INTO app_content_events (
        event_id, event_type, ts, player_id, session_id, faction, player_level,
        player_rank, payload, educational_metadata, content_flags,
        significance_score, processed_status, ingest_source, created_at
      ) SELECT
        json_extract(value, '$.event_id'), json_extract(value, '$.event_type'),
        json_extract(value, '$.ts'), json_extract(value, '$.player_id'),
        json_extract(value, '$.session_id'), json_extract(value, '$.faction'),
        json_extract(value, '$.player_level'), json_extract(value, '$.player_rank'),
        json(json_extract(value, '$.payload')),
        json(json_extract(value, '$.educational_metadata')),
        json(json_extract(value, '$.content_flags')),
        json_extract(value, '$.significance_score'), 'new', 'cloudflare', ?
      FROM json_each(?) WHERE 1 ON CONFLICT(event_id) DO NOTHING`).bind(nowIso, rows)];
    case 'content_replays':
      return [db.prepare(`INSERT INTO app_content_replays
        (replay_id, event_id, kind, meta, data, ingest_source, created_at)
      SELECT json_extract(value, '$.replay_id'), json_extract(value, '$.event_id'),
        json_extract(value, '$.kind'), json(json_extract(value, '$.meta')),
        json(json_extract(value, '$.data')), 'cloudflare', ?
      FROM json_each(?) WHERE 1 ON CONFLICT(replay_id) DO NOTHING`).bind(nowIso, rows)];
    case 'content_briefs':
      return [db.prepare(`INSERT INTO app_content_briefs
        (brief_key, event_id, pillar, platforms, urgency, angle, format, priority,
         status, ingest_source, created_at)
      SELECT json_extract(value, '$.brief_key'), json_extract(value, '$.event_id'),
        json_extract(value, '$.pillar'), json(json_extract(value, '$.platforms')),
        json_extract(value, '$.urgency'), json_extract(value, '$.angle'),
        json_extract(value, '$.format'), json_extract(value, '$.priority'),
        'proposed', 'cloudflare', ?
      FROM json_each(?) WHERE 1 ON CONFLICT(brief_key) DO NOTHING`).bind(nowIso, rows)];
    case 'content_exports':
      return [db.prepare(`INSERT INTO app_content_exports
        (export_key, platform, event_count, filter_json, ingest_source, exported_at)
      SELECT json_extract(value, '$.export_key'), json_extract(value, '$.platform'),
        json_extract(value, '$.event_count'), json(json_extract(value, '$.filter')),
        'cloudflare', ?
      FROM json_each(?) WHERE 1 ON CONFLICT(export_key) DO NOTHING`).bind(nowIso, rows)];
    case 'content_generated':
      return [db.prepare(`INSERT INTO app_content_generated
        (generated_key, brief_key, platform, body, meta, status, ingest_source, created_at)
      SELECT json_extract(value, '$.generated_key'), json_extract(value, '$.brief_key'),
        json_extract(value, '$.platform'), json_extract(value, '$.body'),
        json(json_extract(value, '$.meta')), json_extract(value, '$.status'),
        'cloudflare', ?
      FROM json_each(?) WHERE 1 ON CONFLICT(generated_key) DO NOTHING`).bind(nowIso, rows)];
    default: throw new Error('Unsupported content table');
  }
}

export const APP_DATASETS = Object.freeze({
  identities: { table: 'app_identities', columns: ['id','email_normalized','email_original','source_provider','source_subject','status','consent_at','claimed_at','created_at','updated_at'] },
  profiles: { table: 'app_profiles', columns: ['user_id','shells','player_level','xp','version','source_updated_at','initial_sync_completed_at','initial_sync_receipt_id','created_at','updated_at'] },
  journal_versions: { table: 'app_journal_versions', columns: ['id','user_id','version','base_version','request_id','payload_hash','created_at'] },
  journal_trades: { table: 'app_journal_trades', columns: ['user_id','trade_id','trade_data','row_version','source_row_id','source_created_at','created_at','updated_at','deleted_at'], jsonColumns: ['trade_data'] },
  journal_notes: { table: 'app_journal_notes', columns: ['user_id','note_id','note_data','row_version','source_row_id','source_created_at','created_at','updated_at','deleted_at'], jsonColumns: ['note_data'] },
  journal_changes: { table: 'app_journal_changes', columns: ['id','user_id','journal_version','item_kind','item_id','operation','item_data','created_at'], jsonColumns: ['item_data'] },
  streaks: { table: 'app_daily_streak', columns: ['user_id','streak','best_streak','last_drill_date','version','source_updated_at','updated_at'] },
  mastery: { table: 'app_mastery', columns: ['owner_key','owner_kind','user_id','category_raw','category_normalized','score','source_updated_at','updated_at'] },
  mastery_quarantine: { table: 'app_mastery_quarantine', columns: ['id','quarantine_key','owner_key','user_id','category_raw','raw_row','reason_code','source_provider','created_at'], jsonColumns: ['raw_row'] },
  bugs: { table: 'app_bug_reports', columns: ['id','request_id','user_id','player_id','message','context','status','ingest_source','source_row_id','source_created_at','created_at'], jsonColumns: ['context'] },
  visits: { table: 'app_site_visits', columns: ['id','visit_id','player_id','path','referrer_host','build','device','country','ingest_source','source_row_id','source_created_at','created_at'] },
  visit_days: { table: 'app_site_visits_daily', columns: ['visit_date','path','visit_count','first_seen_at','last_seen_at'] },
  content_events: { table: 'app_content_events', columns: ['id','event_id','event_type','ts','player_id','session_id','faction','player_level','player_rank','payload','educational_metadata','content_flags','significance_score','processed_status','ingest_source','created_at'], jsonColumns: ['payload','educational_metadata','content_flags'] },
  content_replays: { table: 'app_content_replays', columns: ['id','replay_id','event_id','kind','meta','data','ingest_source','created_at'], jsonColumns: ['meta','data'] },
  content_briefs: { table: 'app_content_briefs', columns: ['id','brief_key','event_id','pillar','platforms','urgency','angle','format','priority','status','ingest_source','created_at'], jsonColumns: ['platforms'] },
  content_assets: { table: 'app_content_assets', columns: ['id','asset_key','brief_key','event_id','asset_type','storage_path','platform_variant','meta','ingest_source','created_at'], jsonColumns: ['meta'] },
  content_generated: { table: 'app_content_generated', columns: ['id','generated_key','brief_key','platform','body','meta','status','ingest_source','created_at'], jsonColumns: ['meta'] },
  content_exports: { table: 'app_content_exports', columns: ['id','export_key','platform','event_count','filter_json','ingest_source','exported_at'], jsonColumns: ['filter_json'] },
  published_posts: { table: 'app_published_posts', columns: ['id','post_key','asset_key','platform','post_url','ingest_source','published_at'] },
  performance: { table: 'app_performance_snapshots', columns: ['id','snapshot_key','post_key','captured_at','metrics','ingest_source'], jsonColumns: ['metrics'] },
  outbox: { table: 'app_outbox', columns: ['outbox_id','aggregate_type','aggregate_id','event_type','payload','status','attempts','available_at','delivered_at','created_at'], jsonColumns: ['payload'] },
  migration_runs: { table: 'app_migration_runs', columns: ['run_id','source_provider','source_project_ref','dataset','external_batch_id','source_count','source_digest','imported_count','quarantine_count','status','notes','started_at','finished_at'] },
  migration_ledger: { table: 'app_migration_ledger', columns: ['id','run_id','source_table','source_pk','source_digest','target_table','target_pk','status','imported_at'] },
  migration_quarantine: { table: 'app_migration_quarantine', columns: ['id','run_id','source_table','source_pk','reason_code','reason_detail','raw_row','created_at'], jsonColumns: ['raw_row'] },
  reconciliation: { table: 'app_migration_reconciliation', columns: ['id','run_id','dataset','source_count','target_count','quarantine_count','source_digest','target_digest','matched','checked_at','details'], jsonColumns: ['details'] },
});

export function normalizeAppRows(dataset, rows) {
  const jsonColumns = new Set(dataset.jsonColumns || []);
  return (Array.isArray(rows) ? rows : []).map((source) => {
    const row = {};
    for (const column of dataset.columns) {
      let value = Object.prototype.hasOwnProperty.call(source || {}, column) ? source[column] : null;
      if (jsonColumns.has(column)) value = parseJson(value, value == null ? null : {});
      row[column] = value;
    }
    return row;
  });
}

export async function digestBody(body) { return payloadDigest(body); }
export function newOutboxId() { return `out-${randomUuid()}`; }
