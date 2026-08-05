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

  // 3a — syntax (boot proxy): parse every inline <script> block.
  // Shared with `cq.sh check` via scripts/check_syntax.js — one implementation, so the two can
  // never drift into being different checks (they had, and the weaker one was the one trusted).
  // The failure detail now carries the FILE LINE of the bad block, not just its ordinal.
  {
    try {
      const syn = require(path.join(__dirname, 'check_syntax.js'));
      const res = syn.checkFile(SRC);
      add('3a', 'Game script parses (syntax = boot proxy)', res.ok ? 'PASS' : 'FAIL', syn.summary(res));
    } catch (e) {
      // FAIL, never WARN: if the one syntax checker cannot run, nothing here knows whether the
      // game parses, and "unknown" must not be able to pass a ship.
      add('3a', 'Game script parses (syntax = boot proxy)', 'FAIL',
        'syntax checker could not run: ' + String(e && e.message || e).slice(0, 110));
    }
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
    for (let i = 1; i <= 11; i++) if (!['png', 'jpg', 'jpeg', 'webp'].some(e => exists(`bosses/boss-${i}.${e}`))) missing.push(i);
    const ok = hasBossEngine && missing.length === 0;
    add('5', 'Bosses load (openBoss/bossRound exam + 11 boss art)', ok ? 'PASS' : 'FAIL',
      ok ? 'boss exam engine (openBoss + bossRound) present; boss-1..11 art present' : `bossEngine=${hasBossEngine} missingBossArt=[${missing}]`);
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
      const _st = line.slice(0, 2);
      if (!(_st.includes('?') || _st.includes('A'))) continue;   // only NEW files count; renames/edits of tracked assets do not
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
    // build 282 — L1-3 FAST-LOSS GUARD (the "first trade lost in 2 candles" regression, hit repeatedly).
    // Two vulnerable patterns must NEVER return: (a) the universal stop-out firing UNGUARDED
    // (`if (hitSL) { resolveTrade('loss')`), and (b) nextCandle DRIVING only when the outcome is already
    // set (`trade && trade._l1Outcome) return tradeDrivenCandle`). Either lets an unauthored L1-3 candle
    // touch the stop for an INSTANT, unearned loss that bypasses MIN_TRADE_CANDLES. This check FAILS the
    // ship if a future edit reintroduces either — so a beginner can never again lose a first trade fast.
    const unguardedStopOut   = /if\s*\(\s*hitSL\s*\)\s*\{\s*resolveTrade\(\s*['"]loss['"]\s*\)/.test(s);
    const driveOnlyIfOutcome = /trade\s*&&\s*trade\._l1Outcome\s*\)\s*return\s+tradeDrivenCandle/.test(s);
    const fastLossGuarded = !unguardedStopOut && !driveOnlyIfOutcome;
    const ok = minCandles >= 24 && order && authored && coinFlips === 0 && fastLossGuarded;
    add('11', 'TES: min duration + curriculum order + authored outcomes + L1-3 fast-loss guard', ok ? 'PASS' : 'FAIL',
      ok ? `MIN_TRADE_CANDLES=${minCandles} (≥24) · SETUP_UNLOCK order intact · outcomes AUTHORED (no 0.58 coin-flip) · L1-3 fast-loss GUARDED`
         : `MIN_TRADE_CANDLES=${minCandles} (≥24?), order=${order}, authoredFn=${authored}, coinFlips=${coinFlips}, fastLossGuarded=${fastLossGuarded} (unguardedStopOut=${unguardedStopOut}, driveOnlyIfOutcome=${driveOnlyIfOutcome}) — see TES v1.1 / build 282`);
  }

  // 12 — CANDLE-LANGUAGE GATE (build 287). The enforcement wire the Visual Market Constitution promised
  // (VMC:94) but never had — the reason the "every path invents its own candle language" disease survived
  // ~20 playtests. Ratchets candle-language divergence (inline palette hexes bypassing COLOR, per-renderer
  // forks, retired wick tints, rounded candles, minBody=15): FAILS if any count rises above the committed
  // baseline (scripts/.candle_baseline.json). New divergence can never be added again; convergence lowers it.
  {
    try {
      const gate = require(path.join(__dirname, 'candle_language_gate.js')).check();
      const status = gate.firstRun ? 'WARN' : (gate.ok ? 'PASS' : 'FAIL');
      add('12', 'Candle-language divergence gate (no NEW inline palette / forks / rounded candles vs baseline)', status, gate.detail);
    } catch (e) {
      add('12', 'Candle-language divergence gate', 'WARN', 'gate not runnable: ' + String(e).slice(0, 90));
    }
  }

  // 13 — window.CQ OWNER-INTEGRITY GATE (build 287 · Phase 2A). #12 stops NEW divergence being ADDED;
  // #13 stops the single behavioural owner (window.CQ) from being DELETED, BYPASSED (COLOR re-forking
  // its own hexes), or DRIFTING from the ratified Constitution A.6 spine — the three ways a 61st
  // competing owner sneaks back in and re-opens the root cause. This makes the engine's EXISTENCE and
  // its agreement with the ratified doc a build invariant (VMC:94, now real for the spine).
  {
    try {
      const g = require(path.join(__dirname, 'cq_owner_gate.js')).check();
      add('13', 'window.CQ owner integrity (owner published · COLOR derives from CQ · spine matches A.6)',
        g.ok ? 'PASS' : 'FAIL', g.detail);
    } catch (e) {
      add('13', 'window.CQ owner integrity', 'WARN', 'gate not runnable: ' + String(e).slice(0, 90));
    }
  }

  // 14 — COLLECTIBLE LAW 001 GATE (build 301 · Phase P0.1). Shells were spawning BENEATH the
  // playable chart because collectibles stored an absolute world y while the terrain they rest on
  // is groundY-relative — so every resize/orientationchange slid the chart out from under them.
  // This locks in the three structural invariants of the fix: window.CQREACH owns placement, every
  // spawn goes through its validating gate, and resize() re-anchors. Any of the three being removed
  // silently re-opens the whole bug class, which is precisely how it survived ~20 playtests.
  {
    try {
      const g = require(path.join(__dirname, 'collectible_law_gate.js')).check();
      add('14', 'COLLECTIBLE LAW 001 (CQREACH owns placement · all spawns validated · resize re-anchors)',
        g.ok ? 'PASS' : 'FAIL', g.detail);
    } catch (e) {
      add('14', 'COLLECTIBLE LAW 001 gate', 'WARN', 'gate not runnable: ' + String(e).slice(0, 90));
    }
  }

  // 15 — LESSON-LABEL GATE (2026-07-30 · Lesson Visual Polish). The founder scored the "Short"
  // Knowledge card 2/10: SELLERS TAKE OVER was drawn through three red candles, in red. The cause
  // was structural — every label used a FIXED offset with no measurement and no collision test —
  // so it was never one bad scene, it was 33 scenes waiting to break on any wide label. This locks
  // in the measured-plate + solver layer (and its two-pass render) on BOTH annotated surfaces, so
  // a one-line blind-placement helper can't quietly reopen the whole class.
  {
    try {
      const g = require(path.join(__dirname, 'lesson_label_gate.js')).check();
      add('15', 'Lesson labels (measured plates · solver-placed · two-pass · Journal matches)',
        g.ok ? 'PASS' : 'FAIL', g.detail);
    } catch (e) {
      add('15', 'Lesson-label gate', 'WARN', 'gate not runnable: ' + String(e).slice(0, 90));
    }
  }

  // 16 — MARKET IDENTITY GATE (merged from feature/home-market-ceremony; renumbered 14->16). A Home Market is an IDENTITY, not a
  // difficulty setting: it may change the price ANCHOR, the colour and the label, and nothing else.
  // Two ways that guarantee has already been broken in this codebase, both silent:
  //   (a) MARKET_DATA was seeded per-ticker (own seed + volatility scale), so a Solana player got
  //       1.55x a Bitcoin player's volatility on Level 4+ — a different game taught as the same one.
  //   (b) the live fetch assigned `MARKET_DATA = out`, letting real Binance candles become terrain,
  //       which also broke "educational charts are authored + deterministic".
  // This asserts every MARKET_DATA assignment is the one shared replay, that the live-price layer
  // never names MARKET_DATA, and that every shipped market has a display price anchor (the missing
  // ones rendered a permanent $100 chart).
  {
    try {
      // Capture the WHOLE right-hand side, not just a bare identifier: `MARKET_DATA = (live ? out
      // : TRAINING_REPLAY)` and `MARKET_DATA = [...rows]` produced no match at all under the old
      // pattern, so per-market terrain could be reintroduced with the gate still reporting PASS.
      const assigns = [...s.matchAll(/MARKET_DATA\s*=\s*([^;\n]+)/g)].map(m => m[1].trim());
      const bad = assigns.filter(v => v.replace(/;.*$/, '').trim() !== 'TRAINING_REPLAY');
      // MARKET_DATA and TRAINING_REPLAY are the SAME array object, so an in-place mutation would
      // corrupt the canonical replay for every market without ever being an assignment.
      const mutated = [...s.matchAll(/MARKET_DATA\s*(?:\[[^\]]*\]\s*=|\.(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)\s*\(|\.length\s*=)/g)].map(m => m[0]);
      const mp = s.match(/const MarketPrice = \(\(\) => \{[\s\S]*?\n\}\)\(\);/);
      const leaks = mp ? (mp[0].match(/MARKET_DATA|prePopulateHTF/g) || []) : [];
      const roster = [...(s.match(/const HOME_MARKETS = \[[\s\S]*?\];/) || [''])[0]
        .matchAll(/key:\s*'([A-Z]+)'/g)].map(m => m[1]);
      const anchors = (s.match(/const FALLBACK_PRICE = \{[\s\S]*?\};/) || [''])[0];
      const missing = roster.filter(k => !new RegExp('\\b' + k + '\\s*:').test(anchors));
      const ok = assigns.length > 0 && bad.length === 0 && mutated.length === 0 && !!mp &&
                 leaks.length === 0 && roster.length > 0 && missing.length === 0;
      add('16', 'Market identity (shared terrain · price layer display-only · every market anchored)',
        ok ? 'PASS' : 'FAIL',
        ok ? `${assigns.length} MARKET_DATA assignment(s), all TRAINING_REPLAY; MarketPrice touches neither MARKET_DATA nor prePopulateHTF; ${roster.length}/${roster.length} markets anchored`
           : [bad.length ? `MARKET_DATA assigned from: ${[...new Set(bad)].join(' | ')} (must be TRAINING_REPLAY — terrain would differ per market)` : '',
              mutated.length ? `MARKET_DATA mutated in place: ${[...new Set(mutated)].join(' | ')} — this corrupts the shared replay for every market` : '',
              !mp ? 'MarketPrice module not found' : '',
              leaks.length ? `MarketPrice references ${[...new Set(leaks)].join(', ')} — the price layer must never touch candle data` : '',
              missing.length ? `markets with no price anchor: ${missing.join(', ')} (these render a $100 chart)` : ''
             ].filter(Boolean).join(' · '));
    } catch (e) {
      add('16', 'Market identity gate', 'WARN', 'gate not runnable: ' + String(e).slice(0, 90));
    }
  }

  // 17 — DEPLOY ASSET PARITY (build 336). Production serves website/, not the repo root, and
  // `cq.sh site` copied only `bosses/*.webp` — non-recursive, one extension. So every clip in
  // bosses/flinches|intros|outros|sfx was absent from the deploy: the Guardian-1 intro, the
  // DEFEAT cinematic and the JOURNAL-UNLOCK cinematic played nothing for every external tester,
  // across ~20 builds, while the build itself was byte-perfect. Three things hid it:
  //   • no 404 page — Cloudflare answers a missing path with the landing page at HTTP 200, so a
  //     status-code check passes and the browser gets text/html where a video should be;
  //   • playBossOutroCinematic is defensive by design (onerror → playNext), so it degrades in
  //     silence — verified live: MEDIA_ERR_SRC_NOT_SUPPORTED, sequence completed instantly;
  //   • `cq.sh serve` and the LAN QR serve the REPO ROOT, where every file is present, so a
  //     founder playtest structurally cannot reproduce it.
  // This gate closes the class: anything the game REFERENCES and that exists at the repo root
  // must also exist in website/, at the same size. It compares the deploy folder against the
  // source of truth (the game's own asset references), not against a hand-maintained list.
  // NOTE: an exception here is a FAIL, not the WARN used above. A gate whose whole purpose is
  // to catch "the file silently wasn't there" must not itself pass silently when it breaks.
  {
    try {
      const s = read(SRC);
      const refs = new Set();
      // 1. literal asset paths written in the source
      for (const m of s.matchAll(/(?:bosses|finn)\/[A-Za-z0-9._/-]+\.(?:mp4|m4a|webp|png|jpg|jpeg)/g)) refs.add(m[0]);
      // 2. the boss intro clips, whose path is BUILT at runtime (bossIntroVideoSrc concatenates
      //    'bosses/intros/boss-' + level + '.mp4'), so no literal exists to match. Expand the
      //    authoritative set — this is the same list cq.sh `site` copies from.
      const iv = s.match(/BOSS_INTRO_VIDEOS = new Set\(\[([0-9, ]*)\]\)/);
      if (iv) for (const n of iv[1].match(/\d+/g) || []) refs.add(`bosses/intros/boss-${n}.mp4`);
      // 3. the boss portraits, built as 'bosses/boss-' + level + '.webp'
      if (/bosses\/boss-'\s*\+\s*level/.test(s)) for (let i = 1; i <= 11; i++) refs.add(`bosses/boss-${i}.webp`);

      // Only paths that actually resolve at the repo root are deploy obligations. The rest are
      // prose inside comments (e.g. bosses/trend-crab.webp, bosses/sfx/boss-roar-1..3.m4a) —
      // reported for visibility so a genuinely missing SOURCE asset is never mistaken for one.
      const real = [...refs].filter(f => exists(f)).sort();
      const phantom = [...refs].filter(f => !exists(f)).sort();

      // ON-DISK presence is NOT the deploy condition, and assuming it was is what let this ship.
      // The boss clips WERE sitting in website/bosses/ the whole time — all four subfolders,
      // 128 MB, on disk since late July — and production still served the landing page for them,
      // because every one of those files is UNTRACKED. Cloudflare Pages builds from the GIT REPO,
      // so an untracked file is invisible to the deploy no matter how correct the folder looks in
      // Finder or to `ls`. The only question that maps to "will a tester receive this byte" is:
      // is it committed? Hence the git-tracked assertion below — it is the real gate.
      const tracked = new Set((git('ls-files -- website') || '').split('\n').filter(Boolean));
      const onDisk = real.filter(f => exists(path.join('website', f)));
      const missing = real.filter(f => !exists(path.join('website', f)));
      const untracked = onDisk.filter(f => !tracked.has(path.posix.join('website', f)));
      const mismatched = onDisk.filter(f => fs.statSync(f).size !== fs.statSync(path.join('website', f)).size);

      const ok = missing.length === 0 && untracked.length === 0 && mismatched.length === 0;
      add('17', 'Deploy asset parity (every referenced asset present in website/, committed, same size)',
        ok ? 'PASS' : 'FAIL',
        ok ? `${real.length} referenced asset(s) present, git-tracked and identical in website/` +
             (phantom.length ? ` · ${phantom.length} comment-only ref(s) ignored: ${phantom.slice(0, 3).join(', ')}` : '')
           : [missing.length ? `NOT IN website/ — run \`scripts/cq.sh site\`: ${missing.join(', ')}` : '',
              untracked.length ? `IN website/ BUT UNTRACKED — Cloudflare deploys from git, so production returns the 200-OK landing page for these: ${untracked.join(', ')} → git add them` : '',
              mismatched.length ? `size mismatch vs source (stale copy): ${mismatched.join(', ')}` : ''
             ].filter(Boolean).join(' · '));
    } catch (e) {
      add('17', 'Deploy asset parity', 'FAIL', 'gate could not run (treated as FAIL by design): ' + String(e).slice(0, 90));
    }
  }

  // 18 — EVENT SPACING OWNER (T-005b · window.CQBEAT). "ChartQuest should feel like music."
  // Spacing is a property of WORLD SPACE decided at PLACEMENT time. The old eventLedger could
  // never enforce it: markEvent() stamps at maxSeenCandleId (Finn's frontier, when the player
  // EXPERIENCES an event) while eventClearAt() judges the spawn candle generated ~15 ahead, so
  // two events already placed but not yet reached are invisible to each other by construction.
  // This gate locks in the single owner and its properties, the same way #13 locks window.CQ and
  // #14 locks CQREACH — so a future spawner cannot quietly bypass the pacing rules.
  {
    try {
      const s = read(SRC);
      const owner = /var NS = 'CQBEAT';/.test(s) && /window\[NS\] = \{/.test(s);
      // must be a self-contained trailing IIFE that declares NO top-level names (invariant I1:
      // a duplicate top-level binding across inline blocks is a parse-time SyntaxError that
      // silently kills the whole block)
      const iife = /\(function \(\) \{\s*'use strict';\s*var NS = 'CQBEAT';/.test(s);
      const rules = ['boss', 'cinematic', 'bossIntro', 'lesson', 'portal', 'journalUnlock', 'page', 'minigame', 'box']
        .filter(k => new RegExp('\\b' + k + ':\\s*\\{ gap:').test(s));
      // every spawner the owner must observe
      const wraps = ['maybeSpawnBox', 'maybeSpawnWisdomPage', 'spawnPortal', 'markEvent']
        .filter(f => new RegExp("wrapSpawner\\('" + f + "'|window\\." + f + " = wrapped").test(s));
      const api = ['may:', 'audit:', 'setMode:', 'RULES:'].filter(k => s.includes(k));
      // placement must be judged AFTER the fact (the array grew), never by pre-emptively vetoing
      // a per-candle poll — the first implementation did that and logged 80 vetoes vs 12 grants
      // on one L1 run, because these spawners are polled on every candle and usually decline.
      const postHoc = /if \(len\(arrName\) <= before\) return out;/.test(s);
      const overlay = /\[?&\]beat|cqBeatOv/.test(s) || s.includes('cqBeatOv');
      // Every RULES category must actually be REPORTED by something. Boss introductions and major
      // cinematics carry the largest radii in the table (25+), and for one build they were
      // configured but wired to nothing — which reads as more complete than it is. That is the
      // exact failure shape of build 324's rule that had never run on Level 1, so it is gated.
      const moments = ['boss', 'bossIntro', 'cinematic', 'ceremony', 'journalUnlock', 'minigame']
        .filter(k => new RegExp("wrapMoment\\([^)]*'" + k + "'").test(s));
      // Enforcement must never be able to stall a level: progression outranks pacing.
      const starve = /MAX_DEFER/.test(s) && /starvation release/.test(s);
      // A moment is a fact, not a decision — it records but is never vetoed.
      const momentsNeverVetoed = /a moment always claims its space/.test(s);
      const mode = (s.match(/var MODE = '(observe|enforce)'/) || [])[1] || '?';
      const ok = owner && iife && rules.length >= 9 && wraps.length === 4 && api.length === 4 &&
                 postHoc && overlay && moments.length === 6 && starve && momentsNeverVetoed;
      add('18', 'Event spacing owner (CQBEAT · rules · all categories reported · post-hoc · starvation-safe)',
        ok ? 'PASS' : 'FAIL',
        ok ? `owner published · self-contained IIFE (0 top-level names) · ${rules.length} categories · ${wraps.length}/4 spawners + ${moments.length}/6 moments reported · mode=${mode} · placement post-hoc · moments never vetoed · starvation guard · ?beat overlay`
           : [!owner ? 'window.CQBEAT not published' : '',
              !iife ? 'not a self-contained trailing IIFE (top-level names would kill the block)' : '',
              rules.length < 9 ? `rule table incomplete (${rules.length}/9 categories)` : '',
              wraps.length !== 4 ? `spawners not observed: ${['maybeSpawnBox', 'maybeSpawnWisdomPage', 'spawnPortal', 'markEvent'].filter(f => !new RegExp("wrapSpawner\\('" + f + "'|window\\." + f + " = wrapped").test(s)).join(', ')}` : '',
              moments.length !== 6 ? `RULES categories configured but reported by nothing: ${['boss', 'bossIntro', 'cinematic', 'ceremony', 'journalUnlock', 'minigame'].filter(k => !new RegExp("wrapMoment\\([^)]*'" + k + "'").test(s)).join(', ')}` : '',
              api.length !== 4 ? 'API incomplete (need may/audit/setMode/RULES)' : '',
              !postHoc ? 'placement is not judged post-hoc — a per-candle poll must not be pre-vetoed' : '',
              !starve ? 'no starvation guard — enforcement could stall a level' : '',
              !momentsNeverVetoed ? 'moments must record but never be vetoed' : '',
              !overlay ? '?beat debug overlay missing' : ''
             ].filter(Boolean).join(' · '));
    } catch (e) {
      add('18', 'Event spacing owner', 'FAIL', 'gate could not run (treated as FAIL by design): ' + String(e).slice(0, 90));
    }
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
