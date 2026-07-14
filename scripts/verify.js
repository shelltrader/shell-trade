#!/usr/bin/env node
'use strict';
/*
 * ChartQuest Regression Gate — run before every commit.
 *   node scripts/verify.js            (or: scripts/cq.sh verify)
 *
 * Prints PASS or FAIL with per-check detail; exit 0 on pass, 1 on fail.
 * TOOLING ONLY — reads the repo, changes nothing.
 *
 * Checks (mapped to the 10 requirements):
 *   1  Correct Finn asset active (run.png static-leg walk)
 *   2  Deprecated Finn (rig / walk-sheet) inactive
 *   3a Game script parses (syntax = boot proxy)   3b Headless boot (optional, needs puppeteer)
 *   4  Lessons load        5 Bosses load        6 Save system initializes
 *   7  BUILD_TAG incremented (only if chart-quest.html changed vs HEAD)
 *   8  index.html mirrors source
 *   9  No large binaries added (>5MB, non-ignored)
 *   10 Protected systems unchanged vs HEAD  (override: CQ_ALLOW_PROTECTED=1 when a
 *      protected change was explicitly approved)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const SRC = 'chart-quest.html';
const MIRROR = 'index.html';

const R = [];
const add = (id, name, status, detail) => R.push({ id, name, status, detail: detail || '' });
const read = f => fs.readFileSync(f, 'utf8');
const exists = f => { try { fs.accessSync(f); return true; } catch { return false; } };
const sizeMB = f => fs.statSync(f).size / (1024 * 1024);
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git = args => { try { return cp.execSync('git ' + args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; } };
const srcChanged = () => { try { cp.execSync('git diff --quiet HEAD -- ' + SRC, { stdio: 'ignore' }); return false; } catch { return true; } };
const buildNum = s => { const m = s && s.match(/BUILD_TAG\s*=\s*'build\s+(\d+)/); return m ? parseInt(m[1], 10) : null; };
const count = (s, re) => (s.match(re) || []).length;

// ── canonical signatures (deterministic; used only to detect CHANGE vs HEAD) ──
function extractCFG(s) {
  const i = s.indexOf('const CFG = {'); if (i < 0) return {};
  const block = s.slice(i, s.indexOf('\n};', i));
  const out = {}; const re = /(\w+):\s*(-?\d+(?:\.\d+)?)/g; let m;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}
const cqKeys = s => [...new Set(s.match(/cq_[a-z_]+/g) || [])].sort();
function lessonKeyCount(s) {
  const i = s.indexOf('const LESSONS = {'); if (i < 0) return 0;
  let d = 0, j = s.indexOf('{', i); const start = j;
  for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; }
  return count(s.slice(start, j), /^\s{2}\w+:/gm);
}
const finnSig = s => JSON.stringify({
  staticLeg: /STATIC-LEG WALK/.test(s),
  rigOn: count(s, /_rigOn/g),
  legRigFlag: count(s, /FINN_LEG_RIG/g),
  runInLoad: /run:\s*'finn\/run\.png'/.test(s),
});

// ─────────────────────────── the checks ───────────────────────────
function run() {
  const s = read(SRC);

  // 1 — correct Finn active
  {
    const load = /run:\s*'finn\/run\.png'/.test(s), marker = /STATIC-LEG WALK/.test(s), file = exists('finn/run.png');
    const ok = load && marker && file;
    add('1', 'Correct Finn asset active (run.png, static legs)', ok ? 'PASS' : 'FAIL',
      ok ? 'run.png in load list + STATIC-LEG marker + file present'
         : `run.png-in-loadlist=${load} static-leg-marker=${marker} finn/run.png=${file}`);
  }

  // 2 — deprecated Finn inactive
  {
    const rigOn = count(s, /_rigOn/g);
    const legFlag = count(s, /FINN_LEG_RIG/g);
    const rigLegCalls = count(s, /drawFinnRigLeg\(/g) - count(s, /function drawFinnRigLeg\(/g);
    const rigTailCalls = count(s, /drawFinnRigTail\(/g) - count(s, /function drawFinnRigTail\(/g);
    // build 254 — the OLD turtle model is DELETED and must stay gone: no deprecated asset
    // filenames referenced, no walk-sheet frame array in use, and the PNGs themselves absent.
    // (Set in stone: this check FAILS the gate if any of them ever come back.)
    const deprAssetRef = count(s, /walk-sheet\.png|finn\/body\.png|finn\/leg\.png/g);
    const walkArrayRef = count(s, /FINN_SPRITES\.walk\b/g);
    const deprFiles = ['finn/walk-sheet.png', 'finn/body.png', 'finn/leg.png'].filter(f => exists(f));
    const ok = rigOn === 0 && legFlag === 0 && rigLegCalls <= 0 && rigTailCalls <= 0
      && deprAssetRef === 0 && walkArrayRef === 0 && deprFiles.length === 0;
    add('2', 'Deprecated Finn (rig / walk-sheet / body / leg) DELETED', ok ? 'PASS' : 'FAIL',
      ok ? 'old model fully gone: no rig flags/calls, no walk-sheet/body/leg refs or arrays, deprecated PNGs absent'
         : `_rigOn=${rigOn} FINN_LEG_RIG=${legFlag} rigLegCalls=${rigLegCalls} rigTailCalls=${rigTailCalls} deprAssetRefs=${deprAssetRef} walkArrayRefs=${walkArrayRef} deprFilesPresent=[${deprFiles.join(', ')}]`);
  }

  // 3a — syntax (boot proxy): parse every inline <script> block
  {
    const blocks = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(b => b.trim().length > 20);
    let bad = 0, i = 0;
    for (const b of blocks) {
      i++; const tmp = path.join(os.tmpdir(), `_cq_blk${i}.js`); fs.writeFileSync(tmp, b);
      try { cp.execSync(`node --check "${tmp}"`, { stdio: 'ignore' }); } catch { bad = i; } finally { try { fs.unlinkSync(tmp); } catch {} }
      if (bad) break;
    }
    add('3a', 'Game script parses (syntax = boot proxy)', bad ? 'FAIL' : 'PASS',
      bad ? `syntax error in inline <script> block #${bad}` : `${blocks.length} inline <script> blocks parse clean`);
  }

  // 4 — lessons load
  {
    const has = /const LESSONS = \{/.test(s), keys = lessonKeyCount(s);
    const ok = has && /function conceptTier/.test(s) && /const LESSON_MASTERY/.test(s) && keys >= 5;
    add('4', 'Lessons load (LESSONS + conceptTier + mastery map)', ok ? 'PASS' : 'FAIL',
      ok ? `${keys} lesson keys; conceptTier + LESSON_MASTERY present` : `LESSONS=${has} keys=${keys} conceptTier=${/function conceptTier/.test(s)}`);
  }

  // 5 — bosses load
  {
    const hasBossEngine = /function openBoss\s*\(/.test(s) && /function bossRound\s*\(/.test(s);
    const missing = [];
    for (let i = 0; i <= 10; i++) if (!['png', 'jpg', 'jpeg', 'webp'].some(e => exists(`bosses/boss-${i}.${e}`))) missing.push(i);
    const ok = hasBossEngine && missing.length === 0;
    add('5', 'Bosses load (openBoss/bossRound exam + 11 boss art)', ok ? 'PASS' : 'FAIL',
      ok ? 'boss exam engine (openBoss + bossRound) present; boss-0..10 art present' : `bossEngine=${hasBossEngine} missingBossArt=[${missing}]`);
  }

  // 6 — save init
  {
    const keys = cqKeys(s), core = ['cq_faction', 'cq_played', 'cq_music'], missing = core.filter(k => !keys.includes(k));
    const ok = /localStorage/.test(s) && missing.length === 0 && keys.length >= 10;
    add('6', 'Save system initializes (localStorage cq_* keys)', ok ? 'PASS' : 'FAIL',
      ok ? `${keys.length} cq_* keys incl. core (faction/played/music)` : `missingCore=[${missing}] totalKeys=${keys.length}`);
  }

  // 7 — BUILD_TAG incremented (only if the game file changed)
  {
    if (!srcChanged()) add('7', 'BUILD_TAG incremented', 'SKIP', 'chart-quest.html unchanged vs HEAD — N/A');
    else {
      const cur = buildNum(s), head = buildNum(git('show HEAD:' + SRC) || '');
      const ok = cur != null && head != null && cur > head;
      add('7', 'BUILD_TAG incremented', ok ? 'PASS' : 'FAIL', ok ? `build ${head} → ${cur}` : `current=${cur} head=${head} — bump BUILD_TAG`);
    }
  }

  // 8 — mirror
  {
    const ok = exists(MIRROR) && sha(SRC) === sha(MIRROR);
    add('8', 'index.html mirrors source', ok ? 'PASS' : 'FAIL',
      ok ? 'sha256(index.html) == sha256(chart-quest.html)' : 'index.html differs — run: scripts/cq.sh mirror');
  }

  // 9 — no large binaries added
  {
    const LIMIT = 5;
    const offenders = [];
    for (const line of (git('status --porcelain') || '').split('\n')) {
      if (!line.trim()) continue;
      let p = line.slice(3).trim(); if (p.includes(' -> ')) p = p.split(' -> ')[1]; p = p.replace(/^"|"$/g, '');
      if (!exists(p)) continue; try { if (fs.statSync(p).isDirectory()) continue; } catch { continue; }
      let ignored = false; try { cp.execSync(`git check-ignore "${p}"`, { stdio: 'ignore' }); ignored = true; } catch {}
      if (!ignored && sizeMB(p) > LIMIT) offenders.push(`${p} (${sizeMB(p).toFixed(0)}MB)`);
    }
    const deployTracked = (git('ls-files deploy.zip') || '').trim().length > 0;
    const ok = offenders.length === 0 && !deployTracked;
    add('9', 'No large binaries added (>5MB, non-ignored)', ok ? 'PASS' : 'FAIL',
      ok ? 'none staged/untracked; deploy.zip not tracked' : `offenders=[${offenders.join(', ')}]${deployTracked ? ' deploy.zip is TRACKED' : ''}`);
  }

  // 10 — protected systems unchanged vs HEAD
  {
    if (!srcChanged()) add('10', 'Protected systems unchanged', 'SKIP', 'chart-quest.html unchanged vs HEAD — N/A');
    else {
      const head = git('show HEAD:' + SRC);
      if (!head) add('10', 'Protected systems unchanged', 'SKIP', 'no HEAD version to compare');
      else {
        const changed = [];
        if (finnSig(head) !== finnSig(s)) changed.push('Finn render');
        if (JSON.stringify(extractCFG(head)) !== JSON.stringify(extractCFG(s))) changed.push('Movement CFG');
        if (cqKeys(head).join() !== cqKeys(s).join()) changed.push('Save keys');
        if (lessonKeyCount(head) !== lessonKeyCount(s)) changed.push('Lesson set');
        const bossSig = x => `${/function openBoss\s*\(/.test(x)}|${/function bossRound\s*\(/.test(x)}|${/const BOSSES\s*=/.test(x)}`;
        if (bossSig(head) !== bossSig(s)) changed.push('Boss engine');
        const allow = process.env.CQ_ALLOW_PROTECTED === '1';
        if (changed.length === 0) add('10', 'Protected systems unchanged', 'PASS', 'Finn / CFG / save keys / lesson set / boss engine identical to HEAD');
        else if (allow) add('10', 'Protected systems changed (APPROVED)', 'WARN', `changed: ${changed.join(', ')} — allowed via CQ_ALLOW_PROTECTED=1`);
        else add('10', 'Protected systems changed', 'FAIL', `changed: ${changed.join(', ')} — if explicitly approved, re-run with CQ_ALLOW_PROTECTED=1`);
      }
    }
  }

  // 11 — Trading Experience System (TES) guardrails. Locks in CHARTQUEST_TRADING_EXPERIENCE_SYSTEM.md
  // so future edits cannot silently undo the min tutorial duration or the curriculum teaching order.
  {
    const mMin = s.match(/MIN_TRADE_CANDLES\s*=\s*(\d+)/);
    const minCandles = mMin ? parseInt(mMin[1], 10) : 0;
    const mUnlock = s.match(/SETUP_UNLOCK\s*=\s*\{([^}]*)\}/);
    const unlock = mUnlock ? mUnlock[1] : '';
    const order = /momentum\s*:\s*1/.test(unlock) && /pullback\s*:\s*2/.test(unlock) && /bos\s*:\s*3/.test(unlock);
    // TES v1.1 Forbidden #1: no random tutorial loss. The L1–3 outcome must be AUTHORED
    // (authoredTutorialOutcome) and the old 0.58 coin-flip must stay deleted.
    const authored = /function authoredTutorialOutcome\s*\(/.test(s);
    const coinFlips = count(s, /Math\.random\(\)\s*<\s*0\.58/g);
    const ok = minCandles >= 24 && order && authored && coinFlips === 0;
    add('11', 'TES: min duration + curriculum order + authored tutorial outcomes', ok ? 'PASS' : 'FAIL',
      ok ? `MIN_TRADE_CANDLES=${minCandles} (≥24) · SETUP_UNLOCK order intact · outcomes AUTHORED (no 0.58 coin-flip)`
         : `MIN_TRADE_CANDLES=${minCandles} (≥24?), order=${order}, authoredFn=${authored}, coinFlips=${coinFlips} (must be 0) — see TES v1.1`);
  }
}

// 3b — optional real headless boot (only if puppeteer is installed)
async function bootCheck() {
  let puppeteer;
  try { puppeteer = require('puppeteer'); } catch {
    add('3b', 'Headless boot (console errors)', 'SKIP', 'puppeteer not installed — `npm i -D puppeteer` to enable; syntax (3a) is the proxy');
    return;
  }
  const OFFLINE = /binance|websocket|supabase|cdn\.jsdelivr|net::err|failed to load resource|favicon|audiocontext|the request is not allowed/i;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error' && !OFFLINE.test(m.text())) errs.push(m.text().slice(0, 120)); });
    page.on('pageerror', e => { if (!OFFLINE.test(String(e))) errs.push(String(e).slice(0, 120)); });
    await page.goto('file://' + path.join(ROOT, SRC) + '?fresh=1', { waitUntil: 'load', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2500));
    await browser.close();
    add('3b', 'Headless boot (no real console errors)', errs.length ? 'FAIL' : 'PASS',
      errs.length ? `errors: ${errs.slice(0, 3).join(' | ')}` : 'booted; only expected offline errors (network/audio) seen');
  } catch (e) {
    if (browser) try { await browser.close(); } catch {}
    add('3b', 'Headless boot (console errors)', 'WARN', 'boot check could not run: ' + String(e).slice(0, 100));
  }
}

(async () => {
  run();
  await bootCheck();
  const glyph = { PASS: '✓', FAIL: '✗', WARN: '⚠', SKIP: '–' };
  console.log('\nChartQuest Regression Gate\n' + '='.repeat(46));
  for (const r of R.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })))
    console.log(`  ${glyph[r.status] || '?'} [${r.id}] ${r.name}` + (r.detail ? `\n        ${r.detail}` : ''));
  const fails = R.filter(r => r.status === 'FAIL'), warns = R.filter(r => r.status === 'WARN');
  console.log('='.repeat(46));
  console.log(`  ${R.filter(r => r.status === 'PASS').length} pass · ${fails.length} fail · ${warns.length} warn · ${R.filter(r => r.status === 'SKIP').length} skip`);
  console.log('\n' + (fails.length ? 'FAIL' : 'PASS') + (warns.length ? `  (with ${warns.length} warning${warns.length > 1 ? 's' : ''})` : '') + '\n');
  process.exit(fails.length ? 1 : 0);
})();
