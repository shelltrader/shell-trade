#!/usr/bin/env node
'use strict';

/*
 * Build 367 Boss 1 cinematic-audio media gate.
 *
 * This is deliberately an objective gate. It proves that the five shipped AAC packages decode,
 * preserve the approved video assets, match their intended timelines, survive phone-band
 * filtering, retain headroom, and are mirrored byte-for-byte. It does not award an aesthetic
 * score; the audible A1 review and two independent listeners own that judgment.
 */
const assert = require('assert/strict');
const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACK = 'bosses/sfx/boss1-polish-v1';
const SITE_PACK = 'website/bosses/sfx/boss1-polish-v1';
const SAMPLE_RATE = 48000;

const SPECS = Object.freeze([
  { name: 'intro', file: 'intro.m4a', duration: 10.041667, peakWindow: [7.35, 8.85], kind: 'intro' },
  { name: 'flinch-1', file: 'flinch-1.m4a', duration: 3.916667, peakWindow: [2.36, 2.57], impact: 2.466667 },
  { name: 'flinch-2', file: 'flinch-2.m4a', duration: 3.016667, peakWindow: [1.90, 2.10], impact: 2.000000 },
  { name: 'flinch-3', file: 'flinch-3.m4a', duration: 3.533333, peakWindow: [0.51, 0.72], impact: 0.616667 },
  { name: 'flinch-4', file: 'flinch-4.m4a', duration: 5.183333, peakWindow: [1.58, 1.79], impact: 1.683333 },
]);

const APPROVED_VISUALS = Object.freeze({
  'bosses/intros/boss-1.mp4': 'ab95be2b3c61f91b5d2e53be2c044ec8e753a6991dcaa064f423e61958ffabee',
  'bosses/flinches/boss-1-flinch-1.mp4': '8ed9cce05b688275044b218dfc8c53b4a6ed9d2bf9d671224051fa3c497d2bf2',
  'bosses/flinches/boss-1-flinch-2.mp4': '2c126ffb85049e66cdb42e8e3628889b89776a69fa50ef99ff391cfd56c9c75b',
  'bosses/flinches/boss-1-flinch-3.mp4': '36fbbce914512a2cb11181669d4607908ace2778d8fbbde7a4468734932fb3f9',
  'bosses/flinches/boss-1-flinch-4.mp4': '6e43dd3583006a57141a505af03970b0a298a93371d41d679ab92c794930b1b2',
});

const PRESERVED_ROARS = Object.freeze({
  'bosses/sfx/boss-roar-1.m4a': 'e1948449619df11d60eb9d57d187bd5e72497de87d56f41d1f0aee40b5bf0733',
  'bosses/sfx/boss-roar-2.m4a': '78bd238de4c3edc64f6231aef9720aa1a8c29df7d320d87ec4ba03617d5fda66',
  'bosses/sfx/boss-roar-3.m4a': '212f8624aa9b077eeef428ae748de37b44d49ad005742abf842142f5abeb1bb3',
});

function abs(rel) { return path.join(ROOT, rel); }
function bytes(rel) { return fs.readFileSync(abs(rel)); }
function sha(rel) { return crypto.createHash('sha256').update(bytes(rel)).digest('hex'); }
function run(command, args, options = {}) {
  const result = cp.spawnSync(command, args, {
    cwd: ROOT,
    encoding: options.binary ? null : 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${String(result.stderr || result.stdout || result.status).slice(0, 500)}`);
  }
  return result;
}
function probe(rel) {
  const result = run('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration,size:stream=codec_name,profile,sample_rate,channels', '-of', 'json', rel]);
  return JSON.parse(result.stdout);
}
function pcm(rel, filter) {
  const args = ['-hide_banner', '-loglevel', 'error', '-i', rel, '-vn', '-ac', '1', '-ar', String(SAMPLE_RATE)];
  if (filter) args.push('-af', filter);
  args.push('-f', 'f32le', 'pipe:1');
  const raw = run('ffmpeg', args, { binary: true }).stdout;
  return new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
}
function stats(samples) {
  let sum = 0, sumSq = 0, peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    sum += value;
    sumSq += value * value;
    peak = Math.max(peak, Math.abs(value));
  }
  return {
    mean: samples.length ? sum / samples.length : 0,
    rms: samples.length ? Math.sqrt(sumSq / samples.length) : 0,
    peak,
  };
}
function db(value) { return 20 * Math.log10(Math.max(1e-12, value)); }
function windowPeak(samples, seconds = 0.02) {
  const width = Math.max(1, Math.round(SAMPLE_RATE * seconds));
  let sumSq = 0, best = -1, bestAt = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    sumSq += value * value;
    if (i >= width) {
      const old = samples[i - width];
      sumSq -= old * old;
    }
    if (i >= width - 1) {
      const rms = Math.sqrt(Math.max(0, sumSq) / width);
      if (rms > best) { best = rms; bestAt = i - width + 1; }
    }
  }
  return { at: bestAt / SAMPLE_RATE, rms: best };
}
function sliceStats(samples, fromSeconds, toSeconds) {
  return stats(samples.subarray(
    Math.max(0, Math.floor(fromSeconds * SAMPLE_RATE)),
    Math.min(samples.length, Math.ceil(toSeconds * SAMPLE_RATE)),
  ));
}
function ebur128(rel) {
  const result = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', rel,
    '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `ebur128 must decode ${rel}`);
  const text = String(result.stderr || '');
  const loudness = [...text.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)];
  const peaks = [...text.matchAll(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/g)];
  assert.ok(loudness.length && peaks.length, `ebur128 summary missing for ${rel}`);
  return {
    lufs: Number(loudness[loudness.length - 1][1]),
    truePeak: Number(peaks[peaks.length - 1][1]),
  };
}

function runSuite(options = {}) {
  const report = options.report !== false;
  const rows = [];

  for (const [rel, expected] of Object.entries({ ...APPROVED_VISUALS, ...PRESERVED_ROARS })) {
    assert.equal(sha(rel), expected, `${rel} must remain byte-identical to the approved source`);
  }

  const hashes = [];
  for (const spec of SPECS) {
    const rel = `${PACK}/${spec.file}`;
    const site = `${SITE_PACK}/${spec.file}`;
    assert.ok(fs.existsSync(abs(rel)) && fs.existsSync(abs(site)), `${spec.name} root/site package must exist`);
    assert.deepEqual(bytes(rel), bytes(site), `${spec.name} root/site bytes must match`);
    hashes.push(sha(rel));

    const media = probe(rel);
    assert.equal(media.streams.length, 1, `${spec.name} must contain exactly one stream`);
    const stream = media.streams[0];
    assert.equal(stream.codec_name, 'aac', `${spec.name} must use Safari-safe AAC`);
    assert.match(String(stream.profile || ''), /LC/i, `${spec.name} must use AAC-LC`);
    assert.ok([44100, 48000].includes(Number(stream.sample_rate)), `${spec.name} sample rate must be 44.1/48k`);
    assert.ok([1, 2].includes(Number(stream.channels)), `${spec.name} must be mono or stereo`);
    assert.ok(Number(media.format.size) < 5 * 1024 * 1024, `${spec.name} must remain below the deploy binary limit`);
    const duration = Number(media.format.duration);
    assert.ok(Math.abs(duration - spec.duration) <= 0.12,
      `${spec.name} duration ${duration.toFixed(3)} must match ${spec.duration.toFixed(3)} ±0.12s`);

    const decoded = pcm(rel);
    const full = stats(decoded);
    const band = stats(pcm(rel, 'highpass=f=300,lowpass=f=5000'));
    const loudness = ebur128(rel);
    const maxWindow = windowPeak(decoded);
    const tail = sliceStats(decoded, Math.max(0, duration - 0.04), duration);
    const intro = sliceStats(decoded, 0, Math.min(0.25, duration));
    const bandLoss = db(full.rms) - db(band.rms);

    assert.ok(Math.abs(full.mean) < 0.01, `${spec.name} DC offset ${full.mean} must remain below 0.01`);
    assert.ok(loudness.truePeak <= -1.0, `${spec.name} true peak ${loudness.truePeak} dBTP must retain ≥1dB headroom`);
    assert.ok(bandLoss <= 6.0, `${spec.name} phone-band loss ${bandLoss.toFixed(2)}dB must be ≤6dB`);
    assert.ok(maxWindow.at >= spec.peakWindow[0] && maxWindow.at <= spec.peakWindow[1],
      `${spec.name} strongest 20ms window ${maxWindow.at.toFixed(3)}s must land in ${spec.peakWindow.join('–')}s`);
    assert.ok(db(tail.rms) <= -38, `${spec.name} final 40ms ${db(tail.rms).toFixed(1)}dBFS must fade cleanly`);
    assert.ok(db(intro.rms) > -55, `${spec.name} must have a natural audible onset in its first 250ms`);

    rows.push({
      name: spec.name, sha256: hashes[hashes.length - 1], duration,
      lufs: loudness.lufs, truePeak: loudness.truePeak, dc: full.mean,
      phoneBandLossDb: bandLoss, strongestWindowSeconds: maxWindow.at,
      final40msDbfs: db(tail.rms),
    });
  }

  assert.ok(new Set(hashes.slice(1)).size >= 3, 'four flinches need at least three genuinely distinct encoded waveforms');
  const flinchLoudness = rows.slice(1).map(row => row.lufs);
  assert.ok(Math.max(...flinchLoudness) - Math.min(...flinchLoudness) <= 3,
    `flinch loudness spread must be ≤3 LU; got ${Math.min(...flinchLoudness)}..${Math.max(...flinchLoudness)}`);

  if (report) {
    for (const row of rows) {
      console.log(`✓ ${row.name}: ${row.duration.toFixed(3)}s · ${row.lufs.toFixed(1)} LUFS · ` +
        `${row.truePeak.toFixed(1)} dBTP · phone −${row.phoneBandLossDb.toFixed(2)}dB · peak @${row.strongestWindowSeconds.toFixed(3)}s`);
    }
    console.log(`\n${rows.length}/${SPECS.length} Boss 1 cinematic audio packages passed`);
  }
  return { ok: true, total: SPECS.length, passed: rows.length, rows,
    detail: `${rows.length}/${SPECS.length} media packages · AAC-LC/parity/timing/headroom/phone-band PASS` };
}

if (require.main === module) {
  try { runSuite(); }
  catch (error) {
    console.error('✗ Boss 1 audio media gate');
    console.error(String(error && error.stack || error));
    process.exitCode = 1;
  }
}

module.exports = { runSuite };
