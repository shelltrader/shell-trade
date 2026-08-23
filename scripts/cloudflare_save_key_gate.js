'use strict';

/* Narrow protected-save exception for the Build 369 Cloudflare adapter.
   This is intentionally data-only: every pre-existing key must remain present, no third key may
   be added, and the canonical generated adapter/build markers must both be present. */

const APPROVED_BUILD = 369;
const APPROVED_ADDITIONS = Object.freeze([
  'cq_cloud_data_meta_v1',
  'cq_cloud_data_queue_v1',
]);
const ADAPTER_BEGIN = '/* CQCLOUDDATA:BEGIN — generated from website/assets/cq-cloud-data.js by scripts/sync_cloud_data.py — DO NOT EDIT HERE */';

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
    currentSource.includes(ADAPTER_BEGIN) &&
    currentSource.includes("var QUEUE_KEY = 'cq_cloud_data_queue_v1';") &&
    currentSource.includes("var META_KEY = 'cq_cloud_data_meta_v1';") &&
    /const BUILD_TAG\s*=\s*'build 369 - CLOUDFLARE-ONLY GAME DATA CUTOVER\./.test(currentSource);
  const approved = changed && removed.length === 0 && exactAdditions && markers;
  return {
    changed,
    approved,
    added,
    removed,
    detail: approved
      ? 'Build 369 approved additive keys only: ' + APPROVED_ADDITIONS.join(', ') + '; 0 existing keys removed'
      : 'added=[' + added.join(', ') + '] removed=[' + removed.join(', ') + '] markers=' + markers,
  };
}

module.exports = { APPROVED_BUILD, APPROVED_ADDITIONS, ADAPTER_BEGIN, keys, check };
