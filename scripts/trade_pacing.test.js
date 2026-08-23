#!/usr/bin/env node
'use strict';

/* Founder-approved Build 370 regression gate: guided trades are paced by Finn's traversal. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');

function section(startMarker, endMarker) {
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  const end = GAME.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing source marker after ${startMarker}: ${endMarker}`);
  return GAME.slice(start, end);
}

function candleWorld({ liveTrade, lastX = 290, terminalAt = null } = {}) {
  let nextId = 1;
  let driven = 0;
  const eventCalls = { setup: 0, mega: 0, wisdom: 0, box: 0, placed: 0 };
  const sandbox = {
    Math, Number,
    MARKET_CLOCK_MS: 1150,
    W: 100,
    CFG: { gapMin: 0, gapMax: 0, spinMinWick: 999, levelMin: 80, levelMax: 700 },
    market: { _clockT: 0, _shGap: 4, _lastRewardId: 77 },
    trade: liveTrade ? { _l1Outcome: 'win', dir: 'long', slH: -1000, tpH: terminalAt ? 150 : 1000 } : null,
    setupSeq: null, setupFlow: null, pending: null, lessonOpen: false, firstTradeGuide: null, paused: false,
    session: { level: 1, inModal: false, candles: 7 }, maxSeenCandleId: 1,
    candles: [{ id: nextId, x: lastX, w: 10, open: 100, h: 100, color: 'green', wick: 0 }],
    coins: [], wisdomPages: [], document: { hidden: false, visibilityState: 'visible' },
    worldMotionAllowed() { return !sandbox.document.hidden; },
    rand: (a) => a,
    candleW: () => 10,
    nextCandle: () => {
      driven++;
      if (sandbox.trade) sandbox.trade._nCand = driven;
      return { h: terminalAt === driven ? 150 : 100, color: 'green', wick: 0, wick2: 0, bos: false, sweep: false };
    },
    decorateCandleWicks() {}, candleTop: c => c.h,
    pushCandle(x, w, h, color, wick, data) {
      sandbox.candles.push({ ...data, id: ++nextId, x, w, open: sandbox.candles.at(-1).h, h, color, wick });
    },
    CQ: { priceTouched(bar, line, dir, kind) {
      const high = Math.max(bar.open, bar.h) + (bar.wick || 0);
      const low = Math.min(bar.open, bar.h) - (bar.wick2 || 0);
      return kind === 'tp' ? high >= line : low <= line;
    } },
    CQREACH: { place(list, value) { eventCalls.placed++; list.push(value); } },
    advanceSetupFlow() { eventCalls.setup++; }, maybeMegaCandle() { eventCalls.mega++; },
    maybeSpawnWisdomPage() { eventCalls.wisdom++; }, maybeSpawnBox() { eventCalls.box++; },
  };
  vm.runInNewContext(section('function maintainCandles(cameraX, dt) {', '/* ---------- Player state:'), sandbox, {
    filename: 'chart-quest.html#maintainCandles', timeout: 1000,
  });
  sandbox.eventCalls = eventCalls;
  sandbox.drivenCount = () => driven;
  return sandbox;
}

function deterministicMath(initialSeed) {
  let seed = initialSeed;
  const math = Object.create(Math);
  math.random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  return math;
}

function runDriven({ seed, outcome, direction, firstRide }) {
  const math = deterministicMath(seed);
  const long = direction === 'long';
  const entryH = 380;
  const slH = long ? 260 : 500;
  const tpH = long ? 620 : 140;
  const sandbox = {
    Math: math,
    CFG: { levelMin: 80, levelMax: 700, pxPerPct: 100 },
    trade: { dir: direction, entryH, slH, tpH, _l1Outcome: outcome, _firstRide: firstRide },
    market: { level: entryH, price: 100 },
    rand: (a, b) => a + (b - a) * math.random(),
    flashT: 0, flashColor: '', hapticMove() {},
  };
  vm.runInNewContext(section('const DRIVE_EASE =', '\nfunction nextCandle()'), sandbox, {
    filename: 'chart-quest.html#tradeDrivenCandle', timeout: 1000,
  });
  let decidingAt = null;
  let decidingClose = null;
  for (let i = 0; i < 240; i++) {
    const before = sandbox.market.level;
    const candle = sandbox.tradeDrivenCandle();
    const low = Math.min(before, candle.h) - (candle.wick2 || 0);
    const high = Math.max(before, candle.h) + (candle.wick || 0);
    const touchesTP = long ? high >= tpH : low <= tpH;
    const touchesSL = long ? low <= slH : high >= slH;
    const touchesDecision = outcome === 'win' ? touchesTP : touchesSL;
    const touchesForbidden = outcome === 'win' ? touchesSL : touchesTP;
    assert.equal(touchesForbidden, false,
      `${direction} ${outcome} seed ${seed}: authored path touched the forbidden line at candle ${sandbox.trade._nCand}`);
    if (touchesDecision) { decidingAt = sandbox.trade._nCand; decidingClose = candle.h; break; }
  }
  assert.ok(decidingAt != null, `${direction} ${outcome} seed ${seed}: path must eventually reach its deciding line`);
  assert.ok(decidingAt >= 30, `${direction} ${outcome} seed ${seed}: deciding touch at ${decidingAt}, expected >=30`);
  assert.ok(decidingAt <= 60, `${direction} ${outcome} seed ${seed}: deciding touch at ${decidingAt}, expected <=60`);
  assert.equal(decidingClose, outcome === 'win' ? tpH : slH,
    `${direction} ${outcome} seed ${seed}: the first deciding candle must visibly close on its exact line`);
  return decidingAt;
}

const tests = [
  ['guided-trade wall time cannot print candles or advance progression', () => {
    const world = candleWorld({ liveTrade: true, lastX: 290 });
    world.maintainCandles(0, 0);
    const before = world.candles.length;
    assert.equal(before, 3, 'a guided trade exposes exactly Finn’s +2 visible frontier');
    for (let i = 0; i < 100; i++) world.maintainCandles(0, 0.25);
    assert.equal(world.candles.length, before, 'stationary camera must keep the guided chart frozen');
    assert.equal(world.market._clockT, 0, 'guided-trade time must not build a hidden candle backlog');
    assert.equal(world.session.candles, 7, 'only onCandleEntered may advance the hour');

    const guideWorld = candleWorld({ liveTrade: true, lastX: 100 });
    guideWorld.paused = true;
    guideWorld.firstTradeGuide = { step: 0 };
    guideWorld.maintainCandles(0, 0.25);
    assert.equal(guideWorld.candles.length, 1,
      'entry truncation followed by a paused guide frame must not pre-generate the trade arc');
  }],

  ['forward traversal grows the chart spatially while backtracking cannot retrigger it', () => {
    const world = candleWorld({ liveTrade: true, lastX: 290 });
    world.maintainCandles(0, 0);
    assert.equal(world.candles.length, 3);
    world.maxSeenCandleId = 2; // simulate Finn entering the next never-before-reached candle
    world.maintainCandles(0, 0);
    assert.equal(world.candles.length, 4, 'one reached candle must open exactly one new authored slot');
    const afterForward = world.candles.length;
    world.W = 900;
    world.maintainCandles(0, 20); // backtracking/rotation alone is not trade progress
    assert.equal(world.candles.length, afterForward, 'turning back must not print or replay trade candles');
    const entered = section('/* --- Candle counting: setups + trade resolution tick per candle.', '/* T-002 — RESOLVE ON THE CANDLE');
    assert.match(entered, /if \(cur\.id > maxSeenCandleId\)[\s\S]*onCandleEntered\(cur\)/,
      'only a never-before-reached candle may advance trade/setup progression');
  }],

  ['free-roam market clock remains unchanged', () => {
    const world = candleWorld({ liveTrade: false, lastX: 290 });
    const before = world.candles.length;
    for (let i = 0; i < 4; i++) world.maintainCandles(0, 0.25);
    assert.equal(world.candles.length, before);
    world.maintainCandles(0, 0.25);
    assert.equal(world.candles.length, before + 1, 'the 1150ms free-roam clock still prints one candle');
  }],

  ['all guided TP/SL paths honor the 30-candle floor before visible touch', () => {
    for (const direction of ['long', 'short']) {
      for (const outcome of ['win', 'loss']) {
        for (let seed = 1; seed <= 250; seed++) runDriven({ seed, outcome, direction, firstRide: false });
      }
    }
    for (const direction of ['long', 'short']) {
      for (let seed = 1; seed <= 250; seed++) runDriven({ seed, outcome: 'win', direction, firstRide: true });
    }
  }],

  ['guided generation stops at the first terminal candle and never runs viewport rewards', () => {
    const world = candleWorld({ liveTrade: true, lastX: 100, terminalAt: 3 });
    world.candles.unshift({ id: -1, x: -3000, w: 10, open: 100, h: 100, color: 'green', wick: 0 });
    world.coins.push({ x: -3000, collected: false });
    world.wisdomPages.push({ x: -3000, collected: false });
    const rewardState = JSON.stringify({ market: world.market, coins: world.coins, pages: world.wisdomPages });
    world.maintainCandles(0, 0);                 // two visible candles: driven 1 + 2
    world.maxSeenCandleId = 2;
    world.maintainCandles(5000, 0);              // driven 3 touches TP and becomes terminal
    assert.equal(world.trade._terminalCandleId, 4);
    assert.equal(world.drivenCount(), 3);
    world.maxSeenCandleId = 100;                 // even resize/frontier abuse cannot author past terminal
    world.W = 900;
    for (let i = 0; i < 20; i++) world.maintainCandles(0, 1);
    assert.equal(world.drivenCount(), 3, 'no post-terminal hidden candles may exist');
    assert.deepEqual(world.eventCalls, { setup: 0, mega: 0, wisdom: 0, box: 0, placed: 0 });
    assert.equal(world.candles[0].id, -1, 'trade-time pruning must not delete backtracked candles');
    assert.equal(JSON.stringify({ market: world.market, coins: world.coins, pages: world.wisdomPages }), rewardState,
      'trade terrain must not mutate reward cadence, ledgers, collectibles, or missed pages');
    assert.ok(rewardState.includes('"_shGap":4'));
  }],

  ['entry truncation reclaims the deleted suffix so candle IDs stay contiguous', () => {
    const law = section('/* ══ T-002 · LAW 1', '  // SHOT 3 (CQ-0020)');
    const executable = law.slice(law.indexOf('  if (session.level <= 3)'));
    const sandbox = {
      session: { level: 1 }, maxSeenCandleId: 100, nextCandleId: 116,
      candles: Array.from({ length: 18 }, (_, i) => ({ id: 98 + i, x: i * 10, w: 10 })),
      market: { level: 999 }, trade: { entryH: 321 },
      CQREACH: { cullPast(x) { sandbox.culledAt = x; } },
    };
    vm.runInNewContext(executable, sandbox, { filename: 'chart-quest.html#entry-truncation', timeout: 1000 });
    assert.deepEqual(Array.from(sandbox.candles, c => c.id), [98, 99, 100]);
    assert.equal(sandbox.nextCandleId, 101, 'the next driven candle must be max surviving id + 1');
    assert.equal(sandbox.trade._lastTestedId, 100);
    assert.equal(sandbox.market.level, 321);
  }],

  ['hidden pages freeze both generation and movement with no resume backlog', () => {
    const world = candleWorld({ liveTrade: true, lastX: 100 });
    world.document.hidden = true; world.document.visibilityState = 'hidden';
    const before = JSON.stringify({ candles: world.candles, trade: world.trade, session: world.session, market: world.market });
    world.maintainCandles(9999, 60);
    assert.equal(JSON.stringify({ candles: world.candles, trade: world.trade, session: world.session, market: world.market }), before);
    world.document.hidden = false; world.document.visibilityState = 'visible';
    world.maintainCandles(0, 60);
    assert.equal(world.candles.length, 3, 'resume may restore only the ordinary +2 frontier, never hidden elapsed time');

    const frameHead = section('function frame(now) {', '// FRAME PACING (fluid-motion fix)');
    assert.match(frameHead, /if \(!worldMotionAllowed\(\)\)[\s\S]*requestAnimationFrame\(frame\); return;/,
      'hidden frame must return before update, progression, generation and resolution');
    const resetOwner = section('function resetWorldMotionFrameClock()', 'let camY = 0;');
    assert.match(resetOwner, /lastTime = performance\.now\(\)/);
    assert.match(resetOwner, /_dtEMA = 0/);
    assert.match(resetOwner, /pointer = null/);
    assert.match(resetOwner, /visibilitychange[\s\S]*pageshow[\s\S]*pagehide/);
  }],

  ['bounded replay paths always retain the real automatic or manual exit candle', () => {
    const sandbox = { Array, Number };
    vm.runInNewContext(section('function truthPreservingTradePath', 'function resolveTrade(result)'), sandbox,
      { filename: 'chart-quest.html#truthPreservingTradePath', timeout: 1000 });
    for (const n of [61, 75, 90, 130]) {
      const path = Array.from({ length: n }, (_, i) => ({ id: i + 1, h: i === n - 1 ? 999 : i }));
      const bounded = sandbox.truthPreservingTradePath(path, 100);
      assert.ok(bounded.length <= 100);
      assert.equal(bounded.at(-1).id, n, `exit candle ${n} must survive the storage cap`);
      assert.equal(bounded.at(-1).h, 999);
    }
  }],

  ['guide Escape, resolution and reset owners tear down DOM/state atomically', () => {
    const keys = section("window.addEventListener('keydown'", 'let _tapTimer = null;');
    assert.ok(keys.indexOf('if (firstTradeGuide)') < keys.indexOf('if (paused)'),
      'guide Escape must run before the generic paused-panel branch');
    assert.match(keys, /Escape['"]\) \{ e\.preventDefault\(\); closeFirstTradeGuide\(\); \}/);
    const closer = section('function closeFirstTradeGuide()', 'function renderFirstTradeGuidePanel()');
    for (const contract of [/\.remove\(\)/, /firstTradeGuide = null/, /paused = false/, /_zoomWasTrade = false/])
      assert.match(closer, contract);
    assert.match(section('function resolveTrade(result)', "// 'manual' closes"), /closeFirstTradeGuide\(\)/);
    assert.match(section('function closeOverlays()', 'function stateSnap()'), /closeFirstTradeGuide\(\)/);
  }],

  ['no automatic trade-clock, forced carry, edge clamp, or timed outcome survives', () => {
    assert.doesNotMatch(GAME, /TRADE_CANDLE_MS|THE TRADE CLOCK|RIDE THE TRADE|RIDE THE LIVE EDGE/);
    assert.doesNotMatch(GAME, /resolveTrade\(trade\._l1Outcome\s*\|\|\s*['"]win['"]\)/,
      'an elapsed timer must never award an authored outcome');
    assert.doesNotMatch(GAME, /_pressStartT/);
    const horizontal = section('/* --- Horizontal: walk in the facing direction', '/* --- Jetpack timers');
    assert.doesNotMatch(horizontal, /_behind|_edgeX|CFG\.walkSpeed \* 1\.7/);
    const entered = section('function onCandleEntered(c)', 'function resolveTrade(result)');
    assert.doesNotMatch(entered, /tradeTouchCheck\(c\)/,
      'centre-entry hook must not bypass the Finn-right-edge replay/resolution owner');
    const frontier = section('/* T-002 — RESOLVE ON THE CANDLE', '// SAFETY (CQ-0023)');
    assert.match(frontier, /trade\.path\.push[\s\S]*tradeTouchCheck\(c\)/,
      'the deciding candle must be captured in the replay before its TP/SL touch resolves');
  }],

  ['trade focus keeps boxes, pages, mega candles, and their interactions out of positions', () => {
    const boxSpawner = section('function maybeSpawnBox(c)', 'function smashBox(b)');
    const megaSpawner = section('function maybeMegaCandle(c)', '// Called from maintainCandles');
    const pageSpawner = section('function maybeSpawnWisdomPage(c)', '// Per-frame: bob, reveal clues');
    const boxUpdates = section('function updateBoxes(dt, tx, ty)', 'function drawBoxes(camX)');
    const pageUpdates = section('function updateWisdomPages(dt, tx, ty)', 'function collectWisdomPage(p)');
    assert.match(boxSpawner, /typeof trade !== 'undefined' && trade/);
    for (const guard of ['trade', 'pending', 'setupFlow']) {
      assert.match(megaSpawner, new RegExp(`typeof ${guard} !== 'undefined' && ${guard}`));
      assert.match(pageSpawner, new RegExp(`typeof ${guard} !== 'undefined' && ${guard}`));
    }
    assert.ok(megaSpawner.indexOf("typeof trade !== 'undefined'") < megaSpawner.indexOf('_megaState.n++'));
    assert.ok(pageSpawner.indexOf("typeof trade !== 'undefined'") < pageSpawner.indexOf('_wisSpawn.n++'));
    assert.match(boxUpdates, /touches && !tradeInProgress\(\)/);
    assert.match(pageUpdates, /if \(tradeInProgress\(\)\) continue/);
    const coinLoop = section('for (const coin of coins)', 'turtle._pcx = tx;');
    assert.match(coinLoop, /if \(tradeInProgress\(\)\) continue/);
  }],
];

function runSuite(options = {}) {
  const failures = [];
  let passed = 0;
  for (const [name, test] of tests) {
    try { test(); passed++; if (options.report !== false) console.log(`\u2713 ${name}`); }
    catch (error) { failures.push({ name, error }); if (options.report !== false) { console.error(`\u2717 ${name}`); console.error(error.stack || String(error)); } }
  }
  const result = { ok: failures.length === 0, passed, total: tests.length, failures,
    detail: `${passed}/${tests.length} player-paced trade contracts passed` };
  if (options.report !== false) console.log(`\n${result.detail}`);
  return result;
}

if (require.main === module) process.exit(runSuite().ok ? 0 : 1);
module.exports = { runSuite };
