/* ═══════════════════════════════════════════════════════════════════════════════════════════
   CHARTQUEST — OPERATIONAL FOUNDATION                window.CQOPS            (v1.0.0 · Phase 1)
   ═══════════════════════════════════════════════════════════════════════════════════════════
   CANONICAL SOURCE. The game is ONE self-contained document, so it cannot <script src> this
   file — it is spliced into chart-quest.html between the two CQOPS marker comments. Do NOT
   edit the inlined copy. Edit THIS file and re-sync:

       python3 scripts/sync_ops.py            # splice this file into chart-quest.html
       python3 scripts/sync_ops.py --check    # fail if the two have drifted (runs in the gate)

   ── WHAT THIS IS ─────────────────────────────────────────────────────────────────────────
   Six operational primitives every future subsystem can adopt, in one namespace:

       CQOPS.env      which world am I running in, and what config does that imply
       CQOPS.build    build number · commit · deploy time · environment  (one source, no dupes)
       CQOPS.log      info / warn / error / critical → console, ring buffer, pluggable sinks
       CQOPS.err      guard · wrap · retry · durable queue · friendly messages
       CQOPS.flags    feature flags, resolvable from URL / localStorage / environment
       CQOPS.health   the founder-observability counters + CQOPS.report()

   ── WHAT THIS IS NOT (Phase 1 discipline) ────────────────────────────────────────────────
   It is NOT a migration. Nothing in the game was rewritten to use it. Analytics still posts
   the way it always did; the survey still submits the way it always did; cinematics still play
   the way they always did. This sprint builds the road, it does not move the traffic onto it.
   Adoption is incremental and documented in docs/operations/IntegrationGuide.md.

   THE ONE THING THAT WOULD DESTROY TRUST IN THIS SYSTEM is a feature flag that looks like it
   works and does nothing. So flags carry a `wired` bit: a flag is `wired` only once a real call
   site has registered it with CQOPS.flags.markWired(). CQOPS.flags.all() reports it, and
   CQOPS.report() surfaces it. Flipping an unwired flag prints a warning saying exactly that.

   ── DESIGN LAWS (why this file looks like this) ──────────────────────────────────────────
   L1  LOADS FIRST, IN <head>. Infrastructure that logs must exist before the thing that logs.
       It sits immediately after the boot-crash capture block and before every other script, so
       any subsystem below it — all four game script blocks, CQTrack, CQBeta, CQBEAT — can use
       it without an ordering dance. That also puts the splice point ~28,000 lines away from the
       end of the file, where concurrent sessions append their trailing IIFEs.
   L2  ZERO TOP-LEVEL NAMES. One IIFE, one global write (`window.CQOPS`). A duplicate top-level
       const/let across inline blocks is a parse-time SyntaxError that silently kills a whole
       block — that trap has cost this project real builds. Nothing above or below this block
       was modified to add it; deleting the block restores the previous build exactly.
   L3  NON-THROWING BY CONSTRUCTION. Every public method is try/caught and returns a documented
       fallback. Operations tooling must never be able to break a playtest: a lost metric is a
       nuisance, a broken game is the beta. This runs in <head> — a throw here is a white screen.
   L4  NOTHING IS READ EAGERLY THAT DOES NOT EXIST YET. BUILD_TAG is a top-level `const` in the
       game's FIRST script block, which runs AFTER this one; top-level const/let live in the
       global LEXICAL scope and are NOT properties of window, so `window.BUILD_TAG` is forever
       undefined (this exact mistake shipped empty builds on every analytics row until it was
       caught in production). Build metadata is therefore resolved LAZILY, on first read.
   L5  OBSERVERS NEVER ALTER WHAT THEY OBSERVE. The network observer returns the original
       promise untouched and attaches its bookkeeping to a dropped branch with BOTH handlers
       supplied, so it can never invent an unhandled rejection. The error listeners are additive
       and never preventDefault. If any of it throws, the game behaves as if this file is absent.
   L6  EVERYTHING IS BOUNDED. Ring buffers, sample arrays and durable queues all have hard caps.
       A four-hour playtest must not be able to grow this module's memory without limit.
   ═══════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CQOPS) return;                          // never double-install

  var VERSION = '1.0.0';
  var T0 = Date.now();

  /* ── the primitive every other line depends on (L3) ─────────────────────────────────────── */
  function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }
  function lsGet(k)    { return safe(function () { return localStorage.getItem(k); }, null); }
  function lsSet(k, v) { return safe(function () { localStorage.setItem(k, v); return true; }, false); }
  function lsDel(k)    { return safe(function () { localStorage.removeItem(k); return true; }, false); }
  function clip(s, n)  { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }
  function nowISO()    { return safe(function () { return new Date().toISOString(); }, ''); }
  function qs()        { return safe(function () { return String(location.search || ''); }, ''); }
  function param(name) {
    var m = new RegExp('[?&]' + name + '(?:=([^&]*))?').exec(qs());
    return m ? (m[1] === undefined ? '' : safe(function () { return decodeURIComponent(m[1]); }, m[1])) : null;
  }

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     1 · ENVIRONMENT                                                            CQOPS.env
     ═══════════════════════════════════════════════════════════════════════════════════════
     The environment is a property of WHERE THE PAGE IS SERVED FROM, resolved at runtime — not
     a constant baked in at build time. One build artifact therefore behaves correctly on a
     laptop, on the LAN QR, on a Cloudflare preview and on playchartquest.com, with no build
     flags and no separate bundles.

     PHASE 1 HONESTY: all three environments currently point at the SAME Supabase project,
     because that is the truth today — there is no staging project yet. This table is where
     that changes, and it is the ONLY place it changes. Do not add a second endpoint literal
     anywhere else in the codebase; add it here. (The last time a config value lived in more
     than one place, a Cloudflare migration silently 403'd every telemetry POST and nothing in
     the codebase could see it.) */
  var ENV_CONFIG = {
    development: {
      analyticsEndpoint: 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest',
      apiBase:           'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1',
      surveyUrl:         'survey.html',
      logLevel:          'debug',
      debugOverlays:     true,
      remoteLogging:     false
    },
    staging: {
      analyticsEndpoint: 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest',
      apiBase:           'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1',
      surveyUrl:         'survey.html',
      logLevel:          'info',
      debugOverlays:     true,
      remoteLogging:     false
    },
    production: {
      analyticsEndpoint: 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest',
      apiBase:           'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1',
      surveyUrl:         'survey.html',
      logLevel:          'warn',
      debugOverlays:     false,
      remoteLogging:     false
    }
  };

  var ENV_KEY = 'cq_ops_env_v1';       // manual override, survives reloads (QA convenience)

  /* Detection order matters: the narrowest, most certain rule first. An UNRECOGNISED host
     resolves to `production` on purpose — the conservative config (quiet logs, no overlays) is
     the safe default for a host we cannot identify. */
  function detectEnv() {
    return safe(function () {
      if (location.protocol === 'file:') return 'development';
      var h = String(location.hostname || '').toLowerCase();
      if (!h || h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '[::1]') return 'development';
      if (/\.local$/.test(h)) return 'development';
      /* the LAN QR test URL — RFC1918 space */
      if (/^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return 'development';
      /* production hosts, including the Cloudflare project apex (see docs/operations/CloudflareDeployment.md) */
      if (h === 'playchartquest.com' || h === 'www.playchartquest.com' || h === 'chartquest.pages.dev') return 'production';
      /* every OTHER *.pages.dev is a branch/preview deploy */
      if (/\.pages\.dev$/.test(h) || /staging|preview/.test(h)) return 'staging';
      return 'production';
    }, 'production');
  }

  var ENV_NAME = (function () {
    var forced = param('env') || lsGet(ENV_KEY);
    if (forced && ENV_CONFIG[forced]) return forced;
    return detectEnv();
  })();
  var ENV_DETECTED = detectEnv();

  var env = {
    get name()   { return ENV_NAME; },
    get isProd() { return ENV_NAME === 'production'; },
    get isDev()  { return ENV_NAME === 'development'; },
    is: function (n) { return ENV_NAME === n; },
    /* The one accessor every subsystem should use. Never read ENV_CONFIG directly. */
    get: function (key, fallback) {
      var c = ENV_CONFIG[ENV_NAME] || {};
      return Object.prototype.hasOwnProperty.call(c, key) ? c[key] : fallback;
    },
    all: function () { var o = {}, c = ENV_CONFIG[ENV_NAME] || {}, k; for (k in c) if (Object.prototype.hasOwnProperty.call(c, k)) o[k] = c[k]; return o; },
    /* Force an environment for the rest of this browser profile. QA affordance only —
       it changes CONFIG, never gameplay. Pass null to clear. */
    force: function (n) {
      if (n === null) { lsDel(ENV_KEY); return true; }
      if (!ENV_CONFIG[n]) return false;
      lsSet(ENV_KEY, n); ENV_NAME = n; return true;
    },
    get forced() { return ENV_NAME !== ENV_DETECTED; },
    get detected() { return ENV_DETECTED; },
    names: function () { var a = [], k; for (k in ENV_CONFIG) if (Object.prototype.hasOwnProperty.call(ENV_CONFIG, k)) a.push(k); return a; }
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     2 · DEPLOYMENT METADATA                                                  CQOPS.build
     ═══════════════════════════════════════════════════════════════════════════════════════
     ONE place that answers "what exactly is running". The Founder Dashboard, error reports,
     analytics and the smoke test all read from here instead of each re-deriving it — which is
     how CQTrack ended up with its own BUILD_TAG parser, and how that parser shipped broken.

     • number / tag come from BUILD_TAG, read LAZILY (see L4 — it does not exist yet at parse
       time, and it is NOT on window).
     • commit / builtAt come from <meta name="cq-build">, stamped by `scripts/cq.sh ship`.
       An unstamped working copy honestly reports 'unstamped', it does not invent a value.
       The stamped SHA is the commit the build was made FROM (HEAD at ship time) — a build
       cannot contain the hash of the commit that contains it. */
  var _buildCache = null;

  function readBuild() {
    if (_buildCache) return _buildCache;
    var tag = safe(function () {
      /* eslint-disable-next-line no-undef */
      return (typeof BUILD_TAG !== 'undefined') ? String(BUILD_TAG) : String(window.BUILD_TAG || '');
    }, '');
    var num = safe(function () { var m = /build\s+(\d+)/i.exec(tag); return m ? parseInt(m[1], 10) : null; }, null);
    var meta = safe(function () { return document.querySelector('meta[name="cq-build"]'); }, null);
    var commit = safe(function () { return (meta && meta.getAttribute('content')) || ''; }, '') || 'unstamped';
    var built  = safe(function () { return (meta && meta.getAttribute('data-built-at')) || ''; }, '');
    var b = {
      number:  num,
      tag:     tag,
      /* the headline only — the full BUILD_TAG is a paragraph of rationale by house style */
      summary: clip(safe(function () { return (tag.split(/[.·]/)[0] || tag).trim(); }, tag), 120),
      commit:  commit,
      builtAt: built,
      env:     ENV_NAME
    };
    /* Cache only once BUILD_TAG actually exists, so a read from <head> (before block 1 has
       parsed) does not freeze a permanent null into the cache. */
    if (num !== null) _buildCache = b;
    return b;
  }

  var build = {
    get number()  { return readBuild().number; },
    get tag()     { return readBuild().tag; },
    get summary() { return readBuild().summary; },
    get commit()  { return readBuild().commit; },
    get builtAt() { return readBuild().builtAt; },
    get env()     { return ENV_NAME; },
    get stamped() { return readBuild().commit !== 'unstamped'; },
    toJSON: function () { return readBuild(); }
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     3 · FEATURE FLAGS                                                        CQOPS.flags
     ═══════════════════════════════════════════════════════════════════════════════════════
     Resolution order, highest wins:   URL  →  localStorage  →  environment  →  default.

       ?ff=enableBossCinematics:0,enableAnalytics:1      explicit
       ?ff=-enableBossCinematics,+enableExperimentalFeatures   shorthand

     EVERY PRODUCT FLAG DEFAULTS TO TODAY'S SHIPPED BEHAVIOUR. That is not a style choice: this
     sprint must not change what a player sees, and a flag that defaults to anything else does
     exactly that the moment it is wired.

     `wired` is the honesty bit (see the header). The five product flags below are DECLARED and
     UNWIRED — Phase 1 does not migrate call sites — so turning them off today changes nothing.
     The ops flags ARE wired, because they only govern this module. */
  var FLAG_DEFAULTS = {
    /* ── product flags: declared, NOT yet wired (see docs/operations/IntegrationGuide.md) ── */
    enableJournalDiscovery:     true,
    enableBossCinematics:       true,
    enableBetaSurvey:           true,
    enableAnalytics:            true,
    enableExperimentalFeatures: false,
    /* ── ops flags: wired here, in this file ─────────────────────────────────────────────── */
    enableOpsConsole:           true,    // print logs to the console at all
    enableOpsErrorCapture:      true,    // window error / unhandledrejection / missing-asset observers
    enableOpsNetworkObserver:   true,    // passive fetch pass-through that counts failures
    enableOpsRemoteLogging:     false    // ship logs off-device (no destination exists yet)
  };

  /* Per-environment overrides. Empty today by design — the shape exists so a future
     "experimental features on in dev only" is a two-line change here and nowhere else. */
  var FLAG_ENV = { development: {}, staging: {}, production: {} };

  var FLAG_KEY  = 'cq_ops_flags_v1';
  var WIRED     = {};                       // flag name → true, once a real call site registers
  var _flagSrc  = {};                       // flag name → 'url' | 'local' | 'env' | 'default'
  var _flagOver = safe(function () { return JSON.parse(lsGet(FLAG_KEY) || '{}') || {}; }, {});
  var _flagUrl  = (function () {
    var out = {}, raw = param('ff');
    if (!raw) return out;
    var parts = raw.split(','), i, p, name, val;
    for (i = 0; i < parts.length; i++) {
      p = parts[i].trim(); if (!p) continue;
      if (p.charAt(0) === '-')      { out[p.slice(1)] = false; continue; }
      if (p.charAt(0) === '+')      { out[p.slice(1)] = true;  continue; }
      if (p.indexOf(':') > -1) {
        name = p.slice(0, p.indexOf(':')); val = p.slice(p.indexOf(':') + 1).toLowerCase();
        out[name] = !(val === '0' || val === 'false' || val === 'off' || val === 'no');
        continue;
      }
      out[p] = true;                                     // bare name means "turn it on"
    }
    return out;
  })();

  function flagValue(name) {
    if (Object.prototype.hasOwnProperty.call(_flagUrl, name))  { _flagSrc[name] = 'url';   return !!_flagUrl[name]; }
    if (Object.prototype.hasOwnProperty.call(_flagOver, name)) { _flagSrc[name] = 'local'; return !!_flagOver[name]; }
    var e = FLAG_ENV[ENV_NAME] || {};
    if (Object.prototype.hasOwnProperty.call(e, name))         { _flagSrc[name] = 'env';   return !!e[name]; }
    _flagSrc[name] = 'default';
    return !!FLAG_DEFAULTS[name];
  }

  var flags = {
    /* The call every consumer makes. Unknown names return false and are logged once — a typo
       must not silently read as "feature off" forever. */
    on: function (name) {
      return safe(function () {
        if (!Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, name)) {
          warnOnce('flags', 'unknown flag "' + name + '" — declare it in ops/cq-ops.js FLAG_DEFAULTS');
          return false;
        }
        return flagValue(name);
      }, false);
    },
    get: function (name) { return flags.on(name); },
    /* Persist an override for this browser profile. null clears it. */
    set: function (name, value) {
      return safe(function () {
        if (value === null) delete _flagOver[name]; else _flagOver[name] = !!value;
        lsSet(FLAG_KEY, JSON.stringify(_flagOver));
        if (!WIRED[name] && Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, name)) {
          log.warn('flags', 'flag "' + name + '" is DECLARED but NOT WIRED — changing it has no effect yet');
        }
        return true;
      }, false);
    },
    reset: function () { _flagOver = {}; return lsDel(FLAG_KEY); },
    /* A call site claims a flag: "I actually check this." Makes `wired` true in reports. */
    markWired: function (name) {
      return safe(function () {
        if (!Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, name)) return false;
        WIRED[name] = true; return true;
      }, false);
    },
    wired: function () { var a = [], k; for (k in WIRED) if (WIRED[k]) a.push(k); return a.sort(); },
    /* The dashboard view: value, where it came from, and whether anything actually reads it. */
    all: function () {
      var out = {}, k;
      for (k in FLAG_DEFAULTS) if (Object.prototype.hasOwnProperty.call(FLAG_DEFAULTS, k)) {
        out[k] = { value: flagValue(k), source: _flagSrc[k] || 'default', wired: !!WIRED[k], defaultValue: !!FLAG_DEFAULTS[k] };
      }
      return out;
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     4 · LOGGING                                                                CQOPS.log
     ═══════════════════════════════════════════════════════════════════════════════════════
     One interface, three destinations, no gameplay code changes to add a destination:
       • console        — gated by the environment's logLevel (quiet in production)
       • ring buffer    — always captures info+, so the Founder Dashboard has history
       • sinks          — addSink(fn) for remote logging, a dashboard feed, a test harness

     Format matches the house style already in the file: [CQ:scope] message. */
  var LEVELS = { debug: 10, info: 20, warn: 30, error: 40, critical: 50 };
  var RING_MAX = 200;
  var ring = [];
  var sinks = [];
  var _onceSeen = {};

  function consoleLevel() {
    var forced = param('ops') !== null ? 'debug' : null;     // ?ops = talk to me
    return LEVELS[forced || env.get('logLevel', 'warn')] || LEVELS.warn;
  }

  function emit(level, scope, message, data) {
    try {
      var rec = {
        t: Date.now(), iso: nowISO(), level: level, lvl: LEVELS[level] || 0,
        scope: String(scope || 'app'), message: clip(message, 300),
        data: data === undefined ? undefined : clip(safe(function () { return typeof data === 'string' ? data : JSON.stringify(data); }, String(data)), 500)
      };

      if (rec.lvl >= LEVELS.info) {                       // ring buffer: bounded, always on (L6)
        ring.push(rec);
        if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX);
      }

      if (flags.on('enableOpsConsole') && rec.lvl >= consoleLevel()) {
        var line = '[CQ:' + rec.scope + '] ' + rec.message;
        var fn = (level === 'error' || level === 'critical') ? 'error' : (level === 'warn' ? 'warn' : 'log');
        safe(function () { if (rec.data !== undefined) console[fn](line, rec.data); else console[fn](line); });
      }

      for (var i = 0; i < sinks.length; i++) safe(function (s) { return function () { s(rec); }; }(sinks[i]));
      return rec;
    } catch (e) { return null; }
  }

  function warnOnce(scope, message) {
    var k = scope + '|' + message;
    if (_onceSeen[k]) return;
    _onceSeen[k] = 1;
    emit('warn', scope, message);
  }

  var log = {
    debug:    function (scope, m, d) { return emit('debug', scope, m, d); },
    info:     function (scope, m, d) { return emit('info', scope, m, d); },
    warn:     function (scope, m, d) { return emit('warn', scope, m, d); },
    error:    function (scope, m, d) { return emit('error', scope, m, d); },
    /* critical = "an operator should know about this", so it also bumps a health counter. */
    critical: function (scope, m, d) { health.record('critical', scope + ': ' + clip(m, 160)); return emit('critical', scope, m, d); },
    once:     warnOnce,
    /* Sinks are how remote logging and the Founder Dashboard arrive later WITHOUT touching
       gameplay code. A sink that throws is dropped by safe() and never reaches the caller. */
    addSink:    function (fn) { return safe(function () { if (typeof fn === 'function' && sinks.indexOf(fn) < 0) sinks.push(fn); return true; }, false); },
    removeSink: function (fn) { return safe(function () { var i = sinks.indexOf(fn); if (i > -1) sinks.splice(i, 1); return true; }, false); },
    /* Read the ring buffer — the dashboard's window into what just happened. */
    tail: function (n, minLevel) {
      return safe(function () {
        var min = LEVELS[minLevel] || 0;
        var out = [], i;
        for (i = 0; i < ring.length; i++) if (ring[i].lvl >= min) out.push(ring[i]);
        return out.slice(-(n || 50));
      }, []);
    },
    clear: function () { ring = []; },
    levels: LEVELS
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     5 · ERROR HANDLING                                                          CQOPS.err
     ═══════════════════════════════════════════════════════════════════════════════════════
     The founder's four cases, each with a primitive:

       analytics fails      →  err.queue()  — persist, retry, never lose a row
       survey fails         →  err.queue() + err.friendly('survey') — never lose an answer
       cinematic fails      →  err.guard()  — log it, skip it, gameplay continues
       small UI fails       →  err.wrap()   — the handler is guarded, the frame keeps rendering

     None of these are wired into those systems yet (Phase 1). They exist so that when each is
     migrated, the migration is a two-line diff at ONE call site. */
  var FRIENDLY = {
    /* HARD RULE: player-facing text is worded for a 10-year-old. Short words, no blame,
       always say what happens next. */
    offline: "You're not online right now. We'll try again in a moment.",
    save:    "We couldn't save that just now. Don't worry — we'll try again.",
    send:    "That didn't send. We'll keep it safe and try again.",
    load:    "Something didn't load. Try again in a moment.",
    survey:  "Your answers are safe. We'll send them again in a moment.",
    generic: "Something went wrong, but your game is fine. Keep going!"
  };

  var _notifier = null;      // set by a future UI layer; Phase 1 has no UI of its own (L5)

  function describe(e) {
    return safe(function () {
      if (!e) return 'unknown';
      if (typeof e === 'string') return e;
      return (e.message || e.name || String(e)) + (e.stack ? ' @ ' + clip(String(e.stack).split('\n')[1] || '', 120) : '');
    }, 'unknown');
  }

  var err = {
    /* Run fn; on a throw, log it and return `fallback`. The workhorse. */
    guard: function (scope, fn, fallback) {
      try { return fn(); }
      catch (e) { log.error(scope, describe(e)); health.record('runtime_error', scope + ': ' + describe(e)); return fallback; }
    },
    /* Return a guarded version of fn — for event handlers, callbacks, rAF bodies. */
    wrap: function (scope, fn, fallback) {
      return function () {
        try { return fn.apply(this, arguments); }
        catch (e) { log.error(scope, describe(e)); health.record('runtime_error', scope + ': ' + describe(e)); return fallback; }
      };
    },
    /* Promise-returning guard that NEVER rejects — resolves to `fallback` instead. */
    guardAsync: function (scope, fn, fallback) {
      return new Promise(function (resolve) {
        try {
          Promise.resolve(typeof fn === 'function' ? fn() : fn).then(resolve, function (e) {
            log.error(scope, describe(e)); health.record('runtime_error', scope + ': ' + describe(e)); resolve(fallback);
          });
        } catch (e) {
          log.error(scope, describe(e)); health.record('runtime_error', scope + ': ' + describe(e)); resolve(fallback);
        }
      });
    },
    /* Exponential backoff with jitter. Jitter matters: without it, every client that lost a
       flaky mobile connection at the same moment retries at the same moment. */
    retry: function (scope, fn, opts) {
      opts = opts || {};
      var tries  = opts.tries  || 3;
      var baseMs = opts.baseMs || 400;
      var maxMs  = opts.maxMs  || 8000;
      var factor = opts.factor || 2;
      return new Promise(function (resolve, reject) {
        var attempt = 0;
        function go() {
          attempt++;
          var p;
          try { p = Promise.resolve(fn(attempt)); } catch (e) { return fail(e); }
          p.then(resolve, fail);
        }
        function fail(e) {
          if (attempt >= tries) {
            log.warn(scope, 'gave up after ' + attempt + ' attempts — ' + describe(e));
            return reject(e);
          }
          var wait = Math.min(maxMs, baseMs * Math.pow(factor, attempt - 1));
          wait = Math.round(wait * (0.7 + Math.random() * 0.6));
          log.debug(scope, 'attempt ' + attempt + ' failed, retrying in ' + wait + 'ms');
          setTimeout(go, wait);
        }
        go();
      });
    },
    /* A DURABLE QUEUE — the "never lose a survey response" primitive.
       Items survive the tab closing (localStorage), are bounded, and only leave the queue on a
       CONFIRMED success. CQTrack learned this the hard way: its first version spliced rows out
       of the buffer BEFORE the POST resolved, so one bad moment on mobile permanently deleted a
       funnel stage — indistinguishable in the report from a player who never got there. */
    queue: function (name, opts) {
      opts = opts || {};
      var LIMIT = opts.limit || 100;
      /* Versioned, per protected_systems.md §6: new state uses a versioned cq_*_v key so a
         future schema change never has to rename or reinterpret an existing one. */
      var KEY = 'cq_ops_q_' + name + '_v1';
      var mem = null;                                   // private-mode fallback

      function read()  { if (mem) return mem; return safe(function () { return JSON.parse(lsGet(KEY) || '[]') || []; }, []); }
      function write(a) {
        if (a.length > LIMIT) a = a.slice(a.length - LIMIT);
        if (!lsSet(KEY, safe(function () { return JSON.stringify(a); }, '[]'))) mem = a;
        return a;
      }
      return {
        name: name,
        push:  function (item) { return err.guard('queue:' + name, function () { var a = read(); a.push({ t: Date.now(), item: item }); write(a); return a.length; }, -1); },
        size:  function () { return read().length; },
        peek:  function (n) { return read().slice(0, n || 10); },
        clear: function () { mem = null; return lsDel(KEY); },
        /* handler(items) must return a promise for `true` on a confirmed success.
           Anything else leaves the queue exactly as it was. */
        drain: function (handler) {
          return err.guardAsync('queue:' + name, function () {
            var a = read();
            if (!a.length) return Promise.resolve(true);
            var items = a.map(function (r) { return r.item; });
            return Promise.resolve(handler(items)).then(function (ok) {
              if (ok === true) { write([]); log.info('queue:' + name, 'drained ' + items.length + ' item(s)'); return true; }
              log.warn('queue:' + name, 'drain not confirmed — keeping ' + items.length + ' item(s)');
              return false;
            });
          }, false);
        }
      };
    },
    /* User-facing copy, 10-year-old wording. Unknown codes fall back to `generic`. */
    friendly: function (code) { return FRIENDLY[code] || FRIENDLY.generic; },
    /* Surface a friendly message. Phase 1 ships NO UI of its own — it logs, fires a
       `cq:ops:notice` event, and calls a notifier if a UI layer registered one. That keeps
       this sprint's promise that no player-facing behaviour changes. */
    notify: function (code, detail) {
      return err.guard('notify', function () {
        var text = err.friendly(code);
        log.warn('notify', code + ' — ' + text, detail);
        if (typeof _notifier === 'function') _notifier(text, code, detail);
        safe(function () { window.dispatchEvent(new CustomEvent('cq:ops:notice', { detail: { code: code, text: text, info: detail } })); });
        return text;
      }, '');
    },
    setNotifier: function (fn) { _notifier = (typeof fn === 'function') ? fn : null; return true; },
    describe: describe,
    messages: FRIENDLY
  };

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     6 · FOUNDER OBSERVABILITY                                               CQOPS.health
     ═══════════════════════════════════════════════════════════════════════════════════════
     The six things the founder asked to be able to see, as counters with samples. This does
     NOT build the dashboard — it exposes the interface the dashboard will read:

         window.CQOPS.report()   →  one JSON object: build · env · flags · health · recent log

     Three of these are collected PASSIVELY today (runtime errors, missing assets, failed API
     requests) because they need no call-site changes. The other three are interfaces waiting
     for adoption. Missing assets in particular is not hypothetical: for ~20 builds every boss
     cinematic 404'd in production, and nothing on the client could see it. */
  var KINDS = ['runtime_error', 'analytics_failure', 'survey_failure', 'missing_asset', 'api_failure', 'state_transition', 'critical'];
  var SAMPLE_MAX = 5;
  var counters = {};
  (function () { for (var i = 0; i < KINDS.length; i++) counters[KINDS[i]] = { count: 0, first: null, last: null, samples: [] }; })();

  var health = {
    kinds: KINDS,
    record: function (kind, detail) {
      return safe(function () {
        var c = counters[kind];
        if (!c) { warnOnce('health', 'unknown health kind "' + kind + '"'); return false; }
        c.count++;
        c.last = nowISO();
        if (!c.first) c.first = c.last;
        if (c.samples.length < SAMPLE_MAX) c.samples.push({ at: c.last, detail: clip(detail, 200) });
        return true;
      }, false);
    },
    /* Convenience recorders, so a call site reads like what it means. */
    asset:     function (url, ok) { if (!ok) health.record('missing_asset', clip(url, 200)); return !!ok; },
    analytics: function (detail)  { return health.record('analytics_failure', detail); },
    survey:    function (detail)  { return health.record('survey_failure', detail); },
    api:       function (detail)  { return health.record('api_failure', detail); },
    /* Unexpected state transitions. Returns whether the move was allowed, so a call site can
       both check and report in one line:
           if (!CQOPS.health.transition('boss', prev, next, ALLOWED)) return; */
    transition: function (system, from, to, allowed) {
      return safe(function () {
        var ok = !allowed || (allowed[from] && allowed[from].indexOf(to) > -1);
        if (!ok) health.record('state_transition', system + ': ' + from + ' → ' + to);
        return !!ok;
      }, true);
    },
    counters: function () { return JSON.parse(JSON.stringify(counters)); },
    /* Nothing recorded in any kind = a clean session. */
    ok: function () { var k; for (k in counters) if (counters[k].count > 0) return false; return true; },
    reset: function () { var k; for (k in counters) counters[k] = { count: 0, first: null, last: null, samples: [] }; }
  };

  /* ── passive collectors (L5: observers never alter what they observe) ────────────────── */

  function installErrorCapture() {
    if (!flags.on('enableOpsErrorCapture')) return false;
    flags.markWired('enableOpsErrorCapture');
    return safe(function () {
      /* CAPTURE phase. Resource-load failures (<img>, <video>, <audio>, <script>) fire an
         `error` event that does NOT bubble, so a bubble-phase listener — like the boot-crash
         capture above — structurally cannot see them. This is the listener that makes a 404'd
         boss cinematic visible on the client for the first time.
         It never calls preventDefault or stopPropagation: the existing handlers still run. */
      window.addEventListener('error', function (e) {
        safe(function () {
          var t = e && e.target;
          if (t && t !== window && (t.src || t.href)) {
            var url = t.src || t.href;
            health.record('missing_asset', (t.tagName || '?') + ' ' + clip(url, 180));
            log.warn('asset', 'failed to load ' + clip(url, 180));
            return;
          }
          health.record('runtime_error', clip((e && e.message) || 'error', 200) + (e && e.filename ? ' @ ' + e.filename + ':' + e.lineno : ''));
        });
      }, true);
      window.addEventListener('unhandledrejection', function (e) {
        safe(function () {
          var r = e && e.reason;
          health.record('runtime_error', 'unhandled rejection: ' + clip(describe(r), 180));
        });
      });
      return true;
    }, false);
  }

  function installNetworkObserver() {
    if (!flags.on('enableOpsNetworkObserver')) return false;
    if (typeof window.fetch !== 'function') return false;
    flags.markWired('enableOpsNetworkObserver');
    return safe(function () {
      var _fetch = window.fetch;
      if (_fetch.__cqops) return true;                        // never double-wrap
      function wrapped() {
        var p;
        /* The original call is untouched, including its throw semantics. If _fetch throws
           synchronously we do not catch it — the caller's error must reach the caller. */
        p = _fetch.apply(this, arguments);
        try {
          var arg = arguments[0];
          var url = typeof arg === 'string' ? arg : ((arg && arg.url) || String(arg));
          /* BOTH handlers are supplied, and the derived promise is dropped. Supplying only
             one would create a rejected promise nobody handles — i.e. this observer would
             manufacture the very unhandledrejection it is here to count. */
          p.then(function (res) {
            safe(function () {
              if (!res || res.type === 'opaque') return;      // no-cors responses are ok:false by design
              if (!res.ok) note(url, res.status);
            });
          }, function (e) {
            safe(function () { note(url, 'network: ' + clip(describe(e), 80)); });
          });
        } catch (e) { /* observation is best-effort; the caller still gets `p` */ }
        return p;
      }
      function note(url, status) {
        var host = safe(function () { return new URL(url, location.href).host; }, clip(url, 60));
        health.record('api_failure', host + ' → ' + status);
        var ep = env.get('analyticsEndpoint', '');
        if (ep && String(url).indexOf(ep) === 0) {
          health.record('analytics_failure', 'beta-ingest → ' + status);
          log.warn('analytics', 'ingest POST failed (' + status + ')');
        } else {
          log.info('net', clip(url, 120) + ' → ' + status);
        }
      }
      wrapped.__cqops = true;
      window.fetch = wrapped;
      return true;
    }, false);
  }

  /* ═══════════════════════════════════════════════════════════════════════════════════════
     7 · THE PUBLIC SEAM
     ═══════════════════════════════════════════════════════════════════════════════════════ */
  var API = {
    version: VERSION,
    env: env,
    build: build,
    log: log,
    err: err,
    flags: flags,
    health: health,

    /* Run fn once the DOM is ready, guarded. An adoption convenience so subsystems do not each
       reinvent the readyState dance (and so a throw in one never blocks another). */
    ready: function (fn) {
      var g = err.wrap('ready', fn);
      if (document.readyState === 'loading') safe(function () { document.addEventListener('DOMContentLoaded', g); });
      else safe(function () { setTimeout(g, 0); });
      return true;
    },

    /* Coarse timing for adoption later: var end = CQOPS.time('boss','intro'); … end(); */
    time: function (scope, label) {
      var t = Date.now();
      return function () { var ms = Date.now() - t; log.debug(scope, label + ' took ' + ms + 'ms'); return ms; };
    },

    /* THE FOUNDER-DASHBOARD INTERFACE. One call, one JSON object, no dependencies.
       Everything an operator needs to answer "what is running, and is it healthy". */
    report: function () {
      return safe(function () {
        return {
          version:   VERSION,
          at:        nowISO(),
          uptimeMs:  Date.now() - T0,
          build:     build.toJSON(),
          env:       { name: env.name, detected: env.detected, forced: env.forced, config: env.all() },
          flags:     flags.all(),
          health:    { ok: health.ok(), counters: health.counters() },
          log:       log.tail(25, 'info'),
          ok:        health.ok()
        };
      }, { version: VERSION, error: 'report failed' });
    },

    /* One-line operator summary, for a console glance or a smoke test. */
    summary: function () {
      var r = API.report();
      return 'CQOPS ' + VERSION + ' · build ' + (r.build && r.build.number) + ' · ' + r.env.name +
             ' · commit ' + (r.build && r.build.commit) + ' · health ' + (r.ok ? 'OK' : 'ISSUES');
    },

    _internal: { ENV_CONFIG: ENV_CONFIG, FLAG_DEFAULTS: FLAG_DEFAULTS, ring: function () { return ring; } }
  };

  window.CQOPS = API;

  /* ── boot: install the passive collectors, then say hello ────────────────────────────── */
  installErrorCapture();
  installNetworkObserver();
  flags.markWired('enableOpsConsole');
  flags.markWired('enableOpsRemoteLogging');

  log.info('ops', 'foundation online · v' + VERSION + ' · env=' + ENV_NAME + (env.forced ? ' (forced)' : ''));

  /* ?ops — the operator switch. Turns the console up to debug (see consoleLevel) and prints
     the full report once the game has booted and BUILD_TAG exists. No DOM, no overlay, no
     player-facing surface: this sprint adds zero pixels. */
  if (param('ops') !== null) {
    API.ready(function () {
      setTimeout(function () { safe(function () { console.log('[CQ:ops] report', API.report()); }); }, 1200);
    });
  }
})();
