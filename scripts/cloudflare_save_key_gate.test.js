#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const gate = require('./cloudflare_save_key_gate.js');

const ROOT = path.resolve(__dirname, '..');
const current = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');
const prior = childProcess.spawnSync('git', ['show', 'HEAD:chart-quest.html'], {
  cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});
assert.equal(prior.status, 0, prior.stderr || 'could not read HEAD game artifact');
const tests = [
  ['actual checkout is either unchanged or exactly the approved Build 373 continuity delta', () => {
    const result = gate.check(prior.stdout, current, 373);
    if (result.changed) {
      assert.equal(result.approved, true, result.detail);
      assert.deepEqual(result.added, gate.APPROVED_ADDITIONS);
    } else {
      assert(gate.APPROVED_ADDITIONS.every(key => gate.keys(current).includes(key)));
    }
    assert.deepEqual(result.removed, []);
  }],
  ['an unapproved third key fails the exception', () => {
    const result = gate.check(prior.stdout, current + "\nlocalStorage.setItem('cq_unapproved_v1', 'x');", 373);
    assert.equal(result.approved, false);
    assert(result.added.includes('cq_unapproved_v1'));
  }],
  ['removing or renaming any established key fails the exception', () => {
    const established = gate.keys(prior.stdout).find(key => prior.stdout.includes(key));
    assert(established, 'fixture needs an established key');
    const without = current.split(established).join('cq_replaced_key_v1');
    const result = gate.check(prior.stdout, without, 373);
    assert.equal(result.approved, false);
    assert(result.removed.includes(established));
  }],
  ['the exact Build 373 and continuity-owner markers are mandatory', () => {
    assert.equal(gate.check(prior.stdout, current, 372).approved, false);
    assert.equal(gate.check(prior.stdout, current.replace('build 373 - BETA FEEDBACK RECOVERY.', 'build 373 - other.'), 373).approved, false);
    assert.equal(gate.check(prior.stdout, current.replace('/* BETA_FLOW_CONTINUITY_V1:BEGIN', 'missing-continuity-marker'), 373).approved, false);
    assert.equal(gate.check(prior.stdout, current.replace("var KEY = 'cq_beta_flow_v1';", "var KEY = 'missing';"), 373).approved, false);
  }],
];

let failed = 0;
for (const [name, test] of tests) {
  try { test(); console.log('\u2713 ' + name); }
  catch (error) { failed += 1; console.error('\u2717 ' + name); console.error(error.stack || String(error)); }
}
console.log(`\n${tests.length - failed}/${tests.length} Cloudflare save-key gate tests passed`);
process.exitCode = failed ? 1 : 0;
