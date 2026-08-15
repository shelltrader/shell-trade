(function () {
  'use strict';

  var API_ROOT = '/founder/api/beta-data';
  var PAGE_LIMIT = 500;
  var MAX_API_PAGES = 500;
  var EVENT_PAGE_SIZE = 100;
  var Model = window.BetaModel;
  var state = {
    rawEvents: null, rawSurveys: null, model: null, loadedAt: null, asOf: {},
    activeView: 'overview', search: '', eventName: 'all', eventPage: 0, stale: false,
    rangeTo: null, rangeDays: 7, committedRangeTo: null, committedRangeDays: null
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
    var cleanEvents = windowEvents.filter(function (row) { return !Model.isTestPlayer(row.player_id); });
    var cleanSurveys = windowSurveys.filter(function (row) { return !Model.isTestPlayer(row.player_id); });
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
      await refreshData();
      state.loadedAt = new Date();
      state.eventPage = 0;
      applyModel(true);
      state.committedRangeDays = range.days;
      state.committedRangeTo = range.to;
      byId('loadingShell').hidden = true;
      byId('searchInput').disabled = false;
      byId('buildSelect').disabled = false;
      setStatus('ready', 'Verified · ' + n(state.rawEvents.length) + ' events · ' + n(state.rawSurveys.length) + ' surveys');
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
    renderOverview(); renderFunnel(); renderPlayers(); renderSurveys(); renderEvents(); renderBuilds(); renderTech(); renderCrashes();
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
      ['API rows loaded', n(state.rawEvents.length + state.rawSurveys.length)],
      ['Entry builds seen', n(state.model.available_builds.length)],
      ['Crash groups', n(state.model.crashes.length)],
      ['Dashboard loaded', state.loadedAt ? date(state.loadedAt.toISOString()) : 'just now']
    ];
    byId('overviewSignals').innerHTML = '<div class="signal-list">' + signals.map(function (r) { return '<div class="signal"><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>'; }).join('') + '</div>';
  }

  function renderFunnel() {
    byId('funnelRows').innerHTML = state.model.funnel.map(function (r) {
      var note = r.gating === false ? '<span class="stage-note">Raw reach · non-gating</span>' : '';
      var drop = r.drop_players == null ? '—' : (r.drop_players ? '<span class="danger">−' + n(r.drop_players) + ' (' + r.drop_pct + '%)</span>' : '<span class="good">0</span>');
      return '<tr><td><strong>' + esc(r.label) + '</strong><br>' + note + '</td><td class="mono">' + n(r.players) + '</td><td>' + pct(r.pct_of_top) + '</td><td>' + pct(r.kept_from_prev_pct) + '</td><td>' + drop + '</td><td class="progress-cell"><div class="bar"><i style="width:' + Math.max(0, Math.min(100, r.pct_of_top || 0)) + '%"></i></div></td></tr>';
    }).join('');
  }

  function renderPlayers() {
    var rows = state.model.players.filter(matches);
    byId('playerCount').textContent = n(rows.length) + ' shown · ' + n(state.model.players.length) + ' in selected cohort';
    byId('playerEmpty').hidden = !!rows.length;
    byId('playerRows').innerHTML = rows.map(function (p) {
      return '<tr><td><button class="player-button" data-player="' + esc(encodeURIComponent(p.player_id)) + '">' + esc(p.player_id) + '</button></td>' +
        '<td>' + esc(date(p.last_seen)) + '</td><td>' + valueOrDash(p.furthest_label) + '</td><td class="mono">' + n(p.sessions) + '</td>' +
        '<td class="mono">' + (p.builds.length ? esc(p.builds.join(', ')) : '<span class="muted">unknown</span>') + '</td>' +
        '<td>' + esc([p.device, p.browser, p.os].filter(Boolean).join(' · ') || 'Unknown') + '</td><td class="mono">' + valueOrDash(p.survey_rating) + '</td>' +
        '<td class="mono ' + (p.crashes ? 'danger' : 'muted') + '">' + n(p.crashes) + '</td></tr>';
    }).join('');
  }

  function answer(label, value, wide) {
    var empty = value == null || String(value) === '';
    return '<div class="answer' + (wide ? ' wide' : '') + '"><small>' + esc(label) + '</small><p class="' + (empty ? 'muted' : '') + '">' + esc(empty ? '(not answered)' : value) + '</p></div>';
  }

  function renderSurveys() {
    var s = state.model.surveys, responses = state.model.raw_surveys.filter(matches), continueText = [];
    Object.keys(s.continue_dist).forEach(function (key) { continueText.push(key.replace('_', ' ') + ' ' + s.continue_dist[key]); });
    byId('surveySummary').innerHTML = '<div class="summary-card"><small>Responses</small><strong>' + n(s.n) + '</strong></div>' +
      '<div class="summary-card"><small>Average rating</small><strong>' + (s.avg_rating == null ? '—' : esc(s.avg_rating) + ' / 10') + '</strong></div>' +
      '<div class="summary-card"><small>Continue intent</small><strong style="font-size:14px;line-height:1.5">' + esc(continueText.join(' · ')) + '</strong></div>';
    byId('surveyCount').textContent = n(responses.length) + ' shown · ' + n(state.model.raw_surveys.length) + ' loaded';
    byId('surveyEmpty').hidden = !!responses.length;
    byId('surveyResponses').innerHTML = responses.map(function (r) {
      return '<article class="response-card"><header class="response-head"><div><strong>' + esc(r.player_id || 'Anonymous player') + '</strong>' +
        '<div class="muted">Rating ' + (r.q1_rating == null ? 'not answered' : esc(r.q1_rating) + ' / 10') + '</div></div><time>' + esc(date(r.created_at)) + '</time></header>' +
        '<div class="answers">' + answer('Q1 · Overall rating', r.q1_rating) + answer('Q4 · Would keep playing', r.q4_continue) +
        answer('Q2 · What hooked you?', r.q2_hook, true) + answer('Q3 · What should improve?', r.q3_improvement, true) +
        answer('Q5 · Anything else?', r.q5_anything, true) + answer('Time to complete survey', r.seconds_taken == null ? null : duration(r.seconds_taken)) + '</div>' +
        '<details class="raw raw-survey"><summary>All stored fields · verbatim JSON</summary><pre>' + esc(json(r)) + '</pre></details></article>';
    }).join('');
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

  function renderBuilds() {
    var rows = state.model.builds.filter(matches);
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
    var chips = [player.furthest_label, player.sessions + ' sessions', duration(player.total_seconds), player.device, player.browser, player.os, player.builds.length ? 'Build ' + player.builds.join(', ') : 'Build unknown'].filter(Boolean);
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
      buildViewModel: buildViewModel,
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
  if (!Model || typeof Model.build !== 'function') {
    setStatus('error', 'Dashboard model failed to load');
    byId('loadingShell').hidden = true;
    showError(apiError(0, 'The dashboard model failed to load.', 'beta-model.js was missing or invalid.'), false);
    return;
  }
  bind();
  load();
})();
