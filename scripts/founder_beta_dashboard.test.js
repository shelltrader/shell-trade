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

function survey(id, player, createdAt, rating = 9) {
  return {
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

  await test('page exposes complete server exports, cutover warning, required views, and responsive layout', () => {
    const html = fs.readFileSync(path.join(founderDir, 'beta.html'), 'utf8');
    const css = fs.readFileSync(path.join(founderDir, 'beta.css'), 'utf8');
    const js = fs.readFileSync(dashboardPath, 'utf8');
    for (const view of ['overview', 'funnel', 'players', 'surveys', 'events', 'builds', 'devices', 'crashes']) {
      assert.match(html, new RegExp(`data-view="${view}"`));
    }
    assert.match(html, /Build 367 and earlier Supabase test history is intentionally not merged/);
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
    assert.doesNotMatch(js, /supabase\.(auth|from)|beta-data\.json|localStorage/);
  });

  if (!process.exitCode) process.stdout.write(`\n${passed} founder dashboard tests passed.\n`);
})();
