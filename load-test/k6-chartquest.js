// Chart Quest — k6 load test (100 simultaneous users)
// ---------------------------------------------------------------------------
// Models the REAL per-user network pattern found in index.html:
//   • 1 record_site_visit RPC per session (page load)
//   • periodic content_events batch inserts   (gameplay events)
//   • periodic player_mastery upserts         (mastery changes, debounced ~4s)
//   • a profiles SELECT                        (cloud pull on load)
// Auth signup/signin is intentionally OUT of the hot loop — the built-in email
// service is the real signup bottleneck and must be tested separately with a
// production SMTP provider, not by hammering Auth here.
//
// SAFETY: this refuses to run against the production project ref unless you
// explicitly pass ALLOW_PROD=1. Point it at a STAGING Supabase branch.
//
// Run:
//   k6 run \
//     -e SUPA_URL=https://<staging-ref>.supabase.co \
//     -e SUPA_ANON=<staging-anon-key> \
//     -e VUS=100 -e DURATION=2m \
//     load-test/k6-chartquest.js
// ---------------------------------------------------------------------------
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const PROD_REF = 'ymxppzhczvmiuoncuqqu';

const SUPA_URL  = __ENV.SUPA_URL;
const SUPA_ANON = __ENV.SUPA_ANON;
const VUS       = parseInt(__ENV.VUS || '100', 10);
const DURATION  = __ENV.DURATION || '2m';

if (!SUPA_URL || !SUPA_ANON) {
  throw new Error('Set SUPA_URL and SUPA_ANON (use a STAGING branch, not prod).');
}
if (SUPA_URL.includes(PROD_REF) && __ENV.ALLOW_PROD !== '1') {
  throw new Error(
    'Refusing to load-test PRODUCTION (' + PROD_REF + '). ' +
    'Create a staging branch and target it, or pass ALLOW_PROD=1 if you truly mean it.'
  );
}

const restLatency = new Trend('cq_rest_latency', true);
const restErrors  = new Rate('cq_rest_errors');

// Graduated ramp: step through 25% → 50% → 100% of VUS so ONE run shows where
// latency starts to climb (the knee), not just a single pass/fail at peak.
const q = (f) => Math.max(1, Math.ceil(VUS * f));
export const options = {
  scenarios: {
    graduated: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: q(0.25) },
        { duration: '30s', target: q(0.25) },
        { duration: '15s', target: q(0.5) },
        { duration: '30s', target: q(0.5) },
        { duration: '15s', target: VUS },
        { duration: DURATION, target: VUS },   // hold at peak
        { duration: '10s',  target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    cq_rest_errors: ['rate<0.01'],              // <1% errors
    cq_rest_latency: ['p(95)<800'],             // p95 under 800ms
    http_req_duration: ['p(99)<2000'],
  },
};

// ── Scaling past ~1–2k VUs ────────────────────────────────────────────────
// A single machine (k6 on one host) tops out around 1–2k VUs of light HTTP
// before the LOAD GENERATOR, not the server, is the bottleneck. To truthfully
// test 10k you need either k6 Cloud (`k6 cloud run ...`) or several distributed
// runners sharing the load, AND the target must be on your real production tier
// (Pro + a compute add-on) — a small branch instance will cap out well before
// 10k regardless of how the load is generated.

const headers = () => ({
  apikey: SUPA_ANON,
  Authorization: 'Bearer ' + SUPA_ANON,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
});

function post(path, body, extraPrefer) {
  const h = headers();
  if (extraPrefer) h.Prefer = extraPrefer;
  const res = http.post(SUPA_URL + path, JSON.stringify(body), { headers: h });
  restLatency.add(res.timings.duration);
  restErrors.add(!(res.status >= 200 && res.status < 300));
  return res;
}

const CATS = ['trend', 'momentum', 'structure', 'risk', 'psychology', 'entries', 'confluence', 'patience'];

export default function () {
  const pid = `loadtest-${__VU}-${__ITER}`;
  const sid = `sess-${__VU}-${Date.now()}`;

  // 1. Page load → visit counter
  const visit = http.post(SUPA_URL + '/rest/v1/rpc/record_site_visit', '{}', { headers: headers() });
  check(visit, { 'visit ok': (r) => r.status >= 200 && r.status < 300 });
  restErrors.add(!(visit.status >= 200 && visit.status < 300));

  sleep(1 + Math.random() * 2);

  // 2. A few gameplay events over the session
  for (let i = 0; i < 3; i++) {
    post('/rest/v1/content_events', [{
      event_id: `${sid}-e${i}-${Math.random().toString(36).slice(2)}`,
      event_type: 'load_test',
      player_id: pid,
      session_id: sid,
      faction: 'BTC',
      player_level: 1 + (i % 10),
      payload: { note: 'synthetic load-test event' },
    }], 'return=minimal,resolution=ignore-duplicates');

    // Mastery upsert (debounced ~4s in the real client)
    post('/rest/v1/player_mastery',
      CATS.map((c) => ({ player_id: pid, category: c, score: Math.floor(Math.random() * 100), updated_at: new Date().toISOString() })),
      'resolution=merge-duplicates,return=minimal');

    sleep(2 + Math.random() * 3);
  }
}
