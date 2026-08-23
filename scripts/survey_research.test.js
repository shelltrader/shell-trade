#!/usr/bin/env node
'use strict';

/* Focused, dependency-free contracts for the Build 370 survey research form. */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'website', 'survey.html');
const html = fs.readFileSync(file, 'utf8');

const tests = [
  ['seven-step form keeps the original five questions in order', () => {
    const steps = [...html.matchAll(/<section class="step(?: on)?" data-step="(\d+)">/g)]
      .map(match => Number(match[1]));
    assert.deepEqual(steps, [1, 2, 3, 4, 5, 6, 7]);
    assert.match(html, /id="scale"[\s\S]*id="q2"[\s\S]*id="q3"[\s\S]*id="cont"[\s\S]*id="q5"/);
    assert.match(html, /<title>ChartQuest Beta — 7 quick questions<\/title>/);
    assert.match(html, /id="stepN">1 \/ 7</);
  }],

  ['experience and exact-price choices use closed pseudonymous values', () => {
    for (const value of ['new_to_both', 'gamer_not_trader', 'trader_not_gamer', 'familiar_with_both']) {
      assert.match(html, new RegExp(`id="experience"[\\s\\S]*data-v="${value}"`));
    }
    for (const value of ['definitely', 'probably', 'unsure', 'probably_not', 'definitely_not']) {
      assert.match(html, new RegExp(`id="purchase"[\\s\\S]*data-v="${value}"`));
    }
    assert.match(html, /one <b>\$19 payment<\/b> — not a subscription/);
    assert.match(html, /separate from the \$24\.99 full-journey concept/i,
      'the proposed $19 research offer must not be presented as validation of the existing full-journey concept');
    assert.doesNotMatch(html, /data-v="[^"\n]*(?:@|\.com)/i);
  }],

  ['new answers are draft-restored, required, and sent with q1-q5', () => {
    assert.match(html, /experience_level: null, purchase_intent_19: null/);
    assert.match(html, /bindChoices\(experience, 'experience_level', 5\)/);
    assert.match(html, /bindChoices\(purchase, 'purchase_intent_19', null\)/);
    assert.match(html, /paintChoice\(experience, answers\.experience_level\)/);
    assert.match(html, /paintChoice\(purchase, answers\.purchase_intent_19\)/);
    assert.match(html, /EXPERIENCE_VALUES\.indexOf\(saved\.experience_level\) >= 0/);
    assert.match(html, /PURCHASE_VALUES\.indexOf\(saved\.purchase_intent_19\) >= 0/);
    assert.match(html, /if \(idx === 4\) return true;[\s\S]*if \(idx === 5\) return answers\.experience_level != null;[\s\S]*if \(idx === 6\) return answers\.purchase_intent_19 != null;/);
    assert.match(html, /q1_rating: answers\.q1,[\s\S]*q2_hook: answers\.q2\.trim\(\),[\s\S]*q3_improvement: answers\.q3\.trim\(\),[\s\S]*q4_continue: answers\.q4,[\s\S]*q5_anything: \(answers\.q5 \|\| ''\)\.trim\(\),[\s\S]*experience_level: answers\.experience_level,[\s\S]*purchase_intent_19: answers\.purchase_intent_19/);
    assert.match(html, /seconds_taken: Math\.min\(86400, Math\.max\(0,/,
      'a survey left open for more than 24 hours must remain submit-safe');
    assert.match(html, /\[data-next\], button\[type="submit"\]/);
  }],

  ['every inline script remains syntactically valid', () => {
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
      .map(match => match[1])
      .filter(source => source.trim());
    assert.ok(scripts.length >= 2);
    for (const source of scripts) assert.doesNotThrow(() => new Function(source));
  }],
];

let failed = 0;
for (const [name, run] of tests) {
  try { run(); process.stdout.write(`PASS  ${name}\n`); }
  catch (error) { failed += 1; process.stderr.write(`FAIL  ${name}\n${error.stack || error}\n`); }
}

process.stdout.write(`\n${tests.length - failed}/${tests.length} survey research tests passed\n`);
process.exitCode = failed ? 1 : 0;
