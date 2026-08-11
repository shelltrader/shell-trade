#!/usr/bin/env node
'use strict';

/*
 * Durable build-362 beta-readiness regression suite.
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

function movedRect(rect, placed) {
  return { x: placed.x, y: placed.y, w: rect.w, h: rect.h };
}

const tests = [
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
    assert.match(GAME, /autoOpenTradeReplay\(tradeRecord\)/);
  }],

  ['trade-time boxes and pages defer interaction without deletion', () => {
    const predicate = section('function tradeInProgress()', 'let pending = null');
    for (const name of ['trade', 'pending', 'setupFlow']) assert.match(predicate, new RegExp(`typeof ${name}`));

    const boxes = section('function updateBoxes(dt, tx, ty)', 'function drawBoxes(camX)');
    assert.match(boxes, /if \(d < b\.w \* 0\.5 \+ 18 && !tradeInProgress\(\)\) \{[\s\S]{0,100}smashBox\(b\)/);
    assert.match(boxes, /b\.x < turtle\.x - 2600 && !tradeInProgress\(\)/);

    let tradeActive = true;
    const boxSandbox = {
      boxes: [{ bob: 0, glow: 0, rot: 0, orb: 0, excite: 0, breakT: 0, broken: false, x: 0, y: 0, w: 20 }],
      boxFx: [], turtle: { x: 3000, tucked: false },
      tradeInProgress: () => tradeActive,
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

  if (report) console.log(`\n${passed}/${tests.length} CQSAFE/beta-360 regression tests passed`);
  return {
    ok: failures.length === 0,
    passed,
    total: tests.length,
    failures,
    detail: failures.length
      ? failures.map(item => item.name).join(' · ')
      : `${passed}/${tests.length} CQSAFE/beta-360 contracts`,
  };
}

if (require.main === module) {
  const result = runSuite();
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { runSuite };
