#!/usr/bin/env node
'use strict';

/* Dependency-free contract tests for the canonical browser telemetry client. */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TRACKER = path.join(ROOT, 'website', 'assets', 'cq-track.js');
const TRACKER_SOURCE = fs.readFileSync(TRACKER, 'utf8');
const PRIMARY = '/api/beta-ingest';
const FALLBACK = 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest';

function makeStorage(seed = {}) {
  const data = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  const removed = [];
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { removed.push(String(key)); data.delete(String(key)); },
    clear() { for (const key of data.keys()) removed.push(key); data.clear(); },
    key(index) { return Array.from(data.keys())[index] ?? null; },
    get length() { return data.size; },
    snapshot() { return Object.fromEntries(data); },
    removed,
  };
}

function makeHarness(options = {}) {
  const calls = [];
  const fetchPlan = Array.from(options.fetchPlan || []);
  const localStorage = makeStorage(options.localStorage || {});
  const sessionStorage = makeStorage({ cq_bt_sid: 's-existing', ...(options.sessionStorage || {}) });
  const timeouts = [];
  const intervals = [];
  const windowListeners = new Map();
  const documentListeners = new Map();
  let timerId = 0;

  function addListener(registry, type, fn) {
    const list = registry.get(type) || [];
    list.push(fn);
    registry.set(type, list);
  }

  function fakeFetch(url, request = {}) {
    calls.push({ url: String(url), request });
    const outcome = fetchPlan.length ? fetchPlan.shift() : false;
    if (outcome instanceof Error) return Promise.reject(outcome);
    if (typeof outcome === 'function') {
      try { return Promise.resolve(outcome(url, request)); }
      catch (error) { return Promise.reject(error); }
    }
    const rowCount = (() => {
      try { return JSON.parse(String(request.body || '{}')).rows.length; }
      catch (_) { return 0; }
    })();
    const response = (outcome && typeof outcome === 'object')
      ? outcome
      : new Response(
        JSON.stringify(outcome === true ? { ok: true, written: rowCount } : { error: 'planned failure' }),
        { status: outcome === true ? 200 : 500, headers: { 'Content-Type': 'application/json' } },
      );
    return Promise.resolve(response);
  }

  const context = {
    console,
    Date,
    Math,
    JSON,
    Promise,
    localStorage,
    sessionStorage,
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124 Safari/537.36',
      onLine: true,
    },
    screen: { width: 390, height: 844 },
    innerWidth: 390,
    innerHeight: 844,
    location: {
      host: 'playchartquest.com',
      hostname: 'playchartquest.com',
      pathname: '/play',
      protocol: 'https:',
      search: '',
    },
    document: {
      readyState: 'complete',
      referrer: '',
      visibilityState: 'visible',
      addEventListener(type, fn) { addListener(documentListeners, type, fn); },
    },
    fetch: fakeFetch,
    addEventListener(type, fn) { addListener(windowListeners, type, fn); },
    setTimeout(fn, ms = 0) {
      const id = ++timerId;
      timeouts.push({ id, fn, ms: Number(ms) || 0 });
      return id;
    },
    clearTimeout(id) {
      const index = timeouts.findIndex(timer => timer.id === id);
      if (index >= 0) timeouts.splice(index, 1);
    },
    setInterval(fn, ms = 0) {
      const id = ++timerId;
      intervals.push({ id, fn, ms: Number(ms) || 0 });
      return id;
    },
    clearInterval(id) {
      const index = intervals.findIndex(timer => timer.id === id);
      if (index >= 0) intervals.splice(index, 1);
    },
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(TRACKER_SOURCE, context, { filename: TRACKER });

  return {
    context,
    calls,
    localStorage,
    sessionStorage,
    timeouts,
    runTimeout(ms) {
      const index = timeouts.findIndex(timer => ms == null || timer.ms === ms);
      assert.notEqual(index, -1, `expected a queued timeout${ms == null ? '' : ` at ${ms}ms`}`);
      const [timer] = timeouts.splice(index, 1);
      timer.fn();
      return timer;
    },
  };
}

async function settle() {
  // The client chains fetch -> response -> acknowledgement; give every native
  // promise continuation a turn without advancing any fake browser timer.
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
}

function requestHeaders(call) {
  return { ...(call.request.headers || {}) };
}

function requestBody(call) {
  return JSON.parse(String(call.request.body || '{}'));
}

function pendingRows(harness) {
  return JSON.parse(harness.localStorage.getItem('cq_bt_pending') || '[]');
}

function queuedRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    event_id: `pending-${String(index).padStart(3, '0')}`,
    player_id: 'p-preserved',
    session_id: 's-old',
    name: 'crash',
    ts: '2026-08-15T00:00:00.000Z',
    props: { index },
  }));
}

const SENTINELS = {
  cq_pid: 'p-preserved',
  cq_player_v1: JSON.stringify({ shells: 321, level: 2, xp: 45 }),
  shellTradeJournal_v1: JSON.stringify([{ id: 7, result: 'win' }]),
  shellTradeNotes_v1: JSON.stringify([{ id: 4, text: 'keep me' }]),
  shellTradeDaily_v1: JSON.stringify({ streak: 3 }),
  cq_mastery_v1: JSON.stringify({ Trend: { trade: 12 } }),
  cq_bt_tutorial_started: '1710000000000',
  cq_bt_first_trade_won: '1710000001000',
  cq_bt_boss_defeated: '1710000002000',
};

function assertSentinelsPreserved(harness) {
  for (const [key, value] of Object.entries(SENTINELS)) {
    assert.equal(harness.localStorage.getItem(key), value, `${key} must survive telemetry migration/drain`);
    assert.ok(!harness.localStorage.removed.includes(key), `${key} must never be removed`);
  }
}

const tests = [
  ['same-origin primary has no Supabase credentials and confirmed 2xx never falls back', async () => {
    const h = makeHarness({ fetchPlan: [true], localStorage: SENTINELS });
    const ok = await h.context.CQTrack.survey({ q1_rating: 9, q4_continue: 'immediately' });
    await settle();

    assert.equal(ok, true);
    assert.equal(h.calls.length, 1, 'a confirmed primary write must end the request chain');
    assert.equal(h.calls[0].url, PRIMARY);
    assert.deepEqual(Object.keys(requestHeaders(h.calls[0])).sort(), ['Content-Type']);
    assert.equal(requestHeaders(h.calls[0])['Content-Type'], 'application/json');
    assert.equal(requestBody(h.calls[0]).kind, 'survey');
    assertSentinelsPreserved(h);
  }],

  ['failed primary uses the exact Supabase fallback and legacy auth headers', async () => {
    const h = makeHarness({ fetchPlan: [false, true], localStorage: SENTINELS });
    const ok = await h.context.CQTrack.survey({ q1_rating: 8, q4_continue: 'later' });
    await settle();

    assert.equal(ok, true);
    assert.deepEqual(h.calls.map(call => call.url), [PRIMARY, FALLBACK]);
    assert.deepEqual(Object.keys(requestHeaders(h.calls[0])).sort(), ['Content-Type']);
    const headers = requestHeaders(h.calls[1]);
    assert.deepEqual(Object.keys(headers).sort(), ['Authorization', 'Content-Type', 'apikey']);
    assert.equal(headers['Content-Type'], 'application/json');
    assert.match(headers.apikey, /^eyJ/);
    assert.equal(headers.Authorization, `Bearer ${headers.apikey}`);
    assert.deepEqual(requestBody(h.calls[1]), requestBody(h.calls[0]));
    assertSentinelsPreserved(h);
  }],

  ['a 200 HTML shell or false JSON receipt cannot acknowledge rows', async () => {
    const misleading = [
      new Response('<!doctype html><title>ChartQuest</title>', {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
      new Response(JSON.stringify({ ok: true, written: 99 }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }),
    ];
    for (const primaryResponse of misleading) {
      const h = makeHarness({ fetchPlan: [primaryResponse, true], localStorage: SENTINELS });
      const ok = await h.context.CQTrack.survey({ q1_rating: 8, q4_continue: 'later' });
      await settle();
      assert.equal(ok, true, 'the exact legacy fallback receipt should still preserve the answer');
      assert.deepEqual(h.calls.map(call => call.url), [PRIMARY, FALLBACK]);
      assertSentinelsPreserved(h);
    }
  }],

  ['survey resolves true only after a confirmed primary or fallback write', async () => {
    const cases = [
      { plan: [true], expected: true, label: 'primary 2xx' },
      { plan: [false, true], expected: true, label: 'fallback 2xx' },
      { plan: [false, false], expected: false, label: 'both non-2xx' },
      { plan: [new Error('primary offline'), new Error('fallback offline')], expected: false, label: 'both rejected' },
    ];
    for (const item of cases) {
      const h = makeHarness({ fetchPlan: item.plan, localStorage: SENTINELS });
      const result = await h.context.CQTrack.survey({ q1_rating: 7, q4_continue: 'later' });
      await settle();
      assert.equal(result, item.expected, item.label);
      assertSentinelsPreserved(h);
    }
  }],

  ['85 pending events drain as acknowledged batches of 40, 40, and 5', async () => {
    const rows = queuedRows(85);
    const h = makeHarness({
      fetchPlan: [true, true, true],
      localStorage: { ...SENTINELS, cq_bt_pending: JSON.stringify(rows) },
    });

    await settle();
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [40]);
    assert.deepEqual(pendingRows(h).map(row => row.event_id), rows.slice(40).map(row => row.event_id));

    h.runTimeout(0);
    await settle();
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [40, 40]);
    assert.deepEqual(pendingRows(h).map(row => row.event_id), rows.slice(80).map(row => row.event_id));

    h.runTimeout(0);
    await settle();
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [40, 40, 5]);
    assert.equal(h.localStorage.getItem('cq_bt_pending'), null, 'only the final acknowledged batch removes the queue key');
    assert.ok(h.calls.every(call => call.url === PRIMARY));
    assert.ok(h.calls.every(call => Object.keys(requestHeaders(call)).length === 1));
    assertSentinelsPreserved(h);
  }],

  ['a failed second batch leaves all 45 unacknowledged rows intact', async () => {
    const rows = queuedRows(85);
    const h = makeHarness({
      fetchPlan: [true, false, false],
      localStorage: { ...SENTINELS, cq_bt_pending: JSON.stringify(rows) },
    });

    await settle();
    assert.deepEqual(pendingRows(h).map(row => row.event_id), rows.slice(40).map(row => row.event_id));

    h.runTimeout(0);
    await settle();
    assert.deepEqual(h.calls.map(call => call.url), [PRIMARY, PRIMARY, FALLBACK]);
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [40, 40, 40]);
    assert.deepEqual(
      pendingRows(h).map(row => row.event_id),
      rows.slice(40).map(row => row.event_id),
      'a batch is removable only after either transport confirms it',
    );
    assert.equal(h.timeouts.filter(timer => timer.ms === 0).length, 0, 'a failed drain must stop until a later recovery trigger');
    assertSentinelsPreserved(h);
  }],

  ['all tracker tags are versioned and private founder/API data bypasses the v15 cache', async () => {
    const website = path.join(ROOT, 'website');
    const htmlFiles = fs.readdirSync(website)
      .filter(name => name.endsWith('.html'))
      .sort();
    const found = [];
    const tag = /<script\b[^>]*\bsrc\s*=\s*(["'])([^"']*cq-track\.js[^"']*)\1[^>]*>/gi;
    for (const name of htmlFiles) {
      const source = fs.readFileSync(path.join(website, name), 'utf8');
      let match;
      while ((match = tag.exec(source))) found.push({ name, src: match[2] });
    }

    assert.deepEqual(
      found.map(item => item.name),
      ['bosses.html', 'courses.html', 'index.html', 'play.html', 'survey.html'],
      'the known tracker surfaces must all remain instrumented',
    );
    for (const item of found) {
      assert.match(item.src, /cq-track\.js\?v=368$/, `${item.name} has an unversioned/stale tracker tag: ${item.src}`);
    }

    const sw = fs.readFileSync(path.join(website, 'sw.js'), 'utf8');
    assert.match(sw, /const CACHE = ['"]chartquest-site-v15['"];?/);
    assert.match(sw, /requestURL\.pathname === ['"]\/api['"] \|\| requestURL\.pathname\.startsWith\(['"]\/api\/['"]\)/);
    assert.match(sw, /requestURL\.pathname === ['"]\/founder['"] \|\| requestURL\.pathname\.startsWith\(['"]\/founder\/['"]\)/);
    assert.match(sw, /requestURL\.origin !== self\.location\.origin/,
      'cross-origin account and market responses must be network-only');
    const privateBypass = sw.indexOf("requestURL.pathname === '/api'");
    const crossOriginBypass = sw.indexOf('requestURL.origin !== self.location.origin');
    const cacheLookup = sw.indexOf('caches.match(req)');
    assert.ok(privateBypass >= 0 && privateBypass < cacheLookup,
      'private data routes must return network-only before any CacheStorage lookup');
    assert.ok(crossOriginBypass >= 0 && crossOriginBypass < cacheLookup,
      'cross-origin account and market requests must return network-only before CacheStorage');
    const crossOriginBlock = sw.slice(crossOriginBypass, privateBypass);
    assert.match(crossOriginBlock, /e\.respondWith\(fetch\(req\)\);\s*return;/,
      'cross-origin requests must be network-only without a cache fallback');
    assert.doesNotMatch(crossOriginBlock, /caches\.|\.put\(/,
      'cross-origin bypass must not read or write CacheStorage');
    const bypassBlock = sw.slice(privateBypass, sw.indexOf('// The live game needs fresh market data'));
    assert.match(bypassBlock, /e\.respondWith\(fetch\(req\)\);\s*return;/,
      'private data routes must be network-only and must never fall back to cached data');
    assert.doesNotMatch(bypassBlock, /caches\.|\.put\(/,
      'private data bypass must not read or write CacheStorage');

    for (const relative of ['chart-quest.html', 'website/index.html', 'website/play.html', 'website/survey.html']) {
      const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
      const boot = source.slice(0, source.indexOf('</script>'));
      assert.match(boot, /function acknowledged\(r\)/, `${relative} is missing the boot receipt validator`);
      assert.match(boot, /application\/json/, `${relative} boot fallback accepts non-JSON responses`);
      assert.match(boot, /receipt\.ok === true && Number\(receipt\.written\) === rows\.length/,
        `${relative} boot fallback does not require an exact write receipt`);
      assert.doesNotMatch(boot, /if \(r\.ok\) return true/,
        `${relative} boot fallback still treats a bare HTTP 2xx as stored data`);
    }
  }],
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
  console.log(`\n${tests.length - failed}/${tests.length} Cloudflare client tests passed`);
  process.exitCode = failed ? 1 : 0;
})();
