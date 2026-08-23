#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const founderDir = path.join(ROOT, 'website', 'founder');
const dashboardPath = path.join(founderDir, 'beta.js');
const modelPath = path.join(founderDir, 'app-model.js');
const AppModel = require(modelPath);

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
  const window = {
    BetaModel: require(path.join(founderDir, 'beta-model.js')),
    CQAppDataModel: AppModel,
    __CQ_FOUNDER_TEST__: true,
    location: { origin: 'https://playchartquest.com' },
  };
  const context = vm.createContext({
    window, fetch: fetchImpl, URL, Response, Intl, Date, JSON, Math, Number,
    String, Object, Array, Promise, Error, console,
  });
  vm.runInContext(fs.readFileSync(dashboardPath, 'utf8'), context, { filename: dashboardPath });
  return { hooks: window.CQFounderDashboardTest, context };
}

function emptyRows() {
  const result = {};
  Object.keys(AppModel.DATASET_DESCRIPTIONS).forEach((name) => { result[name] = []; });
  return result;
}

function appSnapshot(rows, overrides = {}) {
  const datasets = Object.keys(AppModel.DATASET_DESCRIPTIONS);
  const counts = Object.fromEntries(datasets.map((name) => [name, rows[name].length]));
  return {
    ok: true,
    snapshot: Object.assign({
      version: 1,
      token: 'a'.repeat(64),
      datasets,
      counts,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      rows,
    }, overrides),
  };
}

function betaFixture() {
  return {
    players_total: 10,
    meta: { event_count: 74 },
    overview: { crash_players: 2, crash_events: 3 },
    funnel: [
      { key: 'landing', label: 'Landing page', players: 10, drop_players: 0, drop_pct: 0 },
      { key: 'trade', label: 'First trade', players: 6, drop_players: 4, drop_pct: 40 },
      { key: 'movement', label: 'Movement', gating: false, players: 2, drop_players: null, drop_pct: null },
      { key: 'completed', label: 'Beta completed', players: 5, drop_players: 1, drop_pct: 17 },
    ],
    raw_surveys: [
      { player_id: 'p-1', q3_improvement: 'The music volume and sound need work.', q5_anything: '' },
      { player_id: 'p-2', q3_improvement: 'Please improve the music during trades.', q5_anything: '' },
      { player_id: 'p-3', q3_improvement: 'Controls felt good.', q5_anything: '' },
      { player_id: 'p-4', q3_improvement: '', q5_anything: '' },
      { player_id: 'p-5', q3_improvement: '', q5_anything: '' },
    ],
    surveys: { continue_dist: { immediately: 3, later: 1, not_interested: 1 } },
  };
}

(async () => {
  await test('protected app loader accepts one coherent canonical snapshot', async () => {
    const rows = emptyRows();
    rows.identities = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
    const calls = [];
    const { hooks } = dashboardHarness(async (input) => {
      const url = new URL(input);
      calls.push(url);
      assert.equal(url.pathname, '/founder/api/app-data');
      assert.equal(url.searchParams.get('dataset'), 'snapshot');
      assert.equal(url.searchParams.has('cursor'), false);
      return jsonResponse(appSnapshot(rows));
    });
    const result = await hooks.fetchAppSnapshot();
    assert.equal(hooks.appApiRoot, '/founder/api/app-data');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(result.rows.identities.map((row) => row.id))), ['u1', 'u2', 'u3']);
    assert.equal(Object.keys(result.rows).length, Object.keys(AppModel.DATASET_DESCRIPTIONS).length);
    assert.equal(result.snapshotToken, 'a'.repeat(64));
    assert.equal(calls.length, 1);
  });

  await test('app loader fails closed on snapshot count, token and catalog mismatches', async () => {
    const rows = emptyRows();
    rows.profiles = [{ user_id: 'u1' }];
    const mismatch = appSnapshot(rows);
    mismatch.snapshot.counts.profiles = 2;
    const badCount = dashboardHarness(async () => jsonResponse(mismatch));
    await assert.rejects(badCount.hooks.fetchAppSnapshot(), /integrity check/);

    const badToken = dashboardHarness(async () => jsonResponse(appSnapshot(rows, { token: 'not-a-token' })));
    await assert.rejects(badToken.hooks.fetchAppSnapshot(), /wrong shape/);

    const datasets = Object.keys(AppModel.DATASET_DESCRIPTIONS).slice().reverse();
    const badCatalog = dashboardHarness(async () => jsonResponse(appSnapshot(rows, { datasets })));
    await assert.rejects(badCatalog.hooks.fetchAppSnapshot(), /catalog does not match/);
  });

  await test('mastery analysis uses one newest canonical score per owner and requires three owners', () => {
    const all = emptyRows();
    all.mastery = [
      { owner_key: 'u1', category_raw: 'Trend', category_normalized: 'trend', score: 40, source_updated_at: '2026-08-22T00:00:00Z', updated_at: '2026-08-22T01:00:00Z' },
      { owner_key: 'u1', category_raw: 'trend', category_normalized: 'trend', score: 90, source_updated_at: '2026-08-20T00:00:00Z', updated_at: '2026-08-23T00:00:00Z' },
      { owner_key: 'u2', category_raw: 'trend', category_normalized: 'trend', score: 50, source_updated_at: '2026-08-22T00:00:00Z' },
      { owner_key: 'u2', category_raw: 'Trend', category_normalized: 'trend', score: 10, source_updated_at: '2026-08-19T00:00:00Z' },
    ];
    var twoOwners = AppModel.build(all, { counts: {} }, betaFixture());
    assert.equal(twoOwners.progress.mastery_rows, 4);
    assert.equal(twoOwners.progress.canonical_mastery_rows, 2);
    assert.equal(twoOwners.progress.mastery_categories[0].players, 2);
    assert.equal(twoOwners.progress.mastery_categories[0].average_score, 45);
    assert.equal(twoOwners.insights.recommendations.some((row) => /lowest measured skill/.test(row.title)), false);

    all.mastery.push({ owner_key: 'u3', category_raw: 'trend', category_normalized: 'trend', score: 30, source_updated_at: '2026-08-22T00:00:00Z' });
    var threeOwners = AppModel.build(all, { counts: {} }, betaFixture());
    var masteryRecommendation = threeOwners.insights.recommendations.find((row) => /lowest measured skill/.test(row.title));
    assert.equal(threeOwners.progress.canonical_mastery_rows, 3);
    assert.equal(threeOwners.progress.mastery_categories[0].players, 3);
    assert.equal(threeOwners.progress.mastery_categories[0].average_score, 40);
    assert.equal(masteryRecommendation.sample_n, 3);
    assert.match(masteryRecommendation.why, /3 measured players/);
  });

  await test('model covers accounts, progress, journals, quality, content and reconciled migration', () => {
    const all = emptyRows();
    all.identities = [
      { id: 'u1', email_original: 'one@example.com', status: 'active', source_provider: 'cloudflare' },
      { id: 'u2', email_original: 'two@example.com', status: 'pending_claim', source_provider: 'supabase' },
    ];
    all.profiles = [{ user_id: 'u1', shells: 25, player_level: 2, xp: 80 }];
    all.streaks = [{ user_id: 'u1', streak: 3, best_streak: 5 }];
    all.mastery = [
      { owner_key: 'u1', category_raw: 'Trend', category_normalized: 'trend', score: 50, source_updated_at: '2026-08-22T00:00:00Z' },
      { owner_key: 'u1', category_raw: 'trend', category_normalized: 'trend', score: 90, source_updated_at: '2026-08-20T00:00:00Z' },
      { owner_key: 'u2', category_normalized: 'trend', score: 60 },
      { owner_key: 'u3', category_normalized: 'trend', score: 40 },
    ];
    all.journal_versions = [{ user_id: 'u1', version: 2, created_at: '2026-08-20T10:00:00Z' }];
    all.journal_trades = [{ user_id: 'u1', trade_id: 't1', trade_data: { note: 'private' }, deleted_at: null }];
    all.journal_notes = [{ user_id: 'u1', note_id: 'n1', note_data: { text: 'private' }, deleted_at: '2026-08-21T00:00:00Z' }];
    all.journal_changes = [{ user_id: 'u1', operation: 'delete' }];
    all.bugs = [{ status: 'open', player_id: 'p-1', message: 'Button froze' }];
    all.visits = [{ player_id: 'p-1', path: '/play', device: 'mobile' }];
    all.visit_days = [{ visit_count: 1, path: '/play' }];
    all.content_events = [{ event_type: 'boss_win', processed_status: 'new', ts: '2026-08-20T00:00:00Z' }];
    all.content_briefs = [{ status: 'proposed' }];
    all.outbox = [{ status: 'pending' }];
    all.migration_runs = [{ run_id: 'run-1', dataset: 'profiles', status: 'reconciled', started_at: '2026-08-20T00:00:00Z' }];
    all.migration_ledger = [{ status: 'imported' }];
    all.reconciliation = [{ run_id: 'run-1', dataset: 'profiles', matched: 1, checked_at: '2026-08-20T01:00:00Z' }];

    const model = AppModel.build(all, { counts: Object.fromEntries(Object.keys(all).map((name) => [name, all[name].length])) }, betaFixture());
    assert.equal(model.accounts.identities, 2);
    assert.equal(model.accounts.profile_coverage_pct, 50);
    assert.equal(model.progress.best_streak, 5);
    assert.equal(model.progress.mastery_categories[0].average_score, 50);
    assert.equal(model.progress.mastery_categories[0].players, 3);
    assert.equal(model.progress.mastery_rows, 4);
    assert.equal(model.progress.canonical_mastery_rows, 3);
    assert.equal(model.journal.active_trades, 1);
    assert.equal(model.journal.deleted_notes, 1);
    assert.equal(model.quality.open_bugs, 1);
    assert.equal(model.quality.rollup_matches_raw, true);
    assert.equal(model.content.counts.content_events, 1);
    assert.equal(model.migration.status, 'stored_runs_reconciled');
    assert.match(model.insights.caveats[3], /source-export completeness/);
    assert.equal(model.catalog.length, Object.keys(AppModel.DATASET_DESCRIPTIONS).length);
    all.reconciliation = [];
    assert.equal(AppModel.build(all, { counts: {} }, betaFixture()).migration.status, 'in_progress', 'a reconciled label without a matching check must not imply parity');
  });

  await test('insights cite measured funnel, crash and survey evidence with sample caveats', () => {
    const all = emptyRows();
    const report = AppModel.build(all, { counts: {} }, betaFixture()).insights;
    assert.match(report.recommendations[0].evidence, /3 crash events/);
    assert.ok(report.recommendations.some((row) => /40% drop into First trade/.test(row.evidence)));
    const audio = report.themes.find((row) => row.key === 'audio');
    assert.equal(audio.mentions, 2);
    assert.equal(audio.responses, 5);
    assert.match(audio.excerpts[0].excerpt, /music/i);
    assert.ok(report.caveats.some((line) => /keyword matches/.test(line)));
    assert.ok(report.caveats.some((line) => /not yet fully reconciled/.test(line)));
  });

  await test('empty data produces only a collection next step and never invents player findings', () => {
    const report = AppModel.build(emptyRows(), { counts: {} }, {
      players_total: 0, meta: { event_count: 0 }, overview: { crash_players: 0, crash_events: 0 },
      funnel: [], raw_surveys: [], surveys: { continue_dist: {} },
    }).insights;
    assert.equal(report.themes.length, 0);
    assert.equal(report.recommendations.length, 1);
    assert.match(report.recommendations[0].title, /Collect the first verified Cloudflare cohort/);
    assert.equal(report.recommendations[0].confidence.key, 'none');
  });

  await test('page masks private data by default and exposes every app-data area and export', () => {
    const html = fs.readFileSync(path.join(founderDir, 'beta.html'), 'utf8');
    const js = fs.readFileSync(dashboardPath, 'utf8');
    const css = fs.readFileSync(path.join(founderDir, 'beta.css'), 'utf8');
    for (const view of ['insights', 'accounts', 'progress', 'journals', 'quality', 'content', 'migration', 'catalog']) {
      assert.match(html, new RegExp(`data-view="${view}"`));
    }
    assert.match(html, /id="journalDetails" hidden/);
    assert.match(html, /Reveal account emails/);
    assert.match(html, /Show private journal entries/);
    assert.match(js, /state\.revealEmails \? \(email \|\| 'Not stored'\) : maskEmail\(email\)/);
    assert.match(js, /mode=export&format=/);
    assert.doesNotMatch(js, /supabase\.(auth|from)|supabase\.co|openai|anthropic|localStorage/);
    assert.match(css, /@media \(max-width: 620px\)/);
  });

  if (!process.exitCode) process.stdout.write(`\n${passed} founder all-data dashboard tests passed.\n`);
})();
