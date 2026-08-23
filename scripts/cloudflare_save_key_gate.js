'use strict';

/* Narrow protected-save exception for Build 370 beta-cohort attribution.
   This is intentionally data-only: every pre-existing key must remain present, the one new key
   may contain only opaque expiring attribution, and the generated tracker/build markers must be
   present. */

const APPROVED_BUILD = 370;
const APPROVED_ADDITIONS = Object.freeze([
  'cq_bt_invite_v1',
  'cq_cohort',
  'cq_invite',
]);
const TRACKER_BEGIN = '/* CQTRACK:BEGIN — generated from website/assets/cq-track.js by scripts/sync_track.py — DO NOT EDIT HERE */';

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
  const exactAdditions = added.length === APPROVED_ADDITIONS.length &&
    added.every((value, index) => value === APPROVED_ADDITIONS[index]);
  const markers = Number(buildNumber) === APPROVED_BUILD &&
    currentSource.includes(TRACKER_BEGIN) &&
    currentSource.includes("var INVITE_KEY = 'cq_bt_invite_v1';") &&
    currentSource.includes('var INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;') &&
    /const BUILD_TAG\s*=\s*'build 370 - PLAYER-PACED NEXT-BETA LEARNING\./.test(currentSource);
  const approved = changed && removed.length === 0 && exactAdditions && markers;
  return {
    changed,
    approved,
    added,
    removed,
    detail: approved
      ? 'Build 370 approved attribution signature only: one storage key plus two query names; 0 existing keys removed'
      : 'added=[' + added.join(', ') + '] removed=[' + removed.join(', ') + '] markers=' + markers,
  };
}

module.exports = { APPROVED_BUILD, APPROVED_ADDITIONS, TRACKER_BEGIN, keys, check };
