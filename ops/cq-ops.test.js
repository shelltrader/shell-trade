/* ═══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — BEHAVIOURAL SUITE FOR window.CQOPS                     ops/cq-ops.test.js
   ═══════════════════════════════════════════════════════════════════════════════════════════
       node ops/cq-ops.test.js            exit 0 on pass, 1 on fail

   No browser, no dependencies, no network. It stubs the handful of browser globals cq-ops.js
   touches (location, localStorage, addEventListener, fetch, document) and runs the real module
   in a vm context — so this tests the SHIPPING file, not a copy.

   WHY THIS EXISTS SEPARATELY FROM verify.js GATE #19. They check different things and neither
   substitutes for the other:
     • gate #19 is STRUCTURAL — is the owner published, is the inlined copy in sync with this
       canonical source, is the build stamped, do the product flags still default to shipped
       behaviour. It reads the file as text and never executes it.
     • this suite is BEHAVIOURAL — does env detection actually resolve localhost to development
       and an unknown host to production, does the durable queue really keep items on an
       unconfirmed drain, does the fetch observer really pass the original promise through
       untouched and really supply both handlers so it cannot invent an unhandledrejection.
   A structural gate cannot answer any of those, and they are exactly the properties the module
   promises. Run this after ANY edit to ops/cq-ops.js, then `scripts/cq.sh ops` to re-splice.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function makeWindow(search, host) {
  const store = {};
  const listeners = {};
  const win = {
    location: { search: search || '', hostname: host === undefined ? 'localhost' : host, protocol: 'http:', href: 'http://' + (host || 'localhost') + '/' },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    dispatchEvent: () => true,
    CustomEvent: function (n, o) { this.type = n; this.detail = o && o.detail; },
    setTimeout, clearTimeout, Promise, console, Math, JSON, Date, URL,
    fetch: null,
    document: { readyState: 'complete', querySelector: () => null, addEventListener: () => {} },
    screen: { width: 100, height: 100 }
  };
  win.window = win;
  win.__listeners = listeners;
  win.__store = store;
  return win;
}

function load(win) {
  const src = fs.readFileSync(path.join(__dirname, 'cq-ops.js'), 'utf8');
  vm.createContext(win);
  vm.runInContext(src, win, { filename: 'cq-ops.js' });
  return win.CQOPS;
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('\nCQOPS harness\n' + '='.repeat(50));

/* ── 1. environment detection ─────────────────────────────────────────────── */
console.log('\nenv');
{
  const cases = [
    ['localhost', 'development'], ['127.0.0.1', 'development'], ['192.168.1.42', 'development'],
    ['macbook.local', 'development'], ['playchartquest.com', 'production'],
    ['www.playchartquest.com', 'production'], ['chartquest.pages.dev', 'production'],
    ['abc123.chartquest.pages.dev', 'staging'], ['staging.example.com', 'staging'],
    ['some-unknown-host.net', 'production']
  ];
  for (const [host, want] of cases) {
    const O = load(makeWindow('', host));
    ok(`${host} → ${want}`, O.env.name === want, O.env.name);
  }
  const O = load(makeWindow('?env=staging', 'playchartquest.com'));
  ok('?env=staging overrides detection', O.env.name === 'staging' && O.env.forced === true, O.env.name);
  ok('env.get returns config', typeof O.env.get('analyticsEndpoint') === 'string');
  ok('env.get honours fallback', O.env.get('nope', 'fb') === 'fb');
  const P = load(makeWindow('', 'playchartquest.com'));
  ok('prod logLevel is warn', P.env.get('logLevel') === 'warn', P.env.get('logLevel'));
  ok('dev logLevel is debug', load(makeWindow('', 'localhost')).env.get('logLevel') === 'debug');
}

/* ── 2. feature flags ─────────────────────────────────────────────────────── */
console.log('\nflags');
{
  const O = load(makeWindow('', 'localhost'));
  ok('product flags default to shipped behaviour',
    O.flags.on('enableJournalDiscovery') && O.flags.on('enableBossCinematics') &&
    O.flags.on('enableBetaSurvey') && O.flags.on('enableAnalytics'));
  ok('experimental defaults OFF', O.flags.on('enableExperimentalFeatures') === false);
  ok('unknown flag reads false', O.flags.on('nonsenseFlag') === false);
  ok('product flags report as UNWIRED', O.flags.all().enableBossCinematics.wired === false);
  ok('ops flags report as WIRED', O.flags.all().enableOpsErrorCapture.wired === true);

  const U = load(makeWindow('?ff=-enableBossCinematics,+enableExperimentalFeatures', 'localhost'));
  ok('?ff=-name turns off', U.flags.on('enableBossCinematics') === false);
  ok('?ff=+name turns on', U.flags.on('enableExperimentalFeatures') === true);
  ok('url source recorded', U.flags.all().enableBossCinematics.source === 'url');

  const C = load(makeWindow('?ff=enableAnalytics:0', 'localhost'));
  ok('?ff=name:0 turns off', C.flags.on('enableAnalytics') === false);

  const S = load(makeWindow('', 'localhost'));
  S.flags.set('enableAnalytics', false);
  ok('set() persists + reads back', S.flags.on('enableAnalytics') === false);
  ok('set() source is local', S.flags.all().enableAnalytics.source === 'local');
  S.flags.reset();
  ok('reset() restores default', S.flags.on('enableAnalytics') === true);
}

/* ── 3. logging ───────────────────────────────────────────────────────────── */
console.log('\nlog');
{
  const O = load(makeWindow('', 'playchartquest.com'));
  const seen = [];
  O.log.addSink(r => seen.push(r));
  O.log.info('t', 'hello');
  O.log.warn('t', 'careful');
  O.log.error('t', 'bad', { a: 1 });
  ok('sink receives every record', seen.length >= 3, String(seen.length));
  ok('record shape', seen[0].scope === 't' && seen[0].level === 'info' && typeof seen[0].iso === 'string');
  ok('tail filters by level', O.log.tail(50, 'error').every(r => r.lvl >= 40));
  ok('debug is NOT buffered', O.log.tail(200, 'debug').every(r => r.level !== 'debug'));
  const throwing = () => { throw new Error('sink blew up'); };
  O.log.addSink(throwing);
  let survived = true;
  try { O.log.info('t', 'after bad sink'); } catch (e) { survived = false; }
  ok('a throwing sink cannot break the caller', survived);
  O.log.removeSink(throwing);
  // ring bound
  for (let i = 0; i < 400; i++) O.log.info('t', 'spam ' + i);
  ok('ring buffer is bounded at 200', O._internal.ring().length === 200, String(O._internal.ring().length));
  ok('message is clipped', O.log.info('t', 'x'.repeat(1000)).message.length <= 301);
}

/* ── 4. errors ────────────────────────────────────────────────────────────── */
console.log('\nerr');
{
  const O = load(makeWindow('', 'localhost'));
  ok('guard returns value on success', O.err.guard('t', () => 42) === 42);
  ok('guard returns fallback on throw', O.err.guard('t', () => { throw new Error('x'); }, 'fb') === 'fb');
  ok('guard records a runtime_error', O.health.counters().runtime_error.count === 1);
  const w = O.err.wrap('t', () => { throw new Error('y'); }, 'FB');
  ok('wrap returns a guarded fn', w() === 'FB');
  ok('friendly() is 10-year-old wording', /try again/i.test(O.err.friendly('save')));
  ok('friendly() unknown code falls back', O.err.friendly('zzz') === O.err.messages.generic);

  let notified = null;
  O.err.setNotifier(t => { notified = t; });
  O.err.notify('survey');
  ok('notify reaches the notifier', typeof notified === 'string' && notified.length > 0);

  // durable queue
  const q = O.err.queue('test', { limit: 5 });
  q.push({ answer: 'a' }); q.push({ answer: 'b' });
  ok('queue persists', q.size() === 2, String(q.size()));
  ok('queue is bounded', (() => { for (let i = 0; i < 20; i++) q.push({ i }); return q.size() === 5; })());
  return Promise.resolve()
    .then(() => q.drain(() => Promise.resolve(false)))
    .then(kept => { ok('failed drain KEEPS items', kept === false && q.size() === 5, String(q.size())); })
    .then(() => q.drain(() => Promise.resolve(true)))
    .then(done => { ok('confirmed drain CLEARS items', done === true && q.size() === 0, String(q.size())); })
    .then(() => {
      let n = 0;
      return O.err.retry('t', () => { n++; return n < 3 ? Promise.reject(new Error('no')) : 'yes'; }, { tries: 5, baseMs: 1 })
        .then(v => ok('retry succeeds after transient failures', v === 'yes' && n === 3, `v=${v} n=${n}`));
    })
    .then(() => O.err.retry('t', () => Promise.reject(new Error('always')), { tries: 2, baseMs: 1 })
      .then(() => ok('retry rejects after exhausting tries', false), () => ok('retry rejects after exhausting tries', true)))
    .then(() => O.err.guardAsync('t', () => Promise.reject(new Error('nope')), 'FB')
      .then(v => ok('guardAsync never rejects', v === 'FB')))
    .then(finish);
}

function finish() {
  /* ── 5. health + report ─────────────────────────────────────────────────── */
  console.log('\nhealth / report');
  const O = load(makeWindow('', 'playchartquest.com'));
  ok('starts clean', O.health.ok() === true);
  O.health.asset('/bosses/intros/g1.mp4', false);
  ok('asset(false) records missing_asset', O.health.counters().missing_asset.count === 1);
  ok('asset(true) records nothing', (O.health.asset('/x', true), O.health.counters().missing_asset.count === 1));
  ok('unknown kind is refused', O.health.record('not_a_kind', 'x') === false);
  ok('transition allows a legal move', O.health.transition('boss', 'idle', 'intro', { idle: ['intro'] }) === true);
  ok('transition flags an illegal move', O.health.transition('boss', 'idle', 'dead', { idle: ['intro'] }) === false);
  ok('illegal transition is recorded', O.health.counters().state_transition.count === 1);
  ok('samples are capped at 5', (() => { for (let i = 0; i < 20; i++) O.health.record('api_failure', 'e' + i); return O.health.counters().api_failure.samples.length === 5; })());
  ok('health.ok() false once something is recorded', O.health.ok() === false);

  const r = O.report();
  ok('report has build/env/flags/health/log',
    r.build && r.env && r.flags && r.health && Array.isArray(r.log));
  ok('report build is unstamped without a meta tag', r.build.commit === 'unstamped');
  ok('report is JSON-serialisable', (() => { try { JSON.stringify(r); return true; } catch (e) { return false; } })());
  ok('summary is a one-liner', /^CQOPS 1\.0\.0 · build /.test(O.summary()), O.summary());

  /* ── 6. network observer never alters the call ──────────────────────────── */
  console.log('\nnetwork observer');
  {
    const win = makeWindow('', 'playchartquest.com');
    const calls = [];
    win.fetch = function (u, o) { calls.push([u, o]); return Promise.resolve({ ok: false, status: 503, type: 'basic' }); };
    const N = load(win);
    ok('fetch was wrapped', win.fetch.__cqops === true);
    return win.fetch('https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest', { method: 'POST' })
      .then(res => {
        ok('original response passes through untouched', res.status === 503 && res.ok === false);
        ok('arguments reach the original fetch', calls.length === 1 && calls[0][1].method === 'POST');
        return new Promise(r => setTimeout(r, 5));
      })
      .then(() => {
        ok('failed POST recorded as api_failure', N.health.counters().api_failure.count === 1, JSON.stringify(N.health.counters().api_failure));
        ok('ingest failure ALSO recorded as analytics_failure', N.health.counters().analytics_failure.count === 1);
        const win2 = makeWindow('', 'playchartquest.com');
        win2.fetch = () => Promise.resolve({ ok: true, status: 200, type: 'basic' });
        const M = load(win2);
        return win2.fetch('/x').then(() => new Promise(r => setTimeout(r, 5))).then(() => {
          ok('a healthy response records nothing', M.health.counters().api_failure.count === 0);
        });
      })
      .then(() => {
        // opaque responses are ok:false by design and must be ignored
        const win3 = makeWindow('', 'playchartquest.com');
        win3.fetch = () => Promise.resolve({ ok: false, status: 0, type: 'opaque' });
        const K = load(win3);
        return win3.fetch('/y').then(() => new Promise(r => setTimeout(r, 5))).then(() => {
          ok('opaque (no-cors) responses are ignored', K.health.counters().api_failure.count === 0);
        });
      })
      .then(() => {
        // a rejecting fetch must still reject for the caller, and must not create an unhandled rejection
        const win4 = makeWindow('', 'playchartquest.com');
        win4.fetch = () => Promise.reject(new Error('offline'));
        const J = load(win4);
        let rejected = false;
        return win4.fetch('/z').catch(() => { rejected = true; }).then(() => new Promise(r => setTimeout(r, 5))).then(() => {
          ok('a rejecting fetch still rejects for the caller', rejected === true);
          ok('network rejection recorded', J.health.counters().api_failure.count === 1);
        });
      })
      .then(report);
  }
}

function report() {
  console.log('\n' + '='.repeat(50));
  console.log(`  ${pass} pass · ${fail} fail`);
  console.log('\n' + (fail ? 'FAIL' : 'PASS') + '\n');
  process.exit(fail ? 1 : 0);
}

process.on('unhandledRejection', e => { console.log('  ✗ UNHANDLED REJECTION: ' + e); fail++; });
