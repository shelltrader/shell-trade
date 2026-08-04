/* ══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — CLOSED BETA ANALYTICS               window.CQTrack        (ticket 3, v1)
   ------------------------------------------------------------------------------------------
   CANONICAL SOURCE. This exact file is also inlined into chart-quest.html (the game is one
   self-contained document and cannot depend on a separate script). Do NOT edit the inlined
   copy — edit this file and re-sync:

       python3 scripts/sync_track.py            # splices this file into chart-quest.html
       python3 scripts/sync_track.py --check    # fails if the two have drifted

   ── WHAT IT DOES ─────────────────────────────────────────────────────────────────────────
   Records the closed-beta funnel with ZERO player interaction, and nothing else. It is
   deliberately not a general analytics library: the event names are a closed set, agreed
   with the beta-ingest edge function, so a typo here cannot silently invent a funnel stage
   the Founder Report then cannot explain.

   ── WHAT IT DOES NOT COLLECT ─────────────────────────────────────────────────────────────
   No cookies. No fingerprinting. No IP storage (the edge function uses IP only for an
   in-memory rate-limit window). No third parties. The player id is a random local string
   with no personal data in it, reusing the game's existing cq_pid so a tester is one person
   across the funnel rather than a new stranger on every page.

   ── DESIGN NOTES ─────────────────────────────────────────────────────────────────────────
   • Milestones are ONCE-PER-PLAYER (localStorage), because "first trade won" is a funnel
     stage, not a counter. Replays must not inflate it.
   • Every event carries a client-generated event_id, and the edge function upserts on it,
     so a retry after a flaky mobile connection can never double-count a stage.
   • Buffered and flushed in batches; flushed hard on pagehide with keepalive (NOT
     sendBeacon — beacon cannot set the apikey/Authorization headers this endpoint needs).
   • Every public method is try/caught and non-throwing. Analytics must never be able to
     break a playtest — a dropped metric is a nuisance, a broken game is the beta.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CQTrack) return;                      // never double-install

  var ENDPOINT = 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest';
  /* Supabase ANON key — a public, publishable key. It is already shipped in the game; it
     grants nothing on its own (every beta table has RLS on with no anon policy, and the
     only write path is the service-role edge function). */
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteHBwemhjenZtaXVvbmN1cXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODY4MDEsImV4cCI6MjA5NzA2MjgwMX0.aOHGPgBCEhQvS74n9Evl5gL9-dFBZwUE0yVw6gjtY0k';

  var FLUSH_MS  = 4000;
  var MAX_BATCH = 40;

  /* The closed set. Must stay identical to EVENT_NAMES in supabase/functions/beta-ingest. */
  var NAMES = ['session_start','session_end','return_visit','tutorial_started','tutorial_completed',
    'first_trade_started','first_trade_won','first_trade_lost','boss_started','boss_defeated',
    'journal_unlocked','journal_discovery_started','journal_discovery_completed','beta_completed',
    'survey_started','survey_submitted','crash'];

  /* Stages that describe a player's furthest progress — recorded once, ever. */
  var ONCE = ['tutorial_started','tutorial_completed','first_trade_started','first_trade_won',
    'first_trade_lost','boss_started','boss_defeated','journal_unlocked',
    'journal_discovery_started','journal_discovery_completed','beta_completed','survey_submitted'];

  function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }
  function get(k)    { return safe(function () { return localStorage.getItem(k); }, null); }
  function set(k, v) { safe(function () { localStorage.setItem(k, v); }); }

  function uid(p) {
    return (p || '') + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* Reuse the game's existing player id so the website and the game are one tester. */
  function pid() {
    var p = get('cq_pid');
    if (!p) { p = 'p-' + Math.random().toString(36).slice(2, 12); set('cq_pid', p); }
    return p;
  }

  /* ── environment, resolved once ─────────────────────────────────────────────────────── */
  var ENV = (function () {
    var ua = safe(function () { return navigator.userAgent || ''; }, '');
    var d = 'desktop';
    if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) d = 'tablet';
    else if (/Mobi|Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini/i.test(ua)) d = 'mobile';

    var b = 'other';
    /* Order matters — Edge and Chrome both claim Safari, Chrome claims Safari. */
    if (/Edg\//.test(ua))                       b = 'Edge';
    else if (/OPR\/|Opera/.test(ua))            b = 'Opera';
    else if (/Firefox\/|FxiOS/.test(ua))        b = 'Firefox';
    else if (/CriOS|Chrome\//.test(ua))         b = 'Chrome';
    else if (/Safari\//.test(ua))               b = 'Safari';

    var o = 'other';
    if (/iPhone|iPad|iPod/.test(ua))            o = 'iOS';
    else if (/Android/.test(ua))                o = 'Android';
    else if (/Mac OS X|Macintosh/.test(ua))     o = 'macOS';
    else if (/Windows/.test(ua))                o = 'Windows';
    else if (/Linux|X11/.test(ua))              o = 'Linux';

    return {
      device: d, browser: b, os: o,
      screen:   safe(function () { return screen.width + 'x' + screen.height; }, ''),
      viewport: safe(function () { return window.innerWidth + 'x' + window.innerHeight; }, '')
    };
  })();

  var SESSION = uid('s-');
  var T0      = Date.now();
  var buf     = [];
  var timer   = null;
  var ended   = false;

  function post(kind, rows, keepalive) {
    if (!rows || !rows.length) return Promise.resolve(false);
    return safe(function () {
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: kind, rows: rows }),
        keepalive: !!keepalive
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    }, Promise.resolve(false));
  }

  function flush(keepalive) {
    if (!buf.length) return;
    var rows = buf.splice(0, MAX_BATCH);
    post('events', rows, keepalive);
    if (buf.length) schedule();
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; flush(false); }, FLUSH_MS);
  }

  /* ── the one entry point ────────────────────────────────────────────────────────────── */
  function event(name, props) {
    return safe(function () {
      if (NAMES.indexOf(name) < 0) return false;         // unknown → drop, never invent a stage
      if (ONCE.indexOf(name) >= 0) {
        var k = 'cq_bt_' + name;
        if (get(k)) return false;
        set(k, String(Date.now()));
      }
      buf.push({
        event_id: uid('e-'), player_id: pid(), session_id: SESSION,
        name: name, ts: new Date().toISOString(), props: props || {},
        device: ENV.device, browser: ENV.browser, os: ENV.os,
        screen: ENV.screen, viewport: ENV.viewport
      });
      /* Stamp here rather than making CQBeta call a second method — one writer, so the
         completion clock can never be missing just because a caller forgot. */
      if (name === 'beta_completed') set('cq_bt_beta_completed', String(Date.now()));
      /* beta_completed is the report's headline number and often lands moments before the
         player leaves for the survey — never let it sit in a buffer. */
      if (name === 'beta_completed' || name === 'survey_submitted') flush(true);
      else schedule();
      return true;
    }, false);
  }

  /* ── session bookkeeping ────────────────────────────────────────────────────────────── */
  function startSession() {
    var visits = parseInt(get('cq_bt_visits') || '0', 10) + 1;
    set('cq_bt_visits', String(visits));
    if (!get('cq_bt_first_seen')) set('cq_bt_first_seen', new Date().toISOString());

    event('session_start', { visit: visits, ref: safe(function () { return document.referrer || ''; }, ''), page: page() });
    if (visits > 1) {
      /* return_visit is NOT in ONCE — every return is a data point. */
      buf.push({
        event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'return_visit',
        ts: new Date().toISOString(),
        props: { visit: visits, first_seen: get('cq_bt_first_seen') },
        device: ENV.device, browser: ENV.browser, os: ENV.os, screen: ENV.screen, viewport: ENV.viewport
      });
      schedule();
    }
  }

  function page() {
    return safe(function () { return (location.pathname.split('/').pop() || 'index').replace(/\.html$/, ''); }, '');
  }

  function endSession() {
    if (ended) return; ended = true;
    var secs = Math.round((Date.now() - T0) / 1000);
    buf.push({
      event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'session_end',
      ts: new Date().toISOString(),
      props: { seconds: secs, page: page(), completion_seconds: completionSeconds() },
      device: ENV.device, browser: ENV.browser, os: ENV.os, screen: ENV.screen, viewport: ENV.viewport
    });
    flush(true);
  }

  /* Completion time = first ever session start → beta completed. Null until they finish. */
  function completionSeconds() {
    var a = get('cq_bt_first_seen'), b = get('cq_bt_beta_completed');
    if (!a || !b) return null;
    return safe(function () { return Math.round((Number(b) - new Date(a).getTime()) / 1000); }, null);
  }

  /* ── crashes ───────────────────────────────────────────────────────────────────────────
     Capped hard: one broken frame can fire onerror hundreds of times a second, and the beta
     budget is 120 requests/minute for the whole tester. */
  var crashes = 0;
  function crash(kind, msg, extra) {
    if (crashes >= 3) return;
    crashes++;
    buf.push({
      event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'crash',
      ts: new Date().toISOString(),
      props: { kind: kind, message: String(msg || '').slice(0, 500), where: extra || '', page: page() },
      device: ENV.device, browser: ENV.browser, os: ENV.os, screen: ENV.screen, viewport: ENV.viewport
    });
    flush(true);
  }

  /* ── game hooks ─────────────────────────────────────────────────────────────────────────
     Same philosophy as window.CQBeta: patch at runtime, never edit the call sites, so this
     merges cleanly against other sessions editing the same file. Each patch is independent —
     one missing function does not stop the others. No-ops entirely on the website, where
     none of these globals exist. */
  function wrap(name, before, after) {
    return safe(function () {
      var fn = window[name];
      if (typeof fn !== 'function' || fn.__cqTrack) return false;
      var w = function () {
        /* Capture into a named local. `arguments` inside the nested safe() closures below
           would resolve to THOSE functions' own arguments, not this wrapper's. */
        var args = arguments, self = this;
        if (before) safe(function () { before(args); });
        var r = fn.apply(self, args);
        if (after) safe(function () { after(r, args); });
        return r;
      };
      w.__cqTrack = true;
      window[name] = w;
      return true;
    }, false);
  }

  function hookGame() {
    var done = {};

    done.boss = wrap('openBoss', null, function (r, args) {
      var lvl = args && args[0];
      event('boss_started', { level: typeof lvl === 'number' ? lvl : null });
    });

    done.bossWin = wrap('bossWin', null, function () {
      var attempts = safe(function () { return (typeof bfState !== 'undefined' && bfState) ? (bfState.attempt || 1) : null; }, null);
      event('boss_defeated', { attempts: attempts });
    });

    done.trade = wrap('commitTrade', null, function () { event('first_trade_started', {}); });

    done.resolve = wrap('resolveTrade', null, function (r, args) {
      var res = args && args[0];
      if (res === 'win')       event('first_trade_won', {});
      else if (res === 'loss') event('first_trade_lost', {});
    });

    done.intro = wrap('introComplete', null, function () { event('tutorial_completed', {}); });

    return done;
  }

  /* tutorial_started has no function of its own — the intro is a state, not a call. Poll
     briefly for it rather than reaching into the intro machinery. Cheap, and it stops the
     moment it fires (or after ~2 minutes, for a veteran who never sees an intro at all). */
  function watchTutorialStart() {
    if (get('cq_bt_tutorial_started')) return;
    var n = 0;
    var iv = setInterval(function () {
      if (++n > 240) { clearInterval(iv); return; }
      var active = safe(function () {
        return typeof introFlow !== 'undefined' && introFlow && !!introFlow.active;
      }, false);
      if (active) { clearInterval(iv); event('tutorial_started', {}); }
    }, 500);
  }

  function boot() {
    startSession();

    safe(function () {
      window.addEventListener('error', function (e) {
        crash('error', e && e.message, e && e.filename ? (e.filename + ':' + e.lineno) : '');
      });
      window.addEventListener('unhandledrejection', function (e) {
        var r = e && e.reason;
        crash('promise', (r && (r.message || r)) || 'unhandledrejection', '');
      });
    });

    safe(function () {
      window.addEventListener('pagehide', endSession);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') flush(true);
      });
    });

    /* Drain anything window.CQBeta buffered before this file was parsed. */
    safe(function () {
      var q = window.__cqTrackQueue || [];
      for (var i = 0; i < q.length; i++) event(q[i].name, q[i].props);
      window.__cqTrackQueue = [];
    });

    /* Retry the game hooks briefly: on the website they never appear, and that is fine. */
    var tries = 0;
    var iv = setInterval(function () { if (++tries > 40) clearInterval(iv); hookGame(); }, 250);
    hookGame();
    watchTutorialStart();
  }

  window.CQTrack = {
    event: event,
    crash: crash,
    flush: function () { flush(true); },
    survey: function (row) {
      return safe(function () {
        var r = row || {};
        r.response_id = r.response_id || uid('r-');
        r.player_id   = r.player_id   || pid();
        r.session_id  = r.session_id  || SESSION;
        return post('survey', [r], true);
      }, Promise.resolve(false));
    },
    /* Stamped by CQBeta so completion time can be computed later. */
    stampCompleted: function () { set('cq_bt_beta_completed', String(Date.now())); },
    pid: pid,
    session: function () { return SESSION; },
    env: function () { return ENV; },
    state: function () {
      return { pid: pid(), session: SESSION, buffered: buf.length, visits: get('cq_bt_visits'), env: ENV };
    },
    reset: function () {
      safe(function () {
        for (var i = 0; i < NAMES.length; i++) localStorage.removeItem('cq_bt_' + NAMES[i]);
        localStorage.removeItem('cq_bt_visits');
        localStorage.removeItem('cq_bt_first_seen');
        localStorage.removeItem('cq_bt_beta_completed');
      });
      return true;
    }
  };

  safe(function () {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  });
})();
