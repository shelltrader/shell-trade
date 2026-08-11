#!/usr/bin/env node
'use strict';

/*
 * Fail-closed byte-parity check for the three canonical ChartQuest game artifacts.
 * The optional root argument exists so tests can use disposable fixtures without
 * reading or modifying the real game files.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ARTIFACTS = Object.freeze([
  'chart-quest.html',
  'index.html',
  'website/game.html',
]);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function checkArtifactParity(root = path.resolve(__dirname, '..')) {
  const hashes = new Map();
  const unreadable = [];

  for (const artifact of ARTIFACTS) {
    try {
      hashes.set(artifact, sha256(path.join(root, artifact)));
    } catch (e) {
      unreadable.push({ artifact, code: e && e.code });
    }
  }

  if (unreadable.length) {
    const missing = unreadable
      .filter(item => item.code === 'ENOENT')
      .map(item => item.artifact);
    const other = unreadable
      .filter(item => item.code !== 'ENOENT')
      .map(item => item.artifact);
    const problems = [];
    if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
    if (other.length) problems.push(`unreadable: ${other.join(', ')}`);
    return {
      ok: false,
      detail: `artifact parity failed — ${problems.join(' · ')}`,
      missing,
      mismatched: [],
    };
  }

  const source = ARTIFACTS[0];
  const mismatched = ARTIFACTS.slice(1)
    .filter(artifact => hashes.get(artifact) !== hashes.get(source));
  if (mismatched.length) {
    return {
      ok: false,
      detail: `artifact parity failed — ${mismatched.map(artifact => `${artifact} differs from ${source}`).join(' · ')}`,
      missing: [],
      mismatched,
    };
  }

  return {
    ok: true,
    detail: `sha256(${ARTIFACTS.join(') == sha256(')})`,
    missing: [],
    mismatched: [],
  };
}

if (require.main === module) {
  const root = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '..');
  const result = checkArtifactParity(root);
  const output = `${result.ok ? 'PASS' : 'FAIL'} — ${result.detail}`;
  (result.ok ? console.log : console.error)(output);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { ARTIFACTS, checkArtifactParity };
