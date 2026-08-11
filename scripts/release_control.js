#!/usr/bin/env node
'use strict';

/*
 * ChartQuest release-control boundary.
 *
 * This script never deploys or pushes.  It creates and verifies the repository-local
 * release context that must exist before a Release Manager may use an external production
 * path.  The pre-push hook calls `gate --from-active-lock` automatically for any refspec
 * targeting origin/main.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RELEASES_DIR = path.join(ROOT, '.chartquest', 'releases');
const ALLOWED_BRANCH = 'main';
const ARTIFACTS = ['chart-quest.html', 'index.html', 'website/game.html'];

class ReleaseError extends Error {}

function fail(message) {
  throw new ReleaseError(message);
}

function git(args, options = {}) {
  const result = cp.spawnSync('git', args, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    const detail = String(result.stderr || result.error || '').trim();
    fail(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return String(result.stdout || '').trim();
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function normField(value) {
  return String(value || '').replace(/[\*`]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function useful(value) {
  return value && !/^\[.*\]$/.test(value) && !/^(REQUIRED|UNKNOWN|N\/A)$/i.test(value);
}

function productionUrl(value, source) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    fail(`${source} must be an absolute http(s) origin URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password ||
      parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
    fail(`${source} must be an absolute http(s) origin URL`);
  }
  return parsed.origin;
}

function parseMarkdownTable(file) {
  if (!fs.existsSync(file)) fail(`manifest/lock does not exist: ${file}`);
  const fields = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 2 || /^-+$/.test(cells[0].replace(/\s/g, ''))) continue;
    const key = normField(cells[0]);
    const value = cells[1];
    if (key && value && key !== 'FIELD' && key !== 'VALUE') fields.set(key, value);
  }
  return fields;
}

function get(fields, name, source) {
  const value = fields.get(normField(name));
  if (!useful(value)) fail(`${source} is missing a usable ${name} field`);
  return value.trim();
}

function resolveManifest(input) {
  const file = path.resolve(ROOT, input);
  const relative = path.relative(RELEASES_DIR, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('release manifest must be located under .chartquest/releases/ in this worktree');
  }
  if (!fs.existsSync(file)) fail(`release manifest does not exist: ${file}`);
  return file;
}

function commonDir() {
  let value = git(['rev-parse', '--path-format=absolute', '--git-common-dir']);
  if (!path.isAbsolute(value)) value = path.resolve(ROOT, value);
  return value;
}

function lockPath() {
  return path.join(commonDir(), 'chartquest-release-lock', 'RELEASE_LOCK.md');
}

function lockDir() {
  return path.dirname(lockPath());
}

function currentBranch() {
  return git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
}

function currentCommit() {
  return git(['rev-parse', 'HEAD']);
}

function buildLabel(text, source) {
  const match = text.match(/BUILD_TAG\s*=\s*['"](build\s+\d+)\b/);
  if (!match) fail(`${source} does not contain a valid BUILD_TAG`);
  return match[1];
}

function cqBuildStamp(text, source) {
  const match = text.match(/<meta\s+name=["']cq-build["']\s+content=["']([^"']+)["']\s+data-built-at=["']([^"']+)["']\s*>/i);
  if (!match) fail(`${source} does not contain a cq-build stamp`);
  const content = match[1].trim();
  const builtAt = match[2].trim();
  if (!/^[0-9a-f]{7,64}$/i.test(content) || /^unstamped$/i.test(content)) {
    fail(`${source} has an invalid cq-build content value`);
  }
  if (Number.isNaN(Date.parse(builtAt))) fail(`${source} has an invalid cq-build data-built-at value`);
  return { content, builtAt };
}

function websiteTreeHash() {
  const files = git(['ls-files', '-z', '--', 'website']).split('\0').filter(Boolean).sort();
  if (!files.length) fail('no tracked website artifacts are available for the release candidate');
  const digest = crypto.createHash('sha256');
  for (const file of files) {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      fail(`tracked website artifact is missing from disk: ${file}`);
    }
    digest.update(file).update('\0').update(sha256(absolute)).update('\n');
  }
  return digest.digest('hex');
}

function candidateIdentity() {
  const contents = {};
  const hashes = {};
  const builds = {};
  const stamps = {};
  for (const artifact of ARTIFACTS) {
    const absolute = path.join(ROOT, artifact);
    if (!fs.existsSync(absolute)) fail(`required artifact is missing: ${artifact}`);
    contents[artifact] = fs.readFileSync(absolute, 'utf8');
    hashes[artifact] = sha256(absolute);
    builds[artifact] = buildLabel(contents[artifact], artifact);
    stamps[artifact] = cqBuildStamp(contents[artifact], artifact);
  }
  const uniqueHashes = new Set(Object.values(hashes));
  const uniqueBuilds = new Set(Object.values(builds));
  const uniqueStamps = new Set(Object.values(stamps).map(value => `${value.content}|${value.builtAt}`));
  if (uniqueHashes.size !== 1) fail('source, mirror, and website/game.html content hashes differ');
  if (uniqueBuilds.size !== 1) fail('source, mirror, and website/game.html BUILD_TAG values differ');
  if (uniqueStamps.size !== 1) fail('source, mirror, and website/game.html cq-build stamps differ');
  return {
    build: builds['chart-quest.html'],
    sourceHash: hashes['chart-quest.html'],
    mirrorHash: hashes['index.html'],
    gameHash: hashes['website/game.html'],
    websiteTreeHash: websiteTreeHash(),
    stamp: stamps['chart-quest.html'],
  };
}

function assertManifestCore(manifest) {
  const fields = parseMarkdownTable(manifest);
  const core = {
    releaseId: get(fields, 'Release ID', 'manifest'),
    build: get(fields, 'BUILD', 'manifest'),
    commit: get(fields, 'GIT COMMIT', 'manifest'),
    branch: get(fields, 'BRANCH', 'manifest'),
    owner: get(fields, 'RELEASE OWNER', 'manifest'),
    startedAt: get(fields, 'RELEASE START', 'manifest'),
    productionUrl: get(fields, 'PRODUCTION URL', 'manifest'),
    sourceHash: get(fields, 'SOURCE SHA256', 'manifest'),
    mirrorHash: get(fields, 'MIRROR SHA256', 'manifest'),
    gameHash: get(fields, 'WEBSITE GAME SHA256', 'manifest'),
    websiteTreeHash: get(fields, 'WEBSITE TREE SHA256', 'manifest'),
    stampContent: get(fields, 'CQ-BUILD CONTENT', 'manifest'),
    stampBuiltAt: get(fields, 'CQ-BUILD BUILT-AT', 'manifest'),
  };
  if (!/^build\s+\d+$/i.test(core.build)) fail('manifest BUILD must be formatted as “build <number>”');
  if (!/^[0-9a-f]{40}$/i.test(core.commit)) fail('manifest GIT COMMIT must be a full 40-character SHA');
  for (const name of ['sourceHash', 'mirrorHash', 'gameHash', 'websiteTreeHash']) {
    if (!/^[0-9a-f]{64}$/i.test(core[name])) fail(`manifest ${name} must be a SHA-256 hash`);
  }
  if (!/^[0-9a-f]{7,64}$/i.test(core.stampContent)) fail('manifest CQ-BUILD CONTENT is invalid');
  if (Number.isNaN(Date.parse(core.stampBuiltAt))) fail('manifest CQ-BUILD BUILT-AT is invalid');
  if (Number.isNaN(Date.parse(core.startedAt))) fail('manifest RELEASE START is invalid');
  core.productionUrl = productionUrl(core.productionUrl, 'manifest PRODUCTION URL');
  if (core.branch !== ALLOWED_BRANCH) fail(`manifest BRANCH must be ${ALLOWED_BRANCH}`);
  if (!/release manager/i.test(core.owner)) fail('manifest RELEASE OWNER must identify the Release Manager role');
  return core;
}

function assertOnlyManifestIsUncommitted(manifest) {
  const relative = path.relative(ROOT, manifest).split(path.sep).join('/');
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (!status) return;
  const allowed = `?? ${relative}`;
  if (status.trim() !== allowed) {
    fail(`release candidate working tree is not clean (only its untracked manifest may remain): ${status.split('\n').join(' | ')}`);
  }
}

function assertLock(manifest, identity) {
  const file = lockPath();
  const fields = parseMarkdownTable(file);
  const releaseId = get(fields, 'Release ID', 'active release lock');
  const build = get(fields, 'Intended Build', 'active release lock');
  const commit = get(fields, 'Intended Commit', 'active release lock');
  const branch = get(fields, 'Intended Branch', 'active release lock');
  const intendedProductionUrl = get(fields, 'Intended Production URL', 'active release lock');
  const status = get(fields, 'Status', 'active release lock');
  const declaredManifest = get(fields, 'Manifest', 'active release lock');
  const manifestFields = assertManifestCore(manifest);
  if (releaseId !== manifestFields.releaseId) fail('active release lock belongs to a different release ID');
  if (build !== manifestFields.build || build !== identity.build) fail('active release lock intended build does not match the candidate');
  if (commit.toLowerCase() !== manifestFields.commit.toLowerCase()) fail('active release lock intended commit does not match the manifest');
  if (branch !== manifestFields.branch) fail('active release lock intended branch does not match the manifest');
  if (productionUrl(intendedProductionUrl, 'active release lock Intended Production URL') !== manifestFields.productionUrl) {
    fail('active release lock intended production URL does not match the manifest');
  }
  if (path.resolve(declaredManifest) !== manifest) fail('active release lock references a different manifest');
  if (!['PREPARING', 'DEPLOYING', 'VERIFYING'].includes(status.toUpperCase())) {
    fail(`active release lock has non-active status ${status}`);
  }
  return manifestFields;
}

function assertTrackedCandidateArtifacts() {
  for (const artifact of ARTIFACTS) git(['ls-files', '--error-unmatch', '--', artifact]);
}

function runExistingVerification() {
  const result = cp.spawnSync(process.execPath, ['scripts/verify.js'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0) fail('existing scripts/verify.js regression gate did not pass');
}

function acquire(manifest) {
  const core = assertManifestCore(manifest);
  const directory = lockDir();
  try {
    fs.mkdirSync(directory, { recursive: false, mode: 0o700 });
  } catch (error) {
    if (error && error.code === 'EEXIST') fail(`ACTIVE RELEASE LOCK DETECTED: ${directory}`);
    throw error;
  }
  const startedAt = new Date().toISOString();
  const contents = [
    '# ACTIVE CHARTQUEST RELEASE LOCK',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Release ID | ${core.releaseId} |`,
    `| Build | ${core.build} |`,
    `| Commit | ${core.commit} |`,
    '| Owner | Release Manager |',
    `| Started At | ${startedAt} |`,
    '| Status | PREPARING |',
    '| Purpose | Candidate verification only; this lock does not deploy. |',
    `| Manifest | ${manifest} |`,
    '',
    '## Intended production identity',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Intended Branch | ${core.branch} |`,
    `| Intended Build | ${core.build} |`,
    `| Intended Commit | ${core.commit} |`,
    `| Intended Production URL | ${core.productionUrl} |`,
    `| Intended Website Game SHA256 | ${core.gameHash} |`,
    '',
    'This lock was created atomically by scripts/release_control.js. Do not remove it automatically.',
    '',
  ].join('\n');
  fs.writeFileSync(lockPath(), contents, { encoding: 'utf8', mode: 0o600 });
  console.log(`RELEASE LOCK ACQUIRED: ${core.releaseId}`);
  console.log(`  lock     ${lockPath()}`);
  console.log(`  manifest ${manifest}`);
}

function gate(manifest) {
  if (currentBranch() !== ALLOWED_BRANCH) fail(`release gate must run from ${ALLOWED_BRANCH}`);
  assertOnlyManifestIsUncommitted(manifest);
  assertTrackedCandidateArtifacts();
  const identity = candidateIdentity();
  const core = assertLock(manifest, identity);
  if (currentCommit().toLowerCase() !== core.commit.toLowerCase()) fail('CURRENT COMMIT != INTENDED COMMIT');
  if (identity.build !== core.build) fail('CURRENT BUILD != INTENDED BUILD');
  const comparisons = [
    ['SOURCE SHA256', core.sourceHash, identity.sourceHash],
    ['MIRROR SHA256', core.mirrorHash, identity.mirrorHash],
    ['WEBSITE GAME SHA256', core.gameHash, identity.gameHash],
    ['WEBSITE TREE SHA256', core.websiteTreeHash, identity.websiteTreeHash],
    ['CQ-BUILD CONTENT', core.stampContent, identity.stamp.content],
    ['CQ-BUILD BUILT-AT', core.stampBuiltAt, identity.stamp.builtAt],
  ];
  for (const [label, expected, actual] of comparisons) {
    if (expected !== actual) fail(`${label} does not match the release manifest`);
  }
  runExistingVerification();
  console.log('\nRELEASE GATE: PASS');
  console.log(`  release  ${core.releaseId}`);
  console.log(`  branch   ${ALLOWED_BRANCH}`);
  console.log(`  commit   ${currentCommit()}`);
  console.log(`  build    ${identity.build}`);
  console.log(`  game     sha256:${identity.gameHash}`);
  console.log(`  site     sha256:${identity.websiteTreeHash}`);
  console.log(`  cq-build ${identity.stamp.content} @ ${identity.stamp.builtAt}`);
  console.log('  result   candidate verified only; no deployment was performed');
}

function identity() {
  const value = candidateIdentity();
  console.log('| Field | Value |');
  console.log('|---|---|');
  console.log(`| BUILD | ${value.build} |`);
  console.log(`| SOURCE SHA256 | ${value.sourceHash} |`);
  console.log(`| MIRROR SHA256 | ${value.mirrorHash} |`);
  console.log(`| WEBSITE GAME SHA256 | ${value.gameHash} |`);
  console.log(`| WEBSITE TREE SHA256 | ${value.websiteTreeHash} |`);
  console.log(`| CQ-BUILD CONTENT | ${value.stamp.content} |`);
  console.log(`| CQ-BUILD BUILT-AT | ${value.stamp.builtAt} |`);
}

function usage() {
  console.error('usage: node scripts/release_control.js <identity | acquire --manifest PATH | gate --manifest PATH | gate --from-active-lock>');
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'identity' && args.length === 0) return identity();
  if (command !== 'acquire' && command !== 'gate') {
    usage();
    process.exitCode = 2;
    return;
  }
  const manifestIndex = args.indexOf('--manifest');
  const fromLock = args.includes('--from-active-lock');
  if (fromLock && manifestIndex !== -1) fail('use either --manifest or --from-active-lock, not both');
  let manifest;
  if (fromLock) {
    if (command !== 'gate' || args.length !== 1) fail('--from-active-lock is valid only for gate');
    manifest = resolveManifest(get(parseMarkdownTable(lockPath()), 'Manifest', 'active release lock'));
  } else {
    if (manifestIndex !== 0 || args.length !== 2) fail('--manifest PATH is required');
    manifest = resolveManifest(args[1]);
  }
  if (command === 'acquire') return acquire(manifest);
  return gate(manifest);
}

try {
  main();
} catch (error) {
  const message = error instanceof ReleaseError ? error.message : String(error && error.message || error);
  console.error(`RELEASE GATE: FAIL — ${message}`);
  process.exitCode = 1;
}
