#!/usr/bin/env node
'use strict';
/*
 * ChartQuest POST-DEPLOY SMOKE TEST — run against the LIVE site after every deploy.
 *   node scripts/smoke_deploy.js                    (defaults to https://playchartquest.com)
 *   node scripts/smoke_deploy.js https://staging…   (any origin)
 *   node scripts/smoke_deploy.js --manifest .chartquest/releases/RELEASE.md
 *      (also verifies served /game SHA-256 + cq-build stamp against the approved candidate)
 *   scripts/cq.sh smoke
 *
 * Exit 0 = production is serving what this checkout says it should. Exit 1 = it is not.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────
 * Every other check in this repo reads the LOCAL DISK. verify.js, the regression checklist,
 * cq.sh serve and the LAN QR all describe the machine you are sitting at. None of them can
 * see production, and for ~20 builds production was not what any of them described:
 *
 *   • Every Guardian-1 clip — the boss intro, the DEFEAT cinematic, the JOURNAL-UNLOCK
 *     cinematic, four flinches, three roars — returned the 148 KB landing page instead of
 *     video, because the files were untracked and Cloudflare Pages builds from the git repo.
 *   • The build itself was byte-perfect the whole time, so "is production serving the latest
 *     build?" answered YES while two named steps of the beta flow played nothing.
 *
 * ── THE ONE RULE THIS ENCODES ────────────────────────────────────────────────────────────
 * **A 200 IS NOT PROOF. THE CONTENT-TYPE IS.**
 * There is no 404.html, so Cloudflare answers every missing path with the landing page at
 * HTTP 200. A status-code check passes and the browser receives text/html where a video
 * should be. So every asset assertion here is: 200 AND a media content-type AND the exact
 * byte length of the local file. Any one of those failing is a FAIL.
 *
 * TOOLING ONLY — read-only over the network, writes nothing, touches no game code.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const SRC = 'chart-quest.html';
const argv = process.argv.slice(2);
const manifestFlag = argv.indexOf('--manifest');
const manifestArg = manifestFlag === -1 ? null : argv[manifestFlag + 1];
if (manifestFlag !== -1 && (!manifestArg || manifestFlag !== argv.length - 2)) {
  console.error('usage: node scripts/smoke_deploy.js [url] [--manifest .chartquest/releases/RELEASE.md]');
  process.exit(2);
}
const positional = manifestFlag === -1 ? argv : argv.slice(0, manifestFlag);
if (positional.length > 1) {
  console.error('usage: node scripts/smoke_deploy.js [url] [--manifest .chartquest/releases/RELEASE.md]');
  process.exit(2);
}
const targetArg = positional[0] || null;
const BASE = (targetArg || process.env.CQ_SMOKE_URL || 'https://playchartquest.com').replace(/\/+$/, '');
const CONCURRENCY = 6;
const TIMEOUT_MS = 30000;

// Expected content-type family per extension. A media path answering text/html is the
// SPA-fallback signature — the exact failure this tool exists to catch.
const EXPECT = {
  '.mp4': /^video\//, '.webm': /^video\//,
  '.m4a': /^audio\//, '.mp3': /^audio\//, '.ogg': /^audio\//,
  '.webp': /^image\/webp/, '.png': /^image\/png/, '.jpg': /^image\/jpeg/, '.jpeg': /^image\/jpeg/,
  '.svg': /^image\/svg/, '.gif': /^image\/gif/,
  '.js': /(javascript|ecmascript)/, '.json': /json/, '.webmanifest': /(manifest|json)/,
  '.html': /^text\/html/, '.txt': /^text\//, '.xml': /xml/,
};

const results = [];
const add = (status, target, detail) => results.push({ status, target, detail: detail || '' });

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function productionUrl(value, source) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    throw new Error(`${source} must be an absolute http(s) origin URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password ||
      parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
    throw new Error(`${source} must be an absolute http(s) origin URL`);
  }
  return parsed.origin;
}

function manifestFields(file) {
  const absolute = path.resolve(ROOT, file);
  const releaseDir = path.join(ROOT, '.chartquest', 'releases') + path.sep;
  if (!absolute.startsWith(releaseDir)) throw new Error('release manifest must be under .chartquest/releases/');
  const fields = new Map();
  for (const line of fs.readFileSync(absolute, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 2 || /^-+$/.test(cells[0]) || cells[0] === 'Field') continue;
    fields.set(cells[0].replace(/[\*`]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(), cells[1]);
  }
  const required = ['RELEASE ID', 'BUILD', 'PRODUCTION URL', 'WEBSITE GAME SHA256', 'CQ-BUILD CONTENT', 'CQ-BUILD BUILT-AT'];
  const value = {};
  for (const name of required) {
    const found = fields.get(name);
    if (!found || /^\[.*\]$/.test(found) || /^(UNKNOWN|REQUIRED)$/i.test(found)) {
      throw new Error(`release manifest is missing ${name}`);
    }
    value[name] = found;
  }
  if (!/^[0-9a-f]{64}$/i.test(value['WEBSITE GAME SHA256'])) throw new Error('release manifest WEBSITE GAME SHA256 is invalid');
  value['PRODUCTION URL'] = productionUrl(value['PRODUCTION URL'], 'release manifest PRODUCTION URL');
  return value;
}

/* HEAD first — these are multi-MB videos and we only need the headers. Follows redirects,
   because Cloudflare serves clean URLs (/game.html -> 308 -> /game). Some edges answer HEAD
   badly, so a 405/501 falls back to a 1-byte ranged GET rather than reporting a false FAIL. */
function probe(urlPath, { method = 'HEAD', redirects = 0 } = {}) {
  return new Promise(resolve => {
    const url = new URL(urlPath.startsWith('http') ? urlPath : BASE + '/' + urlPath.replace(/^\/+/, ''));
    const lib = url.protocol === 'http:' ? http : https;
    const headers = { 'user-agent': 'chartquest-smoke/1' };
    if (method === 'GET') headers.range = 'bytes=0-0';
    const req = lib.request(url, { method, headers, timeout: TIMEOUT_MS }, res => {
      const { statusCode: code, headers: h } = res;
      res.resume();
      if ([301, 302, 307, 308].includes(code) && h.location && redirects < 5) {
        return resolve(probe(new URL(h.location, url).href, { method, redirects: redirects + 1 }));
      }
      if ((code === 405 || code === 501) && method === 'HEAD') {
        return resolve(probe(urlPath, { method: 'GET', redirects }));
      }
      resolve({
        ok: true, code,
        type: (h['content-type'] || '').split(';')[0].trim(),
        // a ranged GET reports the SLICE in content-length; content-range carries the true size
        length: h['content-range'] ? Number((h['content-range'].match(/\/(\d+)$/) || [])[1])
                                   : (h['content-length'] != null ? Number(h['content-length']) : null),
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, err: `timeout after ${TIMEOUT_MS}ms` }); });
    req.on('error', e => resolve({ ok: false, err: String(e.message || e).slice(0, 80) }));
    req.end();
  });
}

/* Fetch a full body, following redirects. Picks http/https by the URL's own protocol — a
   hardcoded https.get here threw ERR_INVALID_PROTOCOL the first time this was pointed at a
   local origin, which is also how you would test it against a staging server on http. */
function fetchBody(urlStr, redirects = 0) {
  return new Promise(resolve => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'http:' ? http : https;
    const req = lib.get(url, { timeout: TIMEOUT_MS, headers: { 'user-agent': 'chartquest-smoke/1' } }, res => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume();
        return resolve(fetchBody(new URL(res.headers.location, url).href, redirects + 1));
      }
      let b = ''; res.setEncoding('utf8');
      res.on('data', c => { b += c; });
      res.on('end', () => resolve(b));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

async function pool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) { const n = i++; out[n] = await worker(items[n], n); }
  }));
  return out;
}

/* The asset list is DERIVED FROM THE GAME, never hand-maintained — same principle as
   verify.js gate #17 and cq.sh `site`. A newly-referenced clip is covered automatically;
   a hand-written list would rot and quietly stop covering the thing that broke. */
function referencedAssets(src) {
  const refs = new Set();
  for (const m of src.matchAll(/(?:bosses|finn)\/[A-Za-z0-9._/-]+\.(?:mp4|m4a|webp|png|jpg|jpeg)/g)) refs.add(m[0]);
  // intro clips build their path at runtime ('bosses/intros/boss-' + level + '.mp4')
  const iv = src.match(/BOSS_INTRO_VIDEOS = new Set\(\[([0-9, ]*)\]\)/);
  if (iv) for (const n of iv[1].match(/\d+/g) || []) refs.add(`bosses/intros/boss-${n}.mp4`);
  // boss portraits: 'bosses/boss-' + level + '.webp'
  if (/bosses\/boss-'\s*\+\s*level/.test(src)) for (let i = 1; i <= 11; i++) refs.add(`bosses/boss-${i}.webp`);
  // top-level media (logos, poster, the intro cinematic) — bare filenames, no slash
  for (const m of src.matchAll(/['"]([A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpg|jpeg|webp|gif|mp4|webm|mp3|m4a|ogg))['"]/g)) refs.add(m[1]);
  // Only paths that resolve locally are deploy obligations. The rest are prose inside
  // comments (bosses/trend-crab.webp, bosses/sfx/boss-roar-1..3.m4a) — reported, never failed.
  const real = [...refs].filter(f => fs.existsSync(path.join(ROOT, f))).sort();
  const phantom = [...refs].filter(f => !fs.existsSync(path.join(ROOT, f))).sort();
  return { real, phantom };
}

(async () => {
  if (!fs.existsSync(SRC)) { console.error(`✗ ${SRC} not found — run from the repo`); process.exit(1); }
  const src = fs.readFileSync(SRC, 'utf8');
  const localBuild = (src.match(/BUILD_TAG\s*=\s*'build\s+(\d+)/) || [])[1] || null;
  let manifest = null;
  try {
    if (manifestArg) manifest = manifestFields(manifestArg);
    if (manifest && productionUrl(BASE, 'smoke target URL') !== manifest['PRODUCTION URL']) {
      throw new Error(`smoke target ${productionUrl(BASE, 'smoke target URL')} does not match manifest PRODUCTION URL ${manifest['PRODUCTION URL']}`);
    }
  } catch (error) {
    console.error(`✗ invalid release manifest: ${String(error && error.message || error)}`);
    process.exit(1);
  }
  const { real, phantom } = referencedAssets(src);

  console.log(`\nChartQuest Post-Deploy Smoke Test`);
  console.log(`  target : ${BASE}`);
  console.log(`  build  : ${manifest ? manifest.BUILD + ' (release manifest)' : (localBuild ? 'build ' + localBuild : '(none found)') + ' (local ' + SRC + ')'}`);
  console.log(`  assets : ${real.length} referenced${phantom.length ? ` · ${phantom.length} comment-only ref(s) ignored` : ''}\n`);

  // ── 1. PAGES ────────────────────────────────────────────────────────────────────────────
  const PAGES = ['/', '/play', '/game', '/survey', '/privacy', '/terms'];
  await pool(PAGES, async p => {
    const r = await probe(p);
    if (!r.ok) return add('FAIL', p, r.err);
    if (r.code !== 200) return add('FAIL', p, `HTTP ${r.code}`);
    if (!/^text\/html/.test(r.type)) return add('FAIL', p, `expected text/html, got ${r.type || '(none)'}`);
    add('PASS', p, `200 ${r.type}`);
  });

  // ── 2. THE SERVED BUILD ─────────────────────────────────────────────────────────────────
  // The headline question: is production running THIS candidate? Without a manifest this keeps
  // the historical local-BUILD_TAG check. With a release manifest it also verifies the exact
  // served game bytes and cq-build stamp against the approved candidate identity.
  await (async () => {
    const body = await fetchBody(BASE + '/game');
    if (!body) return add('FAIL', 'served BUILD_TAG', 'could not fetch /game');
    const wire = (body.match(/BUILD_TAG\s*=\s*'build\s+(\d+)/) || [])[1] || null;
    if (!wire) return add('FAIL', 'served BUILD_TAG', 'no BUILD_TAG in the served document');
    const expectedBuild = manifest ? (manifest.BUILD.match(/^build\s+(\d+)$/i) || [])[1] : localBuild;
    if (wire !== expectedBuild) {
      return add('FAIL', 'served BUILD_TAG',
        `production is serving build ${wire}, expected build ${expectedBuild} — the deploy is stale or still building`);
    }
    if (!manifest) return add('PASS', 'served BUILD_TAG', `build ${wire} matches local`);
    const localGame = fs.readFileSync(path.join(ROOT, 'website', 'game.html'));
    const localHash = sha256(localGame);
    if (localHash !== manifest['WEBSITE GAME SHA256']) {
      return add('FAIL', 'candidate website/game.html SHA256', 'local candidate does not match the approved release manifest');
    }
    const servedHash = sha256(Buffer.from(body, 'utf8'));
    if (servedHash !== manifest['WEBSITE GAME SHA256']) {
      return add('FAIL', 'served website/game.html SHA256', `served ${servedHash}, expected ${manifest['WEBSITE GAME SHA256']}`);
    }
    const stamp = body.match(/<meta\s+name=["']cq-build["']\s+content=["']([^"']+)["']\s+data-built-at=["']([^"']+)["']\s*>/i);
    if (!stamp || stamp[1] !== manifest['CQ-BUILD CONTENT'] || stamp[2] !== manifest['CQ-BUILD BUILT-AT']) {
      return add('FAIL', 'served cq-build stamp', 'served cq-build metadata does not match the approved release manifest');
    }
    add('PASS', 'served candidate identity', `build ${wire}, game SHA256 and cq-build stamp match release ${manifest['RELEASE ID']}`);
  })();

  // ── 3. ASSETS — the check that would have caught the cinematics outage ───────────────────
  await pool(real, async f => {
    const ext = path.extname(f).toLowerCase();
    const want = EXPECT[ext];
    const localSize = fs.statSync(path.join(ROOT, f)).size;
    const r = await probe(f);
    if (!r.ok) return add('FAIL', f, r.err);
    if (r.code !== 200) return add('FAIL', f, `HTTP ${r.code}`);
    if (/^text\/html/.test(r.type) && !/\.html?$/.test(f)) {
      return add('FAIL', f, `MISSING — served the landing page (200 ${r.type}, ${r.length} b). ` +
                            `There is no 404.html, so a missing asset answers 200. Is it committed?`);
    }
    if (want && !want.test(r.type)) return add('FAIL', f, `expected ${want} , got ${r.type || '(none)'}`);
    if (r.length != null && r.length !== localSize) {
      return add('FAIL', f, `size mismatch — production ${r.length} b, local ${localSize} b (stale or truncated)`);
    }
    add('PASS', f, `200 ${r.type} ${localSize} b`);
  });

  // ── 4. INFRA ────────────────────────────────────────────────────────────────────────────
  await pool(['/sw.js', '/manifest.webmanifest', '/robots.txt'], async p => {
    const r = await probe(p);
    if (!r.ok) return add('FAIL', p, r.err);
    if (r.code !== 200) return add('FAIL', p, `HTTP ${r.code}`);
    const want = EXPECT[path.extname(p).toLowerCase()];
    if (want && !want.test(r.type)) return add('FAIL', p, `expected ${want}, got ${r.type || '(none)'}`);
    add('PASS', p, `200 ${r.type}`);
  });

  // ── REPORT ──────────────────────────────────────────────────────────────────────────────
  const fails = results.filter(r => r.status === 'FAIL');
  const passes = results.filter(r => r.status === 'PASS');
  console.log('='.repeat(64));
  for (const r of fails) console.log(`  ✗ ${r.target}\n        ${r.detail}`);
  if (!fails.length) {
    console.log(`  ✓ all ${passes.length} checks passed`);
    console.log(`      ${PAGES.length} pages · served build ${localBuild} · ${real.length} assets · 3 infra`);
  }
  if (phantom.length) console.log(`  – comment-only refs ignored: ${phantom.join(', ')}`);
  console.log('='.repeat(64));
  console.log(`  ${passes.length} pass · ${fails.length} fail`);
  console.log('\n' + (fails.length ? 'FAIL' : 'PASS') + '\n');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\n✗ smoke test crashed: ' + (e && e.stack || e) + '\n'); process.exit(1); });
