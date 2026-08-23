/* ChartQuest Cloud Data — production same-origin client adapter.
   Local game state remains authoritative unless a caller explicitly applies a remote read.
   Writes are durable-before-send and leave the queue only after an exact JSON receipt. */
(function (root) {
  'use strict';

  var VERSION = '1.0.0';
  var QUEUE_KEY = 'cq_cloud_data_queue_v1';
  var META_KEY = 'cq_cloud_data_meta_v1';
  var MAX_QUEUE_ENTRIES = 512;
  var MAX_OPERATION_CHARS = 220000;
  var MAX_CONTENT_ROWS = 100;
  var MAX_JOURNAL_ROWS = 200;
  var MAX_JOURNAL_CHARS = 100000;
  var JOURNAL_PAGE_LIMIT = 100;
  var MAX_MASTERY_ROWS = 40;
  var MAX_QUOTE_MARKETS = 8;
  var MAX_FLUSH_ATTEMPTS = 32;
  var RETRY_MIN_MS = 2000;
  var RETRY_MAX_MS = 60000;

  var LOCAL_KEYS = Object.freeze({
    playerId: 'cq_pid',
    profile: 'cq_player_v1',
    trades: 'shellTradeJournal_v1',
    notes: 'shellTradeNotes_v1',
    streak: 'shellTradeDaily_v1',
    mastery: 'cq_mastery_v1'
  });

  var ENDPOINTS = Object.freeze({
    session: '/api/app/session',
    account: '/api/app/account',
    claim: '/api/app/claim',
    profile: '/api/app/profile',
    journal: '/api/app/journal',
    streak: '/api/app/streak',
    mastery: '/api/app/mastery',
    bug: '/api/app/bug',
    visit: '/api/app/visit',
    content: '/api/app/content',
    marketPrice: '/api/app/market-price'
  });

  var CONTENT_TABLES = Object.freeze([
    'content_events', 'content_replays', 'content_briefs',
    'content_exports', 'content_generated'
  ]);
  var QUOTE_MARKETS = Object.freeze(['BTC', 'ETH', 'SOL', 'GOLD', 'AAPL', 'TSLA', 'NVDA', 'SPX']);
  var CANDLE_SYMBOLS = Object.freeze(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PAXGUSDT']);
  var CANDLE_INTERVALS = Object.freeze(['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']);
  var QUEUE_ENDPOINTS = Object.freeze([
    ENDPOINTS.profile, ENDPOINTS.journal, ENDPOINTS.streak, ENDPOINTS.mastery,
    ENDPOINTS.bug, ENDPOINTS.visit, ENDPOINTS.content
  ]);
  var MASTERY_WEIGHTS = Object.freeze({ mg: 0.35, boss: 0.25, trade: 0.25, lesson: 0.15 });

  function queueEntryAllowed(item) {
    if (QUEUE_ENDPOINTS.indexOf(item.endpoint) < 0) return false;
    var authBound = item.auth === true && typeof item.user_id === 'string' && item.user_id.length >= 1 && item.user_id.length <= 64;
    if (item.endpoint === ENDPOINTS.profile) {
      return authBound && item.method === 'PUT' &&
        ['profile.put', 'profile.bootstrap'].indexOf(item.operation) >= 0 &&
        Number.isInteger(item.body.expected_version) && item.body.expected_version >= 0 &&
        (item.operation === 'profile.bootstrap' ? item.body.bootstrap === true : item.body.bootstrap !== true);
    }
    if (item.endpoint === ENDPOINTS.journal) {
      return authBound && item.method === 'PUT' && item.operation === 'journal.put' &&
        Number.isInteger(item.body.base_version) && item.body.base_version >= 0 &&
        Array.isArray(item.body.trades) && Array.isArray(item.body.notes) &&
        Array.isArray(item.body.delete_trade_ids || []) && Array.isArray(item.body.delete_note_ids || []);
    }
    if (item.endpoint === ENDPOINTS.streak) {
      return authBound && item.method === 'PUT' && item.operation === 'streak.put' &&
        Number.isInteger(item.body.expected_version) && item.body.expected_version >= 0;
    }
    if (item.endpoint === ENDPOINTS.mastery) return authBound && item.method === 'PUT' && item.operation === 'mastery.put';
    if (item.endpoint === ENDPOINTS.bug) {
      return item.method === 'POST' && item.operation === 'bug.create' && item.body.request_id === item.id;
    }
    if (item.endpoint === ENDPOINTS.visit) {
      return item.method === 'POST' && item.operation === 'visit.create' && item.body.visit_id === item.id;
    }
    if (item.endpoint === ENDPOINTS.content) {
      return item.method === 'POST' && item.body.batch_id === item.id &&
        CONTENT_TABLES.indexOf(item.body.table) >= 0 && item.operation === 'content.' + item.body.table;
    }
    return false;
  }

  var memoryStore = {};
  var storage = (function () {
    try {
      if (root.localStorage && typeof root.localStorage.getItem === 'function') return root.localStorage;
    } catch (_) {}
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null; },
      setItem: function (key, value) { memoryStore[key] = String(value); },
      removeItem: function (key) { delete memoryStore[key]; }
    };
  })();

  var authState = { user: null, csrfToken: null, expiresAt: null };
  var flushPromise = null;
  var retryTimer = null;
  var retryMs = 0;
  var receipts = Object.create(null);

  function nowISO() { return new Date().toISOString(); }
  function clone(value) {
    if (value == null) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  }
  function safeParse(raw, fallback) {
    if (raw == null || raw === '') return clone(fallback);
    try { return JSON.parse(raw); } catch (_) { return clone(fallback); }
  }
  function readLocal(key, fallback) {
    try { return safeParse(storage.getItem(key), fallback); } catch (_) { return clone(fallback); }
  }
  function localPlayerId() {
    try { return storage.getItem(LOCAL_KEYS.playerId) || null; } catch (_) { return null; }
  }
  function localSnapshot() {
    return {
      player_id: localPlayerId(),
      profile: readLocal(LOCAL_KEYS.profile, null),
      trades: readLocal(LOCAL_KEYS.trades, []),
      notes: readLocal(LOCAL_KEYS.notes, []),
      streak: readLocal(LOCAL_KEYS.streak, null),
      mastery: readLocal(LOCAL_KEYS.mastery, {})
    };
  }

  function loadMeta() {
    var value = readLocal(META_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function saveMeta(patch) {
    var value = loadMeta();
    Object.keys(patch || {}).forEach(function (key) { value[key] = patch[key]; });
    try { storage.setItem(META_KEY, JSON.stringify(value)); return true; } catch (_) { return false; }
  }
  function accountVersion(kind, userId) {
    var meta = loadMeta();
    var accounts = meta.account_versions;
    var row = accounts && typeof accounts === 'object' && !Array.isArray(accounts) ? accounts[userId] : null;
    var value = row && row[kind];
    if (value == null) return null;
    return Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  }
  function saveAccountVersion(kind, version, userId) {
    userId = String(userId || (authState.user && authState.user.id) || '');
    version = Number(version);
    if (!userId || !Number.isInteger(version) || version < 0) return false;
    var meta = loadMeta();
    var accounts = meta.account_versions;
    if (!accounts || typeof accounts !== 'object' || Array.isArray(accounts)) accounts = {};
    var row = accounts[userId];
    if (!row || typeof row !== 'object' || Array.isArray(row)) row = {};
    row[kind] = version;
    accounts[userId] = row;
    meta.account_versions = accounts;
    try { storage.setItem(META_KEY, JSON.stringify(meta)); return true; } catch (_) { return false; }
  }

  function loadQueueResult() {
    var raw;
    try { raw = storage.getItem(QUEUE_KEY); } catch (_) { return { ok: false, queue: [], code: 'storage_unavailable' }; }
    if (!raw) return { ok: true, queue: [] };
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { ok: false, queue: [], code: 'queue_corrupt' };
      for (var i = 0; i < parsed.length; i += 1) {
        var item = parsed[i];
        if (!item || typeof item.id !== 'string' || typeof item.endpoint !== 'string' ||
            QUEUE_ENDPOINTS.indexOf(item.endpoint) < 0 || ['POST', 'PUT'].indexOf(item.method) < 0 ||
            typeof item.operation !== 'string' || !Number.isFinite(Number(item.expected)) ||
            !item.body || typeof item.body !== 'object' || Array.isArray(item.body) || !queueEntryAllowed(item)) {
          return { ok: false, queue: [], code: 'queue_corrupt' };
        }
      }
      return { ok: true, queue: parsed };
    } catch (_) {
      return { ok: false, queue: [], code: 'queue_corrupt' };
    }
  }
  function persistQueue(queue) {
    try {
      if (queue.length) storage.setItem(QUEUE_KEY, JSON.stringify(queue));
      else storage.removeItem(QUEUE_KEY);
      return true;
    } catch (_) { return false; }
  }

  function uid(prefix) {
    try {
      if (root.crypto && typeof root.crypto.randomUUID === 'function') return prefix + root.crypto.randomUUID();
    } catch (_) {}
    return prefix + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function stableHash(value) {
    var text = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof text !== 'string') text = String(value);
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function finiteNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function resultFailure(code, message, extra) {
    return Object.assign({
      ok: false,
      confirmed: false,
      playable: true,
      code: code || 'cloud_unavailable',
      message: message || 'Cloud save is unavailable right now. Your game can continue on this device.'
    }, extra || {});
  }
  function resultSuccess(data, extra) {
    return Object.assign({ ok: true, confirmed: true, playable: true, data: data == null ? null : data }, extra || {});
  }

  function responseJSON(response) {
    if (!response || typeof response.json !== 'function') return Promise.resolve({ ok: false, code: 'invalid_response' });
    var contentType = '';
    try { contentType = response.headers && response.headers.get ? (response.headers.get('content-type') || '') : ''; } catch (_) {}
    if (contentType.toLowerCase().indexOf('application/json') < 0) {
      return Promise.resolve({ ok: false, code: 'invalid_response' });
    }
    return response.json().then(function (body) {
      if (!body || typeof body !== 'object') return { ok: false, code: 'invalid_response' };
      return { ok: !!response.ok && body.ok === true, status: response.status || 0, body: body };
    }).catch(function () { return { ok: false, code: 'invalid_response' }; });
  }

  function rawRequest(endpoint, options) {
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    var request = {
      method: options.method || 'GET',
      headers: headers,
      credentials: 'same-origin',
      cache: 'no-store'
    };
    if (options.keepalive) request.keepalive = true;
    if (options.body != null) {
      headers['Content-Type'] = 'application/json';
      request.body = JSON.stringify(options.body);
    }
    return root.fetch(endpoint, request).then(responseJSON).catch(function () {
      return { ok: false, status: 0, code: 'network_error' };
    });
  }

  function updateAuth(body) {
    authState.user = body && body.user ? clone(body.user) : null;
    authState.csrfToken = body && typeof body.csrf_token === 'string' ? body.csrf_token : null;
    authState.expiresAt = body && body.expires_at ? body.expires_at : null;
  }
  function serverFailure(parsed, fallbackCode, fallbackMessage, extra) {
    var body = parsed && parsed.body;
    return resultFailure(
      body && typeof body.error === 'string' ? body.error : (parsed && parsed.code) || fallbackCode,
      body && typeof body.message === 'string' ? body.message : fallbackMessage,
      Object.assign({ status: (parsed && parsed.status) || 0 }, extra || {})
    );
  }

  async function session() {
    var parsed = await rawRequest(ENDPOINTS.session);
    if (!parsed.ok) return serverFailure(parsed, 'session_unavailable', 'Account check is unavailable. You can keep playing as a guest.', { user: null });
    updateAuth(parsed.body);
    return resultSuccess({ user: clone(authState.user), expires_at: authState.expiresAt }, { signedIn: !!authState.user });
  }

  function validateDirectReceipt(parsed, id, operation, accepted) {
    if (!parsed || !parsed.ok || !parsed.body) return null;
    var receipt = parsed.body.receipt;
    if (!receipt || receipt.id !== id || receipt.operation !== operation || Number(receipt.accepted) !== accepted) return null;
    return clone(receipt);
  }

  async function signIn(email, password) {
    var parsed = await rawRequest(ENDPOINTS.session, { method: 'POST', body: { email: String(email || '').trim(), password: String(password || '') } });
    if (!parsed.ok || !parsed.body.user) return serverFailure(parsed, 'sign_in_failed', 'Sign in failed. Your local game is still safe.');
    updateAuth(parsed.body);
    return resultSuccess({ user: clone(authState.user), expires_at: authState.expiresAt }, { signedIn: true });
  }

  async function accountWrite(endpoint, operation, input) {
    var id = uid('auth-');
    var parsed = await rawRequest(endpoint, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': id },
      body: input
    });
    var receipt = validateDirectReceipt(parsed, id, operation, 1);
    if (!receipt || !parsed.body.user) return serverFailure(parsed, operation.replace('.', '_') + '_failed', 'Account setup was not confirmed. Your local game is still safe.');
    updateAuth(parsed.body);
    if (operation === 'account.create' && authState.user) {
      saveAccountVersion('profile', 0, authState.user.id);
      saveAccountVersion('journal', 0, authState.user.id);
      saveAccountVersion('streak', 0, authState.user.id);
    }
    return resultSuccess({ user: clone(authState.user), expires_at: authState.expiresAt }, { receipt: receipt, signedIn: true });
  }

  function createAccount(email, password, consent) {
    return accountWrite(ENDPOINTS.account, 'account.create', {
      email: String(email || '').trim(), password: String(password || ''), consent: consent === true
    });
  }
  function claimAccount(email, claimToken, password) {
    return accountWrite(ENDPOINTS.claim, 'account.claim', {
      email: String(email || '').trim(), claim_token: String(claimToken || ''), password: String(password || '')
    });
  }

  async function signOut() {
    var id = uid('signout-');
    if (!authState.csrfToken) {
      var checked = await session();
      if (!checked.ok || !authState.csrfToken) return resultFailure('signout_unavailable', 'Sign out was not confirmed. You are still signed in on this browser.');
    }
    var parsed = await rawRequest(ENDPOINTS.session, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': authState.csrfToken, 'X-Idempotency-Key': id }
    });
    var receipt = validateDirectReceipt(parsed, id, 'session.signout', 1);
    if (!receipt) return serverFailure(parsed, 'signout_unconfirmed', 'Sign out was not confirmed. You are still signed in on this browser.');
    updateAuth({ user: null });
    return resultSuccess(null, { receipt: receipt, signedIn: false });
  }

  function makeEntry(spec) {
    var id = spec.id || uid('write-');
    var body = clone(spec.body || {});
    if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};
    if (spec.idField) body[spec.idField] = id;
    return {
      id: id,
      endpoint: spec.endpoint,
      method: spec.method || 'POST',
      operation: spec.operation,
      expected: spec.expected,
      auth: spec.auth === true,
      lane: spec.lane || spec.endpoint,
      body: body,
      created_at: nowISO(),
      attempts: 0,
      last_status: null,
      last_error: null
    };
  }

  function enqueueEntries(entries) {
    var loaded = loadQueueResult();
    if (!loaded.ok) return { ok: false, code: loaded.code, ids: [] };
    if (loaded.queue.length + entries.length > MAX_QUEUE_ENTRIES) return { ok: false, code: 'queue_full', ids: [] };
    for (var i = 0; i < entries.length; i += 1) {
      if (JSON.stringify(entries[i].body).length > MAX_OPERATION_CHARS) return { ok: false, code: 'payload_too_large', ids: [] };
    }
    var next = loaded.queue.concat(entries);
    if (!persistQueue(next)) return { ok: false, code: 'storage_unavailable', ids: [] };
    return { ok: true, ids: entries.map(function (entry) { return entry.id; }) };
  }

  async function ensureAuthenticatedWrite() {
    if (authState.user && authState.csrfToken) return true;
    var checked = await session();
    return !!(checked.ok && authState.user && authState.csrfToken);
  }

  function exactReceipt(parsed, entry) {
    if (!parsed || !parsed.ok || !parsed.body) return null;
    var receipt = parsed.body.receipt;
    if (!receipt || receipt.id !== entry.id || receipt.operation !== entry.operation ||
        Number(receipt.accepted) !== Number(entry.expected)) return null;
    return clone(receipt);
  }

  async function sendEntry(entry) {
    if (entry.auth && !(await ensureAuthenticatedWrite())) {
      return { ok: false, status: 401, code: 'account_required' };
    }
    if (entry.auth && (!authState.user || String(authState.user.id) !== entry.user_id)) {
      return { ok: false, status: 409, code: 'account_scope_mismatch' };
    }
    var headers = { 'X-Idempotency-Key': entry.id };
    if (entry.auth) headers['X-CSRF-Token'] = authState.csrfToken;
    var parsed = await rawRequest(entry.endpoint, {
      method: entry.method,
      headers: headers,
      body: entry.body,
      keepalive: true
    });
    var receipt = exactReceipt(parsed, entry);
    if (!receipt) {
      return {
        ok: false,
        status: (parsed && parsed.status) || 0,
        code: (parsed && parsed.body && parsed.body.error) || (parsed && parsed.code) || 'unconfirmed_receipt'
      };
    }
    return { ok: true, receipt: receipt };
  }

  function updateQueuedFailure(id, failure) {
    var loaded = loadQueueResult();
    if (!loaded.ok) return false;
    var changed = false;
    loaded.queue.forEach(function (entry) {
      if (entry.id !== id) return;
      entry.attempts = (entry.attempts || 0) + 1;
      entry.last_status = failure.status || 0;
      entry.last_error = failure.code || 'cloud_unavailable';
      changed = true;
    });
    return !changed || persistQueue(loaded.queue);
  }
  function removeConfirmed(id) {
    var loaded = loadQueueResult();
    if (!loaded.ok) return false;
    var next = loaded.queue.filter(function (entry) { return entry.id !== id; });
    if (next.length === loaded.queue.length) return true;
    return persistQueue(next);
  }

  function scheduleRetry() {
    if (retryTimer || typeof root.setTimeout !== 'function') return;
    retryMs = Math.min(retryMs ? retryMs * 2 : RETRY_MIN_MS, RETRY_MAX_MS);
    retryTimer = root.setTimeout(function () {
      retryTimer = null;
      flush();
    }, retryMs);
  }

  async function runFlush() {
    var attempted = 0, confirmed = 0, failed = 0;
    var blockedLanes = Object.create(null);
    var loaded = loadQueueResult();
    if (!loaded.ok) return resultFailure(loaded.code, 'The cloud queue needs repair. Local game data is unchanged.', { attempted: 0, flushed: 0, remaining: 0 });
    var candidates = loaded.queue.slice(0, MAX_FLUSH_ATTEMPTS);
    for (var i = 0; i < candidates.length; i += 1) {
      var entry = candidates[i];
      if (blockedLanes[entry.lane]) continue;
      attempted += 1;
      var sent = await sendEntry(entry);
      if (sent.ok) {
        receipts[entry.id] = sent.receipt;
        removeConfirmed(entry.id);
        confirmed += 1;
        if (sent.receipt.version != null && entry.user_id) {
          if (entry.operation === 'journal.put') saveAccountVersion('journal', sent.receipt.version, entry.user_id);
          if (entry.operation === 'profile.put' || entry.operation === 'profile.bootstrap') {
            saveAccountVersion('profile', sent.receipt.version, entry.user_id);
          }
          if (entry.operation === 'streak.put') saveAccountVersion('streak', sent.receipt.version, entry.user_id);
        }
      } else {
        updateQueuedFailure(entry.id, sent);
        blockedLanes[entry.lane] = true;
        failed += 1;
      }
    }
    var remainingResult = loadQueueResult();
    var remaining = remainingResult.ok ? remainingResult.queue.length : 0;
    saveMeta({ last_flush_at: nowISO(), last_flush_confirmed: confirmed, last_flush_failed: failed });
    if (remaining) scheduleRetry();
    else retryMs = 0;
    return resultSuccess({ attempted: attempted, flushed: confirmed, failed: failed, remaining: remaining });
  }
  function flush() {
    if (flushPromise) return flushPromise;
    flushPromise = runFlush().finally(function () { flushPromise = null; });
    return flushPromise;
  }

  async function queueAndConfirm(entries, options) {
    options = options || {};
    var queued = enqueueEntries(entries);
    if (!queued.ok) return resultFailure(queued.code, 'This cloud update could not be queued. Your on-device game is unchanged.', { queued: false, local: true });
    await flush();
    var confirmedReceipts = [], allConfirmed = true;
    queued.ids.forEach(function (id) {
      if (receipts[id]) confirmedReceipts.push(clone(receipts[id]));
      else allConfirmed = false;
    });
    if (allConfirmed) {
      queued.ids.forEach(function (id) { delete receipts[id]; });
      return resultSuccess(null, {
        receipt: confirmedReceipts.length === 1 ? confirmedReceipts[0] : null,
        receipts: confirmedReceipts,
        queued: false,
        local: true
      });
    }
    return resultFailure('cloud_unconfirmed', options.failureMessage, {
      queued: true,
      local: true,
      request_ids: queued.ids.slice()
    });
  }

  function accountRequiredFailure(code) {
    return resultFailure(code || 'account_required', 'Cloud sync needs an account. Your game remains saved on this device.', {
      queued: false, local: true
    });
  }
  async function authenticatedUserId() {
    if (!(await ensureAuthenticatedWrite())) {
      return null;
    }
    var userId = String(authState.user.id || '');
    return userId && userId.length <= 64 ? userId : null;
  }
  function bindAccountEntries(entries, userId) {
    entries.forEach(function (entry) {
      entry.user_id = userId;
      entry.lane = entry.lane + ':' + userId;
    });
    return entries;
  }
  function queuedNextVersion(lane, userId, fallback) {
    var loaded = loadQueueResult();
    if (!loaded.ok) return null;
    var next = fallback;
    loaded.queue.forEach(function (entry) {
      if (entry.user_id !== userId || entry.lane !== lane) return;
      var value = entry.body && (entry.body.expected_version != null
        ? entry.body.expected_version : entry.body.base_version);
      value = Number(value);
      if (Number.isInteger(value) && value >= 0) next = next == null ? value + 1 : Math.max(next, value + 1);
    });
    return next;
  }
  function queueForUser(entries, userId) {
    bindAccountEntries(entries, userId);
    return queueAndConfirm(entries);
  }
  async function queueAuthenticated(entries) {
    var userId = await authenticatedUserId();
    if (!userId) return accountRequiredFailure();
    return queueForUser(entries, userId);
  }

  async function readRemote(endpoint, localFallback, dataKey) {
    var parsed = await rawRequest(endpoint);
    if (!parsed.ok || !Object.prototype.hasOwnProperty.call(parsed.body, dataKey)) {
      return serverFailure(parsed, 'cloud_read_unavailable', 'Cloud data is unavailable. Using this device\'s save.', {
        source: 'local', data: clone(localFallback), local: true
      });
    }
    return resultSuccess(clone(parsed.body[dataKey]), { source: 'cloud', local: true });
  }

  function normalizeProfile(value) {
    value = value || {};
    return {
      shells: Math.max(0, Math.round(finiteNumber(value.shells, 0))),
      player_level: Math.max(1, Math.floor(finiteNumber(value.player_level != null ? value.player_level : value.level, 1))),
      xp: Math.max(0, Math.round(finiteNumber(value.xp, 0)))
    };
  }
  function requestedVersion(kind, lane, userId, explicit) {
    var base = explicit == null ? NaN : Number(explicit);
    if (!Number.isInteger(base) || base < 0) base = accountVersion(kind, userId);
    return queuedNextVersion(lane + ':' + userId, userId, base);
  }
  async function pushProfile(value, options) {
    var userId = await authenticatedUserId();
    if (!userId) return accountRequiredFailure();
    options = options || {};
    var profile = normalizeProfile(value || localSnapshot().profile);
    var version = requestedVersion('profile', 'profile', userId, options.expected_version);
    if (version == null) return accountRequiredFailure('profile_version_required');
    profile.expected_version = version;
    return queueForUser([makeEntry({
      endpoint: ENDPOINTS.profile, method: 'PUT', operation: 'profile.put', expected: 1,
      auth: true, lane: 'profile', body: profile
    })], userId);
  }
  async function bootstrapProfile(value) {
    var userId = await authenticatedUserId();
    if (!userId) return accountRequiredFailure();
    var pending = queuedNextVersion('profile:' + userId, userId, 0);
    if (pending !== 0) {
      return resultFailure('profile_bootstrap_unavailable', 'Initial progress can only be synchronized once.', {
        queued: false, local: true
      });
    }
    var profile = normalizeProfile(value || localSnapshot().profile);
    profile.expected_version = 0;
    profile.bootstrap = true;
    return queueForUser([makeEntry({
      endpoint: ENDPOINTS.profile, method: 'PUT', operation: 'profile.bootstrap', expected: 1,
      auth: true, lane: 'profile', body: profile
    })], userId);
  }
  async function pullProfile() {
    var userId = await authenticatedUserId();
    if (!userId) return resultFailure('account_required', 'Cloud sync needs an account. Using this device\'s save.', {
      source: 'local', data: normalizeProfile(localSnapshot().profile), queued: false, local: true
    });
    var result = await readRemote(ENDPOINTS.profile, normalizeProfile(localSnapshot().profile), 'profile');
    if (result.ok && result.data && result.data.version != null) saveAccountVersion('profile', result.data.version, userId);
    return result;
  }

  function normalizeTrades(values) {
    return (Array.isArray(values) ? values : []).map(function (trade, index) {
      var rawId = trade && (trade.trade_id != null ? trade.trade_id : trade.id);
      var data = trade && trade.trade_data != null ? trade.trade_data : trade;
      var row = { trade_id: normalizeJournalId(rawId, 'trade', index, data), trade_data: clone(data) };
      if (trade && trade.created_at) row.created_at = trade.created_at;
      return row;
    });
  }
  function normalizeNotes(values) {
    return (Array.isArray(values) ? values : []).map(function (note, index) {
      var rawId = note && (note.note_id != null ? note.note_id : note.id);
      var data = note && note.note_data != null ? note.note_data : note;
      var row = { note_id: normalizeJournalId(rawId, 'note', index, data), note_data: clone(data) };
      if (note && note.created_at) row.created_at = note.created_at;
      return row;
    });
  }
  function normalizeJournalId(rawId, kind, index, data) {
    var explicit = rawId == null ? '' : String(rawId);
    if (explicit && explicit.length <= 100) return explicit;
    // Imported and server-issued IDs are already bounded. Legacy local saves are not,
    // so shorten an oversized ID deterministically instead of queuing a write that the
    // server can never accept. The index is used only when the legacy item has no ID,
    // preserving distinct otherwise-identical local rows.
    return 'local-' + kind + '-' + stableHash({
      id: explicit || null,
      index: explicit ? null : index,
      data: data
    });
  }
  function normalizeDeleteIds(values) {
    if (values == null) return [];
    if (!Array.isArray(values)) return null;
    var seen = Object.create(null), result = [];
    for (var index = 0; index < values.length; index += 1) {
      var id = String(values[index] == null ? '' : values[index]);
      if (!id || id.length > 100 || seen[id]) return null;
      seen[id] = true;
      result.push(id);
    }
    return result;
  }
  function packJournalChanges(trades, notes, deleteTrades, deleteNotes) {
    var chunks = [], current = null, chars = 0;
    function fresh() {
      current = { trades: [], notes: [], delete_trade_ids: [], delete_note_ids: [] };
      chars = 128;
    }
    function flushChunk() {
      if (current && (current.trades.length || current.notes.length ||
          current.delete_trade_ids.length || current.delete_note_ids.length)) chunks.push(current);
      fresh();
    }
    function add(property, value, maxRows) {
      var encoded;
      try { encoded = JSON.stringify(value); } catch (_) { return false; }
      if (typeof encoded !== 'string' || encoded.length + 128 > MAX_JOURNAL_CHARS) return false;
      if (current[property].length >= maxRows || chars + encoded.length + 2 > MAX_JOURNAL_CHARS) flushChunk();
      current[property].push(value);
      chars += encoded.length + 2;
      return true;
    }
    fresh();
    for (var i = 0; i < trades.length; i += 1) if (!add('trades', trades[i], MAX_JOURNAL_ROWS)) return null;
    for (var j = 0; j < notes.length; j += 1) if (!add('notes', notes[j], MAX_JOURNAL_ROWS)) return null;
    for (var k = 0; k < deleteTrades.length; k += 1) if (!add('delete_trade_ids', deleteTrades[k], MAX_JOURNAL_ROWS)) return null;
    for (var m = 0; m < deleteNotes.length; m += 1) if (!add('delete_note_ids', deleteNotes[m], MAX_JOURNAL_ROWS)) return null;
    flushChunk();
    if (!chunks.length) chunks.push({ trades: [], notes: [], delete_trade_ids: [], delete_note_ids: [] });
    return chunks;
  }
  async function pushJournalSnapshot(input) {
    var userId = await authenticatedUserId();
    if (!userId) return accountRequiredFailure();
    var local = localSnapshot();
    input = input || {};
    var trades = normalizeTrades(input.trades != null ? input.trades : local.trades);
    var notes = normalizeNotes(input.notes != null ? input.notes : local.notes);
    var deleteTrades = normalizeDeleteIds(input.delete_trade_ids);
    var deleteNotes = normalizeDeleteIds(input.delete_note_ids);
    var chunks = deleteTrades && deleteNotes ? packJournalChanges(trades, notes, deleteTrades, deleteNotes) : null;
    if (!chunks) return resultFailure('journal_too_large', 'A Journal item is too large for cloud sync. The full Journal remains safe on this device.', {
      queued: false, local: true
    });
    var version = requestedVersion('journal', 'journal', userId, input.base_version);
    if (version == null) return accountRequiredFailure('journal_version_required');
    var entries = chunks.map(function (chunk, index) {
      return makeEntry({
        endpoint: ENDPOINTS.journal, method: 'PUT', operation: 'journal.put',
        expected: chunk.trades.length + chunk.notes.length + chunk.delete_trade_ids.length + chunk.delete_note_ids.length,
        auth: true, lane: 'journal', body: {
          base_version: version + index,
          trades: chunk.trades, notes: chunk.notes,
          delete_trade_ids: chunk.delete_trade_ids, delete_note_ids: chunk.delete_note_ids
        }
      });
    });
    return queueForUser(entries, userId);
  }
  async function pullJournalSnapshot() {
    var local = localSnapshot();
    var userId = await authenticatedUserId();
    if (!userId) return resultFailure('account_required', 'Cloud sync needs an account. Using this device\'s Journal.', {
      source: 'local', data: { version: 0, trades: clone(local.trades), notes: clone(local.notes) }, queued: false, local: true
    });
    for (var attempt = 0; attempt < 2; attempt += 1) {
      var trades = [], notes = [], version = null, tradeCursor = 0, noteCursor = 0;
      var seenTrades = Object.create(null), seenNotes = Object.create(null);
      while (true) {
        var endpoint = ENDPOINTS.journal;
        if (tradeCursor || noteCursor || version != null) {
          endpoint += '?limit=' + JOURNAL_PAGE_LIMIT + '&trade_cursor=' + tradeCursor +
            '&note_cursor=' + noteCursor + '&version=' + version;
        }
        var parsed = await rawRequest(endpoint);
        if (!parsed.ok) {
          if (parsed.status === 409) break;
          return serverFailure(parsed, 'cloud_read_unavailable', 'Cloud Journal is unavailable. Using this device\'s save.', {
            source: 'local', data: { version: 0, trades: clone(local.trades), notes: clone(local.notes) }, local: true
          });
        }
        var journal = parsed.body && parsed.body.journal;
        if (!journal || !Array.isArray(journal.trades) || !Array.isArray(journal.notes) ||
            !Number.isInteger(Number(journal.version)) || (version != null && Number(journal.version) !== version)) {
          return resultFailure('invalid_response', 'Cloud Journal returned an invalid page. Using this device\'s save.', {
            source: 'local', data: { version: 0, trades: clone(local.trades), notes: clone(local.notes) }, local: true
          });
        }
        version = Number(journal.version);
        for (var t = 0; t < journal.trades.length; t += 1) {
          var tradeId = String(journal.trades[t].trade_id);
          if (seenTrades[tradeId]) return resultFailure('invalid_response', 'Cloud Journal repeated a trade page.', { local: true });
          seenTrades[tradeId] = true;
          trades.push(journal.trades[t]);
        }
        for (var n = 0; n < journal.notes.length; n += 1) {
          var noteId = String(journal.notes[n].note_id);
          if (seenNotes[noteId]) return resultFailure('invalid_response', 'Cloud Journal repeated a note page.', { local: true });
          seenNotes[noteId] = true;
          notes.push(journal.notes[n]);
        }
        var page = journal.page;
        if (!page || (!page.trade_has_more && !page.note_has_more)) {
          saveAccountVersion('journal', version, userId);
          return resultSuccess({ version: version, trades: trades, notes: notes }, { source: 'cloud', local: true });
        }
        var nextTrade = page.trade_has_more ? Number(page.trade_next_cursor) : tradeCursor + journal.trades.length;
        var nextNote = page.note_has_more ? Number(page.note_next_cursor) : noteCursor + journal.notes.length;
        if (!Number.isInteger(nextTrade) || !Number.isInteger(nextNote) ||
            nextTrade < tradeCursor || nextNote < noteCursor ||
            (nextTrade === tradeCursor && nextNote === noteCursor)) {
          return resultFailure('invalid_response', 'Cloud Journal pagination stalled. Using this device\'s save.', { local: true });
        }
        tradeCursor = nextTrade;
        noteCursor = nextNote;
      }
    }
    return resultFailure('journal_version_conflict', 'Cloud Journal changed while loading. Please try again.', {
      source: 'local', data: { version: 0, trades: clone(local.trades), notes: clone(local.notes) }, local: true
    });
  }

  function normalizeStreak(value) {
    value = value || {};
    var streak = Math.max(0, Math.floor(finiteNumber(value.streak, 0)));
    var best = Math.max(streak, Math.floor(finiteNumber(value.best_streak != null ? value.best_streak : value.best, 0)));
    var date = value.last_drill_date != null ? value.last_drill_date : (value.lastDate || null);
    if (date != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) date = null;
    return {
      streak: streak,
      best_streak: best,
      last_drill_date: date
    };
  }
  async function pushStreak(value, options) {
    var userId = await authenticatedUserId();
    if (!userId) return accountRequiredFailure();
    options = options || {};
    var body = normalizeStreak(value || localSnapshot().streak);
    var version = requestedVersion('streak', 'streak', userId, options.expected_version);
    if (version == null) return accountRequiredFailure('streak_version_required');
    body.expected_version = version;
    return queueForUser([makeEntry({
      endpoint: ENDPOINTS.streak, method: 'PUT', operation: 'streak.put', expected: 1,
      auth: true, lane: 'streak', body: body
    })], userId);
  }
  async function pullStreak() {
    var userId = await authenticatedUserId();
    if (!userId) return resultFailure('account_required', 'Cloud sync needs an account. Using this device\'s streak.', {
      source: 'local', data: normalizeStreak(localSnapshot().streak), queued: false, local: true
    });
    var result = await readRemote(ENDPOINTS.streak, normalizeStreak(localSnapshot().streak), 'streak');
    if (result.ok && result.data && result.data.version != null) saveAccountVersion('streak', result.data.version, userId);
    return result;
  }

  function masteryScore(value) {
    if (value && value.score != null) return Math.max(0, Math.min(100, Math.round(finiteNumber(value.score, 0))));
    value = value || {};
    var score = 0;
    Object.keys(MASTERY_WEIGHTS).forEach(function (key) { score += MASTERY_WEIGHTS[key] * finiteNumber(value[key], 0); });
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  function normalizeMastery(value) {
    if (Array.isArray(value)) {
      return value.map(function (row) {
        row = row || {};
        var out = { category: String(row.category || ''), score: masteryScore(row) };
        if (row.updated_at) out.updated_at = row.updated_at;
        return out;
      }).filter(function (row) { return !!row.category; });
    }
    value = value || {};
    return Object.keys(value).map(function (category) {
      return { category: category, score: masteryScore(value[category]) };
    });
  }
  function pushMastery(value) {
    var rows = normalizeMastery(value || localSnapshot().mastery);
    if (!rows.length || rows.length > MAX_MASTERY_ROWS) {
      return Promise.resolve(resultFailure('mastery_rows_invalid', 'Mastery remains safe on this device, but this cloud snapshot is invalid.', {
        queued: false, local: true
      }));
    }
    return queueAuthenticated([makeEntry({ endpoint: ENDPOINTS.mastery, method: 'PUT', operation: 'mastery.put', expected: rows.length, auth: true, lane: 'mastery', body: { rows: rows } })]);
  }
  function pullMastery() {
    return readRemote(ENDPOINTS.mastery, { rows: normalizeMastery(localSnapshot().mastery) }, 'mastery');
  }

  function reportBug(message, context) {
    var text = String(message || '').trim();
    if (!text) return Promise.resolve(resultFailure('message_required', 'Please describe the problem before sending.', { queued: false, local: true }));
    var entry = makeEntry({
      endpoint: ENDPOINTS.bug, operation: 'bug.create', expected: 1, auth: false,
      lane: 'bug', idField: 'request_id',
      body: { player_id: localPlayerId(), message: text, context: clone(context || {}) || {} }
    });
    return queueAndConfirm([entry], { failureMessage: 'Your report is saved to retry, but it has not reached ChartQuest yet.' });
  }

  function recordVisit(input) {
    input = input || {};
    var path = input.path;
    var referrer = input.referrer;
    try { if (path == null && root.location) path = root.location.pathname || '/'; } catch (_) {}
    try { if (referrer == null && root.document) referrer = root.document.referrer || null; } catch (_) {}
    var entry = makeEntry({
      endpoint: ENDPOINTS.visit, operation: 'visit.create', expected: 1, auth: false,
      lane: 'visit', idField: 'visit_id',
      body: {
        player_id: input.player_id || localPlayerId(),
        path: path || '/',
        referrer: referrer || null,
        build: input.build || null,
        device: input.device || null
      }
    });
    return queueAndConfirm([entry]);
  }

  function pushContent(table, rows) {
    if (CONTENT_TABLES.indexOf(table) < 0) return Promise.resolve(resultFailure('content_table_invalid', 'This content type cannot be uploaded.', { queued: false, local: true }));
    if (!Array.isArray(rows) || !rows.length) return Promise.resolve(resultFailure('rows_required', 'There is no content to upload.', { queued: false, local: true }));
    var entries = [];
    for (var offset = 0; offset < rows.length; offset += MAX_CONTENT_ROWS) {
      var part = clone(rows.slice(offset, offset + MAX_CONTENT_ROWS));
      if (!Array.isArray(part)) return Promise.resolve(resultFailure('payload_invalid', 'This content batch cannot be uploaded.', { queued: false, local: true }));
      entries.push(makeEntry({
        endpoint: ENDPOINTS.content, operation: 'content.' + table, expected: part.length,
        auth: false, lane: 'content:' + table, idField: 'batch_id', body: { table: table, rows: part }
      }));
    }
    return queueAndConfirm(entries);
  }

  async function marketPrice(symbol, options) {
    options = options || {};
    var cleanSymbol = String(symbol || '').toUpperCase();
    if (CANDLE_SYMBOLS.indexOf(cleanSymbol) < 0) return resultFailure('symbol_invalid', 'That market symbol is not available.', { data: null, source: 'local' });
    var interval = String(options.interval || '1m');
    if (CANDLE_INTERVALS.indexOf(interval) < 0) interval = '1m';
    var limit = Math.max(10, Math.min(200, Math.floor(finiteNumber(options.limit, 120))));
    var endpoint = ENDPOINTS.marketPrice + '?symbol=' + encodeURIComponent(cleanSymbol) + '&interval=' + encodeURIComponent(interval) + '&limit=' + limit;
    var parsed = await rawRequest(endpoint);
    if (!parsed.ok) return serverFailure(parsed, 'market_unavailable', 'Live market data is unavailable. The game can continue with its built-in chart.', { data: null, source: 'local' });
    return resultSuccess(clone(parsed.body.market != null ? parsed.body.market : parsed.body.data), { source: 'cloud' });
  }

  async function marketQuotes(markets) {
    var values = Array.isArray(markets) ? markets : String(markets || '').split(',');
    var clean = [];
    values.forEach(function (value) {
      var ticker = String(value || '').trim().toUpperCase();
      if (QUOTE_MARKETS.indexOf(ticker) >= 0 && clean.indexOf(ticker) < 0) clean.push(ticker);
    });
    if (!clean.length || clean.length > MAX_QUOTE_MARKETS) {
      return resultFailure('markets_invalid', 'Those market quotes are not available.', { data: null, source: 'local' });
    }
    var endpoint = ENDPOINTS.marketPrice + '?markets=' + encodeURIComponent(clean.join(','));
    var parsed = await rawRequest(endpoint);
    if (!parsed.ok || !parsed.body.market || typeof parsed.body.market.prices !== 'object') {
      return serverFailure(parsed, 'market_unavailable', 'Live market data is unavailable. The game can continue with its built-in prices.', {
        data: null, source: 'local'
      });
    }
    return resultSuccess(clone(parsed.body.market), { source: 'cloud' });
  }

  function queueStatus() {
    var loaded = loadQueueResult();
    if (!loaded.ok) return { ok: false, code: loaded.code, count: null, entries: [] };
    return {
      ok: true,
      count: loaded.queue.length,
      limit: MAX_QUEUE_ENTRIES,
      entries: loaded.queue.map(function (entry) {
        return { id: entry.id, operation: entry.operation, lane: entry.lane, attempts: entry.attempts || 0, created_at: entry.created_at };
      })
    };
  }

  var account = Object.freeze({ session: session, signIn: signIn, create: createAccount, claim: claimAccount, signOut: signOut });
  var profile = Object.freeze({ push: pushProfile, pull: pullProfile, bootstrap: bootstrapProfile });
  var journal = Object.freeze({ pushSnapshot: pushJournalSnapshot, pullSnapshot: pullJournalSnapshot });
  var streak = Object.freeze({ push: pushStreak, pull: pullStreak });
  var mastery = Object.freeze({ push: pushMastery, pull: pullMastery });
  var bugs = Object.freeze({ report: reportBug });
  var visits = Object.freeze({ record: recordVisit });
  var content = Object.freeze({ pushBatch: pushContent, tables: CONTENT_TABLES });
  var markets = Object.freeze({ price: marketPrice, quotes: marketQuotes });

  var api = {
    version: VERSION,
    endpoints: ENDPOINTS,
    localKeys: LOCAL_KEYS,
    account: account,
    profile: profile,
    journal: journal,
    streak: streak,
    mastery: mastery,
    bugs: bugs,
    visits: visits,
    content: content,
    markets: markets,
    localSnapshot: localSnapshot,
    flush: flush,
    queueStatus: queueStatus,
    isSignedIn: function () { return !!authState.user; }
  };
  root.CQCloudData = Object.freeze(api);

  try {
    if (root.addEventListener) {
      root.addEventListener('online', function () { retryMs = 0; flush(); });
      root.addEventListener('pagehide', function () { flush(); });
    }
    if (root.document && root.document.addEventListener) {
      root.document.addEventListener('visibilitychange', function () {
        if (root.document.visibilityState === 'hidden') flush();
      });
    }
    if (loadQueueResult().ok && loadQueueResult().queue.length && root.setTimeout) root.setTimeout(flush, 0);
  } catch (_) {}
})(typeof window !== 'undefined' ? window : globalThis);
