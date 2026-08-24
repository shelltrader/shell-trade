#!/usr/bin/env node
'use strict';

/*
 * Focused Build 373 feedback/recovery contracts.
 *
 * This suite deliberately runs independently of scripts/verify.js while the candidate is being
 * assembled. It behavior-tests the player-facing seams where practical and uses narrow source
 * contracts only where the production renderer is not safely extractable.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');

function section(startMarker, endMarker, source = GAME) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

function makeStorage(initial = {}) {
  const data = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] ?? null; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    snapshot() { return Object.fromEntries(data); },
  };
}

function canvasContext(textCalls) {
  let offsetX = 0, offsetY = 0;
  const stack = [];
  const base = {
    save() { stack.push([offsetX, offsetY]); },
    restore() { [offsetX, offsetY] = stack.pop() || [0, 0]; },
    translate(x, y) { offsetX += Number(x) || 0; offsetY += Number(y) || 0; },
    fillText(value, x, y) { textCalls.push({ value: String(value), x: (Number(x) || 0) + offsetX, y: (Number(y) || 0) + offsetY }); },
    strokeText(value, x, y) { textCalls.push({ value: String(value), x: (Number(x) || 0) + offsetX, y: (Number(y) || 0) + offsetY }); },
    measureText(value) { return { width: String(value).length * 7 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  return new Proxy(base, {
    get(target, key) {
      if (key in target) return target[key];
      return function () {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}

class MockElement {
  constructor(tag, textCalls) {
    this.tagName = String(tag || '').toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.innerHTML = '';
    this.offsetHeight = 100;
    this._classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this._classes.add(name)),
      remove: (...names) => names.forEach(name => this._classes.delete(name)),
      contains: name => this._classes.has(name),
      toggle: (name, force) => {
        const on = force == null ? !this._classes.has(name) : !!force;
        if (on) this._classes.add(name); else this._classes.delete(name);
        return on;
      },
    };
    this._textCalls = textCalls;
  }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  removeChild(child) { const at = this.children.indexOf(child); if (at >= 0) this.children.splice(at, 1); child.parentElement = null; return child; }
  remove() { if (this.parentElement) this.parentElement.removeChild(this); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  click() { if (this.listeners.click) this.listeners.click({ preventDefault() {} }); }
  getContext() { return canvasContext(this._textCalls); }
  getBoundingClientRect() { return { left: 20, top: 30, width: 120, height: 90 }; }
  querySelector(selector) {
    if (selector[0] === '#') return this.find(node => node.id === selector.slice(1));
    const key = selector.match(/^\[data-key="([^"]+)"\]$/);
    if (key) return this.find(node => node.dataset && node.dataset.key === key[1]);
    return null;
  }
  find(predicate) {
    if (predicate(this)) return this;
    for (const child of this.children) { const found = child.find(predicate); if (found) return found; }
    return null;
  }
}

function ceremonyWorld(saved = {}) {
  const textCalls = [];
  const storage = makeStorage(saved);
  const head = new MockElement('head', textCalls);
  const body = new MockElement('body', textCalls);
  const document = {
    head, body,
    createElement(tag) { return new MockElement(tag, textCalls); },
    getElementById(id) { return head.find(node => node.id === id) || body.find(node => node.id === id); },
  };
  const marketKeys = ['BTC', 'ETH', 'SOL'];
  const FACTION_CONFIG = Object.fromEntries(marketKeys.map((key, index) => [key, {
    name: key === 'BTC' ? 'Bitcoin' : key, ticker: key,
    color: ['#f7931a', '#627eea', '#14f195'][index], glow: 'rgba(255,255,255,.3)',
    gradient: 'linear-gradient(#111,#000)', emoji: key,
  }]));
  const HOME_MARKETS = marketKeys.map(key => ({ key, line: `${key} market`, motif: 'breathe' }));
  const skinCalls = [];
  const window = {
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 2,
    addEventListener() {}, removeEventListener() {},
    coinIconSVG(ticker) { return ticker; },
  };
  const sandbox = {
    window, document, localStorage: storage, FACTION_CONFIG, HOME_MARKETS,
    COLOR: { greenBody: '#16c784', redBody: '#ea3943' },
    navigator: { vibrate() {} }, performance: { now: () => 10 },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout() {},
    matchMedia: () => ({ matches: false }), console,
    applyHomeMarketSkin(key) { skinCalls.push(key); return FACTION_CONFIG[key]; },
  };
  vm.runInNewContext(
    section('const HomeMarketCeremony = (() => {', '// Read saved faction from localStorage'),
    sandbox,
    { filename: 'chart-quest.html#HomeMarketCeremony', timeout: 1000 },
  );
  return {
    api: window.HomeMarketCeremony,
    storage,
    skinCalls,
    cardKeys() {
      const cards = document.getElementById('hmcCards');
      return cards ? cards.children.map(card => card.dataset.key) : [];
    },
  };
}

function betaFlowWorld(saved = {}) {
  const storage = makeStorage(saved);
  const events = [];
  const window = { dispatchEvent(event) { events.push(event); } };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options && options.detail; }
  }
  const sandbox = { window, localStorage: storage, CustomEvent, Date, JSON, Object, Array, Number, Math };
  vm.runInNewContext(
    section('/* BETA_FLOW_CONTINUITY_V1:BEGIN', '/* BETA_FLOW_CONTINUITY_V1:END */'),
    sandbox,
    { filename: 'chart-quest.html#CQBetaFlow', timeout: 1000 },
  );
  assert.ok(window.CQBetaFlow, 'window.CQBetaFlow must be published');
  return { api: window.CQBetaFlow, storage, events };
}

function boxWorld(desktop) {
  const textCalls = [];
  const storage = makeStorage({ cq_music: 'on' });
  const sandbox = {
    Math, Number, Date, performance: { now: () => 1000 }, localStorage: storage,
    W: 390, CFG: { cameraAnchor: 0.52 }, IS_DESKTOP_CTRL: !!desktop,
    ctx: canvasContext(textCalls), rr() {},
    turtle: { x: 0, w: 36, tucked: false }, camY: 0,
    player: { shells: 5 }, session: { level: 1, collected: 0, candles: 30 },
    market: {}, portals: [], candles: [], pending: null, setupFlow: null, trade: null,
    floaters: [], shakeT: 0, flashT: 0, flashColor: '',
    markEvent() {}, addXP() {}, hapticMove() {}, spawnTradeShells() {},
    GameMusic: { move: { land() {} }, sting() {} }, CineAudio: { blip() {} },
  };
  const source = section('const boxes = [];', 'function drawBoxFx(camX) {');
  vm.runInNewContext(
    `${source}\nthis.__boxApi = { boxes, boxFx, smashBox, boxRefuse, drawBoxes };`,
    sandbox,
    { filename: 'chart-quest.html#main-boxes', timeout: 1000 },
  );
  return { ...sandbox.__boxApi, textCalls, sandbox };
}

function addBox(world, x, y = 220) {
  const box = { x, y, w: 34, premium: false, broken: false, breakT: 0, bob: 0, glow: 0, rot: 0, orb: 0, excite: 0 };
  world.boxes.push(box);
  return box;
}

function reminderCalls(world) {
  return world.textCalls.filter(call => /BOOST|SWIPE|ABOVE IT|SMASH/i.test(call.value));
}

function tutorialWorld() {
  const sounds = [];
  const S = {
    tCelebDone: false, tCelebT: 0, tStage: 0, tCount: 0, tFlash: 0, shake: 0, rm: false,
    zoneBoost: 0, zoneDouble: 0, zoneSmash: 0, maxCur: 0,
    phase: 'grow', spin: false, smash: false, candles: [], cur: 0,
  };
  const sandbox = {
    S, turtle: { x: 0, y: 0, w: 36, h: 24, onGround: true, dir: 1 }, WARM: '#ffd60a',
    alive() {}, blip(name) { sounds.push(name); }, hap() {}, burst() {},
  };
  vm.runInNewContext(
    `${section('const TEACH_STAGES = [', 'function drawGesture(g,x,y)')}\n` +
      'this.__teachApi = { TEACH_STAGES, teachCredit, teachAllDone, teachSkipToPortal, currentTeach };',
    sandbox,
    { filename: 'chart-quest.html#movement-teaching', timeout: 1000 },
  );
  return { S, sounds, ...sandbox.__teachApi };
}

function tutorialOutcomeWorld({ guided, slot = 1, level = 1 } = {}) {
  const storage = makeStorage();
  const sandbox = {
    localStorage: storage,
    introFlow: { active: !!guided, awaitingTrade: !!guided, firstTradeDone: false, tradesDone: Math.max(0, slot - 1) },
    session: { level },
  };
  vm.runInNewContext(
    `${section('function authoredTutorialOutcome()', 'function tradeMusicTrack')}\nthis.__outcome = authoredTutorialOutcome;`,
    sandbox,
    { filename: 'chart-quest.html#authoredTutorialOutcome', timeout: 1000 },
  );
  return { outcome: sandbox.__outcome, sandbox, storage };
}

const tests = [
  ['fresh players explicitly confirm Bitcoin while returning players retain the full chooser', () => {
    const fresh = ceremonyWorld();
    assert.equal(fresh.api.start(() => {}, { bitcoinFirst: true }), true);
    assert.deepEqual(fresh.cardKeys(), ['BTC'], 'a fresh ceremony must expose exactly one Bitcoin card');
    assert.equal(fresh.api._choose('BTC'), 'chosen', 'Bitcoin still requires the ceremony confirmation tap');
    assert.deepEqual(fresh.skinCalls, ['BTC']);

    const handoff = section('function _afterMovementTutorial(fallbackKey)', '// Movement tutorial → ceremony.');
    assert.match(handoff, /const firstRun = !localStorage\.getItem\('cq_played'\)/);
    assert.match(handoff, /HomeMarketCeremony\.start\([\s\S]*\{ bitcoinFirst: firstRun \}/,
      'the real first-run handoff, not only a dev call, must request the one-card ceremony');
    assert.match(handoff, /const fallback = firstRun \? 'BTC'/,
      'a failed first-run ceremony must still enter Bitcoin rather than a cinematic callback market');

    const returning = ceremonyWorld({ cq_played: '1', cq_faction: 'ETH' });
    assert.equal(returning.api.start(() => {}), true);
    assert.deepEqual(returning.cardKeys(), ['BTC', 'ETH', 'SOL'], 'Change Chart must retain the complete market chooser');
    assert.equal(returning.storage.getItem('cq_faction'), 'ETH', 'opening the chooser must not overwrite a saved market');
    assert.deepEqual(returning.skinCalls, [], 'a saved market changes only after an explicit new choice');
  }],

  ['the main-game reminder follows the visible box on mobile until a real smash succeeds', () => {
    const world = boxWorld(false);
    addBox(world, -500);                    // missed/off-screen first box must not own the reminder forever
    const visible = addBox(world, 125, 230);
    world.drawBoxes(0);
    let calls = reminderCalls(world);
    const copy = calls.map(call => call.value).join(' ');
    assert.match(copy, /BOOST ABOVE IT/i);
    assert.match(copy, /SWIPE DOWN/i);
    assert.ok(calls.some(call => Math.abs(call.x - visible.x) < 90 && call.y < visible.y + 30),
      'instruction must be spatially anchored to the visible smash target');

    world.textCalls.length = 0;
    world.boxRefuse(visible);
    world.drawBoxes(0);
    assert.ok(reminderCalls(world).length > 0, 'touching/refusing a box must not retire the teaching');

    world.smashBox(visible);
    addBox(world, 250, 220);
    world.textCalls.length = 0;
    world.drawBoxes(0);
    assert.equal(reminderCalls(world).length, 0, 'the reminder retires only after the first successful smash');
  }],

  ['the main-game smash reminder gives keyboard-specific desktop instructions', () => {
    const world = boxWorld(true);
    const visible = addBox(world, 160, 230);
    world.drawBoxes(0);
    const calls = reminderCalls(world);
    const copy = calls.map(call => call.value).join(' ');
    assert.match(copy, /W ABOVE IT/i);
    assert.match(copy, /S TO SMASH/i);
    assert.ok(calls.some(call => Math.abs(call.x - visible.x) < 90 && call.y < visible.y + 30));
  }],

  ['movement-tutorial halo belongs to the active smash stage, not an incidental down input', () => {
    const halo = section('// TUTORIAL TARGET', "ctx.save(); ctx.globalAlpha=appear;");
    assert.doesNotMatch(halo, /!S\.taught\.roll/,
      'an early swipe-down must not permanently suppress the box halo');
    assert.match(halo, /TEACH_STAGES\s*\[\s*S\.tStage\s*\]/,
      'halo ownership must derive from the active curriculum stage');
    assert.match(halo, /\.key\s*===?\s*['"]smash['"]/,
      'only the active smash stage may own the tutorial-box halo');
  }],

  ['retiring unreachable tutorial curriculum never claims MOVES MASTERED', () => {
    const retired = tutorialWorld();
    retired.teachSkipToPortal();
    assert.equal(retired.S.tStage, retired.TEACH_STAGES.length, 'retirement should end the unavailable prompts');
    assert.equal(retired.S.tCelebDone, false, 'retirement is not mastery');
    assert.equal(retired.S.tCelebT, 0, 'retirement must not schedule the MOVES MASTERED celebration');
    assert.ok(!retired.sounds.includes('mastered'), 'retirement must not play the mastery sound');

    const mastered = tutorialWorld();
    mastered.S.tStage = mastered.TEACH_STAGES.length - 1;
    mastered.S.tCount = mastered.TEACH_STAGES.at(-1).need - 1;
    mastered.teachCredit('smash');
    assert.equal(mastered.S.tCelebDone, true, 'real completion still earns mastery');
    assert.ok(mastered.sounds.includes('mastered'));
  }],

  ['automatic guided outcomes are W-L-W and the retired Level-2 loss cannot duplicate them', () => {
    const expected = ['win', 'loss', 'win'];
    for (let slot = 1; slot <= 3; slot++) {
      const world = tutorialOutcomeWorld({ guided: true, slot, level: 1 });
      assert.equal(world.outcome(), expected[slot - 1], `guided slot ${slot}`);
      assert.equal(world.storage.getItem('cq_firstloss_v'), slot === 2 ? '1' : null,
        `guided slot ${slot} first-loss identity`);
    }

    const later = tutorialOutcomeWorld({ guided: false, level: 2 });
    assert.deepEqual([later.outcome(), later.outcome(), later.outcome()], ['win', 'win', 'win'],
      'the old Level-2 First Loss must not fire after the guided loss moved to slot 2');
    assert.equal(later.storage.getItem('cq_firstloss_v'), null,
      'the retired Level-2 injector must not burn or depend on its old once-ever flag');
  }],

  ['all three automatic guided trades keep 2:1 metadata and the first-trade anchor contract', () => {
    const commit = section('function commitTrade()', "$('btnConfirm').onclick = commitTrade;");
    const anchor = section('// Note 2a (playtest 253)', '// MEANINGFUL R (build 215)', commit);
    assert.match(commit, /trade\._firstRide\s*=\s*!!_introTrade/,
      'the first-ride identity that owns the authored anchor/score must remain intact');
    assert.match(anchor, /const _ecx = turtle\.x \+ turtle\.w \/ 2/);
    assert.match(anchor, /candles\.find\(function \(cc\) \{ return _ecx >= cc\.x && _ecx < cc\.x \+ cc\.w; \}\)/);
    assert.match(anchor, /trade\.entryH = Math\.max\(_ec\.open, _ec\.h\)/);
    assert.match(anchor, /trade\.lastPrice = trade\.entryH/);

    const guided = section('if (_introTrade && sIdx >= 0) {', '} else if (session.level <= 3) {', commit);
    assert.match(guided, /trade\._l1Outcome\s*=\s*authoredTutorialOutcome\(\)/,
      'guided outcomes must come from the authored W-L-W owner');
    assert.doesNotMatch(guided, /trade\._l1Outcome\s*=\s*['"]win['"]/,
      'the old unconditional guided win must not survive');
    assert.match(guided, /trade\._isFirstLoss\s*=\s*trade\._l1Outcome\s*===\s*['"]loss['"]/,
      'slot 2 must carry First-Loss identity into its coaching, journal, and analytics');
    assert.match(guided, /trade\.rr\s*=\s*2/,
      'every automatic guided slot retains the approved 2:1 reward:risk metadata');
  }],

  ['beta-flow ledger is schema-bounded, monotonic, idempotent, and terminal only on survey evidence', () => {
    const world = betaFlowWorld();
    const api = world.api;
    for (const name of ['state', 'advance', 'hasReached', 'resumePlan', 'isActive', 'reset']) {
      assert.equal(typeof api[name], 'function', `CQBetaFlow.${name} must be public`);
    }
    assert.equal(api.key, 'cq_beta_flow_v1');
    assert.deepEqual(Array.from(api.stages), [
      'new', 'movement_started', 'movement_complete', 'market_selected',
      'trade_1_complete', 'trade_2_complete', 'trade_3_complete', 'boss_won',
      'journal_due', 'journal_started', 'journal_completed', 'survey_due', 'survey_submitted',
    ]);

    assert.equal(api.state().stage, 'new');
    assert.equal(api.advance('movement_started'), true);
    assert.equal(api.advance('market_selected', { market: 'BTC' }), true);
    assert.equal(api.advance('movement_complete'), true, 'a stale duplicate callback remains harmless');
    assert.equal(api.state().stage, 'market_selected', 'a stale callback must never regress the ledger');
    assert.equal(api.state().market, 'BTC');
    assert.equal(api.advance('trade_1_complete', { tradeSlot: 1 }), true);
    assert.equal(api.advance('trade_1_complete', { tradeSlot: 0 }), true);
    assert.equal(api.state().tradeSlot, 1, 'same-stage retries must not lower the completed slot');
    assert.equal(api.advance('not_a_stage'), false);
    assert.equal(api.hasReached('movement_complete'), true);
    assert.equal(api.hasReached('trade_2_complete'), false);

    const saved = JSON.parse(world.storage.getItem('cq_beta_flow_v1'));
    assert.equal(saved.version, 1);
    assert.equal(saved.stage, 'trade_1_complete');
    assert.equal(saved.tradeSlot, 1);
    assert.equal(saved.market, 'BTC');
    assert.match(saved.updatedAt, /^\d{4}-\d\d-\d\dT/);

    assert.equal(api.advance('survey_due'), true);
    assert.equal(api.isActive(), true, 'survey_due remains recoverable and non-terminal');
    world.storage.setItem('cq_bt_survey_submitted', '1');
    assert.equal(api.state().stage, 'survey_submitted', 'confirmed survey evidence heals the ledger to terminal');
    assert.equal(api.isActive(), false);
  }],

  ['beta-flow rejects malformed rows and restores each guided slot at the next unpaid boundary', () => {
    const malformed = betaFlowWorld({
      cq_beta_flow_v1: '{not-json', cq_faction: 'ETH', cq_player_v1: '{also-bad',
    });
    assert.equal(malformed.api.state().stage, 'market_selected',
      'malformed checkpoint data must fail safe to existing durable market evidence');
    assert.equal(malformed.api.state().market, 'ETH');

    const cases = [
      ['trade_1_complete', 1, 'momentum_trade_2'],
      ['trade_2_complete', 2, 'pullback_trade_3'],
      ['trade_3_complete', 3, 'review_then_boss'],
    ];
    for (const [stage, slot, next] of cases) {
      const world = betaFlowWorld();
      assert.equal(world.api.advance(stage, { tradeSlot: slot, market: 'BTC' }), true);
      const plan = world.api.resumePlan();
      assert.equal(plan.kind, 'trade', stage);
      assert.equal(plan.tradeSlot, slot, stage);
      assert.equal(plan.next, next, stage);
    }
  }],

  ['guided checkpoints persist after reward/journal work and restore without replaying paid trades', () => {
    const resolver = section('function resolveTrade(result)', '// Between guided trades:');
    const checkpoint = resolver.indexOf("CQBetaFlow.advance('trade_' + _cqSlot + '_complete'");
    assert.ok(checkpoint > resolver.indexOf('logJournalTrade(tradeRecord)'),
      'checkpoint must follow the durable journal write');
    assert.ok(checkpoint > resolver.indexOf("addXP(result === 'win'"),
      'checkpoint must follow the resolved trade reward/XP path');
    assert.ok(checkpoint < resolver.indexOf('releasePlayerPacedMotion()'),
      'checkpoint must be written while the resolved trade identity is still available');
    assert.ok(checkpoint < resolver.indexOf('trade = null'),
      'checkpoint must precede teardown so a reload cannot repay the trade');
    assert.match(resolver.slice(checkpoint - 500, checkpoint + 500),
      /introFlow\.active && introFlow\.awaitingTrade && !introFlow\.firstTradeDone/,
      'ordinary/manual later trades must not mutate guided-slot continuity');

    const restore = section('function _resumeBetaFlowAfterMarket()', 'window._resumeBetaFlowAfterMarket = _resumeBetaFlowAfterMarket;');
    assert.match(restore, /introFlow\.tradesDone = plan\.tradeSlot/);
    assert.match(restore, /plan\.tradeSlot === 1 \? 'momentum' : 'pullback'/);
    assert.match(restore, /teachThenNextTrade\(concept, left\)/);
    assert.match(restore, /plan\.tradeSlot === 1 \|\| plan\.tradeSlot === 2/);
    assert.match(restore, /autoOpenTradeReplay\(rec\)/);
    assert.match(restore, /waitThenIntroBoss\(token\)/);
    assert.match(restore, /else beginIntroProve\(\)/,
      'missing replay evidence may skip the review, but must preserve slot 3 and continue forward');
    assert.doesNotMatch(restore, /resolveTrade\(|commitTrade\(|player\.shells\s*[+\-]=|logJournalTrade/,
      'restore may replay teaching/review, never a paid trade or reward');
    assert.doesNotMatch(restore, /_runMovementTutorial|BlockchainJourney/,
      'a completed trade checkpoint must never route back to movement tutorial');
  }],
];

function runSuite(options = {}) {
  const failures = [];
  let passed = 0;
  for (const [name, test] of tests) {
    try {
      test();
      passed++;
      if (options.report !== false) console.log(`\u2713 ${name}`);
    } catch (error) {
      failures.push({ name, error });
      if (options.report !== false) {
        console.error(`\u2717 ${name}`);
        console.error(error.stack || String(error));
      }
    }
  }
  const result = {
    ok: failures.length === 0,
    passed,
    total: tests.length,
    failures,
    detail: `${passed}/${tests.length} Build 373 feedback/recovery contracts passed`,
  };
  if (options.report !== false) console.log(`\n${result.detail}`);
  return result;
}

if (require.main === module) process.exit(runSuite().ok ? 0 : 1);
module.exports = { runSuite };
