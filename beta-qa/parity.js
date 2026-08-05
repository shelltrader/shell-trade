#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — BETA MODEL PARITY HARNESS                          beta-qa/parity.js   v1.0.0
   ------------------------------------------------------------------------------------------
   Proves the two engines behind the Beta Test QA dashboard agree:

       SQL  automation/migrations/0011_beta_analytics_rpcs.sql   beta_model()  → live mode
       JS   beta-qa/beta-model.js  (→ website/assets/beta-model.js)            → snapshot mode

   The dashboard renders ONE shape (docs/beta-qa/BETA_MODEL_CONTRACT.md §2) and never touches
   `beta_events` rows, so swapping the source must not change a single number. This file is the
   thing that makes that a fact rather than an intention.

   ── USAGE ─────────────────────────────────────────────────────────────────────────────────
     # the gate: snapshot through the JS engine vs a captured beta_model() result
     node beta-qa/parity.js --data beta-qa/beta-data.json --sql-result beta-qa/sql-model.json

     # optional: also diff the roster against a captured beta_players() result
     node beta-qa/parity.js --data … --sql-result … --sql-players beta-qa/sql-players.json

     # deterministic synthetic data — every funnel stage, out-of-order arrivals, test ids, crashes
     node beta-qa/parity.js --make-fixture 40 --seed 7 --out beta-qa/parity-fixture.json

     # no database in reach: engine + differ self-check (this is what verify.js can gate on)
     node beta-qa/parity.js --self-test

   Exit codes:  0 = agreement · 1 = differences (or a failed self-test) · 2 = usage/IO error.

   ── HOW TO CAPTURE THE SQL SIDE ───────────────────────────────────────────────────────────
   Any of these shapes is accepted, because three different tools produce three different
   wrappers and re-typing a 200KB blob by hand is how a "parity failure" turns out to be a
   copy-paste artefact:
       {"meta":…}                          psql -tA -c "select beta_model(0,null)"
       [{"beta_model":{…}}]                the Supabase MCP bridge / execute_sql
       {"beta_model":{…}} · [{…}] · {"data":{…}}      PostgREST / supabase-js

   ── THE ONE RULE THAT MAKES A RUN MEANINGFUL ──────────────────────────────────────────────
   The JS engine is built with the SQL result's OWN window: now = meta.generated_at,
   days = meta.window_days, build = meta.build_filter. Run the JS engine against wall-clock
   `now` instead and every window boundary lands microseconds apart, so a clean pair of engines
   reports dozens of "differences" that are really one clock. Overridable with --now/--days/
   --build for the case where you are deliberately testing a different window.

   ── WHAT IS *NOT* A FAILURE (and is always printed, never silent) ──────────────────────────
   · meta.source — 'live' vs 'snapshot' is the contract's own enumeration (§2).
   · kpis.health_score.components / .dropped — the SQL engine inlines the §3 breakdown; the JS
     engine exposes it through BetaModel.healthScore(model). Same numbers, different doorway.
   · A timestamp that means the same instant in a different serialisation ("…+00:00" with
     microseconds vs "…Z" with milliseconds), and a number delivered as a numeric string —
     both are driver artefacts. Reported as FORMAT notes so a human can see them, not as drift.
   Everything else is drift. `--strict` removes the waivers and promotes format notes to
   failures; `--allow-prose` demotes `note` wording mismatches to notes.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';
const ROOT = path.resolve(__dirname, '..');

/* ══════════════════════════════════════════════════════════════════════════════════════════
   0 · ENGINE RESOLUTION
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/* The contract says the JS engine ships from website/assets/beta-model.js; today it lives
   beside this file in beta-qa/. Try both rather than hard-code one — a harness that dies with
   MODULE_NOT_FOUND the day the file moves gets deleted from verify.js instead of fixed. */
const ENGINE_CANDIDATES = [
  path.join(__dirname, 'beta-model.js'),
  path.join(ROOT, 'website', 'assets', 'beta-model.js')
];

function loadEngine(explicit) {
  const tried = [];
  const candidates = explicit ? [path.resolve(explicit)] : ENGINE_CANDIDATES;
  for (const p of candidates) {
    tried.push(p);
    if (!fs.existsSync(p)) continue;
    const mod = require(p);
    if (!mod || typeof mod.build !== 'function') {
      throw new Error('loaded ' + p + ' but it exports no build() — is that the BetaModel engine?');
    }
    return { engine: mod, file: p };
  }
  throw new Error('BetaModel engine not found. Looked in:\n  ' + tried.join('\n  '));
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   1 · COMPARISON RULES
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/* Floats only ever disagree here by representation: Postgres does numeric arithmetic and JS
   does binary doubles, so 8.3 can arrive as 8.299999999999999. Scale the tolerance with the
   magnitude, because an absolute 1e-6 on a 6731-second completion time is stricter than the
   double it is being compared against can even represent. */
const FLOAT_TOL = 1e-6;

/* Postgres stamps microseconds; the JS engine round-trips through Date and emits milliseconds.
   Truncating 519926µs → 519ms is a sub-millisecond difference in the same instant, not drift. */
const TS_TOL_MS = 1;

/* Sections that beta_model() deliberately does not return. CONTRACT §6 splits the roster into
   beta_players() and the drill-down into beta_player_detail(), so their absence from a captured
   beta_model result is the contract working, not a missing section. Anything NOT on this list
   that is missing from the SQL side is a real failure. */
const OTHER_RPC_SECTIONS = { players: 'beta_players()', players_total: 'beta_players()', timeline: 'beta_player_detail()' };

const DEFAULT_WAIVERS = [
  { path: 'meta.source',
    why: "'live' vs 'snapshot' — CONTRACT §2 enumerates both; this field names the source, it is not computed from it." },
  { path: 'kpis.health_score.components',
    why: 'SQL inlines the §3 breakdown into the KPI; the JS engine returns it from BetaModel.healthScore(model). Same components, different doorway.' },
  { path: 'kpis.health_score.dropped',
    why: 'Same as .components — the JS engine names the dropped components in kpis.health_score.note instead.' }
];

/* Report order. CONTRACT-driven: the founder acts on kpis and the funnel, so they come first
   even though a meta mismatch is usually the CAUSE of everything under it — which is why the
   window pre-flight shouts about meta before the list starts. */
const SECTION_ORDER = ['kpis', 'funnel', 'meta', 'surveys', 'builds', 'crashes', 'timeseries',
                       'tech', 'players', 'players_total', 'timeline'];

/* Arrays that carry an identity. Aligning on it turns "the third row moved" into ONE order
   finding instead of forty value findings that all say the same thing badly. */
const ARRAY_IDENTITY = [
  { path: /^funnel$/,                          key: r => r && r.key },
  { path: /^timeseries$/,                      key: r => r && r.day },
  { path: /^builds$/,                          key: r => r && r.build },
  { path: /^crashes$/,                         key: r => r && r.message },
  { path: /^surveys\.rating_trend$/,           key: r => r && r.day },
  { path: /^surveys\.responses$/,              key: r => r && (String(r.player_id) + '@' + String(r.created_at)) },
  { path: /^players$/,                         key: r => r && r.player_id },
  { path: /^kpis\.health_score\.components$/,  key: r => r && r.key },
  { path: /^timeline\.events$/,                key: r => r && (String(r.ts) + '/' + String(r.name)) }
];

/* Free-form advisory prose. ONLY `.note`: the contract's KPI note is explicitly explanatory
   text, whereas a `.label` is load-bearing (CONTRACT §0.3 — calling the intro chain "tutorial
   completed" invites exactly the wrong diagnosis) and a crash `.message` is the grouping key
   itself, so both of those must fail hard. */
const PROSE_LEAF = /(^|\.)note$/;

const TS_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?$/;

/* ══════════════════════════════════════════════════════════════════════════════════════════
   2 · SMALL HELPERS
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function numbersAgree(a, b, tol) {
  if (a === b) return true;
  if (!isFinite(a) || !isFinite(b)) return false;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

/* Same normalisation beta-model.js's parseTs() performs, re-implemented rather than imported:
   if the engine's parser ever starts disagreeing with the rest of the world, the harness must
   be able to SAY so instead of inheriting the bug and reporting agreement. */
function parseTsLoose(v) {
  if (typeof v !== 'string') return null;
  let s = v.trim();
  if (!TS_RE.test(s)) return null;
  s = s.replace(' ', 'T');
  s = s.replace(/(\.\d{3})\d+/, '$1');
  s = s.replace(/([+-]\d{2})$/, '$1:00');
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(s)) s += 'Z';
  const t = Date.parse(s);
  return isFinite(t) ? t : null;
}

function numericString(v) {
  if (typeof v !== 'string') return null;
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v.trim())) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function preview(v, max) {
  const cap = max || 78;
  if (v === undefined) return '‹absent›';
  if (v === null) return 'null';
  if (typeof v === 'string') {
    const s = v.replace(/\s+/g, ' ');
    return JSON.stringify(s.length > cap ? s.slice(0, cap) + '…' : s);
  }
  if (Array.isArray(v)) return 'array(' + v.length + ')';
  if (isPlainObject(v)) return '{' + Object.keys(v).slice(0, 4).join(',') + (Object.keys(v).length > 4 ? ',…' : '') + '}';
  return String(v);
}

function sectionOf(p) { const i = p.indexOf('.'); const s = i < 0 ? p : p.slice(0, i); return s.replace(/\[.*$/, ''); }

/* ══════════════════════════════════════════════════════════════════════════════════════════
   3 · THE DIFFER
   Produces a flat list of findings. Every finding carries the path, both sides and a kind:

     type · missing · extra · order · value · prose     → failures
     format                                             → same meaning, different serialisation
     waived                                             → a real difference an operator accepted
   ══════════════════════════════════════════════════════════════════════════════════════════ */

const KIND_RANK = { type: 0, missing: 1, extra: 2, order: 3, value: 4, prose: 5, format: 6, waived: 7 };

function makeContext(opts) {
  const o = opts || {};
  const waivers = (o.strict ? [] : DEFAULT_WAIVERS.slice()).concat(
    (o.ignore || []).map(p => ({ path: p, why: 'waived on the command line (--ignore)' })));
  return {
    tol: o.tol == null ? FLOAT_TOL : o.tol,
    tsTol: o.tsTol == null ? TS_TOL_MS : o.tsTol,
    strict: !!o.strict,
    allowProse: !!o.allowProse,
    waivers,
    findings: []
  };
}

function waiverFor(ctx, p) {
  for (const w of ctx.waivers) {
    /* Prefix match on a path boundary so `kpis.health_score.components` also covers every
       element and field beneath it — otherwise waiving a section still fails on its children. */
    if (p === w.path || p.indexOf(w.path + '.') === 0 || p.indexOf(w.path + '[') === 0) return w;
  }
  return null;
}

function push(ctx, kind, p, js, sql, hint) {
  ctx.findings.push({ kind, path: p, js, sql, hint: hint || null, section: sectionOf(p) });
}

function diffAt(ctx, p, js, sql) {
  const jsAbsent = js === undefined, sqlAbsent = sql === undefined;
  if (jsAbsent && sqlAbsent) return;

  const same = (function () {
    if (jsAbsent || sqlAbsent) return false;
    if (js === null || sql === null) return js === sql;
    return null;                                   // null = "not decided here, keep going"
  })();

  if (same === false || same === null) {
    const w = waiverFor(ctx, p);
    if (w) {
      /* Only record a waiver when it actually SUPPRESSED something. A waiver list that also
         prints for every key it happens to cover buries the two lines that matter. */
      if (!deepEqualQuiet(ctx, p, js, sql)) push(ctx, 'waived', p, js, sql, w.why);
      return;
    }
  }

  if (jsAbsent) { push(ctx, 'extra', p, js, sql, 'present in the SQL result, absent from the JS model'); return; }
  if (sqlAbsent) { push(ctx, 'missing', p, js, sql, 'present in the JS model, absent from the SQL result'); return; }

  if (js === null || sql === null) {
    if (js === null && sql === null) return;
    /* THE HONESTY RULE, made mechanical. null means "the event stream cannot answer this";
       0 means "the answer is zero". A dashboard that silently swaps one for the other sends
       the founder at a problem that does not exist — this is the single most valuable
       disagreement this harness can find, so it is never folded into a plain value diff. */
    const hint = (js === 0 || sql === 0)
      ? 'null (we do not know) vs 0 (a measured zero) — different findings, not rounding'
      : null;
    push(ctx, 'value', p, js, sql, hint);
    return;
  }

  const jsArr = Array.isArray(js), sqlArr = Array.isArray(sql);
  if (jsArr || sqlArr) {
    if (!jsArr || !sqlArr) { push(ctx, 'type', p, js, sql, 'array on one side only'); return; }
    diffArray(ctx, p, js, sql);
    return;
  }

  const jsObj = isPlainObject(js), sqlObj = isPlainObject(sql);
  if (jsObj || sqlObj) {
    if (!jsObj || !sqlObj) { push(ctx, 'type', p, js, sql, 'object on one side only'); return; }
    const keys = Object.keys(js).concat(Object.keys(sql).filter(k => !(k in js))).sort();
    for (const k of keys) diffAt(ctx, p ? p + '.' + k : k, js[k], sql[k]);
    return;
  }

  /* ── scalars ─────────────────────────────────────────────────────────────────────────── */
  if (typeof js === 'number' && typeof sql === 'number') {
    if (!numbersAgree(js, sql, ctx.tol)) push(ctx, 'value', p, js, sql, deltaHint(js, sql));
    return;
  }

  /* numeric delivered as a string: some drivers stringify Postgres `numeric` to avoid double
     rounding. The VALUE is right, so this is a format note — but it is printed, because a UI
     doing `value.toFixed(1)` on a string throws. */
  const jsNum = typeof js === 'number' ? js : numericString(js);
  const sqlNum = typeof sql === 'number' ? sql : numericString(sql);
  if (jsNum != null && sqlNum != null && (typeof js !== typeof sql)) {
    if (numbersAgree(jsNum, sqlNum, ctx.tol)) push(ctx, 'format', p, js, sql, 'same number, one side is a string (driver stringifies numeric)');
    else push(ctx, 'value', p, js, sql, deltaHint(jsNum, sqlNum));
    return;
  }

  if (typeof js === 'string' && typeof sql === 'string') {
    if (js === sql) return;
    const a = parseTsLoose(js), b = parseTsLoose(sql);
    if (a != null && b != null) {
      if (Math.abs(a - b) <= ctx.tsTol) push(ctx, 'format', p, js, sql, 'same instant, different serialisation');
      else push(ctx, 'value', p, js, sql, 'differ by ' + Math.round((b - a) / 1000) + 's');
      return;
    }
    if (PROSE_LEAF.test(p)) { push(ctx, 'prose', p, js, sql, 'advisory text differs — the two modes explain the same number differently'); return; }
    push(ctx, 'value', p, js, sql, null);
    return;
  }

  if (typeof js !== typeof sql) { push(ctx, 'type', p, js, sql, typeof js + ' vs ' + typeof sql); return; }
  if (js !== sql) push(ctx, 'value', p, js, sql, null);
}

function deltaHint(a, b) {
  const d = b - a;
  if (!isFinite(d) || d === 0) return null;
  return 'SQL − JS = ' + (Math.abs(d) < 0.001 ? d.toExponential(2) : (Math.round(d * 1000) / 1000));
}

/* A quiet re-run of the differ used only by the waiver path, to answer "is there actually a
   difference here?" without polluting the findings list. */
function deepEqualQuiet(ctx, p, js, sql) {
  const probe = { tol: ctx.tol, tsTol: ctx.tsTol, strict: ctx.strict, allowProse: ctx.allowProse, waivers: [], findings: [] };
  diffAt(probe, p, js, sql);
  return probe.findings.length === 0;
}

function identityFor(p) {
  for (const spec of ARRAY_IDENTITY) if (spec.path.test(p)) return spec.key;
  return null;
}

function diffArray(ctx, p, js, sql) {
  const keyOf = identityFor(p);

  if (keyOf) {
    const jsKeys = js.map(keyOf), sqlKeys = sql.map(keyOf);
    const usable = jsKeys.every(k => k != null) && sqlKeys.every(k => k != null) &&
                   new Set(jsKeys).size === jsKeys.length && new Set(sqlKeys).size === sqlKeys.length;
    if (usable) {
      const jsIdx = new Map(jsKeys.map((k, i) => [k, i]));
      const sqlIdx = new Map(sqlKeys.map((k, i) => [k, i]));

      for (const k of jsKeys) {
        if (!sqlIdx.has(k)) push(ctx, 'missing', p + '[' + k + ']', js[jsIdx.get(k)], undefined,
          'row exists in the JS model, not in the SQL result');
      }
      for (const k of sqlKeys) {
        if (!jsIdx.has(k)) push(ctx, 'extra', p + '[' + k + ']', undefined, sql[sqlIdx.get(k)],
          'row exists in the SQL result, not in the JS model');
      }

      const shared = jsKeys.filter(k => sqlIdx.has(k));
      const sqlShared = sqlKeys.filter(k => jsIdx.has(k));
      if (shared.join(' ') !== sqlShared.join(' ')) {
        /* ORDER IS PART OF THE CONTRACT, not a cosmetic. The funnel's stage order is load-bearing
           (CONTRACT §1: putting `completed` last concealed a 75% survey drop-off), timeseries must
           ascend, crashes rank by players hit and the roster by recency — the UI renders these in
           the order it receives them. One finding, not one per row. */
        push(ctx, 'order', p, shared, sqlShared, 'same rows, different order — order is contract, not cosmetics');
      }
      for (const k of shared) diffAt(ctx, p + '[' + k + ']', js[jsIdx.get(k)], sql[sqlIdx.get(k)]);
      return;
    }
    /* Keys were absent or duplicated — fall through to positional comparison rather than
       silently mis-pairing rows, which would invent differences that do not exist. */
    push(ctx, 'value', p, jsKeys.length, sqlKeys.length,
      'identity key missing or duplicated on one side; compared positionally instead');
  }

  if (js.length !== sql.length) {
    push(ctx, 'value', p + '.length', js.length, sql.length, 'row counts differ; compared to the shorter one');
  }
  const n = Math.min(js.length, sql.length);
  for (let i = 0; i < n; i++) diffAt(ctx, p + '[' + i + ']', js[i], sql[i]);
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   4 · COMPARE TWO MODELS
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function compare(jsModel, sqlModel, opts) {
  const ctx = makeContext(opts);

  /* The JS model is round-tripped through JSON before diffing, for two reasons: the SQL side
     arrives that way, and the dashboard consumes it that way. A key holding `undefined` would
     vanish in transit and read as agreement here while rendering blank in the browser. */
  const js = JSON.parse(JSON.stringify(jsModel));
  const sql = sqlModel;

  const skipped = [];
  const keys = Object.keys(js).concat(Object.keys(sql).filter(k => !(k in js)));
  const seen = new Set();

  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    if (!(k in sql) && OTHER_RPC_SECTIONS[k]) {
      /* Absent by design — that section is served by a different RPC (CONTRACT §6). Reported so
         nobody reads a green run as "the roster matched" when the roster was never compared. */
      skipped.push({ section: k, rpc: OTHER_RPC_SECTIONS[k] });
      continue;
    }
    diffAt(ctx, k, js[k], sql[k]);
  }

  const findings = ctx.findings.slice().sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section), sb = SECTION_ORDER.indexOf(b.section);
    const ra = sa < 0 ? SECTION_ORDER.length : sa, rb = sb < 0 ? SECTION_ORDER.length : sb;
    if (ra !== rb) return ra - rb;
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });

  const fails = findings.filter(f => isFailure(f, ctx));
  return {
    findings,
    failures: fails,
    formats: findings.filter(f => f.kind === 'format'),
    waived: findings.filter(f => f.kind === 'waived'),
    skipped,
    ok: fails.length === 0,
    waivers: ctx.waivers,
    opts: { tol: ctx.tol, tsTol: ctx.tsTol, strict: ctx.strict, allowProse: ctx.allowProse }
  };
}

function isFailure(f, ctx) {
  if (f.kind === 'waived') return false;
  if (f.kind === 'format') return !!ctx.strict;
  if (f.kind === 'prose') return !ctx.allowProse;
  return true;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   5 · WINDOW PRE-FLIGHT
   A window mismatch is not one finding among many — it is the cause of every finding below it.
   Say so before the list, or a reader spends an hour on `kpis.players_total` when the real
   story is that one engine was asked for 7 days and the other for all time.
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function windowCheck(jsModel, sqlModel) {
  const a = (jsModel && jsModel.meta) || {}, b = (sqlModel && sqlModel.meta) || {};
  const out = [];
  const cmp = (key, label) => {
    const x = a[key] === undefined ? null : a[key];
    const y = b[key] === undefined ? null : b[key];
    let agree;
    if (x === null || y === null) agree = x === y;
    else if (typeof x === 'string' && typeof y === 'string' && parseTsLoose(x) != null && parseTsLoose(y) != null) {
      agree = Math.abs(parseTsLoose(x) - parseTsLoose(y)) <= TS_TOL_MS;
    } else agree = x === y;
    out.push({ key, label, js: x, sql: y, agree });
  };
  cmp('window_days', 'window (days)');
  cmp('window_from', 'window start');
  cmp('build_filter', 'build filter');
  cmp('event_count', 'events in window');
  cmp('survey_count', 'surveys in window');
  cmp('excluded_players', 'test players removed');
  return { rows: out, ok: out.every(r => r.agree), boundaryOk: out.slice(0, 3).every(r => r.agree) };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   6 · REPORT
   ══════════════════════════════════════════════════════════════════════════════════════════ */

const BAR = '═'.repeat(90);
const SUB = '─'.repeat(90);
const MAX_PER_SECTION = 40;

function renderReport(res, head) {
  const L = [];
  L.push('');
  L.push('ChartQuest — BetaModel parity   SQL beta_model() ⇄ JS BetaModel.build()      v' + VERSION);
  L.push(BAR);
  for (const line of head) L.push('  ' + line);
  L.push('');

  /* window pre-flight */
  L.push('WINDOW');
  for (const r of res.window.rows) {
    L.push('  ' + (r.agree ? '✓' : '✗') + ' ' + r.label.padEnd(22) +
      (r.agree ? String(fmtScalar(r.js)) : 'JS ' + fmtScalar(r.js) + '   SQL ' + fmtScalar(r.sql)));
  }
  if (!res.window.boundaryOk) {
    L.push('');
    L.push('  ⚠  THE TWO ENGINES WERE ASKED DIFFERENT QUESTIONS. Every difference below is');
    L.push('     downstream of this — fix the window first, then re-run. Pass --now/--days/--build');
    L.push('     or capture the RPC again; by default this harness copies the window out of the');
    L.push('     SQL result so both engines see the same instant.');
  } else if (!res.window.ok) {
    L.push('');
    L.push('  ⚠  Same window, different contents: the engines disagree about which ROWS are in it.');
    L.push('     Usual cause — the SQL side windows on created_at while the JS side windows on ts');
    L.push('     (device time) with created_at as the fallback. cq-track.js re-POSTs unconfirmed');
    L.push('     rows on the NEXT boot, so those two are hours apart for real testers.');
  }
  L.push('');

  if (res.skipped.length) {
    L.push('NOT COMPARED (served by a different RPC — CONTRACT §6)');
    for (const s of res.skipped) L.push('  · ' + s.section.padEnd(16) + 'capture ' + s.rpc + ' and pass --sql-players to include it');
    L.push('');
  }

  const fails = res.failures;
  if (!fails.length) {
    L.push('DIFFERENCES  none — the two engines agree' + (res.opts.strict ? ' (strict)' : ''));
  } else {
    L.push('DIFFERENCES (' + fails.length + ')   most important first: kpis · funnel · meta · then the rest');
    L.push(SUB);
    let section = null, shownInSection = 0, hiddenInSection = 0;
    for (const f of fails) {
      if (f.section !== section) {
        if (hiddenInSection) L.push('      … and ' + hiddenInSection + ' more in ' + section + ' (use --json for the full list)');
        section = f.section; shownInSection = 0; hiddenInSection = 0;
        const n = fails.filter(x => x.section === section).length;
        L.push('');
        L.push('▸ ' + section + '  (' + n + ')');
      }
      if (shownInSection >= MAX_PER_SECTION) { hiddenInSection++; continue; }
      shownInSection++;
      L.push(...renderFinding(f));
    }
    if (hiddenInSection) L.push('      … and ' + hiddenInSection + ' more in ' + section + ' (use --json for the full list)');
  }
  L.push('');

  if (res.formats.length) {
    L.push('FORMAT NOTES (' + res.formats.length + ')   same meaning, different serialisation — not drift' +
           (res.opts.strict ? ' BUT --strict counts them' : ''));
    for (const f of res.formats.slice(0, 12)) {
      L.push('  · ' + f.path);
      L.push('      JS  ' + preview(f.js) + '   SQL ' + preview(f.sql) + (f.hint ? '   (' + f.hint + ')' : ''));
    }
    if (res.formats.length > 12) L.push('  … and ' + (res.formats.length - 12) + ' more');
    L.push('');
  }

  L.push('WAIVERS IN FORCE' + (res.opts.strict ? ' — none (--strict)' : ''));
  if (!res.opts.strict) {
    for (const w of res.waivers) {
      const hit = res.waived.filter(f => f.path === w.path || f.path.indexOf(w.path + '.') === 0 || f.path.indexOf(w.path + '[') === 0).length;
      L.push('  · ' + w.path.padEnd(34) + (hit ? '[suppressed ' + hit + ']' : '[no difference]'));
      L.push('      ' + w.why);
    }
  }
  L.push('');
  L.push(BAR);
  L.push(res.ok
    ? '  PASS — the SQL engine and the JS engine agree on every compared key.'
    : '  FAIL — ' + fails.length + ' difference' + (fails.length === 1 ? '' : 's') +
      ' between the two engines. The dashboard would show different numbers in live and snapshot mode.');
  L.push('');
  return L.join('\n');
}

function fmtScalar(v) { return v === null ? 'null' : (typeof v === 'string' ? v : String(v)); }

function renderFinding(f) {
  const out = [];
  const tag = {
    type: 'TYPE   ', missing: 'MISSING', extra: 'EXTRA  ', order: 'ORDER  ',
    value: 'VALUE  ', prose: 'PROSE  ', format: 'FORMAT ', waived: 'WAIVED '
  }[f.kind] || f.kind;
  out.push('  ' + tag + ' ' + f.path);
  if (f.kind === 'order') {
    out.push('      JS  ' + JSON.stringify(f.js).slice(0, 110));
    out.push('      SQL ' + JSON.stringify(f.sql).slice(0, 110));
  } else {
    out.push('      JS  ' + preview(f.js) + '      SQL ' + preview(f.sql));
  }
  if (f.hint) out.push('      → ' + f.hint);
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   7 · INPUT LOADING  (snapshots and RPC captures)
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function readJson(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); }
  catch (e) { throw new Error('cannot read ' + file + ': ' + e.message); }
  try { return JSON.parse(raw); }
  catch (e) { throw new Error('not valid JSON: ' + file + ' — ' + e.message); }
}

/* Snapshot: whatever scripts/beta_pull.py wrote — {events, surveys, days, pulled_at}. Also
   accepts a bare array of events (someone pasting one table) so a five-second sanity run does
   not require reshaping a file by hand. */
function loadSnapshot(file) {
  const d = readJson(file);
  if (Array.isArray(d)) return { events: d, surveys: [], days: null, pulled_at: null, file };
  if (!d || typeof d !== 'object') throw new Error(file + ': expected an object with .events');
  return {
    events: Array.isArray(d.events) ? d.events : [],
    surveys: Array.isArray(d.surveys) ? d.surveys : [],
    days: typeof d.days === 'number' ? d.days : null,
    pulled_at: d.pulled_at || null,
    expected: d.expected || null,
    file
  };
}

/* Peel whatever wrapper the capture tool added. Deliberately generous: a parity FAILURE caused
   by an unpeeled `[{"beta_model": …}]` wrapper is an hour spent proving the engines are fine. */
function unwrapRpc(raw, fnName) {
  const looksLikeModel = v => isPlainObject(v) && (v.meta || v.kpis || v.funnel || v.rows || v.total !== undefined);
  let v = raw, hops = 0;
  while (hops++ < 6) {
    if (typeof v === 'string') { try { v = JSON.parse(v); continue; } catch (e) { break; } }
    if (Array.isArray(v)) {
      if (v.length !== 1) break;
      v = v[0];
      continue;
    }
    if (isPlainObject(v)) {
      if (looksLikeModel(v) && !v[fnName] && !v.data && !v.result) return v;
      if (v[fnName] !== undefined) { v = v[fnName]; continue; }
      if (v.data !== undefined) { v = v.data; continue; }
      if (v.result !== undefined) { v = v.result; continue; }
      const keys = Object.keys(v);
      if (keys.length === 1) { v = v[keys[0]]; continue; }
    }
    break;
  }
  if (!isPlainObject(v)) {
    throw new Error('could not find a ' + fnName + '() result inside that file — expected an object with .meta/.kpis' +
                    (fnName === 'beta_players' ? ' or .rows/.total' : ''));
  }
  return v;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   8 · SEEDED FIXTURE GENERATOR
   Plausible synthetic beta traffic so parity can be exercised without touching production
   data — and without the one thing that would make a parity harness worthless: a fixture that
   changes between runs. Everything below draws from a seeded PRNG; there is no Math.random(),
   no Date.now() and no reliance on input row order anywhere in this file.

   The fixture deliberately contains every trap the contract names:
     §0.1 milestones once-per-player           §0.5 session_end on landing AND game pages
     §0.2 lost middle events (monotonic pass)  §0.6 completion_seconds re-sent on every later end
     §0.4 one session id across four documents §0.7 all ten test-id prefixes, incl. a survey-only one
     PARITY DECISION 1  rows whose created_at is hours after ts (the offline retry queue), rows
                        with no ts at all, and a shuffled output order.
     buildOf()          website rows carrying build:"" (an empty string is NOT a build)
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/* mulberry32 — 32-bit, seeded, identical across node/browser and famously well-distributed for
   its size. Seeded explicitly so `--seed 7` is the same fixture on every machine, forever. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A SECOND copy of the funnel's event order, on purpose. If it were imported from
   beta-model.js the fixture's expectations would mirror any re-ordering of FUNNEL instead of
   catching it — and CONTRACT §1 is explicit that this order is load-bearing (moving
   `completed` to the end concealed a 75% drop-off at the survey handoff). Two copies means a
   silent re-order shows up as a failing self-test rather than as agreement. */
const FIXTURE_STAGE_EVENTS = [
  'session_start', 'tutorial_started', 'tutorial_completed', 'first_trade_started',
  'boss_started', 'boss_defeated', 'journal_unlocked', 'journal_discovery_completed',
  'beta_completed', 'survey_started', 'survey_submitted'
];
const FIXTURE_STAGE_KEYS = [
  'landing', 'tutorial', 'intro_done', 'trade',
  'boss', 'boss_won', 'journal_unlock', 'journal',
  'completed', 'survey_start', 'survey'
];

const TEST_PREFIXES = ['CERT-TEST', 'e2e-', 'selftest', 'browsertest', 'QA-', 'DEV-',
                       'VERIFY-', 'GATE-', 'SMOKE-', 'TEST-'];

const DEVICE_PROFILES = [
  { device: 'desktop', browser: 'Chrome',  os: 'macOS',   screen: '1512x982', viewport: '1512x829', w: 34 },
  { device: 'desktop', browser: 'Chrome',  os: 'Windows', screen: '1920x1080', viewport: '1920x937', w: 16 },
  { device: 'desktop', browser: 'Safari',  os: 'macOS',   screen: '1440x900',  viewport: '1440x789', w: 8 },
  { device: 'desktop', browser: 'Firefox', os: 'Linux',   screen: '1920x1080', viewport: '1920x955', w: 4 },
  { device: 'mobile',  browser: 'Safari',  os: 'iOS',     screen: '390x844',   viewport: '390x699',  w: 22 },
  { device: 'mobile',  browser: 'Chrome',  os: 'Android', screen: '412x915',   viewport: '412x781',  w: 10 },
  { device: 'tablet',  browser: 'Safari',  os: 'iOS',     screen: '820x1180',  viewport: '820x1024', w: 6 }
];

/* Two of these are shared across players on purpose: CONTRACT §4's "repeat crash" alert only
   fires at ≥2 players, and GROUND_TRUTH.md records that the live data has four crashes each
   hitting exactly one player — a useful NEGATIVE test that a fixture must not accidentally
   destroy. The URLs, :line:col and cache-buster hashes exercise normaliseCrashMessage(). */
const CRASH_POOL = [
  { shared: true,  kind: 'error',   message: "Uncaught TypeError: t.entries.at is not a function", where: 'https://playchartquest.com/assets/vendor.min.js?v=8f21ac93b1:1:20481' },
  { shared: true,  kind: 'boot',    message: "Uncaught ReferenceError: Cannot access 'candleAcademy' before initialization", where: 'chart-quest.html:2045:17' },
  { shared: false, kind: 'error',   message: "Failed to update a ServiceWorker for scope ('https://playchartquest.com/') with script ('https://playchartquest.com/sw.js?b=335')", where: '' },
  { shared: false, kind: 'promise', message: 'Unhandled promise rejection: NetworkError when attempting to fetch resource. (id 4f7ff32513e5)', where: 'boot' },
  { shared: false, kind: 'error',   message: 'Uncaught TypeError: this.i.at is not a function', where: 'https://playchartquest.com/game.html?fresh=1&dev=1:12:9902' }
];

const HOOK_TEXT = [
  'The first trade actually made my heart beat faster.',
  'Beating the Gambler felt earned, not given.',
  'I finally understood what a wick means.',
  'Collecting shells while reading the chart is a great trick.',
  'The art. I would play this with the sound off just to look at it.'
];
const IMPROVE_TEXT = [
  'The jump felt floaty on my phone and I fell off twice.',
  'I did not know what the stop loss was for until level 2.',
  'It took a while before anything happened.',
  'More levels please, it ended right when I got good.',
  'The text was small on mobile.'
];
const ANY_TEXT = ['', '', 'Would play World 2 tomorrow.', 'My son watched over my shoulder the whole time.'];

function makeFixture(count, opts) {
  const o = opts || {};
  const seed = o.seed == null ? 1 : (o.seed | 0);
  const rnd = mulberry32(seed);
  const nowIso = o.now || '2026-08-05T12:00:00.000Z';
  const nowMs = Date.parse(nowIso);
  if (!isFinite(nowMs)) throw new Error('--now is not a date: ' + nowIso);
  const spanDays = o.span == null ? 9 : o.span;

  const pick = list => list[Math.floor(rnd() * list.length) % list.length];
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const chance = p => rnd() < p;
  const weighted = list => {
    const total = list.reduce((s, x) => s + x.w, 0);
    let r = rnd() * total;
    for (const x of list) { r -= x.w; if (r <= 0) return x; }
    return list[list.length - 1];
  };

  let seq = 0;
  const id = prefix => prefix + (seed.toString(36)) + '-' + (++seq).toString(36).padStart(4, '0');

  const events = [];
  const surveys = [];

  /* Every player gets an id that is stable for a given seed. Test ids cycle through the whole
     canonical prefix list so the exclusion path is exercised on all ten, not just the two that
     happen to exist in production today. */
  function playerId(i, isTest) {
    if (!isTest) return 'p-' + (seed * 7919 + i * 104729).toString(36).slice(-10);
    const pre = TEST_PREFIXES[i % TEST_PREFIXES.length];
    return pre + (pre.endsWith('-') ? '' : '-') + String(100 + i);
  }

  function emit(row) {
    /* PARITY DECISION 1 in fixture form. `ts` is device time; `created_at` is when the row was
       accepted. cq-track.js keeps a durable localStorage queue and re-POSTs unconfirmed rows on
       the NEXT boot, so for one row in ten they are hours apart — and about one in forty has no
       ts at all (an old client, or a row rebuilt by the ingest function), which must fall back
       to created_at rather than dropping out of the window entirely. */
      const late = chance(0.10) ? int(2, 40) * 3600000 : int(1, 9) * 1000;
    const created = new Date(row.tsMs + late).toISOString();
    const noTs = chance(0.025);
    events.push({
      id: 0,                                     // renumbered after the shuffle
      event_id: id('e-'),
      player_id: row.player_id,
      session_id: row.session_id,
      name: row.name,
      ts: noTs ? null : new Date(row.tsMs).toISOString(),
      props: row.props,
      device: row.env.device, browser: row.env.browser, os: row.env.os,
      screen: row.env.screen, viewport: row.env.viewport,
      created_at: created
    });
  }

  for (let i = 0; i < count; i++) {
    /* ~1 in 9 is the team's own testing, which is roughly the live ratio (2 of 27). At least
       one of them submits a survey and fires NO events at all — GATE-B-003 did exactly that and
       its 9/10 was being averaged into the real testers' score, so meta.excluded_players has to
       union both tables or the exclusion notice silently loses them. */
    const isTest = (i % 9 === 4) || i === count - 1;
    const surveyOnlyTest = isTest && (i === count - 1);
    const pid = playerId(i, isTest);
    const env = weighted(DEVICE_PROFILES);

    if (surveyOnlyTest) {
      surveys.push({
        id: 0, response_id: id('r-'), player_id: pid, session_id: id('s-'),
        q1_rating: 9, q2_hook: 'internal gate run', q3_improvement: 'n/a',
        q4_continue: 'immediately', q5_anything: '', seconds_taken: 41,
        created_at: new Date(nowMs - int(1, 40) * 3600000).toISOString()
      });
      continue;
    }

    /* Build cohort. An empty string is NOT a build (cq-track reads BUILD_TAG, which does not
       exist on the website pages, so every website row carries build:""); a share of players
       carry no build anywhere and must land in "(unknown)". */
    const buildTag = chance(0.15) ? '' : (chance(0.7) ? '335' : '334');

    /* Furthest stage: a decaying walk down the funnel with the shape the live data has — the
       big losses are landing→tutorial and tutorial→intro, then a cliff at the survey handoff. */
    const KEEP = [1, 0.55, 0.5, 0.95, 0.85, 0.92, 0.98, 0.8, 0.95, 0.9, 0.3];
    let furthest = 0;
    for (let s = 1; s < FIXTURE_STAGE_EVENTS.length; s++) {
      if (!chance(KEEP[s])) break;
      furthest = s;
    }

    const visits = chance(0.35) ? int(2, 4) : 1;
    const startMs = nowMs - Math.floor(rnd() * spanDays * 86400000) - 3600000;

    /* Split the run across visits: everything up to `splitAt` happens on visit 1, the rest on
       the last visit, days later. That is what makes avg_time_to_boss's "their arrival is not
       in this window" branch and the return_visit path real rather than theoretical. */
    const splitAt = visits > 1 ? int(0, furthest) : furthest;

    const completedIdx = FIXTURE_STAGE_EVENTS.indexOf('beta_completed');
    let completionSeconds = null;
    let firstSeenIso = new Date(startMs).toISOString();

    let t = startMs;
    const stageMs = [];
    for (let s = 0; s <= furthest; s++) {
      if (s === splitAt + 1) t += int(1, 3) * 86400000 + int(60, 3600) * 1000;   // the return visit
      else if (s > 0) t += int(20, 400) * 1000;
      stageMs.push(t);
    }
    if (furthest >= completedIdx) completionSeconds = Math.round((stageMs[completedIdx] - startMs) / 1000);

    /* Milestones actually emitted. One in eight runs LOSES a middle milestone — a flaky phone,
       a dropped POST, a tester clearing storage — which is the entire reason CONTRACT §0.2
       demands a monotonic funnel. If the fixture never lost one, the monotonic pass would be
       untested and a regression there would sail through. */
    const emitted = [];
    for (let s = 0; s <= furthest; s++) {
      if (s > 0 && s < furthest && chance(0.12)) continue;
      emitted.push(s);
    }

    for (let v = 1; v <= visits; v++) {
      const stagesHere = emitted.filter(s => (v === 1 ? s <= splitAt : (v === visits ? s > splitAt : false)));
      if (v > 1 && !stagesHere.length && !chance(0.5)) continue;      // a return that did nothing

      const sessionId = id('s-');
      const visitStart = v === 1 ? startMs : (stageMs[Math.min(splitAt + 1, furthest)] || startMs) + int(0, 600) * 1000;

      /* CONTRACT §0.4 — ONE session id for the whole visit. index → play → the game iframe →
         survey are four documents sharing it, and only the document that MINTS it fires
         session_start. So `page:'play'` on a session_start means the tester arrived directly at
         play.html, never that they clicked Play. */
      const entryPage = chance(0.2) ? 'play' : 'index';
      emit({
        player_id: pid, session_id: sessionId, name: 'session_start', tsMs: visitStart, env,
        props: { visit: v, ref: v === 1 ? pick(['', '', 'https://t.co/', 'https://www.google.com/']) : '', page: entryPage }
      });
      if (v > 1) {
        emit({
          player_id: pid, session_id: sessionId, name: 'return_visit', tsMs: visitStart + 400, env,
          props: { visit: v, first_seen: firstSeenIso, page: entryPage, build: '' }
        });
      }

      for (const s of stagesHere) {
        if (s === 0) continue;                    // stage 0 IS session_start, already emitted
        const name = FIXTURE_STAGE_EVENTS[s];
        const props = {};
        if (buildTag) props.build = buildTag;     // cq-track only stamps a non-empty BUILD
        if (name === 'boss_started') props.level = 1;
        if (name === 'boss_defeated') props.attempts = int(1, 3);
        if (name === 'beta_completed') props.reason = 'ceremony';
        emit({ player_id: pid, session_id: sessionId, name, tsMs: stageMs[s], env, props });

        /* Outcome events that are NOT funnel stages but ARE roster columns (trade_result,
           journal_result). journal_discovery_skipped only exists on builds whose ingest
           allowlist carries it, so it can never be assumed from silence. */
        if (name === 'first_trade_started') {
          const won = chance(0.65);
          emit({
            player_id: pid, session_id: sessionId, name: won ? 'first_trade_won' : 'first_trade_lost',
            tsMs: stageMs[s] + int(20, 120) * 1000, env, props: buildTag ? { build: buildTag } : {}
          });
        }
        if (name === 'journal_unlocked' && chance(0.5)) {
          emit({
            player_id: pid, session_id: sessionId,
            name: chance(0.75) ? 'journal_discovery_started' : 'journal_discovery_skipped',
            tsMs: stageMs[s] + int(5, 60) * 1000, env, props: buildTag ? { build: buildTag } : {}
          });
        }
      }

      /* Crashes: capped at 3 per session by the client, so never more here either. The shared
         messages are handed to consecutive players so the ≥2-player repeat-crash rule has
         something true to fire on. */
      if (chance(0.18)) {
        const c = (i % 5 < 2) ? CRASH_POOL[i % 2] : pick(CRASH_POOL.slice(2));
        const n = int(1, 3);
        for (let k = 0; k < n; k++) {
          emit({
            player_id: pid, session_id: sessionId, name: 'crash',
            tsMs: visitStart + int(30, 900) * 1000 + k * 1500, env,
            props: { kind: c.kind, message: c.message, where: c.where, page: 'game', build: buildTag }
          });
        }
      }

      /* session_end fires PER DOCUMENT (each one loads cq-track and runs its own pagehide), all
         under the same session id. That is why the landing view and the play session both show
         up here — and why CONTRACT §0.5 restricts the session-length metric to game pages: a
         6-second landing view pooled with a 15-minute play session made the median read 0.2min.
         completion_seconds is re-sent on EVERY later session_end (§0.6), unchanged, which is
         also why one value per player is the only honest median. */
      const ends = [{ page: entryPage, secs: int(4, 90) }];
      if (stagesHere.length) ends.push({ page: chance(0.85) ? 'game' : 'chart-quest', secs: int(45, 2400) });
      if (entryPage === 'index' && chance(0.6)) ends.push({ page: 'play', secs: int(3, 60) });
      if (emitted.includes(FIXTURE_STAGE_EVENTS.indexOf('survey_started')) && v === visits) {
        ends.push({ page: 'survey', secs: int(30, 500) });
      }
      const exitStage = ['session_start', 'tutorial_started', 'first_trade_started', 'boss_started',
                         'journal_discovery_started', 'journal_discovery_completed', 'beta_completed',
                         'survey_submitted'][Math.min(Math.floor(furthest * 0.75), 7)];
      let endT = visitStart + int(30, 300) * 1000;
      for (const e of ends) {
        endT += e.secs * 1000 + int(1, 30) * 1000;
        emit({
          player_id: pid, session_id: sessionId, name: 'session_end', tsMs: endT, env,
          props: {
            seconds: e.secs, page: e.page,
            completion_seconds: (completionSeconds != null && v === visits) ? completionSeconds : null,
            exit_stage: exitStage, completed: furthest >= completedIdx,
            /* Website documents have no BUILD_TAG in scope, so their rows carry build:"" — the
               empty string that must never become a cohort of its own. */
            build: (e.page === 'game' || e.page === 'chart-quest') ? buildTag : ''
          }
        });
      }
    }

    /* Surveys. Only players who reached survey_submitted have a row — and only some of the ones
       who merely STARTED, which is the 75% handoff leak the contract's stage order exists to
       expose. */
    if (emitted.includes(FIXTURE_STAGE_EVENTS.indexOf('survey_submitted'))) {
      const rating = int(5, 10);
      surveys.push({
        id: 0, response_id: id('r-'), player_id: pid, session_id: id('s-'),
        q1_rating: rating,
        q2_hook: pick(HOOK_TEXT),
        q3_improvement: pick(IMPROVE_TEXT),
        q4_continue: weighted([{ v: 'immediately', w: 5 }, { v: 'later', w: 3 }, { v: 'not_interested', w: 1 }]).v,
        q5_anything: pick(ANY_TEXT),
        seconds_taken: int(35, 420),
        created_at: new Date(stageMs[furthest] + int(5, 120) * 1000).toISOString()
      });
    }
  }

  /* Rows arrive in whatever order the ingest accepted them, which is NOT time order — the
     offline queue re-POSTs a batch from yesterday behind today's. Shuffling with the same
     seeded PRNG makes that permanent in the fixture, so any engine that quietly depends on
     input order fails here instead of in production. */
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = events[i]; events[i] = events[j]; events[j] = tmp;
  }
  events.forEach((e, k) => { e.id = k + 1; });
  surveys.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  surveys.forEach((s, k) => { s.id = k + 1; });

  return {
    events,
    surveys,
    days: 0,
    pulled_at: nowIso,
    fixture: { generator: 'beta-qa/parity.js v' + VERSION, seed, players: count, span_days: spanDays, now: nowIso },
    expected: expectationsFor(events, surveys)
  };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   9 · INDEPENDENT EXPECTATIONS
   Deliberately a SECOND implementation of the contract's arithmetic — written from
   docs/beta-qa/BETA_MODEL_CONTRACT.md, not by calling BetaModel. That is the whole point: if
   this imported the engine's helpers it could only ever prove the engine agrees with itself,
   which is what GROUND_TRUTH.md exists to stop us doing by hand every week.
   All-time only (days = 0) — a windowed expectation would be re-deriving the window logic here
   too, and two copies of THAT is how the second copy quietly becomes the spec.
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function expectationsFor(events, surveys) {
  const isTest = id => {
    const s = id == null ? '' : String(id);
    return TEST_PREFIXES.some(p => s.indexOf(p) === 0);
  };
  const propsOf = r => (r && r.props && typeof r.props === 'object' && !Array.isArray(r.props)) ? r.props : {};
  const numOf = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  /* CONTRACT parity decision 2 — the UPPER-middle element, never an interpolating median. */
  const median = a => a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : null;
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const r1 = x => x == null ? null : Math.round(x * 10) / 10;

  const real = events.filter(e => !isTest(e.player_id));
  const realSurveys = surveys.filter(s => !isTest(s.player_id));

  const excludedIds = new Set();
  let excludedEvents = 0;
  for (const e of events) if (isTest(e.player_id)) { excludedIds.add(e.player_id); excludedEvents++; }
  for (const s of surveys) if (isTest(s.player_id)) excludedIds.add(s.player_id);

  const players = new Set(real.map(e => e.player_id).filter(Boolean));

  /* CONTRACT §0.2 — furthest stage per player, then credit every stage before it. Sets of
     player ids, never row counts (§0.1: a milestone is once-per-player-forever). */
  const furthest = new Map();
  for (const e of real) {
    const idx = FIXTURE_STAGE_EVENTS.indexOf(e.name);
    if (idx < 0 || !e.player_id) continue;
    const cur = furthest.get(e.player_id);
    if (cur === undefined || idx > cur) furthest.set(e.player_id, idx);
  }
  const funnel = {};
  FIXTURE_STAGE_KEYS.forEach((k, i) => {
    let n = 0;
    for (const v of furthest.values()) if (v >= i) n++;
    funnel[k] = n;
  });

  /* CONTRACT §0.5 — game pages only. */
  const GAME_PAGES = ['game', 'chart-quest', 'play'];
  const sessionSecs = [];
  for (const e of real) {
    if (e.name !== 'session_end') continue;
    const p = propsOf(e);
    const s = numOf(p.seconds);
    if (s == null || GAME_PAGES.indexOf(String(p.page)) < 0) continue;
    sessionSecs.push(s);
  }

  /* CONTRACT §0.6 — one value per player. The fixture re-sends the SAME number on every later
     session_end (which is what cq-track does: completed_at − first_seen never changes), so this
     expectation cannot depend on which row is read first. An engine that picked a DIFFERENT
     row would still agree here — that is intentional; a fixture whose answer depends on array
     order would make parity itself non-deterministic. */
  const compByPlayer = new Map();
  for (const e of real) {
    if (e.name !== 'session_end' || !e.player_id || compByPlayer.has(e.player_id)) continue;
    const v = numOf(propsOf(e).completion_seconds);
    if (v != null && v > 0) compByPlayer.set(e.player_id, v);
  }
  const compValues = [...compByPlayer.values()];

  const crashPlayers = new Set(real.filter(e => e.name === 'crash' && e.player_id).map(e => e.player_id));
  const ratings = realSurveys.map(s => numOf(s.q1_rating)).filter(v => v != null && v >= 1 && v <= 10);

  return {
    _note: 'Ground truth computed by the fixture generator from the emitted rows, independently ' +
           'of beta-model.js. --self-test diffs the engine against this. All-time window only.',
    players_total: players.size,
    excluded_players: excludedIds.size,
    excluded_events: excludedEvents,
    event_count: real.length,
    survey_count: realSurveys.length,
    funnel,
    crash_players: crashPlayers.size,
    surveys: { n: realSurveys.length, avg_rating: r1(mean(ratings)) },
    session: {
      n: sessionSecs.length,
      avg_seconds: sessionSecs.length ? Math.round(mean(sessionSecs)) : null,
      median_seconds: sessionSecs.length ? Math.round(median(sessionSecs)) : null
    },
    completion: {
      n: compValues.length,
      median_seconds: compValues.length ? Math.round(median(compValues)) : null
    }
  };
}

/* The same shape, read back off a finished model. Diffing this against `expected` is what
   proves the JS engine computes the contract rather than merely being self-consistent. */
function projectExpectations(model) {
  const funnel = {};
  for (const row of model.funnel) if (row.instrumented) funnel[row.key] = row.players;
  return {
    _note: model.meta ? undefined : undefined,          // never compared; kept out of the diff
    players_total: model.kpis.players_total.value,
    excluded_players: model.meta.excluded_players,
    excluded_events: model.meta.excluded_events,
    event_count: model.meta.event_count,
    survey_count: model.meta.survey_count,
    funnel,
    crash_players: model.kpis.crash_players.value,
    surveys: { n: model.surveys.n, avg_rating: model.surveys.avg_rating },
    session: {
      n: model.kpis.avg_session_seconds.n,
      avg_seconds: model.kpis.avg_session_seconds.value,
      median_seconds: model.kpis.median_session_seconds.value
    },
    completion: {
      n: model.kpis.median_time_to_completion_seconds.n,
      median_seconds: model.kpis.median_time_to_completion_seconds.value
    }
  };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   10 · SELF-TEST
   Everything provable without a database: the engine against independent ground truth, its own
   structural invariants, and — just as important — the DIFFER against a battery of planted
   differences. A differ that reports "no differences" because it silently returns early is the
   one failure mode a parity harness can never be allowed to have.
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function selfTest(opts) {
  const o = opts || {};
  const { engine, file } = loadEngine(o.engine);
  const players = o.players == null ? 40 : o.players;
  const seed = o.seed == null ? 7 : o.seed;
  const fixture = makeFixture(players, { seed, now: o.now, span: o.span });
  const results = [];
  const t = (name, fn) => {
    let ok = false, detail = '';
    try { const r = fn(); ok = r.ok; detail = r.detail; }
    catch (e) { ok = false; detail = 'threw: ' + (e && e.message ? e.message : String(e)); }
    results.push({ name, ok, detail });
  };

  const model = engine.build(fixture.events, fixture.surveys, {
    days: 0, now: fixture.pulled_at, source: 'snapshot'
  });
  const clone = m => JSON.parse(JSON.stringify(m));

  /* ── 1 · the engine vs independent ground truth ─────────────────────────────────────── */
  t('engine matches independent ground truth (funnel · KPIs · exclusions)', () => {
    const res = compare(projectExpectations(model), fixture.expected, { strict: false });
    const fails = res.failures.filter(f => f.path !== '_note');
    return {
      ok: fails.length === 0,
      detail: fails.length ? fails.map(f => f.path + ': JS ' + preview(f.js) + ' vs truth ' + preview(f.sql)).join(' | ')
                           : 'all ' + Object.keys(fixture.expected).length + ' ground-truth keys agree'
    };
  });

  /* ── 2 · structural invariants the contract demands of ANY model ────────────────────── */
  t('funnel is monotonic and never keeps >100% (CONTRACT §0.2)', () => {
    let prev = null, bad = [];
    for (const row of model.funnel) {
      if (!row.instrumented) {
        if (row.players !== null) bad.push(row.key + ' is uninstrumented but reports players');
        continue;
      }
      if (prev != null && row.players > prev) bad.push(row.key + ' rose ' + prev + '→' + row.players);
      if (row.kept_from_prev_pct != null && row.kept_from_prev_pct > 100) bad.push(row.key + ' kept ' + row.kept_from_prev_pct + '%');
      prev = row.players;
    }
    return { ok: !bad.length, detail: bad.length ? bad.join('; ') : model.funnel.filter(r => r.instrumented).map(r => r.players).join(' ≥ ') };
  });

  t('uninstrumented stages manufacture no loss (CONTRACT §1)', () => {
    const bad = model.funnel.filter(r => !r.instrumented)
      .filter(r => r.drop_players !== null || r.drop_pct !== null || r.pct_of_top !== null || r.is_bottleneck);
    return { ok: !bad.length, detail: bad.length ? bad.map(r => r.key).join(', ') + ' took part in the drop-off maths' : 'play_click + movement are null all the way down' };
  });

  t('at most one bottleneck, and only above n≥5 (CONTRACT §4)', () => {
    const marked = model.funnel.filter(r => r.is_bottleneck);
    if (marked.length > 1) return { ok: false, detail: marked.length + ' bottlenecks marked' };
    if (!marked.length) return { ok: true, detail: 'none marked (no transition qualifies)' };
    const i = model.funnel.indexOf(marked[0]);
    const above = model.funnel.slice(0, i).filter(r => r.instrumented).pop();
    const ok = above && above.players >= 5 && marked[0].drop_players > 0;
    return { ok, detail: marked[0].key + ' loses ' + marked[0].drop_players + ' from ' + (above ? above.key + '=' + above.players : '?') };
  });

  t('test players are excluded and counted, never silent (CONTRACT §0.7)', () => {
    const leaked = model.players.filter(p => p.is_test);
    const ok = leaked.length === 0 && model.meta.excluded_players > 0 && model.meta.excluded_events > 0;
    return {
      ok,
      detail: leaked.length ? leaked.length + ' test ids reached the roster: ' + leaked.slice(0, 3).map(p => p.player_id).join(', ')
        : model.meta.excluded_players + ' players / ' + model.meta.excluded_events + ' events removed and reported'
    };
  });

  t('an empty build string never becomes a cohort', () => {
    const bad = model.builds.filter(b => b.build === '' || b.build == null);
    return { ok: !bad.length, detail: bad.length ? 'found a "" build row' : model.builds.map(b => b.build + ':' + b.players).join(' · ') };
  });

  t('timeseries is gap-free and ascending', () => {
    const days = model.timeseries.map(r => r.day);
    let bad = null;
    for (let i = 1; i < days.length; i++) {
      const d = (Date.parse(days[i] + 'T00:00:00Z') - Date.parse(days[i - 1] + 'T00:00:00Z')) / 86400000;
      if (d !== 1) { bad = days[i - 1] + ' → ' + days[i] + ' is ' + d + ' days'; break; }
    }
    return { ok: !bad, detail: bad || days.length + ' consecutive days ' + (days[0] || '—') + ' … ' + (days[days.length - 1] || '—') };
  });

  t('a windowed run (days=7) still holds every invariant', () => {
    const m7 = engine.build(fixture.events, fixture.surveys, { days: 7, now: fixture.pulled_at });
    let prev = null, bad = [];
    for (const row of m7.funnel) {
      if (!row.instrumented) continue;
      if (prev != null && row.players > prev) bad.push(row.key);
      prev = row.players;
    }
    if (m7.meta.window_days !== 7 || !m7.meta.window_from) bad.push('window not applied');
    if (m7.meta.event_count > model.meta.event_count) bad.push('7-day window holds more events than all-time');
    return { ok: !bad.length, detail: bad.length ? bad.join(', ') : m7.meta.event_count + ' of ' + model.meta.event_count + ' events in the last 7 days' };
  });

  t('all-time emits no previous window (PARITY DECISION 5)', () => {
    const bad = Object.keys(model.kpis).filter(k => model.kpis[k].prev !== null);
    return { ok: !bad.length && model.meta.window_from === null,
             detail: bad.length ? bad.join(', ') + ' carry a prev' : 'window_from null · every KPI prev null' };
  });

  /* ── 3 · the differ, against planted differences ────────────────────────────────────── */
  const mutations = [
    { name: 'identical models produce no findings', mutate: m => m, expect: null },
    { name: 'a float inside 1e-6 is agreement, not drift',
      mutate: m => { if (m.kpis.avg_rating.value != null) m.kpis.avg_rating.value += 4e-7; else m.kpis.health_score.value += 4e-7; return m; },
      expect: null },
    { name: 'a float outside 1e-6 is a VALUE finding',
      mutate: m => { m.kpis.players_total.value += 0.01; return m; },
      expect: { kind: 'value', path: 'kpis.players_total.value' } },
    { name: 'null vs 0 is caught and called out',
      mutate: m => { m.kpis.avg_time_to_boss_seconds.value = 0; return m; },
      expect: { kind: 'value', path: 'kpis.avg_time_to_boss_seconds.value' },
      guard: m => m.kpis.avg_time_to_boss_seconds.value === null },
    { name: 'a dropped funnel row is MISSING, not a value diff',
      mutate: m => { m.funnel.splice(3, 1); return m; },
      expect: { kind: 'missing' } },
    { name: 'a re-ordered funnel is ONE order finding, not thirteen',
      mutate: m => { const r = m.funnel.splice(10, 1)[0]; m.funnel.push(r); return m; },
      expect: { kind: 'order', path: 'funnel', exactly: 1 } },
    { name: 'an absent key is not the same as null',
      mutate: m => { delete m.kpis.avg_rating.prev; return m; },
      expect: { kind: 'missing', path: 'kpis.avg_rating.prev' } },
    { name: 'an extra key on the SQL side is reported',
      mutate: m => { m.kpis.players_total.confidence = 'high'; return m; },
      expect: { kind: 'extra', path: 'kpis.players_total.confidence' } },
    { name: 'note wording drift is PROSE (own bucket, still a failure)',
      mutate: m => { m.kpis.sessions.note = 'Sessions, counted per page.'; return m; },
      expect: { kind: 'prose', path: 'kpis.sessions.note' } },
    { name: 'a Postgres timestamp is the same instant, not a difference',
      mutate: m => { m.meta.generated_at = m.meta.generated_at.replace('Z', '926+00:00').replace('.000926', '.000926'); return m; },
      expect: { kind: 'format', path: 'meta.generated_at' } },
    { name: 'a stringified numeric is a FORMAT note, not drift',
      mutate: m => { m.surveys.avg_rating = String(m.surveys.avg_rating); return m; },
      expect: { kind: 'format', path: 'surveys.avg_rating' },
      guard: m => m.surveys.avg_rating != null },
    { name: 'meta.source is waived by default and fails under --strict',
      mutate: m => { m.meta.source = 'live'; return m; },
      expect: { kind: 'waived', path: 'meta.source' } },
    { name: 'a changed crash message is a hard failure (it is the grouping key)',
      mutate: m => { if (m.crashes.length) m.crashes[0].message = m.crashes[0].message + ' v2'; return m; },
      expect: { kind: 'missing' },
      guard: m => m.crashes.length > 0 }
  ];

  for (const mu of mutations) {
    t('differ: ' + mu.name, () => {
      const target = clone(model);
      if (mu.guard && !mu.guard(target)) return { ok: true, detail: 'skipped — the fixture has no such value to plant' };
      const mutated = mu.mutate(target);
      const res = compare(model, mutated, {});
      if (!mu.expect) {
        return { ok: res.findings.length === 0, detail: res.findings.length ? res.findings.map(f => f.kind + ' ' + f.path).join(', ') : 'clean' };
      }
      const hits = res.findings.filter(f => f.kind === mu.expect.kind && (!mu.expect.path || f.path === mu.expect.path || f.path.indexOf(mu.expect.path + '[') === 0));
      if (!hits.length) {
        return { ok: false, detail: 'expected a ' + mu.expect.kind + ' finding' + (mu.expect.path ? ' at ' + mu.expect.path : '') +
                                    '; got ' + (res.findings.map(f => f.kind + ' ' + f.path).join(', ') || 'nothing') };
      }
      if (mu.expect.exactly != null && hits.length !== mu.expect.exactly) {
        return { ok: false, detail: 'expected exactly ' + mu.expect.exactly + ' ' + mu.expect.kind + ' findings, got ' + hits.length };
      }
      /* A waived difference must NOT fail the run, and must still fail under --strict —
         otherwise a waiver is indistinguishable from a blind spot. */
      if (mu.expect.kind === 'waived') {
        const strict = compare(model, mu.mutate(clone(model)), { strict: true });
        if (res.ok !== true || strict.ok !== false) {
          return { ok: false, detail: 'waiver behaved wrongly: default ok=' + res.ok + ', strict ok=' + strict.ok };
        }
        return { ok: true, detail: 'suppressed by default, fails under --strict' };
      }
      if (mu.expect.kind === 'format') {
        if (res.ok !== true) return { ok: false, detail: 'a format note must not fail the run' };
        const strict = compare(model, mu.mutate(clone(model)), { strict: true });
        if (strict.ok !== false) return { ok: false, detail: '--strict must promote format notes to failures' };
        return { ok: true, detail: 'noted, not failed (fails under --strict)' };
      }
      if (res.ok !== false) return { ok: false, detail: 'a ' + mu.expect.kind + ' finding must fail the run' };
      return { ok: true, detail: hits.length + ' × ' + mu.expect.kind + ' at ' + hits[0].path };
    });
  }

  t('differ: prose can be demoted with --allow-prose', () => {
    const m = clone(model);
    m.kpis.sessions.note = 'different words entirely';
    const strictish = compare(model, m, {});
    const lenient = compare(model, m, { allowProse: true });
    return { ok: strictish.ok === false && lenient.ok === true, detail: 'default fails · --allow-prose passes' };
  });

  t('differ: RPC wrappers are unpeeled the same way every time', () => {
    const inner = { meta: { source: 'live' }, kpis: {} };
    const shapes = [inner, [{ beta_model: inner }], { beta_model: inner }, [inner], { data: inner }, JSON.stringify(inner)];
    const bad = shapes.map((s, i) => {
      try { return JSON.stringify(unwrapRpc(s, 'beta_model')) === JSON.stringify(inner) ? null : 'shape ' + i; }
      catch (e) { return 'shape ' + i + ' threw'; }
    }).filter(Boolean);
    return { ok: !bad.length, detail: bad.length ? bad.join(', ') : shapes.length + ' capture shapes all unwrap to the same object' };
  });

  t('fixture is reproducible from its seed', () => {
    const a = makeFixture(12, { seed: 99, now: fixture.pulled_at });
    const b = makeFixture(12, { seed: 99, now: fixture.pulled_at });
    const same = JSON.stringify(a) === JSON.stringify(b);
    const different = JSON.stringify(makeFixture(12, { seed: 100, now: fixture.pulled_at })) !== JSON.stringify(a);
    return { ok: same && different, detail: same ? (different ? 'seed 99 is stable and differs from seed 100' : 'seed 100 produced identical data — the PRNG is not seeded') : 'two runs of seed 99 disagree' };
  });

  t('fixture covers every funnel stage, all ten test prefixes and out-of-order arrivals', () => {
    const names = new Set(fixture.events.map(e => e.name));
    const missing = FIXTURE_STAGE_EVENTS.filter(n => !names.has(n));
    const prefixes = new Set();
    for (const e of fixture.events) for (const p of TEST_PREFIXES) if (String(e.player_id).indexOf(p) === 0) prefixes.add(p);
    for (const s of fixture.surveys) for (const p of TEST_PREFIXES) if (String(s.player_id).indexOf(p) === 0) prefixes.add(p);
    const late = fixture.events.filter(e => e.ts && Date.parse(e.created_at) - Date.parse(e.ts) > 3600000).length;
    const noTs = fixture.events.filter(e => !e.ts).length;
    const outOfOrder = fixture.events.some((e, i) => i > 0 && String(fixture.events[i - 1].created_at) > String(e.created_at));
    const bad = [];
    if (missing.length) bad.push('no ' + missing.join('/'));
    if (prefixes.size < 3) bad.push('only ' + prefixes.size + ' test prefixes present');
    if (!late) bad.push('no late-arriving rows');
    if (!noTs) bad.push('no rows missing ts');
    if (!outOfOrder) bad.push('rows are in arrival order — the shuffle did not happen');
    return {
      ok: !bad.length,
      detail: bad.length ? bad.join('; ')
        : fixture.events.length + ' events · ' + names.size + ' distinct names · ' + prefixes.size + ' test prefixes · ' +
          late + ' late arrivals · ' + noTs + ' with no ts · shuffled'
    };
  });

  const failed = results.filter(r => !r.ok);
  return { results, ok: failed.length === 0, model, fixture, engineFile: file, engineVersion: engine.VERSION || '?' };
}

function renderSelfTest(st) {
  const L = [];
  L.push('');
  L.push('ChartQuest — BetaModel parity SELF-TEST   (no database required)              v' + VERSION);
  L.push(BAR);
  L.push('  engine    ' + path.relative(ROOT, st.engineFile) + '  v' + st.engineVersion);
  L.push('  fixture   ' + st.fixture.fixture.players + ' players · seed ' + st.fixture.fixture.seed + ' · ' +
         st.fixture.events.length + ' events · ' + st.fixture.surveys.length + ' surveys · now ' + st.fixture.pulled_at);
  L.push('');
  for (const r of st.results) {
    L.push('  ' + (r.ok ? '✓' : '✗') + ' ' + r.name);
    L.push('      ' + r.detail);
  }
  L.push(BAR);
  const failed = st.results.filter(r => !r.ok).length;
  L.push(failed ? '  FAIL — ' + failed + ' of ' + st.results.length + ' checks failed.'
                : '  PASS — ' + st.results.length + ' checks. The JS engine matches independent ground truth and the differ catches every planted difference.');
  L.push('');
  return L.join('\n');
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   11 · CLI
   ══════════════════════════════════════════════════════════════════════════════════════════ */

const USAGE = `
ChartQuest — BetaModel parity harness  v${VERSION}

  node beta-qa/parity.js --data <snapshot.json> --sql-result <beta_model.json> [options]
  node beta-qa/parity.js --make-fixture <N> [--seed S] [--out FILE] [--span DAYS] [--now ISO]
  node beta-qa/parity.js --self-test [--seed S] [--players N]

Options
  --data FILE          snapshot from scripts/beta_pull.py  {events, surveys, days, pulled_at}
  --sql-result FILE    captured beta_model() result (any wrapper: raw, [{beta_model:…}], {data:…})
  --sql-players FILE   captured beta_players() result — adds the roster to the comparison
  --days N             window override (default: the SQL result's meta.window_days)
  --build TAG          build-cohort filter override (default: the SQL result's meta.build_filter)
  --now ISO            "now" for the JS engine  (default: the SQL result's meta.generated_at,
                       then the snapshot's pulled_at, then the wall clock)
  --engine FILE        path to beta-model.js (default: beta-qa/, then website/assets/)
  --tol N              float tolerance (default ${FLOAT_TOL})
  --ignore a,b         extra paths to waive, comma separated
  --strict             no waivers; format notes count as failures
  --allow-prose        .note wording differences are notes, not failures
  --json               machine-readable findings on stdout instead of the report
  --quiet              only the verdict line

Exit codes: 0 agreement · 1 differences or a failed self-test · 2 usage/IO error.
`;

function parseArgs(argv) {
  const o = { ignore: [] };
  const want = new Set(['--data', '--sql-result', '--sql-players', '--days', '--build', '--now',
                        '--engine', '--tol', '--ignore', '--out', '--seed', '--players', '--span', '--make-fixture']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--self-test') { o.selfTest = true; continue; }
    if (a === '--strict') { o.strict = true; continue; }
    if (a === '--allow-prose') { o.allowProse = true; continue; }
    if (a === '--json') { o.json = true; continue; }
    if (a === '--quiet') { o.quiet = true; continue; }
    if (a === '-h' || a === '--help') { o.help = true; continue; }
    if (want.has(a)) {
      const v = argv[++i];
      if (v === undefined) throw new Error(a + ' needs a value');
      const key = a.replace(/^--/, '').replace(/-/g, '_');
      o[key] = v;
      continue;
    }
    /* A bare number right after --make-fixture is the usual muscle memory; anything else that
       starts with -- is a typo and must not be swallowed silently. */
    if (a.indexOf('--') === 0) throw new Error('unknown option ' + a);
    if (o.make_fixture === undefined) o.make_fixture = a;
    else throw new Error('unexpected argument ' + a);
  }
  if (o.ignore && typeof o.ignore === 'string') o.ignore = o.ignore.split(',').map(s => s.trim()).filter(Boolean);
  else o.ignore = [];
  return o;
}

function runParity(o) {
  if (!o.data) throw new Error('--data is required (a snapshot from scripts/beta_pull.py)');
  if (!o.sql_result) throw new Error('--sql-result is required. Capture it with:\n' +
    "      psql \"$SUPABASE_DB_URL\" -tA -c \"select public.beta_model(0, null)\" > beta-qa/sql-model.json\n" +
    '    (or paste the MCP execute_sql output — every wrapper shape is accepted).\n' +
    '    No database in reach? Run  node beta-qa/parity.js --self-test');

  const { engine, file: engineFile } = loadEngine(o.engine);
  const snap = loadSnapshot(o.data);
  const sqlModel = unwrapRpc(readJson(o.sql_result), 'beta_model');
  const sqlMeta = sqlModel.meta || {};

  /* THE WINDOW COMES FROM THE SQL SIDE unless told otherwise. Running the JS engine against the
     wall clock instead puts the two window boundaries microseconds apart, and a clean pair of
     engines then reports dozens of differences that are really one clock. */
  const days = o.days != null ? Number(o.days) : (typeof sqlMeta.window_days === 'number' ? sqlMeta.window_days : (snap.days == null ? 7 : snap.days));
  const buildFilter = o.build != null ? o.build : (sqlMeta.build_filter == null ? null : sqlMeta.build_filter);
  const now = o.now || sqlMeta.generated_at || snap.pulled_at || new Date().toISOString();

  const jsModel = engine.build(snap.events, snap.surveys, {
    days, build: buildFilter, now, source: 'snapshot'
  });

  /* The roster lives behind beta_players() (CONTRACT §6). When a capture is supplied, fold it
     into the same comparison so one run answers one question. */
  if (o.sql_players) {
    const p = unwrapRpc(readJson(o.sql_players), 'beta_players');
    if (Array.isArray(p.rows)) sqlModel.players = p.rows;
    if (typeof p.total === 'number') sqlModel.players_total = p.total;
  }

  const res = compare(jsModel, sqlModel, {
    tol: o.tol != null ? Number(o.tol) : undefined,
    strict: o.strict, allowProse: o.allow_prose || o.allowProse, ignore: o.ignore
  });
  res.window = windowCheck(jsModel, sqlModel);

  const head = [
    'JS engine   ' + path.relative(ROOT, engineFile) + '  v' + (engine.VERSION || '?'),
    'snapshot    ' + path.relative(ROOT, path.resolve(snap.file)) + '  —  ' + snap.events.length + ' events · ' + snap.surveys.length + ' surveys',
    'SQL result  ' + path.relative(ROOT, path.resolve(o.sql_result)) + (o.sql_players ? '  + ' + path.relative(ROOT, path.resolve(o.sql_players)) : ''),
    'window      days=' + days + (days === 0 ? ' (all time)' : '') + ' · build=' + (buildFilter == null ? '(none)' : buildFilter) + ' · now=' + now,
    'tolerance   floats ' + res.opts.tol + ' · timestamps ±' + res.opts.tsTol + 'ms' +
      (res.opts.strict ? ' · STRICT' : '') + (res.opts.allowProse ? ' · prose demoted' : '')
  ];

  return { res, head, jsModel, sqlModel };
}

function main(argv) {
  let o;
  try { o = parseArgs(argv); }
  catch (e) { process.stderr.write('parity: ' + e.message + '\n' + USAGE); return 2; }

  if (o.help) { process.stdout.write(USAGE); return 0; }

  /* ── fixture generation ─────────────────────────────────────────────────────────────── */
  if (o.make_fixture !== undefined) {
    const n = Number(o.make_fixture);
    if (!isFinite(n) || n < 1) { process.stderr.write('parity: --make-fixture needs a player count, e.g. --make-fixture 40\n'); return 2; }
    let fx;
    try {
      fx = makeFixture(Math.round(n), {
        seed: o.seed == null ? 1 : Number(o.seed),
        now: o.now, span: o.span == null ? undefined : Number(o.span)
      });
    } catch (e) { process.stderr.write('parity: ' + e.message + '\n'); return 2; }

    const out = o.out || path.join(__dirname, 'parity-fixture.json');
    const text = JSON.stringify(fx, null, 1) + '\n';
    if (out === '-') process.stdout.write(text);
    else {
      try { fs.writeFileSync(out, text); }
      catch (e) { process.stderr.write('parity: cannot write ' + out + ': ' + e.message + '\n'); return 2; }
      const ex = fx.expected;
      process.stdout.write(
        'fixture → ' + path.relative(ROOT, path.resolve(out)) + '\n' +
        '  seed ' + fx.fixture.seed + ' · ' + fx.fixture.players + ' players requested · now ' + fx.pulled_at + ' · span ' + fx.fixture.span_days + 'd\n' +
        '  ' + fx.events.length + ' events · ' + fx.surveys.length + ' surveys\n' +
        '  after test-id exclusion: ' + ex.players_total + ' players · ' + ex.event_count + ' events · ' + ex.survey_count + ' surveys\n' +
        '  excluded: ' + ex.excluded_players + ' test players / ' + ex.excluded_events + ' events\n' +
        '  funnel (independent ground truth): ' +
          Object.keys(ex.funnel).map(k => k + ' ' + ex.funnel[k]).join(' · ') + '\n' +
        '  crashes hit ' + ex.crash_players + ' players · median game-page session ' + ex.session.median_seconds + 's\n' +
        '\n  Verify the engine against it with:  node beta-qa/parity.js --self-test --seed ' + fx.fixture.seed + ' --players ' + fx.fixture.players + '\n');
    }
    return 0;
  }

  /* ── self-test ──────────────────────────────────────────────────────────────────────── */
  if (o.selfTest) {
    let st;
    try {
      st = selfTest({
        engine: o.engine, seed: o.seed == null ? 7 : Number(o.seed),
        players: o.players == null ? 40 : Number(o.players), now: o.now,
        span: o.span == null ? undefined : Number(o.span)
      });
    } catch (e) { process.stderr.write('parity: ' + (e && e.message ? e.message : String(e)) + '\n'); return 2; }

    if (o.json) process.stdout.write(JSON.stringify({ ok: st.ok, results: st.results }, null, 2) + '\n');
    else if (o.quiet) process.stdout.write((st.ok ? 'PASS' : 'FAIL') + ' — parity self-test, ' + st.results.length + ' checks\n');
    else process.stdout.write(renderSelfTest(st));
    return st.ok ? 0 : 1;
  }

  /* ── the real thing ─────────────────────────────────────────────────────────────────── */
  let run;
  try { run = runParity(o); }
  catch (e) { process.stderr.write('parity: ' + (e && e.message ? e.message : String(e)) + '\n'); return 2; }

  if (o.json) {
    process.stdout.write(JSON.stringify({
      ok: run.res.ok,
      window: run.res.window,
      failures: run.res.failures,
      formats: run.res.formats,
      waived: run.res.waived,
      skipped: run.res.skipped
    }, null, 2) + '\n');
  } else if (o.quiet) {
    process.stdout.write((run.res.ok ? 'PASS' : 'FAIL') + ' — ' + run.res.failures.length + ' difference(s) between the SQL and JS beta models\n');
  } else {
    process.stdout.write(renderReport(run.res, run.head));
  }
  return run.res.ok ? 0 : 1;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   12 · EXPORTS  — so scripts/verify.js can gate on this the way it gates on every other law
   ══════════════════════════════════════════════════════════════════════════════════════════ */

/* The house gate contract: check() → { ok, detail }. With no SQL capture in reach it runs the
   self-test, which is the honest thing a CI gate can assert without a database: the JS engine
   still matches independently-computed ground truth and the differ still catches drift. */
function check(opts) {
  const o = opts || {};
  try {
    if (o.data && o.sqlResult) {
      const run = runParity({ data: o.data, sql_result: o.sqlResult, sql_players: o.sqlPlayers,
                              days: o.days, build: o.build, now: o.now, engine: o.engine, ignore: [] });
      const f = run.res.failures;
      return {
        ok: f.length === 0,
        detail: f.length ? f.length + ' SQL⇄JS differences, worst: ' + f.slice(0, 3).map(x => x.path).join(', ')
                         : 'SQL and JS beta models agree on every compared key',
        result: run.res
      };
    }
    const st = selfTest({ engine: o.engine, seed: o.seed, players: o.players });
    const bad = st.results.filter(r => !r.ok);
    return {
      ok: bad.length === 0,
      detail: bad.length ? bad.length + ' of ' + st.results.length + ' self-checks failed: ' + bad.slice(0, 2).map(r => r.name).join('; ')
                         : st.results.length + ' self-checks pass (engine vs independent ground truth + differ battery); no SQL capture supplied',
      result: st
    };
  } catch (e) {
    return { ok: false, detail: 'parity harness not runnable: ' + (e && e.message ? e.message : String(e)) };
  }
}

module.exports = { check, compare, makeFixture, expectationsFor, projectExpectations,
                   selfTest, unwrapRpc, loadSnapshot, mulberry32, VERSION };

if (require.main === module) process.exit(main(process.argv.slice(2)));
