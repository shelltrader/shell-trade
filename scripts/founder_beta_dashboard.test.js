#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const founderDir = path.join(ROOT, 'website', 'founder');
const canonicalModelPath = path.join(ROOT, 'beta-qa', 'beta-model.js');
const deployedModelPath = path.join(founderDir, 'beta-model.js');
const dashboardPath = path.join(founderDir, 'beta.js');

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

function jsonResponse(body, status = 200, contentType = 'application/json; charset=utf-8') {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });
}

function dashboardHarness(fetchImpl) {
  const BetaModel = require(deployedModelPath);
  const window = {
    BetaModel,
    __CQ_FOUNDER_TEST__: true,
    location: { origin: 'https://playchartquest.com' },
  };
  const context = vm.createContext({
    window,
    fetch: fetchImpl,
    URL,
    Response,
    Intl,
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    Promise,
    Error,
    console,
  });
  vm.runInContext(fs.readFileSync(dashboardPath, 'utf8'), context, { filename: dashboardPath });
  return { hooks: window.CQFounderDashboardTest, context };
}

function event(id, player, name, ts, props = {}) {
  return {
    id,
    event_id: `evt-${id}`,
    player_id: player,
    session_id: `session-${player}`,
    name,
    ts,
    props,
    device: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    screen: '390x844',
    viewport: '390x700',
    created_at: ts,
  };
}

function survey(id, player, createdAt, rating = 9, research = null) {
  const row = {
    id,
    response_id: `response-${id}`,
    player_id: player,
    session_id: `session-${player}`,
    q1_rating: rating,
    q2_hook: `Hook answer ${id}`,
    q3_improvement: `Improvement answer ${id}`,
    q4_continue: 'immediately',
    q5_anything: `Anything answer ${id}`,
    seconds_taken: 75,
    created_at: createdAt,
    updated_at: createdAt,
    ingest_source: 'cloudflare',
  };
  if (research) Object.assign(row, research);
  return row;
}

(async () => {
  await test('deployed founder engine is byte-for-byte the canonical BetaModel', () => {
    assert.deepStrictEqual(fs.readFileSync(deployedModelPath), fs.readFileSync(canonicalModelPath));
  });

  await test('feed loader follows every exact Cloudflare page for both datasets', async () => {
    const calls = [];
    const mockFetch = async (input) => {
      const url = new URL(input);
      calls.push(url);
      assert.equal(url.pathname, '/founder/api/beta-data');
      assert.equal(url.searchParams.get('limit'), '500');
      assert.equal(url.searchParams.has('from'), false);
      assert.equal(url.searchParams.has('to'), false);
      assert.equal(url.searchParams.has('after_id'), false);
      const dataset = url.searchParams.get('dataset');
      const cursor = url.searchParams.get('cursor');
      if (dataset === 'events' && cursor == null) {
        return jsonResponse({ dataset, rows: [{ id: 1 }, { id: 2 }], page: { limit: 500, count: 2, next_cursor: 2, has_more: true } });
      }
      if (dataset === 'events' && cursor === '2') {
        return jsonResponse({ dataset, rows: [{ id: 3 }], page: { limit: 500, count: 1, next_cursor: null, has_more: false } });
      }
      if (dataset === 'surveys' && cursor == null) {
        return jsonResponse({ dataset, rows: [{ id: 10 }], page: { limit: 500, count: 1, next_cursor: 10, has_more: true } });
      }
      if (dataset === 'surveys' && cursor === '10') {
        return jsonResponse({ dataset, rows: [{ id: 11 }], page: { limit: 500, count: 1, next_cursor: null, has_more: false } });
      }
      throw new Error(`Unexpected request ${url}`);
    };
    const { hooks } = dashboardHarness(mockFetch);
    assert.equal(hooks.apiRoot, '/founder/api/beta-data');
    assert.equal(hooks.pageLimit, 500);
    await hooks.refreshData();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(hooks.snapshot())), { eventIds: [1, 2, 3], surveyIds: [10, 11] });
    assert.equal(calls.length, 4);
  });

  await test('a denied or failed feed never replaces the last verified rows with zeros', async () => {
    const firstFetch = async (input) => {
      const dataset = new URL(input).searchParams.get('dataset');
      return jsonResponse({ dataset, rows: dataset === 'events' ? [{ id: 41 }] : [{ id: 51 }], page: { limit: 500, count: 1, next_cursor: null, has_more: false } });
    };
    const harness = dashboardHarness(firstFetch);
    await harness.hooks.refreshData();
    const verified = harness.hooks.snapshot();
    harness.context.fetch = async (input) => {
      const dataset = new URL(input).searchParams.get('dataset');
      if (dataset === 'surveys') return jsonResponse({ error: 'Beta data service unavailable' }, 503);
      return jsonResponse({ dataset, rows: [], page: { limit: 500, count: 0, next_cursor: null, has_more: false } });
    };
    await assert.rejects(harness.hooks.refreshData(), /surveys feed returned an error/);
    assert.deepStrictEqual(harness.hooks.snapshot(), verified);
    assert.notDeepStrictEqual(verified, { eventIds: [], surveyIds: [] });
  });

  await test('24-hour scope keeps all real in-window surveys verbatim and counts only current QA exclusions', () => {
    const { hooks } = dashboardHarness(async () => { throw new Error('not used'); });
    const now = '2026-08-15T12:00:00.000Z';
    const recent = '2026-08-15T11:00:00.000Z';
    const old = '2026-08-10T11:00:00.000Z';
    const events = [
      event(1, 'p-real', 'session_start', recent, { build: '368' }),
      event(2, 'p-real', 'first_trade_started', recent, { build: '368' }),
      event(5, 'p-real', 'crash', recent, { build: '368', message: 'TypeError: fixture failed at https://playchartquest.com/game.js:44:2', origin: 'self' }),
      event(3, 'p-old', 'session_start', old, { build: '367' }),
      event(4, 'QA-founder', 'session_start', recent, { build: '368' }),
    ];
    const surveys = [
      survey(1, 'p-real', recent, 9),
      survey(2, 'p-survey-only', recent, 8),
      survey(3, 'QA-founder', recent, 10),
      survey(4, 'p-old', old, 2),
    ];
    hooks.setRange(1, now);
    const model = hooks.buildViewModel(events, surveys, 'all');
    assert.equal(model.overview.players, 2, 'headline roster must include the survey-only real player');
    assert.equal(model.surveys.n, 2);
    assert.deepStrictEqual(model.raw_surveys.map((row) => row.id), [1, 2]);
    assert.equal(model.raw_surveys[1].q5_anything, 'Anything answer 2');
    assert.equal(model.raw_surveys[1].ingest_source, 'cloudflare');
    assert.equal(model.meta.excluded_surveys, 1, 'older real surveys are outside the window, not QA exclusions');
    assert.equal(model.meta.excluded_players, 1);
    assert.equal(model.crashes[0].device, 'mobile');
    assert.equal(model.crashes[0].browser, 'Safari');
    assert.equal(model.crashes[0].os, 'iOS');
  });

  await test('research distributions exclude historical not-asked rows and response cards show every answer', () => {
    const { hooks } = dashboardHarness(async () => { throw new Error('not used'); });
    const now = '2026-08-15T12:00:00.000Z';
    const recent = '2026-08-15T11:00:00.000Z';
    const surveys = [
      survey(21, 'p-historical', recent, 8),
      survey(22, 'p-new-a', recent, 9, { experience_level: 'new_to_both', purchase_intent_19: 'definitely' }),
      survey(23, 'p-new-b', recent, 7, { experience_level: 'familiar_with_both', purchase_intent_19: 'probably' }),
    ];
    hooks.setRange(1, now);
    const model = hooks.buildViewModel([], surveys, 'all');

    assert.equal(model.surveys.n, 3);
    assert.equal(model.surveys.experience_answered, 2);
    assert.equal(model.surveys.purchase_intent_19_answered, 2);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(model.surveys.experience_dist)), {
      new_to_both: 1,
      gamer_not_trader: 0,
      trader_not_gamer: 0,
      familiar_with_both: 1,
    });
    assert.deepStrictEqual(JSON.parse(JSON.stringify(model.surveys.purchase_intent_19_dist)), {
      definitely: 1,
      probably: 1,
      unsure: 0,
      probably_not: 0,
      definitely_not: 0,
    });
    assert.equal(Object.values(model.surveys.purchase_intent_19_dist).reduce((sum, count) => sum + count, 0), 2);

    const historical = model.surveys.responses.find((row) => row.player_id === 'p-historical');
    assert.equal(historical.experience_level, null);
    assert.equal(historical.purchase_intent_19, null);
    const historicalMarkup = hooks.surveyResponseMarkup(model.raw_surveys.find((row) => row.player_id === 'p-historical'));
    for (const label of ['Q1 · Overall rating', 'Q2 · What hooked you?', 'Q3 · What should improve?', 'Q4 · Would keep playing', 'Q5 · Anything else?', 'Q6 · Prior experience', 'Q7 · Proposed $19 early-access intent', 'Time to complete survey']) {
      assert.match(historicalMarkup, new RegExp(label.replace(/[?$]/g, '\\$&')));
    }
    assert.equal((historicalMarkup.match(/\(not asked\)/g) || []).length, 2);

    const summaryMarkup = hooks.surveySummaryMarkup(model.surveys);
    assert.match(summaryMarkup, /Prior experience · 2 answered · 1 not asked/);
    assert.match(summaryMarkup, /Proposed \$19 early-access intent · 2 answered · 1 not asked/);
    assert.match(summaryMarkup, /Definitely 1 · Probably 1 · Unsure 0 · Probably not 0 · Definitely not 0/);
  });

  await test('entry attribution freezes the earliest tokens and builds a distinct-player cohort funnel', () => {
    const { hooks } = dashboardHarness(async () => { throw new Error('not used'); });
    const now = '2026-08-15T12:00:00.000Z';
    const events = [
      event(31, 'p-a', 'session_start', '2026-08-15T11:40:00.000Z', { build: '370', cohort: 'cohort-late', invite: 'invite-late' }),
      event(32, 'p-a', 'session_start', '2026-08-10T11:05:00.000Z', { build: '369', cohort: 'cohort-alpha', invite: 'invite-shared' }),
      event(33, 'p-a', 'first_trade_started', '2026-08-15T11:10:00.000Z', { build: '370' }),
      event(34, 'p-a', 'beta_completed', '2026-08-15T11:20:00.000Z', { build: '370' }),
      event(35, 'p-b', 'session_start', '2026-08-15T11:02:00.000Z', { build: '370', cohort: 'cohort-alpha', invite: 'invite-shared' }),
      event(36, 'p-b', 'first_trade_started', '2026-08-15T11:15:00.000Z', { build: '370' }),
      event(37, 'p-c', 'session_start', '2026-08-15T11:03:00.000Z', { build: '370', cohort: 'cohort-alpha' }),
      event(38, 'p-unattributed', 'session_start', '2026-08-15T11:01:00.000Z', { build: '370' }),
    ];
    const surveys = [
      survey(31, 'p-a', '2026-08-15T11:50:00.000Z', 9),
      survey(32, 'p-b', '2026-08-15T11:51:00.000Z', 8),
      survey(33, 'p-survey-only', '2026-08-15T11:52:00.000Z', 7),
    ];
    hooks.setRange(1, now);
    const model = hooks.buildViewModel(events, surveys, 'all');

    const playerA = model.players.find((row) => row.player_id === 'p-a');
    assert.equal(playerA.entry_cohort, 'cohort-alpha');
    assert.equal(playerA.entry_invite, 'invite-shared');
    assert.equal(playerA.attributed_at, '2026-08-10T11:05:00.000Z', 'the time filter must not rewrite lifetime entry attribution');
    assert.doesNotMatch(JSON.stringify(model.cohorts), /cohort-late|invite-late/, 'later links must not rewrite entry attribution');
    const surveyOnly = model.players.find((row) => row.player_id === 'p-survey-only');
    assert.equal(surveyOnly.entry_cohort, '(unknown)');
    assert.equal(surveyOnly.entry_invite, '(unknown)');

    const alpha = model.cohorts.rows.find((row) => row.cohort === 'cohort-alpha');
    assert.deepStrictEqual(JSON.parse(JSON.stringify({
      players: alpha.players,
      first_trade_started: alpha.first_trade_started,
      beta_completed: alpha.beta_completed,
      survey_response: alpha.survey_response,
    })), { players: 3, first_trade_started: 2, beta_completed: 1, survey_response: 2 });
    const unknown = model.cohorts.rows.find((row) => row.cohort === '(unknown)');
    assert.deepStrictEqual(JSON.parse(JSON.stringify({
      players: unknown.players,
      first_trade_started: unknown.first_trade_started,
      beta_completed: unknown.beta_completed,
      survey_response: unknown.survey_response,
    })), { players: 2, first_trade_started: 0, beta_completed: 0, survey_response: 1 });
    assert.deepStrictEqual(JSON.parse(JSON.stringify(model.cohorts.duplicate_invites)), [{
      invite: 'invite-shared',
      players: 2,
      player_ids: ['p-a', 'p-b'],
      cohorts: ['cohort-alpha'],
    }]);

    const responseA = model.surveys.responses.find((row) => row.player_id === 'p-a');
    assert.equal(responseA.entry_cohort, 'cohort-alpha');
    assert.equal(responseA.entry_invite, 'invite-shared');
    assert.match(hooks.playerRowMarkup(playerA), /cohort-alpha[\s\S]*invite-shared/);
    assert.match(hooks.surveyResponseMarkup(surveys[0], playerA), /Cohort[\s\S]*cohort-alpha[\s\S]*Invite[\s\S]*invite-shared/);
    assert.match(hooks.cohortRowsMarkup(model.cohorts.rows), /cohort-alpha[\s\S]*invite-shared[\s\S]*2 players/);
    assert.match(hooks.inviteReuseMarkup(model.cohorts.duplicate_invites), /invite-shared[\s\S]*2[\s\S]*p-a, p-b/);
  });

  await test('ordinary p-* dev runs are excluded player-wide from analytics and raw views', () => {
    const { hooks } = dashboardHarness(async () => { throw new Error('not used'); });
    const now = '2026-08-15T12:00:00.000Z';
    const recent = '2026-08-15T11:00:00.000Z';
    const events = [
      event(11, 'p-dev-tagged', 'session_start', recent, { build: '368', dev: 'true' }),
      event(12, 'p-dev-tagged', 'first_trade_started', recent, { build: '368' }),
      event(13, 'p-dev-finish', 'beta_completed', recent, { build: '368', reason: 'DEV' }),
      event(14, 'p-dev-finish', 'session_end', recent, { build: '368', seconds: 3, page: 'game' }),
      event(15, 'QA-dual-signal', 'session_start', recent, { build: '368', dev: 1 }),
      event(16, 'p-real', 'session_start', recent, { build: '368' }),
      event(17, 'p-false-marker', 'session_start', recent, { build: '368', dev: '0' }),
    ];
    const surveys = [
      survey(11, 'p-dev-tagged', recent, 10),
      survey(12, 'p-dev-finish', recent, 10),
      survey(13, 'QA-dual-signal', recent, 10),
      survey(14, 'p-real', recent, 8),
      survey(15, 'p-false-marker', recent, 7),
    ];
    hooks.setRange(1, now);
    const model = hooks.buildViewModel(events, surveys, 'all');
    assert.equal(model.overview.players, 2);
    assert.equal(model.meta.event_count, 2);
    assert.equal(model.meta.survey_count, 2);
    assert.equal(model.meta.excluded_players, 3, 'overlapping prefix/dev reasons count one player');
    assert.equal(model.meta.excluded_events, 5);
    assert.equal(model.meta.excluded_surveys, 3);
    assert.equal(model.meta.excluded_prefix_players, 1);
    assert.equal(model.meta.excluded_dev_players, 2);
    assert.equal(model.meta.excluded_dev_finish_players, 1);
    assert.deepStrictEqual(model.events.map((row) => row.id).sort((a, b) => a - b), [16, 17]);
    assert.deepStrictEqual(model.raw_surveys.map((row) => row.id).sort((a, b) => a - b), [14, 15]);
  });

  await test('page exposes complete server exports, cutover warning, required views, and responsive layout', () => {
    const html = fs.readFileSync(path.join(founderDir, 'beta.html'), 'utf8');
    const css = fs.readFileSync(path.join(founderDir, 'beta.css'), 'utf8');
    const js = fs.readFileSync(dashboardPath, 'utf8');
    for (const view of ['overview', 'funnel', 'players', 'surveys', 'events', 'builds', 'devices', 'crashes']) {
      assert.match(html, new RegExp(`data-view="${view}"`));
    }
    assert.match(html, /Recovered pre-cutover beta events and surveys appear only after their archive counts and hashes are verified/);
    assert.match(html, /Application and account migration/);
    for (const dataset of ['events', 'surveys']) {
      for (const format of ['json', 'csv']) {
        assert.match(html, new RegExp(`dataset=${dataset}&amp;mode=export&amp;format=${format}`));
      }
    }
    assert.match(css, /@media \(max-width: 900px\)/);
    assert.match(css, /@media \(max-width: 620px\)/);
    assert.match(js, /entry-build cohort roster/);
    assert.match(js, /committedRangeDays/);
    assert.match(js, /windowSelect'\)\.value = String\(state\.committedRangeDays\)/);
    assert.match(html, /id="cohortRows"/);
    assert.match(html, /id="inviteReuseWarning"/);
    assert.match(html, /Invite codes are private to this Cloudflare Access-protected dashboard/);
    assert.doesNotMatch(js, /supabase\.(auth|from)|beta-data\.json|localStorage/);
  });

  if (!process.exitCode) process.stdout.write(`\n${passed} founder dashboard tests passed.\n`);
})();
