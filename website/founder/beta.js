(function () {
  'use strict';

  var API_ROOT = '/founder/api/beta-data';
  var APP_API_ROOT = '/founder/api/app-data';
  var PAGE_LIMIT = 500;
  var MAX_API_PAGES = 500;
  var EVENT_PAGE_SIZE = 100;
  var Model = window.BetaModel;
  var AppModel = window.CQAppDataModel;
  var state = {
    rawEvents: null, rawSurveys: null, model: null, loadedAt: null, asOf: {},
    rawApp: null, appSummary: null, appModel: null,
    activeView: 'overview', search: '', eventName: 'all', eventPage: 0, stale: false,
    rangeTo: null, rangeDays: 7, committedRangeTo: null, committedRangeDays: null,
    revealEmails: false, revealJournal: false
  };

  function byId(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function n(value) { return new Intl.NumberFormat().format(value == null ? 0 : value); }
  function valueOrDash(value) { return value == null ? '<span class="muted">—</span>' : esc(value); }
  function pct(value) { return value == null ? '<span class="muted">—</span>' : esc(value) + '%'; }
  function date(value) {
    if (!value) return 'Unknown time';
    var d = new Date(value);
    return isFinite(d.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d) : String(value);
  }
  function duration(seconds) {
    if (seconds == null) return '—';
    seconds = Math.round(seconds);
    var h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + s + 's';
    return s + 's';
  }
  function json(value) { return JSON.stringify(value, null, 2); }
  function searchable(value) {
    try { return JSON.stringify(value).toLowerCase(); } catch (_) { return String(value).toLowerCase(); }
  }
  function matches(value) { return !state.search || searchable(value).indexOf(state.search) !== -1; }
  function toneClass(value) { return value > 0 ? 'good' : value === 0 ? 'muted' : 'danger'; }

  function setStatus(kind, text) {
    var el = byId('loadState');
    el.className = 'load-state' + (kind ? ' ' + kind : '');
    byId('loadStateText').textContent = text;
  }

  function apiError(status, label, detail) {
    var e = new Error(label);
    e.status = status;
    e.detail = detail || '';
    return e;
  }

  async function fetchPage(resource, query) {
    var url = new URL(API_ROOT, window.location.origin);
    url.searchParams.set('dataset', resource);
    Object.keys(query).forEach(function (key) {
      if (query[key] != null && query[key] !== '') url.searchParams.set(key, query[key]);
    });
    var response;
    try {
      response = await fetch(url.toString(), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    } catch (err) {
      throw apiError(0, 'Cloudflare could not be reached.', err && err.message);
    }
    if (response.status === 401 || response.status === 403) {
      throw apiError(response.status, 'Founder access was denied or has expired.', 'Cloudflare Access returned HTTP ' + response.status + '. Re-open this protected page through the approved identity provider.');
    }
    if (!response.ok) {
      var snippet = '';
      try { snippet = (await response.text()).slice(0, 240); } catch (_) {}
      throw apiError(response.status, 'The ' + resource + ' feed returned an error.', 'HTTP ' + response.status + (snippet ? ' · ' + snippet : ''));
    }
    var type = response.headers.get('content-type') || '';
    if (type.indexOf('application/json') === -1) {
      throw apiError(response.status, 'The protected API did not return data.', 'Expected JSON from ' + url.pathname + '; received ' + (type || 'an unknown content type') + '. The Access session may have redirected.');
    }
    var payload;
    try { payload = await response.json(); } catch (err) { throw apiError(response.status, 'The ' + resource + ' response was not valid JSON.', err.message); }
    if (!payload || !Array.isArray(payload.rows) || !payload.page || typeof payload.page.has_more !== 'boolean') {
      throw apiError(response.status, 'The ' + resource + ' response has the wrong shape.', 'Expected { rows: [], page: { has_more, next_cursor } }.');
    }
    return payload;
  }

  async function fetchAll(resource) {
    var rows = [], cursor = null, cursors = {}, page = 0, asOf = null;
    while (true) {
      if (++page > MAX_API_PAGES) throw apiError(0, 'The ' + resource + ' feed exceeded the safety limit.', 'More than ' + MAX_API_PAGES + ' API pages were returned.');
      var payload = await fetchPage(resource, { cursor: cursor, limit: PAGE_LIMIT });
      rows = rows.concat(payload.rows);
      if (!payload.page.has_more) break;
      var next = payload.page.next_cursor;
      if (next == null || String(next) === '' || cursors[String(next)] || String(next) === String(cursor)) {
        throw apiError(0, 'The ' + resource + ' feed could not advance.', 'Pagination cursor was missing or repeated after page ' + page + '.');
      }
      cursors[String(next)] = 1;
      cursor = next;
    }
    return { rows: rows, asOf: asOf, pages: page };
  }

  async function loadAllFeeds() {
    var feeds = await Promise.all([fetchAll('events'), fetchAll('surveys')]);
    return { events: feeds[0], surveys: feeds[1] };
  }

  function commitFeeds(feeds) {
    state.rawEvents = feeds.events.rows;
    state.rawSurveys = feeds.surveys.rows;
    state.asOf = { events: feeds.events.asOf, surveys: feeds.surveys.asOf };
  }

  async function refreshData() {
    var feeds = await loadAllFeeds();
    commitFeeds(feeds);
    return feeds;
  }

  async function fetchAppJson(url, label) {
    var response;
    try {
      response = await fetch(url.toString(), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    } catch (err) {
      throw apiError(0, 'Cloudflare application data could not be reached.', err && err.message);
    }
    if (response.status === 401 || response.status === 403) {
      throw apiError(response.status, 'Founder access was denied or has expired.', 'Cloudflare Access returned HTTP ' + response.status + '. Re-open this protected page through the approved identity provider.');
    }
    if (!response.ok) {
      var snippet = '';
      try { snippet = (await response.text()).slice(0, 240); } catch (_) {}
      throw apiError(response.status, 'The ' + label + ' feed returned an error.', 'HTTP ' + response.status + (snippet ? ' · ' + snippet : ''));
    }
    var type = response.headers.get('content-type') || '';
    if (type.indexOf('application/json') === -1) {
      throw apiError(response.status, 'The protected application API did not return data.', 'Expected JSON from ' + url.pathname + '; received ' + (type || 'an unknown content type') + '.');
    }
    try { return await response.json(); } catch (err) { throw apiError(response.status, 'The ' + label + ' response was not valid JSON.', err.message); }
  }

  async function fetchAppSnapshot() {
    var url = new URL(APP_API_ROOT, window.location.origin);
    url.searchParams.set('dataset', 'snapshot');
    var payload = await fetchAppJson(url, 'application snapshot');
    var snapshot = payload && payload.snapshot;
    if (!snapshot || snapshot.version !== 1 || !/^[a-f0-9]{64}$/.test(String(snapshot.token || '')) ||
        !Array.isArray(snapshot.datasets) || !snapshot.counts || !snapshot.rows) {
      throw apiError(0, 'The application snapshot has the wrong shape.', 'Expected a versioned, content-addressed snapshot with datasets, counts and rows.');
    }
    var expected = Object.keys(AppModel.DATASET_DESCRIPTIONS || {});
    if (!expected.length || snapshot.datasets.join('|') !== expected.join('|')) {
      throw apiError(0, 'The application snapshot catalog does not match this dashboard.', 'Reload after the dashboard and API are on the same release.');
    }
    var countKeys = Object.keys(snapshot.counts).sort().join('|');
    var rowKeys = Object.keys(snapshot.rows).sort().join('|');
    var expectedKeys = expected.slice().sort().join('|');
    if (countKeys !== expectedKeys || rowKeys !== expectedKeys) {
      throw apiError(0, 'The application snapshot contains an unexpected dataset.', 'Counts and rows must exactly match the protected data catalog.');
    }
    var total = 0;
    expected.forEach(function (name) {
      var count = snapshot.counts[name];
      if (!Array.isArray(snapshot.rows[name]) || !Number.isSafeInteger(count) || count < 0 || snapshot.rows[name].length !== count) {
        throw apiError(0, 'The ' + name + ' snapshot failed its integrity check.', 'The declared row count does not match the delivered rows.');
      }
      total += count;
    });
    if (!Number.isSafeInteger(snapshot.total) || snapshot.total < 0 || total !== snapshot.total) {
      throw apiError(0, 'The application snapshot total failed its integrity check.', 'The declared total does not match the sum of dataset rows.');
    }
    return {
      rows: snapshot.rows,
      summary: { datasets: snapshot.datasets.slice(), counts: Object.assign({}, snapshot.counts) },
      snapshotToken: snapshot.token
    };
  }

  async function refreshEverything() {
    var result = await Promise.all([loadAllFeeds(), fetchAppSnapshot()]);
    commitFeeds(result[0]);
    state.rawApp = result[1].rows;
    state.appSummary = result[1].summary;
    state.revealEmails = false;
    state.revealJournal = false;
    return result;
  }

  function selectedRange() {
    var days = Number(byId('windowSelect').value), now = new Date(), from = null;
    if (days > 0) from = new Date(now.getTime() - days * 86400000).toISOString();
    return { days: days, from: from, to: now.toISOString() };
  }

  /* BetaModel is the canonical engine copied byte-for-byte from beta-qa/beta-model.js.
     This adapter only attaches the raw rows needed by the source-data views and exports. */
  function buildViewModel(events, surveys, requestedBuild) {
    var build = requestedBuild && requestedBuild !== 'all' ? String(requestedBuild) : null;
    var days = state.rangeDays;
    var options = { days: days, build: build, source: 'live', now: state.rangeTo || new Date().toISOString() };
    var analytics = Model.build(events, surveys, options);
    var allAnalytics = build ? Model.build(events, surveys, { days: days, source: 'live', now: options.now }) : analytics;
    var fromMs = days > 0 ? Model.util.parseTs(options.now) - days * 86400000 : null;
    function inWindow(row, survey) {
      var ms = survey ? Model.util.surveyMs(row) : Model.util.eventMs(row);
      return fromMs == null || (ms != null && ms >= fromMs);
    }
    var windowEvents = events.filter(function (row) { return row && inWindow(row, false); });
    var windowSurveys = surveys.filter(function (row) { return row && inWindow(row, true); });
    /* Use the model's player-level exclusion index for the raw tabs too. A dev-tagged browser
       has an ordinary p-* id and many untagged companion rows; filtering each row by prefix
       left those rows (and its survey) visible while the headline model correctly removed the
       player. One shared index keeps analytics, source views and exclusion counts identical. */
    var exclusion = Model.exclusionIndex(windowEvents, windowSurveys);
    var cleanEvents = windowEvents.filter(function (row) { return !exclusion.ids[String(row.player_id)]; });
    var cleanSurveys = windowSurveys.filter(function (row) { return !exclusion.ids[String(row.player_id)]; });
    var cohort = Model.util.entryBuildByPlayer(cleanEvents);
    var includedEvents = build ? cleanEvents.filter(function (row) { return cohort[row.player_id] === build; }) : cleanEvents;
    var includedSurveys = build ? cleanSurveys.filter(function (row) { return cohort[row.player_id] === build; }) : cleanSurveys;
    includedEvents.sort(function (a, b) { return (Model.util.eventMs(b) || 0) - (Model.util.eventMs(a) || 0); });
    includedSurveys.sort(function (a, b) { return (Model.util.surveyMs(b) || 0) - (Model.util.surveyMs(a) || 0); });
    analytics.available_builds = allAnalytics.builds.map(function (row) { return row.build; });
    analytics.events = includedEvents;
    analytics.raw_surveys = includedSurveys;
    analytics.meta.excluded_surveys = windowSurveys.length - cleanSurveys.length;
    var latestCrashByMessage = {};
    includedEvents.forEach(function (row) {
      if (row.name !== 'crash') return;
      var message = Model.util.normaliseCrashMessage(Model.util.propsOf(row).message);
      var ms = Model.util.eventMs(row);
      if (!latestCrashByMessage[message] || ms == null || latestCrashByMessage[message].ms == null || ms >= latestCrashByMessage[message].ms) {
        latestCrashByMessage[message] = { row: row, ms: ms };
      }
    });
    analytics.crashes.forEach(function (crash) {
      var hit = latestCrashByMessage[crash.message];
      if (!hit) return;
      var props = Model.util.propsOf(hit.row);
      crash.device = hit.row.device || props.device || null;
      crash.browser = hit.row.browser || props.browser || null;
      crash.os = hit.row.os || props.os || null;
    });
    analytics.overview = {
      // Canonical `players_total` is the event + survey roster union. The KPI is
      // event-bearing players only, so using it here would erase survey-only testers
      // while the card explicitly promises to include them.
      players: analytics.players_total,
      sessions: analytics.kpis.sessions.value,
      completions: analytics.kpis.completed_runs.value,
      surveys: analytics.surveys.n,
      avg_rating: analytics.kpis.avg_rating.value,
      median_game_seconds: analytics.kpis.median_session_seconds.value,
      crash_players: analytics.kpis.crash_players.value,
      crash_events: includedEvents.filter(function (row) { return row.name === 'crash'; }).length
    };
    return analytics;
  }

  async function load() {
    var hadData = !!state.model, range = selectedRange();
    state.rangeTo = range.to;
    state.rangeDays = range.days;
    setStatus('', 'Reading Cloudflare pages…');
    byId('refreshButton').disabled = true;
    byId('windowSelect').disabled = true;
    byId('errorPanel').hidden = true;
    state.stale = false;
    if (!hadData) {
      byId('loadingShell').hidden = false;
      document.querySelectorAll('[data-view-panel]').forEach(function (el) { el.hidden = true; });
    }
    try {
      await refreshEverything();
      state.loadedAt = new Date();
      state.eventPage = 0;
      applyModel(true);
      state.committedRangeDays = range.days;
      state.committedRangeTo = range.to;
      byId('loadingShell').hidden = true;
      byId('searchInput').disabled = false;
      byId('buildSelect').disabled = false;
      var appRows = Object.keys(state.rawApp).reduce(function (total, key) { return total + state.rawApp[key].length; }, 0);
      setStatus('ready', 'Verified · ' + n(state.rawEvents.length) + ' events · ' + n(state.rawSurveys.length) + ' surveys · ' + n(appRows) + ' app rows');
      byId('footerFreshness').textContent = 'Verified ' + date(state.loadedAt.toISOString());
    } catch (err) {
      state.stale = hadData;
      if (hadData && state.committedRangeDays != null) {
        state.rangeDays = state.committedRangeDays;
        state.rangeTo = state.committedRangeTo;
        byId('windowSelect').value = String(state.committedRangeDays);
      }
      showError(err, hadData);
      if (hadData) setStatus('stale', 'Refresh failed · showing verified data from ' + date(state.loadedAt.toISOString()));
      else {
        setStatus('error', 'No verified data available');
        byId('loadingShell').hidden = true;
        byId('footerFreshness').textContent = 'Data unavailable';
      }
    } finally {
      byId('refreshButton').disabled = false;
      byId('windowSelect').disabled = false;
      byId('workspace').setAttribute('aria-busy', 'false');
    }
  }

  function showError(err, stale) {
    byId('errorPanel').hidden = false;
    byId('errorTitle').textContent = stale ? 'Refresh failed; the last verified report is still shown.' : (err.message || 'The dashboard could not load.');
    byId('errorMessage').textContent = stale ? (err.message || 'The Cloudflare feed failed.') : 'No metrics are being substituted or inferred. Retry after the protected data feed is available.';
    byId('errorDetail').textContent = err.detail || (err.status ? 'HTTP ' + err.status : 'No response was received.');
  }

  function applyModel(resetBuildOptions) {
    var requested = byId('buildSelect').value || 'all';
    state.model = buildViewModel(state.rawEvents, state.rawSurveys, requested);
    if (resetBuildOptions) populateBuilds(state.model.available_builds, requested);
    state.appModel = AppModel.build(state.rawApp, state.appSummary, state.model);
    populateEventNames();
    renderAll();
    showView(state.activeView);
  }

  function populateBuilds(builds, requested) {
    var select = byId('buildSelect');
    select.innerHTML = '<option value="all">All builds</option>' + builds.map(function (build) {
      return '<option value="' + esc(build) + '">' + (build === Model.UNKNOWN_BUILD ? 'Unknown build' : 'Build ' + esc(build)) + '</option>';
    }).join('');
    select.value = builds.indexOf(requested) !== -1 ? requested : 'all';
    if (select.value !== requested) state.model = buildViewModel(state.rawEvents, state.rawSurveys, 'all');
  }

  function populateEventNames() {
    var names = {}, select = byId('eventNameSelect'), previous = state.eventName;
    state.model.events.forEach(function (e) { if (e && e.name) names[String(e.name)] = 1; });
    var options = Object.keys(names).sort();
    select.innerHTML = '<option value="all">All event names</option>' + options.map(function (name) { return '<option value="' + esc(name) + '">' + esc(name) + '</option>'; }).join('');
    select.value = options.indexOf(previous) !== -1 ? previous : 'all';
    state.eventName = select.value;
  }

  function renderAll() {
    renderOverview(); renderInsights(); renderFunnel(); renderPlayers(); renderSurveys();
    renderAccounts(); renderProgress(); renderJournals(); renderQuality(); renderContent(); renderMigration(); renderCatalog();
    renderEvents(); renderBuilds(); renderTech(); renderCrashes();
  }

  function card(label, value, note, tone) {
    return '<article class="kpi" style="--tone:' + esc(tone || 'var(--blue)') + '"><span class="kpi-label">' + esc(label) + '</span><strong class="kpi-value">' + esc(value) + '</strong><span class="kpi-note">' + esc(note) + '</span></article>';
  }

  function renderOverview() {
    var o = state.model.overview, meta = state.model.meta, build = meta.build_filter;
    byId('overviewScope').textContent = (build ? 'Entry cohort: build ' + build + ' · ' : '') + n(meta.event_count) + ' included events · ' + n(meta.survey_count) + ' included surveys';
    byId('overviewCards').innerHTML = [
      card('Unique players', n(o.players), build ? 'entry-build cohort roster' : 'event and survey roster', 'var(--blue)'),
      card('Sessions', n(o.sessions), 'unique visit sessions', 'var(--cyan)'),
      card('Beta completions', n(o.completions), 'distinct players', 'var(--green)'),
      card('Survey responses', n(o.surveys), 'every stored response', 'var(--gold)'),
      card('Average rating', o.avg_rating == null ? '—' : o.avg_rating + ' / 10', o.avg_rating == null ? 'no scored response' : n(o.surveys) + ' response rows', 'var(--gold)'),
      card('Median game session', duration(o.median_game_seconds), 'game pages only', 'var(--cyan)'),
      card('Players with crash', n(o.crash_players), n(o.crash_events) + ' total crash events', o.crash_players ? 'var(--red)' : 'var(--green)'),
      card('Excluded QA players', n(meta.excluded_players), n(meta.excluded_events) + ' events · ' + n(meta.excluded_surveys) + ' surveys', 'var(--orange)')
    ].join('');
    var journeyKeys = ['landing', 'trade', 'boss_won', 'completed', 'survey'], rows = [];
    journeyKeys.forEach(function (key) {
      var r = state.model.funnel.find(function (x) { return x.key === key; });
      if (r) rows.push('<div class="journey-row"><span>' + esc(r.label) + '</span><div class="bar"><i style="width:' + Math.max(0, Math.min(100, r.pct_of_top || 0)) + '%"></i></div><strong class="mono">' + n(r.players) + '</strong></div>');
    });
    byId('overviewJourney').innerHTML = '<div class="journey-list">' + rows.join('') + '</div>';
    var signals = [
      ['Beta rows loaded', n(state.rawEvents.length + state.rawSurveys.length)],
      ['Application rows loaded', n(state.appModel.catalog.reduce(function (total, row) { return total + row.loaded; }, 0))],
      ['Cloudflare accounts', n(state.appModel.accounts.identities)],
      ['Entry builds seen', n(state.model.available_builds.length)],
      ['Crash groups', n(state.model.crashes.length)],
      ['Dashboard loaded', state.loadedAt ? date(state.loadedAt.toISOString()) : 'just now']
    ];
    byId('overviewSignals').innerHTML = '<div class="signal-list">' + signals.map(function (r) { return '<div class="signal"><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>'; }).join('') + '</div>';
  }

  function distributionHtml(map, emptyText) {
    var keys = Object.keys(map || {}).sort(function (a, b) { return map[b] - map[a] || a.localeCompare(b); });
    var max = Math.max.apply(Math, keys.map(function (key) { return map[key]; }).concat([1]));
    if (!keys.length) return '<p class="muted">' + esc(emptyText || 'No stored values yet.') + '</p>';
    return keys.map(function (key) {
      return '<div class="distribution-row"><span>' + esc(key.replace(/_/g, ' ')) + '</span><div class="bar"><i style="width:' + ((map[key] / max) * 100) + '%"></i></div><strong>' + n(map[key]) + '</strong></div>';
    }).join('');
  }

  function statusBadge(value) {
    var text = String(value || 'unknown');
    var cls = /failed|disabled|dead|mismatch|attention/i.test(text) ? ' danger' : (/pending|open|triaged|prepared|running|progress|awaiting/i.test(text) ? ' warn' : '');
    return '<span class="status-badge' + cls + '">' + esc(text.replace(/_/g, ' ')) + '</span>';
  }

  function compactId(value) {
    var text = String(value || 'unknown');
    return text.length > 15 ? text.slice(0, 6) + '…' + text.slice(-6) : text;
  }

  function maskEmail(value) {
    var text = String(value || 'Not stored'), parts = text.split('@');
    if (parts.length !== 2) return '••••••';
    return (parts[0].slice(0, 1) || '•') + '••••@' + parts[1];
  }

  function renderInsights() {
    var report = state.appModel.insights, sampleLabels = { players: 'Players', surveys: 'Surveys', events: 'Events', accounts: 'Accounts', bug_reports: 'Bug reports' };
    byId('insightBasis').innerHTML = Object.keys(sampleLabels).map(function (key) {
      return '<div class="basis-chip"><span>' + esc(sampleLabels[key]) + '</span><strong>' + n(report.samples[key]) + '</strong></div>';
    }).join('');
    var tones = ['var(--red)', 'var(--gold)', 'var(--blue)', 'var(--cyan)', 'var(--muted)'];
    byId('insightList').innerHTML = report.recommendations.map(function (item, index) {
      return '<article class="recommendation" style="--recommendation-tone:' + tones[Math.min(item.severity, tones.length - 1)] + '">' +
        '<div class="recommendation-rank">' + (index + 1) + '</div><div><h3>' + esc(item.title) + '</h3><p>' + esc(item.why) + '</p>' +
        '<p class="next-action"><strong>Next:</strong> ' + esc(item.action) + '</p><span class="evidence-line">Evidence · ' + esc(item.evidence) + '</span></div>' +
        '<span class="confidence ' + esc(item.confidence.key) + '" title="' + esc(item.confidence.note) + '">' + esc(item.confidence.label) + '</span></article>';
    }).join('');
    byId('themeRows').innerHTML = report.themes.length ? report.themes.map(function (theme) {
      return '<div class="theme-row"><div class="theme-head"><strong>' + esc(theme.label) + '</strong><strong>' + n(theme.mentions) + ' / ' + n(theme.responses) + '</strong></div>' +
        theme.excerpts.map(function (hit) { return '<blockquote>“' + esc(hit.excerpt) + '”</blockquote>'; }).join('') + '</div>';
    }).join('') : '<p class="muted">No written-feedback theme has a verified keyword match in this selection.</p>';
    byId('insightCaveats').innerHTML = report.caveats.map(function (text) { return '<li>' + esc(text) + '</li>'; }).join('');
  }

  function renderAccounts() {
    var accounts = state.appModel.accounts;
    byId('accountCards').innerHTML = [
      card('Accounts', n(accounts.identities), 'Cloudflare identity rows', 'var(--blue)'),
      card('Saved profiles', n(accounts.profiles), accounts.profile_coverage_pct == null ? 'coverage unavailable' : accounts.profile_coverage_pct + '% account coverage', 'var(--cyan)'),
      card('Average XP', accounts.average_xp == null ? '—' : n(accounts.average_xp), n(accounts.profiles) + ' profiles', 'var(--gold)'),
      card('Median shells', accounts.median_shells == null ? '—' : n(accounts.median_shells), 'per saved profile', 'var(--green)')
    ].join('');
    byId('revealEmailsButton').textContent = state.revealEmails ? 'Hide account emails' : 'Reveal account emails';
    var roster = accounts.roster.filter(matches);
    byId('accountEmpty').hidden = !!roster.length;
    byId('accountRows').innerHTML = roster.map(function (entry) {
      var identity = entry.identity || {}, profile = entry.profile || {};
      var email = identity.email_original || identity.email_normalized;
      return '<tr><td class="mono" title="' + esc(entry.user_id) + '">' + esc(compactId(entry.user_id)) + '</td><td class="' + (state.revealEmails ? '' : 'masked') + '">' + esc(state.revealEmails ? (email || 'Not stored') : maskEmail(email)) + '</td>' +
        '<td>' + statusBadge(identity.status) + '</td><td>' + esc(identity.source_provider || 'unknown') + '</td><td class="mono">' + valueOrDash(profile.player_level) + '</td>' +
        '<td class="mono">' + valueOrDash(profile.xp) + '</td><td class="mono">' + valueOrDash(profile.shells) + '</td><td>' + esc(date(profile.updated_at || identity.updated_at || identity.created_at)) + '</td></tr>';
    }).join('');
  }

  function renderProgress() {
    var progress = state.appModel.progress;
    byId('progressCards').innerHTML = [
      card('Saved profiles', n(progress.profile_count), 'level, XP and shells', 'var(--blue)'),
      card('Active streaks', n(progress.active_streaks), n(progress.streak_rows) + ' streak rows', 'var(--gold)'),
      card('Best streak', progress.best_streak == null ? '—' : n(progress.best_streak) + ' days', 'highest stored value', 'var(--green)'),
      card('Mastery owners', n(progress.mastery_owners), n(progress.canonical_mastery_rows) + ' canonical skill scores', 'var(--cyan)')
    ].join('');
    byId('levelDistribution').innerHTML = distributionHtml(progress.levels, 'No saved profile levels yet.');
    var streakDist = {};
    (state.rawApp.streaks || []).forEach(function (row) {
      var current = Number(row.streak) || 0;
      var bucket = current === 0 ? '0 days' : current === 1 ? '1 day' : current <= 3 ? '2–3 days' : current <= 7 ? '4–7 days' : '8+ days';
      streakDist[bucket] = (streakDist[bucket] || 0) + 1;
    });
    byId('streakDistribution').innerHTML = distributionHtml(streakDist, 'No streak rows yet.');
    byId('masteryScope').textContent = n(progress.canonical_mastery_rows) + ' canonical scores from ' + n(progress.mastery_owners) + ' owners · ' +
      n(progress.mastery_rows) + ' source rows · ' + n(progress.mastery_quarantine) + ' held for review';
    byId('masteryEmpty').hidden = !!progress.mastery_categories.length;
    byId('masteryRows').innerHTML = progress.mastery_categories.map(function (row) {
      return '<tr><td><strong>' + esc(row.category.replace(/_/g, ' ')) + '</strong></td><td class="mono">' + n(row.players) + '</td><td class="mono">' + n(row.average_score) + '/100</td><td class="mono">' + n(row.median_score) + '/100</td>' +
        '<td class="progress-cell"><div class="bar"><i style="width:' + Math.max(0, Math.min(100, row.average_score || 0)) + '%"></i></div></td></tr>';
    }).join('');
  }

  function renderJournals() {
    var journal = state.appModel.journal;
    byId('journalCards').innerHTML = [
      card('Active trades', n(journal.active_trades), n(journal.deleted_trades) + ' tombstoned', 'var(--green)'),
      card('Active notes', n(journal.active_notes), n(journal.deleted_notes) + ' tombstoned', 'var(--blue)'),
      card('Journal versions', n(journal.versions), n(journal.users.length) + ' accounts with activity', 'var(--gold)'),
      card('Audit changes', n(journal.changes), n(journal.change_operations.delete || 0) + ' delete tombstones', 'var(--cyan)')
    ].join('');
    var users = journal.users.filter(matches);
    byId('journalUserEmpty').hidden = !!users.length;
    byId('journalUserRows').innerHTML = users.map(function (row) {
      return '<tr><td class="mono" title="' + esc(row.user_id) + '">' + esc(compactId(row.user_id)) + '</td><td class="mono">' + n(row.trades) + '</td><td class="mono">' + n(row.notes) + '</td><td class="mono">' + n(row.versions) + '</td><td class="mono">' + n(row.changes) + '</td><td class="mono">' + n(row.latest_version) + '</td><td>' + esc(date(row.updated_at)) + '</td></tr>';
    }).join('');
    byId('revealJournalButton').textContent = state.revealJournal ? 'Hide private journal entries' : 'Show private journal entries';
    byId('journalDetails').hidden = !state.revealJournal;
    if (!state.revealJournal) { byId('journalTradeRows').innerHTML = ''; byId('journalNoteRows').innerHTML = ''; return; }
    function privateRows(dataset, idKey, dataKey, emptyText) {
      var source = (state.rawApp[dataset] || []).filter(matches);
      if (!source.length) return '<p class="muted">' + esc(emptyText) + '</p>';
      return source.map(function (row) {
        return '<article class="private-record"><header><span class="mono">' + esc(compactId(row.user_id)) + ' · ' + esc(row[idKey]) + '</span><span>' + esc(row.deleted_at ? 'Deleted ' + date(row.deleted_at) : date(row.updated_at || row.created_at)) + '</span></header>' +
          '<details><summary>Open private contents</summary><pre>' + esc(json(row[dataKey])) + '</pre></details></article>';
      }).join('');
    }
    byId('journalTradeRows').innerHTML = privateRows('journal_trades', 'trade_id', 'trade_data', 'No trade entries match this search.');
    byId('journalNoteRows').innerHTML = privateRows('journal_notes', 'note_id', 'note_data', 'No note entries match this search.');
  }

  function renderQuality() {
    var quality = state.appModel.quality;
    byId('qualityCards').innerHTML = [
      card('Bug reports', n(quality.bugs.length), n(quality.open_bugs) + ' open or triaged', quality.open_bugs ? 'var(--red)' : 'var(--green)'),
      card('Bug reporters', n(quality.bug_reporters), 'identified reporters', 'var(--orange)'),
      card('Raw visits', n(quality.raw_visits), n(quality.visit_players) + ' identified players', 'var(--blue)'),
      card('Daily rollup', n(quality.daily_rollup_visits), quality.rollup_matches_raw ? 'matches raw visit count' : 'reported separately; counts differ', quality.rollup_matches_raw ? 'var(--green)' : 'var(--gold)')
    ].join('');
    byId('visitPaths').innerHTML = distributionHtml(quality.paths, 'No raw site visits yet.');
    byId('visitDevices').innerHTML = distributionHtml(quality.devices, 'No visit device values yet.');
    var bugs = quality.bugs.filter(matches);
    byId('bugScope').textContent = n(bugs.length) + ' shown · ' + n(quality.bugs.length) + ' stored';
    byId('bugEmpty').hidden = !!bugs.length;
    byId('bugRows').innerHTML = bugs.map(function (row) {
      return '<tr><td>' + esc(date(row.created_at || row.source_created_at)) + '</td><td>' + statusBadge(row.status) + '</td><td class="mono">' + esc(compactId(row.user_id || row.player_id || 'anonymous')) + '</td>' +
        '<td>' + esc(String(row.message || '').replace(/\s+/g, ' ').slice(0, 160)) + (String(row.message || '').length > 160 ? '…' : '') + '</td><td><details class="raw"><summary class="raw-button">Open</summary><pre>' + esc(json({ message: row.message, context: row.context, source: row.ingest_source })) + '</pre></details></td></tr>';
    }).join('');
  }

  function renderContent() {
    var content = state.appModel.content;
    var stages = [
      ['Moments', 'content_events'], ['Briefs', 'content_briefs'], ['Assets', 'content_assets'],
      ['Generated', 'content_generated'], ['Published', 'published_posts']
    ];
    byId('contentPipeline').innerHTML = stages.map(function (stage) {
      return '<article class="pipeline-step"><span>' + esc(stage[0]) + '</span><strong>' + n(content.counts[stage[1]]) + '</strong></article>';
    }).join('');
    byId('contentEventStatus').innerHTML = distributionHtml(content.event_status, 'No content events yet.');
    byId('outboxStatus').innerHTML = distributionHtml(content.outbox_status, 'No outbox work yet.');
    var events = content.events.filter(matches).slice(0, 200);
    byId('contentEventScope').textContent = n(events.length) + ' shown · first 200 matching moments';
    byId('contentEventEmpty').hidden = !!events.length;
    byId('contentEventRows').innerHTML = events.map(function (row) {
      return '<tr><td>' + esc(date(row.ts || row.created_at)) + '</td><td class="mono">' + esc(row.event_type || 'unknown') + '</td><td class="mono">' + esc(compactId(row.player_id || 'anonymous')) + '</td>' +
        '<td class="mono">' + valueOrDash(row.significance_score) + '</td><td>' + statusBadge(row.processed_status) + '</td><td><details class="raw"><summary class="raw-button">Inspect</summary><pre>' + esc(json({ payload: row.payload, educational_metadata: row.educational_metadata, content_flags: row.content_flags })) + '</pre></details></td></tr>';
    }).join('');
  }

  function renderMigration() {
    var migration = state.appModel.migration, title, message, cls = '';
    if (migration.status === 'stored_runs_reconciled') { title = 'Application imports pass reconciliation'; message = 'Every recorded application/account run has a matching count-and-digest check. Confirm the source export manifest covers every expected Supabase table before retirement.'; cls = ' ready'; }
    else if (migration.status === 'attention') { title = 'Application migration needs attention'; message = 'At least one application/account import run failed or rolled back. Supabase must remain available until the discrepancy is resolved.'; cls = ' attention'; }
    else if (migration.status === 'in_progress') { title = 'Application migration is in progress'; message = 'Application/account import evidence exists, but not every run has completed with matching reconciliation.'; }
    else { title = 'Application history is not imported'; message = 'Recovered beta telemetry is handled by the separate protected beta archive. Application/account history still requires a complete verified source export before Supabase retirement.'; }
    byId('migrationState').className = 'migration-state' + cls;
    byId('migrationState').innerHTML = '<h3>' + esc(title) + '</h3><p>' + esc(message) + '</p>';
    byId('migrationCards').innerHTML = [
      card('Import runs', n(migration.runs.length), n(migration.open_runs) + ' not reconciled', 'var(--blue)'),
      card('Ledger rows', n(migration.ledger_rows), 'per-row import evidence', 'var(--cyan)'),
      card('Quarantine', n(migration.quarantine_rows), 'held for explicit review', migration.quarantine_rows ? 'var(--gold)' : 'var(--green)'),
      card('Parity checks', n(migration.matched_checks) + ' / ' + n(migration.reconciliations.length), 'digest-and-count matches', migration.all_matched ? 'var(--green)' : 'var(--gold)')
    ].join('');
    byId('migrationRunEmpty').hidden = !!migration.runs.length;
    byId('migrationRunRows').innerHTML = migration.runs.map(function (row) {
      return '<tr><td>' + esc(date(row.started_at)) + '</td><td class="mono">' + esc(row.dataset) + '</td><td>' + statusBadge(row.status) + '</td><td class="mono">' + n(row.source_count) + '</td><td class="mono">' + n(row.imported_count) + '</td><td class="mono">' + n(row.quarantine_count) + '</td><td>' + esc(date(row.finished_at)) + '</td></tr>';
    }).join('');
    byId('reconciliationEmpty').hidden = !!migration.reconciliations.length;
    byId('reconciliationRows').innerHTML = migration.reconciliations.map(function (row) {
      return '<tr><td>' + esc(date(row.checked_at)) + '</td><td class="mono">' + esc(row.dataset) + '</td><td class="mono">' + n(row.source_count) + '</td><td class="mono">' + n(row.target_count) + '</td><td class="mono">' + n(row.quarantine_count) + '</td><td>' + statusBadge(Number(row.matched) === 1 ? 'matched' : 'mismatch') + '</td></tr>';
    }).join('');
  }

  function renderCatalog() {
    byId('catalogRows').innerHTML = state.appModel.catalog.map(function (row) {
      var base = APP_API_ROOT + '?dataset=' + encodeURIComponent(row.name) + '&mode=export&format=';
      return '<tr><td>' + esc(row.group) + '</td><td><strong class="mono">' + esc(row.name) + '</strong></td><td>' + esc(row.description) + '</td><td class="mono">' + n(row.count) + '</td><td class="mono ' + (row.count === row.loaded ? 'good' : 'danger') + '">' + n(row.loaded) + '</td>' +
        '<td><a class="text-link" href="' + esc(base + 'csv') + '">CSV</a> · <a class="text-link" href="' + esc(base + 'json') + '">JSON</a></td></tr>';
    }).join('');
  }

  function renderFunnel() {
    byId('funnelRows').innerHTML = state.model.funnel.map(function (r) {
      var note = r.gating === false ? '<span class="stage-note">Raw reach · non-gating</span>' : '';
      var drop = r.drop_players == null ? '—' : (r.drop_players ? '<span class="danger">−' + n(r.drop_players) + ' (' + r.drop_pct + '%)</span>' : '<span class="good">0</span>');
      return '<tr><td><strong>' + esc(r.label) + '</strong><br>' + note + '</td><td class="mono">' + n(r.players) + '</td><td>' + pct(r.pct_of_top) + '</td><td>' + pct(r.kept_from_prev_pct) + '</td><td>' + drop + '</td><td class="progress-cell"><div class="bar"><i style="width:' + Math.max(0, Math.min(100, r.pct_of_top || 0)) + '%"></i></div></td></tr>';
    }).join('');
  }

  function playerRowMarkup(p) {
    return '<tr><td><button class="player-button" data-player="' + esc(encodeURIComponent(p.player_id)) + '">' + esc(p.player_id) + '</button></td>' +
      '<td class="mono">' + esc(p.entry_cohort || Model.UNKNOWN_ATTRIBUTION) + '</td><td class="mono">' + esc(p.entry_invite || Model.UNKNOWN_ATTRIBUTION) + '</td>' +
      '<td>' + esc(date(p.last_seen)) + '</td><td>' + valueOrDash(p.furthest_label) + '</td><td class="mono">' + n(p.sessions) + '</td>' +
      '<td class="mono">' + (p.builds.length ? esc(p.builds.join(', ')) : '<span class="muted">unknown</span>') + '</td>' +
      '<td>' + esc([p.device, p.browser, p.os].filter(Boolean).join(' · ') || 'Unknown') + '</td><td class="mono">' + valueOrDash(p.survey_rating) + '</td>' +
      '<td class="mono ' + (p.crashes ? 'danger' : 'muted') + '">' + n(p.crashes) + '</td></tr>';
  }

  function renderPlayers() {
    var rows = state.model.players.filter(matches);
    byId('playerCount').textContent = n(rows.length) + ' shown · ' + n(state.model.players.length) + ' in selected cohort';
    byId('playerEmpty').hidden = !!rows.length;
    byId('playerRows').innerHTML = rows.map(playerRowMarkup).join('');
  }

  function answer(label, value, wide, emptyText) {
    var empty = value == null || String(value) === '';
    return '<div class="answer' + (wide ? ' wide' : '') + '"><small>' + esc(label) + '</small><p class="' + (empty ? 'muted' : '') + '">' + esc(empty ? (emptyText || '(not answered)') : value) + '</p></div>';
  }

  function choiceLabel(value, choices) {
    if (value == null || String(value) === '') return null;
    for (var i = 0; i < choices.length; i++) if (choices[i][0] === value) return choices[i][1];
    return String(value);
  }

  function distributionText(dist, choices) {
    return choices.map(function (choice) {
      return choice[1] + ' ' + n(dist && dist[choice[0]] || 0);
    }).join(' · ');
  }

  var EXPERIENCE_CHOICES = [
    ['new_to_both', 'New to both'],
    ['gamer_not_trader', 'Gamer, new to trading'],
    ['trader_not_gamer', 'Trader, new to games'],
    ['familiar_with_both', 'Familiar with both']
  ];
  var PURCHASE_INTENT_19_CHOICES = [
    ['definitely', 'Definitely'],
    ['probably', 'Probably'],
    ['unsure', 'Unsure'],
    ['probably_not', 'Probably not'],
    ['definitely_not', 'Definitely not']
  ];

  function surveySummaryMarkup(s) {
    var continueText = [];
    var experienceAnswered = Number(s.experience_answered) || 0;
    var purchaseAnswered = Number(s.purchase_intent_19_answered) || 0;
    Object.keys(s.continue_dist).forEach(function (key) { continueText.push(key.replace('_', ' ') + ' ' + s.continue_dist[key]); });
    return '<div class="summary-card"><small>Responses</small><strong>' + n(s.n) + '</strong></div>' +
      '<div class="summary-card"><small>Average rating</small><strong>' + (s.avg_rating == null ? '—' : esc(s.avg_rating) + ' / 10') + '</strong></div>' +
      '<div class="summary-card"><small>Continue intent</small><strong style="font-size:14px;line-height:1.5">' + esc(continueText.join(' · ')) + '</strong></div>' +
      '<div class="summary-card"><small>Prior experience · ' + n(experienceAnswered) + ' answered · ' + n(Math.max(0, s.n - experienceAnswered)) + ' not asked</small><strong style="font-size:14px;line-height:1.5">' + esc(distributionText(s.experience_dist, EXPERIENCE_CHOICES)) + '</strong></div>' +
      '<div class="summary-card"><small>Proposed $19 early-access intent · ' + n(purchaseAnswered) + ' answered · ' + n(Math.max(0, s.n - purchaseAnswered)) + ' not asked</small><strong style="font-size:14px;line-height:1.5">' + esc(distributionText(s.purchase_intent_19_dist, PURCHASE_INTENT_19_CHOICES)) + '</strong></div>';
  }

  function surveyResponseMarkup(r, player) {
    var cohort = player && player.entry_cohort || r.entry_cohort || Model.UNKNOWN_ATTRIBUTION;
    var invite = player && player.entry_invite || r.entry_invite || Model.UNKNOWN_ATTRIBUTION;
    return '<article class="response-card"><header class="response-head"><div><strong>' + esc(r.player_id || 'Anonymous player') + '</strong>' +
      '<div class="muted">Rating ' + (r.q1_rating == null ? 'not answered' : esc(r.q1_rating) + ' / 10') + '</div>' +
      '<div class="muted">Cohort <span class="mono">' + esc(cohort) + '</span> · Invite <span class="mono">' + esc(invite) + '</span></div></div><time>' + esc(date(r.created_at)) + '</time></header>' +
      '<div class="answers">' + answer('Q1 · Overall rating', r.q1_rating) + answer('Q4 · Would keep playing', r.q4_continue) +
      answer('Q2 · What hooked you?', r.q2_hook, true) + answer('Q3 · What should improve?', r.q3_improvement, true) +
      answer('Q5 · Anything else?', r.q5_anything, true) +
      answer('Q6 · Prior experience', choiceLabel(r.experience_level, EXPERIENCE_CHOICES), false, '(not asked)') +
      answer('Q7 · Proposed $19 early-access intent', choiceLabel(r.purchase_intent_19, PURCHASE_INTENT_19_CHOICES), false, '(not asked)') +
      answer('Time to complete survey', r.seconds_taken == null ? null : duration(r.seconds_taken)) + '</div>' +
      '<details class="raw raw-survey"><summary>All stored fields · verbatim JSON</summary><pre>' + esc(json(r)) + '</pre></details></article>';
  }

  function renderSurveys() {
    var s = state.model.surveys, players = {};
    state.model.players.forEach(function (player) { players[player.player_id] = player; });
    var responses = state.model.raw_surveys.filter(function (row) { return matches({ survey: row, attribution: players[row.player_id] || null }); });
    byId('surveySummary').innerHTML = surveySummaryMarkup(s);
    byId('surveyCount').textContent = n(responses.length) + ' shown · ' + n(state.model.raw_surveys.length) + ' loaded';
    byId('surveyEmpty').hidden = !!responses.length;
    byId('surveyResponses').innerHTML = responses.map(function (row) { return surveyResponseMarkup(row, players[row.player_id]); }).join('');
  }

  function filteredEvents() {
    return state.model.events.filter(function (e) { return (state.eventName === 'all' || e.name === state.eventName) && matches(e); });
  }

  function renderEvents() {
    var all = filteredEvents(), pages = Math.max(1, Math.ceil(all.length / EVENT_PAGE_SIZE));
    if (state.eventPage >= pages) state.eventPage = pages - 1;
    var start = state.eventPage * EVENT_PAGE_SIZE, rows = all.slice(start, start + EVENT_PAGE_SIZE);
    byId('eventCount').textContent = n(all.length) + ' match · ' + n(state.model.events.length) + ' included · ' + n(state.rawEvents.length) + ' API rows loaded';
    byId('eventEmpty').hidden = !!rows.length;
    byId('eventRows').innerHTML = rows.map(function (e) {
      var p = Model.util.propsOf(e), env = [e.device || p.device, e.browser || p.browser, e.os || p.os].filter(Boolean).join(' · ');
      return '<tr><td>' + esc(date(Model.util.eventMs(e) == null ? null : new Date(Model.util.eventMs(e)).toISOString())) + '</td><td><strong class="mono">' + esc(e.name || '(unnamed)') + '</strong></td>' +
        '<td class="mono">' + valueOrDash(e.player_id) + '</td><td class="mono">' + valueOrDash(e.session_id) + '</td><td class="mono">' + valueOrDash(Model.util.buildOf(e)) + '</td>' +
        '<td>' + esc(env || 'Unknown') + '</td><td><details class="raw"><summary class="raw-button">Inspect</summary><pre>' + esc(json(e)) + '</pre></details></td></tr>';
    }).join('');
    byId('eventPager').innerHTML = '<button type="button" data-page="prev" ' + (state.eventPage === 0 ? 'disabled' : '') + '>← Previous</button><span>Page ' + (state.eventPage + 1) + ' / ' + pages + '</span><button type="button" data-page="next" ' + (state.eventPage + 1 >= pages ? 'disabled' : '') + '>Next →</button>';
  }

  function cohortStageMarkup(value, players) {
    var rate = players ? Math.round((value / players) * 100) : null;
    return '<strong class="mono">' + n(value) + '</strong>' + (rate == null ? '' : ' <span class="muted">(' + n(rate) + '%)</span>');
  }

  function cohortRowsMarkup(rows) {
    return rows.map(function (row) {
      var invites = row.invites.map(function (invite) {
        return '<div><code>' + esc(invite.invite) + '</code> <span class="' + (invite.invite !== Model.UNKNOWN_ATTRIBUTION && invite.players > 1 ? 'danger' : 'muted') + '">' + n(invite.players) + ' player' + (invite.players === 1 ? '' : 's') + '</span></div>';
      }).join('');
      return '<tr><td><strong class="mono">' + esc(row.cohort) + '</strong></td><td class="mono">' + n(row.players) + '</td>' +
        '<td>' + cohortStageMarkup(row.first_trade_started, row.players) + '</td><td>' + cohortStageMarkup(row.beta_completed, row.players) + '</td>' +
        '<td>' + cohortStageMarkup(row.survey_response, row.players) + '</td><td>' + (invites || '<span class="muted">' + esc(Model.UNKNOWN_ATTRIBUTION) + '</span>') + '</td></tr>';
    }).join('');
  }

  function inviteReuseMarkup(rows) {
    return rows.map(function (row) {
      return '<code>' + esc(row.invite) + '</code> is attached to <strong>' + n(row.players) + '</strong> player IDs: <span class="mono">' + row.player_ids.map(esc).join(', ') + '</span>';
    }).join('<br>');
  }

  function renderBuilds() {
    var rows = state.model.builds.filter(matches);
    var cohortRows = state.model.cohorts.rows.filter(matches);
    var duplicateInvites = state.model.cohorts.duplicate_invites;
    byId('cohortRows').innerHTML = cohortRowsMarkup(cohortRows);
    byId('cohortEmpty').hidden = !!cohortRows.length;
    byId('inviteReuseWarning').hidden = !duplicateInvites.length;
    byId('inviteReuseDetail').innerHTML = inviteReuseMarkup(duplicateInvites);
    byId('buildRows').innerHTML = rows.map(function (b) {
      return '<tr><td><strong class="mono">' + esc(b.build) + '</strong></td><td class="mono">' + n(b.players) + '</td><td class="mono">' + n(b.sessions) + '</td>' +
        '<td>' + pct(b.boss_pct) + '</td><td>' + pct(b.journal_pct) + '</td><td>' + pct(b.completion_pct) + '</td><td>' + pct(b.survey_pct) + '</td>' +
        '<td class="mono">' + (b.avg_rating == null ? '—' : esc(b.avg_rating) + '/10') + '</td><td class="mono ' + (b.crashes ? 'danger' : 'muted') + '">' + n(b.crashes) + ' / ' + n(b.crash_players) + ' players</td></tr>';
    }).join('');
  }

  function renderTech() {
    var labels = { device: 'Device class', browser: 'Browser', os: 'Operating system', viewport: 'Viewport' };
    byId('techGrid').innerHTML = Object.keys(labels).map(function (key) {
      var map = state.model.tech[key], max = Math.max.apply(Math, Object.keys(map).map(function (k) { return map[k]; }).concat([1]));
      var rows = Object.keys(map).filter(function (k) { return matches({ dimension: key, value: k, players: map[k] }); }).map(function (k) {
        return '<div class="tech-row"><span>' + esc(k) + '</span><div class="bar"><i style="width:' + ((map[k] / max) * 100) + '%"></i></div><strong>' + n(map[k]) + '</strong></div>';
      }).join('');
      return '<article class="tech-card"><h3>' + esc(labels[key]) + '</h3>' + (rows || '<p class="muted">No matching values.</p>') + '</article>';
    }).join('');
  }

  function renderCrashes() {
    var rows = state.model.crashes.filter(matches), total = state.model.overview.crash_events;
    byId('crashCount').textContent = n(rows.length) + ' groups shown · ' + n(total) + ' crash events';
    byId('crashEmpty').hidden = !!rows.length;
    byId('crashList').innerHTML = rows.map(function (c) {
      var origin = c.origin === 'third_party' ? 'Third party' : c.origin === 'local' ? 'Local/dev' : 'ChartQuest';
      return '<article class="crash-card ' + esc(c.origin) + '"><div class="crash-head"><code>' + esc(c.message) + '</code><span class="pill ' + esc(c.origin) + '">' + origin + '</span></div>' +
        '<div class="crash-stats"><span><strong>' + n(c.players) + '</strong> players</span><span><strong>' + n(c.count) + '</strong> occurrences</span><span>Last ' + esc(date(c.last_seen)) + '</span>' +
        '<span>Build ' + esc(c.build || 'unknown') + '</span><span>' + esc([c.device, c.browser, c.os].filter(Boolean).join(' · ') || 'environment unknown') + '</span>' +
        (c.source_host ? '<span>Source ' + esc(c.source_host) + '</span>' : '') + '</div>' +
        '<details class="raw"><summary>Latest source detail</summary><pre>' + esc(json(c)) + '</pre></details></article>';
    }).join('');
  }

  function showView(view) {
    state.activeView = view;
    document.querySelectorAll('[data-view-panel]').forEach(function (panel) { panel.hidden = panel.getAttribute('data-view-panel') !== view; });
    document.querySelectorAll('.tab').forEach(function (tab) {
      var active = tab.getAttribute('data-view') === view;
      tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function openPlayer(encoded) {
    var pid;
    try { pid = decodeURIComponent(encoded); } catch (_) { return; }
    var player = state.model.players.find(function (p) { return p.player_id === pid; });
    if (!player) return;
    var detail = Model.playerTimeline(state.rawEvents, state.rawSurveys, pid), events = detail.events;
    var chips = ['Cohort ' + (player.entry_cohort || Model.UNKNOWN_ATTRIBUTION), 'Invite ' + (player.entry_invite || Model.UNKNOWN_ATTRIBUTION), player.furthest_label, player.sessions + ' sessions', duration(player.total_seconds), player.device, player.browser, player.os, player.builds.length ? 'Build ' + player.builds.join(', ') : 'Build unknown'].filter(Boolean);
    var surveyHtml = detail.survey ? '<h3>Survey response</h3><pre>' + esc(json(detail.survey)) + '</pre>' : '';
    byId('playerDialogBody').innerHTML = '<div class="dialog-body"><p class="eyebrow">PLAYER TIMELINE</p><h2 class="mono">' + esc(pid) + '</h2><div class="player-meta">' + chips.map(function (x) { return '<span class="meta-chip">' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="timeline">' + (events.length ? events.map(function (e) { return '<div class="timeline-item"><strong>' + esc(e.name || '(unnamed)') + '</strong><div class="timeline-time">+' + (e.offset_seconds == null ? '?' : e.offset_seconds) + 's · ' + esc(date(e.ts)) + '</div><details class="raw"><summary>Event properties</summary><pre>' + esc(json(e.props)) + '</pre></details></div>'; }).join('') : '<p class="muted">This player has a survey but no event rows in the selected window.</p>') + '</div>' + surveyHtml + '</div>';
    var dialog = byId('playerDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function bind() {
    byId('refreshButton').addEventListener('click', load);
    byId('retryButton').addEventListener('click', load);
    byId('windowSelect').addEventListener('change', load);
    byId('buildSelect').addEventListener('change', function () { state.eventPage = 0; applyModel(false); });
    byId('searchInput').addEventListener('input', function (e) { state.search = e.target.value.trim().toLowerCase(); state.eventPage = 0; renderAll(); });
    byId('eventNameSelect').addEventListener('change', function (e) { state.eventName = e.target.value; state.eventPage = 0; renderEvents(); });
    byId('revealEmailsButton').addEventListener('click', function () { state.revealEmails = !state.revealEmails; renderAccounts(); });
    byId('revealJournalButton').addEventListener('click', function () { state.revealJournal = !state.revealJournal; renderJournals(); });
    document.querySelector('.tabs').addEventListener('click', function (e) { var tab = e.target.closest('[data-view]'); if (tab) showView(tab.getAttribute('data-view')); });
    document.body.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]'); if (go) showView(go.getAttribute('data-go'));
      var player = e.target.closest('[data-player]'); if (player) openPlayer(player.getAttribute('data-player'));
      var page = e.target.closest('[data-page]'); if (page && !page.disabled) { state.eventPage += page.getAttribute('data-page') === 'next' ? 1 : -1; renderEvents(); }
    });
  }

  if (window.__CQ_FOUNDER_TEST__) {
    window.CQFounderDashboardTest = {
      apiRoot: API_ROOT,
      pageLimit: PAGE_LIMIT,
      fetchAll: fetchAll,
      loadAllFeeds: loadAllFeeds,
      refreshData: refreshData,
      appApiRoot: APP_API_ROOT,
      fetchAppSnapshot: fetchAppSnapshot,
      buildViewModel: buildViewModel,
      playerRowMarkup: playerRowMarkup,
      surveySummaryMarkup: surveySummaryMarkup,
      surveyResponseMarkup: surveyResponseMarkup,
      cohortRowsMarkup: cohortRowsMarkup,
      inviteReuseMarkup: inviteReuseMarkup,
      setRange: function (days, now) { state.rangeDays = days; state.rangeTo = now; },
      snapshot: function () {
        return {
          eventIds: (state.rawEvents || []).map(function (row) { return row.id; }),
          surveyIds: (state.rawSurveys || []).map(function (row) { return row.id; })
        };
      }
    };
    return;
  }
  if (!Model || typeof Model.build !== 'function' || !AppModel || typeof AppModel.build !== 'function') {
    setStatus('error', 'Dashboard models failed to load');
    byId('loadingShell').hidden = true;
    showError(apiError(0, 'The dashboard model failed to load.', 'beta-model.js or app-model.js was missing or invalid.'), false);
    return;
  }
  bind();
  load();
})();
