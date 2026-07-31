#!/usr/bin/env node
'use strict';
/*
 * ChartQuest — CANDLE-LANGUAGE GATE
 * ================================
 * The enforcement wire the Visual Market Constitution PROMISED (VMC:94 "a build step ... when a
 * citation goes stale, the build fails") but that was never built — the single reason the
 * "every path invents its own candle language" disease survived ~20 playtests and dozens of patches.
 *
 * A Constitution with no runtime power is enforced only by human diligence, and with ~24 candle
 * renderers + 14 generators there is no diligence that scales. This gate gives the Constitution TEETH.
 *
 * WHAT IT DOES (pure-static; buildable today per VISUAL_MARKET_PHASE1_AUDIT §"pure-static half"):
 *   Counts candle-language DIVERGENCE — inline palette literals that bypass the one COLOR object,
 *   per-renderer palette FORKS, retired wick tints, rounded-candle corners, and the retired minBody floor —
 *   and RATCHETS: it FAILS the build if any count rises above the committed baseline
 *   (scripts/.candle_baseline.json). You can never ADD divergence again; to lower the baseline you must
 *   migrate a renderer onto the single owner. That is how Build 350 becomes unable to regress.
 *
 * USAGE
 *   node scripts/candle_language_gate.js            # check; prints the census + exit 1 on any regression
 *   node scripts/candle_language_gate.js --update   # re-baseline (only after an INTENTIONAL convergence)
 *   require('./candle_language_gate.js').check()    # { ok, detail, counts, baseline, regressions } for verify.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'chart-quest.html');
const BASELINE = path.join(__dirname, '.candle_baseline.json');

// Each signal: a substring/regex whose COUNT measures one axis of candle-language divergence.
// `goal` is the value the migration drives it toward (1 = owned by the single COLOR object; 0 = fork eliminated).
const SIGNALS = {
  inline_bull_body:   { re: /#16c784/g,     goal: 1, desc: 'inline bull-body hex — must come from COLOR.greenBody (:2461)' },
  inline_bear_body:   { re: /#ea3943/g,     goal: 1, desc: 'inline bear-body hex — must come from COLOR.redBody (:2461)' },
  fork_mg_edge_green: { re: /#5cf0b4/g,     goal: 0, desc: 'MG bright-green edge fork (exists only in the mini-game engine)' },
  fork_mg_edge_red:   { re: /#ff7a82/g,     goal: 0, desc: 'MG bright-red edge fork' },
  fork_box_green:     { re: /#1fe08a/g,     goal: 0, desc: 'boxCandles off-hue green fork' },
  fork_box_red:       { re: /#ff4d5e/g,     goal: 0, desc: 'boxCandles off-hue red fork' },
  fork_card_edge:     { re: /#0d9460/g,     goal: 0, desc: 'intro-card green edge fork (COLOR.greenEdge is #0c9c69)' },
  retired_wick_green: { re: /#1fd790/g,     goal: 0, desc: 'retired tinted green wick (VMC F-C9 — neutral #c9d1d9 only)' },
  retired_wick_red:   { re: /#ff5663/g,     goal: 0, desc: 'retired tinted red wick (VMC F-C9)' },
  rounded_candle:     { re: /roundRect\(/g, goal: 0, desc: 'roundRect — candles must be radius-0 (VMC law); ratchet: no NEW rounded candles' },
  retired_minbody15:  { re: /minBody: ?15\b/g, goal: 0, desc: 'CFG.minBody=15 — retired by VMC:161; the price-space body floor (window.CQ) replaces it' },
};

function census() {
  let s = fs.readFileSync(SRC, 'utf8');
  // Exclude the BUILD_TAG changelog string: it NARRATES past fixes in prose and names hexes as history,
  // not as live candle code. Counting it would make the gate lie (and grow every time we write a changelog).
  s = s.replace(/const BUILD_TAG = '[\s\S]*?';\s*\/\//, "const BUILD_TAG = '';//");
  /* `rounded_candle` counts roundRect() as a proxy for "someone rounded a candle body". A rounded
     rect drawn for LABEL CHROME (an annotation plate behind text) is not a candle, and counting it
     made the gate fire on the 2026-07-30 lesson-label pass — a false positive that would have been
     "fixed" by re-baselining, which silently raises the ceiling for real regressions too.
     A line may opt out ONLY by carrying the explicit marker below. That keeps the ratchet honest:
     the exemption is deliberate, greppable, and review-visible — a candle renderer cannot acquire
     it by accident, it would have to state a falsehood in a comment. */
  s = s.split('\n').filter(l => !l.includes('CQ-LABEL-CHROME')).join('\n');
  const counts = {};
  for (const [k, sig] of Object.entries(SIGNALS)) counts[k] = (s.match(sig.re) || []).length;
  return counts;
}

function loadBaseline() {
  try { return JSON.parse(fs.readFileSync(BASELINE, 'utf8')).counts || null; } catch { return null; }
}

function check() {
  const counts = census();
  const baseline = loadBaseline();
  if (!baseline) {
    return { ok: true, firstRun: true, counts, baseline: null, regressions: [],
      detail: 'no baseline yet — run `node scripts/candle_language_gate.js --update` to establish it' };
  }
  const regressions = [];
  for (const k of Object.keys(SIGNALS)) {
    const cur = counts[k] || 0, base = baseline[k] != null ? baseline[k] : 0;
    if (cur > base) regressions.push(`${k}: ${base} → ${cur} (+${cur - base}) — ${SIGNALS[k].desc}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const btotal = Object.values(baseline).reduce((a, b) => a + b, 0);
  const ok = regressions.length === 0;
  const detail = ok
    ? `no new candle-language divergence (total ${total} ≤ baseline ${btotal}${total < btotal ? '; converged ' + (btotal - total) : ''})`
    : `NEW divergence added: ${regressions.join(' · ')}`;
  return { ok, counts, baseline, regressions, detail };
}

function fmtTable(counts, baseline) {
  const rows = Object.keys(SIGNALS).map(k => {
    const cur = counts[k] || 0, base = baseline ? (baseline[k] || 0) : null, goal = SIGNALS[k].goal;
    const delta = base == null ? '' : (cur > base ? `▲+${cur - base}` : cur < base ? `▼-${base - cur}` : '=');
    const flag = base != null && cur > base ? '  ✗ REGRESSION' : (cur > goal ? '' : '  ✓ at goal');
    return `  ${k.padEnd(20)} ${String(cur).padStart(4)}  (goal ${goal})  ${delta.padStart(6)}${flag}`;
  });
  return rows.join('\n');
}

function main() {
  const update = process.argv.includes('--update');
  const counts = census();
  if (update) {
    fs.writeFileSync(BASELINE, JSON.stringify({ note: 'Candle-language divergence baseline — the gate FAILS if any count rises above these. Lower them only by migrating a renderer onto the single owner (window.CQ / COLOR). Re-baseline with --update after an intentional convergence.', counts }, null, 2) + '\n');
    console.log('Candle-language baseline updated →', path.relative(ROOT, BASELINE));
    console.log(fmtTable(counts, counts));
    process.exit(0);
  }
  const r = check();
  console.log('\nChartQuest Candle-Language Gate\n' + '='.repeat(46));
  console.log(fmtTable(counts, r.baseline));
  console.log('='.repeat(46));
  if (r.firstRun) { console.log('  ⚠ ' + r.detail + '\n'); process.exit(0); }
  console.log('  ' + (r.ok ? '✓ ' : '✗ ') + r.detail + '\n');
  process.exit(r.ok ? 0 : 1);
}

module.exports = { check, census, SIGNALS };
if (require.main === module) main();
