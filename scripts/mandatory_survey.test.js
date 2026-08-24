#!/usr/bin/env node
'use strict';

/* Dependency-free adversarial contracts for the response-specific mandatory survey owner. */
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const TRACKER = fs.readFileSync(path.join(ROOT, 'website/assets/cq-track.js'), 'utf8');
const PLAY = fs.readFileSync(path.join(ROOT, 'website/play.html'), 'utf8');
const OFFLINE = fs.readFileSync(path.join(ROOT, 'website/offline.html'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'website/sw.js'), 'utf8');
const START = TRACKER.indexOf('/* CQSURVEYGATE:BEGIN');
const END = TRACKER.indexOf('/* CQSURVEYGATE:END */');
assert.ok(START >= 0 && END > START, 'canonical CQSurveyGate block must be extractable');
const GATE = TRACKER.slice(START, END + '/* CQSURVEYGATE:END */'.length);

function storage(seed = {}, options = {}) {
  const data = new Map(Object.entries(seed).map(([key, value]) => [String(key), String(value)]));
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) {
      if (options.throwOnSet) throw new Error('planned storage failure');
      data.set(String(key), String(value));
    },
    removeItem(key) { data.delete(String(key)); },
    snapshot() { return Object.fromEntries(data); },
  };
}

function makeLocation(url, replacements, throwNavigation) {
  const parsed = new URL(url);
  let currentHref = parsed.href;
  const location = {
    origin: parsed.origin,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    replace(target) {
      if (throwNavigation) throw new Error('planned replace failure');
      replacements.push(String(target));
    },
  };
  Object.defineProperty(location, 'href', {
    enumerable: true,
    get() { return currentHref; },
    set(value) {
      if (throwNavigation) throw new Error('planned href failure');
      currentHref = String(value); replacements.push(currentHref);
    },
  });
  return location;
}

function harness(options = {}) {
  const localStorage = storage(options.storage || {}, options.storageOptions || {});
  const listeners = new Map();
  const documentListeners = new Map();
  const historyCalls = [];
  const replacements = [];
  const topReplacements = [];
  function on(registry, type, fn) {
    const rows = registry.get(type) || [];
    rows.push(fn); registry.set(type, rows);
  }
  const location = makeLocation(options.url || 'https://playchartquest.com/survey', replacements, !!options.throwNavigation);
  const document = {
    visibilityState: 'visible',
    addEventListener(type, fn) { on(documentListeners, type, fn); },
    createEvent() { return { initCustomEvent(type, _b, _c, detail) { this.type = type; this.detail = detail; } }; },
  };
  const history = {
    replaceState(state, _title, url) { historyCalls.push({ method: 'replace', state, url }); },
    pushState(state, _title, url) { historyCalls.push({ method: 'push', state, url }); },
  };
  const root = {
    localStorage, location, document, history,
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    addEventListener(type, fn) { on(listeners, type, fn); },
    dispatchEvent() {},
  };
  root.top = root;
  if (options.framed) {
    root.top = {
      location: makeLocation(options.topUrl || 'https://playchartquest.com/play', topReplacements),
    };
  }
  const context = { window: root, URL, Date, Math, JSON, Object, Array, Number, String, RegExp };
  vm.runInNewContext(GATE, context, { filename: 'cq-track.js#CQSurveyGate', timeout: 1000 });
  return {
    gate: root.CQSurveyGate, root, localStorage, historyCalls, replacements, topReplacements,
    fire(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); },
    fireDocument(type, event = {}) { for (const fn of documentListeners.get(type) || []) fn(event); },
    listenerCount(type) { return (listeners.get(type) || []).length; },
  };
}

function flow(row) { return JSON.stringify(row); }
function dueRow(overrides = {}) {
  return flow({
    version: 2, stage: 'survey_due', tradeSlot: 3, market: 'BTC',
    updatedAt: '2026-08-25T00:00:00.000Z', surveyResponseId: 'r-p-alpha', surveyReceipt: null,
    ...overrides,
  });
}
function eventDouble(target) {
  return {
    target,
    prevented: 0, stopped: 0,
    preventDefault() { this.prevented += 1; },
    stopPropagation() { this.stopped += 1; },
    stopImmediatePropagation() { this.stopped += 1; },
  };
}

const tests = [
  ['version-1 completion migrates to a stable response-specific due row despite the legacy analytics flag', () => {
    const h = harness({ storage: {
      cq_pid: 'p-alpha',
      cq_bt_survey_submitted: '1',
      cq_beta_flow_v1: flow({ version: 1, stage: 'survey_submitted', tradeSlot: 3, market: 'BTC' }),
    } });
    const row = h.gate.state();
    assert.equal(row.version, 2);
    assert.equal(row.stage, 'survey_due');
    assert.equal(row.surveyResponseId, 'r-p-alpha');
    assert.equal(row.surveyReceipt, null);
    assert.equal(h.gate.isDue(), true);
    const stored = JSON.parse(h.localStorage.getItem('cq_beta_flow_v1'));
    assert.equal(stored.surveyResponseId, 'r-p-alpha');
    assert.equal(h.localStorage.getItem('cq_bt_survey_submitted'), '1', 'generic analytics evidence is preserved but not trusted');
  }],

  ['only the exact persisted response id can close the gate', () => {
    const h = harness({ storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow() } });
    assert.equal(h.gate.markSubmitted('r-p-other'), false);
    assert.equal(h.gate.isDue(), true);
    assert.equal(h.gate.markSubmitted('r-p-alpha'), true);
    const row = JSON.parse(h.localStorage.getItem('cq_beta_flow_v1'));
    assert.equal(row.version, 2);
    assert.equal(row.stage, 'survey_submitted');
    assert.equal(row.surveyResponseId, 'r-p-alpha');
    assert.equal(row.surveyReceipt, 'r-p-alpha');
    assert.equal(h.gate.isDue(), false);
  }],

  ['a receipt that cannot be durably persisted leaves the survey due', () => {
    const h = harness({
      storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow() },
      storageOptions: { throwOnSet: true },
    });
    assert.equal(h.gate.markSubmitted('r-p-alpha'), false);
    assert.equal(h.gate.isDue(), true);
    assert.equal(JSON.parse(h.localStorage.getItem('cq_beta_flow_v1')).surveyReceipt, null);
  }],

  ['the response id is exactly r- plus persisted cq_pid and foreign ids are rejected', () => {
    const h = harness({ storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow({ stage: 'new', surveyResponseId: null }) } });
    const row = h.gate.ensureDue('r-p-alpha');
    assert.equal(row.surveyResponseId, 'r-p-alpha');
    assert.equal(h.gate.ensureDue({ responseId: 'r-p-beta' }), null);
    assert.equal(h.gate.ensureDue({ responseId: 'r2-p-alpha' }), null);
  }],

  ['a changed player id invalidates an old response receipt instead of authorizing the new player', () => {
    const h = harness({ storage: {
      cq_pid: 'p-new',
      cq_beta_flow_v1: dueRow({
        stage: 'survey_submitted', surveyResponseId: 'r-p-old', surveyReceipt: 'r-p-old',
      }),
    } });
    const row = h.gate.state();
    assert.equal(row.stage, 'survey_due');
    assert.equal(row.surveyResponseId, 'r-p-new');
    assert.equal(row.surveyReceipt, null);
  }],

  ['owed game and embedded-survey documents promote the survey to the same-origin top window', () => {
    for (const url of ['https://playchartquest.com/game', 'https://playchartquest.com/survey']) {
      const h = harness({
        url, framed: true, topUrl: 'https://playchartquest.com/play',
        storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow() },
      });
      assert.deepEqual(h.replacements, [], 'the iframe itself must not own navigation');
      assert.deepEqual(h.topReplacements, ['https://playchartquest.com/survey.html']);
    }
  }],

  ['failed replace and href assignments report no redirect success', () => {
    const h = harness({
      url: 'https://playchartquest.com/offline', throwNavigation: true,
      storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow() },
    });
    assert.equal(h.gate.redirectIfDue(), false);
    assert.deepEqual(h.replacements, []);
  }],

  ['subpath survey resolution survives clean-url trailing slashes and deploy roots', () => {
    const cases = [
      ['https://example.test/shell-trade/play/', 'https://example.test/shell-trade/survey.html'],
      ['https://example.test/shell-trade/', 'https://example.test/shell-trade/survey.html'],
      ['https://example.test/play', 'https://example.test/survey.html'],
    ];
    for (const [url, expected] of cases) {
      const h = harness({ url, storage: { cq_pid: 'p-alpha' } });
      assert.equal(h.gate.surveyUrl(), expected);
    }
  }],

  ['top-level survey blocks links, backdrop and Escape but does not install a close/unload blocker', () => {
    const h = harness({ storage: { cq_pid: 'p-alpha', cq_beta_flow_v1: dueRow() } });
    const anchor = { closest(selector) { return selector.includes('a[href]') ? this : null; } };
    const click = eventDouble(anchor);
    h.fireDocument('click', click);
    assert.ok(click.prevented > 0);
    const escape = eventDouble(null); escape.key = 'Escape';
    h.fire('keydown', escape);
    assert.ok(escape.prevented > 0);
    assert.equal(h.listenerCount('beforeunload'), 0, 'closing the game is the one allowed exit');
    const pushes = h.historyCalls.filter(call => call.method === 'push').length;
    h.fire('popstate', eventDouble(null));
    assert.equal(h.historyCalls.filter(call => call.method === 'push').length, pushes + 1,
      'browser Back must re-arm the survey history lock');
  }],

  ['play wrapper fails closed before iframe setup and accepts completion only from its own game frame', () => {
    const guard = PLAY.indexOf('CQSurveyGate.redirectIfDue()');
    const iframe = PLAY.indexOf("var CQ_GAME =");
    assert.ok(guard >= 0 && guard < iframe, 'owed redirect must precede iframe initialization');
    assert.match(PLAY, /ev\.origin !== location\.origin \|\| ev\.source !== gframe\.contentWindow/);
    assert.match(PLAY, /CQSurveyGate\.ensureDue\(\{ responseId: d\.responseId \|\| d\.surveyResponseId \|\| null \}\)/);
    assert.match(PLAY, /location\.replace\(url\)/);
    assert.doesNotMatch(PLAY, /\(window\.top \|\| window\)\.location\.href\s*=\s*url/);
    assert.ok(PLAY.indexOf("type: 'survey_shown'") > PLAY.indexOf('location.replace(url)'),
      'wrapper must acknowledge only after committing top-level replacement');
  }],

  ['service worker v20 precaches and serves the survey shell on offline survey navigation', () => {
    assert.match(SW, /const CACHE = ['"]chartquest-site-v20['"]/);
    assert.match(SW, /const SURVEY_URL = ['"]\.\/survey\.html['"]/);
    assert.match(SW, /OFFLINE_URL, SURVEY_URL/);
    assert.match(SW, /owedSurveyRoute[\s\S]*caches\.match\(owedSurveyRoute \? SURVEY_URL : OFFLINE_URL\)/);
    assert.match(SW, /caches\.match\(req, \{ ignoreSearch: true \}\)/,
      'versioned tracker URL must resolve from canonical precache while offline');
  }],

  ['offline fallback loads the shared gate and immediately recovers an owed survey', () => {
    assert.match(OFFLINE, /<script src="assets\/cq-track\.js\?v=374"><\/script>/);
    assert.match(OFFLINE, /CQSurveyGate\.isDue\(\)/);
    assert.match(OFFLINE, /CQSurveyGate\.redirectIfDue\(\)/);
  }],

  ['tester QR rejects valued, bare, encoded and fragment-suffixed beta bypass flags', () => {
    for (const suffix of ['?beta=0', '?beta', '?b%65ta=0', '?beta=0#resume']) {
      const result = cp.spawnSync('python3', ['scripts/tester_qr.py', '--url', 'https://playchartquest.com/' + suffix,
        '--out', '/tmp/chartquest-beta-bypass-must-not-exist.svg'], {
        cwd: ROOT, encoding: 'utf8', timeout: 3000,
      });
      assert.notEqual(result.status, 0, suffix + ' must be rejected');
      assert.match((result.stdout || '') + (result.stderr || ''), /beta.*DEV flag/i);
    }
  }],

  ['every website tracker tag carries the returning-worker cachebuster', () => {
    const htmlFiles = fs.readdirSync(path.join(ROOT, 'website')).filter(name => name.endsWith('.html'));
    const tags = [];
    for (const name of htmlFiles) {
      const source = fs.readFileSync(path.join(ROOT, 'website', name), 'utf8');
      for (const match of source.matchAll(/<script\b[^>]*src=["']([^"']*cq-track\.js[^"']*)["'][^>]*>/gi)) {
        tags.push({ name, src: match[1] });
      }
    }
    assert.deepEqual(tags.map(tag => tag.name).sort(),
      ['bosses.html', 'courses.html', 'index.html', 'offline.html', 'play.html', 'survey.html']);
    for (const tag of tags) assert.match(tag.src, /assets\/cq-track\.js\?v=374$/, tag.name + ': ' + tag.src);
  }],

  ['changed scripts remain syntactically valid', () => {
    assert.doesNotThrow(() => new Function(TRACKER));
    for (const source of [PLAY, OFFLINE]) {
      for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
        if (match[1].trim()) assert.doesNotThrow(() => new Function(match[1]));
      }
    }
  }],
];

let failed = 0;
for (const [name, test] of tests) {
  try { test(); process.stdout.write('\u2713 ' + name + '\n'); }
  catch (error) {
    failed += 1;
    process.stderr.write('\u2717 ' + name + '\n' + String(error && error.stack || error) + '\n');
  }
}
process.stdout.write(`\n${tests.length - failed}/${tests.length} mandatory survey contracts passed\n`);
process.exitCode = failed ? 1 : 0;
