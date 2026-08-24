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

function makeStorage(seed = {}, options = {}) {
  const data = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  const removed = [];
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) {
      if (options.throwOnSet) throw new Error('planned storage write failure');
      data.set(String(key), String(value));
    },
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
  const localStorage = makeStorage(options.localStorage || {}, { throwOnSet: !!options.localStorageSetThrows });
  const sessionStorage = makeStorage(
    { cq_bt_sid: 's-existing', ...(options.sessionStorage || {}) },
    { throwOnSet: !!options.sessionStorageSetThrows },
  );
  const timeouts = [];
  const intervals = [];
  const windowListeners = new Map();
  const documentListeners = new Map();
  const historyCalls = [];
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
    const payload = (() => {
      try { return JSON.parse(String(request.body || '{}')); }
      catch (_) { return {}; }
    })();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const rowCount = rows.length;
    const successReceipt = payload.kind === 'survey'
      ? {
          ok: true,
          written: rowCount,
          survey_contract: 'chartquest-beta-survey-v2',
          surveys: rows.map(row => ({
            response_id: row.response_id,
            experience_level: row.experience_level ?? null,
            purchase_intent_19: row.purchase_intent_19 ?? null,
          })),
        }
      : { ok: true, written: rowCount };
    const response = (outcome && typeof outcome === 'object')
      ? outcome
      : new Response(
        JSON.stringify(outcome === true ? successReceipt : { error: 'planned failure' }),
        { status: outcome === true ? 200 : 500, headers: { 'Content-Type': 'application/json' } },
      );
    return Promise.resolve(response);
  }

  const browserLocation = {
    host: 'playchartquest.com',
    hostname: 'playchartquest.com',
    pathname: '/play',
    protocol: 'https:',
    search: '',
    hash: '',
    ...(options.location || {}),
  };
  const browserHistory = {
    state: options.historyState ?? null,
    replaceState(state, title, url) {
      historyCalls.push({ state, title, url: String(url) });
      this.state = state;
      const parsed = new URL(String(url), 'https://playchartquest.com');
      browserLocation.pathname = parsed.pathname;
      browserLocation.search = parsed.search;
      browserLocation.hash = parsed.hash;
    },
  };

  const context = {
    console,
    Date,
    Math,
    JSON,
    Promise,
    URL,
    URLSearchParams,
    localStorage,
    sessionStorage,
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124 Safari/537.36',
      onLine: true,
    },
    screen: { width: 390, height: 844 },
    innerWidth: 390,
    innerHeight: 844,
    location: browserLocation,
    history: browserHistory,
    document: {
      readyState: 'complete',
      title: 'ChartQuest',
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
    historyCalls,
    timeouts,
    dispatchWindow(type, event = {}) {
      for (const fn of windowListeners.get(type) || []) fn(event);
    },
    dispatchDocument(type, event = {}) {
      for (const fn of documentListeners.get(type) || []) fn(event);
    },
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

const INVITE_KEY = 'cq_bt_invite_v1';
const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function inviteSeed(cohort, invite, capturedAt = Date.now()) {
  return JSON.stringify({ cohort, invite, captured_at: capturedAt });
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
  ['opaque invite capture is last-valid-link wins and strips only attribution parameters', async () => {
    const h = makeHarness({
      fetchPlan: [true],
      historyState: { modal: 'kept' },
      localStorage: {
        [INVITE_KEY]: inviteSeed('b369-beta1', 'i-B2C3D4F5G6H7J8K9', Date.now() - 1000),
      },
      location: {
        pathname: '/play.html',
        search: '?utm_source=friend%20one&cq_cohort=b370-beta2&empty=&cq_invite=i-B2C3D4F5G6H7J8K9&cq_invite=i-Z9Y8X7W6V5Q4R3T2&mode=fast',
        hash: '#trade',
      },
    });

    assert.equal(h.historyCalls.length, 1);
    assert.deepEqual(h.historyCalls[0], {
      state: { modal: 'kept' },
      title: 'ChartQuest',
      url: '/play.html?utm_source=friend%20one&empty=&mode=fast#trade',
    });
    assert.equal(h.context.location.search, '?utm_source=friend%20one&empty=&mode=fast');
    assert.equal(h.context.location.hash, '#trade');

    const saved = JSON.parse(h.localStorage.getItem(INVITE_KEY));
    assert.equal(saved.cohort, 'b370-beta2');
    assert.equal(saved.invite, 'i-Z9Y8X7W6V5Q4R3T2', 'the last explicit valid duplicate must win');
    assert.ok(saved.captured_at > 0 && Date.now() - saved.captured_at < 5000);

    assert.equal(h.context.CQTrack.event('tutorial_step_reached', {
      step: 2,
      cohort: 'person@example.com',
      invite: '15551234567',
      cq_cohort: 'person@example.com',
      cq_invite: '15551234567',
    }), true);
    h.context.CQTrack.flush();
    await settle();

    const [row] = requestBody(h.calls[0]).rows;
    assert.equal(row.props.step, 2);
    assert.equal(row.props.cohort, 'b370-beta2', 'caller props cannot bypass URL sanitisation');
    assert.equal(row.props.invite, 'i-Z9Y8X7W6V5Q4R3T2', 'caller props cannot inject a PII-shaped invite');
    assert.equal(Object.hasOwn(row.props, 'cq_cohort'), false);
    assert.equal(Object.hasOwn(row.props, 'cq_invite'), false);
  }],

  ['PII-shaped or unsafe query values are removed but cannot erase fresh attribution', async () => {
    const existing = inviteSeed('b369-beta1', 'i-B2C3D4F5G6H7J8K9', Date.now() - 1000);
    const h = makeHarness({
      fetchPlan: [true],
      localStorage: { [INVITE_KEY]: existing },
      location: {
        pathname: '/survey.html',
        search: '?keep=a%20b&cq_cohort=b370-Alice1985&cq_invite=i-SARAHLEE23456789&keep=two',
        hash: '#answers',
      },
    });

    assert.equal(h.localStorage.getItem(INVITE_KEY), existing, 'invalid explicit values must not overwrite a valid record');
    assert.equal(h.historyCalls[0].url, '/survey.html?keep=a%20b&keep=two#answers');

    assert.equal(h.context.CQTrack.event('tutorial_step_reached', { step: 1 }), true);
    h.context.CQTrack.flush();
    await settle();
    const [row] = requestBody(h.calls[0]).rows;
    assert.equal(row.props.cohort, 'b369-beta1');
    assert.equal(row.props.invite, 'i-B2C3D4F5G6H7J8K9');
  }],

  ['a mixed-validity link cannot erase either half of a stored invite pair', async () => {
    const existing = inviteSeed('b369-beta1', 'i-B2C3D4F5G6H7J8K9', Date.now() - 1000);
    const h = makeHarness({
      fetchPlan: [true],
      localStorage: { [INVITE_KEY]: existing },
      location: {
        pathname: '/play.html',
        search: '?cq_cohort=b370-beta2&cq_invite=i-SARAHLEE23456789',
      },
    });
    assert.equal(h.localStorage.getItem(INVITE_KEY), existing);
    assert.equal(h.historyCalls.length, 1, 'invalid attribution is removed from the address bar');
    assert.equal(h.context.CQTrack.event('tutorial_step_reached', { step: 1 }), true);
    h.context.CQTrack.flush();
    await settle();
    const [row] = requestBody(h.calls[0]).rows;
    assert.equal(row.props.cohort, 'b369-beta1');
    assert.equal(row.props.invite, 'i-B2C3D4F5G6H7J8K9');
  }],

  ['session storage preserves and authorizes URL stripping when local storage rejects the invite', async () => {
    const h = makeHarness({
      fetchPlan: [true],
      localStorageSetThrows: true,
      location: {
        pathname: '/play.html',
        search: '?cq_cohort=b370-beta2&cq_invite=i-Z9Y8X7W6V5Q4R3T2&keep=1',
      },
    });
    assert.equal(h.localStorage.getItem(INVITE_KEY), null);
    assert.ok(h.sessionStorage.getItem(INVITE_KEY), 'the same-tab fallback must retain attribution');
    assert.equal(h.historyCalls[0].url, '/play.html?keep=1');
    assert.equal(h.context.CQTrack.event('tutorial_step_reached', { step: 2 }), true);
    h.context.CQTrack.flush();
    await settle();
    const [row] = requestBody(h.calls[0]).rows;
    assert.equal(row.props.cohort, 'b370-beta2');
    assert.equal(row.props.invite, 'i-Z9Y8X7W6V5Q4R3T2');
  }],

  ['an invite URL remains available for retry when both persistent stores reject it', () => {
    const h = makeHarness({
      localStorageSetThrows: true,
      sessionStorageSetThrows: true,
      location: {
        pathname: '/play.html',
        search: '?cq_cohort=b370-beta2&cq_invite=i-Z9Y8X7W6V5Q4R3T2',
      },
    });
    assert.equal(h.historyCalls.length, 0, 'do not irreversibly strip an unpersisted valid pair');
    assert.equal(h.context.location.search, '?cq_cohort=b370-beta2&cq_invite=i-Z9Y8X7W6V5Q4R3T2');
  }],

  ['invite attribution expires at the exact 30-day boundary', async () => {
    const h = makeHarness({
      fetchPlan: [true],
      localStorage: {
        [INVITE_KEY]: inviteSeed('b369-beta1', 'i-B2C3D4F5G6H7J8K9', Date.now() - INVITE_TTL_MS),
      },
    });

    assert.equal(h.context.CQTrack.event('tutorial_step_reached', { step: 3 }), true);
    h.context.CQTrack.flush();
    await settle();

    const [row] = requestBody(h.calls[0]).rows;
    assert.equal(Object.hasOwn(row.props, 'cohort'), false);
    assert.equal(Object.hasOwn(row.props, 'invite'), false);
    assert.equal(h.localStorage.getItem(INVITE_KEY), null);
    assert.ok(h.localStorage.removed.includes(INVITE_KEY));
  }],

  ['session, return, end, and crash row builders all carry sanitized invite attribution', async () => {
    const h = makeHarness({
      fetchPlan: [true, true, true],
      localStorage: {
        [INVITE_KEY]: inviteSeed('b370-beta2', 'i-Z9Y8X7W6V5Q4R3T2'),
        cq_bt_visits: '1',
        cq_bt_first_seen: '2026-08-20T00:00:00.000Z',
      },
      sessionStorage: { cq_bt_sid: '' },
    });

    h.context.CQTrack.flush();
    await settle();
    h.dispatchWindow('pagehide');
    await settle();
    h.context.CQTrack.crash('error', 'bounded test', 'https://cdn.example.test/script.js:1');
    await settle();

    const rows = h.calls.flatMap(call => requestBody(call).rows);
    assert.deepEqual(rows.map(row => row.name), ['session_start', 'return_visit', 'session_end', 'crash']);
    for (const row of rows) {
      assert.equal(row.props.cohort, 'b370-beta2', `${row.name} is missing cohort`);
      assert.equal(row.props.invite, 'i-Z9Y8X7W6V5Q4R3T2', `${row.name} is missing invite`);
    }
  }],

  ['same-origin analytics has no provider credentials and exact 2xx ends the request', async () => {
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

  ['failed same-origin survey write fails closed without a second provider', async () => {
    const h = makeHarness({ fetchPlan: [false, true], localStorage: SENTINELS });
    const ok = await h.context.CQTrack.survey({ q1_rating: 8, q4_continue: 'later' });
    await settle();

    assert.equal(ok, false);
    assert.deepEqual(h.calls.map(call => call.url), [PRIMARY]);
    assert.deepEqual(Object.keys(requestHeaders(h.calls[0])).sort(), ['Content-Type']);
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
      assert.equal(ok, false, 'misleading responses must fail closed');
      assert.deepEqual(h.calls.map(call => call.url), [PRIMARY]);
      assertSentinelsPreserved(h);
    }
  }],

  ['a legacy count-only survey receipt cannot erase Build 370 research answers', async () => {
    const legacy = new Response(JSON.stringify({ ok: true, written: 1 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
    const h = makeHarness({ fetchPlan: [legacy], localStorage: SENTINELS });
    const ok = await h.context.CQTrack.survey({
      q1_rating: 8,
      q4_continue: 'later',
      experience_level: 'gamer_not_trader',
      purchase_intent_19: 'probably',
    });
    await settle();
    assert.equal(ok, false, 'Build 369 receipt must not confirm fields it never stored');
    assert.equal(h.calls.length, 1);
    assertSentinelsPreserved(h);
  }],

  ['survey resolves true only after an exact response-specific same-origin receipt', async () => {
    const mismatchedReceipt = (field, value) => (_url, request) => {
      const [row] = JSON.parse(String(request.body || '{}')).rows;
      const receipt = {
        ok: true,
        written: 1,
        survey_contract: 'chartquest-beta-survey-v2',
        surveys: [{
          response_id: row.response_id,
          experience_level: row.experience_level,
          purchase_intent_19: row.purchase_intent_19,
        }],
      };
      if (field === 'survey_contract') receipt.survey_contract = value;
      else receipt.surveys[0][field] = value;
      return new Response(JSON.stringify(receipt), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    };
    const cases = [
      { plan: [true], expected: true, label: 'exact receipt' },
      { plan: [mismatchedReceipt('response_id', 'r-p-other')], expected: false, label: 'wrong response id' },
      { plan: [mismatchedReceipt('experience_level', 'new_to_both')], expected: false, label: 'wrong research answer' },
      { plan: [mismatchedReceipt('survey_contract', 'chartquest-beta-survey-v1')], expected: false, label: 'wrong receipt contract' },
      { plan: [false, true], expected: false, label: 'non-2xx' },
      { plan: [new Error('offline'), true], expected: false, label: 'rejected' },
    ];
    for (const item of cases) {
      const h = makeHarness({ fetchPlan: item.plan, localStorage: SENTINELS });
      const result = await h.context.CQTrack.survey({
        response_id: 'r-p-test',
        q1_rating: 7,
        q4_continue: 'later',
        experience_level: 'gamer_not_trader',
        purchase_intent_19: 'probably',
      });
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
      fetchPlan: [true, false],
      localStorage: { ...SENTINELS, cq_bt_pending: JSON.stringify(rows) },
    });

    await settle();
    assert.deepEqual(pendingRows(h).map(row => row.event_id), rows.slice(40).map(row => row.event_id));

    h.runTimeout(0);
    await settle();
    assert.deepEqual(h.calls.map(call => call.url), [PRIMARY, PRIMARY]);
    assert.deepEqual(h.calls.map(call => requestBody(call).rows.length), [40, 40]);
    assert.deepEqual(
      pendingRows(h).map(row => row.event_id),
      rows.slice(40).map(row => row.event_id),
      'a batch is removable only after the same-origin transport confirms it',
    );
    assert.equal(h.timeouts.filter(timer => timer.ms === 0).length, 0, 'a failed drain must stop until a later recovery trigger');
    assertSentinelsPreserved(h);
  }],

  ['all tracker tags are versioned and private founder/API data bypasses the v20 cache', async () => {
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
      ['bosses.html', 'courses.html', 'index.html', 'offline.html', 'play.html', 'survey.html'],
      'the known tracker surfaces must all remain instrumented',
    );
    for (const item of found) {
      assert.match(item.src, /cq-track\.js\?v=374$/, `${item.name} has an unversioned/stale tracker tag: ${item.src}`);
    }

    const sw = fs.readFileSync(path.join(website, 'sw.js'), 'utf8');
    assert.match(sw, /const CACHE = ['"]chartquest-site-v20['"];?/);
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
      assert.match(boot, /CQBOOTCRASH:BEGIN/, `${relative} is missing the canonical boot capture`);
      assert.match(boot, /function acknowledged\(response, count\)/, `${relative} is missing the boot receipt validator`);
      assert.match(boot, /application\/json/, `${relative} boot fallback accepts non-JSON responses`);
      assert.match(boot, /receipt\.ok === true && Number\(receipt\.written\) === count/,
        `${relative} boot fallback does not require an exact write receipt`);
      assert.match(boot, /persist\(rows\);\s*drain\(\);/,
        `${relative} boot fallback does not persist before sending`);
      assert.doesNotMatch(boot, /if \(response\.ok\) return true/,
        `${relative} boot fallback still treats a bare HTTP 2xx as stored data`);
      assert.doesNotMatch(boot, /https?:\/\//,
        `${relative} boot fallback contains an external provider`);
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
