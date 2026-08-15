#!/usr/bin/env node
'use strict';

/* Dependency-free contract tests for the Cloudflare beta D1/Pages Functions data plane. */

const assert = require('assert');
const cryptoNode = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chartquest-cloudflare-beta-'));
const RATE_SALT = 'test-only-high-entropy-rate-salt-8d2f3a91';
let passed = 0;

function ingestEnv(db) {
  return { BETA_DB: db, BETA_RATE_SALT: RATE_SALT };
}

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function copyModule(relative) {
  const destination = path.join(temp, relative.replace(/\.js$/, '.mjs'));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const code = source(relative).replace(/(from\s+['"][^'"]+)\.js(['"])/g, '$1.mjs$2');
  fs.writeFileSync(destination, code);
  return destination;
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

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = String(sql).replace(/\s+/g, ' ').trim();
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    this.db.calls.push({ op: 'first', sql: this.sql, args: this.args });
    return { request_count: this.db.rateCount };
  }

  async run() {
    this.db.calls.push({ op: 'run', sql: this.sql, args: this.args });
    return { success: true };
  }

  async all() {
    this.db.calls.push({ op: 'all', sql: this.sql, args: this.args });
    const table = this.sql.includes('FROM beta_surveys') ? 'surveys' : 'events';
    const cursor = Number(this.args[0]);
    const limit = Number(this.args[1]);
    const rows = this.db.rows[table].filter((row) => Number(row.id) > cursor).slice(0, limit);
    return { success: true, results: rows };
  }
}

class FakeDB {
  constructor(options = {}) {
    this.rateCount = Object.prototype.hasOwnProperty.call(options, 'rateCount') ? options.rateCount : 1;
    this.rows = { events: options.events || [], surveys: options.surveys || [] };
    this.calls = [];
    this.batches = [];
  }

  prepare(sql) { return new FakeStatement(this, sql); }

  async batch(statements) {
    this.batches.push(statements.map((statement) => ({ sql: statement.sql, args: statement.args })));
    return statements.map(() => ({ success: true }));
  }
}

function jsonRequest(url, method, body, origin, extraHeaders) {
  const headers = Object.assign({ Origin: origin }, extraHeaders || {});
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return new Request(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function base64url(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return bytes.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signingFixture(nowSeconds) {
  const pair = await cryptoNode.webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const publicJwk = await cryptoNode.webcrypto.subtle.exportKey('jwk', pair.publicKey);
  publicJwk.kid = 'access-key-1';
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  const issuer = 'https://chartquest.cloudflareaccess.com';
  const audience = 'chartquest-founder-audience';

  async function token(overrides, headerOverrides) {
    const header = Object.assign({ alg: 'RS256', typ: 'JWT', kid: publicJwk.kid }, headerOverrides || {});
    const claims = Object.assign({
      iss: issuer,
      aud: [audience],
      sub: 'founder-user',
      email: 'founder@example.invalid',
      iat: nowSeconds - 10,
      exp: nowSeconds + 300,
    }, overrides || {});
    const head = base64url(JSON.stringify(header));
    const body = base64url(JSON.stringify(claims));
    const signature = await cryptoNode.webcrypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' }, pair.privateKey,
      new TextEncoder().encode(`${head}.${body}`),
    );
    return `${head}.${body}.${base64url(Buffer.from(signature))}`;
  }

  const fetcher = async (url) => {
    assert.strictEqual(url, `${issuer}/cdn-cgi/access/certs`);
    return new Response(JSON.stringify({ keys: [publicJwk] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' },
    });
  };
  return { issuer, audience, publicJwk, token, fetcher };
}

function findFile(root, basename) {
  if (!fs.existsSync(root)) return false;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory() && findFile(full, basename)) return true;
    if (entry.isFile() && entry.name === basename) return true;
  }
  return false;
}

(async () => {
  for (const relative of [
    'functions/_lib/beta.js',
    'functions/_lib/access.js',
    'functions/api/beta-ingest.js',
    'functions/founder/_middleware.js',
    'functions/founder/api/beta-data.js',
  ]) copyModule(relative);

  const beta = await import(pathToFileURL(path.join(temp, 'functions/_lib/beta.mjs')).href);
  const access = await import(pathToFileURL(path.join(temp, 'functions/_lib/access.mjs')).href);
  const ingest = await import(pathToFileURL(path.join(temp, 'functions/api/beta-ingest.mjs')).href);
  const middleware = await import(pathToFileURL(path.join(temp, 'functions/founder/_middleware.mjs')).href);
  const betaData = await import(pathToFileURL(path.join(temp, 'functions/founder/api/beta-data.mjs')).href);

  await test('closed event vocabulary is exact', () => {
    assert.deepStrictEqual([...beta.EVENT_NAMES], [
      'session_start', 'session_end', 'return_visit',
      'play_clicked', 'movement_tutorial_completed',
      'tutorial_started', 'tutorial_completed', 'tutorial_step_reached',
      'first_trade_started', 'first_trade_won', 'first_trade_lost',
      'boss_started', 'boss_defeated',
      'journal_unlocked', 'journal_discovery_started',
      'journal_discovery_completed', 'journal_discovery_skipped',
      'beta_completed', 'survey_started', 'survey_submitted', 'crash',
    ]);
  });

  await test('origin allowlist is exact and anchored', () => {
    for (const origin of [
      'https://playchartquest.com', 'https://www.playchartquest.com',
      'https://chartquest.pages.dev', 'https://a1b2c3.chartquest.pages.dev',
      'https://chart-quest-game.netlify.app', 'https://shelltrader.github.io',
      'http://localhost:8788', 'http://127.0.0.1:3000', 'http://[::1]:9999',
    ]) assert.strictEqual(beta.originAllowed(origin), true, origin);
    for (const origin of [
      '', 'https://playchartquest.com.evil.test', 'http://playchartquest.com',
      'http://localhost.evil.test:8788', 'https://chartquest.pages.dev.evil.test',
      'https://UPPER.chartquest.pages.dev', 'https://a_b.chartquest.pages.dev',
    ]) assert.strictEqual(beta.originAllowed(origin), false, origin);
  });

  await test('event and survey shaping preserves caps and rejects unknown rows', () => {
    const now = '2026-08-15T00:00:00.000Z';
    assert.strictEqual(beta.shapeEvent({ event_id: 'e-1', name: 'invented' }, now), null);
    const event = beta.shapeEvent({
      event_id: 'e'.repeat(100), name: 'crash', player_id: 'p'.repeat(80),
      session_id: 's-1',
      props: { message: 'x'.repeat(5000) },
    }, now);
    assert.strictEqual(event.event_id.length, 80);
    assert.strictEqual(event.player_id.length, 64);
    assert.deepStrictEqual(event.props, {});
    assert.strictEqual(event.ts, now);
    const survey = beta.shapeSurvey({
      response_id: 'r-1', player_id: 'p-1', session_id: 's-1',
      q1_rating: 9, q4_continue: 'later', q2_hook: 'the boss',
      q3_improvement: 'more music', seconds_taken: 12,
    });
    assert.strictEqual(survey.q1_rating, 9);
    assert.strictEqual(survey.q4_continue, 'later');
    assert.strictEqual(survey.seconds_taken, 12);
    assert.strictEqual(beta.shapeEvent({ event_id: 'e-2', player_id: '', session_id: 's', name: 'crash' }, now), null);
    assert.strictEqual(beta.shapeSurvey({ response_id: 'r-2', player_id: 'p', session_id: 's' }), null);
  });

  await test('CSV neutralises formulas after whitespace and preserves JSON safely', () => {
    assert.strictEqual(beta.formulaSafe(' =2+2'), "' =2+2");
    assert.strictEqual(beta.formulaSafe('@SUM(A:A)'), "'@SUM(A:A)");
    const csv = beta.rowsToCsv(beta.DATASETS.surveys, [{
      id: 1, response_id: 'r-1', q2_hook: '=HYPERLINK("https://evil")',
    }]);
    assert.match(csv, /"'=HYPERLINK\(""https:\/\/evil""\)"/);
  });

  await test('public ingest is write-only and CORS fails closed', async () => {
    const options = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'OPTIONS', undefined, 'https://playchartquest.com'),
      env: {},
    });
    assert.strictEqual(options.status, 204);
    assert.strictEqual(options.headers.get('Access-Control-Allow-Origin'), 'https://playchartquest.com');
    const denied = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', { kind: 'events', rows: [] }, 'https://playchartquest.com.evil.test'),
      env: ingestEnv(new FakeDB()),
    });
    assert.strictEqual(denied.status, 403);
    assert.strictEqual(denied.headers.get('Access-Control-Allow-Origin'), null);
    const get = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'GET', undefined, 'https://playchartquest.com'),
      env: ingestEnv(new FakeDB()),
    });
    assert.strictEqual(get.status, 405);
    assert.strictEqual(get.headers.get('Allow'), 'POST, OPTIONS');
  });

  await test('event writes are idempotent SQL batches and use BETA_DB', async () => {
    const db = new FakeDB();
    const response = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-1', player_id: 'p-1', session_id: 's-1', name: 'session_start', props: { build: '367' } }],
      }, 'https://playchartquest.com', { 'CF-Connecting-IP': '203.0.113.9' }),
      env: ingestEnv(db),
    });
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(await response.json(), { ok: true, written: 1 });
    assert.strictEqual(db.batches.length, 1);
    assert.match(db.batches[0][0].sql, /ON CONFLICT\(event_id\) DO NOTHING/i);
    assert.strictEqual(db.batches[0][0].args[0], 'e-1');
  });

  await test('survey upsert owns updated_at and Cloudflare source', async () => {
    const db = new FakeDB();
    const response = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'survey', rows: [{
          response_id: 'r-p-1', player_id: 'p-1', session_id: 's-1', q1_rating: 9,
          q2_hook: 'the first win', q3_improvement: 'more music', q4_continue: 'later',
          q5_anything: '', seconds_taken: 42,
        }],
      }, 'https://playchartquest.com', { 'CF-Connecting-IP': '203.0.113.10' }),
      env: ingestEnv(db),
    });
    assert.strictEqual(response.status, 200);
    const statement = db.batches[0][0];
    assert.match(statement.sql, /ON CONFLICT\(response_id\) DO UPDATE SET/i);
    assert.match(statement.sql, /updated_at = excluded\.updated_at/i);
    assert.match(statement.sql, /ingest_source = 'cloudflare'/i);
    assert.strictEqual(statement.args[0], 'r-p-1');
    assert.strictEqual(statement.args[9], statement.args[10]);
  });

  await test('ingest rejects invalid and oversized batches before writing', async () => {
    const db = new FakeDB();
    const invalid = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-1', name: 'unknown' }],
      }, 'https://playchartquest.com'), env: ingestEnv(db),
    });
    assert.strictEqual(invalid.status, 400);
    const tooMany = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: Array.from({ length: 61 }, (_, index) => ({ event_id: `e-${index}`, name: 'crash' })),
      }, 'https://playchartquest.com'), env: ingestEnv(db),
    });
    assert.strictEqual(tooMany.status, 413);
    assert.strictEqual(db.batches.length, 0);
  });

  await test('ingest returns 400 for missing ids and incomplete required survey answers', async () => {
    const db = new FakeDB();
    const missingIds = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-no-player', player_id: '', session_id: null, name: 'crash' }],
      }, 'https://playchartquest.com'), env: ingestEnv(db),
    });
    assert.strictEqual(missingIds.status, 400);
    const incompleteSurvey = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'survey', rows: [{
          response_id: 'r-incomplete', player_id: 'p-1', session_id: 's-1',
          q1_rating: null, q2_hook: '', q3_improvement: 'ok', q4_continue: 'maybe', seconds_taken: null,
        }],
      }, 'https://playchartquest.com'), env: ingestEnv(db),
    });
    assert.strictEqual(incompleteSurvey.status, 400);
    assert.strictEqual(db.batches.length, 0);
  });

  await test('body byte limit is enforced without Content-Length', async () => {
    const huge = JSON.stringify({
      kind: 'events',
      rows: [{ event_id: 'e-huge', player_id: 'p-1', session_id: 's-1', name: 'crash', props: { message: '🐢'.repeat(70000) } }],
    });
    const request = new Request('https://playchartquest.com/api/beta-ingest', {
      method: 'POST', headers: { Origin: 'https://playchartquest.com', 'Content-Type': 'application/json' }, body: huge,
    });
    assert.strictEqual(request.headers.get('Content-Length'), null);
    const response = await ingest.onRequest({ request, env: ingestEnv(new FakeDB()) });
    assert.strictEqual(response.status, 413);
  });

  await test('rate buckets require a secret HMAC and never persist raw or unsalted IP digests', async () => {
    const ip = '203.0.113.77';
    async function bucket(salt, nowMs = 1776384000000) {
      const db = new FakeDB();
      await beta.enforceRateLimit(
        db,
        new Request('https://playchartquest.com/api/beta-ingest', { headers: { 'CF-Connecting-IP': ip } }),
        nowMs,
        { BETA_RATE_SALT: salt },
      );
      return db.calls.find((call) => call.op === 'first').args[0];
    }
    const first = await bucket(RATE_SALT);
    const repeat = await bucket(RATE_SALT);
    const otherSecret = await bucket('different-test-only-rate-salt-a0f34dc2');
    const nextWindow = await bucket(RATE_SALT, 1776384060000);
    const unsalted = cryptoNode.createHash('sha256').update(ip).digest('hex');
    const unsaltedWindow = cryptoNode.createHash('sha256').update(`1776384000:${ip}`).digest('hex');
    assert.strictEqual(first.length, 64);
    assert.strictEqual(first, repeat);
    assert.notStrictEqual(first, otherSecret);
    assert.notStrictEqual(first, nextWindow);
    assert.notStrictEqual(first, unsalted);
    assert.notStrictEqual(first, unsaltedWindow);
    assert.notStrictEqual(first, ip);
  });

  await test('missing BETA_RATE_SALT fails ingest closed', async () => {
    const db = new FakeDB();
    const response = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-no-salt', player_id: 'p-1', session_id: 's-1', name: 'crash' }],
      }, 'https://playchartquest.com'),
      env: { BETA_DB: db },
    });
    assert.strictEqual(response.status, 503);
    assert.strictEqual(db.batches.length, 0);
  });

  await test('ingest rate limit fails closed with retry guidance', async () => {
    const response = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-rate', player_id: 'p-1', session_id: 's-1', name: 'crash' }],
      }, 'https://playchartquest.com'),
      env: ingestEnv(new FakeDB({ rateCount: 121 })),
    });
    assert.strictEqual(response.status, 429);
    assert.strictEqual(response.headers.get('Retry-After'), '60');
  });

  await test('missing rate-limit acknowledgement fails closed as service unavailable', async () => {
    const response = await ingest.onRequest({
      request: jsonRequest('https://playchartquest.com/api/beta-ingest', 'POST', {
        kind: 'events', rows: [{ event_id: 'e-rate-null', player_id: 'p-1', session_id: 's-1', name: 'crash' }],
      }, 'https://playchartquest.com'),
      env: ingestEnv(new FakeDB({ rateCount: null })),
    });
    assert.strictEqual(response.status, 503);
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const signing = await signingFixture(nowSeconds);
  const accessEnv = { CF_ACCESS_ISSUER: signing.issuer, CF_ACCESS_AUD: signing.audience };

  await test('Cloudflare Access validates RS256 signature, issuer, audience and expiry', async () => {
    access.clearAccessKeyCacheForTests();
    const validToken = await signing.token();
    const identity = await access.validateAccessJwt(validToken, accessEnv, {
      nowMs: nowSeconds * 1000, fetcher: signing.fetcher,
    });
    assert.strictEqual(identity.sub, 'founder-user');
    await assert.rejects(
      () => access.validateAccessJwt(validToken, { CF_ACCESS_ISSUER: 'https://evil.test', CF_ACCESS_AUD: signing.audience }, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher }),
      /issuer/i,
    );
    await assert.rejects(
      () => signing.token({ aud: 'wrong' }).then((value) => access.validateAccessJwt(value, accessEnv, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher })),
      /audience/i,
    );
    await assert.rejects(
      () => signing.token({ exp: nowSeconds - 1 }).then((value) => access.validateAccessJwt(value, accessEnv, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher })),
      /expired/i,
    );
    await assert.rejects(
      () => signing.token({}, { alg: 'HS256' }).then((value) => access.validateAccessJwt(value, accessEnv, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher })),
      /unsupported/i,
    );
  });

  await test('Cloudflare Access rejects tampering and missing configuration', async () => {
    access.clearAccessKeyCacheForTests();
    const validToken = await signing.token();
    const parts = validToken.split('.');
    const tamperedBody = base64url(JSON.stringify({
      iss: signing.issuer, aud: [signing.audience], sub: 'attacker', exp: nowSeconds + 300,
    }));
    await assert.rejects(
      () => access.validateAccessJwt(`${parts[0]}.${tamperedBody}.${parts[2]}`, accessEnv, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher }),
      /signature/i,
    );
    await assert.rejects(
      () => access.validateAccessJwt(validToken, {}, { nowMs: nowSeconds * 1000, fetcher: signing.fetcher }),
      /not configured/i,
    );
  });

  await test('founder middleware denies without Access and passes verified identity', async () => {
    const denied = await middleware.onRequest({
      request: new Request('https://playchartquest.com/founder', {
        headers: { 'Cf-Access-Authenticated-User-Email': 'spoofed@example.invalid' },
      }), env: {}, data: {},
      next: () => { throw new Error('must not run'); },
    });
    assert.strictEqual(denied.status, 403);
    assert.match(denied.headers.get('Cache-Control'), /no-store/);

    access.clearAccessKeyCacheForTests();
    const oldFetch = global.fetch;
    global.fetch = signing.fetcher;
    try {
      const context = {
        request: new Request('https://playchartquest.com/founder', {
          headers: { 'Cf-Access-Jwt-Assertion': await signing.token() },
        }),
        env: accessEnv, data: {},
        next() { return new Response('founder-ok'); },
      };
      const allowed = await middleware.onRequest(context);
      assert.strictEqual(await allowed.text(), 'founder-ok');
      assert.match(allowed.headers.get('Cache-Control'), /no-store/);
      assert.strictEqual(allowed.headers.get('Vary'), '*', 'old cache-first workers must be unable to persist founder responses');
      assert.strictEqual(allowed.headers.get('X-Frame-Options'), 'DENY');
      assert.strictEqual(allowed.headers.get('Referrer-Policy'), 'no-referrer');
      assert.match(allowed.headers.get('Permissions-Policy'), /camera=\(\)/);
      assert.match(allowed.headers.get('Strict-Transport-Security'), /includeSubDomains/);
      assert.match(allowed.headers.get('Content-Security-Policy'), /default-src 'self'/);
      assert.match(allowed.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
      assert.doesNotMatch(allowed.headers.get('Content-Security-Policy'), /script-src[^;]*unsafe-inline/,
        'founder scripts must remain external and non-inline');
      assert.strictEqual(context.data.access.email, 'founder@example.invalid');
    } finally { global.fetch = oldFetch; }
  });

  const eventRows = [
    { id: 1, event_id: 'e-1', player_id: 'p-1', session_id: 's-1', name: 'session_start', ts: '2026-08-15T00:00:00Z', props: '{"build":"367"}', device: 'mobile', browser: 'Safari', os: 'iOS', screen: '390x844', viewport: '390x700', created_at: '2026-08-15T00:00:01Z' },
    { id: 2, event_id: 'e-2', player_id: 'p-1', session_id: 's-1', name: 'boss_defeated', ts: '2026-08-15T00:10:00Z', props: '{}', device: 'mobile', browser: 'Safari', os: 'iOS', screen: '390x844', viewport: '390x700', created_at: '2026-08-15T00:10:01Z' },
  ];
  const surveyRows = [{
    id: 1, response_id: 'r-p-1', player_id: 'p-1', session_id: 's-1', q1_rating: 9,
    q2_hook: '=HYPERLINK("https://evil.test")', q3_improvement: '+CMD', q4_continue: 'later',
    q5_anything: '@SUM(A:A)', seconds_taken: 42, created_at: '2026-08-15T00:11:00Z',
    updated_at: '2026-08-15T00:11:00Z', ingest_source: 'cloudflare',
  }];

  await test('raw founder API fails closed without middleware identity', async () => {
    const response = await betaData.onRequest({
      request: new Request('https://playchartquest.com/founder/api/beta-data?dataset=events'),
      env: { BETA_DB: new FakeDB({ events: eventRows }) }, data: {},
    });
    assert.strictEqual(response.status, 403);
  });

  await test('raw founder JSON API paginates deterministically and parses props', async () => {
    const response = await betaData.onRequest({
      request: new Request('https://playchartquest.com/founder/api/beta-data?dataset=events&limit=1'),
      env: { BETA_DB: new FakeDB({ events: eventRows }) }, data: { access: { sub: 'founder' } },
    });
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    const body = await response.json();
    assert.strictEqual(body.rows.length, 1);
    assert.deepStrictEqual(body.rows[0].props, { build: '367' });
    assert.deepStrictEqual(body.page, { limit: 1, count: 1, next_cursor: 1, has_more: true });
  });

  await test('founder CSV and JSON exports are complete, private and formula-safe', async () => {
    const db = new FakeDB({ surveys: surveyRows });
    const csvResponse = await betaData.onRequest({
      request: new Request('https://playchartquest.com/founder/api/beta-data?dataset=surveys&mode=export&format=csv'),
      env: { BETA_DB: db }, data: { access: { sub: 'founder' } },
    });
    assert.strictEqual(csvResponse.status, 200);
    assert.match(csvResponse.headers.get('Content-Disposition'), /attachment/);
    assert.match(csvResponse.headers.get('Cache-Control'), /no-store/);
    const csv = await csvResponse.text();
    assert.match(csv, /"'=HYPERLINK\(""https:\/\/evil\.test""\)"/);
    assert.match(csv, /"'\+CMD"/);
    assert.match(csv, /"'@SUM\(A:A\)"/);

    const jsonResponse = await betaData.onRequest({
      request: new Request('https://playchartquest.com/founder/api/beta-data?dataset=surveys&mode=export&format=json'),
      env: { BETA_DB: new FakeDB({ surveys: surveyRows }) }, data: { access: { sub: 'founder' } },
    });
    const body = await jsonResponse.json();
    assert.strictEqual(body.count, 1);
    assert.strictEqual(body.rows[0].q2_hook, '=HYPERLINK("https://evil.test")');
  });

  await test('read API rejects invalid dataset, cursor, limit, and mutation methods', async () => {
    const context = (query, method = 'GET') => ({
      request: new Request(`https://playchartquest.com/founder/api/beta-data?${query}`, { method }),
      env: { BETA_DB: new FakeDB() }, data: { access: { sub: 'founder' } },
    });
    assert.strictEqual((await betaData.onRequest(context('dataset=profiles'))).status, 400);
    assert.strictEqual((await betaData.onRequest(context('dataset=events&cursor=-1'))).status, 400);
    assert.strictEqual((await betaData.onRequest(context('dataset=events&limit=501'))).status, 400);
    assert.strictEqual((await betaData.onRequest(context('dataset=events', 'POST'))).status, 405);
  });

  await test('D1 schema and Pages route manifest lock the intended surface', () => {
    const sql = source('cloudflare/migrations/0001_beta.sql');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS beta_events/i);
    assert.match(sql, /event_id\s+TEXT NOT NULL UNIQUE/i);
    assert.match(sql, /player_id\s+TEXT NOT NULL/i);
    assert.match(sql, /session_id\s+TEXT NOT NULL/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS beta_surveys/i);
    assert.match(sql, /updated_at\s+TEXT NOT NULL/i);
    assert.match(sql, /q1_rating\s+INTEGER NOT NULL/i);
    assert.match(sql, /history_cannot_overwrite_cloudflare/i);
    assert.match(sql, /NEW\.ingest_source = 'supabase_history'/i);
    assert.match(sql, /BETA_RATE_SALT/);
    const routes = JSON.parse(source('website/_routes.json'));
    assert.deepStrictEqual(routes.include, ['/api/beta-ingest', '/founder', '/founder/*']);
    assert.deepStrictEqual(routes.exclude, []);
    assert.strictEqual(findFile(path.join(ROOT, 'website'), 'beta-data.json'), false);
  });

  await test('new data-plane files contain no Supabase dependency', () => {
    for (const relative of [
      'functions/_lib/beta.js', 'functions/_lib/access.js',
      'functions/api/beta-ingest.js', 'functions/founder/_middleware.js',
      'functions/founder/api/beta-data.js', 'cloudflare/migrations/0001_beta.sql',
      'website/_routes.json',
    ]) assert.doesNotMatch(source(relative), /supabase\.co|SUPABASE_URL|supabase-js/i, relative);
  });

  process.stdout.write(`\n${passed} Cloudflare beta contract tests passed.\n`);
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
}).finally(() => {
  fs.rmSync(temp, { recursive: true, force: true });
});
