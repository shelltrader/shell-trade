#!/usr/bin/env node
'use strict';

/* Disposable, network-free negative tests for scripts/release_control.js. */

const assert = require('assert');
const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTROL = path.join(ROOT, 'scripts', 'release_control.js');
const HOOK = path.join(ROOT, '.githooks', 'pre-push');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chartquest-release-control-'));
let passed = 0;

function run(command, args, options = {}) {
  return cp.spawnSync(command, args, {
    cwd: options.cwd || temp,
    input: options.input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function ok(command, args, options) {
  const result = run(command, args, options);
  assert.strictEqual(result.status, 0, `${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return String(result.stdout || '');
}

function output(result) {
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function expectFail(label, result, pattern) {
  assert.notStrictEqual(result.status, 0, `${label} unexpectedly passed:\n${output(result)}`);
  assert.match(output(result), pattern, `${label} failed for the wrong reason:\n${output(result)}`);
  passed += 1;
  console.log(`PASS  ${label}`);
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function websiteTreeHash() {
  const files = ok('git', ['ls-files', '-z', '--', 'website']).split('\0').filter(Boolean).sort();
  const hash = crypto.createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(sha(path.join(temp, file))).update('\n');
  return hash.digest('hex');
}

function head() {
  return ok('git', ['rev-parse', 'HEAD']).trim();
}

function lockDirectory() {
  return path.join(ok('git', ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim(), 'chartquest-release-lock');
}

function manifestPath() {
  return path.join(temp, '.chartquest', 'releases', 'RELEASE_TEST.md');
}

function writeManifest(overrides = {}) {
  const game = path.join(temp, 'website', 'game.html');
  const source = path.join(temp, 'chart-quest.html');
  const mirror = path.join(temp, 'index.html');
  const values = {
    releaseId: 'CQ-TEST-9001',
    build: 'build 9001',
    commit: head(),
    productionUrl: 'https://release-gate-test.example',
    sourceHash: sha(source),
    mirrorHash: sha(mirror),
    gameHash: sha(game),
    websiteTreeHash: websiteTreeHash(),
    stampContent: 'abcdef1234',
    stampBuiltAt: '2026-08-11T00:00:00Z',
    ...overrides,
  };
  fs.writeFileSync(manifestPath(), [
    '# Disposable release-gate test manifest',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Release ID | ${values.releaseId} |`,
    `| BUILD | ${values.build} |`,
    `| GIT COMMIT | ${values.commit} |`,
    '| BRANCH | main |',
    '| RELEASE OWNER | Release Manager |',
    '| RELEASE START | 2026-08-11T00:00:00Z |',
    `| PRODUCTION URL | ${values.productionUrl} |`,
    `| SOURCE SHA256 | ${values.sourceHash} |`,
    `| MIRROR SHA256 | ${values.mirrorHash} |`,
    `| WEBSITE GAME SHA256 | ${values.gameHash} |`,
    `| WEBSITE TREE SHA256 | ${values.websiteTreeHash} |`,
    `| CQ-BUILD CONTENT | ${values.stampContent} |`,
    `| CQ-BUILD BUILT-AT | ${values.stampBuiltAt} |`,
    '',
  ].join('\n'));
}

function removeLock() {
  fs.rmSync(lockDirectory(), { recursive: true, force: true });
}

function acquire() {
  return run(process.execPath, ['scripts/release_control.js', 'acquire', '--manifest', '.chartquest/releases/RELEASE_TEST.md']);
}

function gate() {
  return run(process.execPath, ['scripts/release_control.js', 'gate', '--manifest', '.chartquest/releases/RELEASE_TEST.md']);
}

function prePush(input) {
  return run('sh', ['.githooks/pre-push'], { input });
}

function pushLine(localRef, localSha, remoteRef = 'refs/heads/main', remoteSha = '0'.repeat(40)) {
  return `${localRef} ${localSha} ${remoteRef} ${remoteSha}\n`;
}

try {
  fs.mkdirSync(path.join(temp, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(temp, '.githooks'), { recursive: true });
  fs.mkdirSync(path.join(temp, '.chartquest', 'releases'), { recursive: true });
  fs.mkdirSync(path.join(temp, 'website'), { recursive: true });
  fs.copyFileSync(CONTROL, path.join(temp, 'scripts', 'release_control.js'));
  fs.copyFileSync(HOOK, path.join(temp, '.githooks', 'pre-push'));
  fs.writeFileSync(path.join(temp, 'scripts', 'verify.js'), "#!/usr/bin/env node\nconsole.log('fixture verification PASS');\n");
  const game = "<!doctype html>\n<meta name=\"cq-build\" content=\"abcdef1234\" data-built-at=\"2026-08-11T00:00:00Z\">\n<script>const BUILD_TAG = 'build 9001';</script>\n";
  fs.writeFileSync(path.join(temp, 'chart-quest.html'), game);
  fs.writeFileSync(path.join(temp, 'index.html'), game);
  fs.writeFileSync(path.join(temp, 'website', 'game.html'), game);
  fs.writeFileSync(path.join(temp, 'website', '_headers'), '/*\n  X-Content-Type-Options: nosniff\n');
  ok('git', ['init', '-b', 'main']);
  ok('git', ['config', 'user.email', 'release-gate-test@example.invalid']);
  ok('git', ['config', 'user.name', 'Release Gate Test']);
  ok('git', ['add', 'chart-quest.html', 'index.html', 'website', 'scripts', '.githooks']);
  ok('git', ['commit', '-m', 'fixture candidate']);

  writeManifest();
  assert.match(output(acquire()), /RELEASE LOCK ACQUIRED/);
  assert.match(output(gate()), /RELEASE GATE: PASS/);
  passed += 1;
  console.log('PASS  clean main candidate passes gate');

  const candidateSha = head();
  const mainPush = prePush(pushLine('refs/heads/main', candidateSha));
  assert.strictEqual(mainPush.status, 0, `approved main push was blocked:\n${output(mainPush)}`);
  passed += 1;
  console.log('PASS  exact main ref and SHA may target main');

  expectFail('feature ref cannot target main',
    prePush(pushLine('refs/heads/feature/release-gate-negative', candidateSha)),
    /must use refs\/heads\/main as its local ref/);

  expectFail('different SHA cannot target main',
    prePush(pushLine('refs/heads/main', '0'.repeat(40))),
    /pushed main SHA does not match the current local main ref/);

  expectFail('main deletion cannot reuse release context',
    prePush(pushLine('(delete)', '0'.repeat(40))),
    /must use refs\/heads\/main as its local ref/);

  writeManifest({ productionUrl: 'https://different-release-gate-test.example' });
  expectFail('different production URL fails', gate(), /intended production URL does not match the manifest/);
  writeManifest();

  const feature = path.join(path.dirname(temp), `${path.basename(temp)}-feature`);
  ok('git', ['worktree', 'add', '-b', 'feature/release-gate-negative', feature]);
  fs.mkdirSync(path.join(feature, '.chartquest', 'releases'), { recursive: true });
  fs.copyFileSync(manifestPath(), path.join(feature, '.chartquest', 'releases', 'RELEASE_TEST.md'));
  const featureGate = run(process.execPath, ['scripts/release_control.js', 'gate', '--manifest', '.chartquest/releases/RELEASE_TEST.md'], { cwd: feature });
  expectFail('feature worktree cannot pass release gate', featureGate, /must run from main/);
  fs.rmSync(feature, { recursive: true, force: true });
  ok('git', ['worktree', 'prune']);

  writeManifest({ commit: '0'.repeat(40) });
  expectFail('wrong commit fails', gate(), /active release lock intended commit|CURRENT COMMIT != INTENDED COMMIT/);

  writeManifest({ build: 'build 9002' });
  expectFail('wrong build fails', gate(), /active release lock intended build|CURRENT BUILD != INTENDED BUILD/);

  expectFail('missing manifest fails', run(process.execPath, ['scripts/release_control.js', 'gate', '--manifest', '.chartquest/releases/NOPE.md']), /does not exist/);

  writeManifest();
  removeLock();
  expectFail('missing release lock fails', gate(), /does not exist/);

  assert.match(output(acquire()), /RELEASE LOCK ACQUIRED/);
  fs.writeFileSync(path.join(lockDirectory(), 'RELEASE_LOCK.md'), '| Field | Value |\n|---|---|\n| Release ID | FOREIGN |\n');
  expectFail('foreign release lock fails', gate(), /missing a usable Intended Build|different release ID/);

  removeLock();
  fs.writeFileSync(path.join(temp, 'website', 'game.html'), `${game}<!-- mutated after candidate preparation -->\n`);
  ok('git', ['add', 'website/game.html']);
  ok('git', ['commit', '-m', 'fixture mutation']);
  writeManifest({ gameHash: sha(path.join(temp, 'chart-quest.html')), websiteTreeHash: websiteTreeHash() });
  assert.match(output(acquire()), /RELEASE LOCK ACQUIRED/);
  expectFail('artifact mutation after preparation fails hash verification', gate(), /content hashes differ/);

  removeLock();
  fs.writeFileSync(path.join(temp, 'website', 'game.html'), game);
  ok('git', ['add', 'website/game.html']);
  ok('git', ['commit', '-m', 'fixture restore']);
  writeManifest();
  assert.match(output(acquire()), /RELEASE LOCK ACQUIRED/);
  ok('git', ['commit', '--allow-empty', '-m', 'fixture stale identity']);
  expectFail('stale release identity fails', gate(), /CURRENT COMMIT != INTENDED COMMIT/);

  const featurePush = prePush('refs/heads/feature/release-gate-negative abc refs/heads/feature/release-gate-negative def\n');
  assert.strictEqual(featurePush.status, 0, `normal feature push was blocked:\n${output(featurePush)}`);
  passed += 1;
  console.log('PASS  normal feature push path remains unblocked');

  console.log(`\nrelease_control.test.js: ${passed} checks passed`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
