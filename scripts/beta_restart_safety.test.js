#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');
const PLAY = fs.readFileSync(path.join(ROOT, 'website/play.html'), 'utf8');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; process.stdout.write('✓ ' + name + '\n'); }
  catch (err) { process.stderr.write('✗ ' + name + '\n' + (err.stack || err) + '\n'); process.exitCode = 1; }
}

test('wrapper consumes fresh once and every later Restart uses only the clean query', () => {
  assert.match(PLAY, /_cqFresh\s*=\s*_cqParams\.has\('fresh'\)/);
  assert.match(PLAY, /_cqParams\.delete\('fresh'\);\s*_cqParams\.delete\('fresh_confirmed'\)/);
  assert.match(PLAY, /history\.replaceState\([\s\S]*?_cqClean/);
  assert.match(PLAY, /gframe\.src\s*=\s*CQ_GAME\s*\+\s*CQ_FIRST_QS/);
  const restart = PLAY.slice(PLAY.indexOf("document.getElementById('cqRestartBtn')"), PLAY.indexOf('/* ── CLOSED BETA'));
  assert.match(restart, /window\.confirm\('Restart from your last saved checkpoint\?/);
  assert.match(restart, /gframe\.src\s*=\s*CQ_GAME\s*\+\s*CQ_QS/);
  assert.doesNotMatch(restart, /CQ_FIRST_QS/);
});

test('direct production fresh reset is confirmed and wrapper approval is same-origin scoped', () => {
  const block = GAME.slice(GAME.indexOf('/* PLAYTEST RESET'), GAME.indexOf('/* BETA_FLOW_CONTINUITY_V1:BEGIN'));
  assert.match(block, /_ref\.origin\s*===\s*location\.origin/);
  assert.ok(block.includes('/\\/play\\/?$/.test(_ref.pathname)'), 'wrapper referrer path must be /play');
  assert.match(block, /window\.parent\s*!==\s*window/);
  assert.match(block, /confirm\('Start ChartQuest over\?/);
  assert.match(block, /_p\.delete\('fresh_confirmed'\)/);
  assert.doesNotMatch(block, /!_real\s*\|\|\s*_qa/);
});

test('tester QR rejects valued, bare, encoded, and fragment-suffixed fresh/beta bypass flags before any network work', () => {
  for (const [suffix, flag] of [
    ['?fresh=1', 'fresh'], ['?fresh', 'fresh'], ['?fr%65sh=1', 'fresh'], ['?fresh#resume', 'fresh'],
    ['?beta=0', 'beta'], ['?beta', 'beta'], ['?b%65ta=0', 'beta'], ['?beta=0#resume', 'beta'],
  ]) {
    const r = cp.spawnSync('python3', ['scripts/tester_qr.py', '--url', 'https://playchartquest.com/' + suffix,
      '--out', '/tmp/chartquest-should-not-exist.svg'], { cwd: ROOT, encoding: 'utf8', timeout: 3000 });
    assert.notEqual(r.status, 0, suffix + ' must be rejected');
    assert.match((r.stdout || '') + (r.stderr || ''), new RegExp(flag + '.*DEV flag', 'i'));
  }
});

test('service-worker controller changes defer while beta continuity is active', () => {
  const sw = GAME.slice(GAME.indexOf('// ── PWA service worker'), GAME.indexOf('// ── Mobile:'));
  assert.match(sw, /CQBetaFlow\.isActive\(\)/);
  assert.match(sw, /if \(_swBetaActive\(\)\) \{ _swReloadDeferred = true; return; \}/);
  assert.match(sw, /addEventListener\('cq:beta-flow', _swReloadWhenSafe\)/);
  assert.ok(sw.indexOf('_swBetaActive()) { _swReloadDeferred') < sw.lastIndexOf('location.reload()'),
    'active-flow check must precede the controllerchange reload');
});

test('boss, Journal, and survey boundaries are independently durable', () => {
  assert.match(GAME, /CQBetaFlow\.advance\('boss_won'\)/);
  assert.match(GAME, /CQBetaFlow\.advance\('journal_due'\)/);
  assert.match(GAME, /CQBetaFlow\.advance\('journal_started'\)/);
  assert.match(GAME, /CQBetaFlow\.advance\('journal_completed'\)/);
  assert.match(GAME, /CQBetaFlow\.advance\('survey_due'\)/);
  const flow = GAME.slice(GAME.indexOf('/* BETA_FLOW_CONTINUITY_V1:BEGIN'), GAME.indexOf('/* BETA_FLOW_CONTINUITY_V1:END */'));
  assert.match(flow, /var VERSION = 2/);
  assert.match(flow, /if \(stage === 'survey_submitted'\) return false/,
    'ordinary stage progression must not forge the terminal receipt');
  assert.match(flow, /function markSubmitted\(submittedResponseId\)/);
  assert.match(flow, /receipt !== cur\.surveyResponseId/,
    'only an exact response-specific receipt may close the flow');
  assert.doesNotMatch(flow, /get\(['"]cq_bt_survey_submitted['"]\)/,
    'the historical analytics once-flag cannot terminalize a new playtest');
  assert.match(GAME, /Continue where you left off/);
  assert.match(GAME, /RESTART JOURNAL/);
});

test('mandatory survey handoff has no in-game dismiss control and retries top-level replacement', () => {
  const gateStart = GAME.indexOf('function ensureSurveyGate()');
  const handoffEnd = GAME.indexOf('/* Boss/Journal recovery', gateStart);
  assert.ok(gateStart >= 0 && handoffEnd > gateStart, 'mandatory survey handoff must be extractable');
  const handoff = GAME.slice(gateStart, handoffEnd);
  const gateOnly = handoff.slice(0, handoff.indexOf('function openSurvey()'));
  assert.match(gateOnly, /id = 'cqBetaSurveyGate'/);
  assert.match(gateOnly, /aria-modal['"], 'true'/);
  assert.doesNotMatch(gateOnly, /<button|aria-label=["'](?:Close|Skip|Dismiss)/i,
    'the full-screen owed-survey gate must not render an exit control');
  assert.match(handoff, /CQBetaFlow\.state\(\)\.surveyResponseId/);
  assert.match(handoff, /window\.parent\.postMessage\([\s\S]*window\.location\.origin/,
    'the wrapper message must stay same-origin scoped');
  assert.match(handoff, /var w = \(window\.top && window\.top !== window\) \? window\.top : window/);
  assert.match(handoff, /w\.location\.replace\(nav\)/);
  assert.match(handoff, /setTimeout\(replaceWithSurvey, 1800\)/,
    'a silently ignored navigation must leave the gate up and retry');
});

test('Guardian completion is stamped only after its shells and XP are durably saved', () => {
  const bossStart = GAME.indexOf('function bossWin()');
  const bossEnd = GAME.indexOf('\nfunction bossLose()', bossStart);
  assert.ok(bossStart >= 0 && bossEnd > bossStart, 'bossWin block must be extractable');
  const boss = GAME.slice(bossStart, bossEnd);
  const credit = boss.indexOf('player.shells += b.reward.shells');
  const xp = boss.indexOf('addXP(b.reward.xp)', credit);
  const proof = boss.indexOf("localStorage.getItem('cq_player_v1')", xp);
  const complete = boss.indexOf("CQBetaFlow.advance('boss_won')", proof);
  assert.ok(credit >= 0 && xp > credit && proof > xp && complete > proof,
    'boss reward must be credited, saved through addXP, verified, then checkpointed in that order');
  assert.match(boss, /Number\(_savedBossReward\.shells\)\s*===\s*Number\(player\.shells\)/);
});

test('Journal completion is stamped only after its shell reward is durably saved', () => {
  const payStart = GAME.indexOf('function payShells()');
  const payEnd = GAME.indexOf('\n  function finish()', payStart);
  assert.ok(payStart >= 0 && payEnd > payStart, 'Journal payShells block must be extractable');
  const pay = GAME.slice(payStart, payEnd);
  const credit = pay.indexOf('p.shells += REWARD');
  const save = pay.indexOf('saveLocalProgress()');
  const proof = pay.indexOf("localStorage.getItem('cq_player_v1')");
  const complete = pay.indexOf("CQBetaFlow.advance('journal_completed')");
  assert.ok(credit >= 0 && save > credit && proof > save && complete > proof,
    'reward must be credited, saved, verified, then checkpointed in that order');
  assert.match(pay, /Number\(_savedReward\.shells\)\s*===\s*Number\(p\.shells\)/);
});

if (!process.exitCode) process.stdout.write('\n' + passed + '/8 restart and survey safety contracts passed\n');
