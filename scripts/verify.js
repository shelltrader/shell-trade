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
 *   8  All three canonical game artifacts are byte-identical
 *   9  No large binaries added (>5MB, non-ignored)
 *   10 Protected systems unchanged vs HEAD  (override: CQ_ALLOW_PROTECTED=1 when a
 *      protected change was explicitly approved)
 *   22 Build-363 viewport safety + CQSAFE/RC invariants (behavioural owner tests and source contracts)
 *   23 Build-363 local browser harness safety/syntax/self-test
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const SRC = 'chart-quest.html';

const R = [];
const add = (id, name, status, detail) => R.push({ id, name, status, detail: detail || '' });
const read = f => fs.readFileSync(f, 'utf8');
const exists = f => { try { fs.accessSync(f); return true; } catch { return false; } };
const sizeMB = f => fs.statSync(f).size / (1024 * 1024);
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

  // 3c — STANDALONE JS PARSES. Same family as 3a (inline blocks) and 3b (headless boot); the
  // piece that was missing. Nothing in this repo ever parsed a .js file that is not inside
  // chart-quest.html, and it cost three builds: `website/sw.js` shipped as a JavaScript
  // SyntaxError from build 332 to 335 — a comment appended after its closing delimiter — so the
  // service worker never registered at all. No precache, no offline page, a console error on
  // every load, and every gate green the whole time.
  //
  // Scope is TRACKED files only, deliberately: Cloudflare Pages builds from the git repo, so an
  // untracked .js cannot reach production and is not this gate's business (the same reasoning
  // gate #17 applies to assets). Five roots — the ones that ship, that gate, or that the
  // founder relies on:
  //   sw.js, website/**  → deployed
  //   ops/**             → canonical source spliced into the game
  //   scripts/**         → the gates themselves. A broken gate script currently degrades to
  //                        "WARN: gate not runnable", which passes a ship; this makes it FAIL.
  //   beta-qa/**         → the Beta Test QA dashboard engines. Not deployed, but they are the
  //                        only reading the founder has of where testers drop out, and they
  //                        fail exactly like sw.js did: beta-qa.html loads them with <script
  //                        src>, so a SyntaxError blanks a panel and logs to a console nobody
  //                        has open. Same bug class, same gate.
  {
    try {
      const syn = require(path.join(__dirname, 'check_syntax.js'));
      const targets = (git("ls-files -- '*.js'") || '').split('\n')
        .filter(Boolean)
        .filter(f => /^(sw\.js|website\/|ops\/|scripts\/|beta-qa\/)/.test(f))
        .filter(f => !/node_modules|\.min\.js$/.test(f))
        .filter(exists);
      const bad = [];
      for (const f of targets) {
        const r = syn.checkFile(f);
        if (!r.ok) bad.push(syn.summary(r));   // carries file:line + the error sentence
      }
      add('3c', 'Standalone JS parses (sw.js, website/, ops/, scripts/, beta-qa/)', bad.length ? 'FAIL' : 'PASS',
        bad.length ? bad.join(' · ') : `${targets.length} tracked standalone .js file(s) parse clean`);
    } catch (e) {
      // FAIL, never WARN — see 3a.
      add('3c', 'Standalone JS parses', 'FAIL',
        'checker could not run: ' + String(e && e.message || e).slice(0, 110));
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

  // 8 — canonical game artifact parity
  {
    try {
      const parity = require(path.join(__dirname, 'artifact_parity.js')).checkArtifactParity(ROOT);
      add('8', 'Game artifacts byte-identical (source, root mirror, site)',
        parity.ok ? 'PASS' : 'FAIL', parity.detail);
    } catch (e) {
      add('8', 'Game artifacts byte-identical (source, root mirror, site)', 'FAIL',
        'artifact parity checker could not run: ' + String(e && e.message || e).slice(0, 110));
    }
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

  // 19 — OPERATIONAL FOUNDATION (build 340 · window.CQOPS). Same job as #13 for window.CQ and
  // #14 for CQREACH: lock the OWNER so a future change cannot quietly delete it, fork it, or
  // let the inlined copy drift from its canonical source.
  //
  // Four invariants, each earned from a real incident in this repo:
  //   • PUBLISHED + SELF-CONTAINED — one IIFE, zero top-level names. A duplicate top-level
  //     const across inline blocks is a parse-time SyntaxError that silently kills a whole
  //     block; this one is in <head>, so that would be a white screen, not a missing feature.
  //   • NO DRIFT — the game inlines ops/cq-ops.js because a single self-contained document
  //     cannot <script src> it. Two copies drift. CQTrack has exactly the same shape, and its
  //     drift check had never been wired into anything; gate #20 below now closes that too.
  //   • STAMPED — CQOPS.build reads <meta name="cq-build">. `cq.sh ship` writes it BEFORE the
  //     mirror is taken; if it were written after, index.html and website/game.html would ship
  //     the previous commit and every deploy would report the wrong source.
  //   • FLAGS DEFAULT TO SHIPPED BEHAVIOUR — Phase 1 promised no player-facing change. A
  //     product flag defaulting to false breaks that promise the moment it is wired, and the
  //     break would look like a gameplay bug, not a config one.
  {
    try {
      const s = read(SRC);
      const canon = 'ops/cq-ops.js';
      const owner = /window\.CQOPS = API;/.test(s) && /if \(window\.CQOPS\) return;/.test(s);
      const iife  = /\(function \(\) \{\s*'use strict';\s*if \(window\.CQOPS\) return;/.test(s);
      // the seven public seams, as they appear on the frozen API object literal
      const api   = ['env:', 'build:', 'log:', 'err:', 'flags:', 'health:', 'report:']
        .filter(k => s.includes('\n    ' + k));
      // the inlined copy must equal the canonical source, byte for byte
      let synced = false, syncNote = 'canonical source missing';
      if (exists(canon)) {
        const js = read(canon).replace(/\s+$/, '');
        const i = s.indexOf('<!-- CQOPS:BEGIN');
        const j = s.indexOf('<!-- CQOPS:END -->');
        if (i > -1 && j > i) {
          const inlined = s.slice(s.indexOf('<script>', i) + 9, s.lastIndexOf('</script>', j)).replace(/\s+$/, '');
          synced = inlined === js;
          syncNote = synced ? '' : 'inlined copy has DRIFTED — run: python3 scripts/sync_ops.py';
        } else syncNote = 'no CQOPS block in the game — run: python3 scripts/sync_ops.py';
      }
      // the deploy stamp must be present, and must match in the mirror (mirror is checked by #8)
      const stamp = /<meta name="cq-build" content="([^"]+)" data-built-at="([^"]*)">/.exec(s);
      const stamped = !!(stamp && stamp[1] && stamp[1] !== 'unstamped' && stamp[2]);
      // every declared product flag must default to today's shipped behaviour
      const PRODUCT_ON = ['enableJournalDiscovery', 'enableBossCinematics', 'enableBetaSurvey', 'enableAnalytics'];
      const badDefault = PRODUCT_ON.filter(f => !new RegExp(f + ':\\s*true').test(s));
      // the passive collectors that make missing assets / failed APIs visible at all
      const observers = [/addEventListener\('error', function \(e\) \{[\s\S]{0,400}?missing_asset/, /window\.fetch = wrapped;/]
        .filter(re => re.test(s)).length;
      // the fetch observer must supply BOTH promise handlers, or it manufactures the very
      // unhandledrejection it exists to count
      const bothHandlers = /p\.then\(function \(res\) \{[\s\S]{0,600}?\}, function \(e\) \{/.test(s);

      const ok = owner && iife && api.length === 7 && synced && stamped && !badDefault.length && observers === 2 && bothHandlers;
      add('19', 'Operational foundation (CQOPS published · in sync · stamped · flags default-safe)',
        ok ? 'PASS' : 'FAIL',
        ok ? `window.CQOPS published · self-contained IIFE (0 top-level names) · in sync with ${canon} · stamped ${stamp[1]} @ ${stamp[2]} · 7/7 seams (env/build/log/err/flags/health/report) · 4/4 product flags default ON · 2/2 passive observers · fetch observer handles both outcomes`
           : [!owner ? 'window.CQOPS not published' : '',
              !iife ? 'not a self-contained IIFE (top-level names in <head> would white-screen the game)' : '',
              api.length !== 7 ? `public seam incomplete (${api.length}/7 — need env/build/log/err/flags/health/report)` : '',
              !synced ? syncNote : '',
              !stamped ? 'deploy stamp missing or unstamped — run: scripts/cq.sh ops' : '',
              badDefault.length ? `product flag(s) no longer default to shipped behaviour: ${badDefault.join(', ')}` : '',
              observers !== 2 ? `passive observers missing (${observers}/2 — missing-asset capture and/or fetch observer)` : '',
              !bothHandlers ? 'fetch observer does not supply both promise handlers — it would create unhandled rejections' : ''
             ].filter(Boolean).join(' · '));
    } catch (e) {
      add('19', 'Operational foundation', 'FAIL', 'gate could not run (treated as FAIL by design): ' + String(e).slice(0, 90));
    }
  }

  // 20 — CQTrack SOURCE-OF-TRUTH DRIFT GATE. The same failure class #19 closes for window.CQOPS,
  // and the one #19's own comment flagged as STILL OPEN: scripts/sync_track.py documents its
  // `--check` as being "for the ship gate", but nothing had ever called it — not cq.sh, not this
  // file. A drift detector that no gate runs is a comment, not a guarantee.
  //
  // window.CQTrack (the closed-beta analytics client) has to exist TWICE, because the game is one
  // self-contained document that cannot <script src> a sibling file:
  //   • website/assets/cq-track.js — the canonical source. website/index.html, play.html and
  //     survey.html load it with a real <script src>, and sw.js precaches it.
  //   • the copy inlined into chart-quest.html between CQTRACK:BEGIN / CQTRACK:END.
  // Drift between them is uniquely nasty because it CORRUPTS THE EVIDENCE rather than breaking
  // the product: the game and the site would emit the same event names from two different
  // clients, so the Founder Report funnel would silently be comparing two instrumentations and
  // would read as a change in player behaviour. Nothing on screen looks wrong. That is exactly
  // why this needs a build invariant and not a habit.
  //
  // Three distinct failure shapes, deliberately reported apart — they have different fixes:
  //   • DRIFTED — the two copies disagree. Fix: re-run the splice.
  //   • MARKER ALTERED / DUPLICATED — sync_track.py locates the block by its EXACT begin marker,
  //     so a hand-edited marker makes the script think there is no block and INSERT A SECOND ONE.
  //     Two CQTrack copies in one document is a worse state than drift, and "just run the fix
  //     command" is the wrong advice there — so the gate says so instead.
  //   • LITERAL </script> IN THE SOURCE — sync_track.py refuses to write this (it would terminate
  //     the block early and truncate the whole game). The gate must refuse to PASS it too, or a
  //     hand-edited block could ship the state the tool exists to prevent.
  {
    try {
      const canon = 'website/assets/cq-track.js';
      // the exact marker sync_track.py matches on — not a loose prefix, see MARKER ALTERED above
      const BEGIN = '/* CQTRACK:BEGIN — generated from website/assets/cq-track.js by scripts/sync_track.py — DO NOT EDIT HERE */';
      const END = '/* CQTRACK:END */';
      let ok = false, note = '', size = 0;
      if (!exists(canon)) {
        note = `canonical source missing: ${canon} — the game's inlined copy has nothing to be checked against`;
      } else {
        const js = read(canon).replace(/\s+$/, '');
        const i = s.indexOf(BEGIN), j = s.indexOf(END, i + 1);
        const loose = count(s, /CQTRACK:BEGIN/g);
        if (loose > 1) {
          note = `${loose} CQTRACK:BEGIN markers in ${SRC} — the block has been duplicated; delete the extras, do NOT re-run the splice`;
        } else if (i < 0 && loose === 1) {
          note = `the CQTRACK:BEGIN marker text has been ALTERED — restore it verbatim first; scripts/sync_track.py would not recognise it and would insert a SECOND copy`;
        } else if (i < 0 || j < i) {
          note = `no CQTrack block in ${SRC} — run: python3 scripts/sync_track.py`;
        } else if (/<\/script>/i.test(js)) {
          note = `${canon} contains a literal </script> — it would end the inlined block early and truncate the game (sync_track.py refuses to write this)`;
        } else {
          // the inlined JS is everything between the end of the BEGIN marker line and the END
          // marker — byte for byte what sync_track.py writes there (the source, rstripped).
          const inlined = s.slice(s.indexOf('\n', i) + 1, j).replace(/\s+$/, '');
          ok = inlined === js;
          size = js.length;
          note = ok ? '' : `inlined CQTrack has DRIFTED from ${canon} (inlined ${inlined.length}B vs canonical ${js.length}B) — run: python3 scripts/sync_track.py`;
        }
      }
      add('20', 'CQTrack in sync (inlined copy == website/assets/cq-track.js)',
        ok ? 'PASS' : 'FAIL',
        ok ? `inlined copy byte-identical to ${canon} (${size}B) · single intact marker pair · no literal </script>`
           : note);
    } catch (e) {
      add('20', 'CQTrack in sync', 'FAIL', 'gate could not run (treated as FAIL by design): ' + String(e).slice(0, 90));
    }
  }

  // 21 — DEPLOY SECURITY HEADERS. The gate this project did not have when it needed it: for the
  // whole closed beta, playchartquest.com sent no CSP, no HSTS and no X-Frame-Options, because
  // `_headers` sat at the REPO ROOT while Cloudflare Pages reads it from its BUILD OUTPUT
  // DIRECTORY, which is website/. Nothing local could see it — a dev server sends no CSP at all,
  // so every gate stayed green. Same bug class as #17 (assets present but untracked) and the boss
  // cinematics that 404'd for ~20 builds: a correct file that never reaches production because of
  // WHERE IT SITS relative to what is served.
  //
  // WHAT THIS GATE CAN AND CANNOT DO — read this before trusting it.
  // It proves the policy EXISTS, SHIPS, and covers every origin discoverable in the source. It
  // CANNOT prove the policy is complete, and pretending otherwise would rebuild the exact trap it
  // exists to close. Of the four real defects found on 2026-08-05:
  //   • static.cloudflareinsights.com is injected by Cloudflare AT THE EDGE and appears in no
  //     file at all. NOTHING that reads this repository can ever find it.
  //   • fonts.gstatic.com is only half-visible: index.html and survey.html <link preconnect> it,
  //     so this gate does catch it — but game.html never names it, because the Google Fonts
  //     STYLESHEET is what requests the font files. Had the marketing pages not happened to
  //     preconnect, source analysis would have missed it entirely.
  // Treat coverage here as a floor, never a proof. After ANY policy change, ship it as
  // Content-Security-Policy-Report-Only, walk
  // landing → play → game → survey with the console open, and only then re-enforce. This gate
  // WARNs while Report-Only is in force so that state is visible but never blocks the workflow.
  {
    try {
      const F = 'website/_headers';
      const fails = [], warns = [];

      if (!exists(F)) {
        add('21', 'Deploy security headers', 'FAIL',
          `${F} MISSING — Cloudflare reads _headers from website/, so production would send no CSP/HSTS/X-Frame-Options at all`);
      } else {
        const h = read(F);
        // Cloudflare builds from git: a file present but untracked never reaches production.
        const tracked = (git('ls-files -- ' + F) || '').trim() === F;
        if (!tracked) fails.push(`${F} is NOT git-tracked — Cloudflare deploys from git, so it would never ship (git add it)`);

        // the CSP DIRECTIVE line, never the file's prose — the comments name origins too
        const cspLine = /^\s*Content-Security-Policy(-Report-Only)?:\s*(.+)$/m.exec(h);
        if (!cspLine) fails.push('no Content-Security-Policy directive');
        else if (cspLine[1]) warns.push('CSP is REPORT-ONLY — reporting, not blocking; re-enforce once a live round is clean');
        const csp = cspLine ? cspLine[2] : '';

        for (const need of ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy',
                            'Permissions-Policy', 'Strict-Transport-Security'])
          if (!new RegExp('^\\s*' + need + ':', 'mi').test(h)) fails.push(`missing header: ${need}`);

        // IFRAME INVARIANT. play.html embeds the game in a SAME-ORIGIN iframe, so a DENY /
        // frame-ancestors 'none' policy renders a blank frame for every player. The root
        // _headers declared exactly that for months; it was only never applied.
        const served = (git("ls-files -- 'website/*.html' 'website/**/*.html'") || '').split('\n').filter(Boolean);
        const framed = served.filter(f => exists(f) && /<iframe/i.test(read(f)));
        if (framed.length) {
          if (/frame-ancestors\s+'none'/i.test(csp))
            fails.push(`frame-ancestors 'none' but ${framed[0]} embeds an iframe — use 'self'`);
          if (/^\s*X-Frame-Options:\s*DENY/mi.test(h))
            fails.push(`X-Frame-Options DENY but ${framed[0]} embeds an iframe — DENY blocks same-origin framing too; use SAMEORIGIN`);
        }

        // ORIGIN COVERAGE, source-derived. Non-fetch references are ignored BY NAME with a
        // reason, so the ignore list can never quietly grow into "allow everything".
        const IGNORE = {
          'playchartquest.com':     "the site's own origin — covered by 'self'",
          'www.playchartquest.com': "the site's own origin — covered by 'self'",
          'www.tradingview.com':    'an attribution <a href> in index.html — a link is not a fetch',
          'www.apache.org':         'a licence URL inside a comment in assets/lightweight-charts…js',
          'www.w3.org':             'SVG/XML namespace URIs — never fetched'
        };
        const allow = (csp.match(/https?:\/\/[^\s;'"]+/g) || []).map(u => u.replace(/^https?:\/\//, ''));
        const covers = host => allow.some(a =>
          a === host || (a.startsWith('*.') && (host === a.slice(2) || host.endsWith(a.slice(1)))));

        const srcFiles = (git("ls-files -- 'website/*.html' 'website/**/*.html' 'website/*.js' 'website/**/*.js'") || '')
          .split('\n').filter(Boolean).filter(exists);
        const refs = new Set();
        for (const f of srcFiles)
          for (const m of read(f).match(/https:\/\/[a-zA-Z0-9.*-]+\.[a-z]{2,}/g) || [])
            refs.add(m.replace('https://', ''));
        const uncovered = [...refs].filter(hst => !IGNORE[hst] && !covers(hst));
        if (uncovered.length)
          fails.push(`origin(s) referenced by served files but absent from the CSP: ${uncovered.join(', ')} — add them, or add an IGNORE entry saying why they are never fetched`);

        // The root _headers and netlify.toml are NOT served, but the served file's own rule is to
        // keep them in step, so that pointing the output directory at the root cannot silently
        // regress the policy back to the version with the two bugs in it.
        const norm = v => v.replace(/\s+/g, ' ').trim();
        const rootLine = exists('_headers') ? /^\s*Content-Security-Policy(-Report-Only)?:\s*(.+)$/m.exec(read('_headers')) : null;
        if (rootLine && csp && norm(rootLine[2]) !== norm(csp))
          fails.push('repo-root _headers CSP has drifted from website/_headers — keep them in step (only the website/ copy ships)');

        const nOrigins = [...refs].filter(hst => !IGNORE[hst]).length;
        add('21', 'Deploy security headers (website/_headers ships · CSP covers every source origin)',
          fails.length ? 'FAIL' : (warns.length ? 'WARN' : 'PASS'),
          fails.length ? fails.join(' · ')
            : `${F} tracked & shipping · CSP + 5 headers present · ${nOrigins} source origin(s) all allowlisted · iframe-safe (${framed.length} framed page) · root copy in step` +
              (warns.length ? ' · ' + warns.join(' · ') : '') +
              ' · NOTE: source analysis cannot see edge-injected or stylesheet-chained origins — verify a policy change live under Report-Only');
      }
    } catch (e) {
      add('21', 'Deploy security headers', 'FAIL', 'gate could not run (treated as FAIL by design): ' + String(e).slice(0, 90));
    }
  }

  // 22 — BUILD-363 VIEWPORT SAFETY + CQSAFE/RC INVARIANTS. The viewport, safe-area and post-trade review owners live inside the single-file
  // game, so its focused suite evaluates that exact source block rather than a duplicate module.
  // It also locks the four collision integrations and the already-approved manual-close,
  // replay-close, and trade-focus contracts that a static syntax pass cannot distinguish.
  {
    try {
      const suite = require(path.join(__dirname, 'cqsafe.test.js')).runSuite({ report: false });
      const first = suite.failures[0];
      add('22', 'Build-363 viewport safety + CQSAFE/RC invariants', suite.ok ? 'PASS' : 'FAIL',
        suite.ok
          ? suite.detail
          : `${suite.passed}/${suite.total} passed · ${first.name}: ${String(first.error && first.error.message || first.error).slice(0, 120)}`);
    } catch (e) {
      add('22', 'Build-363 viewport safety + CQSAFE/RC invariants', 'FAIL',
        'focused suite could not run: ' + String(e && e.message || e).slice(0, 120));
    }
  }

  // 23 — LOCAL-ONLY BROWSER QA HARNESS. This is intentionally not a headless-browser substitute:
  // it proves the durable harness/server are parseable and retain their loopback, random-port,
  // allowlist, no-store, no-connect and canonical-hash contracts. The in-app Browser still owns
  // the actual 7-flow + 16-cell execution and visible evidence.
  {
    try {
      const server = path.join('scripts', 'beta360_qa_server.py');
      const bridge = path.join('.chartquest', 'qa', 'beta360-bridge.js');
      const harness = path.join('.chartquest', 'qa', 'BETA360_BROWSER_HARNESS.html');
      const checks = [
        [process.execPath, ['--check', bridge], 'bridge syntax'],
        [process.execPath, [path.join('scripts', 'check_syntax.js'), harness], 'harness syntax'],
        ['python3', [server, '--self-test'], 'server/self-test'],
      ];
      const failures = [], detail = [];
      for (const [command, args, label] of checks) {
        const result = cp.spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', timeout: 15000 });
        if (result.status !== 0) failures.push(label + ': ' + String(result.stderr || result.stdout || 'exit ' + result.status).trim().slice(0, 160));
        else detail.push(label + ' PASS');
      }
      add('23', 'Build-363 local browser QA harness', failures.length ? 'FAIL' : 'PASS',
        failures.length ? failures.join(' · ') : detail.join(' · '));
    } catch (e) {
      add('23', 'Build-363 local browser QA harness', 'FAIL',
        'harness checks could not run: ' + String(e && e.message || e).slice(0, 120));
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
