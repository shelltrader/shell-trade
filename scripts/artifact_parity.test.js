#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const CHECKER = path.join(__dirname, 'artifact_parity.js');
const BASE = [
  '<meta name="cq-build" content="build 359" data-built-at="2026-08-11T00:00:00Z">',
  "<script>const BUILD_TAG = 'build 359';</script>",
].join('\n');

function runFixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-artifact-parity-'));
  try {
    for (const [relative, contents] of Object.entries(files)) {
      const target = path.join(root, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents);
    }
    const run = cp.spawnSync(process.execPath, [CHECKER, root], {
      encoding: 'utf8',
    });
    return {
      status: run.status,
      output: `${run.stdout}${run.stderr}`,
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const tests = [
  ['identical artifacts pass', () => {
    const result = runFixture({
      'chart-quest.html': BASE,
      'index.html': BASE,
      'website/game.html': BASE,
    });
    assert.equal(result.status, 0);
    assert.match(result.output, /PASS/);
  }],
  ['root mirror mismatch fails and names index.html', () => {
    const result = runFixture({
      'chart-quest.html': BASE,
      'index.html': `${BASE}\n<!-- root-only byte drift -->`,
      'website/game.html': BASE,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /index\.html differs from chart-quest\.html/);
  }],
  ['site mismatch with unchanged metadata fails and names website/game.html', () => {
    const result = runFixture({
      'chart-quest.html': BASE,
      'index.html': BASE,
      'website/game.html': `${BASE}\n<!-- site-only byte drift; metadata above is unchanged -->`,
    });
    assert.notEqual(result.status, 0);
    assert.match(
      result.output,
      /website\/game\.html differs from chart-quest\.html/,
    );
  }],
  ['missing root mirror fails and names index.html', () => {
    const result = runFixture({
      'chart-quest.html': BASE,
      'website/game.html': BASE,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /missing: index\.html/);
  }],
  ['missing site artifact fails and names website/game.html', () => {
    const result = runFixture({
      'chart-quest.html': BASE,
      'index.html': BASE,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /missing: website\/game\.html/);
  }],
];

let failed = 0;
for (const [name, test] of tests) {
  try {
    test();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(String(e && e.stack || e));
  }
}

console.log(`\n${tests.length - failed}/${tests.length} artifact parity tests passed`);
process.exitCode = failed ? 1 : 0;
