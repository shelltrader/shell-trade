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

  ['response-specific v2 drafts preserve the exact form step and a completed pending row', () => {
    assert.match(html, /var DRAFT_VERSION = 2/);
    assert.match(html, /if \(rawDraft\.response_id !== responseId\) rawDraft = \{\}/,
      'a draft from another playtest response must never be restored');
    assert.match(html, /version: DRAFT_VERSION,[\s\S]*response_id: responseId,[\s\S]*answers: copyAnswers\(\),[\s\S]*current_step: cur,[\s\S]*pending: copyRow\(pending\)/);
    assert.match(html, /localStorage\.setItem\(DRAFT, value\);[\s\S]*localStorage\.getItem\(DRAFT\) !== value/,
      'the pending response must be read back before a send can be trusted');
    assert.match(html, /pending = normalizePending\(rawDraft\.pending\);[\s\S]*if \(pending\) cur = steps\.length - 1/,
      'a reload must restore the complete response at the send step');
  }],

  ['the form closes only after the exact response-specific gate receipt is durably confirmed', () => {
    const matchStart = html.indexOf('function gateMatches(responseId)');
    const matchEnd = html.indexOf('function playerId()', matchStart);
    assert.ok(matchStart >= 0 && matchEnd > matchStart, 'gateMatches must be extractable');
    const matcher = html.slice(matchStart, matchEnd);
    assert.match(matcher, /state\.stage === 'survey_submitted'/);
    assert.match(matcher, /state\.surveyResponseId \|\| ''\) === responseId/);
    assert.match(matcher, /receiptResponseId\(state\.surveyReceipt\) === responseId/);

    const finishStart = html.indexOf('function finishConfirmedSubmission(row)');
    const finishEnd = html.indexOf('function attemptPending(reason)', finishStart);
    assert.ok(finishStart >= 0 && finishEnd > finishStart, 'confirmed-submission handler must be extractable');
    const finish = html.slice(finishStart, finishEnd);
    const mark = finish.indexOf('CQSurveyGate.markSubmitted(row.response_id)');
    const verify = finish.indexOf('marked = gateMatches(row.response_id)', mark);
    const failClosed = finish.indexOf('if (!marked)', verify);
    const clear = finish.indexOf('localStorage.removeItem(DRAFT)', failClosed);
    const done = finish.indexOf('showDone(false)', clear);
    assert.ok(mark >= 0 && verify > mark && failClosed > verify && clear > failClosed && done > clear,
      'exact receipt persistence must precede draft removal and the thank-you screen');
    assert.match(finish.slice(failClosed, clear), /scheduleRetry\(/,
      'a missing local receipt must keep the completed answers pending');
    assert.doesNotMatch(html, /localStorage\.(?:setItem|getItem)\(['"]cq_bt_survey_submitted['"]/,
      'the historical generic analytics flag cannot authorize the thank-you screen');
  }],

  ['network, reload, background, and worker-era recovery keep the mandatory surface fail-closed', () => {
    assert.match(html, /<script src="assets\/cq-track\.js\?v=374"><\/script>/);
    assert.match(html, /function withTimeout\(value\)[\s\S]*resolve\(ok === true\)[\s\S]*resolve\(false\)/,
      'rejection, timeout, and non-exact results must all fail closed');
    assert.match(html, /function scheduleRetry\(message\)[\s\S]*attemptPending\('backoff'\)/);
    assert.match(html, /if \(rawDraft\.version === DRAFT_VERSION\) pending = normalizePending\(rawDraft\.pending\)/);
    assert.match(html, /setTimeout\(function \(\) \{ attemptPending\('reload'\); \}, 0\)/);
    assert.match(html, /window\.addEventListener\('online',[\s\S]*attemptPending\('online'\)/);
    assert.match(html, /document\.addEventListener\('visibilitychange',[\s\S]*attemptPending\('resume'\)/);
    assert.doesNotMatch(html, /beforeunload/,
      'closing the game remains the one allowed physical exit');

    const formStart = html.indexOf('<form id="form"');
    const formEnd = html.indexOf('<!-- thank you', formStart);
    const activeForm = html.slice(formStart, formEnd);
    assert.doesNotMatch(activeForm, /\b(?:Skip|Close|Dismiss)\b/i,
      'the active mandatory form must not expose a dismiss action');
    assert.doesNotMatch(activeForm, /href\s*=/i,
      'navigation links may appear only on the post-receipt thank-you surface');
    assert.match(html, /<footer>ChartQuest closed beta · Complete all seven questions to finish<\/footer>/);
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
