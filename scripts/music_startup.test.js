#!/usr/bin/env node
'use strict';

/*
 * Build 372 startup-audio regression gate.
 *
 * These tests execute the two source owners that decide startup audio rather than
 * testing a duplicate implementation:
 *   1. the launch-time cq_music authority; and
 *   2. the music-button / browser-gesture bootstrap.
 *
 * A fake event path distinguishes capture listeners from ordinary bubble listeners,
 * so a startup button that stops propagation cannot create another silent launch.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME = fs.readFileSync(path.join(ROOT, 'chart-quest.html'), 'utf8');

function section(startMarker, endMarker) {
  const start = GAME.indexOf(startMarker);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  const end = GAME.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing source marker after ${startMarker}: ${endMarker}`);
  return GAME.slice(start, end);
}

const MUTE_FLAG_OWNER = section(
  'const _CQ_MUTE =',
  '/* ── DEV-ONLY GATE',
);
const LAUNCH_AUDIO_OWNER = section(
  '/* STARTUP MUSIC AUTHORITY',
  '/* =========================================================\n   CLOUDFLARE ACCOUNT & CLOUD SYNC',
);
const MUSIC_BOOTSTRAP = section(
  '/* ── Music toggle + first-gesture autostart ── */',
  '/* ---------- Main loop ---------- */',
);
const CINE_AUDIO_OWNER = section(
  'const CineAudio = (() => {',
  '/* ══ JOURNEY THROUGH THE BLOCKCHAIN',
);

class FakeStorage {
  constructor(initial) {
    this.values = new Map(Object.entries(initial || {}).map(([key, value]) => [key, String(value)]));
    this.writes = [];
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) {
    const text = String(value);
    this.values.set(key, text);
    this.writes.push([key, text]);
  }
  removeItem(key) { this.values.delete(key); }
}

function runLaunchAudioOwner(storage, search) {
  vm.runInNewContext(`${MUTE_FLAG_OWNER}\n${LAUNCH_AUDIO_OWNER}`, {
    location: { search: search || '' },
    localStorage: storage,
  }, { filename: 'chart-quest.html#launch-audio-owner', timeout: 1000 });
}

function listenerCapture(options) {
  return options === true || !!(options && typeof options === 'object' && options.capture);
}

class FakeWindow {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options) {
    const rows = this.listeners.get(type) || [];
    rows.push({ fn, capture: listenerCapture(options) });
    this.listeners.set(type, rows);
  }
  removeEventListener(type, fn, options) {
    const capture = listenerCapture(options);
    const rows = (this.listeners.get(type) || []).filter(row => row.fn !== fn || row.capture !== capture);
    this.listeners.set(type, rows);
  }
  listenerCount(type, capture) {
    return (this.listeners.get(type) || []).filter(row => row.capture === capture).length;
  }
  /* Window capture -> target -> window bubble. A target can suppress only the last leg. */
  dispatchThroughTarget(type, targetHandler) {
    const event = {
      type,
      propagationStopped: false,
      stopPropagation() { this.propagationStopped = true; },
    };
    const rows = [...(this.listeners.get(type) || [])];
    for (const row of rows.filter(item => item.capture)) row.fn(event);
    if (targetHandler) targetHandler(event);
    if (!event.propagationStopped) {
      for (const row of rows.filter(item => !item.capture)) row.fn(event);
    }
    return event;
  }
}

class FakeButton {
  constructor() {
    this.listeners = new Map();
    this.textContent = '';
    this.style = {};
    this.title = '';
  }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  click() {
    const fn = this.listeners.get('click');
    assert.equal(typeof fn, 'function', 'music button must retain its click owner');
    fn({ type: 'click' });
  }
}

function audioSpy() {
  return {
    unlocks: 0,
    muted: [],
    plays: [],
    unlock() { this.unlocks += 1; },
    setMuted(value) { this.muted.push(!!value); },
    play(name) { this.plays.push(name); },
  };
}

function cineAudioWorld() {
  const scheduled = { oscillators: 0, buffers: 0, sources: 0 };
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = {};
    }
    resume() { this.state = 'running'; }
    createOscillator() {
      scheduled.oscillators += 1;
      return {
        type: '',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}, start() {}, stop() {},
      };
    }
    createGain() {
      return {
        gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
      };
    }
    createBuffer(_channels, length) {
      scheduled.buffers += 1;
      return { getChannelData() { return new Float32Array(length); } };
    }
    createBufferSource() {
      scheduled.sources += 1;
      return { buffer: null, connect() {}, start() {}, stop() {} };
    }
    createBiquadFilter() {
      return { type: '', frequency: { value: 0 }, connect() {} };
    }
  }
  const sandbox = { window: { AudioContext: FakeAudioContext }, Math };
  vm.runInNewContext(`${CINE_AUDIO_OWNER}\nthis.CineAudioUnderTest = CineAudio;`, sandbox, {
    filename: 'chart-quest.html#CineAudio', timeout: 1000,
  });
  return { audio: sandbox.CineAudioUnderTest, scheduled };
}

function bootstrapWorld(options) {
  const opts = options || {};
  const storage = opts.storage || new FakeStorage({ cq_music: 'on' });
  const window = new FakeWindow();
  const musicBtn = new FakeButton();
  const bossFight = { classList: { contains: name => name === 'open' && !!opts.bossOpen } };
  const document = {
    hidden: false,
    visibilityState: 'visible',
    getElementById(id) {
      if (id === 'musicBtn') return musicBtn;
      if (id === 'bossFight') return bossFight;
      return null;
    },
  };
  const GameMusic = audioSpy();
  const Boss1CineAudio = audioSpy();
  const CineAudio = audioSpy();
  const introCine = { active: !!opts.introActive };
  vm.runInNewContext(MUSIC_BOOTSTRAP, {
    window,
    document,
    localStorage: storage,
    GameMusic,
    Boss1CineAudio,
    CineAudio,
    introCine,
    bfState: opts.bossOpen ? {} : null,
  }, { filename: 'chart-quest.html#music-bootstrap', timeout: 1000 });
  return { storage, window, document, musicBtn, GameMusic, Boss1CineAudio, CineAudio, introCine };
}

function assertUnlocks(world, count, label) {
  assert.equal(world.GameMusic.unlocks, count, `${label}: GameMusic unlock count`);
  assert.equal(world.Boss1CineAudio.unlocks, count, `${label}: Boss1CineAudio unlock count`);
  assert.equal(world.CineAudio.unlocks, count, `${label}: CineAudio unlock count`);
}

const tests = [
  ['ordinary boot owns cq_music and repairs every stale/default state', () => {
    for (const initial of [undefined, 'on', 'off']) {
      const storage = new FakeStorage(initial === undefined ? {} : { cq_music: initial });
      runLaunchAudioOwner(storage, '');
      assert.equal(storage.getItem('cq_music'), 'on', `ordinary boot must enable music from ${String(initial)}`);
      assert.deepEqual(storage.writes.at(-1), ['cq_music', 'on']);
    }
  }],
  ['explicit mute is a per-document launch exception', () => {
    const storage = new FakeStorage({ cq_music: 'on' });
    runLaunchAudioOwner(storage, '?fresh=1&mute=1');
    assert.equal(storage.getItem('cq_music'), 'off');
    const world = bootstrapWorld({ storage });
    assert.equal(world.musicBtn.textContent, '🔇');
    assert.equal(world.GameMusic.muted.at(-1), true);
    assert.equal(world.Boss1CineAudio.muted.at(-1), true);
    assert.equal(world.CineAudio.muted.at(-1), true, 'procedural cinematic audio must obey ?mute too');
    world.window.dispatchThroughTarget('pointerdown', event => event.stopPropagation());
    world.window.dispatchThroughTarget('keydown', event => event.stopPropagation());
    assert.equal(storage.getItem('cq_music'), 'off', 'gesture must not override the explicit mute launch');
    assert.deepEqual(world.GameMusic.plays, [], 'explicit mute must never start the explore bed');
  }],
  ['first pointer gesture uses capture and starts explore despite target stopPropagation', () => {
    const world = bootstrapWorld();
    assert.equal(world.CineAudio.muted.at(-1), false, 'ordinary startup must enable procedural cinematic audio');
    assert.equal(world.window.listenerCount('pointerdown', true), 1, 'pointer unlock owner must be capture-phase');
    const event = world.window.dispatchThroughTarget('pointerdown', row => row.stopPropagation());
    assert.equal(event.propagationStopped, true, 'fixture must exercise a propagation-stopping startup control');
    assertUnlocks(world, 1, 'first pointer gesture');
    assert.deepEqual(world.GameMusic.plays, ['explore']);
  }],
  ['first keyboard gesture uses capture and starts explore', () => {
    const world = bootstrapWorld();
    assert.equal(world.window.listenerCount('keydown', true), 1, 'keyboard unlock owner must be capture-phase');
    world.window.dispatchThroughTarget('keydown', row => row.stopPropagation());
    assertUnlocks(world, 1, 'first keyboard gesture');
    assert.deepEqual(world.GameMusic.plays, ['explore']);
  }],
  ['unlock owner survives later gestures and a background/resume cycle', () => {
    const world = bootstrapWorld();
    world.window.dispatchThroughTarget('pointerdown');
    assertUnlocks(world, 1, 'initial gesture');
    assert.deepEqual(world.GameMusic.plays, ['explore']);

    world.document.hidden = true;
    world.document.visibilityState = 'hidden';
    world.document.hidden = false;
    world.document.visibilityState = 'visible';
    world.window.dispatchThroughTarget('keydown', row => row.stopPropagation());
    world.window.dispatchThroughTarget('pointerdown', row => row.stopPropagation());

    assertUnlocks(world, 3, 'post-resume gestures');
    assert.deepEqual(world.GameMusic.plays, ['explore'], 'permanent permission recovery must not restart the bed');
    assert.equal(world.window.listenerCount('pointerdown', true), 1, 'pointer unlock owner must remain installed');
    assert.equal(world.window.listenerCount('keydown', true), 1, 'keyboard unlock owner must remain installed');
  }],
  ['intro keeps audio ownership until a later legal gesture', () => {
    const world = bootstrapWorld({ introActive: true });
    world.window.dispatchThroughTarget('pointerdown', row => row.stopPropagation());
    assertUnlocks(world, 1, 'intro gesture');
    assert.deepEqual(world.GameMusic.plays, [], 'explore must not start over the intro');

    world.introCine.active = false;
    world.window.dispatchThroughTarget('keydown', row => row.stopPropagation());
    assertUnlocks(world, 2, 'post-intro gesture');
    assert.deepEqual(world.GameMusic.plays, ['explore']);
    world.window.dispatchThroughTarget('pointerdown');
    assertUnlocks(world, 3, 'later permission-recovery gesture');
    assert.deepEqual(world.GameMusic.plays, ['explore'], 'later gestures must not duplicate playback');
  }],
  ['manual mute holds for the document but normal reload re-enables music', () => {
    const storage = new FakeStorage({ cq_music: 'off' });
    runLaunchAudioOwner(storage, '');
    const world = bootstrapWorld({ storage });
    assert.equal(world.musicBtn.textContent, '🎵');
    world.musicBtn.click();
    assert.equal(storage.getItem('cq_music'), 'off');
    assert.equal(world.musicBtn.textContent, '🔇');
    assert.equal(world.GameMusic.muted.at(-1), true);
    assert.equal(world.Boss1CineAudio.muted.at(-1), true);
    assert.equal(world.CineAudio.muted.at(-1), true);
    world.window.dispatchThroughTarget('pointerdown', row => row.stopPropagation());
    assert.deepEqual(world.GameMusic.plays, [], 'muted document must remain silent after gestures');

    runLaunchAudioOwner(storage, '');
    assert.equal(storage.getItem('cq_music'), 'on', 'the next ordinary boot owns the new visit and repairs mute');
  }],
  ['turning music back on unmutes and unlocks every audio owner', () => {
    const world = bootstrapWorld();
    world.musicBtn.click();
    assert.equal(world.storage.getItem('cq_music'), 'off');
    world.musicBtn.click();
    assert.equal(world.storage.getItem('cq_music'), 'on');
    assert.equal(world.GameMusic.muted.at(-1), false);
    assert.equal(world.Boss1CineAudio.muted.at(-1), false);
    assert.equal(world.CineAudio.muted.at(-1), false);
    assert.equal(world.GameMusic.unlocks, 2, 'both toggle gestures reach the music context');
    assert.equal(world.Boss1CineAudio.unlocks, 1, 'toggle-on primes authored Guardian audio');
    assert.equal(world.CineAudio.unlocks, 1, 'toggle-on unlocks procedural cinematic audio');
    assert.deepEqual(world.GameMusic.plays, ['explore']);
  }],
  ['procedural cinematic owner schedules nothing while muted', () => {
    const world = cineAudioWorld();
    assert.equal(typeof world.audio.setMuted, 'function', 'CineAudio must publish the shared mute owner');
    world.audio.setMuted(true);
    world.audio.impact();
    world.audio.glitch();
    assert.deepEqual(world.scheduled, { oscillators: 0, buffers: 0, sources: 0 });

    world.audio.setMuted(false);
    world.audio.impact();
    assert.ok(world.scheduled.oscillators > 0, 'unmuted procedural tone must remain functional');
    assert.ok(world.scheduled.buffers > 0, 'unmuted procedural noise must remain functional');
    assert.ok(world.scheduled.sources > 0, 'unmuted procedural source must remain functional');
  }],
  ['canonical game artifacts remain byte-identical', () => {
    const parity = require('./artifact_parity.js').checkArtifactParity(ROOT);
    assert.equal(parity.ok, true, parity.detail);
  }],
];

function runSuite(options) {
  const report = !options || options.report !== false;
  const failures = [];
  let passed = 0;
  for (const [name, test] of tests) {
    try {
      test();
      passed += 1;
      if (report) console.log(`✓ ${name}`);
    } catch (error) {
      failures.push({ name, error });
      if (report) {
        console.error(`✗ ${name}`);
        console.error(String(error && error.stack || error));
      }
    }
  }
  const detail = `${passed}/${tests.length} startup-audio contracts passed`;
  if (report) console.log(`\n${detail}`);
  return { ok: failures.length === 0, total: tests.length, passed, failures, detail };
}

module.exports = { runSuite };

if (require.main === module) {
  const result = runSuite();
  process.exitCode = result.ok ? 0 : 1;
}
