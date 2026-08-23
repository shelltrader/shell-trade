#!/usr/bin/env node
'use strict';

/* Executable no-loss tests for the legacy ContentLog -> Cloudflare adapter handoff. */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const game = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');
const start = game.indexOf('window.ContentLog = (function () {');
const end = game.indexOf('\n})();', start);
assert.ok(start >= 0 && end > start, 'ContentLog block missing');
const source = game.slice(start, end + '\n})();'.length);

function storage(seed) {
  const values = new Map(Object.entries(seed || {}).map(([key, value]) => [key, String(value)]));
  const removed = [];
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { removed.push(String(key)); values.delete(String(key)); },
    snapshot() { return Object.fromEntries(values); },
    removed,
  };
}

function harness(queue, result) {
  const calls = [];
  const localStorage = storage({
    cq_pid: 'p-keep',
    cq_player_v1: JSON.stringify({ shells: 77, level: 2, xp: 9 }),
    shellTradeJournal_v1: JSON.stringify([{ id: 3, result: 'win' }]),
    cq_content_queue_v1: JSON.stringify(queue),
  });
  const context = {
    console, Date, Math, JSON, Promise, localStorage,
    navigator: { onLine: true },
    document: { visibilityState: 'visible', addEventListener() {} },
    addEventListener() {},
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; },
    CQCloudData: {
      content: {
        async pushBatch(table, rows) {
          calls.push({ table, rows: JSON.parse(JSON.stringify(rows)) });
          return typeof result === 'function' ? result(table, rows) : result;
        },
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'ContentLog.inline.js' });
  return { context, localStorage, calls };
}

function queued(row, table = 'content_events', qid = 'q-legacy-1') {
  return [{ qid, table, row, tries: 0 }];
}

const eventRow = {
  event_id: 'event-1', event_type: 'trade_win', ts: '2026-08-23T00:00:00.000Z',
  payload: {}, educational_metadata: {}, content_flags: {}, significance_score: 50,
};

const tests = [
  ['unconfirmed and non-durable adapter failure preserves exact legacy row and save keys', async () => {
    const original = queued(eventRow);
    const h = harness(original, { ok: false, queued: false, code: 'queue_full' });
    await h.context.ContentLog.flushNow();
    const pending = JSON.parse(h.localStorage.getItem('cq_content_queue_v1'));
    assert.equal(pending.length, 1);
    assert.equal(pending[0].qid, 'q-legacy-1');
    assert.deepEqual(pending[0].row, eventRow);
    assert.equal(pending[0].tries, 1);
    assert.equal(h.localStorage.getItem('cq_pid'), 'p-keep');
    assert.match(h.localStorage.getItem('cq_player_v1'), /"shells":77/);
    assert.match(h.localStorage.getItem('shellTradeJournal_v1'), /"id":3/);
    assert.ok(!h.localStorage.removed.includes('cq_player_v1'));
  }],

  ['durable adapter acceptance removes only the handed-off qid', async () => {
    const second = { ...eventRow, event_id: 'event-2' };
    const h = harness([
      ...queued(eventRow, 'content_events', 'q-first'),
      ...queued(second, 'content_events', 'q-second'),
    ], { ok: false, queued: true, code: 'cloud_unconfirmed' });
    await h.context.ContentLog.flushNow();
    assert.equal(h.localStorage.getItem('cq_content_queue_v1'), '[]',
      'both qids in the exact accepted batch may leave the legacy queue');
    assert.deepEqual(h.calls[0].rows.map(row => row.event_id), ['event-1', 'event-2']);
  }],

  ['older brief/export/generated rows gain deterministic retry keys without remapping qids', async () => {
    const cases = [
      ['content_briefs', { event_id: 'event-9', platforms: [], priority: 1 }, 'brief_key', 'brief:event-9'],
      ['content_exports', { platform: 'general', event_count: 2, filter: {} }, 'export_key', 'export:q-old'],
      ['content_generated', { platform: 'general', body: 'x', meta: {}, status: 'draft' }, 'generated_key', 'generated:q-old'],
    ];
    for (const [table, row, key, expected] of cases) {
      const h = harness(queued(row, table, 'q-old'), { ok: true, queued: false });
      await h.context.ContentLog.flushNow();
      assert.equal(h.calls[0].rows[0][key], expected, `${table} stable key`);
      assert.equal(h.localStorage.getItem('cq_content_queue_v1'), '[]');
    }
  }],
];

(async () => {
  let failed = 0;
  for (const [name, test] of tests) {
    try { await test(); console.log(`\u2713 ${name}`); }
    catch (error) { failed += 1; console.error(`\u2717 ${name}`); console.error(error.stack || String(error)); }
  }
  console.log(`\n${tests.length - failed}/${tests.length} Cloudflare game-content tests passed`);
  process.exitCode = failed ? 1 : 0;
})();
