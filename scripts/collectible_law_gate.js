/* ─────────────────────────────────────────────────────────────────────────────
   COLLECTIBLE LAW 001 — REGRESSION GATE                  (build 301 · Phase P0.1)
   scripts/collectible_law_gate.js  ·  wired into scripts/verify.js as check #14

   WHAT THIS PROTECTS
   Shells were spawning beneath the playable chart. The root cause was that
   collectibles stored an ABSOLUTE world y while the terrain they rest on is
   groundY-relative, so every resize/orientationchange silently slid the whole
   chart out from under them. The fix has three moving parts, and this gate exists
   because all three are easy to un-do by accident months from now:

     1. window.CQREACH is the single owner of placement legality.
     2. EVERY collectible spawn goes through CQREACH.place() — a raw
        `coins.push({...})` bypasses validation and re-opens the bug.
     3. resize() re-anchors collectibles after it moves groundY.

   This is a STATIC gate (grep/parse over the HTML). It cannot prove reachability
   at runtime — that is what the ?reach overlay and CQREACH.audit() are for. What
   it CAN do is make the three structural invariants above impossible to remove
   without the build going red, which is exactly the class of regression that let
   this bug live for months.
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'chart-quest.html');

// Strip the giant BUILD_TAG string constant before scanning: it quotes code-like
// prose from previous builds and would otherwise produce phantom matches.
function body(src) {
  return src.replace(/const BUILD_TAG = '[\s\S]*?';/, 'const BUILD_TAG = \'\';');
}

function check() {
  let src;
  try { src = body(fs.readFileSync(SRC, 'utf8')); }
  catch (e) { return { ok: false, detail: 'cannot read ' + SRC }; }

  const fails = [];
  const notes = [];

  // ---- 1. The owner exists and is published -------------------------------
  const hasOwner = /const CQREACH = \(function \(\)/.test(src);
  const published = /window\.CQREACH = CQREACH;/.test(src);
  if (!hasOwner)   fails.push('CQREACH owner module missing');
  if (!published)  fails.push('window.CQREACH not published');

  // ---- 2. No collectible is pushed without validation ----------------------
  // The ONLY legal way in is CQREACH.place(arr, ...). A bare push into a
  // collectible array is the exact bypass that produced the founder's P0.
  // `(?<![.\w])` is load-bearing: it scopes this to the GLOBAL arrays and excludes
  // scene-local worlds such as `S.boxes.push(` in the movement tutorial. Those live in a
  // different coordinate system (their own base / camera / zoom), so pushing them through
  // CQREACH.place() would validate scene coordinates against the main chart's terrain —
  // wrong answer, confidently given. They are checked separately below.
  const SETS = ['coins', 'boxes', 'wisdomPages'];
  for (const set of SETS) {
    const re = new RegExp('(?<!CQREACH\\.place\\()(?<![.\\w])' + set + '\\.push\\s*\\(', 'g');
    const hits = (src.match(re) || []).length;
    if (hits > 0) fails.push(`${hits} un-validated ${set}.push( — must go through CQREACH.place()`);
  }
  const placeCalls = (src.match(/CQREACH\.place\s*\(/g) || []).length;
  if (placeCalls < 7) fails.push(`only ${placeCalls} CQREACH.place() call sites (expected >= 7)`);
  notes.push(`${placeCalls} validated spawn sites`);

  // ---- 3. resize() re-anchors after it moves groundY -----------------------
  // Without this the terrain moves and the collectibles do not — the original bug.
  const resizeFn = src.match(/function resize\s*\(\)\s*\{[\s\S]*?\n\}/);
  if (!resizeFn) {
    fails.push('resize() not found');
  } else {
    const r = resizeFn[0];
    if (!/groundY\s*=/.test(r)) fails.push('resize() no longer assigns groundY — gate needs updating');
    if (!/CQREACH\.reanchor\s*\(/.test(r)) fails.push('resize() does not call CQREACH.reanchor() — collectibles will strand on viewport change');
    // Must use the window handle: a bare `CQREACH` reference here is a temporal
    // dead-zone crash, because the first resize() runs above the const.
    if (/(?<!window\.)\bCQREACH\.reanchor/.test(r)) fails.push('resize() must call window.CQREACH.reanchor() (bare CQREACH is a TDZ crash at first resize)');
  }

  // ---- 4. groundY still has exactly one writer -----------------------------
  // The whole design assumes a single source of truth for the baseline.
  const writers = (src.match(/\bgroundY\s*=(?!=)/g) || []).length;
  if (writers > 2) fails.push(`groundY assigned in ${writers} places (expected 2: declaration + resize)`);

  // ---- 5. Wick growth on LIVE candles goes through setWick -----------------
  // `wick` is the only candle geometry still mutated after pushCandle, and pole
  // shells are anchored to it, so growing it raw strands them mid-shaft.
  // Two regions legitimately write it raw and are excluded by design:
  //   • CQREACH.setWick itself — it IS the owner.
  //   • decorateCandleWicks — it dresses the candle DESCRIPTOR before pushCandle,
  //     so no collectible can be attached to it yet (and its trade-clamp only
  //     ever shrinks a wick that nothing is anchored to).
  // Anything outside those is a live-candle mutation and must use setWick().
  {
    const cut = (fnName) => {
      const m = src.match(new RegExp('function ' + fnName + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
      return m ? m[0] : '';
    };
    const owner = src.match(/setWick:\s*\(c, w\)\s*=>\s*\{[\s\S]*?\n    \},/);
    let scan = src;
    for (const region of [cut('decorateCandleWicks'), owner ? owner[0] : ''])
      if (region) scan = scan.replace(region, '');
    const raw = (scan.match(/(?<!\.)\b(?:c|_pc|last|cc)\.wick2?\s*=(?!=)/g) || []).length;
    if (raw > 0)
      fails.push(`${raw} raw live-candle .wick assignment(s) outside decorateCandleWicks — grow poles via CQREACH.setWick() so pole shells ride with them`);
    if (!owner) fails.push('CQREACH.setWick owner missing — wick growth has no single owner');
    const viaSetWick = (src.match(/CQREACH\.setWick\s*\(/g) || []).length;
    if (viaSetWick < 4) fails.push(`only ${viaSetWick} CQREACH.setWick() call sites (expected >= 4: mega pole + 3 Lost-Wisdom paths)`);
    else notes.push(`${viaSetWick} wick growths owned`);
  }

  // ---- 6. The debug overlay stays developer-only ---------------------------
  if (!/_REACH_DEBUG/.test(src)) {
    fails.push('_REACH_DEBUG flag missing');
  } else {
    // It must be query-string gated, and captured BEFORE ?fresh strips the query.
    const decl = src.match(/const _REACH_DEBUG =[^\n]*\n/);
    if (!decl || !/location\.search/.test(decl[0]))
      fails.push('_REACH_DEBUG must be gated on location.search (never a build constant)');
    // Match the actual CALL, not the word appearing in a comment that documents
    // this very hazard (an earlier version of this gate false-positived on it).
    const iDebug = src.indexOf('const _REACH_DEBUG');
    const mStrip = src.match(/^\s*history\.replaceState\s*\(/m);
    const iStrip = mStrip ? mStrip.index : -1;
    if (iStrip !== -1 && iDebug > iStrip)
      fails.push('_REACH_DEBUG is captured AFTER the ?fresh handler strips the query string — it will always be false');
  }

  // ---- 6b. SCENE-LOCAL COLLECTIBLE WORLDS ---------------------------------
  // Self-contained scenes (the movement tutorial) carry their OWN pickups, candles,
  // baseline, camera and zoom. CQREACH cannot validate them — its terrain queries are
  // about the main chart — so they must satisfy Law 002 structurally instead: positions
  // DERIVED at render time from the live scene baseline, never stored as an absolute y.
  // This is the class the founder's build-311 report exposed as uncovered.
  if (/BlockchainJourney/.test(src)) {
    const derived = /function shellY\s*\(\s*sh\s*\)\s*\{[^}]*candTop\(/.test(src);
    const baseDerived = /function candTop\s*\(\s*c\s*\)\s*\{\s*return\s+S\.base\s*-/.test(src);
    if (!derived || !baseDerived)
      fails.push('scene-local collectible world (BlockchainJourney) no longer derives position from its live baseline at render time — Law 002 violated in a scene CQREACH cannot see');
    else notes.push('scene world render-derived');
  }

  // ---- 7. The chart rebuild clears collectibles ----------------------------
  const initFn = src.match(/function initCandles\s*\(\)\s*\{[\s\S]*?\n\}/);
  if (initFn && !/CQREACH\.clearAll\s*\(/.test(initFn[0]))
    fails.push('initCandles() does not clear collectibles — pickups orphan over the rebuilt chart');

  return {
    ok: fails.length === 0,
    detail: fails.length
      ? fails.join(' · ')
      : `owner published · ${notes.join(' · ')} · resize re-anchors · single groundY writer · wick growth owned · overlay dev-only · rebuild clears`,
  };
}

module.exports = { check };

if (require.main === module) {
  const r = check();
  console.log((r.ok ? 'PASS' : 'FAIL') + ' — ' + r.detail);
  process.exit(r.ok ? 0 : 1);
}
