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
    'journal_unlocked','journal_discovery_started','journal_discovery_completed','journal_discovery_skipped','beta_completed',
    'survey_started','survey_submitted','crash'];

  /* Stages that describe a player's furthest progress — recorded once, ever. */
  var ONCE = ['tutorial_started','tutorial_completed','first_trade_started','first_trade_won',
    'first_trade_lost','boss_started','boss_defeated','journal_unlocked',
    'journal_discovery_started','journal_discovery_completed','journal_discovery_skipped','beta_completed','survey_submitted'];

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

  /* ONE SESSION PER VISIT, NOT ONE PER DOCUMENT.
     A single tester's journey loads this file four times — index.html, play.html, the game
     iframe and survey.html — all same-origin. Minting a session id per document produced four
     "sessions" per visit and, worse, bumped the shared visit counter four times, so every
     first-time tester was reported as RETURNING and "new testers" read zero.

     sessionStorage is per-tab and shared across same-origin iframes AND across navigations in
     that tab, so it gives exactly one id per real visit. Only the document that creates it
     counts as the session start. */
  var _sess = (function () {
    try {
      var s = sessionStorage.getItem('cq_bt_sid');
      if (s) return { id: s, isNew: false };
      s = uid('s-'); sessionStorage.setItem('cq_bt_sid', s);
      return { id: s, isNew: true };
    } catch (e) { return { id: uid('s-'), isNew: true }; }   // private mode: degrade, never throw
  })();
  var SESSION = _sess.id;

  /* Which build produced this row. Without it a Tuesday crash cannot be tied to a Tuesday
     build, and the beta ships daily. Lives in props (jsonb) so no migration is needed. */
  var BUILD = safe(function () {
    /* BUILD_TAG is a top-level `const` in the game's FIRST script block. Top-level const/let
       live in the global LEXICAL scope, NOT as properties of window — so `window.BUILD_TAG` is
       undefined even though a bare `BUILD_TAG` resolves fine from this later block. Reading it
       via window silently produced an empty build on every row; verified in production before
       this fix. The typeof guard keeps it safe on the website pages, where it does not exist. */
    var t = (typeof BUILD_TAG !== 'undefined') ? BUILD_TAG : (window.BUILD_TAG || '');
    var m = /build\s+(\d+)/i.exec(String(t || ''));
    return m ? m[1] : '';
  }, '');

  var T0      = Date.now();
  var buf     = [];
  var timer   = null;
  var ended   = false;
  var PENDING = 'cq_bt_pending';        // durable queue for rows whose POST has not been confirmed

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

  /* Rows leave the buffer only after a CONFIRMED write. The previous version spliced first and
     threw the promise away, so one bad moment on mobile silently and permanently deleted a
     funnel stage — indistinguishable in the report from a player who never got there, which
     means it manufactured false findings. Unconfirmed rows are mirrored to localStorage so they
     survive the tab closing, and drained on next boot. */
  function persistPending(rows) {
    safe(function () {
      var q = JSON.parse(get(PENDING) || '[]');
      var seen = {}; var i;
      for (i = 0; i < q.length; i++) seen[q[i].event_id] = 1;
      for (i = 0; i < rows.length; i++) if (!seen[rows[i].event_id]) q.push(rows[i]);
      if (q.length > 200) q = q.slice(q.length - 200);      // bound it; never grow without limit
      set(PENDING, JSON.stringify(q));
    });
  }
  function clearPending(rows) {
    safe(function () {
      var done = {}; var i;
      for (i = 0; i < rows.length; i++) done[rows[i].event_id] = 1;
      var q = JSON.parse(get(PENDING) || '[]').filter(function (r) { return !done[r.event_id]; });
      if (q.length) set(PENDING, JSON.stringify(q)); else safe(function () { localStorage.removeItem(PENDING); });
    });
  }

  var inflight = false;
  function flush(keepalive) {
    if (!buf.length || inflight) return;
    var rows = buf.slice(0, MAX_BATCH);
    persistPending(rows);                                   // durable BEFORE the attempt
    inflight = true;
    post('events', rows, keepalive).then(function (ok) {
      inflight = false;
      if (ok) {
        buf.splice(0, rows.length);                         // only now do they leave the buffer
        clearPending(rows);
        if (buf.length) schedule();
      } else {
        schedule();                                         // keep them; try again
      }
    });
  }

  /* Drain anything a previous visit could not confirm. The edge function upserts on event_id,
     so re-sending is free and can never double-count. */
  function drainPending() {
    safe(function () {
      var q = JSON.parse(get(PENDING) || '[]');
      if (!q.length) return;
      post('events', q.slice(0, MAX_BATCH), false).then(function (ok) { if (ok) clearPending(q); });
    });
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
      var _p = props || {};
      if (BUILD && _p.build == null) _p.build = BUILD;
      buf.push({
        event_id: uid('e-'), player_id: pid(), session_id: SESSION,
        name: name, ts: new Date().toISOString(), props: _p,
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
    if (!get('cq_bt_first_seen')) set('cq_bt_first_seen', new Date().toISOString());

    /* Only the document that OPENED this visit counts it. Every later document in the same tab
       (play.html, the game iframe, survey.html) shares the session id and stays silent, so the
       visit counter reflects real visits and "new vs returning" is meaningful. */
    if (!_sess.isNew) return;

    var visits = parseInt(get('cq_bt_visits') || '0', 10) + 1;
    set('cq_bt_visits', String(visits));

    event('session_start', { visit: visits, ref: safe(function () { return document.referrer || ''; }, ''), page: page() });
    if (visits > 1) {
      /* return_visit is NOT in ONCE — every return is a data point. */
      buf.push({
        event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'return_visit',
        ts: new Date().toISOString(),
        props: { visit: visits, first_seen: get('cq_bt_first_seen'), page: page(), build: BUILD },
        device: ENV.device, browser: ENV.browser, os: ENV.os, screen: ENV.screen, viewport: ENV.viewport
      });
      schedule();
    }
  }

  function page() {
    return safe(function () { return (location.pathname.split('/').pop() || 'index').replace(/\.html$/, ''); }, '');
  }

  /* Furthest stage this player ever reached — the "Exit Point" the beta spec asks for.
     Read straight off the once-per-player flags, so it survives across documents and visits. */
  var STAGES = ['session_start','tutorial_started','first_trade_started','boss_started',
                'journal_discovery_started','journal_discovery_completed','beta_completed','survey_submitted'];
  function exitStage() {
    var far = 'landing';
    for (var i = 0; i < STAGES.length; i++) if (get('cq_bt_' + STAGES[i])) far = STAGES[i];
    return far;
  }

  function endSession() {
    if (ended) return; ended = true;
    var secs = Math.round((Date.now() - T0) / 1000);
    buf.push({
      event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'session_end',
      ts: new Date().toISOString(),
      props: { seconds: secs, page: page(), completion_seconds: completionSeconds(),
               exit_stage: exitStage(), completed: !!get('cq_bt_beta_completed'), build: BUILD },
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
     budget is 120 requests/minute for the whole tester.

     THE CAP IS PER-ORIGIN, AND THAT IS THE POINT. window.onerror fires for EVERY script on
     the page, including ones we do not ship. On 2026-08-04 a single visitor produced two
     crash rows one second apart — `t.entries.at is not a function` and `this.i.at is not a
     function` — both thrown inside Cloudflare's analytics beacon
     (static.cloudflareinsights.com/beacon.min.js), on Windows/Chrome. They looked exactly
     like a ChartQuest bug in the Founder Report and cost a real misdiagnosis: they were read
     as an iOS Safari incompatibility in OUR code, on the strength of a minified stack we do
     not own. Nothing in this repo calls .at().

     Two consequences, both fixed here:
       1. ATTRIBUTION. Every crash now records whether it came from our own origin or a third
          party, plus the host. A row you cannot fix must never be indistinguishable from one
          you can.
       2. STARVATION. One shared cap of 3 meant those two foreign errors ate two thirds of the
          session's budget. A third-party script that throws in a loop — which is precisely
          what a broken beacon does — would silently discard every real ChartQuest crash for
          that visit, and the gap would look like a clean session. Third-party errors now have
          their own small cap and can never consume the first-party one.
       3. DEV TRAFFIC. A crash from a developer's own machine is not beta signal, and the beta
          tables had no way to tell. A localhost build-tag syntax error from a concurrent
          coding session sat in the dataset counted as a real tester crash, and the exclusion
          list cannot catch it — that matches on player-id PREFIXES, and a dev browser mints an
          ordinary `p-` id like anyone else. `local` is decided by the PAGE, not the script:
          if the document is being served from localhost then the whole session is dev traffic,
          whoever's code threw. It therefore outranks `third_party`. */
  var CAP_SELF = 3, CAP_THIRD = 2, CAP_LOCAL = 3;
  var crashesSelf = 0, crashesThird = 0, crashesLocal = 0;

  /* Is this document itself being served from a dev machine? Anchored, not a substring test:
     `localhost.evil.com` must not read as local — the same anchoring the beta-ingest origin
     allowlist had to learn the hard way when a prefix match accepted look-alike domains. */
  var IS_LOCAL_PAGE = safe(function () {
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(location.host || '');
  }, false);

  /* '' (inline script / no filename) is OURS: window.onerror reports no filename for inline
     code, and the game is one big inline document. A cross-origin script that is not CORS-
     enabled is sanitized by the browser to "Script error." with no filename either — that
     lands as self, which is the safe direction: we would rather over-own a crash than
     silently drop a real one. */
  function originOf(url) {
    return safe(function () {
      var u = String(url || '');
      if (!u || u.indexOf('http') !== 0) return null;         // inline, blob:, data: → ours
      var host = u.split('/')[2] || '';
      return host && host !== location.host ? host : null;
    }, null);
  }

  function crash(kind, msg, extra) {
    var host = originOf(extra);
    /* Precedence: local > third_party > self. On a dev machine nothing in the session is beta
       data, so which script threw is a detail — source_host still records it either way. */
    var org = IS_LOCAL_PAGE ? 'local' : (host ? 'third_party' : 'self');
    if (org === 'local')            { if (crashesLocal >= CAP_LOCAL) return; crashesLocal++; }
    else if (org === 'third_party') { if (crashesThird >= CAP_THIRD) return; crashesThird++; }
    else                            { if (crashesSelf  >= CAP_SELF)  return; crashesSelf++;  }
    buf.push({
      event_id: uid('e-'), player_id: pid(), session_id: SESSION, name: 'crash',
      ts: new Date().toISOString(),
      props: { kind: kind, message: String(msg || '').slice(0, 500), where: extra || '',
               page: page(), build: BUILD,
               origin: org, source_host: host || null },
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

    /* Re-send anything a previous visit could not confirm, and recover the moment the network
       comes back — the two things whose absence made a mobile blip delete a milestone forever. */
    drainPending();
    safe(function () { window.addEventListener('online', function () { drainPending(); flush(false); }); });

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
        /* DERIVED FROM THE PLAYER, not random. With a random id a tester who reloaded the survey
           and answered again created a SECOND, contradictory row (one gave 7/later, the retry
           gave 2/not_interested) and the average rating silently absorbed both. One id per
           player + an upsert means answering again REPLACES their answer, which is what a
           person re-doing a form actually means. */
        r.response_id = r.response_id || ('r-' + pid());
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
