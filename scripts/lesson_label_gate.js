#!/usr/bin/env node
'use strict';
/*
 * ChartQuest — LESSON-LABEL GATE  (added 2026-07-30, Lesson Visual Polish pass)
 * ============================================================================
 * WHY THIS EXISTS
 * The founder's verdict on the Knowledge card for "Short" was 2/10: the label SELLERS TAKE OVER
 * was drawn straight through three red candles in red text, and SHORT WINS ↓ had its own leader
 * line struck through the words. That was not a one-scene authoring slip — it was structural.
 * Every label in the LessonChart engine was drawn at a FIXED pixel offset from its candle, with
 * no width measurement and no collision test, so any label wider than its slot landed on the
 * chart. The Journal's review chart had the identical disease (raw colour-on-chart level text and
 * pills filled at 18% alpha, so candles showed through the words).
 *
 * The fix was structural: a measured-plate + solver layer shared by both surfaces. This gate
 * locks in the invariants of that layer, because a blind-placement helper is very easy to
 * reintroduce (it is one line, and it *looks* like it works until a label happens to be wide).
 *
 * WHAT IT ASSERTS
 *   A. LessonChart still owns label layout   — solve/solveLine/plate/leader/buildLayout present.
 *   B. Labels are painted in a SECOND pass   — geometry can never paint over text again.
 *   C. No blind placement has crept back     — the retired pill() helper stays retired, and no
 *                                              annotation writes a label with a raw fillText.
 *   D. The Journal speaks the same language  — svgPlate/svgSolve/svgSolveLine/svgLeader present,
 *                                              and every review-chart label is deferred to the
 *                                              label pass rather than drawn inline under candles.
 *
 * USAGE
 *   node scripts/lesson_label_gate.js          # human-readable report, exit 1 on any failure
 *   require('./lesson_label_gate.js').check()  # { ok, detail } for verify.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(path.resolve(__dirname, '..'), 'chart-quest.html');

function check() {
  let s;
  try { s = fs.readFileSync(SRC, 'utf8'); }
  catch (e) { return { ok: false, detail: 'cannot read chart-quest.html' }; }

  // Isolate the LessonChart IIFE so assertions can't be satisfied by unrelated code elsewhere.
  const i = s.indexOf('const LessonChart=(function(){');
  const lc = i < 0 ? '' : s.slice(i, s.indexOf('\n})();', i));
  const fails = [];
  const notes = [];

  // ── A. the layout engine exists and is owned by LessonChart ──
  if (!lc) fails.push('LessonChart engine not found');
  else {
    const need = ['function solve(', 'function solveLine(', 'function plate(', 'function leader(', 'function buildLayout('];
    const missing = need.filter(n => !lc.includes(n));
    if (missing.length) fails.push('layout engine incomplete — missing ' + missing.join(', '));
    else notes.push('solver+plate owned by LessonChart');
  }

  // ── B. labels are a SECOND pass over the annotations (geometry can never cover text) ──
  if (lc) {
    const loops = (lc.match(/for\(let ai=0;ai<\(scene\.anns\|\|\[\]\)\.length;ai\+\+\)/g) || []).length;
    if (loops < 2) fails.push('annotation drawing is single-pass — geometry can paint over labels (need a separate label pass)');
    else notes.push('two-pass render (geometry → labels)');
  }

  // ── C. no blind placement ──
  if (/\n  function pill\(ctx,x,y,text,color,center\)/.test(s))
    fails.push('retired pill() blind-placement helper is back — labels must go through plate()+solve()');
  if (lc && /fillText\(\s*a\.(label|text)\b/.test(lc))
    fails.push('an annotation label is drawn with a raw fillText — every label must be a measured plate');
  if (!fails.length) notes.push('no blind label placement');

  /* ── C2. the founder's 2026-07-30 criteria, as structural invariants ────────────────────
     4  arrows: the connector must draw a HEAD, not just a hairline.
     7  mobile: long labels must WRAP (below ~283px — the real canvas width on a 320px phone —
        the longest labels cannot be placed on one line at all), and the type scale must not
        shrink on small screens.
     1  "never touches": placement keeps a positive clearance, not merely zero overlap.
     Plus the degradation ladder: solve() must be allowed to report failure so the ladder can
     step down, rather than inventing a blind frame-edge placement. */
  if (lc) {
    if (!/function lLines\(/.test(lc))       fails.push('label wrapping (lLines) removed — long labels cannot fit a phone-width canvas');
    if (!/moveTo\(hx,hy\)/.test(lc))         fails.push('arrowhead removed from leader() — labels must point at their candle (criterion 4)');
    if (!/const CLR=\s*[1-9]/.test(lc))      fails.push('candle clearance CLR removed — labels may touch candles again (criterion 1)');
    if (!/function leastBad\(/.test(lc))     fails.push('leastBad() removed — an unplaceable label would be dumped blind at the frame edge');
    if (!/LFS\s*=\s*Wc</.test(lc))           fails.push('responsive type scale removed — phone labels must not shrink (criterion 7)');
    if (/rgba\(7,11,19,0\.94\)/.test(lc))    fails.push('the bordered plate style is back — the chosen style is the soft scrim');
    if (!fails.length) notes.push('scrim + arrows + wrapping + clearance intact');
  }

  // ── D. the Journal / trade-review chart speaks the same language ──
  const svgNeed = ['function svgPlate(', 'function svgSolve(', 'function svgSolveLine(', 'function svgLeader('];
  const svgMissing = svgNeed.filter(n => !s.includes(n));
  if (svgMissing.length) fails.push('Journal chart label system incomplete — missing ' + svgMissing.join(', '));
  const pend = (s.match(/_pend\.push\(/g) || []).length;
  if (pend < 5) fails.push('review-chart labels are not all deferred to the label pass (_pend.push ×' + pend + ', expected ≥5)');
  if (/fill="rgba\(255,214,10,0\.20\)"/.test(s))
    fails.push('translucent label pill is back in the review chart — plates must occlude the candles behind them');
  if (!svgMissing.length && pend >= 5) notes.push('Journal on plates (' + pend + ' deferred labels)');

  return {
    ok: fails.length === 0,
    detail: fails.length ? fails.join(' · ') : notes.join(' · '),
    fails, notes
  };
}

if (require.main === module) {
  const r = check();
  console.log('ChartQuest Lesson-Label Gate');
  console.log('==============================================');
  console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.detail);
  console.log('==============================================');
  console.log(r.ok ? 'PASS' : 'FAIL');
  process.exit(r.ok ? 0 : 1);
}

module.exports = { check };
