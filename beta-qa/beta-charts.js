/* ══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — BETA TEST QA DASHBOARD                    window.BetaCharts        (v1.0.0)
   ------------------------------------------------------------------------------------------
   Dependency-free SVG chart primitives for the founder dashboard. No canvas, no CDN, no npm,
   no build step — this file is <script src>'d directly and runs in Safari and Chrome as-is.

   ── WHAT IT IS ───────────────────────────────────────────────────────────────────────────
       BetaCharts.sparkline(el, series, opts)     tiny inline trend for a KPI tile
       BetaCharts.line(el, seriesSet, opts)       multi-series, axes, grid, crosshair + tooltip
       BetaCharts.bars(el, data, opts)            vertical or horizontal, optional stacking
       BetaCharts.donut(el, data, opts)           centre label + legend
       BetaCharts.funnel(el, stages, opts)        THE hero chart (BetaModel §1 funnel rows)
       BetaCharts.heatmap(el, grid, opts)         day × stage intensity grid
       BetaCharts.histogram(el, counts, opts)     rating distribution 1–10

   Every call returns a controller: { update(data, opts), refresh(), destroy(), el, svg }.

   ── HOUSE RULES THIS FILE OBEYS ──────────────────────────────────────────────────────────
   • COLOUR ONLY THROUGH CSS CUSTOM PROPERTIES. Not one hex, rgb() or named colour appears as
     data ink. The host page owns the palette: --cq-green --cq-red --cq-amber --cq-blue
     --cq-muted --cq-border --cq-text --cq-panel (plus the optional --cq-shadow). A chart that
     hardcodes #3ddc6a is a chart that breaks the day the founder retunes the theme.
   • RESPONSIVE BY MEASUREMENT, not by media query. Width is read off the container and fed to
     the viewBox, and a ResizeObserver repaints. Nothing ever renders wider than its panel.
   • HONEST EMPTY STATES. Zero points and one point are separate, explicit states. There is no
     path in this file that can emit `NaN` into a `d=` attribute, and every division goes
     through div() — a chart that silently draws a broken axis is worse than a chart that says
     "no data yet", because the founder acts on it.
   • ACCESSIBLE. role="img" + a data summary in aria-label. Tooltips are real DOM nodes built
     with textContent (never innerHTML, never a title attribute) — crash messages and build
     strings reach this dashboard straight from the wild, and a tester's stack trace must not
     be able to inject markup into the founder's browser.
   • MOTION IS A GARNISH. 150–250ms, once on first paint, never on data updates, and skipped
     entirely under prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var api = factory();
  if (root) root.BetaCharts = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis
  : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  var VERSION = '1.0.0';
  var NS = 'http://www.w3.org/2000/svg';

  /* The only colours this file knows about. Series cycle through them in this order; red sits
     late because a red series reads as "bad" and most series are not. */
  var COLORS = ['var(--cq-blue)', 'var(--cq-green)', 'var(--cq-amber)', 'var(--cq-red)', 'var(--cq-muted)'];
  var C_TEXT = 'var(--cq-text)';
  var C_MUTED = 'var(--cq-muted)';
  var C_BORDER = 'var(--cq-border)';
  var C_PANEL = 'var(--cq-panel)';
  var C_GREEN = 'var(--cq-green)';
  var C_RED = 'var(--cq-red)';
  var C_AMBER = 'var(--cq-amber)';
  var C_BLUE = 'var(--cq-blue)';

  var _uid = 0;
  function uid(p) { _uid += 1; return 'cqc' + p + _uid; }

  /* ── tiny safe primitives ────────────────────────────────────────────────────────────── */

  function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }

  /* A number, or null. Everything upstream of this file is JSON from Postgres or a snapshot
     file, so "3", 3, null, undefined and NaN all arrive at some point. One funnel of truth. */
  function num(v) {
    if (v == null || v === '') return null;
    var n = typeof v === 'number' ? v : Number(v);
    return isFinite(n) ? n : null;
  }

  /* Every divide in this file goes through here. A single unguarded `n / total` with total=0
     produces Infinity, which becomes `d="M NaN NaN"`, which renders as a blank panel with no
     error — the exact failure mode that makes a dashboard quietly lie. */
  function div(a, b, dflt) {
    var x = num(a), y = num(b);
    if (x == null || y == null || y === 0) return dflt == null ? 0 : dflt;
    var r = x / y;
    return isFinite(r) ? r : (dflt == null ? 0 : dflt);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i]; if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }
  function isArr(v) { return Object.prototype.toString.call(v) === '[object Array]'; }
  function now() { return safe(function () { return performance.now(); }, Date.now()); }

  function reducedMotion() {
    /* Read per paint, not once at load: the founder can flip the OS setting mid-session and
       the next repaint should honour it. */
    return safe(function () {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, false);
  }

  /* ── formatting ──────────────────────────────────────────────────────────────────────── */

  function fmtNum(v) {
    var n = num(v);
    if (n == null) return '—';
    var a = Math.abs(n);
    if (a >= 1e6) return trimZero((n / 1e6).toFixed(1)) + 'M';
    if (a >= 1e4) return trimZero((n / 1e3).toFixed(1)) + 'k';
    if (a >= 100 || n === Math.round(n)) return String(Math.round(n));
    return trimZero(n.toFixed(a < 1 ? 2 : 1));
  }
  function trimZero(s) { return String(s).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1'); }

  function fmtPct(v, dp) {
    var n = num(v);
    if (n == null) return '—';
    return trimZero(n.toFixed(dp == null ? 0 : dp)) + '%';
  }

  /* Session length and time-to-stage are seconds in the model and minutes in the founder's
     head. "1022" means nothing; "17m 02s" is instantly a long session. */
  function fmtDuration(v) {
    var s = num(v);
    if (s == null) return '—';
    s = Math.round(s);
    var sign = s < 0 ? '-' : ''; s = Math.abs(s);
    if (s < 60) return sign + s + 's';
    var m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return sign + m + 'm' + (r ? ' ' + pad2(r) + 's' : '');
    var h = Math.floor(m / 60);
    return sign + h + 'h ' + pad2(m % 60) + 'm';
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* The model's days are UTC days (`date_trunc('day', … at time zone 'utc')` in SQL, ISO day
     strings in the snapshot). Formatting them with LOCAL getters shifts every label back a day
     for anyone west of Greenwich — the founder in New York would read Monday's numbers under
     Sunday's label and conclude the beta died over the weekend. UTC getters, always. */
  function fmtDay(v) {
    var d = toDate(v);
    if (!d) return v == null ? '—' : String(v);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  function fmtDateTime(v) {
    var d = toDate(v);
    if (!d) return v == null ? '—' : String(v);
    return fmtDay(d) + ' ' + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ' UTC';
  }
  function toDate(v) {
    if (v instanceof Date) return isFinite(v.getTime()) ? v : null;
    if (typeof v === 'number' && isFinite(v)) return new Date(v);
    if (typeof v !== 'string' || !v) return null;
    /* A bare "2026-08-04" is parsed as UTC midnight by spec; a bare "2026-08-04 09:00" is not
       parsed at all by Safari. Normalise both before handing them to Date. */
    var s = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v + 'T00:00:00Z' : v.replace(' ', 'T');
    var t = Date.parse(s);
    if (!isFinite(t)) t = Date.parse(v);
    return isFinite(t) ? new Date(t) : null;
  }

  /* Rough text width. We cannot measure SVG text before it is in the DOM without forcing a
     layout on every label, so widths for collision maths are estimated from the character
     count. 0.58em is a good average for the UI stacks this dashboard uses; it only ever
     decides whether a label is DROPPED, never where it sits, so a small error is invisible. */
  function textW(s, fontSize) { return String(s == null ? '' : s).length * fontSize * 0.58; }
  function clip(s, maxChars) {
    s = String(s == null ? '' : s);
    return s.length <= maxChars ? s : s.slice(0, Math.max(1, maxChars - 1)) + '…';
  }

  /* Safari's dominant-baseline support has historically differed from Chrome's on SVG text,
     and "roughly centred" looks broken in a dense dashboard. Centre by hand instead — this
     renders identically in both engines. */
  function midDy(fontSize) { return fontSize * 0.355; }

  /* ── DOM helpers ─────────────────────────────────────────────────────────────────────── */

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      var v = attrs[k];
      if (v != null && v !== false) n.setAttribute(k, String(v));
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  /* Negative or NaN width/height on a <rect> is an error in SVG: Chrome drops the element and
     logs, Safari drops it silently. Bars driven by live data hit zero and rounding noise
     constantly, so the clamp lives here rather than at 40 call sites. */
  function rect(parent, x, y, w, h, attrs) {
    var a = assign({
      x: fin(x), y: fin(y),
      width: Math.max(0, fin(w)), height: Math.max(0, fin(h))
    }, attrs);
    return el('rect', a, parent);
  }
  function fin(v) { var n = num(v); return n == null ? 0 : n; }

  function text(parent, s, attrs) {
    var n = el('text', assign({ 'font-size': 10, fill: C_MUTED }, attrs), parent);
    n.textContent = (s == null ? '' : String(s));
    return n;
  }

  function line2(parent, x1, y1, x2, y2, attrs) {
    return el('line', assign({ x1: fin(x1), y1: fin(y1), x2: fin(x2), y2: fin(y2) }, attrs), parent);
  }

  function group(parent, attrs) { return el('g', attrs, parent); }

  /* ── stylesheet, injected once ───────────────────────────────────────────────────────── */

  var CSS_ID = 'cq-beta-charts-css';
  var CSS = [
    '.cqc-root{position:relative;width:100%;font-variant-numeric:tabular-nums;',
    '-webkit-font-smoothing:antialiased;}',
    '.cqc-root svg{display:block;width:100%;}',
    '.cqc-root svg text{font-family:inherit;user-select:none;-webkit-user-select:none;}',
    '.cqc-hit{cursor:default;}',
    '.cqc-clickable{cursor:pointer;}',
    /* Tooltip: a real element so it can hold structure, a swatch and multiple rows. The only
       non-token colour in this file is the optional shadow, and it is behind a var. */
    '.cqc-tip{position:absolute;left:0;top:0;z-index:60;pointer-events:none;opacity:0;',
    'background:var(--cq-panel);border:1px solid var(--cq-border);color:var(--cq-text);',
    'border-radius:8px;padding:7px 9px;font-size:11px;line-height:1.5;white-space:nowrap;',
    'box-shadow:var(--cq-shadow,0 8px 24px rgba(0,0,0,.45));transition:opacity .12s ease;}',
    '.cqc-tip.on{opacity:1;}',
    '.cqc-tip-title{font-weight:600;color:var(--cq-text);margin-bottom:3px;}',
    '.cqc-tip-row{display:flex;align-items:center;gap:6px;}',
    '.cqc-tip-row .cqc-sw{width:8px;height:8px;border-radius:2px;flex:0 0 8px;}',
    '.cqc-tip-row .cqc-k{color:var(--cq-muted);}',
    '.cqc-tip-row .cqc-v{margin-left:auto;color:var(--cq-text);font-weight:600;',
    'padding-left:10px;}',
    '@media (prefers-reduced-motion: reduce){.cqc-tip{transition:none;}}'
  ].join('');

  function injectCss() {
    safe(function () {
      if (document.getElementById(CSS_ID)) return;
      var s = document.createElement('style');
      s.id = CSS_ID;
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    });
  }

  /* ── tooltip ─────────────────────────────────────────────────────────────────────────── */

  function makeTip(wrap) {
    var node = document.createElement('div');
    node.className = 'cqc-tip';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'off');   // a chatty live region on hover is hostile to SRs
    wrap.appendChild(node);
    var visible = false;

    function show(content, x, y) {
      while (node.firstChild) node.removeChild(node.firstChild);
      if (content && content.title != null) {
        var t = document.createElement('div');
        t.className = 'cqc-tip-title';
        t.textContent = String(content.title);      // textContent, never innerHTML — see header
        node.appendChild(t);
      }
      var rows = (content && content.rows) || [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i] || {};
        var line = document.createElement('div');
        line.className = 'cqc-tip-row';
        if (r.color) {
          var sw = document.createElement('span');
          sw.className = 'cqc-sw';
          sw.style.background = r.color;
          line.appendChild(sw);
        }
        var k = document.createElement('span');
        k.className = 'cqc-k';
        k.textContent = String(r.label == null ? '' : r.label);
        line.appendChild(k);
        if (r.value != null) {
          var v = document.createElement('span');
          v.className = 'cqc-v';
          v.textContent = String(r.value);
          line.appendChild(v);
        }
        node.appendChild(line);
      }
      node.classList.add('on');
      visible = true;
      place(x, y);
    }

    function place(x, y) {
      /* Measured after the content is in, so the clamp uses the real width. Anchored above the
         cursor, flipped below when it would leave the panel — a tooltip that escapes the card
         is the first thing that looks cheap. */
      var w = node.offsetWidth, h = node.offsetHeight;
      var host = wrap.clientWidth || w;
      var left = clamp(x - w / 2, 2, Math.max(2, host - w - 2));
      var top = y - h - 10;
      if (top < 2) top = y + 16;
      node.style.transform = 'translate(' + Math.round(left) + 'px,' + Math.round(top) + 'px)';
    }

    function hide() {
      if (!visible) return;
      visible = false;
      node.classList.remove('on');
    }

    return { show: show, hide: hide, move: place, node: node };
  }

  /* ── animation ───────────────────────────────────────────────────────────────────────── */

  function easeOut(p) { var q = 1 - p; return 1 - q * q * q; }

  /* ── scales & ticks ──────────────────────────────────────────────────────────────────── */

  function scaleLinear(d0, d1, r0, r1) {
    var span = d1 - d0;
    /* A flat series (every value identical, or a single point) has a zero-width domain. Without
       this guard the scale divides by zero and the whole path becomes NaN; with it, the series
       renders as a straight line through the middle of the plot, which is the truth. */
    if (!isFinite(span) || span === 0) {
      var mid = (r0 + r1) / 2;
      return function () { return mid; };
    }
    var k = (r1 - r0) / span;
    return function (v) {
      var n = num(v);
      if (n == null) return r0;
      return r0 + (n - d0) * k;
    };
  }

  /* Human tick steps (1, 2, 5, 10 …). A raw min/max split into five gives ticks like 3.4, 6.8
     which nobody reads. `minStep` is how callers say "these are whole players" — a y-axis
     reading 0, 0.4, 0.8 players is nonsense on a ten-person beta. */
  function niceTicks(min, max, count, minStep) {
    var lo = num(min), hi = num(max);
    if (lo == null || hi == null) return [0];
    if (lo === hi) return [lo];
    var n = Math.max(2, count || 4);
    var raw = (hi - lo) / n;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var err = div(raw, mag, 1);
    var step = mag * (err >= 7.5 ? 10 : err >= 3 ? 5 : err >= 1.5 ? 2 : 1);
    if (minStep && step < minStep) step = minStep;
    var out = [];
    var start = Math.ceil(lo / step) * step;
    for (var v = start; v <= hi + step * 1e-9 && out.length < 40; v += step) {
      /* Re-derive from the step index instead of accumulating: 0.1+0.1+0.1 is 0.30000000000004
         and that renders as a tick label. */
      out.push(roundStep(v, step));
    }
    if (!out.length) out = [lo, hi];
    return out;
  }
  function roundStep(v, step) {
    var dec = step < 1 ? Math.min(6, Math.ceil(-Math.log(step) / Math.LN10) + 1) : 0;
    return Number(v.toFixed(dec));
  }

  /* ── series normalisation ────────────────────────────────────────────────────────────── */

  /* Accepts [y], [{x,y}], [[x,y]] and {x,y} objects with an ISO-day x. Non-finite y survives
     as null — in a timeseries "no sessions logged that day" and "zero sessions that day" are
     different facts, and collapsing them would draw a line through a hole in the data. */
  function toPoints(series) {
    var raw = isArr(series) ? series : [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var p = raw[i], x, y, label = null;
      if (p == null) { x = i; y = null; }
      else if (typeof p === 'number' || typeof p === 'string') { x = i; y = num(p); }
      else if (isArr(p)) { x = p[0]; y = num(p[1]); }
      else { x = (p.x != null ? p.x : (p.day != null ? p.day : i)); y = num(p.y != null ? p.y : p.value); }
      var xv = xValue(x, i);
      if (xv.label != null) label = xv.label;
      out.push({ x: xv.n, xRaw: x, xLabel: label, y: y, i: i, src: p });
    }
    return out;
  }

  function xValue(x, i) {
    if (typeof x === 'number' && isFinite(x)) return { n: x, label: null, time: false };
    if (x instanceof Date) return { n: x.getTime(), label: null, time: true };
    if (typeof x === 'string') {
      var d = toDate(x);
      if (d) return { n: d.getTime(), label: null, time: true };
      return { n: i, label: x, time: false };      // a plain category: keep the string as label
    }
    return { n: i, label: null, time: false };
  }

  function isTimeSeries(pointSets) {
    for (var s = 0; s < pointSets.length; s++) {
      var pts = pointSets[s];
      for (var i = 0; i < pts.length; i++) {
        var r = pts[i].xRaw;
        if (r instanceof Date) return true;
        if (typeof r === 'string' && toDate(r)) return true;
      }
    }
    return false;
  }

  function countValues(pts) {
    var n = 0;
    for (var i = 0; i < pts.length; i++) if (pts[i].y != null) n++;
    return n;
  }

  /* Almost every metric in this model is a count of people. Knowing that lets the axis choose
     whole-number ticks; ratings and averages fall through to fractional steps. */
  function allWhole(values) {
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v == null) continue;
      if (v !== Math.round(v)) return false;
    }
    return true;
  }

  /* Path builder that survives gaps. Isolated points (a value with nulls either side) are
     returned separately so the caller can draw a dot — otherwise a one-day series is an
     invisible zero-length path and the panel looks broken. */
  function buildPath(pts, sx, sy, smooth) {
    var runs = [], cur = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p.y == null) { if (cur.length) { runs.push(cur); cur = []; } continue; }
      cur.push([sx(p.x), sy(p.y)]);
    }
    if (cur.length) runs.push(cur);

    var d = '', isolated = [];
    for (var r = 0; r < runs.length; r++) {
      var run = runs[r];
      if (run.length === 1) { isolated.push(run[0]); continue; }
      d += smooth ? smoothRun(run) : straightRun(run);
    }
    return { d: d, runs: runs, isolated: isolated };
  }

  function straightRun(run) {
    var d = 'M' + xy(run[0]);
    for (var i = 1; i < run.length; i++) d += 'L' + xy(run[i]);
    return d;
  }
  /* Catmull-Rom → cubic bézier. Gentle, never overshoots into negative territory badly, and
     matches the soft curves of the dashboards this is modelled on. */
  function smoothRun(run) {
    var d = 'M' + xy(run[0]);
    for (var i = 0; i < run.length - 1; i++) {
      var p0 = run[i - 1] || run[i], p1 = run[i], p2 = run[i + 1], p3 = run[i + 2] || run[i + 1];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + xy(c1) + ' ' + xy(c2) + ' ' + xy(p2);
    }
    return d;
  }
  function xy(p) { return r2(p[0]) + ' ' + r2(p[1]); }
  function r2(v) { var n = num(v); return n == null ? 0 : Math.round(n * 100) / 100; }

  function areaPath(runs, baseY, smooth) {
    var d = '';
    for (var r = 0; r < runs.length; r++) {
      var run = runs[r];
      if (run.length < 2) continue;
      d += (smooth ? smoothRun(run) : straightRun(run));
      d += 'L' + r2(run[run.length - 1][0]) + ' ' + r2(baseY);
      d += 'L' + r2(run[0][0]) + ' ' + r2(baseY) + 'Z';
    }
    return d;
  }

  /* ── shared defs (hatch pattern for "not measured") ──────────────────────────────────── */

  function hatch(c, color, opacity) {
    var id = uid('h');
    var defs = c.defs();
    var p = el('pattern', {
      id: id, width: 6, height: 6, patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)'
    }, defs);
    rect(p, 0, 0, 6, 6, { fill: 'none' });
    line2(p, 0, 0, 0, 6, {
      stroke: color || C_MUTED, 'stroke-width': 2.5,
      'stroke-opacity': opacity == null ? 0.34 : opacity
    });
    return 'url(#' + id + ')';
  }

  function fadeGradient(c, color, topOpacity) {
    var id = uid('g');
    var g = el('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, c.defs());
    el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': topOpacity == null ? 0.28 : topOpacity }, g);
    el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }, g);
    return 'url(#' + id + ')';
  }

  /* ── the chart factory ───────────────────────────────────────────────────────────────── */

  function resolveHost(host) {
    if (!host) return null;
    if (typeof host === 'string') return safe(function () { return document.querySelector(host); }, null);
    if (host.nodeType === 1) return host;
    return null;
  }

  function inert(reason) {
    /* One missing panel must not take down the other eleven charts on the page. Warn loudly,
       hand back a controller with the same shape, and let the dashboard keep rendering. */
    return {
      el: null, svg: null, error: reason || 'no container',
      update: function () { return this; },
      refresh: function () { return this; },
      destroy: function () { return this; }
    };
  }

  function makeChart(spec) {
    return function (host, data, opts) {
      var target = resolveHost(host);
      if (!target) {
        safe(function () { console.warn('[BetaCharts] ' + spec.name + ': container not found', host); });
        return inert('container not found');
      }
      injectCss();

      var wrap = document.createElement('div');
      wrap.className = 'cqc-root cqc-' + spec.name;
      while (target.firstChild) target.removeChild(target.firstChild);
      target.appendChild(wrap);

      var svg = el('svg', { xmlns: NS, role: 'img', focusable: 'false' });
      wrap.appendChild(svg);
      var tip = makeTip(wrap);

      var st = {
        data: data,
        opts: assign({}, spec.defaults || {}, opts || {}),
        first: true, lastW: -1, raf: 0, dead: false, defsNode: null
      };

      function cancel() { if (st.raf) { safe(function () { cancelAnimationFrame(st.raf); }); st.raf = 0; } }

      function paint(force) {
        if (st.dead) return;
        var w = Math.floor(target.clientWidth || safe(function () {
          return target.getBoundingClientRect().width;
        }, 0) || 0);
        /* Width 0 means the panel is in a hidden tab (this dashboard is tabbed) or not laid out
           yet. Rendering now would bake a 0-wide viewBox that never recovers; the observer
           fires the moment the tab is shown, so simply wait. */
        if (w <= 0) return;
        if (!force && w === st.lastW) return;
        st.lastW = w;
        cancel();
        tip.hide();

        var h = Math.max(1, Math.round(
          typeof spec.height === 'function' ? spec.height(st.data, st.opts, w) : (st.opts.height || 160)
        ));

        while (svg.firstChild) svg.removeChild(svg.firstChild);
        st.defsNode = null;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.height = h + 'px';

        var c = {
          svg: svg, wrap: wrap, w: w, h: h,
          data: st.data, opts: st.opts, tip: tip,
          first: st.first,
          defs: function () {
            if (!st.defsNode) {
              st.defsNode = el('defs', null, svg);
              svg.insertBefore(st.defsNode, svg.firstChild);
            }
            return st.defsNode;
          },
          /* Entry animation: first paint only, skipped under reduced motion, and always
             finished synchronously in that case so the chart is never left mid-tween. */
          animate: function (ms, step) {
            if (!st.first || reducedMotion() || !(ms > 0)) { step(1); return; }
            var t0 = now();
            step(0);
            (function frame() {
              if (st.dead) return;
              var p = clamp(div(now() - t0, ms, 1), 0, 1);
              step(easeOut(p));
              if (p < 1) st.raf = requestAnimationFrame(frame); else st.raf = 0;
            }());
          },
          empty: function (msg) { drawEmpty(c, msg); },
          aria: function (s) { svg.setAttribute('aria-label', s || ''); }
        };

        svg.setAttribute('aria-label', spec.name + ' chart');
        try {
          spec.draw(c);
        } catch (err) {
          /* A thrown draw must not kill the other charts on the page, but it must never look
             like "no data" either — that is how a rendering bug gets read as a dead funnel.
             Say what it is, loudly, in the panel and in the console. */
          safe(function () { console.error('[BetaCharts] ' + spec.name + ' failed to render', err); });
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          st.defsNode = null;
          drawEmpty(c, 'Chart failed to render — see console');
        }
        st.first = false;
      }

      /* Only repaint when the WIDTH changed. Our own render changes the container's height,
         which re-fires the observer — without the width check that is an infinite loop that
         pegs a core and freezes the dashboard. */
      var ro = safe(function () {
        if (typeof ResizeObserver !== 'function') return null;
        var o = new ResizeObserver(function () { paint(false); });
        o.observe(target);
        return o;
      }, null);

      var onResize = null;
      if (!ro) {
        onResize = function () { paint(false); };
        safe(function () { window.addEventListener('resize', onResize); });
      }

      paint(true);

      return {
        el: wrap,
        svg: svg,
        update: function (newData, newOpts) {
          if (newData !== undefined) st.data = newData;
          if (newOpts) st.opts = assign({}, st.opts, newOpts);
          paint(true);
          return this;
        },
        refresh: function () { paint(true); return this; },
        destroy: function () {
          st.dead = true;
          cancel();
          safe(function () { if (ro) ro.disconnect(); });
          safe(function () { if (onResize) window.removeEventListener('resize', onResize); });
          safe(function () { while (target.firstChild) target.removeChild(target.firstChild); });
          return this;
        }
      };
    };
  }

  function drawEmpty(c, msg) {
    var m = msg || 'No data yet';
    rect(c.svg, 0.5, 0.5, c.w - 1, c.h - 1, {
      fill: 'none', stroke: C_BORDER, 'stroke-dasharray': '4 4', rx: 8
    });
    text(c.svg, m, {
      x: c.w / 2, y: c.h / 2 + midDy(11), 'text-anchor': 'middle', 'font-size': 11, fill: C_MUTED
    });
    c.aria(m);
  }

  /* Attach hover/leave to a shape and route it through the shared tooltip. Listeners live on
     nodes that are discarded on every repaint, so there is nothing to unbind. */
  function hoverable(c, node, content, opts) {
    node.setAttribute('class', 'cqc-hit' + (opts && opts.click ? ' cqc-clickable' : ''));
    node.addEventListener('pointermove', function (e) {
      var p = localPoint(c, e);
      c.tip.show(typeof content === 'function' ? content() : content, p.x, p.y);
    });
    node.addEventListener('pointerenter', function (e) {
      var p = localPoint(c, e);
      c.tip.show(typeof content === 'function' ? content() : content, p.x, p.y);
    });
    node.addEventListener('pointerleave', function () { c.tip.hide(); });
    if (opts && opts.click) node.addEventListener('click', opts.click);
  }

  /* Pointer position in WRAPPER pixels. The svg is scaled by CSS (viewBox width == measured
     width, so the factor is 1 in practice) but a zoomed browser or a CSS transform on an
     ancestor changes that; going through the bounding rect keeps the tooltip under the cursor
     either way. */
  function localPoint(c, e) {
    var r = c.wrap.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     1 · SPARKLINE
     ══════════════════════════════════════════════════════════════════════════════════════ */

  var sparkline = makeChart({
    name: 'sparkline',
    defaults: {
      height: 34, color: C_BLUE, area: true, dot: true, strokeWidth: 1.5,
      smooth: true, trendColor: false, format: fmtNum
    },
    height: function (d, o) { return o.height || 34; },
    draw: function (c) {
      var o = c.opts;
      if (typeof o.format !== 'function') o = assign({}, o, { format: fmtNum });
      var pts = toPoints(c.data);
      var vals = countValues(pts);
      var pad = 3, top = pad, bot = c.h - pad;

      if (vals === 0) {
        /* A dashed baseline, not a box with text: at 34px tall any message is illegible, and
           an empty tile that still holds its shape reads as "nothing yet", not "broken". */
        line2(c.svg, 0, c.h / 2, c.w, c.h / 2, {
          stroke: C_BORDER, 'stroke-width': 1, 'stroke-dasharray': '3 3'
        });
        c.aria(o.label ? o.label + ': no data yet' : 'No data yet');
        return;
      }

      var ys = [], i;
      for (i = 0; i < pts.length; i++) if (pts[i].y != null) ys.push(pts[i].y);
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      if (o.yMin != null) lo = Math.min(lo, num(o.yMin));
      if (o.yMax != null) hi = Math.max(hi, num(o.yMax));
      var xs = [];
      for (i = 0; i < pts.length; i++) xs.push(pts[i].x);
      var sx = scaleLinear(Math.min.apply(null, xs), Math.max.apply(null, xs), pad, c.w - pad);
      var sy = scaleLinear(lo, hi, bot, top);

      var first = null, last = null;
      for (i = 0; i < pts.length; i++) if (pts[i].y != null) { if (first == null) first = pts[i].y; last = pts[i].y; }
      var color = o.color;
      if (o.trendColor) color = (last >= first) ? C_GREEN : C_RED;

      if (vals === 1) {
        /* One point is a value, not a trend. Show the value's position honestly on a flat
           guide rather than drawing a "line" that implies a direction we do not have. */
        line2(c.svg, pad, c.h / 2, c.w - pad, c.h / 2, {
          stroke: C_BORDER, 'stroke-width': 1, 'stroke-dasharray': '3 3'
        });
        el('circle', { cx: c.w / 2, cy: c.h / 2, r: 2.6, fill: color }, c.svg);
        c.aria((o.label ? o.label + ': ' : '') + 'one data point, ' + o.format(last) + ' — no trend yet');
        return;
      }

      var built = buildPath(pts, sx, sy, o.smooth);

      if (o.area && built.runs.length) {
        var ap = areaPath(built.runs, bot, o.smooth);
        if (ap) el('path', { d: ap, fill: fadeGradient(c, color, 0.30), stroke: 'none' }, c.svg);
      }

      var path = el('path', {
        d: built.d || null, fill: 'none', stroke: color, 'stroke-width': o.strokeWidth,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }, c.svg);

      for (i = 0; i < built.isolated.length; i++) {
        el('circle', { cx: built.isolated[i][0], cy: built.isolated[i][1], r: 2.2, fill: color }, c.svg);
      }

      var lastPt = null;
      for (i = pts.length - 1; i >= 0; i--) if (pts[i].y != null) { lastPt = pts[i]; break; }
      var dot = null;
      if (o.dot && lastPt) {
        dot = el('circle', {
          cx: sx(lastPt.x), cy: sy(lastPt.y), r: 2.6, fill: color,
          stroke: C_PANEL, 'stroke-width': 1.5
        }, c.svg);
      }

      /* Draw-on via stroke-dashoffset: supported everywhere, no CSS geometry-property support
         needed, and it cannot leave the path in a broken state if the tween is cancelled. */
      var len = safe(function () { return path.getTotalLength(); }, 0);
      if (len > 0) {
        path.setAttribute('stroke-dasharray', len);
        if (dot) dot.setAttribute('opacity', 0);
        c.animate(220, function (p) {
          path.setAttribute('stroke-dashoffset', len * (1 - p));
          if (dot) dot.setAttribute('opacity', p);
        });
      }

      var delta = div(last - first, Math.abs(first), null);
      c.aria((o.label ? o.label + ': ' : 'Trend: ') + vals + ' points, ' +
        o.format(first) + ' to ' + o.format(last) +
        (delta == null ? '' : ', ' + (delta >= 0 ? 'up ' : 'down ') + fmtPct(Math.abs(delta) * 100)));
    }
  });

  /* ══════════════════════════════════════════════════════════════════════════════════════
     2 · LINE  (multi-series, axes, grid, crosshair)
     ══════════════════════════════════════════════════════════════════════════════════════ */

  function normSeries(seriesSet, opts) {
    var raw = seriesSet;
    /* A bare points array is a single unnamed series — the common case for a one-metric card. */
    if (isArr(raw) && raw.length && !(raw[0] && (raw[0].points || raw[0].data || raw[0].values))) {
      raw = [{ name: (opts && opts.name) || '', points: raw }];
    }
    if (!isArr(raw)) raw = [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i] || {};
      out.push({
        name: s.name != null ? String(s.name) : ('Series ' + (i + 1)),
        color: s.color || COLORS[i % COLORS.length],
        dashed: !!s.dashed,
        area: s.area,
        width: s.width || 1.8,
        format: s.format || null,
        points: toPoints(s.points || s.data || s.values || [])
      });
    }
    return out;
  }

  var lineChart = makeChart({
    name: 'line',
    defaults: {
      height: 220, legend: true, area: null, smooth: true, yZero: true, yTicks: 4,
      grid: true, format: null, xFormat: null, dotsOnHover: true, empty: 'No data yet'
    },
    height: function (d, o) { return o.height || 220; },
    draw: function (c) {
      var o = c.opts;
      var series = normSeries(c.data, o);
      var valFmt = (o.format && o.format.y) || o.format || fmtNum;
      if (typeof valFmt !== 'function') valFmt = fmtNum;

      var pointSets = [], total = 0, i, j;
      for (i = 0; i < series.length; i++) { pointSets.push(series[i].points); total += countValues(series[i].points); }
      if (!series.length || total === 0) { c.empty(o.empty); return; }

      var timeX = isTimeSeries(pointSets);
      var xFmt = (o.format && o.format.x) || o.xFormat || (timeX ? fmtDay : function (v, p) {
        return p && p.xLabel != null ? p.xLabel : fmtNum(v);
      });

      /* union of x positions, ascending — the crosshair snaps to these */
      var xmap = {}, xlist = [];
      for (i = 0; i < series.length; i++) {
        var pts = series[i].points;
        for (j = 0; j < pts.length; j++) {
          var key = String(pts[j].x);
          if (!xmap[key]) { xmap[key] = { x: pts[j].x, label: xFmt(pts[j].xRaw, pts[j]), vals: {} }; xlist.push(xmap[key]); }
          if (pts[j].y != null) xmap[key].vals[i] = pts[j].y;
        }
      }
      xlist.sort(function (a, b) { return a.x - b.x; });

      if (xlist.length === 1) {
        drawSinglePoint(c, series, xlist[0], valFmt);
        return;
      }

      /* y domain */
      var lo = Infinity, hi = -Infinity, allY = [];
      for (i = 0; i < series.length; i++) {
        for (j = 0; j < series[i].points.length; j++) {
          var y = series[i].points[j].y;
          if (y == null) continue;
          allY.push(y);
          if (y < lo) lo = y; if (y > hi) hi = y;
        }
      }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      if (o.yZero && lo > 0) lo = 0;
      if (o.yMin != null) lo = num(o.yMin);
      if (o.yMax != null) hi = num(o.yMax);
      if (lo === hi) { hi = lo + (Math.abs(lo) > 0 ? Math.abs(lo) * 0.2 : 1); }

      var ticks = niceTicks(lo, hi, o.yTicks, allWhole(allY) ? 1 : 0);
      if (ticks.length && ticks[ticks.length - 1] > hi) hi = ticks[ticks.length - 1];
      if (ticks.length && ticks[0] < lo) lo = ticks[0];

      var tickLabels = [];
      for (i = 0; i < ticks.length; i++) tickLabels.push(valFmt(ticks[i]));
      var maxTickW = 0;
      for (i = 0; i < tickLabels.length; i++) maxTickW = Math.max(maxTickW, textW(tickLabels[i], 10));

      var showLegend = o.legend !== false && series.length > 1;
      var padT = (showLegend ? 22 : 8) + 4;
      var padR = 10, padB = 22;
      var padL = Math.min(72, Math.round(maxTickW) + 12);
      var plotW = Math.max(1, c.w - padL - padR);
      var plotH = Math.max(1, c.h - padT - padB);

      var sx = scaleLinear(xlist[0].x, xlist[xlist.length - 1].x, padL, padL + plotW);
      var sy = scaleLinear(lo, hi, padT + plotH, padT);

      if (showLegend) drawLegendRow(c, series, padL, 12);

      /* grid + y labels */
      if (o.grid !== false) {
        for (i = 0; i < ticks.length; i++) {
          var gy = Math.round(sy(ticks[i])) + 0.5;
          line2(c.svg, padL, gy, padL + plotW, gy, {
            stroke: C_BORDER, 'stroke-width': 1, 'stroke-opacity': ticks[i] === 0 ? 1 : 0.55
          });
          text(c.svg, tickLabels[i], {
            x: padL - 7, y: gy + midDy(10), 'text-anchor': 'end', 'font-size': 10, fill: C_MUTED
          });
        }
      }

      /* x labels, thinned so they can never collide */
      var maxLabels = Math.max(2, Math.floor(div(plotW, 72, 2)));
      var step = Math.max(1, Math.ceil(div(xlist.length, maxLabels, 1)));
      for (i = 0; i < xlist.length; i += step) {
        var lx = clamp(sx(xlist[i].x), padL, padL + plotW);
        text(c.svg, xlist[i].label, {
          x: lx, y: c.h - 6, 'text-anchor': i === 0 ? 'start' : (i + step >= xlist.length ? 'end' : 'middle'),
          'font-size': 10, fill: C_MUTED
        });
      }

      /* series */
      var paths = [];
      for (i = 0; i < series.length; i++) {
        var s = series[i];
        var built = buildPath(s.points, sx, sy, o.smooth);
        var wantArea = (s.area != null) ? s.area : (o.area != null ? o.area : series.length === 1);
        if (wantArea && built.runs.length) {
          var ap = areaPath(built.runs, padT + plotH, o.smooth);
          if (ap) el('path', { d: ap, fill: fadeGradient(c, s.color, 0.26), stroke: 'none' }, c.svg);
        }
        var p = el('path', {
          /* `d=""` is not a valid path and Chrome logs an error for it on every repaint. A
             series made only of isolated points legitimately produces no path. */
          d: built.d || null, fill: 'none', stroke: s.color, 'stroke-width': s.width,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          'stroke-dasharray': s.dashed ? '4 3' : null
        }, c.svg);
        if (built.d) paths.push(p);
        for (j = 0; j < built.isolated.length; j++) {
          el('circle', { cx: built.isolated[j][0], cy: built.isolated[j][1], r: 2.6, fill: s.color }, c.svg);
        }
      }

      /* crosshair layer */
      var cross = group(c.svg, { opacity: 0, 'pointer-events': 'none' });
      var vline = line2(cross, 0, padT, 0, padT + plotH, {
        stroke: C_MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.8
      });
      var dots = [];
      for (i = 0; i < series.length; i++) {
        dots.push(el('circle', {
          r: 3.4, fill: series[i].color, stroke: C_PANEL, 'stroke-width': 1.5, opacity: 0
        }, cross));
      }

      var hit = rect(c.svg, padL, padT, plotW, plotH, { fill: C_PANEL, 'fill-opacity': 0, 'class': 'cqc-hit' });
      hit.style.touchAction = 'pan-y';   // never swallow a vertical scroll on a phone
      hit.addEventListener('pointermove', function (e) {
        var pt = localPoint(c, e);
        var best = 0, bestD = Infinity;
        for (var k = 0; k < xlist.length; k++) {
          var d = Math.abs(sx(xlist[k].x) - pt.x);
          if (d < bestD) { bestD = d; best = k; }
        }
        var col = xlist[best];
        var cx = sx(col.x);
        cross.setAttribute('opacity', 1);
        vline.setAttribute('x1', cx); vline.setAttribute('x2', cx);
        var rows = [];
        for (var s2 = 0; s2 < series.length; s2++) {
          var v = col.vals[s2];
          if (v == null) { dots[s2].setAttribute('opacity', 0); }
          else {
            dots[s2].setAttribute('cx', cx);
            dots[s2].setAttribute('cy', sy(v));
            dots[s2].setAttribute('opacity', 1);
          }
          rows.push({
            color: series[s2].color,
            label: series[s2].name,
            /* An em dash, not 0. "No row for that day" and "zero that day" are different
               facts and the founder reads this table to tell them apart. */
            value: v == null ? '—' : (series[s2].format || valFmt)(v)
          });
        }
        c.tip.show({ title: col.label, rows: rows }, cx, sy(topOf(col, series)) - 4);
      });
      hit.addEventListener('pointerleave', function () {
        cross.setAttribute('opacity', 0);
        c.tip.hide();
      });

      function topOf(col, ser) {
        var top = null;
        for (var k = 0; k < ser.length; k++) {
          var v = col.vals[k];
          if (v == null) continue;
          if (top == null || v > top) top = v;
        }
        return top == null ? lo : top;
      }

      /* entry: wipe the plot in from the left */
      var clipId = uid('c');
      var cp = el('clipPath', { id: clipId }, c.defs());
      var cr = rect(cp, padL, padT - 6, plotW, plotH + 12, {});
      for (i = 0; i < paths.length; i++) paths[i].setAttribute('clip-path', 'url(#' + clipId + ')');
      c.animate(240, function (p) { cr.setAttribute('width', Math.max(0, plotW * p)); });

      var names = [];
      for (i = 0; i < series.length; i++) names.push(series[i].name);
      c.aria((o.label ? o.label + '. ' : '') + 'Line chart, ' + series.length + ' series (' +
        names.join(', ') + '), ' + xlist.length + ' points from ' + xlist[0].label + ' to ' +
        xlist[xlist.length - 1].label + '. Range ' + valFmt(lo) + ' to ' + valFmt(hi) + '.');
    }
  });

  function drawSinglePoint(c, series, col, valFmt) {
    /* One x position across every series: there is no line to draw. Say so, and still show the
       numbers — the founder should not have to open the table to learn today's value. */
    rect(c.svg, 0.5, 0.5, c.w - 1, c.h - 1, { fill: 'none', stroke: C_BORDER, 'stroke-dasharray': '4 4', rx: 8 });
    var parts = [];
    for (var i = 0; i < series.length; i++) {
      var v = col.vals[i];
      if (v == null) continue;
      parts.push({ name: series[i].name, color: series[i].color, value: valFmt(v) });
    }
    var y = c.h / 2 - (parts.length > 1 ? 12 : 4);
    text(c.svg, col.label + ' — only one data point, no trend yet', {
      x: c.w / 2, y: y, 'text-anchor': 'middle', 'font-size': 11, fill: C_MUTED
    });
    for (var k = 0; k < parts.length; k++) {
      text(c.svg, parts[k].name ? parts[k].name + ': ' + parts[k].value : parts[k].value, {
        x: c.w / 2, y: y + 18 + k * 15, 'text-anchor': 'middle', 'font-size': 12,
        fill: parts.length > 1 ? parts[k].color : C_TEXT, 'font-weight': 600
      });
    }
    c.aria('Only one data point (' + col.label + '); no trend yet.');
  }

  function drawLegendRow(c, series, x0, y) {
    var x = x0;
    for (var i = 0; i < series.length; i++) {
      var lbl = clip(series[i].name, 22);
      var wNeeded = 10 + textW(lbl, 10) + 14;
      if (x + wNeeded > c.w - 4) break;      // never let the legend push past the panel edge
      rect(c.svg, x, y - 5, 8, 8, { fill: series[i].color, rx: 2 });
      text(c.svg, lbl, { x: x + 12, y: y + midDy(10), 'font-size': 10, fill: C_MUTED });
      x += wNeeded;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     3 · BARS  (vertical / horizontal, optional stacking)
     ══════════════════════════════════════════════════════════════════════════════════════ */

  function normBars(data, o) {
    var raw = isArr(data) ? data : [];
    var rows = [], keyColor = {}, keyOrder = [], i, k;

    function colorFor(key, idx, explicit) {
      if (explicit) return explicit;
      if (o.colors && o.colors[key]) return o.colors[key];
      if (!keyColor[key]) {
        keyColor[key] = o.color && keyOrder.length === 0 ? o.color : COLORS[keyOrder.length % COLORS.length];
        keyOrder.push(key);
      }
      return keyColor[key];
    }

    for (i = 0; i < raw.length; i++) {
      var d = raw[i];
      if (d == null) continue;
      var label, segs = [], meta = d;
      if (typeof d === 'number') { label = String(i + 1); segs = [{ key: 'value', value: num(d), color: o.color || COLORS[0] }]; }
      else {
        label = d.label != null ? String(d.label) : (d.key != null ? String(d.key) : String(i + 1));
        if (isArr(d.segments)) {
          for (k = 0; k < d.segments.length; k++) {
            var sg = d.segments[k] || {};
            var kk = sg.key != null ? String(sg.key) : ('s' + k);
            segs.push({ key: kk, value: Math.max(0, num(sg.value) || 0), color: colorFor(kk, k, sg.color) });
          }
        } else if (d.values && typeof d.values === 'object') {
          var keys = o.keys || Object.keys(d.values);
          for (k = 0; k < keys.length; k++) {
            segs.push({
              key: String(keys[k]), value: Math.max(0, num(d.values[keys[k]]) || 0),
              color: colorFor(String(keys[k]), k, null)
            });
          }
        } else {
          segs = [{ key: 'value', value: Math.max(0, num(d.value) || 0), color: d.color || o.color || COLORS[0] }];
        }
      }
      var tot = 0;
      for (k = 0; k < segs.length; k++) tot += segs[k].value;
      rows.push({ label: label, segments: segs, total: tot, meta: meta });
    }
    return rows;
  }

  var bars = makeChart({
    name: 'bars',
    defaults: {
      height: 200, horizontal: false, stacked: false, showValues: true, grid: true,
      rowHeight: 22, rowGap: 8, maxBarWidth: 44, format: fmtNum, legend: null,
      empty: 'No data yet', labelChars: 18
    },
    height: function (d, o, w) {
      if (o.horizontal) {
        var rows = normBars(d, o);
        if (!rows.length) return o.height || 120;
        /* Horizontal bars size themselves to the data — a build table with three rows should
           not leave a 200px hole, and one with twenty should not scroll inside its panel. */
        return rows.length * (o.rowHeight + o.rowGap) + 6 + legendRowsHeight(rows, o);
      }
      void w;
      return o.height || 200;
    },
    draw: function (c) {
      var o = c.opts;
      var rows = normBars(c.data, o);
      var fmt = typeof o.format === 'function' ? o.format : fmtNum;
      if (!rows.length) { c.empty(o.empty); return; }

      var stacked = o.stacked || rows.some(function (r) { return r.segments.length > 1; });
      var max = num(o.max);
      if (max == null) { max = 0; for (var i = 0; i < rows.length; i++) max = Math.max(max, rows[i].total); }
      /* All-zero data is a real answer ("nobody yet"), not an empty state: keep the categories
         visible so the founder can see WHICH buckets are empty. Force the domain to 1 so the
         scale cannot divide by zero. */
      var domainMax = max > 0 ? max : 1;

      var keys = legendKeys(rows, o);
      var showLegend = (o.legend === true) || (o.legend !== false && stacked && keys.length > 1);

      if (o.horizontal) drawBarsH(c, rows, domainMax, fmt, showLegend, keys);
      else drawBarsV(c, rows, domainMax, fmt, showLegend, keys);

      var parts = [];
      for (var r = 0; r < rows.length && r < 8; r++) parts.push(rows[r].label + ' ' + fmt(rows[r].total));
      c.aria((o.label ? o.label + '. ' : '') + 'Bar chart, ' + rows.length + ' categories: ' +
        parts.join(', ') + (rows.length > 8 ? ', and ' + (rows.length - 8) + ' more' : '') + '.');
    }
  });

  function legendKeys(rows, o) {
    var seen = {}, out = [];
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].segments.length; j++) {
        var s = rows[i].segments[j];
        if (seen[s.key]) continue;
        seen[s.key] = 1;
        out.push({ name: (o.keyLabels && o.keyLabels[s.key]) || s.key, color: s.color });
      }
    }
    return out;
  }
  function legendRowsHeight(rows, o) {
    var keys = legendKeys(rows, o);
    var show = (o.legend === true) || (o.legend !== false && keys.length > 1 &&
      (o.stacked || rows.some(function (r) { return r.segments.length > 1; })));
    return show ? 18 : 0;
  }

  function drawBarsV(c, rows, max, fmt, showLegend, keys) {
    var o = c.opts;
    var ticks = o.grid === false ? [] : niceTicks(0, max, 4, wholeRows(rows) ? 1 : 0);
    var labels = [], i, j;
    for (i = 0; i < ticks.length; i++) labels.push(fmt(ticks[i]));
    var maxTickW = 0;
    for (i = 0; i < labels.length; i++) maxTickW = Math.max(maxTickW, textW(labels[i], 10));

    var padT = (showLegend ? 20 : 4) + (o.showValues ? 12 : 4);
    var padB = 20, padR = 8;
    var padL = ticks.length ? Math.min(64, Math.round(maxTickW) + 10) : 4;
    var plotW = Math.max(1, c.w - padL - padR);
    var plotH = Math.max(1, c.h - padT - padB);
    var base = padT + plotH;
    var sy = scaleLinear(0, max, base, padT);

    if (showLegend) drawLegendRow(c, keys, padL, 10);

    for (i = 0; i < ticks.length; i++) {
      var gy = Math.round(sy(ticks[i])) + 0.5;
      line2(c.svg, padL, gy, padL + plotW, gy, {
        stroke: C_BORDER, 'stroke-width': 1, 'stroke-opacity': ticks[i] === 0 ? 1 : 0.55
      });
      text(c.svg, labels[i], { x: padL - 6, y: gy + midDy(10), 'text-anchor': 'end', 'font-size': 10, fill: C_MUTED });
    }

    var slot = div(plotW, rows.length, plotW);
    var bw = Math.max(3, Math.min(o.maxBarWidth, slot * 0.68));
    var labelEvery = Math.max(1, Math.ceil(div(rows.length, Math.max(1, Math.floor(div(plotW, 46, 1))), 1)));
    var grown = [];

    for (i = 0; i < rows.length; i++) {
      var cx = padL + slot * (i + 0.5);
      var x = cx - bw / 2;
      var acc = 0;
      for (j = 0; j < rows[i].segments.length; j++) {
        var sg = rows[i].segments[j];
        var y0 = sy(acc + sg.value), y1 = sy(acc);
        var sh = Math.max(sg.value > 0 ? 1 : 0, y1 - y0);
        grown.push({ n: rect(c.svg, x, y0, bw, sh, { fill: sg.color, rx: Math.min(3, bw / 3) }), y: y0, h: sh });
        acc += sg.value;
      }
      if (rows[i].total <= 0) {
        rect(c.svg, x, base - 2, bw, 2, { fill: C_BORDER, rx: 1 });   // a visible "zero" floor
      }

      (function (row, bx) {
        var hitR = rect(c.svg, bx - slot * 0.16, padT, bw + slot * 0.32, plotH, { fill: C_PANEL, 'fill-opacity': 0 });
        hoverable(c, hitR, function () {
          var trows = [];
          for (var k = 0; k < row.segments.length; k++) {
            trows.push({
              color: row.segments[k].color,
              label: (o.keyLabels && o.keyLabels[row.segments[k].key]) || row.segments[k].key,
              value: fmt(row.segments[k].value)
            });
          }
          if (row.segments.length > 1) trows.push({ label: 'Total', value: fmt(row.total) });
          return { title: row.label, rows: trows };
        }, { click: o.onSelect ? function () { o.onSelect(row.meta, row); } : null });
      }(rows[i], x));

      if (o.showValues && rows[i].total > 0) {
        text(c.svg, fmt(rows[i].total), {
          x: cx, y: sy(rows[i].total) - 5, 'text-anchor': 'middle', 'font-size': 10,
          fill: C_TEXT, 'font-weight': 600
        });
      }
      if (i % labelEvery === 0) {
        text(c.svg, clip(rows[i].label, Math.max(3, Math.floor(div(slot * labelEvery, 6, 3)))), {
          x: cx, y: c.h - 6, 'text-anchor': 'middle', 'font-size': 10, fill: C_MUTED
        });
      }
    }

    /* Bars grow out of the baseline by rewriting y/height, not with a CSS transform:
       transform-origin on SVG elements is the one place Safari and Chrome still disagree
       enough to be worth avoiding entirely. ONE tween — two overlapping c.animate() calls
       fight over the same rAF slot and leave bars stuck at a random height. */
    c.animate(200, function (p) {
      for (var k = 0; k < grown.length; k++) {
        var g = grown[k];
        g.n.setAttribute('height', Math.max(0, g.h * p));
        g.n.setAttribute('y', g.y + g.h * (1 - p));
      }
    });
  }

  function wholeRows(rows) {
    var vals = [];
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].segments.length; j++) vals.push(rows[i].segments[j].value);
    }
    return allWhole(vals);
  }

  function drawBarsH(c, rows, max, fmt, showLegend, keys) {
    var o = c.opts;
    var i, j;
    var labelChars = o.labelChars;
    var labelW = 0;
    for (i = 0; i < rows.length; i++) labelW = Math.max(labelW, textW(clip(rows[i].label, labelChars), 11));
    labelW = Math.min(Math.max(48, Math.round(labelW) + 10), Math.round(c.w * 0.4));

    var valW = o.showValues ? 46 : 6;
    var x0 = labelW, plotW = Math.max(1, c.w - labelW - valW);
    var top = showLegend ? 18 : 0;
    var rowH = o.rowHeight, gap = o.rowGap;

    if (showLegend) drawLegendRow(c, keys, x0, 9);

    var grown = [];
    for (i = 0; i < rows.length; i++) {
      var y = top + i * (rowH + gap);
      var barY = y + 2, barH = rowH - 4;

      text(c.svg, clip(rows[i].label, labelChars), {
        x: labelW - 8, y: barY + barH / 2 + midDy(11), 'text-anchor': 'end',
        'font-size': 11, fill: C_TEXT
      });
      rect(c.svg, x0, barY, plotW, barH, { fill: C_BORDER, 'fill-opacity': 0.35, rx: 3 });

      var acc = 0;
      for (j = 0; j < rows[i].segments.length; j++) {
        var sg = rows[i].segments[j];
        var sxp = x0 + plotW * div(acc, max, 0);
        var wpx = plotW * div(sg.value, max, 0);
        var node = rect(c.svg, sxp, barY, wpx, barH, { fill: sg.color, rx: 3 });
        grown.push({ n: node, w: wpx });
        acc += sg.value;
      }

      if (o.showValues) {
        text(c.svg, fmt(rows[i].total), {
          x: c.w - 4, y: barY + barH / 2 + midDy(11), 'text-anchor': 'end',
          'font-size': 11, fill: C_TEXT, 'font-weight': 600
        });
      }

      (function (row) {
        var hitR = rect(c.svg, 0, y, c.w, rowH + gap, { fill: C_PANEL, 'fill-opacity': 0 });
        hoverable(c, hitR, function () {
          var trows = [];
          for (var k = 0; k < row.segments.length; k++) {
            trows.push({
              color: row.segments[k].color,
              label: (o.keyLabels && o.keyLabels[row.segments[k].key]) || row.segments[k].key,
              value: fmt(row.segments[k].value)
            });
          }
          if (row.segments.length > 1) trows.push({ label: 'Total', value: fmt(row.total) });
          return { title: row.label, rows: trows };
        }, { click: o.onSelect ? function () { o.onSelect(row.meta, row); } : null });
      }(rows[i]));
    }

    c.animate(200, function (p) {
      for (var k = 0; k < grown.length; k++) grown[k].n.setAttribute('width', Math.max(0, grown[k].w * p));
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     4 · DONUT
     ══════════════════════════════════════════════════════════════════════════════════════ */

  function normSlices(data, o) {
    var out = [], i;
    if (isArr(data)) {
      for (i = 0; i < data.length; i++) {
        var d = data[i];
        if (d == null) continue;
        out.push({
          label: d.label != null ? String(d.label) : String(i + 1),
          value: Math.max(0, num(d.value) || 0),
          color: d.color || (o.colors && o.colors[d.label]) || COLORS[out.length % COLORS.length],
          meta: d
        });
      }
    } else if (data && typeof data === 'object') {
      /* The model hands out plain maps — tech.device, surveys.continue_dist — so accept them
         directly rather than making every caller write the same transform. */
      var keys = o.keys || Object.keys(data);
      for (i = 0; i < keys.length; i++) {
        out.push({
          label: String(keys[i]),
          value: Math.max(0, num(data[keys[i]]) || 0),
          color: (o.colors && o.colors[keys[i]]) || COLORS[out.length % COLORS.length],
          meta: { label: keys[i], value: data[keys[i]] }
        });
      }
    }
    if (o.sort) out.sort(function (a, b) { return b.value - a.value; });
    return out;
  }

  function donutLayout(data, o, w) {
    /* Zero-value categories keep their legend row but get no arc. "not_interested: 0" is one
       of the most reassuring lines on the whole dashboard — dropping it because it is zero
       would hide the answer the founder is looking for. */
    var all = normSlices(data, o);
    var slices = [];
    for (var i = 0; i < all.length; i++) if (all[i].value > 0) slices.push(all[i]);
    var size = o.size || 150;
    var legend = o.legend !== false && all.length > 0;
    var side = legend && w >= 320;
    var legendH = legend && !side ? all.length * 17 + 8 : 0;
    var h = o.height || Math.max(size, legend && side ? all.length * 17 + 8 : 0) + legendH + 8;
    return { all: all, slices: slices, size: size, legend: legend, side: side, h: h };
  }

  var donut = makeChart({
    name: 'donut',
    defaults: {
      size: 150, thickness: 0.30, legend: true, sort: false, format: fmtNum,
      empty: 'No data yet', centerLabel: null, centerValue: null, showPct: true
    },
    height: function (d, o, w) { return donutLayout(d, o, w).h; },
    draw: function (c) {
      var o = c.opts;
      var L = donutLayout(c.data, o, c.w);
      var slices = L.slices, all = L.all;
      var fmt = typeof o.format === 'function' ? o.format : fmtNum;
      var total = 0, i;
      for (i = 0; i < slices.length; i++) total += slices[i].value;
      if (!slices.length || total <= 0) { c.empty(o.empty); return; }

      var size = Math.min(L.size, c.h - (L.side ? 8 : (all.length * 17 + 16)), c.w - 8);
      size = Math.max(60, size);
      var stroke = Math.max(8, size * o.thickness);
      var r = (size - stroke) / 2;
      var cx = L.side ? (r + stroke / 2 + 4) : c.w / 2;
      var cy = r + stroke / 2 + 4;
      var CIRC = 2 * Math.PI * r;

      /* Rotate the whole ring so slice one starts at twelve o'clock instead of three. */
      var g = group(c.svg, { transform: 'rotate(-90 ' + r2(cx) + ' ' + r2(cy) + ')' });

      el('circle', {
        cx: cx, cy: cy, r: r, fill: 'none', stroke: C_BORDER, 'stroke-opacity': 0.45,
        'stroke-width': stroke
      }, g);

      var acc = 0, arcs = [];
      for (i = 0; i < slices.length; i++) {
        var frac = div(slices[i].value, total, 0);
        var len = CIRC * frac;
        var arc = el('circle', {
          cx: cx, cy: cy, r: r, fill: 'none', stroke: slices[i].color,
          'stroke-width': stroke,
          /* dasharray + a negative dashoffset places the arc: no arc-path maths, and — the real
             reason — a single 100% slice renders as a clean full ring instead of the
             degenerate zero-length arc that `A` commands produce at exactly 360°. */
          'stroke-dasharray': r2(len) + ' ' + r2(CIRC - len),
          'stroke-dashoffset': r2(-acc * CIRC)
        }, g);
        arcs.push({ n: arc, len: len, circ: CIRC });
        (function (s, node, f) {
          hoverable(c, node, function () {
            return {
              title: s.label,
              rows: [{ color: s.color, label: 'Players', value: fmt(s.value) },
                     { label: 'Share', value: fmtPct(f * 100, f < 0.1 ? 1 : 0) }]
            };
          }, { click: o.onSelect ? function () { o.onSelect(s.meta, s); } : null });
        }(slices[i], arc, frac));
        acc += frac;
      }

      c.animate(240, function (p) {
        for (var k = 0; k < arcs.length; k++) {
          arcs[k].n.setAttribute('stroke-dasharray',
            r2(arcs[k].len * p) + ' ' + r2(arcs[k].circ - arcs[k].len * p));
        }
      });

      var cv = o.centerValue != null ? String(o.centerValue) : fmt(total);
      var cl = o.centerLabel != null ? String(o.centerLabel) : '';
      text(c.svg, cv, {
        x: cx, y: cy + (cl ? -2 : midDy(20)), 'text-anchor': 'middle', 'font-size': Math.min(22, r * 0.62),
        fill: C_TEXT, 'font-weight': 700
      });
      if (cl) {
        text(c.svg, clip(cl, 16), {
          x: cx, y: cy + 14, 'text-anchor': 'middle', 'font-size': 10, fill: C_MUTED
        });
      }

      if (L.legend) {
        var lx = L.side ? cx + r + stroke / 2 + 16 : 8;
        var ly = L.side ? Math.max(10, cy - all.length * 17 / 2 + 8) : (cy + r + stroke / 2 + 16);
        var availW = c.w - lx - 8;
        for (i = 0; i < all.length; i++) {
          var yy = ly + i * 17;
          rect(c.svg, lx, yy - 5, 8, 8, {
            fill: all[i].color, rx: 2, 'fill-opacity': all[i].value > 0 ? 1 : 0.35
          });
          var pctStr = o.showPct ? fmtPct(div(all[i].value, total, 0) * 100) : '';
          /* "18 · 72%", not "18 72%" — without the separator the pair reads as one number. */
          var valStr = fmt(all[i].value) + (pctStr ? ' · ' + pctStr : '');
          var room = Math.max(4, Math.floor(div(availW - textW(valStr, 10) - 20, 6, 4)));
          text(c.svg, clip(all[i].label, room), {
            x: lx + 13, y: yy + midDy(11), 'font-size': 11, fill: C_MUTED
          });
          text(c.svg, valStr, {
            x: c.w - 6, y: yy + midDy(11), 'text-anchor': 'end', 'font-size': 11,
            fill: all[i].value > 0 ? C_TEXT : C_MUTED, 'font-weight': 600
          });
        }
      }

      var summary = [];
      for (i = 0; i < all.length && i < 6; i++) {
        summary.push(all[i].label + ' ' + fmt(all[i].value) + ' (' +
          fmtPct(div(all[i].value, total, 0) * 100) + ')');
      }
      c.aria((o.label ? o.label + '. ' : '') + 'Donut chart of ' + fmt(total) + ' total: ' +
        summary.join(', ') + '.');
    }
  });

  /* ══════════════════════════════════════════════════════════════════════════════════════
     5 · FUNNEL — the hero chart
     ------------------------------------------------------------------------------------
     Consumes BetaModel `funnel` rows verbatim:
       { key, label, instrumented, players, pct_of_top, kept_from_prev_pct,
         drop_players, drop_pct, median_seconds_from_start, is_bottleneck }

     NOTHING here is recomputed. The model owns the maths — including the monotonic pass that
     stops "kept from previous" exceeding 100% — and a chart that quietly re-derived a number
     would be a second, disagreeing engine hiding inside the UI.

     Each row is a stacked horizontal bar against a full-width track:
       solid  = players still here
       faint  = players lost since the previous INSTRUMENTED stage
       track  = everyone who ever landed
     `instrumented:false` rows are hatched, carry a "not instrumented" pill, and show no
     numbers at all — they must never manufacture a 100% drop-off (contract §1).
     An instrumented stage sitting at 0 after a non-empty stage gets a "check instrumentation"
     pill in amber instead of a red drop, because at this scale that is more often a broken
     origin allowlist than a broken game (contract §0.8).
     ══════════════════════════════════════════════════════════════════════════════════════ */

  var ROW_H = 50;          // meta line + bar + breathing room
  var BAR_H = 22;

  function normFunnel(stages) {
    var raw = isArr(stages) ? stages : [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i] || {};
      out.push({
        key: s.key != null ? String(s.key) : ('stage' + i),
        label: s.label != null ? String(s.label) : String(s.key || ('Stage ' + (i + 1))),
        instrumented: s.instrumented !== false,
        players: num(s.players),
        pct_of_top: num(s.pct_of_top),
        kept_from_prev_pct: num(s.kept_from_prev_pct),
        drop_players: num(s.drop_players),
        drop_pct: num(s.drop_pct),
        median_seconds_from_start: num(s.median_seconds_from_start),
        is_bottleneck: !!s.is_bottleneck,
        src: s
      });
    }
    return out;
  }

  var funnel = makeChart({
    name: 'funnel',
    defaults: {
      rowHeight: ROW_H, barHeight: BAR_H, color: C_BLUE, empty: 'No funnel data yet',
      showTime: true, onSelect: null
    },
    height: function (d, o) {
      var rows = normFunnel(d);
      if (!rows.length) return 120;
      return rows.length * (o.rowHeight || ROW_H) + 6;
    },
    draw: function (c) {
      var o = c.opts;
      var rows = normFunnel(c.data);
      if (!rows.length) { c.empty(o.empty); return; }

      var rowH = o.rowHeight || ROW_H, barH = o.barHeight || BAR_H;
      var top = rows[0];
      var topPlayers = top.players != null ? top.players : 0;

      /* Width comes from pct_of_top when the model supplies it and falls back to the raw
         player ratio only if it does not — never the other way round, so the bar and the
         printed percentage can never disagree. */
      function widthFrac(s) {
        if (s.pct_of_top != null) return clamp(s.pct_of_top / 100, 0, 1);
        return clamp(div(s.players, topPlayers, 0), 0, 1);
      }

      var x0 = 0, plotW = c.w;
      var hatchFill = null, amberHatch = null;
      var grown = [], i;

      for (i = 0; i < rows.length; i++) {
        var s = rows[i];
        var y = i * rowH;
        var barY = y + 18;

        /* previous INSTRUMENTED stage — uninstrumented rows are excluded from drop-off maths,
           so the lost region has to reach back past them or it invents a loss (contract §1). */
        var prev = null;
        for (var j = i - 1; j >= 0; j--) if (rows[j].instrumented) { prev = rows[j]; break; }

        var frac = s.instrumented ? widthFrac(s) : (prev ? widthFrac(prev) : 1);
        var wpx = plotW * frac;
        var prevW = prev ? plotW * widthFrac(prev) : plotW;

        /* ── meta line ──
           Label on the left, stats right-aligned on the same line. On a narrow panel the two
           WILL collide, and overlapping text is how a dashboard stops being trusted, so the
           stats are built as ranked parts and dropped from the tail until they fit. The
           player count is never dropped — everything after it is context. */
        var metaW = 0, meta = '';
        if (s.instrumented) {
          var parts = [fmtNum(s.players) + (s.players === 1 ? ' player' : ' players')];
          if (s.pct_of_top != null) parts.push(fmtPct(s.pct_of_top) + ' of top');
          if (s.kept_from_prev_pct != null) parts.push(fmtPct(s.kept_from_prev_pct) + ' kept');
          /* `!= null`, not truthiness: 0 is a real value here (the landing stage happens at
             t=0) and a truthy test would blank the one row we are surest about. */
          if (o.showTime && s.median_seconds_from_start != null) {
            parts.push(fmtDuration(s.median_seconds_from_start) + ' in');
          }
          var labelRoom = Math.min(textW(s.label, 11.5), 96);   // never starve the label away
          meta = parts.join(' · ');
          while (parts.length > 1 && textW(meta, 10.5) > plotW - labelRoom - 12) {
            parts.pop();
            meta = parts.join(' · ');
          }
          metaW = textW(meta, 10.5);
        } else {
          metaW = textW('not instrumented', 9) + 12;
        }

        text(c.svg, clip(s.label, Math.max(6, Math.floor(div(plotW - metaW - 12, 6.4, 6)))), {
          x: x0, y: y + 11, 'font-size': 11.5, fill: s.instrumented ? C_TEXT : C_MUTED,
          'font-weight': 600
        });
        if (s.instrumented) {
          text(c.svg, meta, {
            x: c.w, y: y + 11, 'text-anchor': 'end', 'font-size': 10.5, fill: C_MUTED
          });
        } else {
          drawPill(c, c.w, y + 11, 'not instrumented', C_MUTED, 'end');
        }

        /* ── track ── */
        rect(c.svg, x0, barY, plotW, barH, { fill: C_BORDER, 'fill-opacity': 0.3, rx: 4 });

        if (!s.instrumented) {
          if (!hatchFill) hatchFill = hatch(c, C_MUTED, 0.32);
          rect(c.svg, x0, barY, wpx, barH, { fill: hatchFill, rx: 4 });
          rect(c.svg, x0 + 0.5, barY + 0.5, Math.max(0, wpx - 1), barH - 1, {
            fill: 'none', stroke: C_BORDER, 'stroke-dasharray': '3 3', rx: 4
          });
          hoverable(c, rect(c.svg, 0, y, c.w, rowH, { fill: C_PANEL, 'fill-opacity': 0 }), {
            title: s.label,
            rows: [{ label: 'Not instrumented', value: '' },
                   { label: 'No event exists for this step', value: '' },
                   { label: 'Excluded from drop-off maths', value: '' }]
          });
          continue;
        }

        /* ── lost region: from this stage's width out to the previous stage's width ── */
        var brokenInstrumentation = (s.players === 0 && prev && prev.players > 0);
        if (prev && prevW > wpx + 0.5) {
          if (brokenInstrumentation) {
            /* Amber hatch, not a red block. A stage reading 0 on a ten-person beta is more
               often a dead origin allowlist or an unfired poll than a wall players hit. */
            if (!amberHatch) amberHatch = hatch(c, C_AMBER, 0.4);
            rect(c.svg, x0 + wpx, barY, prevW - wpx, barH, { fill: amberHatch, rx: 4 });
          } else {
            rect(c.svg, x0 + wpx, barY, prevW - wpx, barH, {
              fill: C_RED, 'fill-opacity': 0.16, rx: 4
            });
          }
          var chip = brokenInstrumentation
            ? 'check instrumentation'
            : '−' + fmtNum(s.drop_players != null ? s.drop_players : (prev.players - s.players)) +
              (s.drop_pct != null ? ' (' + fmtPct(s.drop_pct) + ')' : '');
          var chipW = textW(chip, 10) + 4;
          var gapW = prevW - wpx;
          /* Drop chips sit inside the lost region where there is room. The instrumentation
             warning is the exception: its region is hatched, and amber text on a diagonal
             texture is exactly the kind of "nearly readable" that gets skipped over. */
          var cxp = (gapW >= chipW + 12 && !brokenInstrumentation)
            ? x0 + prevW - 6
            : Math.min(c.w - 4, x0 + prevW + chipW + 10);
          text(c.svg, chip, {
            x: cxp, y: barY + barH / 2 + midDy(10), 'text-anchor': 'end', 'font-size': 10,
            fill: brokenInstrumentation ? C_AMBER : C_RED, 'font-weight': 600
          });
        }

        /* ── kept region ── */
        var barNode = rect(c.svg, x0, barY, wpx, barH, {
          fill: o.color,
          /* Fade gently down the funnel so depth is legible at a glance; floored at 0.55 so
             the last stage is never too dim to read the count against. */
          'fill-opacity': Math.max(0.55, 1 - i * 0.045),
          rx: 4
        });
        grown.push({ n: barNode, w: wpx });

        if (s.is_bottleneck) {
          rect(c.svg, x0 + 0.5, barY - 1.5, plotW - 1, barH + 3, {
            fill: 'none', stroke: C_AMBER, 'stroke-width': 1, rx: 5, 'stroke-opacity': 0.9
          });
        }

        /* count, inside the bar when it fits, just outside when it does not */
        var cnt = fmtNum(s.players);
        var cntW = textW(cnt, 11) + 14;
        if (s.players > 0) {
          if (wpx >= cntW) {
            text(c.svg, cnt, {
              x: x0 + wpx - 7, y: barY + barH / 2 + midDy(11), 'text-anchor': 'end',
              'font-size': 11, fill: C_PANEL, 'font-weight': 700
            });
          } else {
            text(c.svg, cnt, {
              x: x0 + wpx + 6, y: barY + barH / 2 + midDy(11), 'font-size': 11,
              fill: C_TEXT, 'font-weight': 700
            });
          }
        }

        (function (stage, isBroken) {
          var hit = rect(c.svg, 0, y, c.w, rowH, { fill: C_PANEL, 'fill-opacity': 0 });
          hoverable(c, hit, function () {
            var tr = [{ color: o.color, label: 'Players', value: fmtNum(stage.players) }];
            if (stage.pct_of_top != null) tr.push({ label: 'Of top of funnel', value: fmtPct(stage.pct_of_top) });
            if (stage.kept_from_prev_pct != null) tr.push({ label: 'Kept from previous', value: fmtPct(stage.kept_from_prev_pct) });
            if (stage.drop_players) {
              tr.push({
                color: isBroken ? C_AMBER : C_RED, label: 'Lost here',
                value: fmtNum(stage.drop_players) + (stage.drop_pct != null ? ' (' + fmtPct(stage.drop_pct) + ')' : '')
              });
            }
            if (stage.median_seconds_from_start != null) {
              tr.push({ label: 'Median time from start', value: fmtDuration(stage.median_seconds_from_start) });
            }
            if (isBroken) tr.push({ color: C_AMBER, label: 'Zero players — check instrumentation before blaming the game', value: '' });
            if (stage.is_bottleneck) tr.push({ color: C_AMBER, label: 'Biggest drop-off in the funnel', value: '' });
            return { title: stage.label, rows: tr };
          }, { click: o.onSelect ? function () { o.onSelect(stage.src, stage); } : null });
        }(s, brokenInstrumentation));
      }

      c.animate(240, function (p) {
        for (var k = 0; k < grown.length; k++) grown[k].n.setAttribute('width', Math.max(0, grown[k].w * p));
      });

      /* aria: the funnel in one sentence, including the bottleneck if the model named one */
      var bits = [], bn = null;
      for (i = 0; i < rows.length; i++) {
        if (!rows[i].instrumented) { bits.push(rows[i].label + ' not instrumented'); continue; }
        bits.push(rows[i].label + ' ' + fmtNum(rows[i].players) + ' players' +
          (rows[i].pct_of_top != null ? ' (' + fmtPct(rows[i].pct_of_top) + ')' : ''));
        if (rows[i].is_bottleneck) bn = rows[i];
      }
      c.aria('Funnel, ' + rows.length + ' stages: ' + bits.join('; ') + '.' +
        (bn ? ' Biggest drop-off at ' + bn.label + ', ' + fmtNum(bn.drop_players) + ' players lost.' : ''));
    }
  });

  function drawPill(c, x, y, label, color, anchor) {
    var w = textW(label, 9) + 12;
    var px = anchor === 'end' ? x - w : x;
    rect(c.svg, px, y - 9, w, 13, {
      fill: color, 'fill-opacity': 0.14, stroke: color, 'stroke-opacity': 0.45, rx: 6.5
    });
    text(c.svg, label, {
      x: px + w / 2, y: y - 2.5 + midDy(9), 'text-anchor': 'middle', 'font-size': 9,
      fill: color, 'font-weight': 600
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     6 · HEATMAP  (day × stage intensity)
     ══════════════════════════════════════════════════════════════════════════════════════ */

  function normGrid(grid, o) {
    var rows = [], cols = [], values = [], i, j;
    if (isArr(grid)) {
      /* [{row, col, value}] — the shape you get from a group-by. */
      var rIdx = {}, cIdx = {};
      for (i = 0; i < grid.length; i++) {
        var g = grid[i] || {};
        var rk = String(g.row != null ? g.row : g.stage != null ? g.stage : '');
        var ck = String(g.col != null ? g.col : g.day != null ? g.day : '');
        if (rIdx[rk] == null) { rIdx[rk] = rows.length; rows.push(rk); }
        if (cIdx[ck] == null) { cIdx[ck] = cols.length; cols.push(ck); }
      }
      if (o.rows) rows = o.rows.map(String);
      if (o.cols) cols = o.cols.map(String);
      for (i = 0; i < rows.length; i++) { values[i] = []; for (j = 0; j < cols.length; j++) values[i][j] = null; }
      for (i = 0; i < grid.length; i++) {
        var gg = grid[i] || {};
        var r = rows.indexOf(String(gg.row != null ? gg.row : gg.stage));
        var cc = cols.indexOf(String(gg.col != null ? gg.col : gg.day));
        if (r >= 0 && cc >= 0) values[r][cc] = num(gg.value);
      }
    } else if (grid && typeof grid === 'object') {
      rows = (grid.rows || o.rows || []).map(String);
      cols = (grid.cols || o.cols || []).map(String);
      var vv = grid.values || [];
      for (i = 0; i < rows.length; i++) {
        values[i] = [];
        for (j = 0; j < cols.length; j++) {
          values[i][j] = (vv[i] && vv[i][j] !== undefined) ? num(vv[i][j]) : null;
        }
      }
    }
    return { rows: rows, cols: cols, values: values };
  }

  var heatmap = makeChart({
    name: 'heatmap',
    defaults: {
      cellHeight: 22, cellGap: 2, color: C_GREEN, format: fmtNum, colFormat: fmtDay,
      legend: true, empty: 'No data yet', labelChars: 22, rowLabelWidth: null
    },
    height: function (d, o) {
      var G = normGrid(d, o);
      if (!G.rows.length || !G.cols.length) return 120;
      return 18 + G.rows.length * (o.cellHeight + o.cellGap) + (o.legend === false ? 6 : 22);
    },
    draw: function (c) {
      var o = c.opts;
      var G = normGrid(c.data, o);
      var fmt = typeof o.format === 'function' ? o.format : fmtNum;
      var colFmt = typeof o.colFormat === 'function' ? o.colFormat : function (v) { return String(v); };
      if (!G.rows.length || !G.cols.length) { c.empty(o.empty); return; }

      var i, j, v;
      var max = num(o.max);
      if (max == null) {
        max = 0;
        for (i = 0; i < G.values.length; i++) {
          for (j = 0; j < G.values[i].length; j++) { v = G.values[i][j]; if (v != null && v > max) max = v; }
        }
      }

      var labelW = 0;
      for (i = 0; i < G.rows.length; i++) labelW = Math.max(labelW, textW(clip(G.rows[i], o.labelChars), 10.5));
      labelW = o.rowLabelWidth != null ? o.rowLabelWidth
        : Math.min(Math.max(56, Math.round(labelW) + 10), Math.round(c.w * 0.42));

      var gap = o.cellGap, ch = o.cellHeight;
      var gridW = Math.max(1, c.w - labelW - 2);
      var cw = div(gridW, G.cols.length, gridW);
      var topLabelY = 10;
      var y0 = 18;

      /* Column labels are thinned rather than rotated — a rotated label on the last column
         always overhangs the panel, and thinning degrades gracefully from 7 days to 90. */
      var every = Math.max(1, Math.ceil(div(G.cols.length, Math.max(1, Math.floor(div(gridW, 46, 1))), 1)));
      for (j = 0; j < G.cols.length; j += every) {
        text(c.svg, colFmt(G.cols[j]), {
          x: labelW + cw * (j + 0.5), y: topLabelY, 'text-anchor': 'middle',
          'font-size': 9.5, fill: C_MUTED
        });
      }

      var cells = [];
      for (i = 0; i < G.rows.length; i++) {
        var ry = y0 + i * (ch + gap);
        text(c.svg, clip(G.rows[i], o.labelChars), {
          x: labelW - 8, y: ry + ch / 2 + midDy(10.5), 'text-anchor': 'end',
          'font-size': 10.5, fill: C_TEXT
        });
        for (j = 0; j < G.cols.length; j++) {
          v = G.values[i][j];
          var cxp = labelW + cw * j + gap / 2;
          var cwp = Math.max(1, cw - gap);
          var node;
          if (v == null) {
            /* No row at all for this cell. Distinct from zero: an empty grid square says "we
               have no measurement", a faint square says "measured, nobody got here". */
            node = rect(c.svg, cxp, ry, cwp, ch, {
              fill: 'none', stroke: C_BORDER, 'stroke-opacity': 0.5, 'stroke-dasharray': '2 2', rx: 3
            });
          } else {
            var t = clamp(div(v, max, 0), 0, 1);
            node = rect(c.svg, cxp, ry, cwp, ch, {
              fill: v > 0 ? o.color : C_BORDER,
              /* One CSS variable, ten intensities: opacity ramp instead of colour mixing, so
                 the host only has to define a single token per heatmap. A measured zero keeps
                 a visible tile — it has to read differently from the dashed "never measured"
                 cell above, or §0.8's whole point (0 can mean broken instrumentation) is lost. */
              'fill-opacity': v > 0 ? (0.14 + 0.86 * t) : 0.5,
              rx: 3
            });
            if (cwp >= 24 && v > 0 && o.showValues !== false) {
              text(c.svg, fmt(v), {
                x: cxp + cwp / 2, y: ry + ch / 2 + midDy(9.5), 'text-anchor': 'middle',
                'font-size': 9.5, 'font-weight': 600,
                fill: t > 0.55 ? C_PANEL : C_TEXT
              });
            }
          }
          cells.push(node);
          (function (rowLabel, colLabel, val) {
            hoverable(c, rect(c.svg, cxp, ry, cwp, ch, { fill: C_PANEL, 'fill-opacity': 0 }), {
              title: colFmt(colLabel),
              rows: [{ color: val ? o.color : null, label: rowLabel, value: val == null ? 'no data' : fmt(val) }]
            });
          }(G.rows[i], G.cols[j], v));
        }
      }

      if (o.legend !== false) {
        var ly = y0 + G.rows.length * (ch + gap) + 12;
        var sw = 16, steps = 5;
        var lx = c.w - steps * (sw + 2) - textW(fmtNum(max), 9.5) - 14;
        text(c.svg, '0', { x: lx - 6, y: ly + midDy(9.5), 'text-anchor': 'end', 'font-size': 9.5, fill: C_MUTED });
        for (i = 0; i < steps; i++) {
          rect(c.svg, lx + i * (sw + 2), ly - 5, sw, 10, {
            fill: o.color, 'fill-opacity': 0.14 + 0.86 * ((i + 1) / steps), rx: 2
          });
        }
        text(c.svg, fmtNum(max), {
          x: lx + steps * (sw + 2) + 6, y: ly + midDy(9.5), 'font-size': 9.5, fill: C_MUTED
        });
      }

      c.animate(200, function (p) {
        for (var k = 0; k < cells.length; k++) cells[k].setAttribute('opacity', p);
      });

      c.aria((o.label ? o.label + '. ' : '') + 'Heatmap, ' + G.rows.length + ' rows by ' +
        G.cols.length + ' columns, values from 0 to ' + fmtNum(max) + '. Rows: ' +
        G.rows.slice(0, 8).join(', ') + '.');
    }
  });

  /* ══════════════════════════════════════════════════════════════════════════════════════
     7 · HISTOGRAM  (rating distribution 1–10)
     ══════════════════════════════════════════════════════════════════════════════════════ */

  function normCounts(counts, o) {
    var min = o.min == null ? 1 : o.min, max = o.max == null ? 10 : o.max;
    var out = [];
    for (var v = min; v <= max; v++) {
      var n = 0;
      if (isArr(counts)) {
        /* An array is either ten bucket counts, or the raw ratings themselves. Ten entries with
           a 1..10 domain is unambiguous; anything else we treat as raw values and tally. */
        if (counts.length === (max - min + 1) && !o.raw) n = num(counts[v - min]) || 0;
        else { for (var i = 0; i < counts.length; i++) if (num(counts[i]) === v) n++; }
      } else if (counts && typeof counts === 'object') {
        n = num(counts[String(v)]);
        if (n == null) n = num(counts[v]) || 0;
      }
      out.push({ rating: v, count: n });
    }
    return out;
  }

  /* Rating bands, ChartQuest's own convention and the same one the health score uses: 8+ is
     the bar where people recommend a game unprompted, 5–7 is polite, below 5 is a problem. */
  function bandColor(rating) {
    if (rating >= 8) return C_GREEN;
    if (rating >= 5) return C_AMBER;
    return C_RED;
  }

  var histogram = makeChart({
    name: 'histogram',
    defaults: {
      height: 150, min: 1, max: 10, color: null, mean: null, format: fmtNum,
      empty: 'No ratings yet', showValues: true, raw: false
    },
    height: function (d, o) { return o.height || 150; },
    draw: function (c) {
      var o = c.opts;
      var buckets = normCounts(c.data, o);
      var fmt = typeof o.format === 'function' ? o.format : fmtNum;
      var total = 0, peak = 0, i;
      for (i = 0; i < buckets.length; i++) { total += buckets[i].count; peak = Math.max(peak, buckets[i].count); }
      if (total <= 0) { c.empty(o.empty); return; }

      /* The mean chip gets its own band above the plot. Sharing a band with the count labels
         put "avg 8.1" straight on top of the tallest bar's count — and the tallest bar is
         exactly where the mean tends to sit. */
      var hasMean = num(o.mean) != null;
      var padT = (o.showValues ? 16 : 8) + (hasMean ? 14 : 0), padB = 26, padL = 4, padR = 4;
      var plotW = Math.max(1, c.w - padL - padR);
      var plotH = Math.max(1, c.h - padT - padB);
      var base = padT + plotH;
      var sy = scaleLinear(0, peak, base, padT);

      line2(c.svg, padL, base + 0.5, padL + plotW, base + 0.5, { stroke: C_BORDER, 'stroke-width': 1 });

      var slot = div(plotW, buckets.length, plotW);
      var bw = Math.max(4, Math.min(34, slot * 0.72));
      var grown = [];

      for (i = 0; i < buckets.length; i++) {
        var b = buckets[i];
        var cx = padL + slot * (i + 0.5);
        var x = cx - bw / 2;
        var color = o.color || bandColor(b.rating);
        var hpx = b.count > 0 ? Math.max(2, base - sy(b.count)) : 0;

        if (b.count === 0) {
          rect(c.svg, x, base - 2, bw, 2, { fill: C_BORDER, 'fill-opacity': 0.7, rx: 1 });
        } else {
          var node = rect(c.svg, x, base - hpx, bw, hpx, { fill: color, rx: 3 });
          grown.push({ n: node, h: hpx, base: base });
        }

        if (o.showValues && b.count > 0) {
          text(c.svg, fmt(b.count), {
            x: cx, y: base - hpx - 5, 'text-anchor': 'middle', 'font-size': 10,
            fill: C_TEXT, 'font-weight': 600
          });
        }
        text(c.svg, String(b.rating), {
          x: cx, y: base + 13, 'text-anchor': 'middle', 'font-size': 10, fill: C_MUTED
        });

        (function (bucket, col) {
          hoverable(c, rect(c.svg, cx - slot / 2, padT, slot, plotH + 14, { fill: C_PANEL, 'fill-opacity': 0 }), {
            title: 'Rated ' + bucket.rating + ' / 10',
            rows: [
              { color: col, label: bucket.count === 1 ? 'response' : 'responses', value: fmtNum(bucket.count) },
              { label: 'Share', value: fmtPct(div(bucket.count, total, 0) * 100) }
            ]
          });
        }(b, color));
      }

      /* mean marker — interpolated between bucket centres, so 8.4 sits where it belongs */
      var mean = num(o.mean);
      if (hasMean && mean >= o.min && mean <= o.max) {
        var mx = padL + slot * (mean - o.min + 0.5);
        line2(c.svg, mx, 13, mx, base, {
          stroke: C_TEXT, 'stroke-width': 1, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.75
        });
        var lbl = 'avg ' + trimZero(mean.toFixed(1));
        var lw = textW(lbl, 9) + 10;
        var lx = clamp(mx - lw / 2, 2, Math.max(2, c.w - lw - 2));
        rect(c.svg, lx, 0, lw, 12, { fill: C_PANEL, stroke: C_BORDER, rx: 6 });
        text(c.svg, lbl, {
          x: lx + lw / 2, y: 6 + midDy(9), 'text-anchor': 'middle', 'font-size': 9,
          fill: C_TEXT, 'font-weight': 600
        });
      }

      c.animate(200, function (p) {
        for (var k = 0; k < grown.length; k++) {
          var g = grown[k];
          g.n.setAttribute('height', Math.max(0, g.h * p));
          g.n.setAttribute('y', g.base - g.h * p);
        }
      });

      var top = buckets.slice().sort(function (a, b2) { return b2.count - a.count; })[0];
      c.aria((o.label ? o.label + '. ' : '') + 'Rating distribution, ' + fmtNum(total) +
        ' responses' + (mean != null ? ', mean ' + trimZero(mean.toFixed(1)) + ' out of 10' : '') +
        '. Most common rating ' + top.rating + ' with ' + fmtNum(top.count) + '.');
    }
  });

  /* ══════════════════════════════════════════════════════════════════════════════════════ */

  return {
    version: VERSION,
    sparkline: sparkline,
    line: lineChart,
    bars: bars,
    donut: donut,
    funnel: funnel,
    heatmap: heatmap,
    histogram: histogram,
    /* The palette tokens the host must define, exported so a dashboard can assert on them
       rather than discovering a missing variable as an invisible chart. */
    COLORS: COLORS.slice(),
    TOKENS: ['--cq-green', '--cq-red', '--cq-amber', '--cq-blue', '--cq-muted',
             '--cq-border', '--cq-text', '--cq-panel', '--cq-shadow (optional)'],
    format: {
      num: fmtNum, pct: fmtPct, duration: fmtDuration, day: fmtDay,
      dateTime: fmtDateTime, clip: clip
    }
  };
}));
