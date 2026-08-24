/* CQSURVEYGATE:BEGIN
   Shared, response-specific owner for the mandatory closed-beta survey. The game records the
   earlier paid boundaries; this small owner is also available on landing/play/offline/survey
   pages so browser Back, a wrapper restart, or a reload cannot turn an owed survey back into
   gameplay. `cq_bt_survey_submitted` remains an analytics flag only. Terminal authorization is
   the exact persisted equality surveyReceipt === surveyResponseId on the version-2 flow row. */
(function (root) {
  'use strict';
  if (root.CQSurveyGate) return;

  var FLOW_KEY = 'cq_beta_flow_v1';
  var VERSION = 2;
  var STAGES = ['new','movement_started','movement_complete','market_selected',
    'trade_1_complete','trade_2_complete','trade_3_complete','boss_won',
    'journal_due','journal_started','journal_completed','survey_due','survey_submitted'];
  var STAGE_SET = {};
  for (var si = 0; si < STAGES.length; si++) STAGE_SET[STAGES[si]] = true;
  var memoryRow = null;
  var installed = false;
  var historyArmed = false;

  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  function get(key) { return safe(function () { return root.localStorage.getItem(key); }, null); }
  function clone(value) { return safe(function () { return JSON.parse(JSON.stringify(value)); }, null); }
  function validId(value) {
    return typeof value === 'string' && /^r-[A-Za-z0-9_-]{1,77}$/.test(value);
  }
  function newResponseId() {
    var player = get('cq_pid');
    if (!player || !/^[A-Za-z0-9_-]{1,77}$/.test(player)) {
      player = 'p-' + Math.random().toString(36).slice(2, 12);
      safe(function () { root.localStorage.setItem('cq_pid', player); });
    }
    return ('r-' + player).slice(0, 80);
  }
  function rawRow() {
    var stored = safe(function () {
      var value = JSON.parse(get(FLOW_KEY) || 'null');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    }, null);
    return stored || clone(memoryRow);
  }
  function normalize(raw) {
    raw = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var row = {};
    for (var key in raw) if (Object.prototype.hasOwnProperty.call(raw, key)) row[key] = raw[key];
    row.version = VERSION;
    row.stage = STAGE_SET[raw.stage] ? raw.stage : 'new';
    row.tradeSlot = Math.max(0, Math.min(3, Number(raw.tradeSlot) || 0));
    row.market = typeof raw.market === 'string' && /^[A-Z0-9]{2,8}$/.test(raw.market) ? raw.market : null;
    row.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();
    row.surveyResponseId = validId(raw.surveyResponseId) ? raw.surveyResponseId : null;
    row.surveyReceipt = validId(raw.surveyReceipt) ? raw.surveyReceipt : null;
    return row;
  }
  function exactReceipt(row) {
    return !!row && validId(row.surveyResponseId) && row.surveyResponseId === newResponseId() &&
      row.surveyReceipt === row.surveyResponseId;
  }
  function legacyOwed(raw, row) {
    var stage = raw && raw.stage;
    return stage === 'journal_completed' || stage === 'survey_due' || stage === 'survey_submitted' ||
      row.stage === 'journal_completed' || row.stage === 'survey_due' || row.stage === 'survey_submitted' ||
      get('cq_beta_done') === '1' || !!get('cq_bt_beta_completed');
  }
  function dispatch(row) {
    safe(function () {
      var event;
      if (typeof root.CustomEvent === 'function') event = new root.CustomEvent('cq:beta-flow', { detail: clone(row) });
      else { event = root.document.createEvent('CustomEvent'); event.initCustomEvent('cq:beta-flow', false, false, clone(row)); }
      root.dispatchEvent(event);
    });
  }
  function persist(row) {
    var encoded = safe(function () { return JSON.stringify(row); }, '');
    if (!encoded) return false;
    var wrote = safe(function () { root.localStorage.setItem(FLOW_KEY, encoded); return true; }, false);
    if (!wrote) return false;
    var verified = safe(function () { return JSON.parse(root.localStorage.getItem(FLOW_KEY) || 'null'); }, null);
    if (!verified || verified.version !== VERSION || verified.stage !== row.stage ||
        verified.surveyResponseId !== row.surveyResponseId || verified.surveyReceipt !== row.surveyReceipt) return false;
    memoryRow = verified;
    dispatch(verified);
    return true;
  }
  function state() {
    var raw = rawRow();
    var row = normalize(raw);
    /* Version-1 submitted rows were authorized by a generic analytics flag. They deliberately
       migrate back to due: only a response-specific version-2 receipt can close this gate. */
    if (legacyOwed(raw, row) && !exactReceipt(row)) {
      row.stage = 'survey_due';
      row.surveyResponseId = newResponseId();
      row.surveyReceipt = null;
      row.updatedAt = new Date().toISOString();
      if (!raw || raw.version !== VERSION || raw.stage !== row.stage ||
          raw.surveyResponseId !== row.surveyResponseId || raw.surveyReceipt !== null) persist(row);
    } else if (exactReceipt(row)) {
      row.stage = 'survey_submitted';
    }
    return clone(row);
  }
  function ensureDue(meta) {
    if (typeof meta === 'string') meta = { responseId: meta };
    meta = meta || {};
    var row = state();
    var requested = meta.responseId || meta.response_id || null;
    if (requested != null && !validId(requested)) return null;
    var canonical = newResponseId();
    if (requested && requested !== canonical) return null;
    /* The explicit id must be the tracker's one canonical `r-<cq_pid>` identity. Repeated recovery
       keeps that id stable; an unrelated or malformed receipt can never satisfy this player. */
    if (exactReceipt(row) && (!requested || requested === row.surveyResponseId)) return row;
    row.version = VERSION;
    row.stage = 'survey_due';
    row.surveyResponseId = requested || row.surveyResponseId || canonical;
    row.surveyReceipt = null;
    row.updatedAt = new Date().toISOString();
    return persist(row) ? state() : null;
  }
  function isDue() {
    var row = state();
    return row.stage === 'survey_due' && !exactReceipt(row);
  }
  function responseId() {
    var row = state();
    return isDue() ? row.surveyResponseId : null;
  }
  function markSubmitted(response) {
    var id = typeof response === 'string' ? response :
      response && (response.response_id || response.responseId);
    if (!validId(id)) return false;
    var row = state();
    if (row.stage !== 'survey_due' || row.surveyResponseId !== id) return false;
    row.stage = 'survey_submitted';
    row.surveyReceipt = id;
    row.updatedAt = new Date().toISOString();
    if (!persist(row)) return false;
    var verified = rawRow();
    return !!verified && verified.version === VERSION && verified.stage === 'survey_submitted' &&
      verified.surveyResponseId === id && verified.surveyReceipt === id;
  }
  function isSurveyPage() {
    return safe(function () { return /(?:^|\/)survey(?:\.html)?\/?$/.test(root.location.pathname || ''); }, false);
  }
  function surveyUrl() {
    return safe(function () {
      var here = new URL(root.location.href);
      here.search = ''; here.hash = '';
      /* Cloudflare clean URLs may spell /play as /play/. Strip that document-like slash, but
         preserve a deploy root such as /shell-trade/ so its survey remains inside the subpath. */
      if (/(?:^|\/)(?:play|game|offline|index)\/$/.test(here.pathname)) here.pathname = here.pathname.slice(0, -1);
      return new URL('survey.html', here.href).href;
    }, 'survey.html');
  }
  function redirectIfDue() {
    if (!isDue()) return false;
    var destination = root;
    var inFrame = false;
    safe(function () {
      if (root.top && root.top !== root && root.top.location.origin === root.location.origin) {
        destination = root.top;
        inFrame = true;
      }
    });
    /* A top-level survey is already the lock. A survey accidentally loaded inside the game
       wrapper is not: promote it so the wrapper's Home and Restart controls disappear. */
    if (isSurveyPage() && !inFrame) return false;
    var target = surveyUrl();
    var navigating = false;
    try { destination.location.replace(target); navigating = true; }
    catch (e) { try { destination.location.href = target; navigating = true; } catch (e2) {} }
    return navigating;
  }
  function prevent(event) {
    if (!event) return;
    try { event.preventDefault(); } catch (e) {}
    try { event.stopImmediatePropagation(); } catch (e) {}
    try { event.stopPropagation(); } catch (e) {}
  }
  function armSurveyHistory() {
    if (!isDue() || !isSurveyPage() || historyArmed) return;
    safe(function () {
      var marker = { cqSurveyGate: VERSION };
      root.history.replaceState(marker, '', root.location.href);
      root.history.pushState(marker, '', root.location.href);
      historyArmed = true;
    });
  }
  function installNavigationGuard() {
    /* A direct survey visit can become due after this shared file first installs. Re-running the
       owner must arm the same-document Back lock for that late transition, not return early. */
    if (installed) {
      if (!redirectIfDue()) armSurveyHistory();
      return true;
    }
    installed = true;
    safe(function () {
      root.document.addEventListener('click', function (event) {
        if (!isDue()) return;
        if (!isSurveyPage()) { prevent(event); redirectIfDue(); return; }
        var target = event.target;
        var exit = target && target.closest ? target.closest('a[href], [data-survey-exit], [data-survey-backdrop]') : null;
        if (exit) prevent(event);
      }, true);
      root.addEventListener('keydown', function (event) {
        if (isDue() && event && (event.key === 'Escape' || event.key === 'Esc')) prevent(event);
      }, true);
      root.addEventListener('popstate', function (event) {
        if (!isDue()) return;
        prevent(event);
        if (isSurveyPage()) { historyArmed = false; armSurveyHistory(); }
        else redirectIfDue();
      });
      root.addEventListener('pageshow', function () { if (!redirectIfDue()) armSurveyHistory(); });
      root.document.addEventListener('visibilitychange', function () {
        if (root.document.visibilityState === 'visible' && !redirectIfDue()) armSurveyHistory();
      });
    });
    if (!redirectIfDue()) armSurveyHistory();
    return true;
  }

  root.CQSurveyGate = {
    key: FLOW_KEY,
    version: VERSION,
    state: state,
    ensureDue: ensureDue,
    isDue: isDue,
    responseId: responseId,
    surveyUrl: surveyUrl,
    redirectIfDue: redirectIfDue,
    installNavigationGuard: installNavigationGuard,
    markSubmitted: markSubmitted,
    confirmReceipt: markSubmitted
  };
  installNavigationGuard();
})(window);
/* CQSURVEYGATE:END */

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
   • Buffered and flushed in batches; flushed hard on pagehide with keepalive. The Cloudflare
     endpoint is same-origin and needs no browser credential. An unconfirmed write remains in
     cq_bt_pending for retry; it never crosses to a second provider and never claims success.
   • Every public method is try/caught and non-throwing. Analytics must never be able to
     break a playtest — a dropped metric is a nuisance, a broken game is the beta.
   ══════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.CQTrack) return;                      // never double-install

  var ENDPOINT = '/api/beta-ingest';

  var FLUSH_MS  = 4000;
  var MAX_BATCH = 40;

  /* The closed set. Must stay identical to EVENT_NAMES in functions/_lib/beta.js. */
  var NAMES = ['session_start','session_end','return_visit','play_clicked','movement_tutorial_completed',
    'tutorial_started','tutorial_completed','tutorial_step_reached',
    'first_trade_started','first_trade_won','first_trade_lost','boss_started','boss_defeated',
    'journal_unlocked','journal_discovery_started','journal_discovery_completed','journal_discovery_skipped','beta_completed',
    'survey_started','survey_submitted','crash'];

  /* Stages that describe a player's furthest progress — recorded once, ever. */
  var ONCE = ['play_clicked','movement_tutorial_completed',
    'tutorial_started','tutorial_completed','first_trade_started','first_trade_won',
    'first_trade_lost','boss_started','boss_defeated','journal_unlocked',
    'journal_discovery_started','journal_discovery_completed','journal_discovery_skipped','beta_completed','survey_submitted'];

  function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }
  function get(k)    { return safe(function () { return localStorage.getItem(k); }, null); }
  function set(k, v) { safe(function () { localStorage.setItem(k, v); }); }
  function remove(k) { safe(function () { localStorage.removeItem(k); }); }

  /* ── pseudonymous invite attribution ─────────────────────────────────────────────────────────────────────
     Invite URLs carry opaque codes, never a person's name, email address or phone number. The
     alphabet and length are intentionally smaller than the ingest props allowance: accepting a
     free-form query value here would turn a pseudonymous funnel into an accidental PII channel.

     Campaigns must use an issuer-owned `b<build>-beta<round>` code. Invitations use exactly eight
     issuer-generated consonant+digit pairs after `i-`; vowels, ambiguous characters and any run of
     name-like letters are excluded. This is deliberately stricter than merely removing @/spaces:
     values such as a person's name plus birth year are not accepted as attribution.

     Attribution is last-valid-link wins and expires after 30 days. The timestamp is revalidated
     on every event so another tab following a newer invite immediately becomes authoritative.
     Invalid explicit values are still removed from the address bar, but never erase a fresh valid
     attribution. */
  var INVITE_KEY = 'cq_bt_invite_v1';
  var INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var COHORT_TOKEN_RE = /^b\d{3,5}-beta(?:[1-9]|[1-9][0-9]|100)$/;
  var INVITE_TOKEN_RE = /^i-(?:[BCDFGHJKMNPQRSTVWXYZ][2-9]){8}$/;
  var INVITE_MEMORY = null;

  function cohortToken(value) {
    var token = typeof value === 'string' ? value : '';
    if (!COHORT_TOKEN_RE.test(token)) return '';
    return token;
  }

  function inviteToken(value) {
    var token = typeof value === 'string' ? value : '';
    if (!INVITE_TOKEN_RE.test(token)) return '';
    var suffix = token.slice(2);
    if (!/^(?:[BCDFGHJKMNPQRSTVWXYZ][2-9]){8}$/.test(suffix)) return '';
    return token;
  }

  function validInviteRow(row, now) {
    var capturedAt = row && Number(row.captured_at);
    if (!row || !isFinite(capturedAt) || capturedAt <= 0 || capturedAt > now || now - capturedAt >= INVITE_TTL_MS) return null;
    var cohort = cohortToken(row.cohort);
    var invite = inviteToken(row.invite);
    if (!cohort || !invite) return null;
    return { cohort: cohort, invite: invite, captured_at: capturedAt };
  }

  function storedInvite(now) {
    return safe(function () {
      var localRaw = get(INVITE_KEY);
      var sessionRaw = safe(function () { return sessionStorage.getItem(INVITE_KEY); }, null);
      var candidates = [
        validInviteRow(INVITE_MEMORY, now),
        validInviteRow(safe(function () { return JSON.parse(localRaw || 'null'); }, null), now),
        validInviteRow(safe(function () { return JSON.parse(sessionRaw || 'null'); }, null), now),
      ];
      if (localRaw && !candidates[1]) remove(INVITE_KEY);
      if (sessionRaw && !candidates[2]) safe(function () { sessionStorage.removeItem(INVITE_KEY); });
      var newest = null;
      for (var i = 0; i < candidates.length; i++) {
        if (candidates[i] && (!newest || candidates[i].captured_at > newest.captured_at)) newest = candidates[i];
      }
      return newest || {};
    }, {});
  }

  function queryInviteToken(name, validator) {
    return safe(function () {
      var values = new URLSearchParams(location.search || '').getAll(name);
      var newest = '';
      for (var i = 0; i < values.length; i++) {
        var valid = validator(values[i]);
        if (valid) newest = valid;       // the last explicit VALID value wins
      }
      return newest;
    }, '');
  }

  /* Remove only the two attribution parameters. Work on the raw query pieces instead of
     serialising URLSearchParams so unrelated parameters retain their order and exact encoding. */
  function stripInviteParams() {
    safe(function () {
      var search = String(location.search || '');
      if (!search || typeof history === 'undefined' || typeof history.replaceState !== 'function') return;
      var parts = search.replace(/^\?/, '').split('&');
      var kept = [], changed = false;
      for (var i = 0; i < parts.length; i++) {
        var rawKey = parts[i].split('=', 1)[0] || '';
        var key = safe(function () { return decodeURIComponent(rawKey.replace(/\+/g, ' ')); }, '');
        if (key === 'cq_cohort' || key === 'cq_invite') changed = true;
        else kept.push(parts[i]);
      }
      if (!changed) return;
      var next = String(location.pathname || '/')
        + (kept.length ? '?' + kept.join('&') : '')
        + String(location.hash || '');
      history.replaceState(history.state, safe(function () { return document.title || ''; }, ''), next);
    });
  }

  function persistInvite(row) {
    INVITE_MEMORY = row;
    var encoded = JSON.stringify(row);
    var localSaved = safe(function () {
      localStorage.setItem(INVITE_KEY, encoded);
      return localStorage.getItem(INVITE_KEY) === encoded;
    }, false);
    var sessionSaved = safe(function () {
      sessionStorage.setItem(INVITE_KEY, encoded);
      return sessionStorage.getItem(INVITE_KEY) === encoded;
    }, false);
    return !!(localSaved || sessionSaved);
  }

  function captureInvite() {
    var params = safe(function () { return new URLSearchParams(location.search || ''); }, null);
    var explicit = !!(params && (params.has('cq_cohort') || params.has('cq_invite')));
    if (!explicit) return;
    var cohort = queryInviteToken('cq_cohort', cohortToken);
    var invite = queryInviteToken('cq_invite', inviteToken);
    if (cohort && invite) {
      /* One link is one atomic pair. A malformed or missing half cannot erase/mix with a valid
         stored campaign. Strip a valid pair only after it survives in local or session storage;
         if both stores reject it, leave the URL intact so navigation can retry the capture. */
      if (persistInvite({ cohort: cohort, invite: invite, captured_at: Date.now() })) stripInviteParams();
      return;
    }
    /* Invalid/PII-shaped explicit values are never useful attribution. Remove them from the URL
       while leaving any previously valid stored pair untouched. */
    stripInviteParams();
  }

  function inviteProps(props) {
    var out = {}, key;
    if (props && typeof props === 'object') {
      for (key in props) if (Object.prototype.hasOwnProperty.call(props, key)
          && key !== 'cohort' && key !== 'invite' && key !== 'cq_cohort' && key !== 'cq_invite') {
        out[key] = props[key];
      }
    }
    var attribution = storedInvite(Date.now());
    if (attribution.cohort) out.cohort = attribution.cohort;
    if (attribution.invite) out.invite = attribution.invite;
    return out;
  }

  captureInvite();

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

  function send(endpoint, kind, rows, keepalive) {
    var headers = { 'Content-Type': 'application/json' };
    return fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ kind: kind, rows: rows }),
      keepalive: !!keepalive
    }).then(function (r) {
      if (!r || !r.ok) return false;
      var type = r.headers && r.headers.get ? String(r.headers.get('Content-Type') || '') : '';
      if (type.toLowerCase().indexOf('application/json') === -1) return false;
      return r.json().then(function (receipt) {
        if (!receipt || receipt.ok !== true || Number(receipt.written) !== rows.length) return false;
        if (kind !== 'survey') return true;
        if (receipt.survey_contract !== 'chartquest-beta-survey-v2' || !Array.isArray(receipt.surveys)
            || receipt.surveys.length !== rows.length) return false;
        for (var i = 0; i < rows.length; i++) {
          var stored = receipt.surveys[i] || {}, expected = rows[i] || {};
          if (String(stored.response_id || '') !== String(expected.response_id || '')
              || String(stored.experience_level || '') !== String(expected.experience_level || '')
              || String(stored.purchase_intent_19 || '') !== String(expected.purchase_intent_19 || '')) return false;
        }
        return true;
      }).catch(function () { return false; });
    }).catch(function () { return false; });
  }

  function post(kind, rows, keepalive) {
    if (!rows || !rows.length) return Promise.resolve(false);
    return safe(function () {
      return send(ENDPOINT, kind, rows, keepalive);
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
      var batch = q.slice(0, MAX_BATCH);
      post('events', batch, false).then(function (ok) {
        if (!ok) return;
        /* Clear ONLY the rows this request confirmed. The old code acknowledged 40 rows but
           passed the entire (up to 200 row) queue to clearPending(), silently deleting every
           unsent row after the first batch. Keep draining in bounded batches instead. */
        clearPending(batch);
        if (q.length > batch.length) setTimeout(drainPending, 0);
      });
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
      var _p = inviteProps(props || {});
      if (BUILD && _p.build == null) _p.build = BUILD;
      if (IS_DEV) _p.dev = 1;                              // mark dev/self-test sessions (see founder_report.py dev_flagged)
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
        props: inviteProps({ visit: visits, first_seen: get('cq_bt_first_seen'), page: page(), build: BUILD, dev: IS_DEV ? 1 : undefined }),
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
  var STAGES = ['session_start','play_clicked','movement_tutorial_completed',
                'tutorial_started','first_trade_started','boss_started',
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
      props: inviteProps({ seconds: secs, page: page(), completion_seconds: completionSeconds(),
                           exit_stage: exitStage(), completed: !!get('cq_bt_beta_completed'), build: BUILD,
                           dev: IS_DEV ? 1 : undefined }),
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

  /* Is this a developer/self-test session rather than a real tester? TAGGED (props.dev = 1),
     not suppressed — dev activity stays visible for debugging the pipe while founder_report.py
     filters it out (dev_flagged). This is the real flag the Founder Report asked for, replacing
     the 699x808-viewport heuristic that could only guess. Any of: the game's own dev gate
     (?dev / cq_dev / window._CQ_DEV) or a dev host (localhost). Anchored host test above; a
     ?dev substring on a real query string cannot false-positive because it is bounded. */
  var IS_DEV = safe(function () {
    return IS_LOCAL_PAGE
      || /[?&]dev(=[^&]*)?(&|$)/i.test(location.search || '')
      || get('cq_dev') === '1'
      || window._CQ_DEV === true;
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
      props: inviteProps({ kind: kind, message: String(msg || '').slice(0, 500), where: extra || '',
                           page: page(), build: BUILD,
                           origin: org, source_host: host || null, dev: IS_DEV ? 1 : undefined }),
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

  /* ── PLAY CONTROLS ─────────────────────────────────────────────────────────────────────
     The landing→game gap is the largest hole in the funnel and nothing measured it, because
     the per-visit session model makes it structurally invisible: clicking Play navigates to a
     document that SHARES the session id and therefore stays silent (see the _sess comment).

     Delegated + capture phase, so it survives a markup change and cannot be eaten by a CTA
     handler that calls stopPropagation. The selector is deliberately wider than anchors:
       a[href*="play.html"]  the seven Play links on the landing page
       [data-game]           the "Enter the Chart" BUTTON at index.html:1403 — the headline
                             control, which is not an anchor at all and which the site's own
                             internal links point at. data-game is the same attribute the
                             embed mount reads, so it outlives an id rename.
     auxclick too: middle-click does not fire click. Cmd/Ctrl-click does, and is caught.

     WHAT IT CANNOT SEE, stated so the number is never over-read: bosses.html and courses.html
     do not load this file at all, the installed-PWA "Play now" shortcut involves no page, and
     a direct /play link involves no click. Those testers simply appear from a later stage. */
  var PLAY_SEL = 'a[href*="play.html"], [data-game]';
  function onPlayControl(e) {
    safe(function () {
      var t = e.target && e.target.closest && e.target.closest(PLAY_SEL);
      if (!t) return;
      event('play_clicked', {
        from: page(),
        target: t.getAttribute('href') || t.getAttribute('data-game') || '',
        mode: t.tagName === 'A' ? 'nav' : 'embed',
        button: e.type === 'auxclick' ? 'aux' : 'main'
      });
      flush(true);            // they are navigating away this instant — never buffer it
    });
  }

  /* ── MOVEMENT TUTORIAL ─────────────────────────────────────────────────────────────────
     This is a REAL authored system, not a phase flag: window.BlockchainJourney, the "Journey
     Through the Blockchain", which every first-play player runs between the cinematic and
     chart selection (chart-quest.html:2807 — the comment there literally reads
     "cinematic → MOVEMENT TUTORIAL → chart selection"). Its curriculum is three jumps, three
     boosts, three box-smashes (TEACH_STAGES), tracked on _S.tStage / _S.tCount.

     _S.tCelebDone ALONE IS A LIE. teachSkipToPortal() sets it with ZERO reps performed when a
     player simply walks to the end of the world, so a pure walker is indistinguishable from
     someone who mastered every verb. Two guards, both required:

       1. tStage seen at 1 OR 2 while tCelebDone is still false. teachCredit() advances ONE
          stage at a time; teachSkipToPortal() jumps STRAIGHT to 3 and can never leave it at 1
          or 2. So any mid-curriculum reading is unforgeable proof that reps were really earned.
          NOT "=== 2 exactly": that samples a single transient state, and a player who clears
          boost and starts smashing between two 500ms polls would be missed entirely — the
          event would silently never fire for someone who genuinely did the work. Two
          observable stages, each lasting the seconds it takes to perform three reps, instead
          of one instant.
       2. tCelebDone === true observed while phase === 'grow'. The phase machine is strictly
          forward (wake → grow → reveal → done) and the retirement only fires at 'reveal', so a
          retired curriculum can never be seen at 'grow'.

     The SKIP button and the 160s watchdog both call finishJourney() → phase 'done' without
     touching tCelebDone, so neither can satisfy guard 2. A returning player never runs the
     Journey at all (gated on cq_played), so _S stays untouched and neither guard is ever met.

     Read off window.BlockchainJourney — a real window PROPERTY, so unlike introFlow and coach
     (top-level consts, which live in the global LEXICAL scope) there is no TDZ hazard here.
     Polling, never a hook: no call site in the 1.9 MB game file is touched, so this merges
     cleanly against other sessions. */
  function watchMovementTutorial() {
    if (get('cq_bt_movement_tutorial_completed')) return;
    var n = 0, provedVerbs = false;
    var maxStep = 0;   // furthest tutorial step reported THIS session — in-memory, so NO new save key
    var iv = setInterval(function () {
      if (++n > 1200) { clearInterval(iv); return; }   // ~10 min: auth + cinematic + the 160s cap
      var s = safe(function () {
        var J = window.BlockchainJourney;
        return (J && J._S) ? J._S : null;
      }, null);
      if (!s) return;                                  // website page, or module not parsed yet

      /* BREADCRUMB — report each NEW tutorial step reached (tStage 1,2,3) so the Founder Report can
         split "stalled at tutorial_started with ZERO reps" from "did step 1-2 then gave up" — the
         exit point today is only "tutorial_started" with no inside-view. Deduped in-memory by the
         furthest step reached this session (a fast poll never double-counts; the tutorial runs once
         per player, gated on cq_played, so it is not re-entered). Deliberately NOT a localStorage
         key: that would touch the protected save schema, and the report counts DISTINCT players per
         step, so the only untidy case — a mid-tutorial reload re-emitting a step — is harmless.
         Step 0 (entered, no reps) is already covered by tutorial_started, so only 1+ fires. */
      var st = safe(function () { return (typeof s.tStage === 'number') ? s.tStage : 0; }, 0);
      if (st > maxStep) {
        maxStep = st;
        event('tutorial_step_reached', { step: st, phase: s.phase || '', count: s.tCount || 0 });
      }

      if (!provedVerbs && (s.tStage === 1 || s.tStage === 2) && !s.tCelebDone) provedVerbs = true;

      if (provedVerbs && s.tCelebDone === true && s.phase === 'grow') {
        clearInterval(iv);
        event('movement_tutorial_completed', { shells: s.shellCount || 0, gems: s.gemCount || 0 });
        return;
      }

      /* The Journey is over and they never earned it (skipped, timed out, or walked to the
         portal unfinished). The answer cannot change — stop burning a timer for 10 minutes. */
      if (s._ended) clearInterval(iv);
    }, 500);
  }

  function boot() {
    startSession();

    safe(function () {
      document.addEventListener('click',    onPlayControl, true);
      document.addEventListener('auxclick', onPlayControl, true);
    });

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
    watchMovementTutorial();
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
