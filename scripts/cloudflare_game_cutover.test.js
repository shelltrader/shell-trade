#!/usr/bin/env node
'use strict';

/* Focused, dependency-free release contracts for the Cloudflare-only game cutover. */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const game = read('chart-quest.html');
const adapter = read('website/assets/cq-cloud-data.js').trim();
const tracker = read('website/assets/cq-track.js').trim();
const boot = read('website/assets/cq-boot-crash.js').trim();

function between(source, begin, end) {
  const start = source.indexOf(begin);
  const finish = source.indexOf(end, start + begin.length);
  assert.ok(start >= 0 && finish > start, `missing generated block ${begin}`);
  return source.slice(start + begin.length, finish).trim();
}

const tests = [
  ['canonical game embeds exact Cloudflare, tracker and boot sources', () => {
    assert.equal(between(game, '/* CQCLOUDDATA:BEGIN — generated from website/assets/cq-cloud-data.js by scripts/sync_cloud_data.py — DO NOT EDIT HERE */', '/* CQCLOUDDATA:END */'), adapter);
    assert.equal(between(game, '/* CQTRACK:BEGIN — generated from website/assets/cq-track.js by scripts/sync_track.py — DO NOT EDIT HERE */', '/* CQTRACK:END */'), tracker);
    for (const relative of ['chart-quest.html', 'website/index.html', 'website/play.html', 'website/survey.html']) {
      assert.equal(
        between(read(relative), '/* CQBOOTCRASH:BEGIN — generated from website/assets/cq-boot-crash.js by scripts/sync_boot_crash.py — DO NOT EDIT HERE */', '/* CQBOOTCRASH:END */'),
        boot,
        `${relative} boot capture drifted`,
      );
    }
  }],

  ['production browser runtime has no previous-provider SDK, URL, key or direct market host', () => {
    const runtime = [
      'chart-quest.html', 'website/game.html', 'website/assets/cq-track.js',
      'website/assets/cq-cloud-data.js', 'website/assets/cq-boot-crash.js',
      'website/index.html', 'website/play.html', 'website/survey.html',
    ].map(read).join('\n');
    assert.doesNotMatch(runtime, /https?:\/\/[^\s'"<]*supabase|\.supabase\.co|supabase-js|createClient\s*\(/i);
    assert.doesNotMatch(runtime, /eyJhbGciOiJIUzI1Ni/);
    assert.doesNotMatch(runtime, /api\.coinbase\.com|api\.binance\.com/i);
    assert.doesNotMatch(runtime, /\bSUPA_(URL|ANON)\b|\b_supa(?:User|SignedIn)?\b/);
    const routes = JSON.parse(read('website/_routes.json'));
    assert.ok(routes.include.includes('/api/app/*'), 'Cloudflare Pages must invoke every app-data Function route');
  }],

  ['account flow is same-origin, confirmed, eight-character and claim-secret safe', () => {
    const auth = between(game, '(function initCloudData() {', '/* =========================================================\n   CHART QUEST — first scene');
    for (const call of [
      'cloud.account.create(email, pass, true)',
      'cloud.account.claim(email, token, pass)',
      'cloud.account.signIn(email, pass)',
      'cloud.account.session()',
      'cloud.account.signOut()',
    ]) assert.ok(auth.includes(call), `missing ${call}`);
    assert.match(auth, /res && res\.ok && res\.confirmed && res\.data && res\.data\.user/);
    assert.match(auth, /pass\.length < 8/);
    assert.match(auth, /params\.delete\('claim_token'\).*params\.delete\('claim'\).*params\.delete\('email'\)/s);
    assert.doesNotMatch(auth, /localStorage\.setItem\([^\n]*(claim|password|token)/i);
  }],

  ['every game data surface delegates to CQCloudData and keeps legacy local keys', () => {
    for (const surface of [
      'cloud.profile.push', 'cloud.profile.bootstrap', 'cloud.profile.pull', 'cloud.journal.pushSnapshot',
      'cloud.journal.pullSnapshot', 'cloud.streak.push', 'cloud.streak.pull',
      'cloud.mastery.push', 'cloud.bugs.report', 'cloud.visits.record',
      'window.CQCloudData.content.pushBatch', 'window.CQCloudData.markets.quotes',
    ]) assert.ok(game.includes(surface), `missing ${surface}`);
    for (const key of [
      'cq_pid', 'cq_player_v1', 'shellTradeJournal_v1', 'shellTradeNotes_v1',
      'shellTradeDaily_v1', 'cq_mastery_v1', 'cq_content_queue_v1', 'cq_bt_pending',
    ]) assert.ok(game.includes(`'${key}'`) || adapter.includes(`'${key}'`) || tracker.includes(`'${key}'`), `missing legacy key ${key}`);
    const auth = between(game, '(function initCloudData() {', '/* =========================================================\n   CHART QUEST — first scene');
    assert.doesNotMatch(auth, /removeItem\(['"](?:cq_player_v1|shellTradeJournal_v1|shellTradeNotes_v1|shellTradeDaily_v1|cq_mastery_v1)['"]\)/);
    assert.match(game, /result && \(result\.ok \|\| result\.queued\)/,
      'legacy content rows may leave only after confirmed or durable adapter acceptance');
    assert.match(game, /await cloud\.flush\(\);[\s\S]*journalQueued\(\)/,
      'journal snapshots must serialize behind exact receipts');
    assert.match(game, /delete_trade_ids:\s*deleteTrades,\s*delete_note_ids:\s*deleteNotes/,
      'journal removals must be explicit instead of inferred from an omitted snapshot row');
    assert.match(game, /if \(remoteJournal && Array\.isArray\(remoteJournal\.trades\)\)[\s\S]*_journalKnownTrades = new Set/,
      'even an empty confirmed remote journal must establish the account delete baseline');
    assert.match(game, /rememberJournalIdentity\(row, 'trade'\)/);
    assert.match(game, /rememberJournalIdentity\(row, 'note'\)/);
    assert.match(game, /const bound = _journalObjectIds\.get\(value\);[\s\S]*return bound\.id/,
      'pulled wrapper ids must survive conversion back to legacy Journal objects');
  }],

  ['telemetry and boot failures stay durable and never cross providers', () => {
    assert.doesNotMatch(tracker + boot, /https?:\/\/|Authorization|\bapikey\b/i);
    assert.match(tracker, /persistPending\(rows\);[\s\S]*post\('events', rows/);
    assert.match(boot, /persist\(rows\);\s*drain\(\);/);
    assert.match(boot, /receipt\.ok === true && Number\(receipt\.written\) === count/);
    assert.doesNotMatch(tracker, /q\.slice\(q\.length - 200\)/,
      'durable analytics must not discard older pending rows to enforce a cap');
  }],

  ['CSP, service worker and legal pages describe the Cloudflare-only boundary', () => {
    const policies = ['website/_headers', '_headers', 'netlify.toml'].map(read);
    for (const policy of policies) {
      assert.doesNotMatch(policy, /supabase|coinbase|binance|cdn\.jsdelivr/i);
      assert.match(policy, /connect-src 'self' https:\/\/cloudflareinsights\.com https:\/\/\*\.cloudflareinsights\.com/);
    }
    const sw = read('website/sw.js');
    assert.match(sw, /chartquest-site-v19/);
    assert.match(sw, /\.\/assets\/cq-cloud-data\.js/);
    assert.match(read('website/privacy.html'), /production game sends no new account, gameplay, survey or bug-report data there/i);
    assert.match(read('website/terms.html'), /one-time secure restore code/i);
  }],

  ['mirrors and build identity are ready for build 373', () => {
    assert.equal(read('index.html'), game, 'root mirror drifted');
    assert.equal(read('website/game.html'), game, 'website game mirror drifted');
    assert.match(game, /const BUILD_TAG = 'build 373 /);
    for (const relative of ['website/bosses.html', 'website/courses.html', 'website/index.html', 'website/play.html', 'website/survey.html']) {
      assert.match(read(relative), /cq-track\.js\?v=370/);
    }
  }],
];

let failed = 0;
for (const [name, test] of tests) {
  try { test(); console.log(`\u2713 ${name}`); }
  catch (error) { failed += 1; console.error(`\u2717 ${name}`); console.error(error.stack || String(error)); }
}
console.log(`\n${tests.length - failed}/${tests.length} Cloudflare game-cutover tests passed`);
process.exitCode = failed ? 1 : 0;
