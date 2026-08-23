(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CQAppDataModel = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var DATASET_GROUPS = Object.freeze({
    Accounts: ['identities', 'profiles'],
    Journals: ['journal_versions', 'journal_trades', 'journal_notes', 'journal_changes'],
    Progress: ['streaks', 'mastery', 'mastery_quarantine'],
    Quality: ['bugs', 'visits', 'visit_days'],
    Content: ['content_events', 'content_replays', 'content_briefs', 'content_assets', 'content_generated', 'content_exports', 'published_posts', 'performance', 'outbox'],
    Migration: ['migration_runs', 'migration_ledger', 'migration_quarantine', 'reconciliation']
  });

  var DATASET_DESCRIPTIONS = Object.freeze({
    identities: 'Player accounts and claim state', profiles: 'Saved shells, level and XP',
    journal_versions: 'Transactional journal versions', journal_trades: 'Saved trade entries',
    journal_notes: 'Saved private notes', journal_changes: 'Journal audit trail',
    streaks: 'Daily drill streaks', mastery: 'Skill-category scores',
    mastery_quarantine: 'Unmapped mastery rows held for review', bugs: 'Player bug reports',
    visits: 'Individual site visits', visit_days: 'Daily visit rollups',
    content_events: 'Candidate gameplay moments', content_replays: 'Replay payloads',
    content_briefs: 'Proposed content briefs', content_assets: 'Produced media assets',
    content_generated: 'Generated copy drafts', content_exports: 'Content exports',
    published_posts: 'Published social posts', performance: 'Post performance snapshots',
    outbox: 'Pending application work', migration_runs: 'Import run history',
    migration_ledger: 'Per-row import ledger', migration_quarantine: 'Rows held for migration review',
    reconciliation: 'Source-to-Cloudflare parity checks'
  });

  var IMPROVEMENT_THEMES = Object.freeze([
    { key: 'stability', label: 'Crashes, freezes or loading', words: ['crash', 'freeze', 'frozen', 'lag', 'loading', 'load time', 'stuck', 'bug', 'glitch'] },
    { key: 'controls', label: 'Controls and movement', words: ['control', 'swipe', 'jump', 'movement', 'move', 'boost', 'dive', 'tap'] },
    { key: 'clarity', label: 'Clarity, text and readability', words: ['text', 'font', 'readable', 'readability', 'confus', 'unclear', 'instruction', 'explain', 'tutorial', 'popup', 'pop-up'] },
    { key: 'trading', label: 'Trading, candles and charts', words: ['trade', 'trading', 'candle', 'chart', 'stop loss', 'take profit', 'entry'] },
    { key: 'audio', label: 'Music and audio', words: ['music', 'audio', 'sound', 'volume', 'song'] },
    { key: 'boss', label: 'Boss and difficulty', words: ['boss', 'gambler', 'guardian', 'difficulty', 'hard', 'easy'] },
    { key: 'journal', label: 'Journal and notes', words: ['journal', 'note', 'chapter', 'page'] },
    { key: 'visuals', label: 'Visual polish and animation', words: ['visual', 'graphic', 'animation', 'art', 'design', 'color', 'colour'] }
  ]);

  function rows(all, name) { return Array.isArray(all && all[name]) ? all[name] : []; }
  function number(value) { var n = Number(value); return isFinite(n) ? n : null; }
  function sum(values) { return values.reduce(function (total, value) { return total + (number(value) || 0); }, 0); }
  function round1(value) { return value == null ? null : Math.round(value * 10) / 10; }
  function mean(values) {
    var valid = values.map(number).filter(function (value) { return value != null; });
    return valid.length ? round1(sum(valid) / valid.length) : null;
  }
  function median(values) {
    var valid = values.map(number).filter(function (value) { return value != null; }).sort(function (a, b) { return a - b; });
    if (!valid.length) return null;
    var middle = Math.floor(valid.length / 2);
    return round1(valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2);
  }
  function countBy(source, key) {
    var result = {};
    source.forEach(function (row) {
      var value = typeof key === 'function' ? key(row) : row && row[key];
      value = value == null || value === '' ? 'unknown' : String(value);
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }
  function uniq(values) {
    var seen = {}, result = [];
    values.forEach(function (value) {
      if (value == null || value === '') return;
      var key = String(value);
      if (!seen[key]) { seen[key] = 1; result.push(key); }
    });
    return result;
  }
  function newest(rowsValue, fields) {
    var best = null, bestMs = null;
    rowsValue.forEach(function (row) {
      fields.some(function (field) {
        if (!row || !row[field]) return false;
        var ms = Date.parse(row[field]);
        if (!isFinite(ms)) return false;
        if (bestMs == null || ms > bestMs) { bestMs = ms; best = row[field]; }
        return true;
      });
    });
    return best;
  }
  function safeText(value) { return value == null ? '' : String(value).trim(); }
  function truncate(value, size) {
    var text = safeText(value).replace(/\s+/g, ' ');
    return text.length > size ? text.slice(0, size - 1) + '…' : text;
  }
  function confidence(n) {
    n = number(n) || 0;
    if (n >= 20) return { key: 'strong', label: 'Strong signal', note: '20+ observations' };
    if (n >= 8) return { key: 'directional', label: 'Directional', note: '8–19 observations' };
    if (n > 0) return { key: 'early', label: 'Early signal', note: 'fewer than 8 observations' };
    return { key: 'none', label: 'No evidence yet', note: 'no observations' };
  }

  function accountModel(all) {
    var identities = rows(all, 'identities');
    var profiles = rows(all, 'profiles');
    var byUser = {};
    identities.forEach(function (identity) { byUser[String(identity.id)] = { identity: identity, profile: null }; });
    profiles.forEach(function (profile) {
      var key = String(profile.user_id);
      if (!byUser[key]) byUser[key] = { identity: null, profile: null };
      byUser[key].profile = profile;
    });
    var roster = Object.keys(byUser).sort().map(function (key) {
      return { user_id: key, identity: byUser[key].identity, profile: byUser[key].profile };
    });
    return {
      identities: identities.length, profiles: profiles.length, roster: roster,
      profile_coverage_pct: identities.length ? Math.round((profiles.length / identities.length) * 100) : null,
      status: countBy(identities, 'status'), sources: countBy(identities, 'source_provider'),
      levels: countBy(profiles, function (row) { return 'Level ' + (number(row.player_level) || 1); }),
      average_xp: mean(profiles.map(function (row) { return row.xp; })),
      median_shells: median(profiles.map(function (row) { return row.shells; })),
      newest_account_at: newest(identities, ['created_at', 'updated_at'])
    };
  }

  function masteryTime(row, preferred) {
    var first = Date.parse(row && row[preferred]);
    if (isFinite(first)) return first;
    var fallback = Date.parse(row && row.updated_at);
    return isFinite(fallback) ? fallback : -Infinity;
  }

  function preferMasteryRow(candidate, current) {
    if (!current) return true;
    var candidateSource = masteryTime(candidate, 'source_updated_at');
    var currentSource = masteryTime(current, 'source_updated_at');
    if (candidateSource !== currentSource) return candidateSource > currentSource;
    var candidateUpdated = masteryTime(candidate, 'updated_at');
    var currentUpdated = masteryTime(current, 'updated_at');
    if (candidateUpdated !== currentUpdated) return candidateUpdated > currentUpdated;
    var candidateRaw = safeText(candidate.category_raw);
    var currentRaw = safeText(current.category_raw);
    if (candidateRaw !== currentRaw) return candidateRaw.localeCompare(currentRaw) < 0;
    return (number(candidate.score) || 0) > (number(current.score) || 0);
  }

  function canonicalMasteryRows(source) {
    var current = {};
    source.forEach(function (row) {
      var owner = safeText(row && row.owner_key);
      var category = safeText(row && row.category_normalized);
      if (!owner || !category) return;
      var key = owner + '\u0000' + category;
      if (preferMasteryRow(row, current[key])) current[key] = row;
    });
    return Object.keys(current).sort().map(function (key) { return current[key]; });
  }

  function progressModel(all) {
    var profiles = rows(all, 'profiles');
    var streaks = rows(all, 'streaks');
    var mastery = rows(all, 'mastery');
    var canonicalMastery = canonicalMasteryRows(mastery);
    var masteryGroups = {};
    canonicalMastery.forEach(function (row) {
      var category = safeText(row.category_normalized);
      if (!masteryGroups[category]) masteryGroups[category] = { scores: [], owners: [] };
      masteryGroups[category].scores.push(number(row.score) || 0);
      masteryGroups[category].owners.push(row.owner_key);
    });
    var categoryRows = Object.keys(masteryGroups).sort().map(function (category) {
      return {
        category: category,
        players: uniq(masteryGroups[category].owners).length,
        average_score: mean(masteryGroups[category].scores),
        median_score: median(masteryGroups[category].scores)
      };
    });
    return {
      profile_count: profiles.length,
      levels: countBy(profiles, function (row) { return 'Level ' + (number(row.player_level) || 1); }),
      average_xp: mean(profiles.map(function (row) { return row.xp; })),
      median_shells: median(profiles.map(function (row) { return row.shells; })),
      streak_rows: streaks.length,
      active_streaks: streaks.filter(function (row) { return (number(row.streak) || 0) > 0; }).length,
      average_streak: mean(streaks.map(function (row) { return row.streak; })),
      best_streak: streaks.length ? Math.max.apply(Math, streaks.map(function (row) { return number(row.best_streak) || 0; })) : null,
      mastery_rows: mastery.length,
      canonical_mastery_rows: canonicalMastery.length,
      mastery_owners: uniq(canonicalMastery.map(function (row) { return row.owner_key; })).length,
      mastery_categories: categoryRows,
      mastery_quarantine: rows(all, 'mastery_quarantine').length
    };
  }

  function journalModel(all) {
    var trades = rows(all, 'journal_trades');
    var notes = rows(all, 'journal_notes');
    var versions = rows(all, 'journal_versions');
    var changes = rows(all, 'journal_changes');
    var users = {};
    function user(userId) {
      var key = String(userId || 'unknown');
      if (!users[key]) users[key] = { user_id: key, trades: 0, notes: 0, versions: 0, changes: 0, latest_version: 0, updated_at: null };
      return users[key];
    }
    trades.forEach(function (row) { if (!row.deleted_at) user(row.user_id).trades += 1; });
    notes.forEach(function (row) { if (!row.deleted_at) user(row.user_id).notes += 1; });
    versions.forEach(function (row) {
      var target = user(row.user_id), version = number(row.version) || 0;
      target.versions += 1; target.latest_version = Math.max(target.latest_version, version);
      if (!target.updated_at || String(row.created_at) > String(target.updated_at)) target.updated_at = row.created_at;
    });
    changes.forEach(function (row) { user(row.user_id).changes += 1; });
    return {
      active_trades: trades.filter(function (row) { return !row.deleted_at; }).length,
      deleted_trades: trades.filter(function (row) { return !!row.deleted_at; }).length,
      active_notes: notes.filter(function (row) { return !row.deleted_at; }).length,
      deleted_notes: notes.filter(function (row) { return !!row.deleted_at; }).length,
      versions: versions.length, changes: changes.length,
      change_operations: countBy(changes, 'operation'),
      users: Object.keys(users).sort().map(function (key) { return users[key]; })
    };
  }

  function qualityModel(all) {
    var bugs = rows(all, 'bugs');
    var visits = rows(all, 'visits');
    var visitDays = rows(all, 'visit_days');
    var dailyTotal = sum(visitDays.map(function (row) { return row.visit_count; }));
    return {
      bugs: bugs.slice().sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); }),
      bug_status: countBy(bugs, 'status'),
      open_bugs: bugs.filter(function (row) { return row.status === 'open' || row.status === 'triaged'; }).length,
      bug_reporters: uniq(bugs.map(function (row) { return row.user_id || row.player_id; })).length,
      raw_visits: visits.length, daily_rollup_visits: dailyTotal,
      visit_players: uniq(visits.map(function (row) { return row.player_id; })).length,
      paths: countBy(visits, 'path'), devices: countBy(visits, 'device'), countries: countBy(visits, 'country'),
      visits: visits.slice().sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); }),
      visit_days: visitDays.slice().sort(function (a, b) { return String(b.visit_date || '').localeCompare(String(a.visit_date || '')); }),
      rollup_matches_raw: visits.length === dailyTotal,
      latest_visit_at: newest(visits, ['created_at', 'source_created_at'])
    };
  }

  function contentModel(all) {
    var events = rows(all, 'content_events');
    var briefs = rows(all, 'content_briefs');
    var generated = rows(all, 'content_generated');
    var outbox = rows(all, 'outbox');
    var names = DATASET_GROUPS.Content;
    var counts = {};
    names.forEach(function (name) { counts[name] = rows(all, name).length; });
    return {
      counts: counts, total_rows: sum(Object.keys(counts).map(function (key) { return counts[key]; })),
      event_types: countBy(events, 'event_type'), event_status: countBy(events, 'processed_status'),
      brief_status: countBy(briefs, 'status'), generated_status: countBy(generated, 'status'),
      outbox_status: countBy(outbox, 'status'),
      events: events.slice().sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); })
    };
  }

  function migrationModel(all) {
    var runs = rows(all, 'migration_runs');
    var ledger = rows(all, 'migration_ledger');
    var quarantine = rows(all, 'migration_quarantine');
    var checks = rows(all, 'reconciliation');
    var allChecksMatched = checks.length > 0 && checks.every(function (row) { return Number(row.matched) === 1; });
    var failedRuns = runs.filter(function (row) { return row.status === 'failed' || row.status === 'rolled_back'; }).length;
    var openRuns = runs.filter(function (row) { return row.status !== 'reconciled' && row.status !== 'rolled_back'; }).length;
    var everyRunChecked = runs.length > 0 && runs.every(function (run) {
      return checks.some(function (check) {
        if (run.run_id && check.run_id) return run.run_id === check.run_id && run.dataset === check.dataset && Number(check.matched) === 1;
        return run.dataset === check.dataset && Number(check.matched) === 1;
      });
    });
    var storedRunsReconciled = allChecksMatched && everyRunChecked && !failedRuns && !openRuns;
    var status = !runs.length ? 'awaiting_import' : (storedRunsReconciled ? 'stored_runs_reconciled' : (failedRuns ? 'attention' : 'in_progress'));
    return {
      status: status, runs: runs.slice().sort(function (a, b) { return String(b.started_at || '').localeCompare(String(a.started_at || '')); }),
      run_status: countBy(runs, 'status'), ledger_status: countBy(ledger, 'status'),
      ledger_rows: ledger.length, quarantine_rows: quarantine.length,
      quarantine_reasons: countBy(quarantine, 'reason_code'),
      reconciliations: checks.slice().sort(function (a, b) { return String(b.checked_at || '').localeCompare(String(a.checked_at || '')); }),
      matched_checks: checks.filter(function (row) { return Number(row.matched) === 1; }).length,
      all_matched: allChecksMatched, stored_runs_reconciled: storedRunsReconciled, failed_runs: failedRuns, open_runs: openRuns,
      quarantine: quarantine
    };
  }

  function surveyThemes(surveys) {
    return IMPROVEMENT_THEMES.map(function (theme) {
      var matches = [];
      surveys.forEach(function (row) {
        var combined = [row.q3_improvement, row.q5_anything].map(safeText).filter(Boolean).join(' ').toLowerCase();
        if (!combined) return;
        if (theme.words.some(function (word) { return combined.indexOf(word) !== -1; })) {
          matches.push({ player_id: row.player_id || null, excerpt: truncate(row.q3_improvement || row.q5_anything, 180) });
        }
      });
      return { key: theme.key, label: theme.label, mentions: matches.length, responses: surveys.length, excerpts: matches.slice(0, 3), confidence: confidence(matches.length) };
    }).filter(function (theme) { return theme.mentions > 0; }).sort(function (a, b) { return b.mentions - a.mentions || a.label.localeCompare(b.label); });
  }

  function insights(beta, app) {
    beta = beta || {};
    var surveys = Array.isArray(beta.raw_surveys) ? beta.raw_surveys : [];
    var funnel = Array.isArray(beta.funnel) ? beta.funnel : [];
    var themes = surveyThemes(surveys);
    var recommendations = [];
    var sequence = 0;
    function add(severity, title, why, action, evidence, sampleN) {
      recommendations.push({ id: ++sequence, severity: severity, title: title, why: why, action: action, evidence: evidence, sample_n: sampleN, confidence: confidence(sampleN) });
    }
    var players = number(beta.players_total) || 0;
    var crashPlayers = number(beta.overview && beta.overview.crash_players) || 0;
    var crashEvents = number(beta.overview && beta.overview.crash_events) || 0;
    if (crashPlayers > 0) {
      add(0, 'Fix verified crashes before widening the beta',
        crashPlayers + ' player' + (crashPlayers === 1 ? '' : 's') + ' recorded at least one crash.',
        'Reproduce the largest crash group first, ship a narrow fix, then repeat the same player path.',
        crashEvents + ' crash events across ' + crashPlayers + ' affected players', players);
    }
    var bottlenecks = funnel.filter(function (row) {
      return row && row.gating !== false && number(row.drop_players) > 0 && number(row.players) != null;
    }).map(function (row) {
      return { row: row, prior: (number(row.players) || 0) + (number(row.drop_players) || 0) };
    }).sort(function (a, b) { return (number(b.row.drop_players) || 0) - (number(a.row.drop_players) || 0) || (number(b.row.drop_pct) || 0) - (number(a.row.drop_pct) || 0); });
    if (bottlenecks.length) {
      var bottleneck = bottlenecks[0];
      add(1, 'Investigate the largest measured journey drop',
        bottleneck.row.label + ' lost ' + bottleneck.row.drop_players + ' of ' + bottleneck.prior + ' players from the previous required stage.',
        'Watch that transition in fresh sessions, ask one targeted follow-up question, and change only after the failure mode is observed.',
        bottleneck.row.drop_pct + '% drop into ' + bottleneck.row.label, bottleneck.prior);
    }
    if (themes.length) {
      var topTheme = themes[0];
      add(2, 'Review the leading written-feedback theme',
        topTheme.mentions + ' of ' + topTheme.responses + ' survey responses mentioned ' + topTheme.label.toLowerCase() + '.',
        'Read the matched verbatim excerpts, group concrete requests, and test the smallest common fix.',
        topTheme.label + ' · ' + topTheme.mentions + ' matched responses', topTheme.responses);
    }
    var notInterested = number(beta.surveys && beta.surveys.continue_dist && beta.surveys.continue_dist.not_interested) || 0;
    var continueAnswered = sum(Object.keys((beta.surveys && beta.surveys.continue_dist) || {}).map(function (key) { return beta.surveys.continue_dist[key]; }));
    if (notInterested > 0) {
      add(2, 'Follow up on low replay intent',
        notInterested + ' of ' + continueAnswered + ' answered players selected “not interested.”',
        'Compare those players’ funnel endpoints and written answers before choosing a product change.',
        notInterested + ' not-interested responses', continueAnswered);
    }
    if (app.quality.open_bugs > 0) {
      add(1, 'Triage open player bug reports',
        app.quality.open_bugs + ' Cloudflare bug report' + (app.quality.open_bugs === 1 ? ' is' : 's are') + ' still open or triaged.',
        'Reproduce, deduplicate, assign severity, and close each report with verification evidence.',
        app.quality.open_bugs + ' unresolved of ' + app.quality.bugs.length + ' stored reports', app.quality.bugs.length);
    }
    var lowMastery = app.progress.mastery_categories.filter(function (row) { return row.players >= 3 && row.average_score < 60; })
      .sort(function (a, b) { return a.average_score - b.average_score || a.category.localeCompare(b.category); });
    if (lowMastery.length) {
      add(3, 'Strengthen the lowest measured skill category',
        lowMastery[0].category.replace(/_/g, ' ') + ' averages ' + lowMastery[0].average_score + '/100 across ' + lowMastery[0].players + ' measured players.',
        'Review the teaching moment and retest the same category after one focused learning change.',
        lowMastery[0].category + ' · average ' + lowMastery[0].average_score + '/100', lowMastery[0].players);
    }
    if (!players && !surveys.length) {
      add(4, 'Collect the first verified Cloudflare cohort',
        'No post-cutover player events or survey responses are loaded in the selected window.',
        'Confirm instrumentation with one controlled session, then collect real testers before judging gameplay.',
        '0 players · 0 surveys', 0);
    } else if (players < 10 || surveys.length < 5) {
      add(4, 'Keep conclusions provisional while the sample is small',
        'The selected view contains ' + players + ' players and ' + surveys.length + ' survey responses.',
        'Continue the current beta until at least 10 players and 5 surveys are verified, while fixing only reproduced blockers.',
        players + ' players · ' + surveys.length + ' surveys', Math.min(players, surveys.length));
    }
    recommendations.sort(function (a, b) { return a.severity - b.severity || b.sample_n - a.sample_n || a.id - b.id; });
    return {
      recommendations: recommendations,
      themes: themes,
      samples: { players: players, surveys: surveys.length, events: number(beta.meta && beta.meta.event_count) || 0, accounts: app.accounts.identities, bug_reports: app.quality.bugs.length },
      caveats: [
        'Recommendations are deterministic rules calculated in this browser; no external AI service receives player data.',
        'Written-feedback themes use visible keyword matches and should be checked against the verbatim responses.',
        'Correlation in a small beta is not proof of cause. Confidence labels reflect sample size, not certainty.',
        app.migration.status === 'stored_runs_reconciled'
          ? 'Every stored import run reports parity; source-export completeness still requires a separate manifest check.'
          : 'Supabase history is not yet fully reconciled, so this report may omit pre-cutover history.'
      ]
    };
  }

  function build(all, summary, beta) {
    all = all || {};
    var counts = Object.assign({}, summary && summary.counts ? summary.counts : {});
    Object.keys(DATASET_DESCRIPTIONS).forEach(function (name) { if (counts[name] == null) counts[name] = rows(all, name).length; });
    var app = {
      counts: counts,
      accounts: accountModel(all),
      progress: progressModel(all),
      journal: journalModel(all),
      quality: qualityModel(all),
      content: contentModel(all),
      migration: migrationModel(all)
    };
    app.catalog = Object.keys(DATASET_GROUPS).reduce(function (out, group) {
      DATASET_GROUPS[group].forEach(function (name) {
        out.push({ group: group, name: name, description: DATASET_DESCRIPTIONS[name], count: number(counts[name]) || 0, loaded: rows(all, name).length });
      });
      return out;
    }, []);
    app.insights = insights(beta, app);
    return app;
  }

  return {
    build: build,
    confidence: confidence,
    surveyThemes: surveyThemes,
    DATASET_GROUPS: DATASET_GROUPS,
    DATASET_DESCRIPTIONS: DATASET_DESCRIPTIONS
  };
});
