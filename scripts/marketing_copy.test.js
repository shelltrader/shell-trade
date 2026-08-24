#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const game = read('chart-quest.html');
const home = read('website/index.html');
const play = read('website/play.html');
const bosses = read('website/bosses.html');
const sharedSite = read('website/assets/site.js');
const manifestText = read('website/manifest.webmanifest');
const serviceWorker = read('website/sw.js');
const manifest = JSON.parse(manifestText);
const publicCopy = [home, play, bosses, sharedSite, manifestText].join('\n');

const tests = [
  ['hero names the approved pain point and keeps the free-play action', () => {
    assert.match(home, /ONE INCOME DOESN’T FEEL LIKE ENOUGH ANYMORE\. LEARN THE CHART BEFORE YOU RISK REAL MONEY\./);
    assert.match(home, /<a class="btn btn-primary" href="play\.html">▶ Play Free<\/a>/);
  }],

  ['homepage explains Bitcoin-first learning without claiming markets behave alike', () => {
    assert.match(home, /Finn teaches you the foundations as you play, starting with Bitcoin\./);
    assert.match(home, /share a candlestick language—but each market moves for different reasons\./);
    assert.match(home, /Same candlestick language\. Different market behavior\./);
    assert.match(home, /ChartQuest starts with Bitcoin so you can learn one foundation without the noise\./);
  }],

  ['reachable public copy contains no superseded sameness or friction straplines', () => {
    assert.doesNotMatch(publicCopy, /Free\s*·\s*No download\s*·\s*No sign-up/i);
    assert.doesNotMatch(publicCopy, /Free\s*·\s*no download/i);
    assert.doesNotMatch(publicCopy, /The same chart that moves/i);
    assert.doesNotMatch(publicCopy, /Learn to read one, and you can read them all/i);
    assert.doesNotMatch(publicCopy, /Dive inside real (?:market |candlestick )?charts?/i);
    assert.doesNotMatch(publicCopy, /Run across a real candlestick chart/i);
    assert.doesNotMatch(publicCopy, /Run(?: and jump)? (?:your way )?across a real market/i);
    assert.doesNotMatch(publicCopy, /learn to read a real chart/i);
  }],

  ['public metadata describes practice honestly and remains valid', () => {
    assert.match(home, /Bitcoin-first practice chart before risking real money/);
    assert.equal(typeof manifest.description, 'string');
    assert.match(manifest.description, /candlestick charts/i);
    assert.match(manifest.description, /starting with Bitcoin/i);
    assert.match(manifest.screenshots[0].label, /Bitcoin-first practice chart/i);
    assert.match(play, /run across a Bitcoin-first practice chart and learn candlestick foundations/i);
    assert.match(home, /Run and jump across a Bitcoin-first practice chart/i);
  }],

  ['shared and mobile calls to action use the risk-aware support line', () => {
    assert.match(home, /<div class="sc-sub">Learn before you risk real money<\/div>/);
    assert.match(bosses, /<div class="sc-sub">Learn before you risk real money<\/div>/);
    assert.match(sharedSite, /candlestick practice charts/);
  }],

  ['the in-game completion ceremony promises the actual seven-question survey', () => {
    assert.match(game, /Next: 7 quick questions\. Under two minutes\./);
    assert.doesNotMatch(game, /Next: 5 quick questions/);
  }],

  ['the legacy market fallback describes a cosmetic practice-chart choice truthfully', () => {
    assert.match(game, /Your selection changes the chart's <strong[^>]*>visual identity<\/strong>/);
    assert.match(game, /Every practice chart keeps the same lesson path and candlestick foundations\./);
    assert.doesNotMatch(game, /which <strong[^>]*>real live market<\/strong> you'll trade on/);
  }],

  ['returning visitors receive the changed copy and manifest through a new cache generation', () => {
    assert.match(serviceWorker, /const CACHE = ['"]chartquest-site-v18['"]/);
    assert.match(serviceWorker, /['"]\.\/assets\/site\.js['"]/);
    assert.match(serviceWorker, /['"]\.\/manifest\.webmanifest['"]/);
    assert.match(serviceWorker, /v17 → v18 \(build 373\)/);
  }],
];

let passed = 0;
for (const [name, test] of tests) {
  try {
    test();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.stack || String(error));
  }
}

console.log(`\n${passed}/${tests.length} public marketing-copy contracts passed`);
process.exit(passed === tests.length ? 0 : 1);
