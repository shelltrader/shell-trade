#!/usr/bin/env node
'use strict';

/* Dependency-free contract tests for the staged Cloudflare-only app-data adapter. */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CLIENT = path.join(ROOT, 'website', 'assets', 'cq-cloud-data.js');
const SOURCE = fs.readFileSync(CLIENT, 'utf8');
const QUEUE_KEY = 'cq_cloud_data_queue_v1';

const SENTINELS = Object.freeze({
  cq_pid: 'p-beta-preserved',
  cq_player_v1: JSON.stringify({ shells: 321, level: 3, xp: 45, extra: 'keep' }),
  shellTradeJournal_v1: JSON.stringify([{ id: 7, result: 'win', created_at: '2026-08-15T01:00:00.000Z' }]),
  shellTradeNotes_v1: JSON.stringify([{ id: 4, text: 'keep me', created_at: '2026-08-15T02:00:00.000Z' }]),
  shellTradeDaily_v1: JSON.stringify({ streak: 3, best: 5, lastDate: '2026-08-15' }),
  cq_mastery_v1: JSON.stringify({ Trend: { mg: 20, boss: 40, trade: 60, lesson: 80 } }),
  cq_played: '1',
  cq_faction: 'BTC',
  cq_content_events_v1: JSON.stringify([{ event_id: 'old-event' }]),
  cq_content_queue_v1: JSON.stringify([{ qid: 'old-content-write' }]),
  shellTradeUnrelated_v9: 'must survive'
});

function makeStorage(seed = {}) {
  const data = new Map(Object.entries(seed).map(([key, value]) => [String(key), String(value)]));
  const removed = [];
  const writes = [];
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { writes.push({ key: String(key), value: String(value) }); data.set(String(key), String(value)); },
    removeItem(key) { removed.push(String(key)); data.delete(String(key)); },
    clear() { for (const key of data.keys()) removed.push(key); data.clear(); },
    key(index) { return Array.from(data.keys())[index] ?? null; },
    get length() { return data.size; },
    snapshot() { return Object.fromEntries(data); },
    removed,
    writes
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function htmlResponse(status = 200) {
  return new Response('<!doctype html><title>not an API receipt</title>', {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function requestBody(call) {
  return call.request.body ? JSON.parse(String(call.request.body)) : null;
}

function requestId(call) {
  return call.request.headers['X-Idempotency-Key'];
}

function receiptFor(call, operation, accepted, extra = {}) {
  return jsonResponse({
    ok: true,
    receipt: { id: requestId(call), operation, replayed: false, accepted, ...extra }
  });
}

function makeHarness(options = {}) {
  const calls = [];
  const localStorage = makeStorage(options.localStorage || {});
  const fetchPlan = Array.from(options.fetchPlan || []);
  const timers = [];
  const listeners = new Map();
  const documentListeners = new Map();
  let idSeq = 0;
  let timerSeq = 0;

  function addListener(registry, type, fn) {
    const list = registry.get(type) || [];
    list.push(fn);
    registry.set(type, list);
  }

  function fakeFetch(url, request = {}) {
    const call = { url: String(url), request };
    calls.push(call);
    const outcome = fetchPlan.length ? fetchPlan.shift() : (options.fetch || new Error('planned offline'));
    if (outcome instanceof Error) return Promise.reject(outcome);
    if (typeof outcome === 'function') {
      try { return Promise.resolve(outcome(call)); } catch (error) { return Promise.reject(error); }
    }
    return Promise.resolve(outcome);
  }

  const context = {
    console,
    Date,
    Math,
    JSON,
    Promise,
    Object,
    Array,
    String,
    Number,
    RegExp,
    encodeURIComponent,
    localStorage,
    crypto: { randomUUID() { idSeq += 1; return `test-${String(idSeq).padStart(4, '0')}`; } },
    navigator: { onLine: true },
    location: { pathname: '/play', href: 'https://playchartquest.com/play' },
    document: {
      referrer: 'https://playchartquest.com/',
      visibilityState: 'visible',
      addEventListener(type, fn) { addListener(documentListeners, type, fn); }
    },
    fetch: fakeFetch,
    addEventListener(type, fn) { addListener(listeners, type, fn); },
    setTimeout(fn, ms = 0) {
      const id = ++timerSeq;
      timers.push({ id, fn, ms: Number(ms) || 0 });
      return id;
    },
    clearTimeout(id) {
      const index = timers.findIndex(timer => timer.id === id);
      if (index >= 0) timers.splice(index, 1);
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: CLIENT });

  return { context, api: context.CQCloudData, calls, localStorage, timers, listeners, documentListeners };
}

function assertSentinelsPreserved(harness) {
  for (const [key, value] of Object.entries(SENTINELS)) {
    assert.equal(harness.localStorage.getItem(key), value, `${key} changed`);
    assert.ok(!harness.localStorage.removed.includes(key), `${key} was removed`);
  }
}

function queuedRaw(harness) {
  return harness.localStorage.getItem(QUEUE_KEY);
}

function queued(harness) {
  return JSON.parse(queuedRaw(harness) || '[]');
}

function sessionResponse() {
  return jsonResponse({ ok: true, user: { id: 'u-1', email: 'tester@example.com' }, csrf_token: 'csrf-1', expires_at: '2026-08-24T00:00:00.000Z' });
}

const tests = [
  ['adapter is same-origin only and exposes the complete production surface', async () => {
    assert.doesNotMatch(SOURCE, /supabase|supabase-js|\.supabase\.co/i);
    const h = makeHarness();
    assert.equal(h.api.version, '1.0.0');
    for (const endpoint of Object.values(h.api.endpoints)) assert.match(endpoint, /^\/api\/app\//);
    assert.deepEqual(
      Object.keys(h.api.localKeys).sort(),
      ['mastery', 'notes', 'playerId', 'profile', 'streak', 'trades']
    );
    for (const pathParts of [
      ['account', 'session'], ['account', 'signIn'], ['account', 'create'], ['account', 'claim'], ['account', 'signOut'],
      ['profile', 'push'], ['profile', 'pull'], ['profile', 'bootstrap'],
      ['journal', 'pushSnapshot'], ['journal', 'pullSnapshot'],
      ['streak', 'push'], ['streak', 'pull'], ['mastery', 'push'], ['mastery', 'pull'],
      ['bugs', 'report'], ['visits', 'record'], ['content', 'pushBatch'], ['markets', 'price'], ['markets', 'quotes']
    ]) assert.equal(typeof h.api[pathParts[0]][pathParts[1]], 'function', pathParts.join('.'));
  }],

  ['landed Pages handlers match every adapter method, payload wrapper, and receipt operation', async () => {
    const contracts = [
      ['account', /request\.method !== 'POST'/, /operation: 'account\.create'/],
      ['claim', /request\.method !== 'POST'/, /operation: 'account\.claim'/],
      ['profile', /request\.method === 'PUT'/, /'profile\.bootstrap'/, /'profile\.put'/, /expectedVersion/, /profile:/],
      ['journal', /request\.method === 'PUT'/, /operation: 'journal\.put'/, /ok: true, journal/],
      ['streak', /request\.method === 'PUT'/, /operation: 'streak\.put'/, /streak:/],
      ['mastery', /request\.method === 'PUT'/, /operation: 'mastery\.put'/, /mastery:/],
      ['bug', /request\.method !== 'POST'/, /operation: 'bug\.create'/],
      ['visit', /request\.method !== 'POST'/, /operation: 'visit\.create'/],
      ['content', /request\.method !== 'POST'/, /content\.\$\{shaped\.table\}/]
    ];
    for (const [name, ...patterns] of contracts) {
      const file = path.join(ROOT, 'functions', 'api', 'app', `${name}.js`);
      assert.ok(fs.existsSync(file), `missing ${name} handler`);
      const source = fs.readFileSync(file, 'utf8');
      for (const pattern of patterns) assert.match(source, pattern, `${name} contract drifted: ${pattern}`);
    }
    const session = fs.readFileSync(path.join(ROOT, 'functions', 'api', 'app', 'session.js'), 'utf8');
    assert.match(session, /method === 'GET'/);
    assert.match(session, /method === 'POST'/);
    assert.match(session, /method === 'DELETE'/);
    assert.match(session, /operation: 'session\.signout'/);
    const market = fs.readFileSync(path.join(ROOT, 'functions', 'api', 'app', 'market-price.js'), 'utf8');
    assert.match(market, /searchParams\.get\('markets'\)/);
    assert.match(market, /searchParams\.has\('symbol'\)/);
    assert.match(market, /\{ ok: true, market \}/);
  }],

  ['offline writes fail open for play, fail closed for success UI, and preserve every existing save key', async () => {
    const h = makeHarness({ localStorage: SENTINELS });
    const before = h.api.localSnapshot();
    const bug = await h.api.bugs.report('Finn froze', { level: 2 });
    const visit = await h.api.visits.record();
    const content = await h.api.content.pushBatch('content_events', [{ event_id: 'e-1' }]);
    const profile = await h.api.profile.push();

    assert.equal(bug.ok, false, 'bug thank-you UI must not fire before a receipt');
    assert.equal(bug.confirmed, false);
    assert.equal(bug.queued, true);
    assert.equal(bug.playable, true);
    for (const result of [visit, content]) {
      assert.equal(result.ok, false);
      assert.equal(result.playable, true, 'cloud failure must not block gameplay');
      assert.equal(result.queued, true);
    }
    assert.equal(profile.ok, false);
    assert.equal(profile.playable, true);
    assert.equal(profile.queued, false, 'guest-only progress stays local instead of filling an authenticated queue');
    assert.equal(profile.code, 'account_required');
    assert.deepEqual(h.api.localSnapshot(), before);
    assert.equal(h.api.queueStatus().count, 3, 'every accepted public operation remains durable');
    assertSentinelsPreserved(h);
  }],

  ['a known signed-in player keeps an offline profile write durably queued', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [sessionResponse(), new Error('connection lost')]
    });
    await h.api.account.session();
    const result = await h.api.profile.push(undefined, { expected_version: 0 });
    assert.equal(result.ok, false);
    assert.equal(result.playable, true);
    assert.equal(result.queued, true);
    assert.deepEqual(queued(h).map(entry => entry.operation), ['profile.put']);
    assertSentinelsPreserved(h);
  }],

  ['HTML, wrong IDs, wrong operations, and wrong accepted counts never acknowledge a write', async () => {
    const responders = [
      () => htmlResponse(),
      call => jsonResponse({ ok: true, receipt: { id: 'wrong-id', operation: 'bug.create', accepted: 1 } }),
      call => jsonResponse({ ok: true, receipt: { id: requestId(call), operation: 'visit.create', accepted: 1 } }),
      call => jsonResponse({ ok: true, receipt: { id: requestId(call), operation: 'bug.create', accepted: 2 } })
    ];
    for (const responder of responders) {
      const h = makeHarness({ localStorage: SENTINELS, fetchPlan: [responder] });
      const result = await h.api.bugs.report('receipt test');
      assert.equal(result.ok, false);
      assert.equal(result.confirmed, false);
      assert.equal(queued(h).length, 1);
      assert.equal(queued(h)[0].operation, 'bug.create');
      assertSentinelsPreserved(h);
    }
  }],

  ['an exact public receipt alone clears the matching operation', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [call => receiptFor(call, 'bug.create', 1)]
    });
    const result = await h.api.bugs.report('The box was unreachable', { level: 1 });
    assert.equal(result.ok, true);
    assert.equal(result.confirmed, true);
    assert.equal(result.receipt.operation, 'bug.create');
    assert.equal(h.api.queueStatus().count, 0);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, '/api/app/bug');
    assert.equal(h.calls[0].request.credentials, 'same-origin');
    assert.equal(requestBody(h.calls[0]).request_id, requestId(h.calls[0]));
    assertSentinelsPreserved(h);
  }],

  ['authenticated writes use the cookie session, CSRF token, idempotency key, and normalized local profile', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        sessionResponse(),
        jsonResponse({ ok: true, profile: { shells: 0, player_level: 1, xp: 0, version: 5, bootstrap_available: false } }),
        call => receiptFor(call, 'profile.put', 1)
      ]
    });
    const checked = await h.api.account.session();
    const pulled = await h.api.profile.pull();
    const result = await h.api.profile.push();
    assert.equal(checked.ok, true);
    assert.equal(pulled.ok, true);
    assert.equal(h.api.isSignedIn(), true);
    assert.equal(result.ok, true);
    assert.deepEqual(h.calls.map(call => [call.request.method, call.url]), [
      ['GET', '/api/app/session'], ['GET', '/api/app/profile'], ['PUT', '/api/app/profile']
    ]);
    const write = h.calls[2];
    assert.equal(write.request.headers['X-CSRF-Token'], 'csrf-1');
    assert.match(write.request.headers['X-Idempotency-Key'], /^write-test-/);
    assert.deepEqual(requestBody(write), { shells: 321, player_level: 3, xp: 45, expected_version: 5 });
    assertSentinelsPreserved(h);
  }],

  ['new account local progress uses the distinct one-time bootstrap receipt', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        call => jsonResponse({
          ok: true,
          user: { id: 'u-bootstrap', email: 'new@example.com' }, csrf_token: 'csrf-bootstrap',
          receipt: { id: requestId(call), operation: 'account.create', accepted: 1, replayed: false }
        }),
        call => receiptFor(call, 'profile.bootstrap', 1, { version: 1 })
      ]
    });
    assert.equal(await h.api.account.create('new@example.com', 'strong-password', true).then(result => result.ok), true);
    const bootstrapped = await h.api.profile.bootstrap();
    assert.equal(bootstrapped.ok, true);
    const write = h.calls[1];
    assert.equal(write.url, '/api/app/profile');
    assert.deepEqual(requestBody(write), {
      shells: 321, player_level: 3, xp: 45, expected_version: 0, bootstrap: true
    });
    assert.equal(bootstrapped.receipt.operation, 'profile.bootstrap');
    assertSentinelsPreserved(h);
  }],

  ['offline profile writes reserve sequential expected versions in their account lane', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [sessionResponse()],
      fetch: new Error('offline')
    });
    await h.api.account.session();
    const first = await h.api.profile.push({ shells: 10, level: 1, xp: 1 }, { expected_version: 0 });
    const second = await h.api.profile.push({ shells: 11, level: 1, xp: 2 });
    assert.equal(first.queued, true);
    assert.equal(second.queued, true);
    assert.deepEqual(queued(h).map(entry => entry.body.expected_version), [0, 1]);
    assert.ok(queued(h).every(entry => entry.user_id === 'u-1'));
    assertSentinelsPreserved(h);
  }],

  ['journal pull pages a complete pinned version and the next push never implies deletion', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        sessionResponse(),
        jsonResponse({ ok: true, journal: {
          version: 7, trades: [{ trade_id: 'remote-1', trade_data: { id: 'remote-1' } }],
          notes: [{ note_id: 'remote-note-1', note_data: { id: 'remote-note-1' } }],
          page: { trade_has_more: false, trade_next_cursor: null, note_has_more: true, note_next_cursor: 1 }
        } }),
        jsonResponse({ ok: true, journal: {
          version: 7, trades: [], notes: [{ note_id: 'remote-note-2', note_data: { id: 'remote-note-2' } }],
          page: { trade_has_more: false, trade_next_cursor: null, note_has_more: false, note_next_cursor: null }
        } }),
        call => receiptFor(call, 'journal.put', 2, { version: 8, tombstoned: 0 })
      ]
    });
    await h.api.account.session();
    const pulled = await h.api.journal.pullSnapshot();
    const pushed = await h.api.journal.pushSnapshot();
    assert.equal(pulled.ok, true);
    assert.equal(pulled.data.trades.length, 1);
    assert.equal(pulled.data.notes.length, 2);
    assert.equal(pushed.ok, true);
    const write = h.calls.find(call => call.url === '/api/app/journal' && call.request.method === 'PUT');
    const body = requestBody(write);
    assert.equal(body.base_version, 7);
    assert.equal(body.trades.length, 1);
    assert.equal(body.notes.length, 1);
    assert.equal(body.trades[0].trade_id, '7');
    assert.equal(body.notes[0].note_id, '4');
    assert.deepEqual(body.delete_trade_ids, []);
    assert.deepEqual(body.delete_note_ids, []);
    assert.match(h.calls[2].url, /version=7/);
    assert.match(h.calls[2].url, /trade_cursor=1/);
    assert.match(h.calls[2].url, /note_cursor=1/);
    assert.equal(h.calls.filter(call => call.request.method === 'PUT' && call.url === '/api/app/journal').length, 1);
    assertSentinelsPreserved(h);
  }],

  ['large journal changes are safely chunked while an empty mastery snapshot stays local', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [sessionResponse()],
      fetch(call) {
        const body = requestBody(call);
        return receiptFor(call, 'journal.put', body.trades.length + body.notes.length +
          body.delete_trade_ids.length + body.delete_note_ids.length,
        { version: body.base_version + 1, tombstoned: body.delete_trade_ids.length + body.delete_note_ids.length });
      }
    });
    await h.api.account.session();
    const trades = Array.from({ length: 201 }, (_, index) => ({ id: index + 1 }));
    const journal = await h.api.journal.pushSnapshot({ trades, notes: [], base_version: 0 });
    const mastery = await h.api.mastery.push({});
    assert.equal(journal.ok, true);
    assert.equal(journal.receipts.length, 2);
    assert.equal(mastery.code, 'mastery_rows_invalid');
    assert.equal(mastery.queued, false);
    assert.equal(h.api.queueStatus().count, 0);
    const writes = h.calls.filter(call => call.url === '/api/app/journal');
    assert.deepEqual(writes.map(call => requestBody(call).trades.length), [200, 1]);
    assert.deepEqual(writes.map(call => requestBody(call).base_version), [0, 1]);
    assertSentinelsPreserved(h);
  }],

  ['oversized legacy journal IDs are shortened deterministically before queueing', async () => {
    const longTradeId = `trade-${'x'.repeat(140)}`;
    const longNoteId = `note-${'y'.repeat(140)}`;
    const requests = [];
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [sessionResponse()],
      fetch(call) {
        const body = requestBody(call);
        requests.push(body);
        return receiptFor(call, 'journal.put', body.trades.length + body.notes.length, {
          version: body.base_version + 1, tombstoned: 0
        });
      }
    });
    await h.api.account.session();
    const snapshot = {
      trades: [{ id: longTradeId, result: 'win' }],
      notes: [{ id: longNoteId, text: 'bounded' }],
      base_version: 0
    };
    assert.equal((await h.api.journal.pushSnapshot(snapshot)).ok, true);
    assert.equal((await h.api.journal.pushSnapshot({ ...snapshot, base_version: 1 })).ok, true);
    assert.equal(requests.length, 2);
    const firstTradeId = requests[0].trades[0].trade_id;
    const firstNoteId = requests[0].notes[0].note_id;
    assert.ok(firstTradeId.length <= 100);
    assert.ok(firstNoteId.length <= 100);
    assert.match(firstTradeId, /^local-trade-/);
    assert.match(firstNoteId, /^local-note-/);
    assert.equal(requests[1].trades[0].trade_id, firstTradeId);
    assert.equal(requests[1].notes[0].note_id, firstNoteId);
    assertSentinelsPreserved(h);
  }],

  ['205 content rows are queued all-or-none and confirmed as bounded 100/100/5 batches', async () => {
    const rows = Array.from({ length: 205 }, (_, index) => ({ event_id: `e-${index}`, event_type: 'trade_win' }));
    const h = makeHarness({
      localStorage: SENTINELS,
      fetch: call => receiptFor(call, 'content.content_events', requestBody(call).rows.length)
    });
    const result = await h.api.content.pushBatch('content_events', rows);
    assert.equal(result.ok, true);
    assert.equal(result.receipts.length, 3);
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [100, 100, 5]);
    assert.equal(new Set(h.calls.map(call => requestBody(call).batch_id)).size, 3);
    assert.ok(h.calls.every(call => requestBody(call).batch_id === requestId(call)));
    assert.equal(h.api.queueStatus().count, 0);
    assertSentinelsPreserved(h);
  }],

  ['a failed lane keeps every row while an independent lane can still drain', async () => {
    let bugAttempts = 0;
    const h = makeHarness({
      localStorage: SENTINELS,
      fetch(call) {
        if (call.url === '/api/app/bug') { bugAttempts += 1; return jsonResponse({ error: 'planned' }, 503); }
        if (call.url === '/api/app/visit') return receiptFor(call, 'visit.create', 1);
        throw new Error(`unexpected ${call.url}`);
      }
    });
    const bug = await h.api.bugs.report('offline lane');
    const visit = await h.api.visits.record();
    assert.equal(bug.ok, false);
    assert.equal(visit.ok, true, 'a stuck bug lane must not block visit collection');
    assert.ok(bugAttempts >= 2);
    assert.deepEqual(queued(h).map(entry => entry.operation), ['bug.create']);
    assertSentinelsPreserved(h);
  }],

  ['a content-key conflict stays queued until an exact accepted receipt exists', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetch: call => call.url === '/api/app/content'
        ? jsonResponse({ error: 'content_key_conflict', message: 'logical key changed' }, 409)
        : Promise.reject(new Error(`unexpected ${call.url}`))
    });
    const result = await h.api.content.pushBatch('content_events', [{
      event_id: 'conflicting-event-001', event_type: 'trade_win', ts: '2026-08-23T00:00:00.000Z'
    }]);
    assert.equal(result.ok, false);
    assert.equal(result.queued, true);
    assert.equal(h.api.queueStatus().count, 1);
    assert.equal(queued(h)[0].operation, 'content.content_events');
    assert.equal(queued(h)[0].body.rows[0].event_id, 'conflicting-event-001');
    assertSentinelsPreserved(h);
  }],

  ['bounded queue applies explicit backpressure without deleting any previously queued operation', async () => {
    const full = Array.from({ length: 512 }, (_, index) => ({
      id: `held-${index}`,
      endpoint: '/api/app/visit',
      method: 'POST',
      operation: 'visit.create',
      expected: 1,
      auth: false,
      lane: 'visit',
      body: { visit_id: `held-${index}` },
      created_at: '2026-08-15T00:00:00.000Z',
      attempts: 0
    }));
    const raw = JSON.stringify(full);
    const h = makeHarness({ localStorage: { ...SENTINELS, [QUEUE_KEY]: raw } });
    const result = await h.api.visits.record();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'queue_full');
    assert.equal(result.queued, false);
    assert.equal(queuedRaw(h), raw, 'backpressure must leave the full queue byte-for-byte intact');
    assert.equal(h.calls.length, 0);
    assertSentinelsPreserved(h);
  }],

  ['a corrupt queue is never overwritten and credentials are never persisted for later retry', async () => {
    const corrupt = '{not-json';
    const h = makeHarness({
      localStorage: { ...SENTINELS, [QUEUE_KEY]: corrupt },
      fetchPlan: [htmlResponse()]
    });
    const visit = await h.api.visits.record();
    const signIn = await h.api.account.signIn('tester@example.com', 'secret-password');
    assert.equal(visit.code, 'queue_corrupt');
    assert.equal(signIn.ok, false, 'an HTML shell cannot produce sign-in success');
    assert.equal(queuedRaw(h), corrupt);
    assert.ok(!JSON.stringify(h.localStorage.snapshot()).includes('secret-password'));
    assertSentinelsPreserved(h);
  }],

  ['a poisoned cross-origin queue entry is quarantined in place and is never fetched', async () => {
    const poisoned = JSON.stringify([{
      id: 'poisoned-0001',
      endpoint: 'https://attacker.invalid/collect',
      method: 'POST',
      operation: 'visit.create',
      expected: 1,
      auth: false,
      lane: 'visit',
      body: { visit_id: 'poisoned-0001' },
      created_at: '2026-08-15T00:00:00.000Z',
      attempts: 0
    }]);
    const h = makeHarness({ localStorage: { ...SENTINELS, [QUEUE_KEY]: poisoned } });
    const result = await h.api.flush();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'queue_corrupt');
    assert.equal(queuedRaw(h), poisoned);
    assert.equal(h.calls.length, 0);
    assertSentinelsPreserved(h);
  }],

  ['account creation and signout change visible auth state only after their exact receipts', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        call => jsonResponse({
          ok: true,
          user: { id: 'u-2', email: 'new@example.com' },
          csrf_token: 'csrf-new',
          receipt: { id: requestId(call), operation: 'account.create', accepted: 1, replayed: false }
        }),
        call => jsonResponse({ ok: true, receipt: { id: requestId(call), operation: 'wrong.operation', accepted: 1 } }),
        call => receiptFor(call, 'session.signout', 1)
      ]
    });
    const created = await h.api.account.create('new@example.com', 'strong-password', true);
    assert.equal(created.ok, true);
    assert.equal(h.api.isSignedIn(), true);
    const wrong = await h.api.account.signOut();
    assert.equal(wrong.ok, false);
    assert.equal(h.api.isSignedIn(), true, 'wrong receipt must not show the player as signed out');
    const exact = await h.api.account.signOut();
    assert.equal(exact.ok, true);
    assert.equal(h.api.isSignedIn(), false);
    assert.ok(!JSON.stringify(h.localStorage.snapshot()).includes('strong-password'));
    assertSentinelsPreserved(h);
  }],

  ['queued account data is permanently scoped to its original user and cannot leak after an account switch', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        sessionResponse(),
        new Error('profile offline'),
        call => receiptFor(call, 'session.signout', 1),
        call => jsonResponse({
          ok: true,
          user: { id: 'u-2', email: 'other@example.com' },
          csrf_token: 'csrf-2',
          receipt: { id: requestId(call), operation: 'account.create', accepted: 1, replayed: false }
        }),
        call => receiptFor(call, 'profile.put', 1)
      ]
    });
    await h.api.account.session();
    const oldWrite = await h.api.profile.push(undefined, { expected_version: 0 });
    assert.equal(oldWrite.queued, true);
    assert.equal(await h.api.account.signOut().then(result => result.ok), true);
    assert.equal(await h.api.account.create('other@example.com', 'other-password', true).then(result => result.ok), true);
    const newWrite = await h.api.profile.push({ shells: 5, level: 1, xp: 0 });
    assert.equal(newWrite.ok, true, 'the new account has an independent queue lane');
    assert.equal(h.api.queueStatus().count, 1);
    assert.equal(queued(h)[0].user_id, 'u-1');
    assert.match(queued(h)[0].lane, /:u-1$/);
    const sentProfiles = h.calls.filter(call => call.url === '/api/app/profile');
    assert.equal(sentProfiles.length, 2, 'the old write was attempted once before signout and never sent as u-2');
    assert.deepEqual(requestBody(sentProfiles[1]), { shells: 5, player_level: 1, xp: 0, expected_version: 0 });
    assertSentinelsPreserved(h);
  }],

  ['remote read failures return the matching local snapshot and market failures return a playable fallback', async () => {
    const h = makeHarness({ localStorage: SENTINELS });
    const profile = await h.api.profile.pull();
    const journal = await h.api.journal.pullSnapshot();
    const streak = await h.api.streak.pull();
    const mastery = await h.api.mastery.pull();
    const market = await h.api.markets.price('BTCUSDT', { interval: '1m', limit: 120 });
    assert.equal(profile.source, 'local');
    assert.equal(profile.data.player_level, 3);
    assert.equal(journal.source, 'local');
    assert.equal(journal.data.trades[0].id, 7);
    assert.equal(streak.source, 'local');
    assert.equal(streak.data.best_streak, 5);
    assert.equal(mastery.source, 'local');
    assert.equal(mastery.data.rows[0].category, 'Trend');
    assert.equal(market.ok, false);
    assert.equal(market.playable, true);
    assert.equal(market.data, null);
    assertSentinelsPreserved(h);
  }],

  ['quote and candle market forms share the same endpoint without changing their payload shape', async () => {
    const h = makeHarness({
      localStorage: SENTINELS,
      fetchPlan: [
        jsonResponse({ ok: true, market: { prices: { AAPL: { price: 316.22, ts: 1786800000000, source: 'proxy' } }, ts: 1786800000000 } }),
        jsonResponse({ ok: true, market: { symbol: 'BTCUSDT', interval: '1m', candles: [{ close: 64274 }], source: 'binance' } })
      ]
    });
    const quotes = await h.api.markets.quotes(['aapl', 'AAPL']);
    const candles = await h.api.markets.price('btcusdt', { interval: '1m', limit: 50 });
    assert.equal(quotes.ok, true);
    assert.equal(quotes.data.prices.AAPL.price, 316.22);
    assert.equal(candles.ok, true);
    assert.equal(candles.data.candles[0].close, 64274);
    assert.equal(h.calls[0].url, '/api/app/market-price?markets=AAPL');
    assert.equal(h.calls[1].url, '/api/app/market-price?symbol=BTCUSDT&interval=1m&limit=50');
    assertSentinelsPreserved(h);
  }]
];

(async () => {
  let failed = 0;
  for (const [name, test] of tests) {
    try {
      await test();
      console.log(`\u2713 ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`\u2717 ${name}`);
      console.error(String(error && error.stack || error));
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} cloud app-data client tests passed`);
  process.exitCode = failed ? 1 : 0;
})();
