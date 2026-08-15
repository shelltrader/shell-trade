import {
  DATASETS,
  jsonResponse,
  noStoreHeaders,
  normalizeRows,
  rowsToCsv,
} from '../../_lib/beta.js';
import { forbiddenResponse } from '../../_lib/access.js';

const DEFAULT_PAGE_SIZE = 200;
const MAX_PAGE_SIZE = 500;
const EXPORT_BATCH_SIZE = 500;
const MAX_EXPORT_ROWS = 100000;

function parseNonNegativeInt(value, fallback) {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function parseRequest(url) {
  const datasetName = url.searchParams.get('dataset') || '';
  const dataset = DATASETS[datasetName];
  if (!dataset) return { error: 'dataset must be events or surveys' };

  const format = (url.searchParams.get('format') || 'json').toLowerCase();
  if (format !== 'json' && format !== 'csv') return { error: 'format must be json or csv' };

  const mode = (url.searchParams.get('mode') || 'page').toLowerCase();
  if (mode !== 'page' && mode !== 'export') return { error: 'mode must be page or export' };

  const cursor = parseNonNegativeInt(url.searchParams.get('cursor'), 0);
  if (cursor == null) return { error: 'cursor must be a non-negative integer' };

  const limit = parseNonNegativeInt(url.searchParams.get('limit'), DEFAULT_PAGE_SIZE);
  if (limit == null || limit < 1 || limit > MAX_PAGE_SIZE) {
    return { error: `limit must be between 1 and ${MAX_PAGE_SIZE}` };
  }
  if (mode === 'export' && cursor !== 0) return { error: 'export mode does not accept a cursor' };

  return { datasetName, dataset, format, mode, cursor, limit };
}

async function queryRows(db, dataset, cursor, limit) {
  // The table and columns come only from the closed DATASETS map. User input is always bound.
  const sql = `SELECT ${dataset.columns.join(', ')} FROM ${dataset.table} ` +
    'WHERE id > ? ORDER BY id ASC LIMIT ?';
  const result = await db.prepare(sql).bind(cursor, limit).all();
  return normalizeRows(dataset, result && result.results);
}

async function page(db, parsed) {
  const fetched = await queryRows(db, parsed.dataset, parsed.cursor, parsed.limit + 1);
  const hasMore = fetched.length > parsed.limit;
  const rows = hasMore ? fetched.slice(0, parsed.limit) : fetched;
  const nextCursor = hasMore && rows.length ? Number(rows[rows.length - 1].id) : null;
  return { rows, hasMore, nextCursor };
}

async function allRows(db, dataset) {
  const rows = [];
  let cursor = 0;
  while (rows.length <= MAX_EXPORT_ROWS) {
    const remaining = (MAX_EXPORT_ROWS + 1) - rows.length;
    const batch = await queryRows(db, dataset, cursor, Math.min(EXPORT_BATCH_SIZE, remaining));
    if (!batch.length) break;
    rows.push(...batch);
    cursor = Number(batch[batch.length - 1].id);
    if (batch.length < EXPORT_BATCH_SIZE) break;
  }
  if (rows.length > MAX_EXPORT_ROWS) {
    const error = new Error('Export too large; use paginated mode');
    error.status = 413;
    throw error;
  }
  return rows;
}

function attachmentHeaders(datasetName, format, suffix) {
  return noStoreHeaders({
    'Content-Disposition': `attachment; filename="chartquest-beta-${datasetName}${suffix || ''}.${format}"`,
  });
}

function csvResponse(datasetName, dataset, rows, suffix, pageMeta) {
  const headers = attachmentHeaders(datasetName, 'csv', suffix);
  headers['Content-Type'] = 'text/csv; charset=utf-8';
  if (pageMeta) {
    headers['X-Result-Count'] = String(rows.length);
    if (pageMeta.nextCursor != null) headers['X-Next-Cursor'] = String(pageMeta.nextCursor);
  }
  return new Response(rowsToCsv(dataset, rows), { status: 200, headers });
}

export async function onRequest(context) {
  // Middleware is the primary verifier. This secondary check prevents an accidental route or
  // unit invocation from bypassing it if Cloudflare routing is ever misconfigured.
  if (!context.data || !context.data.access) return forbiddenResponse();
  if (context.request.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' }, { Allow: 'GET' });
  }
  if (!context.env || !context.env.BETA_DB) {
    return jsonResponse(503, { error: 'Beta data service unavailable' });
  }

  const parsed = parseRequest(new URL(context.request.url));
  if (parsed.error) return jsonResponse(400, { error: parsed.error });

  try {
    if (parsed.mode === 'export') {
      const rows = await allRows(context.env.BETA_DB, parsed.dataset);
      if (parsed.format === 'csv') {
        return csvResponse(parsed.datasetName, parsed.dataset, rows, '', null);
      }
      return jsonResponse(200, {
        dataset: parsed.datasetName,
        exported_at: new Date().toISOString(),
        count: rows.length,
        rows,
      }, attachmentHeaders(parsed.datasetName, 'json', ''));
    }

    const result = await page(context.env.BETA_DB, parsed);
    if (parsed.format === 'csv') {
      return csvResponse(
        parsed.datasetName, parsed.dataset, result.rows, '-page',
        { nextCursor: result.nextCursor },
      );
    }
    return jsonResponse(200, {
      dataset: parsed.datasetName,
      rows: result.rows,
      page: {
        limit: parsed.limit,
        count: result.rows.length,
        next_cursor: result.nextCursor,
        has_more: result.hasMore,
      },
    });
  } catch (error) {
    if (error && error.status === 413) return jsonResponse(413, { error: error.message });
    return jsonResponse(503, { error: 'Beta data service unavailable' });
  }
}
