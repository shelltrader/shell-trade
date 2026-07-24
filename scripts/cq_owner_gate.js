#!/usr/bin/env node
'use strict';
/*
 * ChartQuest — window.CQ OWNER-INTEGRITY GATE            (build 287 · Phase 2A)
 * ============================================================================
 * The candle-language gate (#12) stops NEW divergence from being ADDED. This gate stops the single
 * behavioural owner from being DELETED, BYPASSED, or silently DRIFTING from the ratified spine — the
 * three ways a codebase quietly grows a 61st competing owner and re-opens the root cause.
 *
 * It asserts three invariants and FAILS the build (exit 1) on any violation:
 *
 *   A. THE OWNER EXISTS & IS PUBLISHED.  window.CQ is defined and assigned to `window` so all four
 *      script blocks can consume it. If someone removes the engine, the build fails.
 *
 *   B. COLOR DERIVES FROM CQ (no re-forking the palette).  The candle-language fields of COLOR
 *      (bg, ground, wick, greenX, redX) must reference CQ.color.X — NOT inline hexes. If a future edit
 *      reverts COLOR.greenBody back to '#16c784', COLOR becomes a second source of truth again -> fail.
 *
 *   C. THE EMBEDDED SPINE MATCHES THE CONSTITUTION — IN FULL.  The engine's frozen A.6 numbers (the
 *      palette AND every geometry/floor/wick/spacing constant) must equal the ratified JSON in
 *      CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md §A.6. The spine is hand-transcribed, and the root-cause
 *      report warned a hand-copy "re-creates the disease one level up" — so we don't trust a regex on a
 *      few fields: we EVAL the real CQ IIFE in a sandbox and diff the ACTUAL CQ.SPINE / CQ.color object
 *      against the A.6 JSON, field by field. Any drift in any mapped number/hex fails the build. This is
 *      the "when a citation goes stale, the build fails" the Constitution promised (VMC:94) — now real.
 *
 * USAGE
 *   node scripts/cq_owner_gate.js                 # prints the three checks + exit 1 on any failure
 *   require('./cq_owner_gate.js').check()         # { ok, detail, failures } for verify.js #13
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'chart-quest.html');
const VMC = path.join(ROOT, 'CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md');

// Extract the whole CQ engine IIFE — from `(function () {` through `})();` right after publication —
// so we can eval the REAL owner object rather than approximate it with regexes.
function cqIife(s) {
  const marker = s.indexOf('window.CQ — THE EDUCATIONAL MARKET ENGINE');
  if (marker < 0) return '';
  const start = s.indexOf('(function () {', marker);
  const pub = s.indexOf('window.CQ = CQ;', start);
  if (start < 0 || pub < 0) return '';
  const end = s.indexOf('})();', pub);
  if (end < 0) return '';
  return s.slice(start, end + 5);
}

// Eval the extracted IIFE in a sandbox with a stub `window`, and return the real CQ object (or null).
function evalCQ(iife) {
  if (!iife) return null;
  try {
    const win = {};
    // The IIFE only touches window / Math / Object; run it and read the published owner off the stub.
    // eslint-disable-next-line no-new-func
    new Function('window', iife)(win);
    return win.CQ || null;
  } catch { return null; }
}

// Pull the ```json ... ``` block that follows "### A.6 The spine" in the Constitution.
function a6Json(md) {
  const i = md.indexOf('### A.6 The spine');
  if (i < 0) return null;
  const m = md.slice(i).match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Parse the numbers the A.6 JSON encodes as human formulas (strings), so we can compare them to the
// spine's extracted constants. Kept tiny + explicit — each returns a single number.
const numFrom = (str, re) => { const m = String(str || '').match(re); return m ? parseFloat(m[1]) : NaN; };

function check() {
  const failures = [];
  let s;
  try { s = fs.readFileSync(SRC, 'utf8'); } catch { return { ok: false, failures: ['chart-quest.html unreadable'], detail: 'chart-quest.html unreadable' }; }

  // ── A. owner exists & is published ──
  const iife = cqIife(s);
  const engine = evalCQ(iife);
  const published = /window\.CQ = CQ;/.test(s);
  if (!iife)      failures.push('window.CQ engine IIFE not found (the single behavioural owner was removed)');
  else if (!engine) failures.push('window.CQ engine present but did not eval to an owner object (syntax/shape broke)');
  if (!published) failures.push('window.CQ not published on window (blocks 2-4 cannot consume it)');

  // ── B. COLOR derives from CQ (candle fields reference the owner, not inline hexes) ──
  // Anchored to end-of-value (`,` or line end) so a `CQ.color.bull.body || '#16c784'` FALLBACK does NOT
  // satisfy the check; and we independently reject an inline hex on any candle-field line (belt + braces).
  const derived = {
    bg:          /\n\s*bg:\s*CQ\.color\.bg\s*,/,
    ground:      /\n\s*ground:\s*CQ\.color\.ground\s*,/,
    wick:        /\n\s*wick:\s*CQ\.color\.wick\s*,/,
    greenBody:   /\n\s*greenBody:\s*CQ\.color\.bull\.body\s*,/,
    greenStripe: /\n\s*greenStripe:\s*CQ\.color\.bull\.sheen\s*,/,
    greenEdge:   /\n\s*greenEdge:\s*CQ\.color\.bull\.edge\s*,/,
    redBody:     /\n\s*redBody:\s*CQ\.color\.bear\.body\s*,/,
    redStripe:   /\n\s*redStripe:\s*CQ\.color\.bear\.sheen\s*,/,
    redEdge:     /\n\s*redEdge:\s*CQ\.color\.bear\.edge\s*,/,
  };
  // The end-of-value anchor (`,` right after `CQ.color.X`) makes BOTH re-fork vectors fail this check:
  // a direct inline (`greenBody: '#16c784',` has no CQ.color ref) AND a fallback (`… .body || '#16c784',`
  // isn't comma-terminated right after `.body`). So one anchored test covers finding 10 without the
  // false positives a broad same-line hex scan hits on the engine's own authoritative COL definition.
  const notDerived = Object.keys(derived).filter(k => !derived[k].test(s));
  if (notDerived.length) failures.push('COLOR no longer derives cleanly from CQ (re-forked / added fallback): ' + notDerived.join(', '));

  // ── C. embedded spine matches the ratified Constitution A.6 — IN FULL ──
  let md = null; try { md = fs.readFileSync(VMC, 'utf8'); } catch {}
  const a6 = md != null ? a6Json(md) : null;
  if (!a6) {
    failures.push('Constitution A.6 JSON unreadable/unparseable — cannot verify spine against ratified source');
  } else if (engine && engine.SPINE && engine.color) {
    const S = engine.SPINE, C = engine.color;
    // Each entry: [label, engineValue, ratifiedValue]. Numbers compared with float tolerance; hex/strings exact.
    const w = a6.wick || {};
    const pairs = [
      // palette (bull/bear/doji/base + separator + reserved)
      ['color.bull.body', C.bull.body, a6.color.bull.body], ['color.bull.edge', C.bull.edge, a6.color.bull.edge], ['color.bull.sheen', C.bull.sheen, a6.color.bull.sheen],
      ['color.bear.body', C.bear.body, a6.color.bear.body], ['color.bear.edge', C.bear.edge, a6.color.bear.edge], ['color.bear.sheen', C.bear.sheen, a6.color.bear.sheen],
      ['color.doji.body', C.doji.body, a6.color.doji.body], ['color.doji.edge', C.doji.edge, a6.color.doji.edge],
      ['color.bg', C.bg, a6.color.bg], ['color.ground', C.ground, a6.color.ground], ['color.wick', C.wick, a6.color.wick], ['color.neutral', C.neutral, a6.color.neutral],
      ['color.separator', C.separator, a6.color.oppositeTouchSeparator],
      ['color.reserved.purple', C.reserved.purple, a6.color.reservedPortalNeverBody.purple],
      ['color.reserved.blue', C.reserved.blue, a6.color.reservedPortalNeverBody.blue],
      ['color.reserved.gold', C.reserved.gold, a6.color.reservedPortalNeverBody.gold],
      ['color.reserved.orange', C.reserved.orange, a6.color.reservedPortalNeverBody.orange],
      // hazard wick signals (A.6 keys them under wick.hazard) — guarded by neither gate before this
      ['color.hazard.spinPole', C.hazard.spinPole, (a6.wick.hazard || {}).spinPole],
      ['color.hazard.sweep', C.hazard.sweep, (a6.wick.hazard || {}).sweep],
      // width ratios + envelope + corner
      ['widthRatio.A', S.widthRatio.A, a6.widthRatio.A], ['widthRatio.B', S.widthRatio.B, a6.widthRatio.B], ['widthRatio.C', S.widthRatio.C, a6.widthRatio.C],
      ['cornerRadiusPx', S.cornerRadiusPx, a6.cornerRadiusPx],
      ['bodyWidthMinPx', S.bodyWidthMinPx, a6.bodyWidthMinPx], ['bodyWidthMaxPx', S.bodyWidthMaxPx, a6.bodyWidthMaxPx],
      // bw bands per type × device (note: A.6 phone key is `phone360`, engine uses `phone`)
      ['bwBands.A.desktop[0]', S.bwBands.A.desktop[0], a6.bwBands.A.desktop[0]], ['bwBands.A.desktop[1]', S.bwBands.A.desktop[1], a6.bwBands.A.desktop[1]],
      ['bwBands.A.phone[0]', S.bwBands.A.phone[0], a6.bwBands.A.phone360[0]], ['bwBands.A.phone[1]', S.bwBands.A.phone[1], a6.bwBands.A.phone360[1]],
      ['bwBands.B.desktop[0]', S.bwBands.B.desktop[0], a6.bwBands.B.desktop[0]], ['bwBands.B.desktop[1]', S.bwBands.B.desktop[1], a6.bwBands.B.desktop[1]],
      ['bwBands.B.phone[0]', S.bwBands.B.phone[0], a6.bwBands.B.phone360[0]], ['bwBands.B.phone[1]', S.bwBands.B.phone[1], a6.bwBands.B.phone360[1]],
      ['bwBands.C.desktop[0]', S.bwBands.C.desktop[0], a6.bwBands.C.desktop[0]], ['bwBands.C.desktop[1]', S.bwBands.C.desktop[1], a6.bwBands.C.desktop[1]],
      ['bwBands.C.phone[0]', S.bwBands.C.phone[0], a6.bwBands.C.phone360[0]], ['bwBands.C.phone[1]', S.bwBands.C.phone[1], a6.bwBands.C.phone360[1]],
      // floors + doji band + median rule
      ['minReadableBodyPx.desktop', S.minReadableBodyPx.desktop, a6.minReadableBodyPx_desktop],
      ['minReadableBodyPx.phone', S.minReadableBodyPx.phone, a6.minReadableBodyPx_phone],
      ['hardFloorBodyPx.desktop', S.hardFloorBodyPx.desktop, a6.hardFloorBodyPx_desktop],
      ['hardFloorBodyPx.phone', S.hardFloorBodyPx.phone, a6.hardFloorBodyPx_phone_smallest],
      ['educationalMinBodyPx_A', S.educationalMinBodyPx_A, a6.educationalMinBodyPx_typeA],
      ['dojiBandPx[0]', S.dojiBandPx[0], a6.dojiBandMinPx], ['dojiBandPx[1]', S.dojiBandPx[1], a6.dojiBandMaxPx],
      ['medianVisibleBodyMinPx_gameplay', S.medianVisibleBodyMinPx_gameplay, a6.medianVisibleBodyMinPx_gameplay],
      ['flooredBodyMaxFractionOfMedian', S.flooredBodyMaxFractionOfMedian, a6.flooredBodyMaxFractionOfMedian],
      // wick (A.6 encodes the width rule as the formula string "clamp(bodyW*0.05, 1.6, 3.0)")
      ['wick.widthMul', S.wick.widthMul, numFrom(w.widthFormula, /bodyW\*([\d.]+)/)],
      ['wick.widthMin', S.wick.widthMin, numFrom(w.widthFormula, /,\s*([\d.]+),/)],
      ['wick.widthMax', S.wick.widthMax, numFrom(w.widthFormula, /,\s*[\d.]+,\s*([\d.]+)\s*\)/)],
      ['wick.minDrawnLenAC', S.wick.minDrawnLenAC, w.minDrawnLen_AC],
      ['wick.minDrawnLenB', S.wick.minDrawnLenB, numFrom(w.drawnLen_B, />=\s*(\d+)/)],
      // spacing (A.6 encodes gaps + bleed as formula strings)
      ['spacing.gapEducationalMinFrac', S.spacing.gapEducationalMinFrac, numFrom((a6.spacing || {}).gapEducational, /([\d.]+)\*slot/)],
      ['spacing.gapExamFrac', S.spacing.gapExamFrac, numFrom((a6.spacing || {}).gapExam, /([\d.]+)\*slot/)],
      ['spacing.gameplayBleedW', S.spacing.gameplayBleedW, numFrom((a6.spacing || {}).gameplayBleed, /bw=c\.w\+([\d.]+)/)],
      ['spacing.gameplayBleedX', S.spacing.gameplayBleedX, numFrom((a6.spacing || {}).gameplayBleed, /bx=sx(-?[\d.]+)/)],
    ];
    const drift = [];
    for (const [label, got, want] of pairs) {
      if (want == null || (typeof want === 'number' && isNaN(want))) { drift.push(`${label}: A.6 value missing (mapping stale)`); continue; }
      const same = (typeof want === 'number' && typeof got === 'number')
        ? Math.abs(got - want) < 1e-9
        : String(got).toLowerCase() === String(want).toLowerCase();
      if (!same) drift.push(`${label} CQ=${got} vs A.6=${want}`);
    }
    if (drift.length) failures.push(`CQ spine drifted from ratified Constitution A.6 (${drift.length}): ` + drift.slice(0, 8).join(' · ') + (drift.length > 8 ? ' …' : ''));
  }

  const ok = failures.length === 0;
  const detail = ok
    ? 'window.CQ owner present & published · COLOR derives from CQ · full spine (palette + geometry + floors + wick + spacing) matches Constitution A.6'
    : failures.join(' | ');
  return { ok, failures, detail };
}

function main() {
  const r = check();
  console.log('\nChartQuest window.CQ Owner-Integrity Gate\n' + '='.repeat(46));
  console.log('  ' + (r.ok ? '✓ ' : '✗ ') + r.detail + '\n');
  process.exit(r.ok ? 0 : 1);
}

module.exports = { check };
if (require.main === module) main();
