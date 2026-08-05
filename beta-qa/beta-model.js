/* ══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — BETA MODEL ENGINE (SNAPSHOT twin)                window.BetaModel      v1.0.0
   ------------------------------------------------------------------------------------------
   Turns raw `beta_events` + `beta_surveys` rows into the ONE shape the Beta Test QA dashboard
   renders — the JS half of the two-engine contract in docs/beta-qa/BETA_MODEL_CONTRACT.md.
   The SQL half (beta_model / beta_players / beta_player_detail RPCs) must produce comparable
   JSON for the same input; a parity harness diffs the two and any drift is a failure.

   DEPENDENCY-FREE ON PURPOSE. No npm, no CDN, no build step. Loads in Safari and Chrome with
   a plain <script> tag, and `require()`s in node for the parity harness.

       <script src="beta-model.js"></script>   →  window.BetaModel
       const BetaModel = require('./beta-model.js')

   ── PUBLIC API ────────────────────────────────────────────────────────────────────────────
     BetaModel.FUNNEL                                  the 13-stage table, in order
     BetaModel.TEST_PREFIXES                           canonical team-testing id prefixes
     BetaModel.isTestPlayer(id)          -> bool
     BetaModel.build(events, surveys, opts) -> model   the whole contract §2 shape
     BetaModel.playerTimeline(events, surveys, id) -> timeline
     BetaModel.healthScore(model)        -> { score, components[] }
     BetaModel.util                      the exact rounding/median/normalise helpers, exported
                                         so the alerts module and the parity harness cannot
                                         quietly round differently to this file.

   ── THE HONESTY RULE ──────────────────────────────────────────────────────────────────────
   Anything the event stream cannot support is `null`, never a plausible-looking zero. A
   confidently wrong number sends the founder at the wrong problem for a week; a null makes
   the UI say "we don't know", which is cheap to fix. Every metric below carries a comment
   naming the specific bug it defends against — those are not decoration, each one is a bug
   this project has already shipped once.

   ── THE FIVE PARITY DECISIONS (the SQL engine MUST match these exactly) ────────────────────
   1. EVENT TIME is `ts`, falling back to `created_at`. `ts` is when the thing happened on the
      player's device; `created_at` is when the row was accepted. cq-track.js keeps a durable
      localStorage queue and re-POSTs unconfirmed rows on the NEXT boot, so `created_at` can
      be hours after the event — bucketing that into today would put yesterday's crash on
      today's chart. Surveys have no `ts`, so they use `created_at`.
      (founder_report.py's use of `created_at` is a FETCH bound, not a bucketing rule — it has
      no per-day series at all, so there is no conflict here.)
   2. MEDIAN is the upper-middle element: sorted[floor(n/2)] — identical to founder_report.py.
      In SQL that is (array_agg(x order by x))[floor(count(*)/2) + 1], NOT percentile_cont,
      which interpolates and would drift by half a second on every even-sized sample.
   3. PERCENTAGES are rounded to whole numbers (founder_report.py's `pct()` prints '{:.0f}%').
      Ratings and rating averages are rounded to 1 decimal. Seconds are whole numbers.
   4. The BUILD FILTER is a COHORT filter on the player, not a row filter. See §builds below —
      a row filter would delete every session_end (they carry build:"" from the website pages)
      and silently zero out session length for the selected build.
   5. `window_days: 0` (all time) emits `window_from: null` and `prev: null` on every KPI.
      There is no previous window to compare an all-time number against.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
(function (factory) {
  'use strict';
  var api = factory();
  /* Attach every way, so one file serves the browser dashboard and the node parity harness.
     `window` is assigned EXPLICITLY rather than trusting globalThis to be it: in a browser they
     are the same object, but inside a worker, a sandboxed iframe or node's vm they are not, and
     a dashboard that loads the script and then finds no window.BetaModel fails with a blank
     page and no error worth reading. Belt and braces costs two lines. */
  if (typeof module === 'object' && module && typeof module.exports === 'object') module.exports = api;
  if (typeof globalThis !== 'undefined' && globalThis) globalThis.BetaModel = api;
  if (typeof window !== 'undefined' && window) window.BetaModel = api;
})(function () {
  'use strict';

  var VERSION = '1.0.0';

  /* ════════════════════════════════════════════════════════════════════════════════════════
     0 · CONSTANTS
     ════════════════════════════════════════════════════════════════════════════════════════ */

  /* CONTRACT §0.7 — player ids that are the team's own testing, not beta testers.
     founder_report.py's list misses VERIFY-* and GATE-*, and the live table contains both
     (GATE-B-003 even submitted a survey rated 9/10, which was being averaged into the real
     testers' score). This list is the canonical superset. Exclusions are always COUNTED and
     reported in meta.excluded_players — a suspiciously small cohort must never be a mystery.

     Match is case-INSENSITIVE. An earlier version of this comment claimed case-sensitive
     "so it behaves identically to SQL `like 'GATE-%'`" — but the SQL engine lowercases the
     id first (`lower(player_id) like any('gate-%', …)`), so the two engines actually
     disagreed: `Gate-B-003` was excluded from the live dashboard and counted in snapshot
     mode, giving two different averages for the same data depending on whether the founder
     was signed in. That is exactly the drift the BetaModel contract exists to prevent.
     No false-positive risk: real ids are 'p-' + base36 (cq-track.js pid()).

     Canonical list — CONTRACT §0. Three implementations must agree: this file ·
     scripts/founder_report.py · automation/migrations/0011. Checked by
     scripts/check_test_prefixes.py. */
  var TEST_PREFIXES = ['CERT-TEST', 'e2e-', 'selftest', 'browsertest', 'QA-', 'DEV-',
                       'VERIFY-', 'GATE-', 'SMOKE-', 'TEST-'];

  /* CONTRACT §1 — the funnel, in order.
     `event: null` marks a stage that has NO event behind it. Those stages render greyed with a
     "not instrumented" badge and are EXCLUDED from every drop-off calculation: if `play_click`
     took part in the maths it would show a 100% loss between Landing and Play on a funnel where
     nothing is actually wrong (CONTRACT §0.4 — clicking Play fires no event at all, because the
     session id is minted once per visit and every later document in the tab stays silent). */
  var FUNNEL = [
    { key: 'landing',        label: 'Landing page',                                    event: 'session_start',               instrumented: true  },
    /* NON-GATING (gating:false). Instrumented from build 343, but deliberately OUTSIDE the
       monotonic chain. The monotonic pass credits every stage BELOW a player's furthest, so a
       gating play_click would be silently credited to everyone who reached the tutorial — it
       would read as an exact clone of the tutorial count at 100% kept, concealing the very
       landing-to-play gap it was added to measure. Non-gating stages report the RAW number of
       players who actually fired the event, and take no part in drop-off arithmetic. */
    { key: 'play_click',     label: 'Play clicked',                                    event: 'play_clicked',                instrumented: true, gating: false },
    { key: 'tutorial',       label: 'Tutorial started',                                event: 'tutorial_started',            instrumented: true  },
    /* NON-GATING for a second, independent reason: the Journey is SKIPPABLE. A player can skip
       it and still reach first_trade, so monotonic credit would hand them a movement-tutorial
       completion they never earned. As a raw count it answers a real question — how many
       testers actually learned to move — which is a mastery metric, not a funnel gate. */
    { key: 'movement',       label: 'Movement tutorial completed',                     event: 'movement_tutorial_completed', instrumented: true, gating: false },
    /* NOT "tutorial completed". CONTRACT §0.3: tutorial_completed is wired to introComplete(),
       which the game calls from bossFinish() when level == 1 — i.e. AFTER Guardian 1. Labelling
       it tutorial completion invites exactly the wrong diagnosis, because "0% finished the
       tutorial" and "0% beat the first boss" are completely different emergencies. */
    { key: 'intro_done',     label: 'Intro chain completed (ends after Guardian 1)',   event: 'tutorial_completed',          instrumented: true  },
    { key: 'trade',          label: 'First trade',                                     event: 'first_trade_started',         instrumented: true  },
    { key: 'boss',           label: 'Boss started',                                    event: 'boss_started',                instrumented: true  },
    { key: 'boss_won',       label: 'Boss defeated',                                   event: 'boss_defeated',               instrumented: true  },
    { key: 'journal_unlock', label: 'Journal unlocked',                                event: 'journal_unlocked',            instrumented: true  },
    { key: 'journal',        label: 'Journal Discovery completed',                     event: 'journal_discovery_completed', instrumented: true  },
    /* ORDER IS LOAD-BEARING — do NOT move 'completed' to the end of this list. The completion
       ceremony stamps beta_completed and THEN hands off to the survey; verified in the live data
       (the one player with both fired beta_completed at 15:28:59 and survey_submitted at
       15:32:53). Because the monotonic pass credits every stage BEFORE a player's furthest one,
       putting 'completed' last credited survey_started AND survey_submitted to all four players
       who merely finished the beta — reporting the survey stage as 4 players / 100% kept when
       the truth is 4 started and 1 submitted. That did not merely misreport a stage: it exactly
       concealed a 75% drop-off at the survey handoff, the third-largest leak in the funnel. */
    { key: 'completed',      label: 'Beta completed',                                  event: 'beta_completed',              instrumented: true  },
    { key: 'survey_start',   label: 'Survey started',                                  event: 'survey_started',              instrumented: true  },
    { key: 'survey',         label: 'Survey submitted',                                event: 'survey_submitted',            instrumented: true  }
  ];

  /* CONTRACT §0.5 — session length is only meaningful on the pages where the game actually
     runs. Pooling a 6-second landing-page view with a 15-minute play session made the median
     read 0.2 min against a real 44s+. */
  var GAME_PAGES = ['game', 'chart-quest', 'play'];

  /* Below this many samples a window-over-window move is noise: one player joining or leaving
     is a 100% swing on n=1, and the founder would chase it. CONTRACT §2 kpis. */
  var TREND_MIN_N = 5;

  /* The n a stage transition needs before it can be called the bottleneck. Sorting drop-offs by
     RATE let a 1-of-1 loss outrank a 7-of-13 loss — the exact mistake that would have sent week
     one at the wrong problem (see founder_report.py's MIN_N). */
  var BOTTLENECK_MIN_N = 5;

  /* CONTRACT §3 — the health score. Weights sum to 100; components with n < 3 are dropped and
     the survivors renormalised, because a health score driven by one survey response is worse
     than no score at all. */
  var HEALTH_COMPONENTS = [
    { key: 'funnel_throughput', label: 'Funnel throughput — reached First trade', weight: 30, target: 0.40 },
    { key: 'completion',        label: 'Completion — finished the beta',          weight: 25, target: 0.25 },
    { key: 'enjoyment',         label: 'Enjoyment — mean rating out of 10',       weight: 20, target: 8.5  },
    { key: 'retention_intent',  label: 'Retention intent — would keep playing',   weight: 15, target: 0.85 },
    { key: 'stability',         label: 'Stability — players with no crash',       weight: 10, target: 1.0  }
  ];
  var HEALTH_MIN_N = 3;

  var CONTINUE_KEYS = ['immediately', 'later', 'not_interested'];

  /* ════════════════════════════════════════════════════════════════════════════════════════
     1 · SMALL PURE HELPERS  (exported as BetaModel.util — one rounding rule for everyone)
     ════════════════════════════════════════════════════════════════════════════════════════ */

  var DAY_MS = 86400000;

  /* Postgres prints timestamps as "2026-08-03 19:15:35.472+00". Safari's Date parser rejects
     BOTH the space separator and the two-digit "+00" offset and returns NaN — which silently
     emptied the entire window on iPad while Chrome looked perfectly healthy. Normalise to
     strict ISO-8601 before parsing, and treat a zone-less stamp as UTC (every writer in this
     pipeline stamps UTC: cq-track uses toISOString(), Postgres columns are timestamptz). */
  function parseTs(v) {
    if (v == null) return null;
    if (v instanceof Date) { var d = v.getTime(); return isFinite(d) ? d : null; }
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = String(v).trim();
    if (!s) return null;
    s = s.replace(' ', 'T');
    s = s.replace(/(\.\d{3})\d+/, '$1');          // microseconds → milliseconds
    s = s.replace(/([+-]\d{2})$/, '$1:00');       // "+00" → "+00:00"
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(s)) s += 'Z';
    var t = Date.parse(s);
    return isFinite(t) ? t : null;
  }

  function toIso(ms) { return ms == null ? null : new Date(ms).toISOString(); }

  /* UTC day key. Bucketing in UTC (not local time) is what makes the JS engine and the SQL
     engine agree — a dashboard opened in Sydney must not shift every row by a day. */
  function dayKey(ms) { return ms == null ? null : new Date(ms).toISOString().slice(0, 10); }
  function dayStartMs(ms) { return Math.floor(ms / DAY_MS) * DAY_MS; }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  function round1(x) { return x == null ? null : Math.round(x * 10) / 10; }
  function round3(x) { return x == null ? null : Math.round(x * 1000) / 1000; }
  function roundInt(x) { return x == null ? null : Math.round(x); }

  /* PARITY DECISION 3. Whole-number percentages, matching founder_report.py's `pct()`.
     Returns null (not 0) when the denominator is empty — "no data" and "0%" are different
     findings and the UI must be able to tell them apart. */
  function pctInt(n, d) { return d ? Math.round((100 * n) / d) : null; }

  /* PARITY DECISION 2. The UPPER-middle element, exactly as founder_report.py does it.
     Deliberately NOT an interpolating median: two engines that interpolate differently is a
     parity failure that looks like a rounding shrug and hides a real disagreement. */
  function medianDisc(arr) {
    if (!arr || !arr.length) return null;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    return a[Math.floor(a.length / 2)];
  }
  function mean(arr) {
    if (!arr || !arr.length) return null;
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  /* Deterministic object ordering: count desc, then key asc. JSON objects are unordered by
     spec, but a parity harness that diffs serialised text is not, and neither is a human
     reading two dashboards side by side. */
  function countMapToObject(map) {
    var keys = Object.keys(map);
    keys.sort(function (a, b) { return (map[b] - map[a]) || (a < b ? -1 : a > b ? 1 : 0); });
    var out = {};
    for (var i = 0; i < keys.length; i++) out[keys[i]] = map[keys[i]];
    return out;
  }

  function bump(map, k) { if (k == null || k === '') return; map[k] = (map[k] || 0) + 1; }

  /* The foreign host a crash came from, or null when it is ours.
     Mirrors originOf() in cq-track.js so a row classified live and the same row reclassified
     from a snapshot can never disagree. OUR_HOSTS covers the production domain, the Pages
     previews and local dev; anything else that carries an http(s) filename is someone else's
     script. A row with no filename at all — inline code, or a CORS-sanitized "Script error." —
     is treated as OURS, because over-owning a crash is the safe direction: the cost of a false
     "ours" is a wasted look, the cost of a false "theirs" is a real bug filed under someone
     else's name and never fixed. */
  var OUR_HOSTS = /(^|\.)playchartquest\.com$|(^|\.)chartquest\.pages\.dev$|^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$|^\[::1\](:\d+)?$|(^|\.)chart-quest-game\.netlify\.app$|(^|\.)shelltrader\.github\.io$/;
  /* Anchored, never a substring test: `localhost.evil.com` must not read as a dev machine. */
  var LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
  function crashHost(where) {
    var u = where == null ? '' : String(where);
    if (u.indexOf('http') !== 0) return null;              // inline / blob: / data: / empty
    return (u.split('/')[2] || '') || null;
  }
  function crashSourceHost(where) {
    var host = crashHost(where);
    if (!host) return null;
    return OUR_HOSTS.test(host) ? null : host;
  }

  /* Origin for rows collected BEFORE the client started stamping it (build 342). Precedence
     matches cq-track.js: local > third_party > self.

     RETROACTIVE LIMIT, stated rather than hidden: `local` can only be recovered from a crash
     whose `where` carries a localhost URL. A dev-session crash thrown by INLINE code reports no
     filename at all, so it is indistinguishable from a real tester's inline crash and stays
     `self`. The live stamp does not have this problem — it decides from the PAGE's host, so
     from build 342 every crash in a dev session is tagged whatever threw it. */
  function crashOriginFrom(where) {
    var host = crashHost(where);
    if (!host) return 'self';
    if (LOCAL_HOSTS.test(host)) return 'local';
    return OUR_HOSTS.test(host) ? 'self' : 'third_party';
  }

  /* Group crash messages so "the same bug" is one row. Without this, a stack trace that carries
     the file:line of a cache-busted URL produces a brand-new "unique" crash on every deploy and
     the repeat-crash alert (CONTRACT §4) never fires on the bug that is actually killing runs. */
  function normaliseCrashMessage(msg) {
    var s = String(msg == null ? '' : msg);
    s = s.replace(/\s+/g, ' ').trim();
    /* Stop the URL match at a quote or bracket, not just at whitespace: the browser wraps them
       as ('https://…') and a greedy \S+ swallows the closing quote, leaving an unbalanced
       fragment that reads like a truncation bug in the dashboard. */
    s = s.replace(/https?:\/\/[^\s'")\]]+/gi, '<url>');   // incl. ?fresh=1&dev=1 query junk
    s = s.replace(/\bfile:\/\/[^\s'")\]]+/gi, '<url>');
    s = s.replace(/:\d+:\d+\b/g, '');             // :line:col
    s = s.replace(/\b[0-9a-f]{8,}\b/gi, '<id>');  // hashes, uuids, cache-buster fingerprints
    s = s.replace(/\b\d{3,}\b/g, '<n>');          // keeps "L1"/"x2", collapses 12345/8802
    s = s.replace(/\s+/g, ' ').trim();
    return s.slice(0, 160);                       // same cap founder_report.py prints at
  }

  /* CONTRACT §0.7 — canonical test-id test. */
  function isTestPlayer(id) {
    /* Lowercased on BOTH sides — see the TEST_PREFIXES comment. The SQL engine does
       `lower(player_id) like any('gate-%', …)`; matching that exactly is what keeps the two
       engines from reporting different tester counts for the same rows. */
    var p = (id == null ? '' : String(id)).toLowerCase();
    for (var i = 0; i < TEST_PREFIXES.length; i++) {
      if (p.indexOf(TEST_PREFIXES[i].toLowerCase()) === 0) return true;
    }
    return false;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     2 · ROW ACCESSORS
     Every one of these tolerates a missing/misshapen row. The dashboard reads a dump produced
     by three different tools (PostgREST, psql, the MCP bridge) and must not explode on one of
     them shaping `props` as a JSON string.
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function propsOf(row) {
    var p = row && row.props;
    if (p == null) return {};
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { return {}; } }
    return (typeof p === 'object' && !Array.isArray(p)) ? p : {};
  }

  /* PARITY DECISION 1. `ts` first, `created_at` as the fallback. */
  function eventMs(row) {
    var t = parseTs(row && row.ts);
    return t == null ? parseTs(row && row.created_at) : t;
  }
  function surveyMs(row) { return parseTs(row && row.created_at); }

  /* A build tag of "" is NOT a build. cq-track.js reads BUILD_TAG, a top-level `const` in the
     game's first script block — it does not exist on the website pages, so every session_end
     fired from index.html carries build:"". Treating "" as a build creates a phantom cohort
     that swallows most of the roster. */
  function buildOf(row) {
    var b = propsOf(row).build;
    if (b == null) return null;
    b = String(b).trim();
    return b === '' ? null : b;
  }

  function isGamePage(page) {
    var p = page == null ? '' : String(page);
    for (var i = 0; i < GAME_PAGES.length; i++) if (GAME_PAGES[i] === p) return true;
    return false;
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     3 · MONOTONIC FUNNEL
     ════════════════════════════════════════════════════════════════════════════════════════ */

  /* CONTRACT §0.2 — a funnel must not go UP. Thirteen independently-collected sets will report
     "kept from previous > 100%" the moment one event is lost on a flaky phone or arrives out of
     order (beta_completed genuinely fires before survey_submitted for some players). Take each
     player's FURTHEST instrumented stage and credit every instrumented stage before it.

     CONTRACT §0.1 is handled here too: these are SETS of player ids, never row counts. A
     milestone is once-per-player-forever in localStorage, so count(*) on one would be a lie the
     moment a tester clears storage and replays. */
  function monotonicStages(events) {
    var order = [];
    var eventToIndex = {};
    var i;
    for (i = 0; i < FUNNEL.length; i++) {
      /* Uninstrumented stages take no part at all — and neither do NON-GATING ones. A
         non-gating stage is measured, but it is not a gate a player must pass through, so
         letting it into the chain would both credit it to people who never did it and shift
         every later stage's "kept from previous". */
      if (!FUNNEL[i].instrumented || FUNNEL[i].gating === false) continue;
      eventToIndex[FUNNEL[i].event] = order.length;
      order.push(FUNNEL[i].key);
    }

    var furthest = {};                            // player_id -> furthest instrumented index
    for (i = 0; i < events.length; i++) {
      var pid = events[i] && events[i].player_id;
      if (!pid) continue;                         // an event with no player cannot enter a funnel
      var idx = eventToIndex[events[i].name];
      if (idx === undefined) continue;
      if (!(pid in furthest) || idx > furthest[pid]) furthest[pid] = idx;
    }

    var out = {};
    for (i = 0; i < order.length; i++) out[order[i]] = {};
    for (var p in furthest) {
      if (!Object.prototype.hasOwnProperty.call(furthest, p)) continue;
      for (var j = 0; j <= furthest[p]; j++) out[order[j]][p] = 1;
    }
    return { sets: out, order: order, furthest: furthest, indexOfEvent: eventToIndex };
  }

  function setSize(o) { return o ? Object.keys(o).length : 0; }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     4 · WINDOW SLICE  — everything one time window knows about itself
     Used three times: the current window, the previous window (for KPI deltas), and — with a
     null window — the all-time case.
     ════════════════════════════════════════════════════════════════════════════════════════ */

  /* First non-null `props.completion_seconds` per player.
     CONTRACT §0.6: completion_seconds is recomputed and RE-SENT on every later session_end, so
     counting rows let a single finisher who kept the tab open own the median outright. */
  function completionSecondsByPlayer(events) {
    var out = {};
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (!e || e.name !== 'session_end' || !e.player_id) continue;
      if (Object.prototype.hasOwnProperty.call(out, e.player_id)) continue;
      var v = num(propsOf(e).completion_seconds);
      if (v != null && v > 0) out[e.player_id] = v;
    }
    return out;
  }

  function playersWith(events, name) {
    var s = {};
    for (var i = 0; i < events.length; i++) {
      if (events[i] && events[i].name === name && events[i].player_id) s[events[i].player_id] = 1;
    }
    return s;
  }

  /* Build a self-contained view of one window. The returned object is deliberately shaped so
     that `healthScore()` can be called on it directly — that is what guarantees the health
     score printed for the current window and the one printed for the previous window come out
     of the exact same code path instead of two hand-copied formulas that drift. */
  function sliceWindow(events, surveys) {
    var i, e, p, pid;

    var mono = monotonicStages(events);

    var playersSet = {}, sessionsSet = {};
    var firstMsByPlayer = {}, lastMsByPlayer = {};
    var firstSessionStartMs = {};
    var crashCountByPlayer = {};

    for (i = 0; i < events.length; i++) {
      e = events[i];
      if (!e) continue;
      pid = e.player_id;
      var ms = eventMs(e);
      if (pid) {
        playersSet[pid] = 1;
        if (ms != null) {
          if (firstMsByPlayer[pid] == null || ms < firstMsByPlayer[pid]) firstMsByPlayer[pid] = ms;
          if (lastMsByPlayer[pid] == null || ms > lastMsByPlayer[pid]) lastMsByPlayer[pid] = ms;
          if (e.name === 'session_start' &&
              (firstSessionStartMs[pid] == null || ms < firstSessionStartMs[pid])) {
            firstSessionStartMs[pid] = ms;
          }
        }
        if (e.name === 'crash') crashCountByPlayer[pid] = (crashCountByPlayer[pid] || 0) + 1;
      }
      if (e.session_id) sessionsSet[e.session_id] = 1;
    }

    var playersTotal = Object.keys(playersSet).length;

    /* CONTRACT §0.4 — "new" means "has never sent a return_visit". The session id is minted once
       per VISIT and shared across index → play → the game iframe → survey, so a first-time
       tester loading four documents is one visit, not four. Before that fix every tester was
       reported as returning and "new testers" read zero. */
    var returningSet = playersWith(events, 'return_visit');
    var newSet = {};
    var returning = 0, newPlayers = 0;
    for (p in playersSet) {
      if (!Object.prototype.hasOwnProperty.call(playersSet, p)) continue;
      if (returningSet[p]) returning++; else { newPlayers++; newSet[p] = 1; }
    }

    /* CONTRACT §0.5 — game pages only. */
    var sessionSecs = [];
    for (i = 0; i < events.length; i++) {
      e = events[i];
      if (!e || e.name !== 'session_end') continue;
      var pr = propsOf(e);
      var secs = num(pr.seconds);
      if (secs == null || !isGamePage(pr.page)) continue;
      sessionSecs.push(secs);
    }

    var compByPlayer = completionSecondsByPlayer(events);
    var compValues = [];
    for (p in compByPlayer) {
      if (Object.prototype.hasOwnProperty.call(compByPlayer, p)) compValues.push(compByPlayer[p]);
    }

    /* Time to boss, measured from the player's first session_start IN THIS WINDOW.
       A player whose arrival happened before the window is SKIPPED rather than measured from
       their first visible event: "reached the boss 4 seconds after landing" is not a fast
       player, it is a truncated window, and it would drag the average toward zero. */
    var toBoss = [];
    for (i = 0; i < events.length; i++) {
      e = events[i];
      if (!e || e.name !== 'boss_started' || !e.player_id) continue;
      var start = firstSessionStartMs[e.player_id];
      var bossMs = eventMs(e);
      if (start == null || bossMs == null) continue;
      if (firstMsByPlayer[e.player_id] !== start) continue;  // their arrival is not in-window
      var d = (bossMs - start) / 1000;
      if (d >= 0) toBoss.push(d);
    }

    /* Survey aggregates (the surveys block of the contract is assembled from these too). */
    var ratings = [], contCounts = {}, ratingsByDay = {};
    for (i = 0; i < CONTINUE_KEYS.length; i++) contCounts[CONTINUE_KEYS[i]] = 0;
    var ratingDist = {};
    for (i = 1; i <= 10; i++) ratingDist[String(i)] = 0;
    var contAnswered = 0, contPositive = 0;

    for (i = 0; i < surveys.length; i++) {
      var s = surveys[i];
      if (!s) continue;
      var r = num(s.q1_rating);
      if (r != null && r >= 1 && r <= 10) {
        ratings.push(r);
        ratingDist[String(Math.round(r))] += 1;
        var dk = dayKey(surveyMs(s));
        if (dk) { (ratingsByDay[dk] = ratingsByDay[dk] || []).push(r); }
      }
      var c = s.q4_continue == null ? '' : String(s.q4_continue);
      if (Object.prototype.hasOwnProperty.call(contCounts, c)) {
        contCounts[c] += 1;
        contAnswered++;
        if (c === 'immediately' || c === 'later') contPositive++;
      }
    }

    var crashPlayers = Object.keys(crashCountByPlayer).length;
    var crashEvents = 0;
    for (p in crashCountByPlayer) {
      if (Object.prototype.hasOwnProperty.call(crashCountByPlayer, p)) crashEvents += crashCountByPlayer[p];
    }

    var landing = setSize(mono.sets.landing);
    /* founder_report.py's fallback: if nobody has a session_start (possible when the landing
       page's own analytics are blocked but the game's are not), fall back to the player count so
       the percentages still mean something instead of collapsing to null. */
    var funnelBase = landing || playersTotal;

    var surveysBlock = {
      n: surveys.length,
      avg_rating: round1(mean(ratings)),
      rating_dist: ratingDist,
      continue_dist: contCounts,
      rating_trend: null,            // filled by buildSurveys() — needs day ordering
      responses: null,
      _ratings_n: ratings.length,
      _ratings_by_day: ratingsByDay,
      _cont_answered: contAnswered,
      _cont_positive: contPositive
    };

    return {
      events: events,
      surveys: surveys,
      mono: mono,
      players_set: playersSet,
      players_total: playersTotal,
      players_new: newPlayers,
      players_new_set: newSet,
      players_returning: returning,
      sessions: Object.keys(sessionsSet).length,
      first_ms: firstMsByPlayer,
      last_ms: lastMsByPlayer,
      first_session_start_ms: firstSessionStartMs,
      session_seconds: sessionSecs,
      completion_by_player: compByPlayer,
      completion_values: compValues,
      time_to_boss: toBoss,
      crash_players: crashPlayers,
      crash_events: crashEvents,
      crash_count_by_player: crashCountByPlayer,
      funnel_base: funnelBase,
      /* `funnel` here is only the stage SIZES; the rendered funnel rows are built once, for the
         current window, by buildFunnel(). healthScore() reads sizes off either shape. */
      stage_size: (function () {
        var o = {};
        for (var k in mono.sets) if (Object.prototype.hasOwnProperty.call(mono.sets, k)) o[k] = setSize(mono.sets[k]);
        return o;
      })(),
      surveys_block: surveysBlock
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     5 · KPI WRAPPERS
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function deltaPct(value, prev) {
    if (value == null || prev == null) return null;
    if (prev === 0) return null;            // an increase from zero is not a percentage
    return Math.round(((value - prev) / Math.abs(prev)) * 100);
  }

  /* "flat" whenever the window is too small to call. On a ten-person beta one tester arriving is
     a +100% "trend", and a founder who chases that spends a day on nothing. */
  function trendOf(value, prev, n) {
    if (value == null || prev == null) return 'flat';
    if (!(num(n) != null && n >= TREND_MIN_N)) return 'flat';
    if (value > prev) return 'up';
    if (value < prev) return 'down';
    return 'flat';
  }

  function kpi(value, prev, n, unit, note) {
    return {
      value: value == null ? null : value,
      prev: prev == null ? null : prev,
      delta_pct: deltaPct(value, prev),
      trend: trendOf(value, prev, n),
      n: n == null ? null : n,
      unit: unit,
      note: note == null ? null : note
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     6 · FUNNEL ROWS
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function buildFunnel(slice) {
    var sets = slice.mono.sets;
    var top = setSize(sets.landing);
    var i, j;

    /* median_seconds_from_start uses players who ACTUALLY fired the stage event — a player
       credited by the monotonic pass because a later event survived has, by definition, no
       timestamp for the stage we lost, and inventing one would be fiction. */
    var stageFirstMs = {};                  // stageKey -> { player -> ms }
    for (i = 0; i < FUNNEL.length; i++) if (FUNNEL[i].instrumented) stageFirstMs[FUNNEL[i].key] = {};
    var eventToKey = {};
    for (i = 0; i < FUNNEL.length; i++) if (FUNNEL[i].instrumented) eventToKey[FUNNEL[i].event] = FUNNEL[i].key;

    for (i = 0; i < slice.events.length; i++) {
      var e = slice.events[i];
      if (!e || !e.player_id) continue;
      var key = eventToKey[e.name];
      if (!key) continue;
      var ms = eventMs(e);
      if (ms == null) continue;
      var m = stageFirstMs[key];
      if (m[e.player_id] == null || ms < m[e.player_id]) m[e.player_id] = ms;
    }

    /* Offsets from each player's first event to their first hit of this stage. Shared by the
       gating and non-gating branches so both report the same kind of number. */
    function stageOffsets(all, key, sl) {
      var out = [], m = all[key];
      for (var pid in m) {
        if (!Object.prototype.hasOwnProperty.call(m, pid)) continue;
        var start = sl.first_ms[pid];
        if (start == null) continue;
        var d = (m[pid] - start) / 1000;
        if (d >= 0) out.push(d);
      }
      return out;
    }

    var rows = [];
    var prevInstrumented = null;            // the last GATING row, not the last row

    for (i = 0; i < FUNNEL.length; i++) {
      var st = FUNNEL[i];

      if (!st.instrumented) {
        /* Nulls all the way down. A "not instrumented" stage that reported players:0 would be
           read as a total wipeout by every eye that skims a funnel, and there is no event
           behind it at all — CONTRACT §1 is explicit that these must never manufacture a loss. */
        rows.push({
          key: st.key, label: st.label, instrumented: false,
          players: null, pct_of_top: null, kept_from_prev_pct: null,
          drop_players: null, drop_pct: null,
          median_seconds_from_start: null, is_bottleneck: false
        });
        continue;
      }

      /* NON-GATING: measured, but not a gate. `sets` only holds gating stages (the monotonic
         pass skips these), so the count comes from who ACTUALLY fired the event — which is the
         honest number for both of them: play_clicked cannot see the Bosses/Courses pages, the
         PWA shortcut or a direct /play link, and the movement tutorial is skippable. Drop-off
         is null, not zero: these sit between gating stages and do not gate anything, so a
         "kept from previous" here would invent a transition that does not exist. `prevInstrumented`
         is deliberately NOT advanced, so the next real stage still compares against the last
         real gate. */
      if (st.gating === false) {
        var fired = stageFirstMs[st.key];
        var nFired = 0;
        for (var fp in fired) if (Object.prototype.hasOwnProperty.call(fired, fp)) nFired++;
        rows.push({
          key: st.key, label: st.label, instrumented: true, gating: false,
          players: nFired,
          pct_of_top: top > 0 ? Math.round((nFired / top) * 100) : null,
          kept_from_prev_pct: null, drop_players: null, drop_pct: null,
          median_seconds_from_start: medianDisc(stageOffsets(stageFirstMs, st.key, slice)),
          is_bottleneck: false
        });
        continue;
      }

      var n = setSize(sets[st.key]);

      var offsets = [];
      var fm = stageFirstMs[st.key];
      for (var pid in fm) {
        if (!Object.prototype.hasOwnProperty.call(fm, pid)) continue;
        var start = slice.first_ms[pid];
        if (start == null) continue;
        var d = (fm[pid] - start) / 1000;
        if (d >= 0) offsets.push(d);
      }

      var row = {
        key: st.key, label: st.label, instrumented: true,
        players: n,
        pct_of_top: pctInt(n, top),
        kept_from_prev_pct: prevInstrumented ? pctInt(n, prevInstrumented.players) : null,
        drop_players: prevInstrumented ? Math.max(0, prevInstrumented.players - n) : 0,
        drop_pct: prevInstrumented ? (prevInstrumented.players ? pctInt(Math.max(0, prevInstrumented.players - n), prevInstrumented.players) : null) : 0,
        median_seconds_from_start: roundInt(medianDisc(offsets)),
        is_bottleneck: false
      };
      rows.push(row);
      prevInstrumented = row;
    }

    /* Exactly one bottleneck, chosen by ABSOLUTE players lost and gated on n ≥ 5 in the stage
       above it. Ranking by rate lets a 1-of-1 loss beat a 7-of-13 loss and print "nothing costs
       more players" — the single most expensive misread available in this dataset. */
    var best = null;
    var lastN = null;
    for (i = 0; i < rows.length; i++) {
      if (!rows[i].instrumented) continue;
      if (lastN != null && rows[i].drop_players > 0 && lastN >= BOTTLENECK_MIN_N) {
        if (!best || rows[i].drop_players > best.drop_players ||
            (rows[i].drop_players === best.drop_players && (rows[i].drop_pct || 0) > (best.drop_pct || 0))) {
          best = rows[i];
        }
      }
      lastN = rows[i].players;
    }
    if (best) best.is_bottleneck = true;

    return rows;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     7 · TIMESERIES  — one row per UTC day, ascending, NO GAPS
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function buildTimeseries(slice, fromMs, toMs) {
    var i, p, e, dk;

    var byDay = {};
    function dayRow(k) {
      if (!byDay[k]) {
        byDay[k] = {
          day: k, players: {}, new_players: 0, sessions: {}, completions: {},
          surveys: 0, ratings: [], crashes: 0, session_secs: [],
          reached_trade: {}, reached_boss: {}
        };
      }
      return byDay[k];
    }

    for (i = 0; i < slice.events.length; i++) {
      e = slice.events[i];
      if (!e) continue;
      dk = dayKey(eventMs(e));
      if (!dk) continue;
      var d = dayRow(dk);
      if (e.player_id) d.players[e.player_id] = 1;
      if (e.session_id) d.sessions[e.session_id] = 1;
      if (e.name === 'beta_completed' && e.player_id) d.completions[e.player_id] = 1;
      if (e.name === 'first_trade_started' && e.player_id) d.reached_trade[e.player_id] = 1;
      if (e.name === 'boss_started' && e.player_id) d.reached_boss[e.player_id] = 1;
      /* Crashes are COUNTED, not deduped: `crash` is not in cq-track's ONCE list, so three
         crashes in one session are three real data points (and the client caps at 3 per
         session, so this can never run away). */
      if (e.name === 'crash') d.crashes += 1;
      if (e.name === 'session_end') {
        var pr = propsOf(e);
        var secs = num(pr.seconds);
        if (secs != null && isGamePage(pr.page)) d.session_secs.push(secs);
      }
    }

    /* new_players is attributed to the day of a player's FIRST event in this window, and uses
       the SAME definition as the players_new KPI (never sent a return_visit). Counting every
       player's first visible day instead would make the chart sum to 25 while the KPI directly
       above it said 18 — two numbers labelled "new players" disagreeing on one screen is how a
       dashboard loses the founder's trust in everything else on it.
       Over an all-time window this is genuinely their first day; over a 7-day window it is the
       first day we can see them, which is the only honest answer a 7-day window can give. */
    for (p in slice.first_ms) {
      if (!Object.prototype.hasOwnProperty.call(slice.first_ms, p)) continue;
      if (!slice.players_new_set[p]) continue;
      dk = dayKey(slice.first_ms[p]);
      if (dk) dayRow(dk).new_players += 1;
    }

    for (i = 0; i < slice.surveys.length; i++) {
      var s = slice.surveys[i];
      dk = dayKey(surveyMs(s));
      if (!dk) continue;
      var ds = dayRow(dk);
      ds.surveys += 1;
      var r = num(s.q1_rating);
      if (r != null) ds.ratings.push(r);
    }

    /* Establish the day range. A gap-free series is the whole point: a chart that simply omits
       a dead day draws a straight line through it and hides the outage that caused it. */
    var startDay, endDay;
    if (fromMs != null) {
      startDay = dayStartMs(fromMs);
    } else {
      var min = null;
      for (var k in byDay) {
        if (!Object.prototype.hasOwnProperty.call(byDay, k)) continue;
        var ms = Date.parse(k + 'T00:00:00Z');
        if (min == null || ms < min) min = ms;
      }
      if (min == null) return [];             // all-time window with no data at all
      startDay = min;
    }
    endDay = dayStartMs(toMs);
    if (endDay < startDay) endDay = startDay;

    var out = [];
    for (var t = startDay; t <= endDay; t += DAY_MS) {
      var key = dayKey(t);
      var row = byDay[key];
      if (!row) {
        /* A day with no activity is a REAL zero, not missing data — the pipe was up (other days
           in the same window have rows), nobody played. Counts are 0; averages stay null,
           because "the average session was 0 seconds" is a different and false claim. */
        out.push({
          day: key, players: 0, new_players: 0, sessions: 0, completions: 0,
          surveys: 0, avg_rating: null, crashes: 0, avg_session_seconds: null,
          reached_trade: 0, reached_boss: 0
        });
        continue;
      }
      out.push({
        day: key,
        players: Object.keys(row.players).length,
        new_players: row.new_players,
        sessions: Object.keys(row.sessions).length,
        completions: Object.keys(row.completions).length,
        surveys: row.surveys,
        avg_rating: round1(mean(row.ratings)),
        crashes: row.crashes,
        avg_session_seconds: roundInt(mean(row.session_secs)),
        reached_trade: Object.keys(row.reached_trade).length,
        reached_boss: Object.keys(row.reached_boss).length
      });
    }
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     8 · PLAYER ROSTER
     ════════════════════════════════════════════════════════════════════════════════════════ */

  var STAGE_LABEL_BY_KEY = (function () {
    var m = {};
    for (var i = 0; i < FUNNEL.length; i++) m[FUNNEL[i].key] = FUNNEL[i].label;
    return m;
  })();

  function buildPlayers(slice, surveysByPlayer) {
    var i, p, e;
    var acc = {};

    function rec(pid) {
      if (!acc[pid]) {
        acc[pid] = {
          player_id: pid,
          first_ms: null, last_ms: null,
          sessions: {}, total_seconds: 0, seen_session_end: false,
          visits: null, session_starts: 0,
          device: null, browser: null, os: null, screen: null, viewport: null,
          env_ms: null,
          builds: {},
          exit_stage: null, exit_ms: null,
          events: {},
          crashes: 0
        };
      }
      return acc[pid];
    }

    for (i = 0; i < slice.events.length; i++) {
      e = slice.events[i];
      if (!e || !e.player_id) continue;
      var r = rec(e.player_id);
      var ms = eventMs(e);
      var pr = propsOf(e);

      if (ms != null) {
        if (r.first_ms == null || ms < r.first_ms) r.first_ms = ms;
        if (r.last_ms == null || ms > r.last_ms) r.last_ms = ms;
      }
      if (e.session_id) r.sessions[e.session_id] = 1;
      r.events[e.name] = 1;
      if (e.name === 'crash') r.crashes += 1;
      if (e.name === 'session_start') r.session_starts += 1;

      /* The client's own visit counter is authoritative and survives the window boundary: a
         tester on visit 6 whose first five visits are outside a 7-day window is still on visit
         6, and reporting "1 visit" for them would hide the most engaged person in the beta.
         This is why `visits` can legitimately exceed `sessions`. */
      var v = num(pr.visit);
      if (v != null && (r.visits == null || v > r.visits)) r.visits = v;

      /* total_seconds sums EVERY session_end, landing page included — this is one person's real
         time on the property, and dropping their 43-second landing view would print "0 seconds"
         for a tester who was demonstrably there. The game-pages-only filter (CONTRACT §0.5)
         exists to stop the landing view distorting the AGGREGATE median, which is a different
         question from "how long was this person here". */
      if (e.name === 'session_end') {
        var secs = num(pr.seconds);
        if (secs != null) { r.total_seconds += secs; r.seen_session_end = true; }
        /* exit_stage comes straight off the client's own furthest-stage flag (cq-track's
           exitStage()), taken from their LAST session_end — recomputing it here would be a
           second, subtly different opinion about the same thing. */
        if (ms != null && (r.exit_ms == null || ms >= r.exit_ms)) {
          if (pr.exit_stage != null && String(pr.exit_stage) !== '') {
            r.exit_stage = String(pr.exit_stage);
            r.exit_ms = ms;
          }
        }
      }

      var b = buildOf(e);
      if (b) r.builds[b] = 1;

      /* Last non-empty environment wins: the roster should say what they LAST played on, which
         is what the founder needs when reading a crash next to it. */
      if (ms != null && (r.env_ms == null || ms >= r.env_ms)) {
        var touched = false;
        if (e.device)   { r.device = String(e.device);     touched = true; }
        if (e.browser)  { r.browser = String(e.browser);   touched = true; }
        if (e.os)       { r.os = String(e.os);             touched = true; }
        if (e.screen)   { r.screen = String(e.screen);     touched = true; }
        if (e.viewport) { r.viewport = String(e.viewport); touched = true; }
        if (touched) r.env_ms = ms;
      }
    }

    /* A player who only ever submitted a survey (their events fell outside the window, or were
       lost) still belongs on the roster — otherwise their rating floats in the surveys block
       attached to nobody. */
    for (p in surveysByPlayer) {
      if (!Object.prototype.hasOwnProperty.call(surveysByPlayer, p)) continue;
      rec(p);
    }

    var furthest = slice.mono.furthest;
    var order = slice.mono.order;

    var out = [];
    for (p in acc) {
      if (!Object.prototype.hasOwnProperty.call(acc, p)) continue;
      var a = acc[p];
      var sv = surveysByPlayer[p] || null;

      var fk = (p in furthest) ? order[furthest[p]] : null;

      var builds = Object.keys(a.builds).sort(buildCompare);

      out.push({
        player_id: a.player_id,
        first_seen: toIso(a.first_ms),
        last_seen: toIso(a.last_ms),
        sessions: Object.keys(a.sessions).length,
        /* null, not 0, when this player never sent a single session_end. Their tab was closed
           in a way that lost the pagehide flush; we do not know how long they stayed. */
        total_seconds: a.seen_session_end ? Math.round(a.total_seconds) : null,
        visits: a.visits != null ? a.visits : (a.session_starts || null),
        device: a.device, browser: a.browser, os: a.os,
        screen: a.screen, viewport: a.viewport,
        builds: builds,
        furthest_stage: fk,
        furthest_label: fk ? STAGE_LABEL_BY_KEY[fk] : null,
        exit_stage: a.exit_stage,
        /* Won beats lost beats merely started — a player who lost their first trade and later
           won one has, in funnel terms, got past the loss. */
        trade_result: a.events.first_trade_won ? 'won'
                    : a.events.first_trade_lost ? 'lost'
                    : a.events.first_trade_started ? 'started' : null,
        boss_result: a.events.boss_defeated ? 'defeated'
                   : a.events.boss_started ? 'started' : null,
        /* Precedence is outcome-first: completed > skipped > started > unlocked. `skipped` only
           appears on builds whose ingest allowlist carries journal_discovery_skipped — on older
           data it is simply absent, which is why it can never be assumed from silence. */
        journal_result: a.events.journal_discovery_completed ? 'completed'
                      : a.events.journal_discovery_skipped ? 'skipped'
                      : a.events.journal_discovery_started ? 'started'
                      : a.events.journal_unlocked ? 'unlocked' : null,
        survey_rating: sv ? num(sv.q1_rating) : null,
        survey_continue: sv && sv.q4_continue ? String(sv.q4_continue) : null,
        completion_seconds: slice.completion_by_player[p] != null ? Math.round(slice.completion_by_player[p]) : null,
        crashes: a.crashes,
        is_test: isTestPlayer(a.player_id)
      });
    }

    /* Most recently active first — the founder opens this to see who is playing NOW. Ties break
       on player_id so two engines and two runs always produce the same order. */
    out.sort(function (x, y) {
      var a = x.last_seen || '', b = y.last_seen || '';
      if (a !== b) return a < b ? 1 : -1;
      return x.player_id < y.player_id ? -1 : x.player_id > y.player_id ? 1 : 0;
    });
    return out;
  }

  /* Builds are numeric strings ("335"). Sort them numerically descending so 340 beats 99, with
     "(unknown)" pinned last. */
  function buildCompare(a, b) {
    var na = parseInt(a, 10), nb = parseInt(b, 10);
    var va = isFinite(na), vb = isFinite(nb);
    if (va && vb && na !== nb) return na - nb;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     9 · SURVEYS BLOCK
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function buildSurveys(slice) {
    var b = slice.surveys_block;

    var trendDays = Object.keys(b._ratings_by_day).sort();
    var trend = [];
    for (var i = 0; i < trendDays.length; i++) {
      var vals = b._ratings_by_day[trendDays[i]];
      trend.push({ day: trendDays[i], avg: round1(mean(vals)), n: vals.length });
    }

    /* Newest first: on a ten-person beta the founder reads the latest response first, and the UI
       must not have to re-sort a list the model already knows the right order for. */
    var rows = slice.surveys.slice().sort(function (x, y) {
      var a = surveyMs(x), c = surveyMs(y);
      if (a == null) return 1;
      if (c == null) return -1;
      if (a !== c) return c - a;
      return String(x.response_id || '') < String(y.response_id || '') ? -1 : 1;
    });

    var responses = [];
    for (i = 0; i < rows.length; i++) {
      var s = rows[i];
      responses.push({
        player_id: s.player_id == null ? null : String(s.player_id),
        created_at: toIso(surveyMs(s)),
        q1_rating: num(s.q1_rating),
        q2_hook: s.q2_hook == null ? null : String(s.q2_hook),
        q3_improvement: s.q3_improvement == null ? null : String(s.q3_improvement),
        q4_continue: s.q4_continue == null ? null : String(s.q4_continue),
        q5_anything: s.q5_anything == null ? null : String(s.q5_anything),
        seconds_taken: num(s.seconds_taken)
      });
    }

    return {
      n: b.n,
      avg_rating: b.avg_rating,
      rating_dist: b.rating_dist,
      continue_dist: b.continue_dist,
      rating_trend: trend,
      responses: responses
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     10 · BUILDS  — entry-cohort attribution
     ════════════════════════════════════════════════════════════════════════════════════════ */

  var UNKNOWN_BUILD = '(unknown)';

  /* CONTRACT §"Build attribution": a player belongs to the build of their FIRST event in the
     window that carries a non-empty props.build. An entry cohort, not a per-row tag — a tester
     who spanned two builds would otherwise be counted as a completion for both and each build's
     completion_pct would be a fiction. Players with no build anywhere land in "(unknown)" and
     the UI says so rather than quietly dropping them. */
  function entryBuildByPlayer(events) {
    var best = {};        // player -> { ms, build }
    var seen = {};
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      if (!e || !e.player_id) continue;
      seen[e.player_id] = 1;
      var b = buildOf(e);
      if (!b) continue;
      var ms = eventMs(e);
      if (ms == null) continue;
      if (!best[e.player_id] || ms < best[e.player_id].ms) best[e.player_id] = { ms: ms, build: b };
    }
    var out = {};
    for (var p in seen) {
      if (!Object.prototype.hasOwnProperty.call(seen, p)) continue;
      out[p] = best[p] ? best[p].build : UNKNOWN_BUILD;
    }
    return out;
  }

  function buildBuilds(slice, cohort, surveysByPlayer) {
    var groups = {};
    function g(b) {
      if (!groups[b]) {
        groups[b] = {
          build: b, players: {}, sessions: {}, first_ms: null, last_ms: null,
          completed: {}, boss: {}, journal: {}, survey: {},
          ratings: [], completion_secs: [], crashes: 0, crash_players: {}
        };
      }
      return groups[b];
    }

    var i, p, e;
    for (p in cohort) {
      if (!Object.prototype.hasOwnProperty.call(cohort, p)) continue;
      g(cohort[p]).players[p] = 1;
    }

    for (i = 0; i < slice.events.length; i++) {
      e = slice.events[i];
      if (!e || !e.player_id) continue;
      var b = cohort[e.player_id];
      if (!b) continue;
      var grp = g(b);
      var ms = eventMs(e);
      if (ms != null) {
        if (grp.first_ms == null || ms < grp.first_ms) grp.first_ms = ms;
        if (grp.last_ms == null || ms > grp.last_ms) grp.last_ms = ms;
      }
      if (e.session_id) grp.sessions[e.session_id] = 1;
      if (e.name === 'crash') { grp.crashes += 1; grp.crash_players[e.player_id] = 1; }
    }

    /* The four percentages come from the MONOTONIC stage sets intersected with the cohort, not
       from raw event counts. Counting raw events here made a build's boss_pct read 10% while the
       boss_completion_pct KPI two panels up read 20% for the same players — the difference being
       a player whose boss_defeated was lost but who demonstrably finished the beta afterwards.
       Worse, CONTRACT §4's "Boss regression" alert compares this figure across builds, so a
       definitional mismatch would fire a critical alert about a regression that never happened. */
    var sets = slice.mono.sets;
    function creditCohort(target, stageKey) {
      var s = sets[stageKey] || {};
      for (var q in s) {
        if (!Object.prototype.hasOwnProperty.call(s, q)) continue;
        if (cohort[q] === undefined) continue;
        g(cohort[q])[target][q] = 1;
      }
    }
    creditCohort('completed', 'completed');
    creditCohort('boss', 'boss_won');
    creditCohort('journal', 'journal');
    creditCohort('survey', 'survey');

    for (p in cohort) {
      if (!Object.prototype.hasOwnProperty.call(cohort, p)) continue;
      var gg = g(cohort[p]);
      var sv = surveysByPlayer[p];
      if (sv) {
        var r = num(sv.q1_rating);
        if (r != null) gg.ratings.push(r);
      }
      var cs = slice.completion_by_player[p];
      if (cs != null) gg.completion_secs.push(cs);
    }

    var out = [];
    for (var key in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, key)) continue;
      var q = groups[key];
      var n = Object.keys(q.players).length;
      out.push({
        build: q.build,
        players: n,
        sessions: Object.keys(q.sessions).length,
        first_seen: toIso(q.first_ms),
        last_seen: toIso(q.last_ms),
        completion_pct: pctInt(Object.keys(q.completed).length, n),
        avg_rating: round1(mean(q.ratings)),
        boss_pct: pctInt(Object.keys(q.boss).length, n),
        journal_pct: pctInt(Object.keys(q.journal).length, n),
        survey_pct: pctInt(Object.keys(q.survey).length, n),
        median_completion_seconds: roundInt(medianDisc(q.completion_secs)),
        crashes: q.crashes,
        crash_players: Object.keys(q.crash_players).length
      });
    }

    /* Newest build first — that is the one that just shipped and the one a regression would be
       hiding in. "(unknown)" always sinks to the bottom. */
    out.sort(function (x, y) {
      if (x.build === UNKNOWN_BUILD) return 1;
      if (y.build === UNKNOWN_BUILD) return -1;
      return buildCompare(y.build, x.build);
    });
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     11 · CRASHES  — grouped by normalised message
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function buildCrashes(slice) {
    var groups = {};
    for (var i = 0; i < slice.events.length; i++) {
      var e = slice.events[i];
      if (!e || e.name !== 'crash') continue;
      var pr = propsOf(e);
      var msg = normaliseCrashMessage(pr.message);
      var g = groups[msg];
      if (!g) {
        g = groups[msg] = {
          message: msg, kind: null, where: null, build: null,
          count: 0, players: {}, first_ms: null, last_ms: null, latest_ms: null
        };
      }
      g.count += 1;
      if (e.player_id) g.players[e.player_id] = 1;
      var ms = eventMs(e);
      if (ms != null) {
        if (g.first_ms == null || ms < g.first_ms) g.first_ms = ms;
        if (g.last_ms == null || ms > g.last_ms) g.last_ms = ms;
      }
      /* kind/where/build describe ONE occurrence, not the group. Take the most recent one: when
         the founder clicks through it should match what is happening now, not the first sighting
         on a build that has already shipped past. */
      if (ms == null || g.latest_ms == null || ms >= g.latest_ms) {
        g.latest_ms = ms;
        g.kind = pr.kind == null ? null : String(pr.kind);
        g.where = pr.where == null || pr.where === '' ? null : String(pr.where);
        g.build = buildOf(e);
        /* WHOSE CRASH IS IT. cq-track.js has stamped props.origin since build 341; rows
           collected before that carry only props.where, so derive it. Without this the
           founder cannot tell a bug they can fix from one thrown inside somebody else's
           script — and that is not hypothetical: two rows from Cloudflare's analytics beacon
           were read as an iOS Safari incompatibility in ChartQuest's own code and reported as
           a real finding. Nothing in this repo calls .at(). */
        g.origin = (pr.origin === 'third_party' || pr.origin === 'self' || pr.origin === 'local')
          ? pr.origin
          : crashOriginFrom(pr.where);
        g.source_host = pr.source_host != null ? pr.source_host : crashSourceHost(pr.where);
      }
    }

    var out = [];
    for (var k in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, k)) continue;
      var q = groups[k];
      out.push({
        message: q.message, kind: q.kind, where: q.where, build: q.build,
        count: q.count, players: Object.keys(q.players).length,
        first_seen: toIso(q.first_ms), last_seen: toIso(q.last_ms),
        origin: q.origin || 'self', source_host: q.source_host == null ? null : q.source_host
      });
    }
    /* Ranked by PLAYERS hit, then occurrences — but real beta crashes always outrank the two
       kinds that are not beta signal at all: someone else's script (nobody here can fix it) and
       a developer's own machine (it is not a tester). Letting either sort to the top is how a
       week gets spent on a stack trace that never mattered. Order: self, third_party, local. */
    var rank = { self: 0, third_party: 1, local: 2 };
    out.sort(function (x, y) {
      var xo = rank[x.origin] == null ? 0 : rank[x.origin];
      var yo = rank[y.origin] == null ? 0 : rank[y.origin];
      return (xo - yo) || (y.players - x.players) || (y.count - x.count) ||
             (x.message < y.message ? -1 : x.message > y.message ? 1 : 0);
    });
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     12 · TECH
     ════════════════════════════════════════════════════════════════════════════════════════ */

  /* Counted PER PLAYER, not per event. Per-event counts let the one tester who generated 52
     rows outweigh the twenty who generated two each, so "80% desktop" could mean "one busy
     person on a desktop". The roster is the source, so tech and the roster can never disagree.

     CONTRACT §0.9: country and language are deliberately not collected — no cookies, no IP
     storage, no third parties — so there is no key for them here. The UI states that in words
     rather than rendering an empty column that looks like a bug. */
  function buildTech(players) {
    var device = {}, browser = {}, os = {}, viewport = {};
    for (var i = 0; i < players.length; i++) {
      bump(device, players[i].device);
      bump(browser, players[i].browser);
      bump(os, players[i].os);
      bump(viewport, players[i].viewport);
    }
    return {
      device: countMapToObject(device),
      browser: countMapToObject(browser),
      os: countMapToObject(os),
      viewport: countMapToObject(viewport)
    };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     13 · HEALTH SCORE  (CONTRACT §3)
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function funnelPlayers(funnel, key) {
    if (!funnel) return null;
    for (var i = 0; i < funnel.length; i++) {
      if (funnel[i].key === key) return funnel[i].players;
    }
    return null;
  }

  /* Accepts a full model OR the lightweight window block that build() assembles internally.
     One code path on purpose: the current window's score and the previous window's score must
     come from the same formula, and a second hand-copied version is how a composite quietly
     starts disagreeing with its own breakdown. */
  function healthScore(model) {
    var funnel = model && (model.funnel || null);
    var sv = (model && model.surveys) || {};
    var playersTotal = num(model && model.players_total);
    var crashPlayers = num(model && model.crash_players);
    if (crashPlayers == null && model && model.kpis && model.kpis.crash_players) {
      crashPlayers = num(model.kpis.crash_players.value);
    }

    var landing = num(funnelPlayers(funnel, 'landing'));
    var trade = num(funnelPlayers(funnel, 'trade'));
    var completed = num(funnelPlayers(funnel, 'completed'));

    var ratingsN = num(sv._ratings_n);
    if (ratingsN == null) {
      /* A rendered surveys block has no private fields; recover n from the distribution. */
      ratingsN = 0;
      var dist = sv.rating_dist || {};
      for (var d in dist) if (Object.prototype.hasOwnProperty.call(dist, d)) ratingsN += (dist[d] || 0);
    }
    var contDist = sv.continue_dist || {};
    var contAnswered = 0, contPositive = 0;
    for (var c = 0; c < CONTINUE_KEYS.length; c++) {
      var v = contDist[CONTINUE_KEYS[c]] || 0;
      contAnswered += v;
      if (CONTINUE_KEYS[c] !== 'not_interested') contPositive += v;
    }

    var raw = {
      funnel_throughput: { actual: (landing ? trade / landing : null), n: landing || 0 },
      completion:        { actual: (landing ? completed / landing : null), n: landing || 0 },
      enjoyment:         { actual: num(sv.avg_rating), n: ratingsN },
      retention_intent:  { actual: (contAnswered ? contPositive / contAnswered : null), n: contAnswered },
      stability:         { actual: (playersTotal ? 1 - ((crashPlayers || 0) / playersTotal) : null), n: playersTotal || 0 }
    };

    var i, comp, keptWeight = 0;
    for (i = 0; i < HEALTH_COMPONENTS.length; i++) {
      comp = HEALTH_COMPONENTS[i];
      var r = raw[comp.key];
      if (r.actual != null && r.n >= HEALTH_MIN_N) keptWeight += comp.weight;
    }

    var components = [], score = 0;
    for (i = 0; i < HEALTH_COMPONENTS.length; i++) {
      comp = HEALTH_COMPONENTS[i];
      var rr = raw[comp.key];
      var dropped = !(rr.actual != null && rr.n >= HEALTH_MIN_N);
      var points = null;
      if (!dropped && keptWeight > 0) {
        /* Renormalise so the surviving components still add to 100 — otherwise dropping the
           20-point enjoyment component (which is normal in week one, with two responses) would
           cap the score at 80 and read as a decline that never happened. */
        var renorm = comp.weight * (100 / keptWeight);
        points = Math.min(1, rr.actual / comp.target) * renorm;
        score += points;
      }
      components.push({
        key: comp.key,
        label: comp.label,
        weight: comp.weight,
        actual: rr.actual == null ? null : round3(rr.actual),
        target: comp.target,
        points: points == null ? null : round1(points),
        dropped: dropped
      });
    }

    /* Everything dropped → null, not 0. "We cannot score this yet" and "this beta scores zero"
       are opposite messages and only one of them is true in week one. */
    return { score: keptWeight > 0 ? Math.round(score) : null, components: components };
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     14 · TIMELINE  (per-player drill-down)
     ════════════════════════════════════════════════════════════════════════════════════════ */

  var SESSION_EVENTS = { session_start: 1, session_end: 1, return_visit: 1 };

  function fmtDuration(secs) {
    var s = Math.max(0, Math.round(secs));
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60), rest = s % 60;
    if (m < 60) return m + 'm ' + rest + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
  }

  /* Plain English a founder reads at a glance. No event names, no jargon, no percentages —
     this column exists so someone can scroll one tester's session and SEE where it went wrong
     without holding the event vocabulary in their head. */
  function eventLabel(name, props) {
    var pr = props || {};
    var page = pr.page == null ? '' : String(pr.page);

    switch (name) {
      case 'session_start':
        if (page === 'play') return 'Opened the play page';
        if (page === 'game' || page === 'chart-quest') return 'Opened the game';
        if (page === 'survey') return 'Opened the survey page';
        return 'Website opened';
      case 'session_end': {
        var s = num(pr.seconds);
        return s == null ? 'Session ended' : 'Session ended after ' + fmtDuration(s);
      }
      case 'return_visit': {
        var v = num(pr.visit);
        return v == null ? 'Came back' : 'Came back (visit ' + v + ')';
      }
      case 'tutorial_started':   return 'Tutorial started';
      /* CONTRACT §0.3 again — say what it actually means, in the timeline too. */
      case 'tutorial_completed': return 'Finished the guided intro (right after Guardian 1)';
      case 'first_trade_started':return 'Placed their first trade';
      case 'first_trade_won':    return 'First trade won';
      case 'first_trade_lost':   return 'First trade lost';
      case 'boss_started': {
        var lvl = num(pr.level);
        /* Level 1's guardian is the Gambler. boss_started carries the level, so anything else
           is named generically rather than guessed at. */
        if (lvl == null || lvl === 1) return 'Faced the Gambler';
        return 'Faced the level ' + lvl + ' boss';
      }
      case 'boss_defeated': {
        /* boss_defeated carries `attempts`, NOT `level` — the closed beta is gated to Level 1,
           so the boss is Guardian 1, the Gambler. If a level ever appears here, use it rather
           than keep asserting the Gambler. */
        var lv = num(pr.level);
        var att = num(pr.attempts);
        var who = (lv == null || lv === 1) ? 'Beat the Gambler' : 'Beat the level ' + lv + ' boss';
        return att != null && att > 1 ? who + ' (attempt ' + att + ')' : who;
      }
      case 'journal_unlocked':            return 'Journal unlocked';
      case 'journal_discovery_started':   return 'Started the Journal Discovery';
      case 'journal_discovery_completed': return 'Finished the Journal Discovery';
      case 'journal_discovery_skipped':   return 'Skipped the Journal Discovery';
      case 'beta_completed':              return 'Finished the beta';
      case 'survey_started':              return 'Started the survey';
      case 'survey_submitted':            return 'Sent the survey';
      case 'crash': {
        var m = String(pr.message == null ? '' : pr.message).replace(/\s+/g, ' ').trim();
        if (!m) return 'The game crashed';
        return 'The game crashed — ' + (m.length > 90 ? m.slice(0, 90) + '…' : m);
      }
      default:
        return String(name || 'Unknown event');
    }
  }

  function eventKind(name) {
    if (name === 'crash') return 'crash';
    return SESSION_EVENTS[name] ? 'session' : 'milestone';
  }

  /* Deliberately NOT window-filtered: this is a drill-down on one person, and the whole point is
     to see their entire run, including the visit that started before whatever window the
     dashboard happens to be showing. */
  function playerTimeline(events, surveys, playerId) {
    var ev = arr(events), sv = arr(surveys);
    var pid = playerId == null ? '' : String(playerId);

    var mine = [];
    for (var i = 0; i < ev.length; i++) {
      if (ev[i] && String(ev[i].player_id) === pid) mine.push(ev[i]);
    }
    mine.sort(function (a, b) {
      var x = eventMs(a), y = eventMs(b);
      if (x == null) return 1;
      if (y == null) return -1;
      if (x !== y) return x - y;
      /* Same millisecond (a batched flush lands several rows on one timestamp): fall back to the
         event_id so two engines agree on the order instead of shuffling on every render. */
      return String(a.event_id || '') < String(b.event_id || '') ? -1 : 1;
    });

    var base = null;
    for (i = 0; i < mine.length; i++) { var m = eventMs(mine[i]); if (m != null) { base = m; break; } }

    var rows = [];
    for (i = 0; i < mine.length; i++) {
      var e = mine[i];
      var ms = eventMs(e);
      var pr = propsOf(e);
      rows.push({
        ts: toIso(ms),
        offset_seconds: (ms == null || base == null) ? null : Math.round((ms - base) / 1000),
        name: e.name == null ? null : String(e.name),
        label: eventLabel(e.name, pr),
        props: pr,
        kind: eventKind(e.name)
      });
    }

    /* Latest survey wins. cq-track derives response_id from the player id and the ingest upserts
       on it, so a tester who re-answers REPLACES their answer — but a dump can still contain an
       older row from before that fix, and the newest is the one they meant. */
    var survey = null, surveyMsBest = null;
    for (i = 0; i < sv.length; i++) {
      if (!sv[i] || String(sv[i].player_id) !== pid) continue;
      var sms = surveyMs(sv[i]);
      if (survey == null || sms == null || surveyMsBest == null || sms >= surveyMsBest) {
        survey = sv[i]; surveyMsBest = sms;
      }
    }

    return {
      player_id: pid,
      events: rows,
      survey: survey ? shallow(survey) : null
    };
  }

  function shallow(o) {
    var out = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     15 · BUILD  — the whole model
     ════════════════════════════════════════════════════════════════════════════════════════ */

  function indexSurveysByPlayer(surveys) {
    var out = {}, best = {};
    for (var i = 0; i < surveys.length; i++) {
      var s = surveys[i];
      if (!s || !s.player_id) continue;
      var ms = surveyMs(s);
      var p = String(s.player_id);
      if (!(p in out) || best[p] == null || (ms != null && ms >= best[p])) { out[p] = s; best[p] = ms; }
    }
    return out;
  }

  function build(events, surveys, opts) {
    var o = opts || {};
    var allEvents = arr(events);
    var allSurveys = arr(surveys);

    var nowMs = parseTs(o.now);
    if (nowMs == null) nowMs = Date.now();     // injected in tests/parity so runs are repeatable

    var days = (o.days === 0 || o.days === '0') ? 0 : (num(o.days) != null ? Math.max(0, Math.round(o.days)) : 7);
    var buildFilter = (o.build == null || o.build === '') ? null : String(o.build);
    var includeTest = !!o.includeTestPlayers;
    var source = o.source ? String(o.source) : 'snapshot';

    /* PARITY DECISION 5: all-time has no start and therefore no previous window. */
    var fromMs = days > 0 ? (nowMs - days * DAY_MS) : null;
    var prevFromMs = days > 0 ? (fromMs - days * DAY_MS) : null;

    function inWindow(ms, lo, hi) {
      if (ms == null) return lo == null;       // an unparseable stamp only survives all-time
      if (lo != null && ms < lo) return false;
      if (hi != null && ms >= hi) return false;
      return true;
    }

    function sliceRows(lo, hi) {
      var ev = [], sv = [], i;
      for (i = 0; i < allEvents.length; i++) if (inWindow(eventMs(allEvents[i]), lo, hi)) ev.push(allEvents[i]);
      for (i = 0; i < allSurveys.length; i++) if (inWindow(surveyMs(allSurveys[i]), lo, hi)) sv.push(allSurveys[i]);
      return { events: ev, surveys: sv };
    }

    /* ── the pipeline, in this order, always: window → test exclusion → build cohort ────────
       Order matters. Excluding test ids first is what makes meta.excluded_* mean "team testing
       removed from THIS window"; filtering by build first would make the exclusion count depend
       on which build tab happened to be open. */
    function excludeTest(rows) {
      if (includeTest) return { rows: rows, ids: [], events: 0 };
      var keep = [], removedPlayers = {}, removed = 0;
      for (var i = 0; i < rows.length; i++) {
        var pid = rows[i] && rows[i].player_id;
        if (isTestPlayer(pid)) { removedPlayers[pid] = 1; removed++; continue; }
        keep.push(rows[i]);
      }
      return { rows: keep, ids: Object.keys(removedPlayers), events: removed };
    }

    function applyBuildCohort(ev, sv, cohort) {
      if (!buildFilter) return { events: ev, surveys: sv };
      /* PARITY DECISION 4. A row-level `props.build = '335'` filter would delete every
         session_end fired from the website (they carry build:""), and with them every second of
         session length, the completion clock and the exit stage — the selected build would look
         like nobody stayed. Filter the PLAYER by their entry build instead. */
      var keepEv = [], keepSv = [], i;
      for (i = 0; i < ev.length; i++) if (cohort[ev[i].player_id] === buildFilter) keepEv.push(ev[i]);
      for (i = 0; i < sv.length; i++) if (cohort[sv[i] && sv[i].player_id] === buildFilter) keepSv.push(sv[i]);
      return { events: keepEv, surveys: keepSv };
    }

    function prepare(lo, hi) {
      var raw = sliceRows(lo, hi);
      var evX = excludeTest(raw.events);
      var svX = excludeTest(raw.surveys);
      var cohort = entryBuildByPlayer(evX.rows);
      var filtered = applyBuildCohort(evX.rows, svX.rows, cohort);
      /* Re-derive the cohort from the KEPT rows once a build filter is on. Reusing the full map
         made the builds table render the other cohorts as ghost rows — "(unknown): 19 players,
         0 sessions, 0% completion" — while the rest of the dashboard correctly showed 2 players.
         A row that says 19 players completed nothing is a fabricated regression. */
      if (buildFilter) cohort = entryBuildByPlayer(filtered.events);
      /* Union the excluded ids across BOTH tables. A team id that only ever submitted a survey
         (GATE-B-003 rated the beta 9/10 and was being averaged in with the real testers) has no
         events to be counted by, and would otherwise vanish from the exclusion notice entirely —
         which is the one thing CONTRACT §0.7 forbids: exclusions are shown, never silent. */
      var excludedIds = {}, i;
      for (i = 0; i < evX.ids.length; i++) excludedIds[evX.ids[i]] = 1;
      for (i = 0; i < svX.ids.length; i++) excludedIds[svX.ids[i]] = 1;
      return {
        events: filtered.events,
        surveys: filtered.surveys,
        cohort: cohort,
        excluded_players: Object.keys(excludedIds).length,
        excluded_events: evX.events
      };
    }

    var cur = prepare(fromMs, null);
    var prev = days > 0 ? prepare(prevFromMs, fromMs) : null;

    /* AN EMPTY PREVIOUS WINDOW IS NOT A ZERO — IT IS "NO COMPARISON".
       The beta opened on 2026-08-03, so on day two every previous window predates the beta
       itself. Treating that absence as prev = 0 made every single KPI render a green ↑ off
       nothing: "players ↑, sessions ↑, completions ↑" on a dashboard whose entire job is to
       tell the founder what actually changed. Worse, it is directional noise that reads as
       success, so the one week where something genuinely regressed would look identical.
       No events in the prior window → prev is null → trend is flat and the UI draws no arrow. */
    if (prev && prev.events.length === 0 && prev.surveys.length === 0) prev = null;

    var curSlice = sliceWindow(cur.events, cur.surveys);
    var prevSlice = prev ? sliceWindow(prev.events, prev.surveys) : null;

    var curFunnel = buildFunnel(curSlice);
    var prevFunnel = prevSlice ? buildFunnel(prevSlice) : null;

    var curSurveysBlock = buildSurveys(curSlice);
    var prevSurveysBlock = prevSlice ? buildSurveys(prevSlice) : null;

    var surveysByPlayer = indexSurveysByPlayer(cur.surveys);
    var playersRoster = buildPlayers(curSlice, surveysByPlayer);

    /* Health for both windows through the identical function, on identical inputs. Passing the
       internal surveys block (which still carries _ratings_n) rather than the rendered one is an
       optimisation only — healthScore() recovers the same n from rating_dist when a caller hands
       it a finished model, which is why BetaModel.healthScore(model) reproduces this number. */
    function healthInput(slice, funnel) {
      return {
        funnel: funnel,
        surveys: slice.surveys_block,
        players_total: slice.players_total,
        crash_players: slice.crash_players
      };
    }
    var curHealth = healthScore(healthInput(curSlice, curFunnel));
    var prevHealth = prevSlice ? healthScore(healthInput(prevSlice, prevFunnel)) : null;

    /* ── KPI helpers over a slice ────────────────────────────────────────────────────────── */
    function stageN(slice, key) { return slice ? (slice.stage_size[key] || 0) : null; }
    function stagePct(slice, key) {
      if (!slice) return null;
      return pctInt(stageN(slice, key), slice.funnel_base);
    }

    function surveyCompletionPct(slice) {
      if (!slice) return null;
      var submitted = setSize(playersWith(slice.events, 'survey_submitted'));
      var completedN = setSize(playersWith(slice.events, 'beta_completed'));
      return pctInt(submitted, completedN);
    }
    function betaCompletedN(slice) {
      return slice ? setSize(playersWith(slice.events, 'beta_completed')) : null;
    }

    var kpis = {
      players_total: kpi(curSlice.players_total, prevSlice ? prevSlice.players_total : null,
        curSlice.players_total, 'players', null),

      players_new: kpi(curSlice.players_new, prevSlice ? prevSlice.players_new : null,
        curSlice.players_total, 'players',
        'New = never sent a return_visit. One session covers a whole visit (index → play → game → survey), not one per page.'),

      players_returning: kpi(curSlice.players_returning, prevSlice ? prevSlice.players_returning : null,
        curSlice.players_total, 'players',
        'Testers who came back at least once in this window.'),

      sessions: kpi(curSlice.sessions, prevSlice ? prevSlice.sessions : null,
        curSlice.sessions, 'sessions',
        'One session per visit, not per page — the four documents a tester loads share one id.'),

      completed_runs: kpi(betaCompletedN(curSlice), prevSlice ? betaCompletedN(prevSlice) : null,
        curSlice.players_total, 'players',
        'Milestones are once-per-player forever, so this counts people who finished, not finishes.'),

      avg_session_seconds: kpi(roundInt(mean(curSlice.session_seconds)),
        prevSlice ? roundInt(mean(prevSlice.session_seconds)) : null,
        curSlice.session_seconds.length, 'seconds',
        'Game pages only (game, chart-quest, play). Pooling a 6-second landing view with a 15-minute play session made this meaningless.'),

      median_session_seconds: kpi(roundInt(medianDisc(curSlice.session_seconds)),
        prevSlice ? roundInt(medianDisc(prevSlice.session_seconds)) : null,
        curSlice.session_seconds.length, 'seconds',
        'Game pages only, same filter as the average.'),

      avg_rating: kpi(curSurveysBlock.avg_rating, prevSurveysBlock ? prevSurveysBlock.avg_rating : null,
        curSlice.surveys_block._ratings_n, 'rating', 'Mean answer to "how was it", out of 10.'),

      survey_completion_pct: kpi(surveyCompletionPct(curSlice),
        prevSlice ? surveyCompletionPct(prevSlice) : null,
        betaCompletedN(curSlice), 'percent',
        'Survey submitted ÷ beta completed — the survey-handoff number. It agrees with the funnel: nothing follows "Survey submitted", so the monotonic pass cannot inflate it. It can read over 100% if someone reaches the survey without the completion ceremony stamping beta_completed.'),

      /* NOT "tutorial completion" — CONTRACT §0.3. */
      intro_completion_pct: kpi(stagePct(curSlice, 'intro_done'), prevSlice ? stagePct(prevSlice, 'intro_done') : null,
        curSlice.funnel_base, 'percent',
        'NOT the tutorial. tutorial_completed fires from introComplete(), which the game calls after Guardian 1 — it means the guided intro chain is over.'),

      boss_completion_pct: kpi(stagePct(curSlice, 'boss_won'), prevSlice ? stagePct(prevSlice, 'boss_won') : null,
        curSlice.funnel_base, 'percent',
        'Share of everyone who landed who beat the boss. Monotonic, so a player whose boss_defeated was lost but who reached a later stage still counts.'),

      /* UPPER BOUND, and say so. Journal Discovery is the one funnel stage a player can skip,
         but it sits BEFORE "Beta completed" in the contract's stage order, so the monotonic pass
         credits it to everyone who finished. On the live data that is the difference between
         "4 players finished the Journal" and one journal_discovery_completed event. Presenting
         it as a hard number would hide a skippable stage nobody actually did. */
      journal_completion_pct: kpi(stagePct(curSlice, 'journal'), prevSlice ? stagePct(prevSlice, 'journal') : null,
        curSlice.funnel_base, 'percent',
        'Upper bound. Monotonic crediting means everyone who finished the beta is counted here, including anyone who skipped the Journal Discovery — it is the only optional stage in the funnel.'),

      avg_time_to_boss_seconds: kpi(roundInt(mean(curSlice.time_to_boss)),
        prevSlice ? roundInt(mean(prevSlice.time_to_boss)) : null,
        curSlice.time_to_boss.length, 'seconds',
        'From the player’s first session_start in this window to boss_started. Players who arrived before the window are skipped — their arrival is not visible here.'),

      median_time_to_completion_seconds: kpi(roundInt(medianDisc(curSlice.completion_values)),
        prevSlice ? roundInt(medianDisc(prevSlice.completion_values)) : null,
        curSlice.completion_values.length, 'seconds',
        'One value per player. completion_seconds is re-sent on every later session_end, so counting rows let one finisher own the median.'),

      crash_players: kpi(curSlice.crash_players, prevSlice ? prevSlice.crash_players : null,
        curSlice.players_total, 'players',
        'Players who hit at least one crash. The client caps crash reporting at 3 per session, so this is a floor, not a ceiling.'),

      health_score: kpi(curHealth.score, prevHealth ? prevHealth.score : null,
        curSlice.players_total, 'score', healthNote(curHealth))
    };

    var model = {
      meta: {
        generated_at: toIso(nowMs),
        source: source,
        window_days: days,
        window_from: fromMs == null ? null : toIso(fromMs),
        build_filter: buildFilter,
        excluded_players: cur.excluded_players,
        excluded_events: cur.excluded_events,
        event_count: cur.events.length,
        survey_count: cur.surveys.length
      },
      kpis: kpis,
      funnel: curFunnel,
      timeseries: buildTimeseries(curSlice, fromMs, nowMs),
      players: playersRoster,
      players_total: playersRoster.length,
      /* Filled in by the UI via playerTimeline() when a player is selected — build() has no
         selection, and inventing one would ship a random tester's session as "the" timeline. */
      timeline: null,
      surveys: curSurveysBlock,
      builds: buildBuilds(curSlice, cur.cohort, surveysByPlayer),
      crashes: buildCrashes(curSlice),
      tech: buildTech(playersRoster)
    };

    return model;
  }

  /* The health KPI's note names the components that were dropped, because a composite nobody can
     decompose is a number nobody trusts (CONTRACT §3). */
  function healthNote(h) {
    if (!h) return null;
    var dropped = [];
    for (var i = 0; i < h.components.length; i++) if (h.components[i].dropped) dropped.push(h.components[i].key);
    if (h.score == null) return 'Not scoreable yet — every component is below the n≥3 minimum. A health score driven by one response is worse than no score.';
    if (!dropped.length) return 'All five components scored.';
    return dropped.length + ' of ' + h.components.length + ' components dropped for n<3 (' +
           dropped.join(', ') + '); the remaining weights were renormalised to 100.';
  }

  /* ════════════════════════════════════════════════════════════════════════════════════════
     16 · EXPORTS
     ════════════════════════════════════════════════════════════════════════════════════════ */

  return {
    VERSION: VERSION,
    FUNNEL: FUNNEL,
    TEST_PREFIXES: TEST_PREFIXES,
    GAME_PAGES: GAME_PAGES,
    HEALTH_COMPONENTS: HEALTH_COMPONENTS,
    UNKNOWN_BUILD: UNKNOWN_BUILD,
    isTestPlayer: isTestPlayer,
    build: build,
    playerTimeline: playerTimeline,
    healthScore: healthScore,
    /* Exported so the alerts module, the UI and the parity harness round, bucket and normalise
       through this file rather than growing their own near-identical copies. */
    util: {
      parseTs: parseTs,
      toIso: toIso,
      dayKey: dayKey,
      round1: round1,
      round3: round3,
      roundInt: roundInt,
      pctInt: pctInt,
      medianDisc: medianDisc,
      mean: mean,
      propsOf: propsOf,
      eventMs: eventMs,
      surveyMs: surveyMs,
      buildOf: buildOf,
      isGamePage: isGamePage,
      normaliseCrashMessage: normaliseCrashMessage,
      monotonicStages: monotonicStages,
      eventLabel: eventLabel,
      eventKind: eventKind,
      entryBuildByPlayer: entryBuildByPlayer,
      DAY_MS: DAY_MS
    }
  };
});
