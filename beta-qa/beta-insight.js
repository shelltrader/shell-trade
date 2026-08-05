/* ══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — BETA INSIGHT ENGINE                  window.BetaInsight      (beta-qa, v1)
   ------------------------------------------------------------------------------------------
   Turns a BetaModel (docs/beta-qa/BETA_MODEL_CONTRACT.md §2) into the three things the
   founder actually acts on:

       BetaInsight.alerts(model, prevModel)   → §4, every rule, every n-gate
       BetaInsight.recommendations(model)     → §5, ranked by PLAYERS LOST
       BetaInsight.clusterSurveys(surveys)    → candidate themes + the raw quotes
       BetaInsight.searchIndex(model)         → client-side global search index
       BetaInsight.search(index, query)       → ranked hits
       BetaInsight.analyze(model, prevModel)  → all of the above in one call

   Zero dependencies. No build step, no CDN, no npm. Runs as-is in Safari and Chrome, and
   under Node via module.exports (so the gate scripts in scripts/ can assert the thresholds).

   ── THIS MODULE NEVER TOUCHES RAW ROWS ────────────────────────────────────────────────────
   It reads the BetaModel shape and nothing else, exactly like the UI. Both engines (SQL and
   JS) produce that shape, so an insight cannot depend on which one is live. If a number is
   not in the model, this file does not invent it — it emits null and lets the UI say so.

   ── THE ONE RULE THAT MATTERS ─────────────────────────────────────────────────────────────
   A 1-of-1 loss must never outrank a 7-of-13 loss. That single mistake is what sends week
   one of a beta at the wrong problem. It is defended three times over:
     · every alert rule carries the n-gate from the contract (n ≥ 5 / n ≥ 3);
     · recommendations rank by ABSOLUTE players affected, never by rate and never by volume
       of complaint;
     · confidence is a function of how many DISTINCT people are behind a claim, so one tester
       saying a thing twice can never read as two.

   ── HONESTY: THIS IS KEYWORD CLUSTERING, NOT SENTIMENT ANALYSIS ───────────────────────────
   scripts/founder_report.py says it outright and this file holds the same line. Every cluster
   returned by clusterSurveys() is labelled `certainty: 'candidate'`, carries a `caveat`
   string naming the specific reason it might be wrong, and ALWAYS travels with the raw
   quotes and the distinct-player count. A keyword counter dressed up as sentiment would look
   authoritative while being driven by two people who happened to use the same word — on a
   ten-person beta that is worse than no analysis at all.

   The lexicons are copied VERBATIM from scripts/founder_report.py (THEMES / POSITIVE /
   NEGATIVE) so the dashboard and the weekly report cannot disagree about what a theme is,
   then extended with the q3 improvement categories the founder asked for. Both are exposed
   on BetaInsight.LEXICONS so a parity check can diff them against the Python file.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.BetaInsight = api;
})(
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  (typeof window !== 'undefined' && window) || null,
  function () {
    'use strict';

    var VERSION = '1.0.0';

    /* ══ 1 · THRESHOLDS ══════════════════════════════════════════════════════════════════
       Every one of these is straight out of the contract. They live in one object, exported,
       so a test can assert them instead of re-deriving them from the prose. Changing a number
       here changes the dashboard and nothing else — no rule reads a literal. */
    var T = {
      /* §4 alert gates */
      BOTTLENECK_DROP_PCT:        40,   // a stage loses ≥40% of the previous stage…
      BOTTLENECK_MIN_PREV_N:       5,   // …and the previous stage had at least this many players
      RATING_FLOOR:              8.0,   // window mean q1_rating below this warns
      RATING_MIN_N:                3,   // …with at least this many ratings
      RATING_COLLAPSE_DELTA:     1.5,   // drop vs previous window that is critical
      SURVEY_COMPLETION_FLOOR:    80,   // survey_submitted ÷ beta_completed, %
      SURVEY_COMPLETION_MIN_N:     5,   // …with at least this many completions
      BOSS_REGRESSION_PTS:        15,   // boss completion points lost vs the previous build
      BOSS_REGRESSION_MIN_N:       5,   // …both builds need this many players
      REPEAT_CRASH_MIN_PLAYERS:    2,   // the same message hitting this many players is critical
      SILENT_FUNNEL_MIN_LANDING:   5,   // ≥5 landed and zero reached tutorial_started

      /* §5 confidence / priority ladder. Same n for both, deliberately: the number of people
         behind a claim is the only thing that earns it a rank. */
      N_PRIORITY:                  5,   // High confidence / HIGH priority
      N_SIGNAL:                    3,   // Medium confidence / MEDIUM priority

      /* founder_report.py's own bar for "people recommend this game unprompted". Kept
         identical so the dashboard's recommendation and the weekly report's priority list
         cannot contradict each other on the same data. */
      RATING_RECOMMEND_BAR:        7,

      SEARCH_LIMIT:               40
    };

    /* ══ 2 · TINY HELPERS ════════════════════════════════════════════════════════════════ */

    function isFiniteNum(v) { return typeof v === 'number' && isFinite(v); }

    /* PostgREST returns `numeric` columns as JSON STRINGS, so a percentage that is a clean
       number in the snapshot engine arrives as "38.0" from the live RPC. Coercing here means
       a rule cannot silently stop firing just because the founder flipped the source toggle. */
    function num(v) {
      if (isFiniteNum(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
      return null;
    }
    function numOr(v, dflt) { var n = num(v); return n === null ? dflt : n; }
    function arr(v) { return Array.isArray(v) ? v : []; }
    function obj(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    function str(v) { return v === null || v === undefined ? '' : String(v); }
    function clean(s) { return str(s).replace(/\s+/g, ' ').trim(); }
    function trunc(s, n) { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
    function round1(x) { return Math.round(x * 10) / 10; }
    function pct(n, d) { return d ? (100 * n / d) : null; }
    function pctStr(x, dp) {
      if (x === null || x === undefined || !isFinite(x)) return '—';
      return (dp ? round1(x).toFixed(dp) : Math.round(x)) + '%';
    }
    function plural(n, one, many) { return n === 1 ? one : (many || (one + 's')); }

    /* Stable descending sort. Array.prototype.sort IS stable in every engine this ships to,
       but decorating with the original index makes the tie-break explicit and testable
       instead of a property of the runtime. */
    function stableSort(list, cmp) {
      return list.map(function (v, i) { return { v: v, i: i }; })
        .sort(function (a, b) { return cmp(a.v, b.v) || (a.i - b.i); })
        .map(function (d) { return d.v; });
    }

    /* A rule that throws must not take the whole alert list with it. The dashboard is read by
       a founder at 7am; half a list is useful, a blank screen is not. */
    function guarded(label, fn, fallback) {
      try { return fn(); } catch (e) {
        if (typeof console !== 'undefined' && console && console.warn) {
          console.warn('[BetaInsight] ' + label + ' failed:', e && e.message ? e.message : e);
        }
        return fallback;
      }
    }

    /* Small stable hash, used only to give a crash signature a URL-safe key so the UI can
       diff "same alert as yesterday" without carrying a 500-char message around. */
    function slugKey(s) {
      var t = str(s), h = 5381, i;
      for (i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
      return (h >>> 0).toString(36);
    }

    /* ══ 3 · MODEL ACCESSORS ═════════════════════════════════════════════════════════════
       Everything downstream reads the model through these, so a partial model (a window with
       no surveys, an RPC that returned early) degrades to nulls instead of TypeErrors. */

    function kpi(model, key) {
      var k = obj(obj(model).kpis)[key];
      return {
        value: num(obj(k).value),
        prev: num(obj(k).prev),
        n: num(obj(k).n),
        /* Some producers carry the previous window's sample size; most do not. Rules that
           need it fall back to prevModel and refuse to fire when neither is available. */
        prev_n: num(obj(k).prev_n),
        unit: str(obj(k).unit),
        note: str(obj(k).note)
      };
    }

    /* Instrumented stages only. §1: `instrumented:false` stages are EXCLUDED from drop-off
       maths — `play_click` has no event at all, so treating it as a stage manufactures a
       100% loss and buries the real bottleneck under a phantom one. A missing flag is
       treated as instrumented, because the older snapshot files predate the field. */
    function funnelStages(model) {
      return arr(obj(model).funnel).filter(function (r) {
        return r && typeof r === 'object' && r.instrumented !== false;
      });
    }

    function stageByKey(model, key) {
      var rows = arr(obj(model).funnel), i;
      for (i = 0; i < rows.length; i++) if (rows[i] && rows[i].key === key) return rows[i];
      return null;
    }
    function stagePlayers(model, key) {
      var r = stageByKey(model, key);
      return r ? num(r.players) : null;
    }
    function stageLabel(row) { return clean(obj(row).label) || clean(obj(row).key) || 'stage'; }

    /* Each consecutive pair of INSTRUMENTED stages, with the loss between them.
       Recomputed here rather than trusting row.drop_players so the arithmetic is anchored to
       the stage chain this function actually walked; a transition whose two ends are not both
       real numbers is skipped entirely, because "unknown" must never render as "lost 0". */
    function transitions(model) {
      var rows = funnelStages(model), out = [], i, prev = null;
      for (i = 0; i < rows.length; i++) {
        var cur = rows[i], curN = num(cur.players);
        if (prev !== null) {
          var prevN = num(prev.players);
          if (prevN !== null && curN !== null) {
            var lost = Math.max(0, prevN - curN);
            out.push({
              from_key: str(prev.key), from_label: stageLabel(prev), from_players: prevN,
              to_key: str(cur.key), to_label: stageLabel(cur), to_players: curN,
              lost: lost,
              drop_pct: prevN > 0 ? (100 * lost / prevN) : null,
              kept_pct: prevN > 0 ? (100 * curN / prevN) : null,
              /* §0.8 — a stage reading zero is more often broken instrumentation than a broken
                 game, and the two need opposite fixes. Flagged, never silently blamed. */
              suspect_instrumentation: curN === 0 && prevN >= T.BOTTLENECK_MIN_PREV_N
            });
          }
        }
        prev = cur;
      }
      return out;
    }

    function surveyResponses(model) {
      var m = obj(model);
      var r = arr(obj(m.surveys).responses);
      if (r.length) return r;
      /* clusterSurveys() is also called with a bare array or a {responses:[]} blob. */
      if (Array.isArray(m.responses)) return m.responses;
      return [];
    }

    function ratingsOf(rows) {
      var out = [], i, v;
      for (i = 0; i < rows.length; i++) {
        v = num(obj(rows[i]).q1_rating);
        if (v !== null) out.push(v);
      }
      return out;
    }
    function mean(list) {
      if (!list.length) return null;
      var s = 0, i;
      for (i = 0; i < list.length; i++) s += list[i];
      return s / list.length;
    }

    /* Window mean rating + the n behind it. Prefers the KPI (the two engines compute it
       identically and it already respects the window/build filter) and falls back to the raw
       responses only when the KPI is absent. */
    function ratingWindow(model) {
      var k = kpi(model, 'avg_rating');
      if (k.value !== null && k.n !== null) return { avg: k.value, n: k.n };
      var s = obj(obj(model).surveys);
      var rows = surveyResponses(model);
      var rr = ratingsOf(rows);
      var avg = num(s.avg_rating);
      if (avg === null) avg = mean(rr);
      return { avg: avg, n: rr.length ? rr.length : num(s.n) };
    }

    function distinctPlayers(quotes) {
      var seen = {}, n = 0, i, key;
      for (i = 0; i < quotes.length; i++) {
        /* An anonymous quote counts as its own observation. Folding every null player_id
           into one bucket would under-count real people; giving each its own key can only
           over-count anonymous rows, which the beta does not produce. */
        key = clean(obj(quotes[i]).player_id) || ('::anon:' + i);   // synthetic: ':' never appears in a generated pid
        if (!seen[key]) { seen[key] = 1; n++; }
      }
      return n;
    }

    /* ══ 4 · LEXICONS ════════════════════════════════════════════════════════════════════
       THEMES / POSITIVE / NEGATIVE below are a VERBATIM copy of scripts/founder_report.py.
       Do not "improve" them here — a theme that means one thing in the dashboard and another
       in the weekly report is worse than a theme that is slightly wrong in both.

       The apostrophes below are the U+2019 curly form the Python file uses, character for
       character. They are matched case- AND apostrophe-insensitively by fold() further down —
       see the comment there for the bug that fixes. */
    var THEMES = {
      'Controls & movement': ['control', 'jump', 'move', 'boost', 'rocket', 'stuck', 'fell', 'falling',
                              'physics', 'touch', 'button', 'tap', 'swipe', 'joystick'],
      'Trading & setups':    ['trade', 'trading', 'setup', 'entry', 'stop', 'profit', 'buy', 'sell',
                              'long', 'short', 'position', 'risk'],
      'Boss fight':          ['boss', 'gambler', 'guardian', 'fight', 'battle', 'attack', 'roar'],
      'Teaching & clarity':  ['confus', 'unclear', 'understand', 'explain', 'lesson', 'tutorial',
                              'teach', 'learn', 'lost', 'know what', 'didn’t get', 'did not get'],
      'Chart & candles':     ['chart', 'candle', 'wick', 'green', 'red', 'price', 'market'],
      'Journal':             ['journal', 'notebook', 'page', 'chapter'],
      'Pacing & length':     ['slow', 'long', 'short', 'fast', 'drag', 'boring', 'repetitive', 'pace',
                              'wait', 'quick'],
      'Difficulty':          ['hard', 'easy', 'difficult', 'challeng', 'frustrat', 'unfair', 'died'],
      'Audio':               ['music', 'sound', 'audio', 'loud', 'mute', 'song'],
      'Visuals & art':       ['art', 'graphic', 'look', 'beautiful', 'pretty', 'ugly', 'visual',
                              'animation', 'colour', 'color'],
      'Performance & bugs':  ['lag', 'slow load', 'crash', 'bug', 'glitch', 'freeze', 'broke', 'stuck on',
                              'loading', 'wouldn’t load', 'would not load'],
      'Mobile experience':   ['phone', 'mobile', 'ipad', 'tablet', 'screen', 'portrait', 'landscape'],
      'Wanting more':        ['more level', 'world 2', 'next level', 'more content', 'keep going',
                              'more of', 'want more', 'continue']
    };

    var POSITIVE = ['love', 'loved', 'great', 'awesome', 'fun', 'brilliant', 'nice', 'cool', 'enjoy',
                    'satisfying', 'addictive', 'clever', 'beautiful', 'smooth', 'good'];
    var NEGATIVE = ['confus', 'boring', 'frustrat', 'annoying', 'hate', 'broke', 'bug', 'unclear',
                    'hard to', 'too slow', 'too long', 'didn’t like', 'did not like', 'bad', 'worst'];

    /* ── the q3 "one thing to change" categories the founder asked for ──────────────────────
       A SEPARATE AXIS, not extra THEMES entries. Two of these names (Audio, Difficulty) already
       exist in THEMES with different word lists; merging them would either silently rewrite a
       report theme or produce two near-duplicate rows in one list, and "Trading 3 / Trading &
       setups 4" in the same table is exactly the kind of thing that makes a founder stop
       trusting the dashboard. They are clustered over q3_improvement only — the question is
       "what one thing would you change", so a hit here is a request, not a mention. */
    var IMPROVEMENT_CATEGORIES = {
      'Audio':        ['music', 'sound', 'audio', 'loud', 'quiet', 'volume', 'mute', 'song', 'sfx',
                       'noise', 'soundtrack'],
      'Difficulty':   ['hard', 'easy', 'difficult', 'challeng', 'frustrat', 'unfair', 'died', 'too easy',
                       'too hard', 'impossible', 'balance'],
      'Tutorial':     ['tutorial', 'intro', 'teach', 'taught', 'explain', 'instruction', 'onboard',
                       'guide', 'walkthrough', 'confus', 'unclear', 'didn’t know', 'did not know',
                       'know what to do', 'didn’t get', 'did not get'],
      'Trading':      ['trade', 'trading', 'setup', 'entry', 'exit', 'stop', 'profit', 'buy', 'sell',
                       'long', 'short', 'position', 'risk', 'chart', 'candle'],
      /* 'key' is deliberately NOT here — "the key thing is…" is ordinary English and would drag
         half the free text into Controls. Only the physical-input senses. */
      'Controls':     ['control', 'jump', 'move', 'boost', 'button', 'tap', 'swipe', 'joystick',
                       'touch', 'keyboard', 'arrow key', 'input', 'responsive'],
      /* Bare 'read' is NOT here either. This is a game about READING A CHART, so "I could finally
         read the candles" is the product working, not a UI complaint — only the legibility
         phrasings count. */
      'UI':           ['ui', 'menu', 'hud', 'text', 'font', 'hard to read', 'readable', 'layout',
                       'screen too', 'interface', 'icon', 'label', 'small text', 'hard to see'],
      'Animations':   ['animation', 'animate', 'transition', 'cutscene', 'cinematic', 'sprite', 'motion',
                       'smoother', 'juice'],
      'Performance':  ['lag', 'laggy', 'fps', 'frame', 'slow load', 'loading', 'stutter', 'freeze',
                       'crash', 'performance', 'battery', 'hot']
    };

    /* q2 = "when did it become fun". Clustered to the six buckets the founder named. A quote
       may land in several (a boss fight IS trading), which is correct; 'Other' is the fallback
       for a quote that matched nothing, and an empty bucket is information — "nobody said the
       Journal" is a finding, not a gap in the data. */
    var HOOK_BUCKETS = [
      { label: 'Boss',        words: ['boss', 'gambler', 'guardian', 'fight', 'battle', 'defeat', 'beat the',
                                      'attack', 'roar'] },
      { label: 'Trading',     words: ['trade', 'trading', 'buy', 'sell', 'long', 'short', 'entry', 'profit',
                                      'chart', 'candle', 'setup', 'market', 'win', 'won'] },
      { label: 'Journal',     words: ['journal', 'notebook', 'page', 'chapter', 'wisdom', 'discovery'] },
      { label: 'Movement',    words: ['jump', 'jumping', 'move', 'movement', 'run', 'running', 'boost',
                                      'rocket', 'platform', 'speed', 'control', 'physics'] },
      { label: 'Exploration', words: ['explor', 'secret', 'hidden', 'shell', 'collect', 'world', 'level',
                                      'discover', 'map', 'find', 'found'] },
      { label: 'Other',       words: [] }
    ];

    /* Which words tie a free-text quote to a funnel stage, so a bottleneck alert can carry the
       verbatim that explains it. Reuses the THEMES lists wherever one already exists, so the
       dashboard's idea of "a boss comment" is the report's idea of a boss comment. */
    var STAGE_KEYWORDS = {
      landing:        ['load', 'loading', 'website', 'link', 'open', 'page'],
      play_click:     ['play button', 'start', 'begin'],
      tutorial:       THEMES['Teaching & clarity'].concat(['intro', 'onboard']),
      movement:       THEMES['Controls & movement'],
      intro_done:     THEMES['Teaching & clarity'].concat(['intro', 'guardian', 'gambler']),
      trade:          THEMES['Trading & setups'],
      boss:           THEMES['Boss fight'],
      boss_won:       THEMES['Boss fight'],
      journal_unlock: THEMES['Journal'],
      journal:        THEMES['Journal'],
      survey_start:   ['survey', 'question', 'form', 'feedback'],
      survey:         ['survey', 'question', 'form', 'feedback'],
      completed:      ['finish', 'finished', 'ending', 'the end', 'complete']
    };

    /* Apostrophe folding. The Python lexicon contains ONLY the curly form ('didn’t get'),
       so a tester who typed an ASCII apostrophe — which is what every physical keyboard and
       most Android IMEs produce — was invisible to that theme in the weekly report. Folding
       BOTH sides to the straight form can only ever add matches, never remove one, so the
       dashboard stays a superset of the report rather than drifting away from it. */
    function fold(s) {
      return str(s).replace(/[‘’ʼ´`]/g, "'").toLowerCase();
    }
    function foldList(words) { return words.map(fold); }
    function foldMap(map) {
      var out = {}, k;
      for (k in map) if (Object.prototype.hasOwnProperty.call(map, k)) out[k] = foldList(map[k]);
      return out;
    }
    var F_THEMES = foldMap(THEMES);
    var F_IMPROVEMENTS = foldMap(IMPROVEMENT_CATEGORIES);
    var F_POSITIVE = foldList(POSITIVE);
    var F_NEGATIVE = foldList(NEGATIVE);
    var F_STAGE_KEYWORDS = foldMap(STAGE_KEYWORDS);
    var F_HOOKS = HOOK_BUCKETS.map(function (b) { return { label: b.label, words: foldList(b.words) }; });

    function matchedWords(low, words) {
      var hits = [], i;
      for (i = 0; i < words.length; i++) if (words[i] && low.indexOf(words[i]) >= 0) hits.push(words[i]);
      return hits;
    }
    function hits(low, words) { return matchedWords(low, words).length > 0; }

    /* Verbatim port of founder_report.tone(). Not sentiment analysis — a word count with a
       tie-break, and it is only ever used to SPLIT quotes into two piles a human then reads. */
    function tone(text) {
      var low = fold(text);
      var p = matchedWords(low, F_POSITIVE).length;
      var n = matchedWords(low, F_NEGATIVE).length;
      return p > n ? 'positive' : (n > p ? 'negative' : 'neutral');
    }

    /* ══ 5 · CONFIDENCE, PRIORITY, EFFORT ════════════════════════════════════════════════ */

    /* §5: Low below n=3, Medium at 3–4, High at n ≥ 5 — where n is the number of DISTINCT
       people behind the claim. One tester saying something twice is one data point. */
    function confidenceFor(n) {
      var v = numOr(n, 0);
      if (v >= T.N_PRIORITY) return 'High';
      if (v >= T.N_SIGNAL) return 'Medium';
      return 'Low';
    }

    /* Priority uses the SAME ladder as confidence, on purpose. If a claim is not confident
       enough to be believed it is not important enough to be HIGH, no matter how it reads. */
    function priorityFor(n) {
      var v = numOr(n, 0);
      if (v >= T.N_PRIORITY) return 'HIGH';
      if (v >= T.N_SIGNAL) return 'MEDIUM';
      return 'LOW';
    }

    /* estimated_effort is a PRIOR, not a measurement. The event stream knows nothing about
       implementation cost, so these are the honest defaults for a kind of work and the founder
       is expected to overwrite them. Naming them here beats inventing a different guess at
       each call site. */
    var EFFORT = {
      instrumentation: 'Low',     // check a call site / an origin allowlist
      crash: 'Low',               // a stack trace and a repro already exist
      funnel: 'Medium',           // a stage of the game needs changing
      survey: 'Medium',
      rating: 'High',             // "make the game better" is not a ticket
      retention: 'Medium'
    };

    var LEVEL_RANK = { critical: 0, warn: 1, info: 2 };
    var SOURCE_RANK = { funnel: 0, crash: 1, survey: 2 };
    var PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    /* ══ 6 · ALERTS  (contract §4) ═══════════════════════════════════════════════════════ */

    function alert(level, key, title, detail, evidence, playersAffected) {
      return {
        level: level,
        title: title,
        detail: detail,
        evidence: arr(evidence).filter(Boolean),
        /* An alert without the count that triggered it is an opinion. Always a number. */
        players_affected: Math.max(0, Math.round(numOr(playersAffected, 0))),
        key: key
      };
    }

    /* Up to `limit` verbatims that mention a stage, for the item that says players are leaving
       there. The quotes never change the ranking — they explain it.

       q2_hook is DELIBERATELY excluded: "when it clicked" answers are what worked, and hanging
       “the first trade I won” under a first-trade drop-off reads as evidence for the opposite of
       what the funnel is saying. Only the two "what would you change / anything else" answers can
       explain a loss. */
    function quotesForStage(model, stageKey, limit) {
      var words = F_STAGE_KEYWORDS[stageKey];
      if (!words || !words.length) return [];
      var all = collectQuotes(surveyResponses(model), ['q3_improvement', 'q5_anything']), out = [], i;
      for (i = 0; i < all.length && out.length < (limit || 2); i++) {
        if (hits(fold(all[i].text), words)) {
          out.push('“' + trunc(all[i].text, 160) + '” — ' + QUESTION_LABEL[all[i].question]);
        }
      }
      return out;
    }

    function alerts(model, prevModel) {
      var out = [];
      var m = obj(model);

      /* ── No data ─────────────────────────────────────────────────────────────────────────
         Fired FIRST and on its own terms. "Nobody played" and "the pipe is broken" look
         identical from here, and this project has already shipped a domain move that silently
         403'd every telemetry POST while the game itself worked perfectly. */
      guarded('no_data', function () {
        var events = num(obj(m.meta).event_count);
        var surveys = numOr(obj(m.meta).survey_count, 0);
        /* Older snapshots predate meta.event_count. Fall back to "zero players and zero
           surveys", and stay silent when even that is unknown — an empty dashboard because the
           model failed to load must not be reported as an empty beta. */
        if (events === null) {
          var pt = kpi(m, 'players_total').value;
          events = (pt === 0 && surveys === 0) ? 0 : null;
        }
        if (events !== null && events === 0) {
          out.push(alert('info', 'no_data',
            'No events in this window',
            'Zero events reached the database. Before concluding nobody played, confirm the pipe: ' +
            'hard-refresh the landing page and check the row count. A CORS or origin-allowlist ' +
            'failure looks exactly like an empty beta.' +
            (surveys > 0 ? ' Note ' + surveys + ' survey ' + plural(surveys, 'response') +
              ' did arrive, which means at least one tester finished — so the event stream, not the players, is missing.' : ''),
            ['meta.event_count = 0', 'meta.survey_count = ' + surveys],
            0));
        }
      });

      /* ── Stage bottleneck ────────────────────────────────────────────────────────────────
         ≥40% of the previous stage lost, AND the previous stage had n ≥ 5. The gate is the
         whole point: without it a 1-of-1 loss reads as a 100% catastrophe and outranks the
         7-of-13 that is actually costing the beta. */
      guarded('bottleneck', function () {
        var ts = transitions(m), i;
        var qualifying = [];
        for (i = 0; i < ts.length; i++) {
          var t = ts[i];
          if (t.from_players < T.BOTTLENECK_MIN_PREV_N) continue;
          if (t.drop_pct === null || t.drop_pct < T.BOTTLENECK_DROP_PCT) continue;
          qualifying.push(t);
        }
        qualifying = stableSort(qualifying, function (a, b) { return b.lost - a.lost; });
        for (i = 0; i < qualifying.length; i++) {
          var q = qualifying[i];
          var ev = [
            q.from_label + ': ' + q.from_players + ' ' + plural(q.from_players, 'player'),
            q.to_label + ': ' + q.to_players + ' ' + plural(q.to_players, 'player') +
              ' (' + pctStr(q.kept_pct) + ' kept)',
            'Lost ' + q.lost + ' ' + plural(q.lost, 'player') + ' — ' + pctStr(q.drop_pct) + ' of the previous stage'
          ].concat(quotesForStage(m, q.to_key, 2));

          out.push(alert('critical', 'bottleneck:' + q.from_key + '>' + q.to_key,
            'Bottleneck: ' + q.from_label + ' → ' + q.to_label,
            q.lost + ' of ' + q.from_players + ' ' + plural(q.from_players, 'player') + ' (' +
            pctStr(q.drop_pct) + ') who reached "' + q.from_label + '" never reached "' + q.to_label + '".' +
            (q.suspect_instrumentation
              ? ' NOTE: this stage reads exactly zero. A 0% stage is more often broken instrumentation ' +
                'than a broken game — verify the event fires before changing anything in the game.'
              : ''),
            ev, q.lost));
        }
      });

      /* ── Silent funnel ───────────────────────────────────────────────────────────────────
         ≥5 landed, zero started the tutorial. tutorial_started is detected by POLLING
         introFlow.active, so a tester who skips the intro never fires it — this is a warning
         about the instrument, not an accusation against the players. */
      guarded('silent_funnel', function () {
        var landing = stagePlayers(m, 'landing');
        var tutorial = stagePlayers(m, 'tutorial');
        if (landing !== null && tutorial !== null &&
            landing >= T.SILENT_FUNNEL_MIN_LANDING && tutorial === 0) {
          out.push(alert('warn', 'silent_funnel',
            'Silent funnel: ' + landing + ' landed, zero started the tutorial',
            'Suspect instrumentation before players. tutorial_started is detected by polling ' +
            'introFlow.active, so a tester who skips the intro never fires it, and every event ' +
            'below session_start dies silently if the beta-ingest origin allowlist is missing the ' +
            'domain being played on — which has bitten this project on a domain move.',
            ['Landing page: ' + landing + ' ' + plural(landing, 'player'), 'Tutorial started: 0 players'],
            landing));
        }
      });

      /* ── Rating decline / collapse ───────────────────────────────────────────────────── */
      guarded('rating', function () {
        var cur = ratingWindow(m);
        if (cur.avg === null || cur.n === null) return;

        if (cur.n >= T.RATING_MIN_N && cur.avg < T.RATING_FLOOR) {
          out.push(alert('warn', 'rating_decline',
            'Average rating ' + round1(cur.avg) + '/10',
            'Mean q1_rating is below ' + T.RATING_FLOOR + '/10 across ' + cur.n + ' ' +
            plural(cur.n, 'response') + '. Read the "one thing to change" answers as the ranked backlog.',
            ['mean q1_rating = ' + round1(cur.avg) + ' (n=' + cur.n + ')'],
            cur.n));
        }

        /* The collapse rule needs the PREVIOUS window's n, not just its mean. kpis.avg_rating.prev
           carries a value but no sample size, so firing on it alone would let a single 3/10 in a
           one-response window read as a collapse. Without a trustworthy prev n we say nothing. */
        var prevAvg = null, prevN = null;
        if (prevModel) {
          var p = ratingWindow(prevModel);
          prevAvg = p.avg; prevN = p.n;
        } else {
          var k = kpi(m, 'avg_rating');
          if (k.prev !== null && k.prev_n !== null) { prevAvg = k.prev; prevN = k.prev_n; }
        }
        if (prevAvg === null || prevN === null) return;
        if (cur.n < T.RATING_MIN_N || prevN < T.RATING_MIN_N) return;

        var delta = prevAvg - cur.avg;
        if (delta >= T.RATING_COLLAPSE_DELTA) {
          out.push(alert('critical', 'rating_collapse',
            'Rating collapse: ' + round1(prevAvg) + ' → ' + round1(cur.avg) + '/10',
            'The window mean fell ' + round1(delta) + ' points against the previous window of equal ' +
            'length (n=' + cur.n + ' now, n=' + prevN + ' before). Check what shipped between the two ' +
            'windows before reading the quotes — a build is the usual cause of a step change this size.',
            ['this window: ' + round1(cur.avg) + '/10 (n=' + cur.n + ')',
             'previous window: ' + round1(prevAvg) + '/10 (n=' + prevN + ')'],
            cur.n));
        }
      });

      /* ── Survey completion ───────────────────────────────────────────────────────────────
         MUST come from the KPI, never from the funnel. The funnel is monotonic and
         `survey_submitted` sits BEFORE `beta_completed` in the stage order, so every player
         credited with completing is also credited with the survey — funnel-derived survey
         completion is ≥100% by construction and this alert would never fire. */
      guarded('survey_completion', function () {
        var completions = kpi(m, 'completed_runs').value;
        if (completions === null) completions = stagePlayers(m, 'completed');
        if (completions === null || completions < T.SURVEY_COMPLETION_MIN_N) return;

        var p = kpi(m, 'survey_completion_pct').value;
        if (p === null) {
          var n = num(obj(m.surveys).n);
          if (n === null) return;
          p = pct(n, completions);
        }
        if (p === null || p >= T.SURVEY_COMPLETION_FLOOR) return;

        var submitted = Math.round(completions * p / 100);
        var missing = Math.max(0, completions - submitted);
        out.push(alert('warn', 'survey_completion',
          'Only ' + pctStr(p) + ' of finishers filled in the survey',
          missing + ' of ' + completions + ' ' + plural(completions, 'player') + ' who finished the beta ' +
          'never submitted the survey. On a cohort this small that is the feedback budget, and it points ' +
          'at the handoff — check that Continue on the completion ceremony actually reaches survey.html.',
          ['beta_completed: ' + completions + ' players',
           'survey_submitted: ' + submitted + ' players (' + pctStr(p) + ')'],
          missing));
      });

      /* ── Boss regression between builds ────────────────────────────────────────────────── */
      guarded('boss_regression', function () {
        var builds = orderedBuilds(m);
        if (builds.length < 2) return;
        var cur = builds[builds.length - 1], prev = builds[builds.length - 2];
        var curN = num(cur.players), prevN = num(prev.players);
        var curPct = num(cur.boss_pct), prevPct = num(prev.boss_pct);
        if (curN === null || prevN === null || curPct === null || prevPct === null) return;
        if (curN < T.BOSS_REGRESSION_MIN_N || prevN < T.BOSS_REGRESSION_MIN_N) return;

        var drop = prevPct - curPct;
        if (drop < T.BOSS_REGRESSION_PTS) return;

        /* An ESTIMATE, and labelled as one: how many of this build's players would have beaten
           the boss at the old rate. The event stream cannot know which individuals those are. */
        var affected = Math.max(1, Math.round(drop / 100 * curN));
        out.push(alert('critical', 'boss_regression:' + str(cur.build) + '<' + str(prev.build),
          'Boss completion fell ' + Math.round(drop) + 'pts on build ' + str(cur.build),
          'Build ' + str(prev.build) + ' finished the boss at ' + pctStr(prevPct) + ' (n=' + prevN + '); ' +
          'build ' + str(cur.build) + ' is at ' + pctStr(curPct) + ' (n=' + curN + '). ' +
          'Roughly ' + affected + ' ' + plural(affected, 'player') + ' in the new cohort would have won at ' +
          'the old rate — an estimate from the two rates, not a count of named players. ' +
          'Diff the boss code between the two builds first.',
          ['build ' + str(prev.build) + ': ' + pctStr(prevPct) + ' boss completion (n=' + prevN + ')',
           'build ' + str(cur.build) + ': ' + pctStr(curPct) + ' boss completion (n=' + curN + ')'],
          affected));
      });

      /* ── Repeat crash ────────────────────────────────────────────────────────────────────
         The same message on ≥2 players is a reproducible bug, whatever the cohort size. */
      guarded('repeat_crash', function () {
        var rows = arr(m.crashes).filter(function (c) {
          return c && numOr(c.players, 0) >= T.REPEAT_CRASH_MIN_PLAYERS;
        });
        rows = stableSort(rows, function (a, b) {
          return (numOr(b.players, 0) - numOr(a.players, 0)) || (numOr(b.count, 0) - numOr(a.count, 0));
        });
        rows.forEach(function (c) {
          var players = Math.round(numOr(c.players, 0));
          var count = Math.round(numOr(c.count, 0));
          var msg = clean(c.message) || '(no message)';
          out.push(alert('critical', 'crash:' + slugKey(msg + '|' + str(c.build)),
            'Repeat crash on ' + players + ' players: ' + trunc(msg, 70),
            'Same crash signature across ' + players + ' ' + plural(players, 'player') + ' (' + count + ' ' +
            plural(count, 'event') + ')' + (c.build ? ' on build ' + str(c.build) : '') +
            (c.kind ? ', kind "' + str(c.kind) + '"' : '') + '. ' +
            'Reproducible on more than one device, so it is a bug and not a tester.',
            [trunc(msg, 240), c.where ? 'at ' + trunc(c.where, 120) : '',
             'first seen ' + (str(c.first_seen) || 'unknown') + ', last seen ' + (str(c.last_seen) || 'unknown')],
            players));
        });
      });

      /* Critical before warn before info; inside a level, the most players first. The gates
         above already stopped a tiny sample from getting here — this sort makes sure that when
         two real problems compete, the one costing more people is on top. */
      return stableSort(out, function (a, b) {
        return (LEVEL_RANK[a.level] - LEVEL_RANK[b.level]) || (b.players_affected - a.players_affected);
      });
    }

    /* Builds oldest → newest, excluding the "(unknown)" bucket (it is not a release and cannot
       be compared to one). Numeric build tags sort numerically — string sort would put build
       "9" after "335" and invent a regression that never happened. */
    function orderedBuilds(model) {
      var rows = arr(obj(model).builds).filter(function (b) {
        var id = clean(obj(b).build);
        return id && id !== '(unknown)' && id !== 'unknown';
      });
      var allNumeric = rows.every(function (b) { return num(b.build) !== null; });
      return stableSort(rows, function (a, b) {
        if (allNumeric) return num(a.build) - num(b.build);
        return str(a.first_seen) < str(b.first_seen) ? -1 : (str(a.first_seen) > str(b.first_seen) ? 1 : 0);
      });
    }

    /* ══ 7 · SURVEY CLUSTERING  (candidates, never conclusions) ═══════════════════════════ */

    var QUESTION_LABEL = {
      q2_hook: 'when it clicked',
      q3_improvement: 'one thing to change',
      q5_anything: 'anything else'
    };
    var QUESTION_ORDER = ['q2_hook', 'q3_improvement', 'q5_anything'];

    function quoteFrom(row, field) {
      var text = clean(obj(row)[field]);
      if (!text) return null;
      return {
        text: text,
        player_id: clean(obj(row).player_id) || null,
        created_at: clean(obj(row).created_at) || null,
        question: field,
        question_label: QUESTION_LABEL[field] || field,
        rating: num(obj(row).q1_rating),
        continue_intent: clean(obj(row).q4_continue) || null
      };
    }

    /* All free text as quote objects. Order is q2 for every row, then q3 for every row, then
       q5 — the same concatenation founder_report.py uses (hooks + improves + extras), so a
       theme's membership here matches the weekly report's exactly. */
    function collectQuotes(rows, fields) {
      var use = fields || QUESTION_ORDER;
      var out = [], f, i, q;
      for (f = 0; f < use.length; f++) {
        for (i = 0; i < rows.length; i++) {
          q = quoteFrom(rows[i], use[f]);
          if (q) out.push(q);
        }
      }
      return out;
    }

    /* The caveat is written per cluster, not boilerplate, because the reason a cluster might be
       wrong changes with its shape: one voice, one word, or a real pattern. */
    function caveatFor(quoteCount, playerCount, sampleWords) {
      var base = 'Keyword match, not sentiment analysis — candidate only.';
      /* An empty bucket is kept and reported (see clusterHooks), so it needs a caveat that says
         "nobody said this", not the single-tester wording that 0 would otherwise fall into. */
      if (quoteCount === 0) {
        return base + ' No answer matched these keywords — which is a finding about the topic, ' +
          'not a gap in the data.';
      }
      if (playerCount <= 1) {
        return base + (quoteCount === 1
          ? ' A single quote from a single tester.'
          : ' All ' + quoteCount + ' quotes come from the SAME tester.') +
          ' This is ONE data point however it counts. Read the quote' + (quoteCount === 1 ? '.' : 's.');
      }
      if (playerCount === 2) {
        return base + ' ' + quoteCount + ' ' + plural(quoteCount, 'quote') + ' from 2 testers — a signal, ' +
          'not yet a priority. Read the quotes before acting.';
      }
      return base + ' ' + quoteCount + ' ' + plural(quoteCount, 'quote') + ' from ' + playerCount +
        ' testers' + (sampleWords && sampleWords.length ? ', matched on ' + sampleWords.slice(0, 4).join(', ') : '') +
        '. The count is a keyword count; the finding is in the quotes.';
    }

    function makeCluster(label, quotes, matched) {
      var players = distinctPlayers(quotes);
      return {
        theme: label,
        label: label,
        count: quotes.length,          // quotes, exactly like founder_report.py's len(items)
        players: players,              // DISTINCT people — the number that earns a rank
        certainty: 'candidate',        // never anything else; see the file header
        caveat: caveatFor(quotes.length, players, matched),
        single_voice: players <= 1,
        matched_words: (matched || []).slice(0, 8),
        quotes: quotes                 // the raw text ALWAYS travels with the count
      };
    }

    function clusterBy(lexicon, quotes) {
      var names = [], k;
      for (k in lexicon) if (Object.prototype.hasOwnProperty.call(lexicon, k)) names.push(k);
      var buckets = {}, matched = {};
      names.forEach(function (n) { buckets[n] = []; matched[n] = {}; });

      quotes.forEach(function (q) {
        var low = fold(q.text);
        names.forEach(function (n) {
          var hitWords = matchedWords(low, lexicon[n]);
          if (!hitWords.length) return;
          /* A response can land in several themes and that is correct: "the boss was
             confusing" is both a Boss data point and a Clarity data point. */
          var copy = {};
          for (var key in q) if (Object.prototype.hasOwnProperty.call(q, key)) copy[key] = q[key];
          copy.matched = hitWords;
          buckets[n].push(copy);
          hitWords.forEach(function (w) { matched[n][w] = 1; });
        });
      });

      var out = names.map(function (n) {
        return makeCluster(n, buckets[n], Object.keys(matched[n]));
      }).filter(function (c) { return c.count > 0; });

      /* Descending by quote count, ties broken by declaration order — the same ordering the
         Python report produces, so the two documents list themes in the same sequence. */
      return stableSort(out, function (a, b) { return b.count - a.count; });
    }

    function clusterHooks(quotes) {
      var buckets = {}, matched = {};
      F_HOOKS.forEach(function (b) { buckets[b.label] = []; matched[b.label] = {}; });

      quotes.forEach(function (q) {
        var low = fold(q.text), any = false;
        F_HOOKS.forEach(function (b) {
          if (!b.words.length) return;                 // 'Other' is a fallback, not a matcher
          var hitWords = matchedWords(low, b.words);
          if (!hitWords.length) return;
          any = true;
          var copy = {};
          for (var key in q) if (Object.prototype.hasOwnProperty.call(q, key)) copy[key] = q[key];
          copy.matched = hitWords;
          buckets[b.label].push(copy);
          hitWords.forEach(function (w) { matched[b.label][w] = 1; });
        });
        if (!any) buckets.Other.push(q);
      });

      /* Empty buckets are KEPT here. "Nobody named the Journal as the moment it got fun" is a
         finding about the Journal, and dropping the row hides it. */
      var out = F_HOOKS.map(function (b) {
        return makeCluster(b.label, buckets[b.label], Object.keys(matched[b.label]));
      });
      return stableSort(out, function (a, b) { return b.count - a.count; });
    }

    function clusterSurveys(surveys) {
      return guarded('clusterSurveys', function () {
        /* Accept a raw array, a {responses:[…]} blob, or a whole model — the dashboard calls
           this from three places and none of them should have to unwrap it. */
        var rows = Array.isArray(surveys) ? surveys : surveyResponses(surveys);
        rows = rows.filter(function (r) { return r && typeof r === 'object'; });

        var hookQ = collectQuotes(rows, ['q2_hook']);
        var improveQ = collectQuotes(rows, ['q3_improvement']);
        var extraQ = collectQuotes(rows, ['q5_anything']);
        var allQ = hookQ.concat(improveQ, extraQ);

        var themes = clusterBy(F_THEMES, allQ);
        var improvements = clusterBy(F_IMPROVEMENTS, improveQ);

        /* The four named piles, computed over exactly the same inputs founder_report.py uses,
           so the dashboard's "most common praise" is the report's "most common praise". */
        var praise = hookQ.concat(extraQ).filter(function (q) { return tone(q.text) === 'positive'; });
        var criticism = improveQ.concat(extraQ).filter(function (q) { return tone(q.text) === 'negative'; });
        var confusion = pickTheme(themes, 'Teaching & clarity');
        var bugs = pickTheme(themes, 'Performance & bugs');
        var requestsCluster = clusterBy({ 'Wanting more': F_THEMES['Wanting more'] },
                                        improveQ.concat(extraQ));
        var requests = requestsCluster.length ? requestsCluster[0].quotes : [];

        function bucket(label, quotes, note) {
          var c = makeCluster(label, quotes, []);
          c.note = note;
          return c;
        }

        var buckets = {
          praise: bucket('Praise', praise,
            'Positive-word count over "when it clicked" + "anything else". A word tally with a tie-break, not a model.'),
          criticism: bucket('Criticism', criticism,
            'Negative-word count over "one thing to change" + "anything else".'),
          confusion: bucket('Confusion', confusion,
            'The "Teaching & clarity" keyword theme, across all three free-text answers.'),
          requests: bucket('Requests', requests,
            'The "Wanting more" keyword theme, over "one thing to change" + "anything else".'),
          bugs: bucket('Bugs', bugs,
            'The "Performance & bugs" keyword theme, across all three free-text answers.')
        };

        return {
          n: rows.length,
          n_quotes: allQ.length,
          players: distinctPlayers(allQ),
          certainty: 'candidate',
          method: 'keyword clustering over free text (see BetaInsight.LEXICONS)',
          caveat: 'Every cluster on this page is a CANDIDATE produced by keyword matching. It is not ' +
                  'sentiment analysis and it cannot be: on a cohort this small a count is driven by which ' +
                  'words two people happened to use. The quotes are the finding; the counts only decide ' +
                  'what order you read them in.',

          themes: themes,
          improvements: improvements,     // the q3 categories: Audio, Difficulty, Tutorial, Trading,
                                          // Controls, UI, Animations, Performance
          hooks: clusterHooks(hookQ),

          /* The arrays the contract asks for, plus the same content with its count, caveat and
             distinct-player number attached — because a bare array of quotes on screen with a
             number beside it is exactly the thing that turns a keyword count into a fact. */
          praise: praise,
          criticism: criticism,
          confusion: confusion,
          requests: requests,
          bugs: bugs,
          buckets: buckets
        };
      }, emptyClusters());
    }

    function pickTheme(themes, name) {
      var i;
      for (i = 0; i < themes.length; i++) if (themes[i].theme === name) return themes[i].quotes;
      return [];
    }

    function emptyClusters() {
      return {
        n: 0, n_quotes: 0, players: 0, certainty: 'candidate',
        method: 'keyword clustering over free text (see BetaInsight.LEXICONS)',
        caveat: 'No survey text in this window.',
        themes: [], improvements: [], hooks: [],
        praise: [], criticism: [], confusion: [], requests: [], bugs: [],
        buckets: {}
      };
    }

    /* ══ 8 · RECOMMENDATIONS  (contract §5) ══════════════════════════════════════════════ */

    function rec(o) {
      var n = Math.max(0, Math.round(numOr(o.players_affected, 0)));
      return {
        priority: o.priority || priorityFor(n),
        title: o.title,
        reason: o.reason,
        evidence: arr(o.evidence).filter(Boolean),
        players_affected: n,
        estimated_impact: o.estimated_impact,
        estimated_effort: o.estimated_effort || EFFORT.funnel,
        /* Confidence follows the DISTINCT-people count behind the claim, which for a funnel item
           is the number of players who actually dropped — each one an independent observation
           of the failure — and for a survey item is the number of separate testers who said it. */
        confidence: o.confidence || confidenceFor(n),
        source: o.source
      };
    }

    function recommendations(model) {
      return guarded('recommendations', function () {
        var m = obj(model);
        var out = [];

        /* ── funnel: the arbiter ─────────────────────────────────────────────────────────── */
        transitions(m).forEach(function (t) {
          if (t.lost <= 0) return;
          var quotes = quotesForStage(m, t.to_key, 3);
          var half = Math.max(1, Math.round(t.lost / 2));

          if (t.suspect_instrumentation) {
            /* Zero is a special case with an opposite fix. Sending someone to redesign a stage
               that is actually firing fine but not being RECORDED costs a week. */
            out.push(rec({
              title: 'Verify the "' + t.to_label + '" event before touching the game',
              reason: 'Every one of the ' + t.from_players + ' players who reached "' + t.from_label +
                      '" is missing from "' + t.to_label + '". An exact zero after a healthy stage is ' +
                      'usually the instrument, not the players.',
              evidence: [t.from_label + ': ' + t.from_players + ' players',
                         t.to_label + ': 0 players',
                         'events below session_start die silently if the beta-ingest origin allowlist ' +
                         'misses the domain being played on'].concat(quotes),
              players_affected: t.lost,
              estimated_impact: 'Either recovers the whole stage in the data, or converts the biggest ' +
                                'number on this dashboard into a real, actionable game problem.',
              estimated_effort: EFFORT.instrumentation,
              source: 'funnel'
            }));
            return;
          }

          out.push(rec({
            title: 'Fix the ' + t.from_label + ' → ' + t.to_label + ' drop-off',
            reason: t.lost + ' of ' + t.from_players + ' ' + plural(t.from_players, 'player') + ' (' +
                    pctStr(t.drop_pct) + ') who reached "' + t.from_label + '" never reached "' +
                    t.to_label + '".',
            evidence: ['-' + t.lost + ' ' + plural(t.lost, 'player') + ' (' + pctStr(t.drop_pct) +
                       ' of ' + t.from_label + ')',
                       t.from_label + ': ' + t.from_players + ' → ' + t.to_label + ': ' + t.to_players]
                      .concat(quotes),
            players_affected: t.lost,
            estimated_impact: 'Recovering half of this leak returns about ' + half + ' ' +
                              plural(half, 'player') + ' to "' + t.to_label + '" and everything after it.',
            estimated_effort: EFFORT.funnel,
            source: 'funnel'
          }));
        });

        /* ── crashes ─────────────────────────────────────────────────────────────────────── */
        var crashes = arr(m.crashes).filter(function (c) { return c && typeof c === 'object'; });
        var repeats = stableSort(crashes.filter(function (c) {
          return numOr(c.players, 0) >= T.REPEAT_CRASH_MIN_PLAYERS;
        }), function (a, b) { return numOr(b.players, 0) - numOr(a.players, 0); });

        repeats.forEach(function (c) {
          var players = Math.round(numOr(c.players, 0));
          var msg = clean(c.message) || '(no message)';
          out.push(rec({
            /* A reproducible crash is a bug with a known repro whatever the cohort size, so it
               floors at MEDIUM even when only two people hit it. §4 already calls it critical. */
            priority: players >= T.N_SIGNAL ? priorityFor(players) : 'MEDIUM',
            title: 'Fix the repeat crash: ' + trunc(msg, 60),
            reason: 'Hit ' + players + ' ' + plural(players, 'player') + ' (' +
                    Math.round(numOr(c.count, 0)) + ' ' + plural(Math.round(numOr(c.count, 0)), 'event') + ')' +
                    (c.build ? ' on build ' + str(c.build) : '') + '. More than one device means it ' +
                    'reproduces.',
            evidence: [trunc(msg, 240), c.where ? 'at ' + trunc(c.where, 120) : '',
                       c.kind ? 'kind: ' + str(c.kind) : ''],
            players_affected: players,
            estimated_impact: 'Removes a hard stop for ' + players + ' ' + plural(players, 'player') +
                              ' and everyone behind them in the funnel.',
            estimated_effort: EFFORT.crash,
            source: 'crash'
          }));
        });

        var oneOffs = crashes.filter(function (c) { return numOr(c.players, 0) === 1; });
        if (oneOffs.length) {
          var crashPlayers = kpi(m, 'crash_players').value;
          /* UPPER BOUND, not a total. Each of these signatures hit exactly one player, but two
             signatures can be the same unlucky tester, so the honest ceiling is the signature
             count — capped by the distinct crash-player KPI. Reading crash_players directly here
             counted everyone hit by the REPEAT crashes too, which floated a 1-player triage item
             above a 3-player reproducible crash. */
          var n = crashPlayers === null ? oneOffs.length
                                        : Math.min(oneOffs.length, Math.round(crashPlayers));
          out.push(rec({
            title: 'Triage ' + oneOffs.length + ' one-off crash ' + plural(oneOffs.length, 'signature'),
            reason: (oneOffs.length === 1
                      ? 'One crash signature hit a single player.'
                      : 'Each of these ' + oneOffs.length + ' crash signatures hit exactly one player, ' +
                        'so at most ' + n + ' ' + plural(n, 'player') + ' are involved — some may be the ' +
                        'same tester twice.') +
                    ' Individually that is noise; as a group it is the device tail.',
            evidence: oneOffs.slice(0, 5).map(function (c) {
              return trunc(clean(c.message) || '(no message)', 120) +
                     (c.build ? ' — build ' + str(c.build) : '');
            }),
            players_affected: n,
            estimated_impact: 'Unblocks the long tail of devices; unlikely to move the headline funnel.',
            estimated_effort: EFFORT.crash,
            source: 'crash'
          }));
        }

        /* ── surveys ─────────────────────────────────────────────────────────────────────── */
        var rows = surveyResponses(m);
        var clusters = clusterSurveys(rows);

        /* q3 categories first — "the one thing you would change" is the closest a survey gets
           to a work item. Ranked by DISTINCT testers, never by quote count: a tester who wrote
           "music, the music, too loud" is one person with one opinion. */
        clusters.improvements.forEach(function (c) {
          out.push(rec({
            title: c.theme + ' — named as the one thing to change',
            reason: c.players + ' ' + plural(c.players, 'tester') + ' (' + c.count + ' ' +
                    plural(c.count, 'quote') + ') asked for a change in this area. CANDIDATE cluster: ' +
                    'this is a keyword match, so read the quotes before scheduling anything.',
            evidence: c.quotes.slice(0, 4).map(function (q) {
              return '“' + trunc(q.text, 200) + '”';
            }).concat([c.caveat]),
            players_affected: c.players,
            estimated_impact: 'Addresses the stated request of ' + c.players + ' of ' + clusters.n + ' ' +
                              plural(clusters.n, 'respondent') + '. No funnel evidence that it costs players.',
            estimated_effort: EFFORT.survey,
            source: 'survey'
          }));
        });

        /* Overall enjoyment, on founder_report.py's bar rather than the alert's 8.0, so the
           dashboard's recommendation and the weekly report's priority list agree. */
        var rw = ratingWindow(m);
        if (rw.avg !== null && rw.n !== null && rw.n >= T.RATING_MIN_N && rw.avg < T.RATING_RECOMMEND_BAR) {
          out.push(rec({
            title: 'Overall enjoyment is ' + round1(rw.avg) + '/10',
            reason: 'Below ' + T.RATING_RECOMMEND_BAR + '/10, the bar where people recommend a game ' +
                    'unprompted. Treat the criticism clusters as the ranked backlog rather than looking ' +
                    'for one fix.',
            evidence: ['mean q1_rating = ' + round1(rw.avg) + ' (n=' + rw.n + ')'].concat(
              clusters.criticism.slice(0, 3).map(function (q) { return '“' + trunc(q.text, 180) + '”'; })),
            players_affected: rw.n,
            estimated_impact: 'Moves the headline number the whole beta is judged on. No single change ' +
                              'will do it.',
            estimated_effort: EFFORT.rating,
            source: 'survey'
          }));
        }

        var notInterested = rows.filter(function (r) { return clean(obj(r).q4_continue) === 'not_interested'; });
        if (notInterested.length) {
          out.push(rec({
            title: notInterested.length + ' ' + plural(notInterested.length, 'tester') + ' would not continue',
            reason: 'A "not interested" on a beta this small is a category signal, not noise. Read those ' +
                    'responses in full — all of them, not the keywords.',
            evidence: notInterested.slice(0, 4).map(function (r) {
              var t = clean(obj(r).q3_improvement) || clean(obj(r).q5_anything) || '(no free text)';
              return clean(obj(r).player_id) + ' (' + (num(obj(r).q1_rating) === null ? 'no rating' :
                     num(obj(r).q1_rating) + '/10') + '): “' + trunc(t, 180) + '”';
            }),
            players_affected: notInterested.length,
            estimated_impact: 'Each one is a tester the beta has already lost for World 2.',
            estimated_effort: EFFORT.retention,
            source: 'survey'
          }));
        }

        /* THE RANKING. Players affected decides, full stop. Ties go to the funnel, then to
           crashes, then to surveys — a survey item can never outrank a funnel item of equal
           weight, because the funnel counts people who left and the survey counts people who
           typed. */
        return stableSort(out, function (a, b) {
          return (b.players_affected - a.players_affected) ||
                 ((SOURCE_RANK[a.source] === undefined ? 9 : SOURCE_RANK[a.source]) -
                  (SOURCE_RANK[b.source] === undefined ? 9 : SOURCE_RANK[b.source])) ||
                 (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
        });
      }, []);
    }

    /* ══ 9 · SEARCH ══════════════════════════════════════════════════════════════════════
       One flat, JSON-serialisable index over everything on the dashboard. No inverted index and
       no stemming: a few thousand entries scan in well under a frame, and a wrong stem on a
       player id would be far more expensive than the milliseconds it saves. */

    var TYPE_ORDER = { player: 0, survey: 1, crash: 2, build: 3, session: 4 };

    var FACET_KEYS = ['type', 'player', 'build', 'device', 'browser', 'os', 'stage', 'kind', 'session'];

    function field(value, weight) {
      var v = fold(clean(value));
      return v ? { v: v, w: weight } : null;
    }

    function entry(type, id, title, subtitle, ref, fields, facets) {
      return {
        type: type, id: id, title: title, subtitle: subtitle, ref: ref,
        fields: fields.filter(Boolean),
        facets: facets || {}
      };
    }

    function searchIndex(model) {
      return guarded('searchIndex', function () {
        var m = obj(model);
        var entries = [];

        /* players + player ids */
        arr(m.players).forEach(function (p) {
          if (!p || typeof p !== 'object') return;
          var pid = clean(p.player_id);
          if (!pid) return;
          var builds = arr(p.builds).map(clean).filter(Boolean);
          var bits = [];
          if (p.furthest_label || p.furthest_stage) bits.push(clean(p.furthest_label) || clean(p.furthest_stage));
          if (p.device) bits.push(clean(p.device) + (p.browser ? ' · ' + clean(p.browser) : ''));
          if (num(p.sessions) !== null) bits.push(num(p.sessions) + ' ' + plural(num(p.sessions), 'session'));
          if (numOr(p.crashes, 0) > 0) bits.push(Math.round(num(p.crashes)) + ' ' + plural(Math.round(num(p.crashes)), 'crash', 'crashes'));
          if (num(p.survey_rating) !== null) bits.push(num(p.survey_rating) + '/10');
          if (p.is_test) bits.push('TEST ID');

          entries.push(entry('player', pid, pid, bits.join(' · '), pid, [
            field(pid, 5),
            field(p.furthest_stage, 2), field(p.furthest_label, 2), field(p.exit_stage, 2),
            field(p.device, 2), field(p.browser, 2), field(p.os, 2),
            field(builds.join(' '), 2),
            field(p.trade_result, 1), field(p.boss_result, 1), field(p.journal_result, 1),
            field(p.survey_continue, 1), field(p.screen, 1), field(p.viewport, 1),
            field(p.is_test ? 'test' : '', 1)
          ], {
            type: 'player', player: pid, build: builds.join(' '),
            device: clean(p.device), browser: clean(p.browser), os: clean(p.os),
            stage: clean(p.furthest_stage)
          }));
        });

        /* survey text — one entry per response, so a hit opens the response rather than an
           orphaned sentence with no player attached to it */
        surveyResponses(m).forEach(function (r) {
          if (!r || typeof r !== 'object') return;
          var pid = clean(r.player_id) || '(anonymous)';
          var rating = num(r.q1_rating);
          var text = [clean(r.q2_hook), clean(r.q3_improvement), clean(r.q5_anything)]
            .filter(Boolean).join(' · ');
          var sub = (rating === null ? 'no rating' : rating + '/10') +
                    (r.q4_continue ? ' · ' + clean(r.q4_continue) : '') +
                    (text ? ' · ' + trunc(text, 90) : '');
          entries.push(entry('survey', 'survey:' + pid, 'Survey — ' + pid, sub, pid, [
            field(pid, 4),
            field(r.q2_hook, 3), field(r.q3_improvement, 3), field(r.q5_anything, 3),
            field(r.q4_continue, 2), field(rating === null ? '' : String(rating), 1),
            field('survey', 1)
          ], {
            type: 'survey', player: pid, stage: 'survey',
            kind: clean(r.q4_continue)
          }));
        });

        /* crash messages */
        arr(m.crashes).forEach(function (c, i) {
          if (!c || typeof c !== 'object') return;
          var msg = clean(c.message) || '(no message)';
          var players = Math.round(numOr(c.players, 0));
          var count = Math.round(numOr(c.count, 0));
          entries.push(entry('crash', 'crash:' + slugKey(msg + '|' + str(c.build) + '|' + i),
            trunc(msg, 90),
            [clean(c.kind), c.build ? 'build ' + clean(c.build) : '',
             count + ' ' + plural(count, 'event'), players + ' ' + plural(players, 'player')]
              .filter(Boolean).join(' · '),
            msg, [
              field(msg, 4), field(c.where, 2), field(c.kind, 2), field(c.build, 2), field('crash', 2)
            ], {
              type: 'crash', build: clean(c.build), kind: clean(c.kind)
            }));
        });

        /* builds */
        arr(m.builds).forEach(function (b) {
          if (!b || typeof b !== 'object') return;
          var id = clean(b.build) || '(unknown)';
          var sub = [num(b.players) === null ? '' : num(b.players) + ' ' + plural(num(b.players), 'player'),
                     num(b.completion_pct) === null ? '' : pctStr(num(b.completion_pct)) + ' completed',
                     num(b.avg_rating) === null ? '' : round1(num(b.avg_rating)) + '/10',
                     numOr(b.crashes, 0) ? Math.round(num(b.crashes)) + ' crashes' : '']
                    .filter(Boolean).join(' · ');
          entries.push(entry('build', 'build:' + id, 'Build ' + id, sub, id, [
            field(id, 5), field('build ' + id, 4)
          ], { type: 'build', build: id }));
        });

        /* session ids.
           The contract carries no session ROSTER — sessions appear as a count on a player and
           as ids only inside a drill-down timeline. So they are harvested from whatever is
           actually present (a selected player's timeline, an optional `sessions` array, or
           session_ids on a roster row) rather than fabricated. Searching a session id the model
           has never seen correctly returns nothing. */
        var seenSession = {};
        function addSession(sid, playerId, when) {
          sid = clean(sid);
          if (!sid || seenSession[sid]) return;
          seenSession[sid] = 1;
          entries.push(entry('session', 'session:' + sid, sid,
            [playerId ? clean(playerId) : '', when ? clean(when) : ''].filter(Boolean).join(' · '),
            sid, [field(sid, 5), field(playerId, 2)],
            { type: 'session', session: sid, player: clean(playerId) }));
        }
        arr(m.sessions).forEach(function (s) {
          if (!s) return;
          if (typeof s === 'string') addSession(s, '', '');
          else addSession(s.session_id, s.player_id, s.first_seen || s.created_at || s.ts);
        });
        arr(m.players).forEach(function (p) {
          arr(obj(p).session_ids).forEach(function (sid) { addSession(sid, obj(p).player_id, ''); });
        });
        (function () {
          var tl = obj(m.timeline);
          arr(tl.events).forEach(function (e) {
            var sid = clean(obj(e).session_id) || clean(obj(obj(e).props).session_id);
            if (sid) addSession(sid, tl.player_id, obj(e).ts);
          });
        })();

        return {
          version: VERSION,
          generated_at: clean(obj(m.meta).generated_at) || new Date().toISOString(),
          size: entries.length,
          counts: entries.reduce(function (acc, e) {
            acc[e.type] = (acc[e.type] || 0) + 1; return acc;
          }, {}),
          entries: entries
        };
      }, { version: VERSION, generated_at: new Date().toISOString(), size: 0, counts: {}, entries: [] });
    }

    /* "boss fight" stays one term; player ids keep their hyphens and viewports keep their x. */
    function tokenize(query) {
      var out = [], re = /"([^"]*)"|(\S+)/g, m, raw;
      while ((m = re.exec(str(query))) !== null) {
        raw = fold(m[1] !== undefined ? m[1] : m[2]);
        raw = raw.replace(/^[^\w@#:\-]+/, '').replace(/[^\w@#:\-]+$/, '');
        if (raw) out.push(raw);
      }
      return out;
    }

    function parseQuery(query) {
      var terms = [], filters = [];
      tokenize(query).forEach(function (tok) {
        var m = /^([a-z_]+):(.+)$/.exec(tok);
        /* An unrecognised prefix is NOT a filter — "error:foo" from a pasted stack trace must
           still search as text instead of silently matching nothing. */
        if (m && FACET_KEYS.indexOf(m[1]) >= 0) filters.push({ key: m[1], value: m[2] });
        else terms.push(tok);
      });
      return { terms: terms, filters: filters };
    }

    function fieldScore(f, term) {
      var v = f.v, i;
      if (!v) return 0;
      if (v === term) return 10 * f.w;
      if (v.indexOf(term) === 0) return 6 * f.w;
      i = v.indexOf(term);
      if (i < 0) return 0;
      /* A hit at a word boundary beats a hit buried mid-word: "boss" inside "boss_started" is a
         real match, "art" inside "start" is a coincidence. */
      return (/[a-z0-9]/.test(v.charAt(i - 1)) ? 2 : 4) * f.w;
    }

    function search(index, query, opts) {
      return guarded('search', function () {
        var o = obj(opts);
        var limit = numOr(o.limit, T.SEARCH_LIMIT);
        /* Tolerate being handed a raw model: the dashboard's first keystroke can beat the
           index build, and a thrown TypeError in a search box is unforgivable. */
        var idx = (index && Array.isArray(index.entries)) ? index : searchIndex(index);
        var q = parseQuery(query);
        if (!q.terms.length && !q.filters.length) return [];

        var results = [];
        idx.entries.forEach(function (e) {
          var i, j, ok = true;

          for (i = 0; i < q.filters.length; i++) {
            var fv = fold(clean(e.facets[q.filters[i].key]));
            if (!fv || fv.indexOf(q.filters[i].value) < 0) { ok = false; break; }
          }
          if (!ok) return;

          /* AND semantics. A search for "mobile boss" must mean both, otherwise the top hit is
             whichever list happens to be longest. */
          var total = 0;
          for (i = 0; i < q.terms.length; i++) {
            var best = 0;
            for (j = 0; j < e.fields.length; j++) {
              var s = fieldScore(e.fields[j], q.terms[i]);
              if (s > best) best = s;
            }
            if (!best) { ok = false; break; }
            total += best;
          }
          if (!ok) return;
          /* A pure filter query ("type:player device:mobile") has no terms to score, so give
             every survivor the same weight and let the type order decide. */
          if (!q.terms.length) total = 1;

          results.push({
            type: e.type, title: e.title, subtitle: e.subtitle, ref: e.ref, score: total
          });
        });

        return stableSort(results, function (a, b) {
          return (b.score - a.score) ||
                 ((TYPE_ORDER[a.type] === undefined ? 9 : TYPE_ORDER[a.type]) -
                  (TYPE_ORDER[b.type] === undefined ? 9 : TYPE_ORDER[b.type])) ||
                 (a.title < b.title ? -1 : (a.title > b.title ? 1 : 0));
        }).slice(0, limit);
      }, []);
    }

    /* ══ 10 · CONVENIENCE ════════════════════════════════════════════════════════════════ */

    function analyze(model, prevModel) {
      return {
        version: VERSION,
        generated_at: new Date().toISOString(),
        alerts: alerts(model, prevModel),
        recommendations: recommendations(model),
        surveys: clusterSurveys(surveyResponses(model)),
        index: searchIndex(model)
      };
    }

    return {
      VERSION: VERSION,
      CONTRACT: 'docs/beta-qa/BETA_MODEL_CONTRACT.md §4 §5',

      alerts: alerts,
      recommendations: recommendations,
      clusterSurveys: clusterSurveys,
      searchIndex: searchIndex,
      search: search,
      analyze: analyze,

      /* Exposed so a parity check can diff them against scripts/founder_report.py, and so the
         UI can show the founder exactly which words produced a cluster. */
      LEXICONS: {
        THEMES: THEMES,
        POSITIVE: POSITIVE,
        NEGATIVE: NEGATIVE,
        IMPROVEMENT_CATEGORIES: IMPROVEMENT_CATEGORIES,
        HOOK_BUCKETS: HOOK_BUCKETS,
        STAGE_KEYWORDS: STAGE_KEYWORDS
      },
      THRESHOLDS: T,

      /* Internals worth testing on their own. */
      _internal: {
        transitions: transitions,
        tone: tone,
        fold: fold,
        confidenceFor: confidenceFor,
        priorityFor: priorityFor,
        orderedBuilds: orderedBuilds,
        collectQuotes: collectQuotes,
        parseQuery: parseQuery
      }
    };
  }
);
