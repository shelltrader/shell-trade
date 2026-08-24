'use strict';

/* Narrow protected-save exceptions for founder-approved additive changes. Every pre-existing
   textual key must remain present, each build may add only its exact reviewed signature, and
   build-specific source markers must prove that the expected owner—not an unrelated edit—made it.

   Build 373's scanner delta contains one genuinely new storage key (`cq_beta_flow_v1`) plus four
   `cq_bt_*` event-once keys that already existed at runtime through CQTrack's generated prefix but
   become literal strings in the recovery reader. Treating that exact literalisation as additive is
   intentional; removing or renaming any established key still fails closed. */

const TRACKER_BEGIN = '/* CQTRACK:BEGIN — generated from website/assets/cq-track.js by scripts/sync_track.py — DO NOT EDIT HERE */';
const APPROVALS = Object.freeze({
  370: Object.freeze({
    additions: Object.freeze(['cq_bt_invite_v1', 'cq_cohort', 'cq_invite']),
    label: 'Build 370 approved attribution signature only: one storage key plus two query names; 0 existing keys removed',
    markers(source) {
      return source.includes(TRACKER_BEGIN) &&
        source.includes("var INVITE_KEY = 'cq_bt_invite_v1';") &&
        source.includes('var INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;') &&
        /const BUILD_TAG\s*=\s*'build 370 - PLAYER-PACED NEXT-BETA LEARNING\./.test(source);
    },
  }),
  373: Object.freeze({
    additions: Object.freeze([
      'cq_beta_flow_v1',
      'cq_bt_boss_defeated',
      'cq_bt_journal_discovery_completed',
      'cq_bt_journal_discovery_started',
      'cq_bt_survey_submitted',
    ]),
    label: 'Build 373 approved continuity signature only: one new ledger key plus four established CQTrack once-key literals; 0 existing keys removed',
    markers(source) {
      return /const BUILD_TAG\s*=\s*'build 373 - BETA FEEDBACK RECOVERY\./.test(source) &&
        source.includes('/* BETA_FLOW_CONTINUITY_V1:BEGIN') &&
        source.includes('/* BETA_FLOW_CONTINUITY_V1:END */') &&
        /var KEY\s*=\s*'cq_beta_flow_v1';/.test(source) &&
        source.includes("CQBetaFlow.advance('survey_due')");
    },
  }),
});
const APPROVED_BUILD = 373;
const APPROVED_ADDITIONS = APPROVALS[APPROVED_BUILD].additions;

function keys(source) {
  return [...new Set(String(source || '').match(/\bcq_[a-z0-9_]+\b/g) || [])].sort();
}

function difference(left, right) {
  const other = new Set(right);
  return left.filter(value => !other.has(value));
}

function check(headSource, currentSource, buildNumber) {
  const before = keys(headSource);
  const after = keys(currentSource);
  const added = difference(after, before);
  const removed = difference(before, after);
  const changed = added.length > 0 || removed.length > 0;
  const approval = APPROVALS[Number(buildNumber)] || null;
  const expected = approval ? approval.additions : [];
  const exactAdditions = added.length === expected.length &&
    added.every((value, index) => value === expected[index]);
  const markers = !!approval && approval.markers(currentSource);
  const approved = changed && removed.length === 0 && exactAdditions && markers;
  return {
    changed,
    approved,
    added,
    removed,
    detail: approved
      ? approval.label
      : 'added=[' + added.join(', ') + '] removed=[' + removed.join(', ') + '] markers=' + markers,
  };
}

module.exports = { APPROVALS, APPROVED_BUILD, APPROVED_ADDITIONS, TRACKER_BEGIN, keys, check };
