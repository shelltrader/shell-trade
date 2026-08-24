#!/usr/bin/env node
'use strict';

/* Focused Build 370/371 teaching-surface contracts. Gameplay physics are deliberately out of scope. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');

function section(startMarker, endMarker) {
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  const end = GAME.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing source marker after ${startMarker}: ${endMarker}`);
  return GAME.slice(start, end);
}

const tests = [
  ['first-trade guide advances only from its explicit Continue button', () => {
    const pointer = section("window.addEventListener('pointerdown'", '// Intro Flow: route taps');
    const guideBranch = section('if (firstTradeGuide) {\n    e.preventDefault();', 'if (lessonOpen)');
    assert.doesNotMatch(guideBranch, /step\s*\+\+|renderFirstTradeGuidePanel|closeFirstTradeGuide/,
      'canvas input must block the world without changing guide state');
    const guide = section('function renderFirstTradeGuidePanel()', 'function openFirstTradeGuide()');
    assert.match(guide, /cqTradeGuideNext[\s\S]*addEventListener\('click'[\s\S]*firstTradeGuide\.step\+\+/);
    assert.match(pointer, /Canvas taps,[\s\S]*only the explicit Continue\/Close controls/);
  }],

  ['first-trade guide is scrollable and Close/final Continue share one teardown', () => {
    const steps = section('function firstTradeGuideSteps()', 'function closeFirstTradeGuide()');
    const guide = section('function closeFirstTradeGuide()', 'let reviewMode =');
    assert.match(steps, /title: 'Reveal one candle at a time'/);
    assert.match(steps, /Finn waits after each one/);
    assert.match(guide, /id="cqTradeGuideScroll"/);
    assert.match(guide, /overflow-y:auto/);
    assert.match(guide, /touch-action:pan-y/);
    assert.match(guide, /overscroll-behavior:contain/);
    assert.match(guide, /cqTradeGuideClose'\)\.addEventListener\('click', closeFirstTradeGuide\)/);
    assert.match(guide, /firstTradeGuide\.step >= firstTradeGuideSteps\(\)\.length - 1\) \{ closeFirstTradeGuide\(\)/);
    assert.match(guide, /READY — CLOSE GUIDE/);
  }],

  ['animated concept lesson has a reachable Close and a contained mobile scroller', () => {
    const lesson = section('function openIntroLesson(sceneKey, onDone)', 'function _seen(id)');
    assert.match(lesson, /id="cqlX"[^>]*aria-label="Close lesson"/);
    assert.match(lesson, /id="cqlScroll"/);
    assert.match(lesson, /max-height:100%;overflow-y:auto/);
    assert.match(lesson, /touch-action:pan-y/);
    assert.match(lesson, /overscroll-behavior:contain/);
    assert.match(lesson, /cqlGo'\)\.addEventListener\('click', close\)/);
    assert.match(lesson, /cqlX'\)\.addEventListener\('click', close\)/);
  }],

  ['Level-1 mobile reminder connects the dive gesture to the diamond target', () => {
    const hud = section('// MOVEMENT CONTROLS', '// ── GUARDIAN APPROACH VIGNETTE');
    assert.match(hud, /\['SWIPE ↓', 'SMASH 💎'\]/);
    assert.doesNotMatch(hud, /\['SWIPE ↓', 'DIVE'\]/);
  }],

  ['home-market ceremony gives chart context before market selection', () => {
    const ceremony = section('const HomeMarketCeremony =', 'window.HomeMarketCeremony =');
    assert.match(ceremony, /context\.className='hmc-context'/);
    assert.match(ceremony, /Candles show price moving over time\. Finn runs across them; each trade asks what price may do next\./);
    assert.ok(ceremony.indexOf("inner.appendChild(context)") < ceremony.indexOf("inner.appendChild(grid)"),
      'chart context must appear before the choice cards');
    assert.match(ceremony, /\.hmc-context\{[\s\S]*max-width:520px/);
  }],
];

function runSuite(options = {}) {
  const failures = [];
  let passed = 0;
  for (const [name, test] of tests) {
    try {
      test();
      passed++;
      if (options.report !== false) console.log(`✓ ${name}`);
    } catch (error) {
      failures.push({ name, error });
      if (options.report !== false) {
        console.error(`✗ ${name}`);
        console.error(error.stack || String(error));
      }
    }
  }
  const result = {
    ok: failures.length === 0,
    passed,
    total: tests.length,
    failures,
    detail: `${passed}/${tests.length} Build 370/371 teaching-surface contracts passed`,
  };
  if (options.report !== false) console.log(`\n${result.detail}`);
  return result;
}

if (require.main === module) process.exit(runSuite().ok ? 0 : 1);
module.exports = { runSuite };
