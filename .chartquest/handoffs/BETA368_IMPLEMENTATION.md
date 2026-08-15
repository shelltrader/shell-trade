# Build 368 Cloudflare Beta Analytics Implementation

## Status

**ENGINEERING IMPLEMENTATION COMPLETE — EXACT LOCAL PAYLOAD COMMIT `b8f671adf4982bb2997a4bf2f5d02207b19cfe68` — PROVIDER SETUP PENDING.**

- Branch: `codex/cloudflare-only-beta`
- Parent: `8c858aabd27aa0c4032fef9599d958735d959283`
- Three game artifacts: `4e11d01d9b5b5bc662ce153e880ce1466de529f77cef40152bbd525fb4e2b5ca`

No production provider, database, player row, account, deployment, remote ref, or served website was
changed by this implementation.

## Implemented boundary

### Public write plane

- Added a write-only Pages Function at `/api/beta-ingest` and a versioned D1 migration for
  `beta_events`, `beta_surveys`, and short-lived hashed rate-limit buckets.
- Preserved the existing event/survey payload contract, closed event vocabulary, field limits,
  idempotent event IDs, stable survey response IDs, and server-owned timestamps.
- Added exact-origin, method, batch, UTF-8 body-size, schema, and prepared-statement controls.
- Rate limiting uses a required high-entropy salt and minute-specific HMAC; raw IP addresses are not
  stored.

### Client cutover and data-loss prevention

- The canonical tracker now writes to same-origin Cloudflare first and uses the existing Supabase
  endpoint only when Cloudflare does not return an exact JSON confirmation.
- A write is acknowledged only when the response is JSON with `ok: true` and an exact `written`
  count. A 200 HTML shell, partial count, malformed JSON, timeout, or rejection preserves the queue
  and activates the fallback.
- Pending events drain in acknowledged 40-row batches until empty; a failed later batch retains
  every remaining row in the intentionally capped 200-row pending queue.
- Early boot-crash fallbacks use the same confirmed-write rule.
- The service worker cache is bumped to v15 and bypasses CacheStorage for all `/api`, `/founder`, and
  cross-origin requests. This protects founder data, authenticated account reads, and live market
  responses from stale or cross-account CacheStorage reuse.

### Private Founder dashboard

- Added a responsive dashboard at `/founder/beta` with Overview, Funnel, Players, Surveys, Raw
  Events, Builds, Devices, and Crashes views.
- It loads complete, keyset-paginated data from an API that verifies Cloudflare Access assertions
  and fails closed. The external Access application/policy is still a pre-release configuration
  gate. The dashboard preserves every survey answer verbatim, supports player search/timelines and
  time/build filters, and links to complete JSON/CSV exports.
- The existing canonical `BetaModel` is reused byte-for-byte for established funnel and cohort
  semantics.
- Missing/invalid Access, a data outage, or truncation is an explicit error; verified rows remain
  visible but marked stale after a failed refresh. The UI never substitutes a false empty dataset.
- Founder responses carry `no-store`, `Vary: *`, restrictive CSP/security headers, and formula-safe
  CSV output. This also prevents a still-controlling v14 service worker from caching private API
  rows during upgrade.

## Preserved player boundary

- No `cq_player_v1`, Journal, note, streak, mastery, milestone, pending-event, or player-ID key was
  renamed, cleared, or migrated.
- Supabase authentication, signed-in cloud saves, account UI, and historical beta rows remain in
  place.
- The production Build 367 website remains the served game until a later Release Manager action.

## Required external configuration before release

1. Create and migrate the production D1 database; bind it to Pages as `BETA_DB`.
2. Set `BETA_RATE_SALT`, `CF_ACCESS_ISSUER`, and `CF_ACCESS_AUD`.
3. Create a deny-by-default Cloudflare Access policy for both `/founder` and `/founder/*`, limited to
   the Founder identity.
4. Prove the new production dataset starts empty at the recorded cutover.
5. Run live confirmed-write, survey, denied/allowed dashboard, export, returning-service-worker, and
   rollback smoke tests before enabling invitations on Build 368.

Until those steps pass, Cloudflare primary writes intentionally fail over to Supabase rather than
discarding beta data.
