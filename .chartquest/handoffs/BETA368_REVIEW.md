# Build 368 Independent Review

## Verdict

**APPROVE THE LOCAL CODE/RUNTIME CANDIDATE. HOLD PRODUCTION FOR CLOUDFLARE CONFIGURATION.**

This approval is bound to payload commit
`b8f671adf4982bb2997a4bf2f5d02207b19cfe68`, whose three game artifacts are byte-identical at
`4e11d01d9b5b5bc662ce153e880ce1466de529f77cef40152bbd525fb4e2b5ca`.

## Requirement and scope review

- The change is limited to the new beta event/survey plane, private Founder reporting, client
  routing/receipts, service-worker privacy, disclosures, tests, and Build 368 identity.
- Protected gameplay, trade, boss, lesson, movement, Finn, reward, player-save, and signed-in
  account/cloud-save implementations are unchanged.
- Supabase remains for accounts, cloud saves, historical beta rows, and the temporary telemetry
  fallback. The implementation makes no false claim of complete provider removal.
- The fresh D1 design gives new beta telemetry a clean cutover boundary without deleting any old
  player or survey record.

## Security and data-integrity review

- Public ingest is write-only, exact-origin, bounded, validated, idempotent, prepared-statement
  based, rate-limited, and fail-closed when D1, salt, or a valid receipt is missing.
- Founder reads require a verified Cloudflare Access RS256 assertion in middleware and again require
  the authenticated middleware identity in the API. No public D1 read route or static D1 snapshot
  exists.
- Private responses are non-cacheable even during the v14-to-v15 service-worker transition and have
  restrictive browser security headers.
- Cloudflare/Supabase receipt validation and batched queue draining close the identified silent-loss
  paths.
- JSON and CSV exports are Access-only; CSV values are quoted and spreadsheet-formula neutralized.

## Independent evidence

- Cloudflare service/Access/D1 contracts: **23/23 PASS**.
- Tracker/receipt/queue/service-worker contracts: **7/7 PASS**.
- Founder dashboard model and failure-state contracts: **5/5 PASS**.
- Focused gameplay/regression suite: **27/27 PASS**.
- Full verifier: **26 pass, 0 fail, 0 warn, 1 allowed optional Puppeteer skip**.
- D1 migration applied under SQLite with `integrity_check=ok`.
- Sync gates and game-artifact byte parity pass.
- Targeted credential/private-key scan and diff integrity pass.

## Release conditions

The review found no remaining code-level must-fix. It does not verify external Cloudflare state.
Production approval remains held until the database, bindings, secrets, Access policy, empty-cutover
proof, and live write/read/export/service-worker smoke are complete. Build 367 remains live in the
meantime.

## Follow-up boundaries

- Historical Supabase import must preserve newer Cloudflare survey answers and reconcile cohort
  timestamps; it is not part of this candidate.
- Existing testers' already-latched milestones will not reappear in the fresh D1 until history is
  imported.
- The current per-IP limit is appropriate for the 15-person beta, not a broad public launch.
