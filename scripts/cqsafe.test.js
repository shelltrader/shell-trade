#!/usr/bin/env node
'use strict';

/*
 * Durable build-365 beta-blocker regression suite.
 *
 * The CQSAFE owner is inlined in the canonical single-file game. These tests evaluate that exact
 * source block in a fresh VM for every behavioural case, then lock the small integration contracts
 * that cannot be exercised without booting the whole game. The suite is read-only and network-free.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME_FILE = path.join(ROOT, 'chart-quest.html');
const GAME = fs.readFileSync(GAME_FILE, 'utf8');
const CQSH = fs.readFileSync(path.join(ROOT, 'scripts', 'cq.sh'), 'utf8');
const QA_SERVER = fs.readFileSync(path.join(ROOT, 'scripts', 'beta360_qa_server.py'), 'utf8');

function section(startMarker, endMarker) {
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  const end = GAME.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing source marker after ${startMarker}: ${endMarker}`);
  return GAME.slice(start, end);
}

function freshSafe() {
  const startMarker = 'window.CQSAFE = (function () {';
  const endMarker = '\n})();';
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, 'window.CQSAFE owner missing');
  const end = GAME.indexOf(endMarker, start);
  assert.notEqual(end, -1, 'window.CQSAFE owner terminator missing');
  const sandbox = { window: {} };
  vm.runInNewContext(GAME.slice(start, end + endMarker.length), sandbox, {
    filename: 'chart-quest.html#CQSAFE',
    timeout: 1000,
  });
  assert.ok(sandbox.window.CQSAFE, 'window.CQSAFE was not published');
  return sandbox.window.CQSAFE;
}

function freshView(cssValues = {}) {
  const startMarker = 'window.CQVIEW = (function () {';
  const endMarker = '\n})();';
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, 'window.CQVIEW owner missing');
  const end = GAME.indexOf(endMarker, start);
  assert.notEqual(end, -1, 'window.CQVIEW owner terminator missing');
  const sandbox = {
    window: {
      getComputedStyle: () => ({
        getPropertyValue: name => Object.prototype.hasOwnProperty.call(cssValues, name) ? cssValues[name] : '0px',
      }),
    },
    document: { documentElement: {} },
  };
  const world = `
    const turtle = { y: 500, _pcy: 512, spinning: true, tipY: 420, spinBase: 530, grabY: 470,
      trail: [{ x: 1, y: 490 }, { x: 2, y: 480 }] };
    const rings = [{ x: 20, y: 460 }];
    let camY = 70, _portalGroundY = 524, _finnFallTop = 440;
  `;
  vm.runInNewContext(`${world}\n${GAME.slice(start, end + endMarker.length)}\n` +
    'window.__viewState = () => ({ turtle, rings, camY, _portalGroundY, _finnFallTop });', sandbox, {
    filename: 'chart-quest.html#CQVIEW',
    timeout: 1000,
  });
  return { view: sandbox.window.CQVIEW, state: () => JSON.parse(JSON.stringify(sandbox.window.__viewState())) };
}

function movedRect(rect, placed) {
  return { x: placed.x, y: placed.y, w: rect.w, h: rect.h };
}

const tests = [
  ['build 365 retains build-363 safe-area owner and first-session edge contracts', () => {
    const fixture = freshView({
      '--cq-safe-top': '47px', '--cq-safe-right': '12.5px',
      '--cq-safe-bottom': '34px', '--cq-safe-left': 'invalid',
    });
    assert.deepEqual(JSON.parse(JSON.stringify(fixture.view.insets())), { top: 47, right: 12.5, bottom: 34, left: 0 });
    assert.deepEqual(JSON.parse(JSON.stringify(fixture.view.insets({ top: -8, right: '9px', bottom: Infinity, left: 3 }))),
      { top: 0, right: 9, bottom: 0, left: 3 });
    const hostile = new Proxy({}, { get() { throw new Error('hostile inset getter'); } });
    assert.doesNotThrow(() => fixture.view.insets(hostile));
    assert.deepEqual(JSON.parse(JSON.stringify(fixture.view.insets(hostile))), { top: 0, right: 0, bottom: 0, left: 0 });

    assert.match(GAME, /--cq-safe-top:\s*env\(safe-area-inset-top, 0px\)/);
    const mmSkipCss = section('#mmSkip {', '/* Black-and-gold portal');
    assert.match(mmSkipCss, /top: calc\(14px \+ var\(--cq-safe-top\)\)/);
    assert.match(mmSkipCss, /right: calc\(14px \+ var\(--cq-safe-right\)\)/);
    assert.match(mmSkipCss, /min-height:\s*44px/);
    assert.match(mmSkipCss, /min-width:\s*72px/);
    const skipZ = Number((mmSkipCss.match(/z-index:\s*(\d+)/) || [])[1]);
    const portalZ = Number((section('#mmPortal {', '#mmPortal.show').match(/z-index:\s*(\d+)/) || [])[1]);
    assert.ok(skipZ > portalZ, 'the visible Skip must retain hit ownership after the ENTER portal appears');
    const mmEnterCss = section('#mmEnter {', '#mmEnter:hover');
    assert.match(mmEnterCss, /bottom: max\(5\.5%, calc\(10px \+ var\(--cq-safe-bottom\)\)\)/);

    const introDraw = section('// SKIP control (top-right)', 'return { start, update, draw');
    assert.match(introDraw, /CQVIEW\.insets\(\)/);
    assert.match(introDraw, /const sw = 72, sh = 44/);
    assert.match(introDraw, /sx = W - sw - 12 - safe\.right/);
    assert.match(introDraw, /sy = 14 \+ safe\.top/);
    assert.match(introDraw, /S\.skipBox = \{ x: sx, y: sy, w: sw, h: sh \}/);

    const geometry = section('function movementSkipRect(width,height,source){', 'function drawSkip()');
    const sandbox = { window: { CQVIEW: fixture.view }, result: null };
    vm.runInNewContext(`${geometry}\nresult = movementSkipRect(390, 844, {right:12,bottom:34});`, sandbox, { timeout: 1000 });
    assert.deepEqual(JSON.parse(JSON.stringify(sandbox.result)), { x: 280, y: 752, w: 84, h: 44 });
    vm.runInNewContext('result = movementSkipRect(390, 844, {});', sandbox, { timeout: 1000 });
    assert.deepEqual(JSON.parse(JSON.stringify(sandbox.result)), { x: 292, y: 786, w: 84, h: 44 },
      'zero insets retain the 14px edge offsets while enlarging the touch target');
    const draw = section('function drawSkip(){', '// ── input ──');
    assert.match(draw, /const box=movementSkipRect\(W,H\)/);
    assert.match(draw, /S\.skipBox=box;/, 'draw and hit-testing must share the exact rectangle object');
    assert.match(section('function onDown(e){', 'function onMove(e){'), /const b=S\.skipBox;/);
  }],

  ['build 365 retains capped backing resolution and transactional terrain reanchoring', () => {
    assert.match(GAME, /const dpr = Math\.min\(2, Math\.max\(1, Number\(window\.devicePixelRatio\) \|\| 1\)\);/);
    assert.match(GAME, /const groundShift = groundY - priorGroundY;/);
    assert.match(GAME, /const journeyOwnsTerrain = !!\(window\.BlockchainJourney/);
    assert.match(GAME, /if \(groundShift && !journeyOwnsTerrain && window\.CQVIEW\) window\.CQVIEW\.shiftWorldY\(groundShift\);/);

    const resizeSource = section('function resize() {', "window.addEventListener('resize', resize);");
    function resizeFixture(rawDpr, width, height, withOwner = true) {
      const shifts = [], transforms = [];
      const sandbox = {
        W: 0, H: 0, groundY: 0, stageX: 0, stageY: 0, MAX_ASPECT: 0.58,
        stageEl: { style: {} },
        canvas: { width: 0, height: 0, style: {} },
        ctx: { setTransform: (...args) => transforms.push(args) },
        window: {
          innerWidth: width, innerHeight: height, devicePixelRatio: rawDpr,
          CQREACH: { reanchor() {} },
        },
      };
      if (withOwner) sandbox.window.CQVIEW = { shiftWorldY: delta => shifts.push(delta) };
      const context = vm.createContext(sandbox);
      vm.runInContext(`${resizeSource}\nwindow.__resize = resize;`, context, { timeout: 1000 });
      return {
        sandbox, shifts, transforms,
        run(nextWidth = sandbox.window.innerWidth, nextHeight = sandbox.window.innerHeight) {
          sandbox.window.innerWidth = nextWidth; sandbox.window.innerHeight = nextHeight;
          sandbox.window.__resize();
          return {
            W: sandbox.W, H: sandbox.H, groundY: sandbox.groundY,
            backing: [sandbox.canvas.width, sandbox.canvas.height],
            css: [sandbox.canvas.style.width, sandbox.canvas.style.height],
            transform: transforms[transforms.length - 1],
          };
        },
      };
    }
    for (const rawDpr of [1, 2, 3, 4]) {
      const fixtureDpr = resizeFixture(rawDpr, 390, 844);
      const actual = fixtureDpr.run();
      const effective = Math.min(rawDpr, 2);
      assert.deepEqual(actual.backing, [390 * effective, 844 * effective]);
      assert.deepEqual(actual.css, ['390px', '844px']);
      assert.deepEqual(actual.transform, [effective, 0, 0, effective, 0, 0]);
    }
    const large = resizeFixture(3, 430, 932).run();
    assert.deepEqual(large.backing, [860, 1864]);
    assert.deepEqual(large.css, ['430px', '932px']);

    const early = resizeFixture(3, 390, 0, false);
    assert.doesNotThrow(() => early.run(), 'zero-height boot before the late terrain owner must be safe');
    early.sandbox.window.CQVIEW = { shiftWorldY: delta => early.shifts.push(delta) };
    const recovered = early.run(390, 844);
    assert.equal(recovered.groundY, 591);
    assert.deepEqual(early.shifts, [591], 'delayed zero→valid sizing must translate initialized terrain state');

    const dynamic = resizeFixture(2, 390, 812);
    dynamic.run();
    dynamic.shifts.length = 0;
    dynamic.run(390, 730);
    dynamic.run(390, 812);
    dynamic.run(390, 812);
    assert.deepEqual(dynamic.shifts, [-57, 57], 'height collapse/restore translates once each; same-size is idempotent');

    const journey = resizeFixture(2, 390, 812);
    journey.run();
    journey.shifts.length = 0;
    journey.sandbox.window.BlockchainJourney = { _S: { active: true } };
    journey.run(390, 390);
    journey.run(390, 812);
    assert.deepEqual(journey.shifts, [], 'the active first-session tutorial retains sole ownership of Finn terrain');
    journey.sandbox.window.BlockchainJourney._S.active = false;
    journey.run(390, 730);
    assert.deepEqual(journey.shifts, [-57], 'main-world translation resumes after tutorial handoff');

    const fixture = freshView();
    assert.equal(fixture.view.shiftWorldY(-57), -57);
    const state = fixture.state();
    assert.equal(state.turtle.y, 443);
    assert.equal(state.turtle._pcy, 455, 'the collision sweep origin must move with Finn');
    assert.deepEqual(state.turtle.trail.map(ghost => ghost.y), [433, 423]);
    assert.deepEqual([state.turtle.tipY, state.turtle.spinBase, state.turtle.grabY], [363, 473, 413]);
    assert.equal(state.rings[0].y, 403);
    assert.deepEqual([state.camY, state._portalGroundY, state._finnFallTop], [70, 467, 383],
      'camera refits independently while remembered terrain anchors translate');
    assert.equal(state.turtle.y - state._finnFallTop, 60, 'fall distance must be invariant');
    assert.equal(state.turtle.y - state.turtle._pcy, -12, 'swept collision segment must be invariant');
    const before = fixture.state();
    assert.equal(fixture.view.shiftWorldY('not-a-number'), 0);
    assert.deepEqual(fixture.state(), before, 'invalid shifts must be non-throwing no-ops');
    assert.equal(fixture.view.shiftWorldY(57), 57);
    assert.deepEqual(fixture.state(), {
      turtle: { y: 500, _pcy: 512, spinning: true, tipY: 420, spinBase: 530, grabY: 470,
        trail: [{ x: 1, y: 490 }, { x: 2, y: 480 }] },
      rings: [{ x: 20, y: 460 }], camY: 70, _portalGroundY: 524, _finnFallTop: 440,
    }, '812→730→812 terrain translation must be exactly reversible');
  }],

  ['reserve/get/clear publishes and releases a measured zone', () => {
    const safe = freshSafe();
    const saved = safe.reserve('lessonCard', { x: 4, y: 100, w: 286, h: 41 }, { pri: 1 });
    assert.equal(saved.x, 4);
    assert.equal(saved.pri, 1);
    assert.equal(safe.get('lessonCard').h, 41);
    safe.clear('lessonCard');
    assert.equal(safe.get('lessonCard'), null);
  }],

  ['degenerate and non-finite rectangles clear instead of reserving', () => {
    const safe = freshSafe();
    const invalid = [
      null,
      {},
      { x: 0, y: 0, w: 0, h: 1 },
      { x: 0, y: 0, w: 1, h: 0 },
      { x: 0, y: 0, w: -1, h: 1 },
      { x: NaN, y: 0, w: 1, h: 1 },
      { x: 0, y: Infinity, w: 1, h: 1 },
    ];
    for (const rect of invalid) {
      safe.reserve('bad', { x: 1, y: 1, w: 1, h: 1 });
      assert.doesNotThrow(() => safe.reserve('bad', rect));
      assert.equal(safe.get('bad'), null);
    }
  }],

  ['non-sticky zones remain for one prior frame and expire after two ticks', () => {
    const safe = freshSafe();
    safe.reserve('priceAxis', { x: 340, y: 40, w: 50, h: 500 });
    safe.tick();
    assert.ok(safe.get('priceAxis'), 'zone should remain readable on the next frame');
    safe.tick();
    assert.equal(safe.get('priceAxis'), null, 'zone should expire after the accepted one-frame lag');
  }],

  ['sticky zones survive frame sweeps but explicit lifecycle clear wins', () => {
    const safe = freshSafe();
    safe.reserve('cfLegend', { x: 0, y: 0, w: 390, h: 48 }, { sticky: true });
    for (let i = 0; i < 5; i++) safe.tick();
    assert.ok(safe.get('cfLegend'), 'sticky DOM zone must survive ticks');
    safe.clear('cfLegend');
    assert.equal(safe.get('cfLegend'), null, 'hidden sticky DOM zone must be explicitly released');
  }],

  ['priority passes give up SOFT before NORMAL/HARD and never give up HARD', () => {
    const soft = freshSafe();
    soft.reserve('lessonCard', { x: 0, y: 0, w: 60, h: 40 }, { pri: 1 });
    const moved = soft.place(
      { x: 10, y: 10, w: 10, h: 10 },
      { dirs: ['right'], step: 10, max: 10, pad: 0, boundsW: 100 },
    );
    assert.equal(moved.x, 20);
    assert.equal(moved.tier, 2, 'second pass may overlap SOFT when strict placement has no room');

    const hard = freshSafe();
    hard.reserve('wallet', { x: 0, y: 0, w: 80, h: 40 }, { pri: 3 });
    const fallback = hard.place(
      { x: 10, y: 10, w: 10, h: 10 },
      { dirs: ['right'], step: 10, max: 20, pad: 0, boundsW: 100 },
    );
    assert.equal(fallback.x, 10);
    assert.equal(fallback.y, 10);
    assert.equal(fallback.moved, 0, 'an unresolved HARD collision must fall back to the literal');
  }],

  ['bounds fail closed while an already-wide rect may still move vertically', () => {
    const bounded = freshSafe();
    bounded.reserve('hard', { x: 0, y: 0, w: 100, h: 100 }, { pri: 3 });
    const fallback = bounded.place(
      { x: 80, y: 10, w: 10, h: 10 },
      { dirs: ['right'], step: 10, max: 20, pad: 0, boundsW: 100 },
    );
    assert.equal(fallback.x, 80);
    assert.equal(fallback.moved, 0);

    const wide = freshSafe();
    wide.reserve('hard', { x: 0, y: 0, w: 200, h: 15 }, { pri: 3 });
    const placed = wide.place(
      { x: 0, y: 0, w: 300, h: 10 },
      { dirs: ['down'], step: 10, max: 30, pad: 0, boundsW: 100, boundsH: 100 },
    );
    assert.equal(placed.y, 20);
    assert.equal(placed.dir, 'down');
  }],

  ['every public entry point contains malformed input and throwing getters', () => {
    const safe = freshSafe();
    const hostile = new Proxy({}, { get() { throw new Error('hostile getter'); } });
    assert.doesNotThrow(() => safe.reserve('hostile', hostile));
    assert.doesNotThrow(() => safe.clear(hostile));
    assert.doesNotThrow(() => safe.get(hostile));
    assert.doesNotThrow(() => safe.hits(hostile));
    assert.doesNotThrow(() => safe.place(hostile, hostile));
    assert.doesNotThrow(() => safe.tick());
    assert.doesNotThrow(() => safe.dump());
  }],

  ['collision 1: review legend produces a measured SVG inset and clears when hidden', () => {
    const fn = section('function cfTopInset(VW, VH) {', 'function tradeChartSVGFull');
    const calls = { reserve: [], clear: [] };
    let visible = true;
    const legend = {
      classList: { contains: name => visible && name === 'on' },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 48, bottom: 48 }),
    };
    const sandbox = {
      result: null,
      document: { getElementById: id => id === 'cfLegend' ? legend : id === 'cfChart' ? { clientWidth: 390, clientHeight: 760 } : null },
      window: { CQSAFE: {
        reserve: (...args) => calls.reserve.push(args),
        clear: name => calls.clear.push(name),
      } },
    };
    vm.runInNewContext(`${fn}\nresult = cfTopInset(390, 760);`, sandbox, { timeout: 1000 });
    assert.equal(sandbox.result, 54, '48px legend + 6px breathing should inset by 54 SVG units at 1:1');
    assert.equal(calls.reserve[0][0], 'cfLegend');
    assert.equal(calls.reserve[0][2].sticky, true);

    sandbox.document.getElementById = id => id === 'cfLegend' ? legend : id === 'cfChart'
      ? { clientWidth: 197, clientHeight: 340 } : null;
    vm.runInNewContext('result = cfTopInset(390, 760);', sandbox, { timeout: 1000 });
    assert.equal(sandbox.result, 121, 'height-constrained stage must use the smaller rendered axis');

    visible = false;
    vm.runInNewContext('result = cfTopInset(390, 760);', sandbox, { timeout: 1000 });
    assert.equal(sandbox.result, 0);
    assert.ok(calls.clear.includes('cfLegend'));

    const details = section('function tradeChartSVGFull', 'function tradeReplaySVG');
    const replay = section('function tradeReplaySVG', 'function closePanel');
    assert.match(details, /const CFI = cfTopInset\(VW, VH\)/);
    assert.match(replay, /CFI = cfTopInset\(VW, VH\)/);
    const legendCss = section('#cfLegend {', '#cfLegend.on');
    assert.match(legendCss, /flex-wrap:\s*nowrap/);
    assert.match(legendCss, /overflow-x:\s*auto/);
    assert.match(legendCss, /pointer-events:\s*none/,
      'the empty legend bar must not steal the replay close target');
    assert.match(GAME, /#cfLegend button \{[\s\S]{0,320}?flex:\s*0 0 auto/);
    assert.match(GAME, /#cfLegend button \{[\s\S]{0,320}?pointer-events:\s*auto/,
      'legend controls must remain interactive while the bar background passes through');
    const show = section('function showReviewDetails()', 'function startReplay()');
    assert.ok(show.indexOf('renderReviewBar();') < show.indexOf('renderReviewChart();'));
  }],

  ['collision 2: open-trade chip clears live price/wallet at phone widths', () => {
    for (const height of [844, 667, 468, 340]) {
      const width = Math.min(390, Math.round(height * 0.58));
      const safe = freshSafe();
      safe.reserve('marketPrice', { x: 15, y: 80, w: 42, h: 9 }, { pri: 3 });
      safe.reserve('wallet', { x: width - 52, y: 17, w: 40, h: 60 }, { pri: 3 });
      const banner = { x: 12, y: 74, w: 140, h: 10 };
      assert.ok(safe.hits(banner, 'tradeBanner', 4, 3), `fixture must reproduce the ${height}px collision`);
      const placed = safe.place(banner, {
        dirs: ['right', 'down'], step: 6, max: 140, pad: 4,
        exclude: 'tradeBanner', boundsW: width - 8, boundsH: height - 8,
      });
      assert.equal(safe.hits(movedRect(banner, placed), 'tradeBanner', 4, 3), null);
      assert.ok(placed.moved > 0);
    }
    assert.match(GAME, /reserve\('marketPrice',[\s\S]{0,220}\{ pri: 3 \}/);
    assert.match(GAME, /dirs: \['right', 'down'\][\s\S]{0,160}exclude: 'tradeBanner'/);
  }],

  ['collision 3: THIS WAY clears the price axis across the 12-case short-screen matrix', () => {
    for (const height of [844, 667, 468, 340]) {
      const width = Math.min(390, Math.round(height * 0.58));
      for (const lines of [1, 2, 3]) {
        const safe = freshSafe();
        safe.reserve('priceAxis', { x: width - 50, y: 0, w: 50, h: height }, { pri: 2 });
        safe.reserve('lessonCard', {
          x: 4,
          y: 100,
          w: Math.min(width - 8, lines === 1 ? 286 : lines === 2 ? 210 : 170),
          h: 24 + lines * 17,
        }, { pri: 1 });
        const text = { x: width - 32 - 22.5, y: height * 0.42 + 19, w: 45, h: 9 };
        assert.equal(safe.hits(text, 'thisWay', 4, 2), 'priceAxis');
        const placed = safe.place(text, {
          dirs: ['left'], step: 6, max: 96, pad: 4,
          exclude: 'thisWay', boundsW: width, boundsH: height,
        });
        const finalRect = movedRect(text, placed);
        assert.equal(safe.hits(finalRect, 'thisWay', 4, 2), null, `${height}px/${lines}-line case must clear the ladder`);
        assert.ok(finalRect.x >= 0 && finalRect.x + finalRect.w <= width);
      }
    }
    assert.match(GAME, /reserve\('priceAxis',[\s\S]{0,180}_axW/);
    assert.match(GAME, /dirs: \['left'\][\s\S]{0,140}exclude: 'thisWay'/);
  }],

  ['collision 4: ticket and TRADE INCOMING converge safely in both orders', () => {
    const start = GAME.indexOf('function openPanel() {');
    const hide = GAME.indexOf('hideTradeIncoming()', start);
    const open = GAME.indexOf("panelEl.classList.add('open')", start);
    assert.ok(start >= 0 && hide > start && open > hide, 'hideTradeIncoming must precede opening the ticket');

    const lifecycle = section('function showTradeIncoming()', 'function nextSetupIn()');
    assert.match(lifecycle, /typeof pending !== 'undefined' && pending/);
    assert.match(lifecycle, /typeof trade !== 'undefined' && trade/);
    assert.match(lifecycle, /ticket && ticket\.classList\.contains\('open'\)/);
    assert.ok(lifecycle.indexOf('hideTradeIncoming();') < lifecycle.indexOf('if (_anyBlockingUI())'));
    assert.match(lifecycle, /window\._tiRetry[\s\S]{0,100}clearTimeout\(window\._tiRetry\)[\s\S]{0,80}window\._tiRetry = null/);

    const ticket = { open: false, classList: { contains(name) { return name === 'open' && ticket.open; } } };
    const notice = { style: { display: 'none' } };
    let blocked = false;
    let nextTimer = 1;
    const callbacks = new Map();
    const sandbox = {
      window: {}, document: { getElementById: id => id === 'tradePanel' ? ticket : id === 'tradeIncoming' ? notice : null },
      pending: null, trade: null, tradeIncomingActive: false,
      _anyBlockingUI: () => blocked,
      setTimeout: fn => { const id = nextTimer++; callbacks.set(id, fn); return id; },
      clearTimeout: id => callbacks.delete(id),
    };
    vm.runInNewContext(lifecycle, sandbox, { timeout: 1000 });

    sandbox.showTradeIncoming();
    assert.equal(notice.style.display, 'block', 'notice-first path should show the notice');
    sandbox.pending = {};
    sandbox.showTradeIncoming();
    assert.equal(notice.style.display, 'none', 'opening/arming the ticket must dismiss the notice');
    assert.equal(sandbox.window._tiRetry || null, null);

    sandbox.pending = null;
    blocked = true;
    sandbox.showTradeIncoming();
    const retryId = sandbox.window._tiRetry;
    const retry = callbacks.get(retryId);
    assert.equal(typeof retry, 'function', 'generic UI may defer the notice');
    blocked = false;
    ticket.open = true;
    retry();
    assert.equal(notice.style.display, 'none', 'ticket-first retry must converge to hidden');
    assert.equal(sandbox.window._tiRetry || null, null);

    ticket.open = false;
    sandbox.trade = {};
    sandbox.showTradeIncoming();
    assert.equal(notice.style.display, 'none', 'a live trade makes the introductory notice obsolete');
  }],

  ['sticky review teardown has one owner and every close path uses it', () => {
    const hide = section('function hideReviewLegend()', 'function closeReviewChart()');
    const close = section('function closeReviewChart()', '// Top control bar');
    assert.match(hide, /classList\.remove\('on'\)/);
    assert.match(hide, /CQSAFE\.clear\('cfLegend'\)/);
    assert.match(close, /stopReplay\(\)/);
    assert.match(close, /classList\.remove\('open'\)/);
    assert.match(close, /hideReviewLegend\(\)/);
    assert.match(close, /reviewEntry = null/);
    assert.match(close, /_replayAutoDetails = false/);
    assert.doesNotMatch(GAME, /\$\('cfLegend'\)\.classList\.remove\('on'\)/);
    assert.doesNotMatch(GAME, /\$id\('cfLegend'\)[^\n]*classList\.remove\('on'\)/);

    const journalClose = section('function closeJournal()', '// Tab bar');
    assert.match(journalClose, /closeReviewChart\(\)/);
    const chartTap = section("$('chartFull').addEventListener('pointerdown'", '/* Live R-multiple');
    assert.match(chartTap, /closeReviewChart\(\)/);
    const tutorialHold = section('function holdTradeReview(next)', '/* ── CSS');
    assert.match(tutorialHold, /closeReviewChart\(\)/);
    const tutorialThaw = section('function thaw()', '/* ── GEOMETRY');
    assert.match(tutorialThaw, /closeReviewChart\(\)/);
  }],

  ['manual close uses the inclusive break-even band on every persisted display surface', () => {
    const classifier = section('function tradeOutcomeDisplay(result, delta)', 'let pending = null');
    const sandbox = {
      COLOR: { greenBody: '#green', redBody: '#red' },
      samples: null,
    };
    vm.runInNewContext(
      `${classifier}\n` +
      `samples = [-0.51,-0.5,-0.1,-0,0,0.1,0.5,0.51].map(value => tradeOutcomeDisplay('manual', value));`,
      sandbox,
      { timeout: 1000 },
    );
    const [negative, ...middle] = sandbox.samples;
    const positive = middle.pop();
    assert.equal(negative.pnl, -1);
    assert.equal(negative.sign, '−');
    assert.equal(negative.toneName, 'loss');
    assert.equal(negative.color, '#red');
    assert.equal(positive.pnl, 1);
    assert.equal(positive.sign, '+');
    assert.equal(positive.toneName, 'win');
    assert.equal(positive.color, '#green');
    for (const flat of middle) {
      assert.equal(flat.value, 0);
      assert.equal(flat.pnl, 0);
      assert.equal(flat.sign, '');
      assert.equal(flat.toneName, 'flat');
      assert.equal(flat.color, '#7d8aa0');
      assert.equal(flat.badge, '● CLOSED EARLY');
    }

    const summary = section('function tradeChartSVGFull', 'function tradeReplaySVG');
    assert.match(summary, /const isManual\s*=\s*t\.result === 'manual'/);
    assert.match(summary, /tradeOutcomeDisplay\(t\.result, t\.delta\)/);
    assert.match(summary, /const resultCol = outcome\.color/);
    assert.match(summary, /const dSign\s*= outcome\.sign/);
    assert.match(summary, /isWin \? '✓ WIN' : isManual \? '● CLOSED EARLY' : '✗ LOSS'/);
    assert.match(summary, /You closed it yourself at break even/);
    assert.match(summary, /No profit, no loss — you stayed in control/);
    assert.match(summary, /closed flat at/);

    const replay = section('function tradeReplaySVG', 'function closePanel');
    assert.match(replay, /tradeOutcomeDisplay\(entry\.result, entry\.delta\)/);
    assert.match(replay, /_man = entry\.result === 'manual'/);
    assert.match(replay, /_man \? '● CLOSED EARLY\s+'/);
    assert.match(replay, /statusCol = outcome\.color/);

    const intermissionOpen = section('function imOpenReplay(t)', 'function imCloseReplay()');
    assert.match(intermissionOpen, /tradeOutcomeDisplay\(t\.result,t\.delta\)/);
    assert.match(intermissionOpen, /outcome\.sign/);
    const intermissionReplay = section('function imStartReplay()', 'function imDrawReplay(n)');
    assert.match(intermissionReplay, /outcome\.badge/);
    assert.match(intermissionReplay, /outcome\.toneName/);
    assert.match(GAME, /const outcome4 = tradeOutcomeDisplay\(t\.result, t\.delta\)/);

    const journalWrite = section('function logJournalTrade(t)', 'loadJournal();');
    assert.match(journalWrite, /tradeOutcomeDisplay\(t\.result, t\.delta\)/);
    assert.match(journalWrite, /delta: Math\.round\(outcome\.value\)/);

    const journalStats = section('function renderJournalStats()', 'function renderJournalList()');
    assert.match(journalStats, /journal\.map\(e => tradeOutcomeDisplay\(e\.result, e\.delta\)\)/);
    assert.doesNotMatch(journalStats, /journal\.filter\(e => e\.delta [<>] 0\)/);
    assert.match(journalStats, /tradeOutcomeDisplay\('manual', net\)/);
    assert.match(journalStats, /lossCount \? '−' \+ fmt\(avgLoss\) : '0'/);
    assert.match(journalStats, /lossCount \? '#ea3943' : '#7d8aa0'/);

    const journal = section('function renderJournalList()', '// ── Trade review:');
    assert.match(journal, /tradeOutcomeDisplay\(e\.result, e\.delta\)/);
    assert.match(journal, /const cls = outcome\.toneName/);
    assert.match(journal, /const dsign = outcome\.sign/);
    assert.match(journal, /dsign \+ fmt\(Math\.abs\(outcome\.value\)\)/);

    const notes = section('function noteLinkLabel(n)', 'function renderJournalSection()');
    assert.ok((notes.match(/tradeOutcomeDisplay\(e\.result, e\.delta\)/g) || []).length >= 2,
      'note label and trade option must share the classifier');
    assert.doesNotMatch(notes, /e\.delta >= 0 \? '\+' : '−'/);

    const resolver = section('function resolveTrade(result)', '// Between guided trades:');
    assert.match(resolver, /const outcome = tradeOutcomeDisplay\(result, delta\)/);
    assert.match(resolver, /const msg = outcome\.pnl === 0 \? 'BREAK EVEN'/);
    assert.ok((resolver.match(/outcome\.pnl/g) || []).length >= 5, 'visible post-trade copy must use the classifier');
    assert.match(resolver, /closed at break even/);
    assert.match(resolver, /const net = outcome\.sign \+ fmt\(Math\.abs\(outcome\.value\)\)/);
    assert.match(resolver, /if \(result === 'loss'\)/, 'loss reassurance must not run for manual closes');
    assert.match(resolver, /if \(result === 'loss' && !localStorage\.getItem\('cq_lossmsg_v1'\)\)/,
      'first-loss stop language must never run for a manual close');
    assert.doesNotMatch(resolver, /if \(delta < 0 && !localStorage\.getItem\('cq_lossmsg_v1'\)\)/);
    assert.match(resolver, /if \(result === 'win'\) teach\('win'\)/);
    assert.match(resolver, /else if \(result === 'loss'\) teach\('loss'\)/);
    assert.doesNotMatch(resolver, /teach\(delta > 0 \? 'win' : 'loss'\)/,
      'manual closes must not enqueue target-hit or stopped-out teaching');
    assert.match(resolver, /dir: trade\.dir, result, delta/);
  }],

  ['replay close/X lifecycle remains reachable and centrally tears down state', () => {
    const legendZ = Number((GAME.match(/#cfLegend \{[\s\S]{0,180}?z-index:\s*(\d+)/) || [])[1]);
    const closeZ = Number((GAME.match(/#chartFull \.uxX \{ z-index:\s*(\d+)/) || [])[1]);
    assert.ok(closeZ > legendZ, `close button z-index ${closeZ} must beat legend ${legendZ}`);

    const chartMarkup = section('<div id="chartFull">', '<div id="cfPredict">');
    assert.match(chartMarkup, /<button class="uxX"[\s\S]*aria-label="Close"/);
    assert.ok(chartMarkup.indexOf('class="uxX"') < chartMarkup.indexOf('id="cfLegend"'));

    const replay = section('function startReplay()', '// Open any trade record');
    assert.match(replay, /if \(_replayAutoDetails\)[\s\S]{0,100}showReviewDetails\(\)/);
    assert.match(replay, /let terminalHoldTicks = 0/);
    assert.match(replay, /if \(terminalHoldTicks < 3\) \{ terminalHoldTicks\+\+; return; \}/,
      'the crossed TP\/SL frame must remain visible long enough to read on a phone');
    assert.match(GAME, /autoOpenTradeReplay\(tradeRecord\)/);
  }],

  ['trade-time boxes and pages defer interaction without deletion', () => {
    const predicate = section('function tradeInProgress()', 'let pending = null');
    for (const name of ['trade', 'pending']) assert.match(predicate, new RegExp(`typeof ${name}`));
    assert.doesNotMatch(predicate, /typeof setupFlow/,
      'a visible setup-forming window is not a trade and must not disable world rewards');
    const owner = { trade: null, pending: null, setupFlow: { phase: 'armed', armed: true } };
    vm.runInNewContext(predicate, owner, { timeout: 1000 });
    assert.equal(owner.tradeInProgress(), false, 'setupFlow alone must keep boxes/pages interactive');
    owner.pending = {};
    assert.equal(owner.tradeInProgress(), true, 'the actual ticket still owns trade focus');

    const boxes = section('function updateBoxes(dt, tx, ty)', 'function drawBoxes(camX)');
    assert.match(boxes, /const touches = finnSweptRewardTouch/);
    assert.match(boxes, /if \(touches && !tradeInProgress\(\)\) \{[\s\S]{0,100}smashBox\(b\)/);
    assert.match(boxes, /b\.x < turtle\.x - 2600 && !tradeInProgress\(\)/);

    let tradeActive = true;
    const boxSandbox = {
      boxes: [{ bob: 0, glow: 0, rot: 0, orb: 0, excite: 0, breakT: 0, broken: false, x: 0, y: 0, w: 20 }],
      boxFx: [], turtle: { x: 3000, tucked: false },
      tradeInProgress: () => tradeActive,
      finnSweptRewardTouch: () => false,
      smashBox() {}, boxRefuse() {}, Math,
    };
    vm.runInNewContext(boxes, boxSandbox, { timeout: 1000 });
    boxSandbox.updateBoxes(0, 0, 0);
    assert.equal(boxSandbox.boxes.length, 1, 'a behind-Finn box must remain durable during a trade');
    tradeActive = false;
    boxSandbox.updateBoxes(0, 0, 0);
    assert.equal(boxSandbox.boxes.length, 0, 'normal culling must resume after the trade');

    const pages = section('function updateWisdomPages(dt, tx, ty)', 'function collectWisdomPage(p)');
    const guard = pages.indexOf('if (tradeInProgress()) continue;');
    assert.ok(guard >= 0);
    assert.ok(guard < pages.indexOf("if (p.state === 'clue')"));
    assert.ok(guard < pages.indexOf('collectWisdomPage(p)'));
  }],

  ['build 365 boxes/pages use Finn body plus swept motion and work during setup formation', () => {
    const touch = section('function finnSweptRewardTouch(', '/* One display-only classifier');
    const boxSource = section('function updateBoxes(dt, tx, ty)', 'function drawBoxes(camX)');
    const pageSource = section('function updateWisdomPages(dt, tx, ty)', 'function collectWisdomPage(p)');
    const sandbox = {
      Math, Number,
      turtle: { x: 100, y: -12, w: 36, h: 24, _pcx: 0, _pcy: 0, tucked: true },
      boxes: [{ bob: 0, glow: 0, rot: 0, orb: 0, excite: 0, breakT: 0, broken: false,
        x: 50, y: 0, w: 24 }],
      boxFx: [], wisdomPages: [{ idx: 1, kind: 'easy', state: 'live', x: 50, y: 0,
        tipY: 0, bobT: 0, revealT: 0, collected: false, flyT: 0 }],
      tradeInProgress: () => false,
      smashCount: 0, collectCount: 0,
      smashBox(box) { box.broken = true; sandbox.smashCount++; },
      boxRefuse() {},
      collectWisdomPage(page) { page.collected = true; sandbox.collectCount++; },
      document: { body: { classList: { toggle() {} } } },
      bossesEverCount: () => 0,
    };
    vm.runInNewContext(`${touch}\n${boxSource}\n${pageSource}`, sandbox, { timeout: 1000 });
    assert.equal(sandbox.finnSweptRewardTouch(100, 0, 50, 0, 12, 12), true,
      'a reward crossed between frames must intersect Finn\'s swept body');
    sandbox.updateBoxes(0.016, 100, 0);
    sandbox.updateWisdomPages(0.016, 100, 0);
    assert.equal(sandbox.smashCount, 1, 'one explicit tucked sweep must smash exactly once');
    assert.equal(sandbox.collectCount, 1, 'one visibly crossed page must collect exactly once');

    const visibleOverlap = { turtle: { _pcx: 0, _pcy: 0, w: 36, h: 24 }, Math, Number };
    vm.runInNewContext(touch, visibleOverlap, { timeout: 1000 });
    assert.equal(visibleOverlap.finnSweptRewardTouch(0, 0, 31, 0, 16, 20), true,
      'the screenshot-scale page overlap that failed the old 30px centre circle must now collect');
  }],

  ['build 365 first trade owns a warmer authored score and retains the complete four-act roller coaster', () => {
    assert.match(GAME, /trade\._firstRide = !!_introTrade/);
    assert.match(GAME, /function tradeMusicTrack\(isFirstRide\) \{ return isFirstRide \? 'firstTrade' : 'trade'; \}/);
    assert.match(GAME, /GameMusic\.play\(tradeMusicTrack\(_introTrade\)\)/);
    const audio = section('function play(name) {', 'function boss(level)');
    assert.match(audio, /name === 'firstTrade'/);
    assert.match(audio, /buildFirstTradeScore\(\)/);
    assert.match(audio, /run\(buildFirstTradeScore\(\), \{ name: 'firstTrade', vol: 0\.17 \}\)/);
    const firstScore = section('function buildFirstTradeScore()', 'function tick()');
    assert.match(firstScore, /first-trade-score-v2/);
    assert.match(firstScore, /warmLead: true/);
    assert.match(firstScore, /beat: \(60 \/ 108\) \/ 4/);
    assert.match(firstScore, /waveLead: 'sine'/);
    assert.match(firstScore, /waveBass: 'triangle'/);
    assert.doesNotMatch(firstScore, /sawtooth|dense/,
      'the Founder first-trade loop must not regress to the brittle dense/sawtooth recipe');
    const duck = section('if (typeof GameMusic !==', 'if (winPunchT > 0)');
    for (const phase of ['dip', 'surge', 'shakeout', 'run']) assert.match(duck, new RegExp(`_drivePhase === '${phase}'`));
    assert.match(CQSH, /URL="http:\/\/\$IP:\$P\/chart-quest\.html\?fresh=1"/);
    assert.doesNotMatch(CQSH, /URL="[^\n]*fresh=1&mute=1"/);
    assert.match(QA_SERVER, /fresh_url = f"http:\/\/\{HOST\}:\{server\.server_address\[1\]\}\/chart-quest\.html\?fresh=1"/);

    const driveSource = section('const DRIVE_EASE =', '\nfunction nextCandle()');
    for (const initialSeed of [1, 7, 16]) {
      let seed = initialSeed;
      const deterministicMath = Object.create(Math);
      deterministicMath.random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
      const drive = {
        Math: deterministicMath,
        CFG: { levelMin: 80, levelMax: 700, pxPerPct: 100 },
        trade: { dir: 'long', entryH: 300, slH: 180, tpH: 500,
          _l1Outcome: 'win', _firstRide: true },
        market: { level: 300, price: 100 },
        rand: (a, b) => a + (b - a) * deterministicMath.random(),
        flashT: 0, flashColor: '', hapticMove() {},
      };
      vm.runInNewContext(driveSource, drive, { timeout: 1000 });
      const rows = [];
      for (let i = 0; i < 120; i++) {
        const candle = drive.tradeDrivenCandle();
        rows.push({ r: (candle.h - 300) / 120, phase: drive.trade._drivePhase });
        if (drive.trade._drivePhase === 'run' && Math.abs(candle.h - 500) < 0.01) break;
      }
      const surge = rows.findIndex(row => row.phase === 'surge');
      const shakeout = rows.findIndex(row => row.phase === 'shakeout');
      const run = rows.findIndex(row => row.phase === 'run');
      assert.ok(surge > 0 && shakeout > surge && run > shakeout, `seed ${initialSeed}: phase order`);
      assert.ok(Math.min(...rows.slice(0, surge + 1).map(row => row.r)) <= -0.70, `seed ${initialSeed}: near-stop scare`);
      assert.ok(Math.max(...rows.slice(surge, shakeout + 1).map(row => row.r)) >= 1.25, `seed ${initialSeed}: real profit surge`);
      assert.ok(Math.min(...rows.slice(shakeout, run + 1).map(row => row.r)) <= 0, `seed ${initialSeed}: hard give-back`);
      assert.ok(Math.min(...rows.map(row => row.r)) > -1, `seed ${initialSeed}: stop remains untouched`);
      assert.ok(rows.length >= 30 && rows.length <= 100, `seed ${initialSeed}: felt duration ${rows.length}`);
      assert.ok(Math.abs(rows[rows.length - 1].r - (5 / 3)) < 0.01, `seed ${initialSeed}: final target`);
    }
  }],

  ['build 365 retains the premium ChartQuest-native FIRST WIN milestone', () => {
    const celebrateSource = section('function celebrate(opts)', '/* Build 364 · FIRST WIN');
    assert.match(celebrateSource, /floaters\.push\(\{ firstWin: true/);
    assert.doesNotMatch(celebrateSource, /emoji:\s*'🏆'/);
    const card = section('function drawFirstWinMilestone(f)', '/* ── Milestone hero:');
    for (const copy of ['PLAYER MILESTONE', 'FIRST TRADE WON', 'NOT LUCK. YOU READ THE CHART AND EXECUTED.', 'SHELLS BANKED', 'PLAN FOLLOWED']) {
      assert.match(card, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(card, /createLinearGradient/);
    assert.match(card, /quadraticCurveTo/);
    assert.match(card, /drawShell\(ctx/);
    const caller = section('const _fireFirstWin = function ()', '/* FOUNDER CALL');
    assert.match(caller, /title: 'FIRST TRADE WON'/);
    assert.match(caller, /reward: delta/);
    assert.match(caller, /firstWin: true/);
    assert.doesNotMatch(caller, /🏆 FIRST WIN/);
  }],

  ['build 365 trade portals atomically defer every unreached box and restore its reward budget', () => {
    const lifecycle = section('function tradePortalInWorld()', 'function maybeSpawnBox(c)');
    const sandbox = {
      Number, Math, BOX_W: 34,
      portals: [],
      boxes: [
        { x: 82, w: 34, broken: false, _cqQuota: 'governed', _cqRewardId: 11 },
        { x: 112, w: 34, broken: false, _cqQuota: 'governed', _cqRewardId: 12 },
        { x: 180, w: 34, broken: false, _cqQuota: 'legacy', _cqRewardId: 18 },
        { x: 210, w: 34, broken: true, _cqQuota: 'legacy', _cqRewardId: 21 },
      ],
      market: { _boxMade: 2, _boxSpace: 55, _boxCand: { wait: 1 }, _boxGap: 22, _lastRewardId: 18 },
    };
    vm.runInNewContext(lifecycle, sandbox, { timeout: 1000 });
    const result = sandbox.deferBoxesBeyondTradePortal(100);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), { removed: 2, governed: 1, legacy: 1 });
    assert.deepEqual(sandbox.boxes.map(box => [box.x, box.broken]), [[82, false], [210, true]],
      'only unbroken boxes at/after the portal corridor are deferred');
    assert.equal(sandbox.market._boxMade, 1, 'the governed Level-1 quota is returned');
    assert.equal(sandbox.market._boxSpace, 0);
    assert.equal(sandbox.market._boxCand, null);
    assert.equal(sandbox.market._boxGap, 0, 'legacy placement is re-armed after the trade');
    assert.equal(sandbox.market._lastRewardId, null, 'a removed last reward no longer reserves dead space');

    const portalSource = section('function spawnPortal(label, sublabel, action, kind)', '// The BOSS gate');
    assert.match(portalSource, /if \(portalKind === 'trade'\) deferBoxesBeyondTradePortal\(px\)/);
    const spawner = section('function maybeSpawnBox(c)', 'function smashBox(b)');
    assert.match(spawner, /tradePortalInWorld\(\)/,
      'no replacement box may spawn while the trade portal owns the road');
    assert.match(spawner, /_cqQuota: 'governed'/);
    assert.match(spawner, /_cqQuota: 'legacy'/);
  }],

  ['build 365 replay and recap place Finn beyond the exact TP/SL line in every direction', () => {
    const crossingSource = section('function tradeExitCrossing(', '/* Mini chart for the trade ticket');
    const sandbox = { Number, Math };
    vm.runInNewContext(crossingSource, sandbox, { timeout: 1000 });
    const Y = value => value;
    const cases = [
      [{ dir: 'long', result: 'win', tpH: 100 }, -1],
      [{ dir: 'short', result: 'win', tpH: 100 }, 1],
      [{ dir: 'long', result: 'loss', slH: 100 }, 1],
      [{ dir: 'short', result: 'loss', slH: 100 }, -1],
    ];
    for (const [entry, direction] of cases) {
      const actual = sandbox.tradeExitCrossing(entry, Y, 0, 200, 14);
      assert.equal(actual.lineY, 100);
      assert.equal(actual.direction, direction);
      assert.equal(actual.finnY, 100 + direction * 14);
      assert.ok((actual.finnY - actual.lineY) * direction > 0, 'Finn must finish beyond the line');
    }
    assert.equal(sandbox.tradeExitCrossing({ dir: 'long', result: 'manual', tpH: 100 }, Y, 0, 200, 14), null);
    const replaySource = section('function tradeReplaySVG(entry, n)', '// Reset stop/target');
    assert.match(replaySource, /class="cqExitCrossing"/);
    assert.match(replaySource, /class="cqExitLineContact"/);
    assert.match(replaySource, /tradeExitCrossing\(entry, Y, chartTop, chartBot, 14\)/);
    const recapSource = section('function tradeChartSVGFull(t, opts)', 'function tradeReplaySVG(entry, n)');
    assert.match(recapSource, /tradeExitCrossing\(t, Y, chartTop, chartBot, 14\)/);
    assert.match(recapSource, /class="cqExitCrossing"/);
  }],

  ['build 365 ordinary centered feedback uses one premium non-blocking toast owner', () => {
    const toast = section('function drawPremiumWorldToast(f, y, large)', '/* ── Milestone hero:');
    for (const contract of ['createLinearGradient', 'rgba(5,18,31,0.96)', 'fillTextShell', 'SANS']) {
      assert.match(toast, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    const renderFloaters = section('// Floating P&L / level-up texts', '// Win/loss full-screen flash');
    assert.match(renderFloaters, /else if \(f\.big\)[\s\S]{0,180}drawPremiumWorldToast\(f, _fy, true\)/);
    assert.match(renderFloaters, /else if \(f\.center\)[\s\S]{0,180}drawPremiumWorldToast\(f, _fy, false\)/);
    assert.doesNotMatch(renderFloaters, /else if \(f\.center\)[\s\S]{0,240}ctx\.fillText\(f\.text/,
      'ordinary centered feedback must not fall back to raw canvas text');
  }],

  ['trade-3 prove waits for the exact auto-review lifecycle and advances only after closure', () => {
    const reviewLifecycle = section('let reviewEntry = null;', '// Control-bar interactions');
    const introWait = section('function waitThenIntroBoss(', '/* GUARDIAN 1');
    const resolver = section('function resolveTrade(result)', '// Between guided trades:');
    assert.match(resolver, /let postTradeReviewToken = 0/);
    assert.match(resolver, /postTradeReviewToken = autoOpenTradeReplay\(tradeRecord\) \|\| 0/);
    assert.match(resolver, /waitThenIntroBoss\(postTradeReviewToken\)/);
    assert.match(reviewLifecycle, /const _postTradeReviewRequired = new Set\(\)/);
    assert.match(reviewLifecycle, /_t > _hardStop && !_postTradeReviewRequired\.has\(reviewToken\)/);
    assert.match(reviewLifecycle, /_elapsed > 12000 && !_postTradeReviewRequired\.has\(reviewToken\)/);
    assert.match(introWait, /requirePostTradeReview\(postTradeReviewToken\)/);
    assert.match(introWait, /postTradeReviewInProgress\(postTradeReviewToken\)/);
    assert.doesNotMatch(introWait, /setTimeout\(function \(\) \{[^}]*beginIntroProve/,
      'prove must not be owned by a detached blind timer');

    function fixture() {
      let now = 0;
      let nextId = 1;
      let timers = [];
      const makeClassList = initial => {
        const names = new Set(initial || []);
        return {
          add(...items) { items.forEach(item => names.add(item)); },
          remove(...items) { items.forEach(item => names.delete(item)); },
          contains(item) { return names.has(item); },
        };
      };
      const chartFull = { classList: makeClassList() };
      const legend = { classList: makeClassList() };
      const sandbox = {
        window: { CQSAFE: { clear() {} }, _openFails: false },
        document: { getElementById: id => id === 'chartFull' ? chartFull : id === 'cfLegend' ? legend : null },
        performance: { now: () => now },
        Date: { now: () => now },
        setTimeout(fn, delay) {
          const id = nextId++;
          timers.push({ id, at: now + Math.max(0, Number(delay) || 0), fn });
          return id;
        },
        clearTimeout(id) { timers = timers.filter(timer => timer.id !== id); },
        clearInterval() {},
        lessonOpen: false,
        lessonQ: [],
        pendingCelebration: false,
        trade: null,
        pending: null,
        firstTradeGuide: null,
        session: { inModal: false },
        journalOpen: false,
        walletOpen: false,
        introFlow: { active: true, phase: 'run' },
        floaters: [],
        beginCalls: 0,
        portalCalls: 0,
        practiceCalls: 0,
        rec: { candleSnap: [{}], replay: { candles: [{}], entryIdx: 0 } },
      };
      const context = vm.createContext(sandbox);
      vm.runInContext(reviewLifecycle, context, { filename: 'chart-quest.html#review-lifecycle', timeout: 1000 });
      vm.runInContext(introWait, context, { filename: 'chart-quest.html#intro-wait', timeout: 1000 });
      vm.runInContext(`
        openReviewChart = function (entry, autoDetails) {
          if (window._openFails) return;
          _replayAutoDetails = !!autoDetails;
          reviewEntry = entry;
          reviewMode = 'details';
          document.getElementById('cfLegend').classList.add('on');
          document.getElementById('chartFull').classList.add('open');
        };
      `, context, { timeout: 1000 });
      sandbox.beginIntroProve = function () {
        sandbox.beginCalls += 1;
        sandbox.introFlow.phase = 'prove';
        sandbox.portalCalls += 1;
        sandbox.practiceCalls += 1;
      };
      function advance(ms) {
        const target = now + ms;
        let guard = 0;
        while (true) {
          timers.sort((a, b) => a.at - b.at || a.id - b.id);
          const timer = timers[0];
          if (!timer || timer.at > target) break;
          timers.shift();
          now = timer.at;
          timer.fn();
          guard += 1;
          assert.ok(guard < 10000, 'fake timer queue must terminate');
        }
        now = target;
      }
      function start() {
        const token = vm.runInContext('autoOpenTradeReplay(rec)', context, { timeout: 1000 });
        sandbox.reviewToken = token;
        vm.runInContext('waitThenIntroBoss(reviewToken)', context, { timeout: 1000 });
        return token;
      }
      function busy(token) {
        sandbox.reviewToken = token;
        return vm.runInContext('postTradeReviewInProgress(reviewToken)', context, { timeout: 1000 });
      }
      return {
        sandbox, chartFull, start, advance, busy,
        activeCount: () => vm.runInContext('_postTradeReviewActive.size', context, { timeout: 1000 }),
        waitMissing: () => vm.runInContext('waitThenIntroBoss(0)', context, { timeout: 1000 }),
        close: () => vm.runInContext('closeReviewChart()', context, { timeout: 1000 }),
      };
    }

    const exactOrder = fixture();
    const token = exactOrder.start();
    assert.ok(token > 0);
    assert.equal(exactOrder.busy(token), true, 'token must exist synchronously before either timer can race');
    exactOrder.advance(1600);
    assert.equal(exactOrder.chartFull.classList.contains('open'), true, 'real auto-review poll must open');
    exactOrder.advance(5000);
    assert.deepEqual(
      [exactOrder.sandbox.beginCalls, exactOrder.sandbox.portalCalls, exactOrder.sandbox.practiceCalls],
      [0, 0, 0],
      'prove/THE LIE/practice cannot appear over replay or details',
    );
    exactOrder.close();
    assert.equal(exactOrder.busy(token), false, 'central X/background close must complete the token');
    exactOrder.advance(2100);
    assert.equal(exactOrder.sandbox.beginCalls, 0, 'the original 2.2s breathing beat remains');
    exactOrder.advance(400);
    assert.deepEqual(
      [exactOrder.sandbox.beginCalls, exactOrder.sandbox.portalCalls, exactOrder.sandbox.practiceCalls],
      [1, 1, 1],
      'the intro and its downstream portal/practice become reachable after explicit close',
    );

    const delayed = fixture();
    delayed.sandbox.lessonOpen = true;
    const delayedToken = delayed.start();
    delayed.advance(5000);
    assert.equal(delayed.chartFull.classList.contains('open'), false, 'post-trade lesson keeps replay pending');
    assert.equal(delayed.sandbox.beginCalls, 0);
    delayed.sandbox.lessonOpen = false;
    delayed.advance(500);
    assert.equal(delayed.chartFull.classList.contains('open'), true, 'replay opens after the real blocker clears');
    delayed.advance(20000);
    assert.equal(delayed.sandbox.beginCalls, 0, 'the 18s fallback must not bypass an open review');
    delayed.close();
    delayed.advance(200);
    assert.equal(delayed.sandbox.beginCalls, 1, 'a capped wait may advance immediately only after explicit close');

    const terminalHold = fixture();
    terminalHold.sandbox.walletOpen = true;
    const terminalToken = terminalHold.start();
    terminalHold.advance(125000);
    assert.equal(terminalHold.busy(terminalToken), true,
      'neither the 12s idle budget nor 120s ceiling may release required trade-3 review');
    assert.equal(terminalHold.chartFull.classList.contains('open'), false);
    assert.equal(terminalHold.sandbox.beginCalls, 0);
    terminalHold.sandbox.walletOpen = false;
    terminalHold.advance(250);
    assert.equal(terminalHold.chartFull.classList.contains('open'), true,
      'a required replay keeps polling and opens once the blocker clears');
    terminalHold.close();
    terminalHold.advance(200);
    assert.equal(terminalHold.sandbox.beginCalls, 1,
      'the capped intro may advance only after the required review opens and closes');

    const failedOpen = fixture();
    failedOpen.sandbox.window._openFails = true;
    const failedOpenToken = failedOpen.start();
    failedOpen.advance(125000);
    assert.equal(failedOpen.busy(failedOpenToken), true,
      'a required open failure must remain active beyond both ordinary terminal budgets');
    assert.equal(failedOpen.chartFull.classList.contains('open'), false);
    assert.equal(failedOpen.sandbox.beginCalls, 0);
    failedOpen.sandbox.window._openFails = false;
    failedOpen.advance(250);
    assert.equal(failedOpen.chartFull.classList.contains('open'), true,
      'required open failure must keep retrying until the review can open');
    failedOpen.close();
    failedOpen.advance(200);
    assert.equal(failedOpen.sandbox.beginCalls, 1);

    const missing = fixture();
    missing.waitMissing();
    assert.equal(missing.activeCount(), 1, 'missing guided replay data must create a fail-closed sentinel');
    missing.advance(125000);
    assert.equal(missing.sandbox.beginCalls, 0, 'missing token may never release prove on a timeout');
    assert.deepEqual([missing.sandbox.portalCalls, missing.sandbox.practiceCalls], [0, 0]);
    missing.sandbox.introFlow.active = false;
    missing.advance(200);
    assert.equal(missing.activeCount(), 0, 'explicit reset/abort must cancel the missing-token sentinel');

    const aborted = fixture();
    const abortedToken = aborted.start();
    aborted.advance(1600);
    assert.equal(aborted.chartFull.classList.contains('open'), true);
    aborted.sandbox.introFlow.active = false;
    aborted.advance(200);
    assert.equal(aborted.busy(abortedToken), false, 'reset/abort must cancel the exact lifecycle token');
    assert.equal(aborted.chartFull.classList.contains('open'), false, 'reset/abort must close its auto review');
    assert.equal(aborted.sandbox.beginCalls, 0);
  }],
];

function runSuite(options = {}) {
  const report = options.report !== false;
  const failures = [];
  let passed = 0;

  for (const [name, test] of tests) {
    try {
      test();
      passed += 1;
      if (report) console.log(`✓ ${name}`);
    } catch (error) {
      failures.push({ name, error });
      if (report) {
        console.error(`✗ ${name}`);
        console.error(String(error && error.stack || error));
      }
    }
  }

  if (report) console.log(`\n${passed}/${tests.length} CQSAFE/build-365 regression tests passed`);
  return {
    ok: failures.length === 0,
    passed,
    total: tests.length,
    failures,
    detail: failures.length
      ? failures.map(item => item.name).join(' · ')
      : `${passed}/${tests.length} CQSAFE/build-365 contracts`,
  };
}

if (require.main === module) {
  const result = runSuite();
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { runSuite };
