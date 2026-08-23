#!/usr/bin/env node
'use strict';

/* Dependency-free contract/integration tests for the Cloudflare D1 application plane. */

const assert = require('assert');
const cryptoNode = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { pathToFileURL } = require('url');

if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: cryptoNode.webcrypto });
globalThis.atob ||= (value) => Buffer.from(value, 'base64').toString('binary');
globalThis.btoa ||= (value) => Buffer.from(value, 'binary').toString('base64');

const ROOT = path.resolve(__dirname, '..');
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'chartquest-cloudflare-app-'));
const DB_PATH = path.join(TEMP, 'app.db');
const AUTH_PEPPER = 'test-only-auth-pepper-65c21659c3b04d72';
const RATE_SALT = 'test-only-rate-salt-9b9fde81655f4aab';
let passed = 0;

function source(relative) { return fs.readFileSync(path.join(ROOT, relative), 'utf8'); }

function copyModule(relative) {
  const destination = path.join(TEMP, relative.replace(/\.js$/, '.mjs'));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const code = source(relative).replace(/(from\s+['"][^'"]+)\.js(['"])/g, '$1.mjs$2');
  fs.writeFileSync(destination, code);
  return destination;
}

function sqlite(sql, options) {
  const result = spawnSync('sqlite3', ['-json', DB_PATH], {
    input: `.bail on\nPRAGMA foreign_keys=ON;\n${sql}`,
    encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const error = new Error((result.stderr || result.stdout || 'sqlite failed').trim());
    error.status = result.status;
    throw error;
  }
  const output = (result.stdout || '').trim();
  if (!output) return [];
  try { return JSON.parse(output); }
  catch (_) {
    if (options?.multiple) return output.split(/\n(?=\[)/).map((part) => JSON.parse(part));
    throw new Error(`Unexpected sqlite output: ${output.slice(0, 200)}`);
  }
}

function literal(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('non-finite bind');
    return String(value);
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function bindSql(sql, args) {
  let index = 0;
  const bound = String(sql).replace(/\?/g, () => {
    if (index >= args.length) throw new Error('missing SQL bind');
    return literal(args[index++]);
  });
  if (index !== args.length) throw new Error('extra SQL bind');
  return bound;
}

class SqliteStatement {
  constructor(db, sql) { this.db = db; this.sql = String(sql); this.args = []; }
  bind(...args) { this.args = args; return this; }
  rendered() { return bindSql(this.sql, this.args); }
  async first() { return sqlite(this.rendered())[0] || null; }
  async all() { return { success: true, results: sqlite(this.rendered()) }; }
  async run() { sqlite(this.rendered()); return { success: true }; }
}

class SqliteDB {
  prepare(sql) { return new SqliteStatement(this, sql); }
  async batch(statements) {
    if (statements.every((statement) => /^\s*SELECT\b/i.test(statement.sql))) {
      return Promise.all(statements.map(async (statement) => ({ success: true, results: sqlite(statement.rendered()) })));
    }
    const sql = statements.map((statement) => `${statement.rendered()};`).join('\n');
    sqlite(`BEGIN IMMEDIATE;\n${sql}\nCOMMIT;`);
    return statements.map(() => ({ success: true }));
  }
}

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS  ${name}\n`);
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

function request(url, method, body, extraHeaders) {
  const headers = Object.assign({
    Origin: 'https://playchartquest.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
  }, extraHeaders || {});
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return new Request(url, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function cookieHeader(session) {
  return session.cookies.map((line) => line.split(';')[0]).join('; ');
}

function authHeaders(session, idempotencyKey) {
  const headers = { Cookie: cookieHeader(session), 'X-CSRF-Token': session.csrf };
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  return headers;
}

async function jsonBody(response) {
  const body = await response.json();
  return { response, body };
}

(async () => {
  const modules = [
    'functions/_lib/beta.js', 'functions/_lib/access.js',
    'functions/_lib/app.js', 'functions/_lib/app_auth.js', 'functions/_lib/app_data.js',
    'functions/api/app/session.js', 'functions/api/app/account.js', 'functions/api/app/claim.js',
    'functions/api/app/profile.js', 'functions/api/app/journal.js', 'functions/api/app/streak.js',
    'functions/api/app/mastery.js', 'functions/api/app/bug.js', 'functions/api/app/visit.js',
    'functions/api/app/content.js', 'functions/api/app/market-price.js',
    'functions/founder/api/app-data.js',
  ];
  modules.forEach(copyModule);

  const app = await import(pathToFileURL(path.join(TEMP, 'functions/_lib/app.mjs')).href);
  const auth = await import(pathToFileURL(path.join(TEMP, 'functions/_lib/app_auth.mjs')).href);
  const data = await import(pathToFileURL(path.join(TEMP, 'functions/_lib/app_data.mjs')).href);
  const sessionApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/session.mjs')).href);
  const accountApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/account.mjs')).href);
  const claimApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/claim.mjs')).href);
  const profileApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/profile.mjs')).href);
  const journalApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/journal.mjs')).href);
  const streakApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/streak.mjs')).href);
  const masteryApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/mastery.mjs')).href);
  const bugApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/bug.mjs')).href);
  const visitApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/visit.mjs')).href);
  const contentApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/content.mjs')).href);
  const marketApi = await import(pathToFileURL(path.join(TEMP, 'functions/api/app/market-price.mjs')).href);
  const founderApi = await import(pathToFileURL(path.join(TEMP, 'functions/founder/api/app-data.mjs')).href);

  const migration = source('cloudflare/migrations/0002_app.sql');
  const betaMigration = source('cloudflare/migrations/0001_beta.sql');
  sqlite(`${betaMigration}\n${migration}`);
  const db = new SqliteDB();
  const env = { APP_DB: db, APP_AUTH_PEPPER: AUTH_PEPPER, APP_RATE_SALT: RATE_SALT };

  await test('migration is additive, Supabase-free, re-runnable, and foreign-key clean', () => {
    assert.doesNotMatch(migration, /\b(DROP|TRUNCATE|DELETE\s+FROM)\b/i);
    assert.doesNotMatch(migration, /supabase\.co|ymxppzhczvmiuoncuqqu/i);
    sqlite(migration);
    assert.deepStrictEqual(sqlite('PRAGMA foreign_key_check;'), []);
    const tables = sqlite("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'app_%'");
    for (const name of [
      'app_identities','app_account_claims','app_sessions','app_profiles',
      'app_account_claim_redemptions',
      'app_journal_versions','app_journal_trades','app_journal_notes','app_journal_changes',
      'app_daily_streak','app_mastery','app_mastery_quarantine','app_bug_reports',
      'app_site_visits','app_site_visits_daily','app_content_events','app_content_replays',
      'app_content_logical_keys',
      'app_migration_runs','app_migration_ledger','app_migration_quarantine',
      'app_migration_reconciliation','app_mutation_receipts','app_outbox',
    ]) assert(tables.some((row) => row.name === name), name);
  });

  await test('schema stores only hashed session, claim and rate-limit secrets', () => {
    assert.match(migration, /session_hash\s+TEXT PRIMARY KEY/);
    assert.match(migration, /claim_token_hash\s+TEXT NOT NULL UNIQUE/);
    assert.match(migration, /bucket_hash\s+TEXT NOT NULL/);
    assert.doesNotMatch(migration, /\b(ip|session_token|claim_token)\s+TEXT\b/i);
  });

  await test('origin, fetch metadata and JSON-body checks fail closed', async () => {
    assert.strictEqual(app.appOriginAllowed('https://playchartquest.com'), true);
    assert.strictEqual(app.appOriginAllowed('https://playchartquest.com.evil.test'), false);
    const cross = app.mutationGuard(request('https://playchartquest.com/api/app/visit', 'POST', {}, {
      Origin: 'https://evil.test', 'Sec-Fetch-Site': 'cross-site',
    }));
    assert.strictEqual(cross.status, 403);
    const nonJson = new Request('https://playchartquest.com/api/app/visit', {
      method: 'POST', headers: { Origin: 'https://playchartquest.com', 'Content-Type': 'text/plain' }, body: '{}',
    });
    assert.strictEqual((await app.readAppJson(nonJson)).error.status, 415);
  });

  await test('canonical payload digests are deterministic across object key order', async () => {
    assert.strictEqual(await app.payloadDigest({ b: 2, a: { z: 1, y: 0 } }),
      await app.payloadDigest({ a: { y: 0, z: 1 }, b: 2 }));
  });

  await test('password credentials use peppered PBKDF2 and reject wrong passwords', async () => {
    const credential = await auth.createPasswordCredential('correct horse', env, { iterations: 100000 });
    assert.strictEqual(credential.scheme, 'pbkdf2-sha256-v1');
    assert.notStrictEqual(credential.hash, 'correct horse');
    const identity = {
      password_scheme: credential.scheme, password_salt: credential.salt,
      password_hash: credential.hash, password_iterations: credential.iterations,
    };
    assert.strictEqual(await auth.verifyPassword('correct horse', identity, env), true);
    assert.strictEqual(await auth.verifyPassword('wrong horse', identity, env), false);
  });

  await test('account creation gives exact receipt and stores no raw password/session token', async () => {
    const body = { email: 'Player@Example.com', password: 'safe-password-1', consent: true };
    const req = request('https://playchartquest.com/api/app/account', 'POST', body, {
      'X-Idempotency-Key': 'account-create-001', 'CF-Connecting-IP': '203.0.113.10',
    });
    const { response, body: result } = await jsonBody(await accountApi.onRequest({ request: req, env }));
    assert.strictEqual(response.status, 201);
    assert.deepStrictEqual({ id: result.receipt.id, operation: result.receipt.operation, accepted: result.receipt.accepted },
      { id: 'account-create-001', operation: 'account.create', accepted: 1 });
    assert.strictEqual(result.receipt.replayed, false);
    const setCookie = String(response.headers.get('set-cookie') || '');
    assert.match(setCookie, /__Host-cq_session=/);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /HttpOnly/i);
    assert.doesNotMatch(setCookie, /Domain=/i);
    const identity = sqlite("SELECT * FROM app_identities WHERE email_normalized='player@example.com'")[0];
    assert(identity);
    assert.strictEqual(identity.source_provider, 'cloudflare');
    assert.notStrictEqual(identity.password_hash, body.password);
    const session = sqlite('SELECT * FROM app_sessions WHERE user_id=' + literal(identity.id))[0];
    assert.strictEqual(session.session_hash.length, 64);
    assert(!String(response.headers.get('set-cookie')).includes(session.session_hash));
  });

  await test('account retry replays same receipt; changed payload conflicts', async () => {
    const base = { email: 'Player@Example.com', password: 'safe-password-1', consent: true };
    const retry = request('https://playchartquest.com/api/app/account', 'POST', base, {
      'X-Idempotency-Key': 'account-create-001', 'CF-Connecting-IP': '203.0.113.10',
    });
    const replay = await jsonBody(await accountApi.onRequest({ request: retry, env }));
    assert.strictEqual(replay.response.status, 200);
    assert.strictEqual(replay.body.receipt.replayed, true);
    const conflictReq = request('https://playchartquest.com/api/app/account', 'POST', {
      ...base, password: 'different-password',
    }, { 'X-Idempotency-Key': 'account-create-001', 'CF-Connecting-IP': '203.0.113.10' });
    const conflict = await accountApi.onRequest({ request: conflictReq, env });
    assert.strictEqual(conflict.status, 409);
  });

  const identity = sqlite("SELECT id, email_original, source_provider FROM app_identities WHERE email_normalized='player@example.com'")[0];
  const issued = await auth.issueSession(db, identity, request('https://playchartquest.com/', 'GET'), Date.now());

  await test('session GET is cookie-authenticated and missing session is a safe null', async () => {
    const active = await jsonBody(await sessionApi.onRequest({
      request: request('https://playchartquest.com/api/app/session', 'GET', undefined, { Cookie: cookieHeader(issued) }), env,
    }));
    assert.strictEqual(active.response.status, 200);
    assert.strictEqual(active.body.user.id, identity.id);
    assert.strictEqual(active.body.csrf_token, issued.csrf);
    const guest = await jsonBody(await sessionApi.onRequest({
      request: request('https://playchartquest.com/api/app/session', 'GET'), env,
    }));
    assert.strictEqual(guest.response.status, 200);
    assert.strictEqual(guest.body.user, null);
  });

  await test('sign-in rejects wrong password and accepts the stored credential', async () => {
    const wrong = await sessionApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/session', 'POST',
      { email: 'player@example.com', password: 'wrong-password' }, { 'CF-Connecting-IP': '203.0.113.11' },
    ), env });
    assert.strictEqual(wrong.status, 401);
    const good = await jsonBody(await sessionApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/session', 'POST',
      { email: 'player@example.com', password: 'safe-password-1' }, { 'CF-Connecting-IP': '203.0.113.11' },
    ), env }));
    assert.strictEqual(good.response.status, 200);
    assert.strictEqual(good.body.user.id, identity.id);
  });

  await test('authenticated mutation requires both same-site request and matching CSRF', async () => {
    const missing = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT',
      { shells: 10, player_level: 1, xp: 20 },
      { Cookie: cookieHeader(issued), 'X-Idempotency-Key': 'profile-missing-csrf' },
    ), env });
    assert.strictEqual(missing.status, 403);
    const cross = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT',
      { shells: 10, player_level: 1, xp: 20 },
      { ...authHeaders(issued, 'profile-cross-site'), Origin: 'https://evil.test', 'Sec-Fetch-Site': 'cross-site' },
    ), env });
    assert.strictEqual(cross.status, 403);
  });

  await test('profile write has exact receipt, replay, expected-version and monotonic delta guards', async () => {
    const body = { shells: 100, player_level: 1, xp: 200, expected_version: 0 };
    const send = () => profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT', body, authHeaders(issued, 'profile-put-0001'),
    ), env });
    const first = await jsonBody(await send());
    assert.strictEqual(first.response.status, 200);
    assert.deepStrictEqual(first.body.receipt, {
      id: 'profile-put-0001', operation: 'profile.put', replayed: false, accepted: 1, version: 1,
    });
    const replay = await jsonBody(await send());
    assert.strictEqual(replay.body.receipt.replayed, true);
    const rejected = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT',
      { shells: 5000, player_level: 5, xp: 5000, expected_version: 1 }, authHeaders(issued, 'profile-put-0002'),
    ), env });
    assert.strictEqual(rejected.status, 409);
    const stale = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT',
      { shells: 101, player_level: 1, xp: 201, expected_version: 0 }, authHeaders(issued, 'profile-stale-001'),
    ), env });
    assert.strictEqual(stale.status, 409);
    const decrease = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT',
      { shells: 99, player_level: 1, xp: 200, expected_version: 1 }, authHeaders(issued, 'profile-decrease-001'),
    ), env });
    assert.strictEqual(decrease.status, 409);
    const get = await jsonBody(await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    assert.strictEqual(get.body.profile.shells, 100);
    assert.strictEqual(get.body.profile.version, 1);
    assert.strictEqual(get.body.profile.bootstrap_available, false);
  });

  await test('profile bootstrap imports local progress exactly once on a pristine account', async () => {
    const created = await jsonBody(await accountApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/account', 'POST', {
        email: 'bootstrap@example.com', password: 'bootstrap-password', consent: true,
      }, { 'X-Idempotency-Key': 'account-bootstrap-001', 'CF-Connecting-IP': '203.0.113.12' },
    ), env }));
    assert.strictEqual(created.response.status, 201);
    const bootstrapIdentity = sqlite("SELECT id, email_original, source_provider FROM app_identities WHERE email_normalized='bootstrap@example.com'")[0];
    const bootstrapSession = await auth.issueSession(db, bootstrapIdentity, request('https://playchartquest.com/', 'GET'));
    const body = {
      shells: 750000, player_level: 8, xp: 80000, expected_version: 0, bootstrap: true,
    };
    const send = (id = 'profile-bootstrap-001') => profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT', body, authHeaders(bootstrapSession, id),
    ), env });
    const first = await jsonBody(await send());
    assert.deepStrictEqual(first.body.receipt, {
      id: 'profile-bootstrap-001', operation: 'profile.bootstrap', replayed: false, accepted: 1, version: 1,
    });
    const replay = await jsonBody(await send());
    assert.strictEqual(replay.body.receipt.replayed, true);
    const second = await send('profile-bootstrap-002');
    assert.strictEqual(second.status, 409);
    const row = sqlite('SELECT shells, player_level, xp, version, initial_sync_receipt_id FROM app_profiles WHERE user_id=' + literal(bootstrapIdentity.id))[0];
    assert.deepStrictEqual(row, {
      shells: 750000, player_level: 8, xp: 80000, version: 1,
      initial_sync_receipt_id: 'profile-bootstrap-001',
    });
    const importedId = '9b772a9e-075c-49d1-af1d-eb264c80f100';
    const importedAt = '2026-08-15T00:00:00.000Z';
    await db.batch([
      db.prepare(`INSERT INTO app_identities
        (id,email_normalized,email_original,source_provider,source_subject,status,created_at,updated_at)
        VALUES (?,? ,?,'supabase',?,'active',?,?)`
      ).bind(importedId, 'imported-profile@example.com', 'imported-profile@example.com', importedId, importedAt, importedAt),
      db.prepare(`INSERT INTO app_profiles
        (user_id,shells,player_level,xp,version,source_updated_at,created_at,updated_at)
        VALUES (?,500,4,900,0,?,?,?)`
      ).bind(importedId, importedAt, importedAt, importedAt),
    ]);
    const importedSession = await auth.issueSession(db, {
      id: importedId, email_original: 'imported-profile@example.com', source_provider: 'supabase',
    }, request('https://playchartquest.com/', 'GET'));
    const importedBootstrap = await profileApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/profile', 'PUT', {
        shells: 900000, player_level: 9, xp: 90000, expected_version: 0, bootstrap: true,
      }, authHeaders(importedSession, 'profile-bootstrap-imported'),
    ), env });
    assert.strictEqual(importedBootstrap.status, 409);
    assert.strictEqual(sqlite('SELECT shells FROM app_profiles WHERE user_id=' + literal(importedId))[0].shells, 500);
  });

  await test('journal PUT atomically versions upserts and only creates explicit tombstones', async () => {
    const firstBody = {
      base_version: 0,
      trades: [{ trade_id: 'trade-1', trade_data: { id: 1, result: 'win' } }],
      notes: [{ note_id: 'note-1', note_data: { id: 1, text: 'patient entry' } }],
    };
    const first = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal', 'PUT', firstBody, authHeaders(issued, 'journal-put-0001'),
    ), env }));
    assert.strictEqual(first.response.status, 200);
    assert.deepStrictEqual(first.body.receipt, {
      id: 'journal-put-0001', operation: 'journal.put', replayed: false,
      accepted: 2, version: 1, tombstoned: 0,
    });
    const secondBody = {
      base_version: 1, trades: [],
      notes: [{ note_id: 'note-1', note_data: { id: 1, text: 'waited for confirmation' } }],
      delete_trade_ids: ['trade-1'],
    };
    const second = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal', 'PUT', secondBody, authHeaders(issued, 'journal-put-0002'),
    ), env }));
    assert.strictEqual(second.body.receipt.accepted, 2);
    assert.strictEqual(second.body.receipt.tombstoned, 1);
    assert.strictEqual(second.body.receipt.version, 2);
    const tombstone = sqlite("SELECT deleted_at FROM app_journal_trades WHERE trade_id='trade-1'")[0];
    assert(tombstone.deleted_at);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_journal_changes WHERE user_id=" + literal(identity.id))[0].n, 4);
  });

  await test('stale journal base aborts the entire batch without a receipt', async () => {
    const response = await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal', 'PUT',
      { base_version: 0, trades: [], notes: [] }, authHeaders(issued, 'journal-stale-001'),
    ), env });
    assert.strictEqual(response.status, 409);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_mutation_receipts WHERE receipt_id='journal-stale-001'")[0].n, 0);
    assert.strictEqual(sqlite('SELECT current_version FROM app_journal_heads WHERE user_id=' + literal(identity.id))[0].current_version, 2);
  });

  await test('journal GET returns one coherent current snapshot', async () => {
    const result = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal', 'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    assert.strictEqual(result.body.journal.version, 2);
    assert.strictEqual(result.body.journal.trades.length, 0);
    assert.strictEqual(result.body.journal.notes[0].note_data.text, 'waited for confirmation');
    assert.strictEqual(result.body.journal.page.trade_has_more, false);
  });

  await test('journal paging is complete and omission never tombstones unseen imported rows', async () => {
    const nowIso = '2026-08-23T12:00:00.000Z';
    sqlite(`WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 205)
      INSERT INTO app_journal_trades
        (user_id,trade_id,trade_data,row_version,created_at,updated_at,deleted_at)
      SELECT ${literal(identity.id)}, printf('imported-%03d', n), json_object('id', n), 2,
        '${nowIso}', '${nowIso}', NULL FROM seq;`);
    const first = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal?limit=100', 'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    assert.strictEqual(first.body.journal.trades.length, 100);
    assert.strictEqual(first.body.journal.page.trade_next_cursor, 100);
    const second = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal?limit=100&trade_cursor=100&note_cursor=1&version=2',
      'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    const third = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal?limit=100&trade_cursor=200&note_cursor=1&version=2',
      'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    assert.strictEqual(first.body.journal.trades.length + second.body.journal.trades.length + third.body.journal.trades.length, 205);
    assert.strictEqual(third.body.journal.page.trade_has_more, false);
    const safeWrite = await jsonBody(await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal', 'PUT', {
        base_version: 2, trades: [],
        notes: [{ note_id: 'note-1', note_data: { id: 1, text: 'no implicit deletion' } }],
      }, authHeaders(issued, 'journal-safe-omission-001'),
    ), env }));
    assert.strictEqual(safeWrite.body.receipt.version, 3);
    assert.strictEqual(safeWrite.body.receipt.tombstoned, 0);
    assert.strictEqual(sqlite(`SELECT count(*) AS n FROM app_journal_trades WHERE user_id=${literal(identity.id)} AND deleted_at IS NULL`)[0].n, 205);
    const pinnedStale = await journalApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/journal?limit=100&version=2', 'GET', undefined,
      { Cookie: cookieHeader(issued) },
    ), env });
    assert.strictEqual(pinnedStale.status, 409);
  });

  await test('streak write/get requires expected version and allows only a safe dated reset', async () => {
    const write = await jsonBody(await streakApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/streak', 'PUT',
      { streak: 3, best_streak: 5, last_drill_date: '2026-08-23', expected_version: 0 }, authHeaders(issued, 'streak-put-0001'),
    ), env }));
    assert.deepStrictEqual(write.body.receipt, {
      id: 'streak-put-0001', operation: 'streak.put', replayed: false, accepted: 1, version: 1,
    });
    const reset = await jsonBody(await streakApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/streak', 'PUT',
      { streak: 1, best_streak: 5, last_drill_date: '2026-08-25', expected_version: 1 }, authHeaders(issued, 'streak-reset-0001'),
    ), env }));
    assert.strictEqual(reset.body.receipt.version, 2);
    const stale = await streakApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/streak', 'PUT',
      { streak: 4, best_streak: 5, last_drill_date: '2026-08-25', expected_version: 1 }, authHeaders(issued, 'streak-stale-0001'),
    ), env });
    assert.strictEqual(stale.status, 409);
    const regression = await streakApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/streak', 'PUT',
      { streak: 0, best_streak: 4, last_drill_date: '2026-08-26', expected_version: 2 }, authHeaders(issued, 'streak-regress-0001'),
    ), env });
    assert.strictEqual(regression.status, 409);
    const get = await jsonBody(await streakApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/streak', 'GET', undefined, { Cookie: cookieHeader(issued) },
    ), env }));
    assert.strictEqual(get.body.streak.best_streak, 5);
    assert.strictEqual(get.body.streak.streak, 1);
    assert.strictEqual(get.body.streak.version, 2);
  });

  await test('mastery preserves raw categories and quarantines unknown categories without dropping them', async () => {
    const write = await jsonBody(await masteryApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/mastery', 'PUT', {
        rows: [{ category: 'OrderBlocks', score: 72 }, { category: 'legacy-psychology', score: 44 }],
      }, authHeaders(issued, 'mastery-put-001'),
    ), env }));
    assert.deepStrictEqual(write.body.receipt, {
      id: 'mastery-put-001', operation: 'mastery.put', replayed: false, accepted: 2, quarantined: 1,
    });
    const valid = sqlite('SELECT category_raw, category_normalized FROM app_mastery WHERE user_id=' + literal(identity.id))[0];
    assert.deepStrictEqual(valid, { category_raw: 'OrderBlocks', category_normalized: 'order_blocks' });
    const quarantine = sqlite('SELECT category_raw, raw_row FROM app_mastery_quarantine WHERE user_id=' + literal(identity.id))[0];
    assert.strictEqual(quarantine.category_raw, 'legacy-psychology');
    assert.strictEqual(JSON.parse(quarantine.raw_row).score, 44);
    sqlite(`UPDATE app_mastery SET source_updated_at='2026-08-01T00:00:00.000Z'
      WHERE user_id=${literal(identity.id)} AND category_normalized='order_blocks'`);

    const duplicateAlias = await masteryApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/mastery', 'PUT', {
        rows: [{ category: 'Trend', score: 50 }, { category: 'trend', score: 51 }],
      }, authHeaders(issued, 'mastery-alias-dupe-001'),
    ), env });
    assert.strictEqual(duplicateAlias.status, 400);

    const aliasUpdate = await jsonBody(await masteryApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/mastery', 'PUT', {
        rows: [{ category: 'order_blocks', score: 81 }],
      }, authHeaders(issued, 'mastery-alias-update-001'),
    ), env }));
    assert.deepStrictEqual(aliasUpdate.body.receipt, {
      id: 'mastery-alias-update-001', operation: 'mastery.put', replayed: false, accepted: 1, quarantined: 0,
    });
    const canonical = sqlite('SELECT category_raw, category_normalized, score, source_updated_at FROM app_mastery WHERE user_id=' + literal(identity.id));
    assert.strictEqual(canonical.length, 1);
    assert.deepStrictEqual(canonical[0], {
      category_raw: 'OrderBlocks', category_normalized: 'order_blocks', score: 81,
      source_updated_at: '2026-08-01T00:00:00.000Z',
    });
  });

  await test('guest cannot read or overwrite authenticated mastery', async () => {
    const response = await masteryApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/mastery', 'PUT', { rows: [{ category: 'Trend', score: 100 }] },
      { 'X-Idempotency-Key': 'guest-mastery-001' },
    ), env });
    assert.strictEqual(response.status, 401);
  });

  await test('public bug report is bounded and idempotent with no forged user ownership', async () => {
    const body = { request_id: 'bug-request-001', player_id: 'p-1', message: 'Replay stopped early', context: { level: 1 } };
    const send = () => bugApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/bug', 'POST', body, { 'CF-Connecting-IP': '203.0.113.20' },
    ), env });
    const first = await jsonBody(await send());
    assert.deepStrictEqual(first.body.receipt, {
      id: 'bug-request-001', operation: 'bug.create', replayed: false, accepted: 1,
    });
    const replay = await jsonBody(await send());
    assert.strictEqual(replay.body.receipt.replayed, true);
    assert.strictEqual(sqlite("SELECT user_id FROM app_bug_reports WHERE request_id='bug-request-001'")[0].user_id, null);
  });

  await test('visit receipt replay does not double-count raw or daily visits', async () => {
    const body = { visit_id: 'visit-request-001', player_id: 'p-1', path: '/play', referrer: 'https://friend.example/invite?email=x' };
    const send = () => visitApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/visit', 'POST', body,
      { 'CF-Connecting-IP': '203.0.113.21', 'CF-IPCountry': 'US' },
    ), env });
    assert.strictEqual((await send()).status, 200);
    const replay = await jsonBody(await visitApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/visit', 'POST', body,
      { 'CF-Connecting-IP': '203.0.113.21', 'CF-IPCountry': 'CA' },
    ), env }));
    assert.strictEqual(replay.body.receipt.replayed, true);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_site_visits WHERE visit_id='visit-request-001'")[0].n, 1);
    assert.strictEqual(sqlite("SELECT visit_count FROM app_site_visits_daily WHERE path='/play'")[0].visit_count, 1);
    assert.strictEqual(sqlite("SELECT referrer_host FROM app_site_visits WHERE visit_id='visit-request-001'")[0].referrer_host, 'friend.example');
  });

  await test('content batch uses closed table map and exact confirmed receipt', async () => {
    const body = { batch_id: 'content-batch-001', table: 'content_events', rows: [{
      event_id: 'content-event-1', event_type: 'trade_win', ts: '2026-08-23T00:00:00.000Z', player_id: 'p-1', session_id: 's-1',
      payload: { pnl_shells: 10 }, educational_metadata: {}, content_flags: {}, significance_score: 50,
    }] };
    const first = await jsonBody(await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', body, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env }));
    assert.deepStrictEqual(first.body.receipt, {
      id: 'content-batch-001', operation: 'content.content_events', replayed: false, accepted: 1,
    });
    const replay = await jsonBody(await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', body, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env }));
    assert.strictEqual(replay.body.receipt.replayed, true);
    const missingTimestamp = await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', {
        batch_id: 'content-no-ts-001', table: 'content_events',
        rows: [{ event_id: 'content-event-no-ts', event_type: 'trade_win' }],
      }, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env });
    assert.strictEqual(missingTimestamp.status, 400);
    const bad = await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST',
      { batch_id: 'content-batch-bad', table: 'app_sessions', rows: [{}] }, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env });
    assert.strictEqual(bad.status, 400);
    const shortBatchId = await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST',
      { batch_id: 'short', table: 'content_events', rows: body.rows }, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env });
    assert.strictEqual(shortBatchId.status, 400);
    const bulkRows = Array.from({ length: 100 }, (_, index) => ({
      event_id: `bulk-event-${String(index).padStart(3, '0')}`,
      event_type: 'trade_tick', ts: '2026-08-23T00:00:00.000Z',
      payload: { index }, educational_metadata: {}, content_flags: {},
    }));
    const bulk = await jsonBody(await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', {
        batch_id: 'content-batch-100-rows', table: 'content_events', rows: bulkRows,
      }, { 'CF-Connecting-IP': '203.0.113.22' },
    ), env }));
    assert.strictEqual(bulk.response.status, 200);
    assert.strictEqual(bulk.body.receipt.accepted, 100);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_content_events WHERE event_id LIKE 'bulk-event-%'")[0].n, 100);
    const pipelineBatches = [
      ['content_replays', 'content-replay-batch-001', [{
        replay_id: 'content-replay-001', event_id: 'content-event-1', kind: 'trade', meta: {}, data: { seed: 7 },
      }]],
      ['content_briefs', 'content-brief-batch-001', [{
        brief_key: 'content-brief-001', event_id: 'content-event-1', platforms: ['tiktok'], priority: 10,
      }]],
      ['content_exports', 'content-export-batch-001', [{
        export_key: 'content-export-001', platform: 'general', event_count: 1, filter: {},
      }]],
      ['content_generated', 'content-generated-batch-001', [{
        generated_key: 'content-generated-001', brief_key: 'content-brief-001', platform: 'general',
        body: 'One generated draft.', meta: {}, status: 'draft',
      }]],
    ];
    for (const [table, batchId, rows] of pipelineBatches) {
      const response = await jsonBody(await contentApi.onRequest({ request: request(
        'https://playchartquest.com/api/app/content', 'POST', { batch_id: batchId, table, rows },
        { 'CF-Connecting-IP': '203.0.113.22' },
      ), env }));
      assert.strictEqual(response.response.status, 200, table);
      assert.deepStrictEqual(response.body.receipt, {
        id: batchId, operation: `content.${table}`, replayed: false, accepted: 1,
      });
    }
    for (const table of ['replays', 'briefs', 'exports', 'generated']) {
      assert.strictEqual(sqlite(`SELECT count(*) AS n FROM app_content_${table}`)[0].n, 1, table);
    }
  });

  await test('content logical keys reject in-batch duplicates and cross-batch payload conflicts', async () => {
    const cases = [
      {
        table: 'content_events', key: 'event_id', value: 'integrity-event-001',
        row: {
          event_id: 'integrity-event-001', event_type: 'boss_win', ts: '2026-08-23T03:00:00.000Z',
          payload: { guardian: 1 }, educational_metadata: {}, content_flags: {}, significance_score: 75,
        },
        changed(row) { return { ...row, event_type: 'boss_loss' }; },
      },
      {
        table: 'content_replays', key: 'replay_id', value: 'integrity-replay-001',
        row: { replay_id: 'integrity-replay-001', event_id: 'content-event-1', kind: 'trade', meta: {}, data: { seed: 11 } },
        changed(row) { return { ...row, kind: 'boss' }; },
      },
      {
        table: 'content_briefs', key: 'brief_key', value: 'integrity-brief-001',
        row: { brief_key: 'integrity-brief-001', event_id: 'content-event-1', platforms: ['tiktok'], priority: 20 },
        changed(row) { return { ...row, priority: 21 }; },
      },
      {
        table: 'content_exports', key: 'export_key', value: 'integrity-export-001',
        row: { export_key: 'integrity-export-001', platform: 'general', event_count: 3, filter: { win: true } },
        changed(row) { return { ...row, event_count: 4 }; },
      },
      {
        table: 'content_generated', key: 'generated_key', value: 'integrity-generated-001',
        row: {
          generated_key: 'integrity-generated-001', brief_key: 'content-brief-001', platform: 'general',
          body: 'Immutable original.', meta: { take: 1 }, status: 'draft',
        },
        changed(row) { return { ...row, body: 'Conflicting replacement.' }; },
      },
    ];

    for (const item of cases) {
      const suffix = item.table.replace('content_', '');
      const headers = { 'CF-Connecting-IP': '203.0.113.30' };
      const duplicate = await jsonBody(await contentApi.onRequest({ request: request(
        'https://playchartquest.com/api/app/content', 'POST', {
          batch_id: `duplicate-${suffix}-001`, table: item.table,
          rows: [item.row, item.changed(item.row)],
        }, headers,
      ), env }));
      assert.strictEqual(duplicate.response.status, 400, `${item.table} duplicate batch`);
      assert.strictEqual(duplicate.body.error, 'invalid_content_batch');

      const inserted = await jsonBody(await contentApi.onRequest({ request: request(
        'https://playchartquest.com/api/app/content', 'POST', {
          batch_id: `insert-${suffix}-001`, table: item.table, rows: [item.row],
        }, headers,
      ), env }));
      assert.strictEqual(inserted.response.status, 200, `${item.table} insert`);
      assert.strictEqual(inserted.body.receipt.accepted, 1);

      const equivalentBatch = `equivalent-${suffix}-001`;
      const equivalent = await jsonBody(await contentApi.onRequest({ request: request(
        'https://playchartquest.com/api/app/content', 'POST', {
          batch_id: equivalentBatch, table: item.table, rows: [item.row],
        }, headers,
      ), env }));
      assert.strictEqual(equivalent.response.status, 200, `${item.table} equivalent`);
      assert.deepStrictEqual(equivalent.body.receipt, {
        id: equivalentBatch, operation: `content.${item.table}`, replayed: false, accepted: 1,
      });

      const conflictBatch = `conflict-${suffix}-001`;
      const conflict = await jsonBody(await contentApi.onRequest({ request: request(
        'https://playchartquest.com/api/app/content', 'POST', {
          batch_id: conflictBatch, table: item.table, rows: [item.changed(item.row)],
        }, headers,
      ), env }));
      assert.strictEqual(conflict.response.status, 409, `${item.table} conflict`);
      assert.strictEqual(conflict.body.error, 'content_key_conflict');

      const config = {
        content_events: ['app_content_events', 'event_id'],
        content_replays: ['app_content_replays', 'replay_id'],
        content_briefs: ['app_content_briefs', 'brief_key'],
        content_exports: ['app_content_exports', 'export_key'],
        content_generated: ['app_content_generated', 'generated_key'],
      }[item.table];
      assert.strictEqual(sqlite(`SELECT count(*) AS n FROM ${config[0]} WHERE ${config[1]}=${literal(item.value)}`)[0].n, 1);
      assert.strictEqual(sqlite(`SELECT count(*) AS n FROM app_content_logical_keys WHERE table_name=${literal(item.table)} AND logical_key=${literal(item.value)}`)[0].n, 1);
      assert.strictEqual(sqlite(`SELECT count(*) AS n FROM app_mutation_receipts WHERE receipt_id=${literal(conflictBatch)}`)[0].n, 0);
      assert.strictEqual(sqlite(`SELECT count(*) AS n FROM app_outbox WHERE outbox_id=${literal(conflictBatch)}`)[0].n, 0);
    }

    // Imported or pre-upgrade rows do not yet have a logical-key registry entry.
    // One statement may accept a verified equivalent plus a genuinely new row, but a
    // later conflicting batch must remain fully atomic and must not insert its new row.
    sqlite(`INSERT INTO app_content_events
      (event_id,event_type,ts,payload,educational_metadata,content_flags,
       significance_score,processed_status,ingest_source,created_at)
      VALUES ('legacy-event-001','trade_win','2026-08-20T00:00:00.000Z','{}','{}','{}',
       0,'new','supabase_history','2026-08-20T00:00:00.000Z')`);
    const legacy = {
      event_id: 'legacy-event-001', event_type: 'trade_win', ts: '2026-08-20T00:00:00.000Z',
      payload: {}, educational_metadata: {}, content_flags: {}, significance_score: 0,
    };
    const novel = {
      event_id: 'legacy-partner-001', event_type: 'trade_win', ts: '2026-08-20T00:01:00.000Z',
      payload: {}, educational_metadata: {}, content_flags: {}, significance_score: 0,
    };
    const mixed = await jsonBody(await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', {
        batch_id: 'legacy-equivalent-mixed-001', table: 'content_events', rows: [legacy, novel],
      }, { 'CF-Connecting-IP': '203.0.113.31' },
    ), env }));
    assert.strictEqual(mixed.response.status, 200);
    assert.strictEqual(mixed.body.receipt.accepted, 2);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_content_events WHERE event_id IN ('legacy-event-001','legacy-partner-001')")[0].n, 2);

    const conflict = await jsonBody(await contentApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/content', 'POST', {
        batch_id: 'legacy-conflict-atomic-001', table: 'content_events',
        rows: [{ ...legacy, event_type: 'trade_loss' }, {
          ...novel, event_id: 'must-not-land-001', ts: '2026-08-20T00:02:00.000Z',
        }],
      }, { 'CF-Connecting-IP': '203.0.113.31' },
    ), env }));
    assert.strictEqual(conflict.response.status, 409);
    assert.strictEqual(conflict.body.error, 'content_key_conflict');
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_content_events WHERE event_id='must-not-land-001'")[0].n, 0);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_mutation_receipts WHERE receipt_id='legacy-conflict-atomic-001'")[0].n, 0);
  });

  await test('market endpoint supports quote and candle forms but rejects unlisted symbols before fetch', async () => {
    const bad = await marketApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/market-price?symbol=EVILUSDT&interval=1m&limit=100', 'GET', undefined,
      { 'CF-Connecting-IP': '203.0.113.23' },
    ), env });
    assert.strictEqual(bad.status, 400);
    const cross = await marketApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/market-price?markets=AAPL', 'GET', undefined,
      { Origin: 'https://evil.test', 'Sec-Fetch-Site': 'cross-site', 'CF-Connecting-IP': '203.0.113.23' },
    ), env });
    assert.strictEqual(cross.status, 403);
  });

  await test('imported identity claim preserves the Supabase UUID and consumes a hashed one-time claim', async () => {
    const userId = '042d173b-badd-47c1-9816-63cab103e5e5';
    const createdAt = new Date().toISOString();
    await db.prepare(`INSERT INTO app_identities
      (id,email_normalized,email_original,source_provider,source_subject,status,created_at,updated_at)
      VALUES (?,? ,?,'supabase',?,'pending_claim',?,?)`
    ).bind(userId, 'founder@example.com', 'founder@example.com', userId, createdAt, createdAt).run();
    const issued = await jsonBody(await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data', 'POST', {
        action: 'issue_claim', user_id: userId, expires_hours: 24,
      }, { 'X-Idempotency-Key': 'claim-issue-001', 'CF-Connecting-IP': '203.0.113.24' },
    ), env, data: { access: { sub: 'founder-test-subject' } } }));
    assert.strictEqual(issued.response.status, 201);
    assert.deepStrictEqual(issued.body.receipt, {
      id: 'claim-issue-001', operation: 'account.claim.issue', replayed: false, accepted: 1,
      claim_id: issued.body.claim.claim_id, user_id: userId, expires_at: issued.body.claim.expires_at,
    });
    const claimId = issued.body.claim.claim_id;
    const token = issued.body.claim.claim_token;
    assert.match(token, /^[A-Za-z0-9_-]{40,}$/);
    const storedClaim = sqlite('SELECT claim_token_hash, issued_by_access_sub FROM app_account_claims WHERE claim_id=' + literal(claimId))[0];
    assert.strictEqual(storedClaim.claim_token_hash, await app.sha256Hex(token));
    assert.strictEqual(storedClaim.issued_by_access_sub, 'founder-test-subject');
    assert.notStrictEqual(storedClaim.claim_token_hash, token);
    const issueReplay = await jsonBody(await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data', 'POST', {
        action: 'issue_claim', user_id: userId, expires_hours: 24,
      }, { 'X-Idempotency-Key': 'claim-issue-001', 'CF-Connecting-IP': '203.0.113.24' },
    ), env, data: { access: { sub: 'founder-test-subject' } } }));
    assert.strictEqual(issueReplay.response.status, 200);
    assert.strictEqual(issueReplay.body.claim.claim_token, token);
    assert.strictEqual(issueReplay.body.receipt.replayed, true);
    const result = await jsonBody(await claimApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/claim', 'POST', {
        email: 'founder@example.com', claim_token: token, password: 'new-cloud-password',
      }, { 'X-Idempotency-Key': 'claim-request-001', 'CF-Connecting-IP': '203.0.113.24' },
    ), env }));
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.user.id, userId);
    assert.strictEqual(result.body.receipt.operation, 'account.claim');
    assert.strictEqual(sqlite('SELECT status FROM app_identities WHERE id=' + literal(userId))[0].status, 'active');
    assert(sqlite('SELECT claimed_at FROM app_account_claims WHERE claim_id=' + literal(claimId))[0].claimed_at);
    assert.strictEqual(sqlite('SELECT count(*) AS n FROM app_account_claim_redemptions WHERE claim_id=' + literal(claimId))[0].n, 1);
    assert.throws(() => sqlite(`INSERT INTO app_account_claims
      (claim_id,user_id,claim_token_hash,expires_at,issued_by_access_sub,created_at)
      VALUES ('claim-after-active',${literal(userId)},'${'f'.repeat(64)}','2099-01-01T00:00:00.000Z','founder-test','2026-08-23T00:00:00.000Z')`),
    /account_claim_identity_not_pending/);
    const reused = await claimApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/claim', 'POST', {
        email: 'founder@example.com', claim_token: token, password: 'attacker-password',
      }, { 'X-Idempotency-Key': 'claim-request-002', 'CF-Connecting-IP': '203.0.113.24' },
    ), env });
    assert.strictEqual(reused.status, 400);
  });

  await test('founder seam is Access-gated and excludes credential/session hash datasets', async () => {
    const denied = await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data?dataset=summary', 'GET'), env, data: {},
    });
    assert.strictEqual(denied.status, 403);
    const allowed = await jsonBody(await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data?dataset=summary', 'GET'), env,
      data: { access: { sub: 'founder' } },
    }));
    assert.strictEqual(allowed.response.status, 200);
    assert(allowed.body.summary.counts.identities >= 2);
    assert(!allowed.body.summary.datasets.includes('sessions'));
    assert(!allowed.body.summary.datasets.includes('account_claims'));
    assert(!data.APP_DATASETS.sessions);
    assert(!data.APP_DATASETS.account_claims);
  });

  await test('founder complete snapshot is coherent, bounded and matches the closed catalog', async () => {
    const result = await jsonBody(await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data?dataset=snapshot', 'GET'), env,
      data: { access: { sub: 'founder' } },
    }));
    const expected = Object.keys(data.APP_DATASETS);
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.snapshot.version, 1);
    assert.match(result.body.snapshot.token, /^[a-f0-9]{64}$/);
    assert.deepStrictEqual(result.body.snapshot.datasets, expected);
    assert.deepStrictEqual(Object.keys(result.body.snapshot.rows), expected);
    assert.deepStrictEqual(Object.keys(result.body.snapshot.counts), expected);
    const total = expected.reduce((sum, name) => {
      assert.strictEqual(result.body.snapshot.rows[name].length, result.body.snapshot.counts[name], name);
      return sum + result.body.snapshot.counts[name];
    }, 0);
    assert.strictEqual(result.body.snapshot.total, total);
    assert(!result.body.snapshot.datasets.includes('sessions'));
    assert(!result.body.snapshot.datasets.includes('account_claims'));
  });

  await test('founder page snapshot tokens reject update, insert, and same-count delete/replace races', async () => {
    const founderPage = (dataset, cursor, token) => {
      const url = new URL('https://playchartquest.com/founder/api/app-data');
      url.searchParams.set('dataset', dataset);
      url.searchParams.set('limit', '1');
      url.searchParams.set('cursor', String(cursor));
      if (token) url.searchParams.set('snapshot_token', token);
      return founderApi.onRequest({ request: request(url.toString(), 'GET'), env, data: { access: { sub: 'founder' } } });
    };

    const profileFirst = await jsonBody(await founderPage('profiles', 0));
    assert.strictEqual(profileFirst.body.page.has_more, true);
    assert.match(profileFirst.body.page.snapshot_token, /^[a-f0-9]{64}$/);
    const profileSecondStable = await jsonBody(await founderPage('profiles', 1, profileFirst.body.page.snapshot_token));
    assert.strictEqual(profileSecondStable.response.status, 200);
    assert.strictEqual(profileSecondStable.body.page.snapshot_token, profileFirst.body.page.snapshot_token);
    assert.notStrictEqual(profileSecondStable.body.rows[0].user_id, profileFirst.body.rows[0].user_id);
    sqlite(`UPDATE app_profiles SET shells = shells + 1, version = version + 1,
      updated_at = '2026-08-23T23:00:00.000Z' WHERE user_id = ${literal(identity.id)};`);
    const afterUpdate = await jsonBody(await founderPage('profiles', 1, profileFirst.body.page.snapshot_token));
    assert.strictEqual(afterUpdate.response.status, 409);
    assert.strictEqual(afterUpdate.body.error, 'snapshot_changed');

    sqlite(`INSERT INTO app_bug_reports
      (request_id,player_id,message,context,status,ingest_source,created_at)
      VALUES ('snapshot-seed-001','snapshot-player','seed one','{}','open','cloudflare','2026-08-23T20:00:00.000Z'),
             ('snapshot-delete-001','snapshot-player','delete me','{}','open','cloudflare','2026-08-23T20:01:00.000Z');`);
    const bugBeforeInsert = await jsonBody(await founderPage('bugs', 0));
    sqlite(`INSERT INTO app_bug_reports
      (request_id,player_id,message,context,status,ingest_source,created_at)
      VALUES ('snapshot-insert-001','snapshot-player','insert race','{}','open','cloudflare','2026-08-23T20:02:00.000Z');`);
    const afterInsert = await jsonBody(await founderPage('bugs', 1, bugBeforeInsert.body.page.snapshot_token));
    assert.strictEqual(afterInsert.response.status, 409);
    assert.strictEqual(afterInsert.body.error, 'snapshot_changed');

    const bugBeforeSwap = await jsonBody(await founderPage('bugs', 0));
    const countBeforeSwap = sqlite('SELECT COUNT(*) AS n FROM app_bug_reports')[0].n;
    sqlite(`BEGIN IMMEDIATE;
      DELETE FROM app_bug_reports WHERE request_id = 'snapshot-delete-001';
      INSERT INTO app_bug_reports
        (request_id,player_id,message,context,status,ingest_source,created_at)
        VALUES ('snapshot-replace-001','snapshot-player','replacement race','{}','open','cloudflare','2026-08-23T20:03:00.000Z');
      COMMIT;`);
    assert.strictEqual(sqlite('SELECT COUNT(*) AS n FROM app_bug_reports')[0].n, countBeforeSwap);
    const afterSwap = await jsonBody(await founderPage('bugs', 1, bugBeforeSwap.body.page.snapshot_token));
    assert.strictEqual(afterSwap.response.status, 409);
    assert.strictEqual(afterSwap.body.error, 'snapshot_changed');

    const missingToken = await jsonBody(await founderPage('bugs', 1));
    assert.strictEqual(missingToken.response.status, 400);
    assert.strictEqual(missingToken.body.error, 'invalid_query');
  });

  await test('founder CSV export neutralises spreadsheet formulas', async () => {
    sqlite("UPDATE app_bug_reports SET message='=HYPERLINK(\"https://evil\")' WHERE request_id='bug-request-001';");
    const response = await founderApi.onRequest({ request: request(
      'https://playchartquest.com/founder/api/app-data?dataset=bugs&mode=export&format=csv', 'GET'),
      env, data: { access: { sub: 'founder' } },
    });
    assert.strictEqual(response.status, 200);
    assert.match(await response.text(), /"'=HYPERLINK/);
  });

  await test('session signout revokes the session and returns exact receipt', async () => {
    const fresh = await auth.issueSession(db, identity, request('https://playchartquest.com/', 'GET'));
    const result = await jsonBody(await sessionApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/session', 'DELETE', undefined,
      authHeaders(fresh, 'session-signout-001'),
    ), env }));
    assert.deepStrictEqual(result.body.receipt, {
      id: 'session-signout-001', operation: 'session.signout', replayed: false, accepted: 1,
    });
    const replay = await jsonBody(await sessionApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/session', 'DELETE', undefined,
      authHeaders(fresh, 'session-signout-001'),
    ), env }));
    assert.strictEqual(replay.response.status, 200);
    assert.strictEqual(replay.body.receipt.replayed, true);
    const after = await jsonBody(await sessionApi.onRequest({ request: request(
      'https://playchartquest.com/api/app/session', 'GET', undefined, { Cookie: cookieHeader(fresh) },
    ), env }));
    assert.strictEqual(after.body.user, null);
  });

  await test('migration control plane can record ledger, quarantine and reconciliation without deleting source data', () => {
    const nowIso = new Date().toISOString();
    const digest = 'a'.repeat(64);
    sqlite(`INSERT INTO app_migration_runs
      (run_id,source_provider,source_project_ref,dataset,external_batch_id,source_count,source_digest,status,started_at)
      VALUES ('run-0001','supabase','ymxppzhczvmiuoncuqqu','profiles','batch-1',2,'${digest}','prepared','${nowIso}');
      INSERT INTO app_migration_ledger
      (run_id,source_table,source_pk,source_digest,target_table,target_pk,status,imported_at)
      VALUES ('run-0001','profiles','user-1','${digest}','app_profiles','user-1','imported','${nowIso}');
      INSERT INTO app_migration_quarantine
      (run_id,source_table,source_pk,reason_code,raw_row,created_at)
      VALUES ('run-0001','profiles','bad-1','invalid_profile','{}','${nowIso}');
      INSERT INTO app_migration_reconciliation
      (run_id,dataset,source_count,target_count,quarantine_count,source_digest,target_digest,matched,checked_at)
      VALUES ('run-0001','profiles',2,1,1,'${digest}','${digest}',1,'${nowIso}');`);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_migration_ledger WHERE run_id='run-0001'")[0].n, 1);
    assert.strictEqual(sqlite("SELECT count(*) AS n FROM app_migration_quarantine WHERE run_id='run-0001'")[0].n, 1);
  });

  process.stdout.write(`\n${passed} Cloudflare application-plane tests passed.\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
