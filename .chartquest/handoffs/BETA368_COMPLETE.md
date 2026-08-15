# Build 368 Local Candidate Adjudication

## Decision

**BUILD 368 LOCAL ENGINEERING CANDIDATE APPROVED — DO NOT DEPLOY — CLOUDFLARE D1/ACCESS CONFIGURATION AND LIVE SMOKE PENDING — BUILD 367 REMAINS LIVE.**

## Exact candidate

- Branch: `codex/cloudflare-only-beta`
- Parent: `8c858aabd27aa0c4032fef9599d958735d959283`
- Runtime payload commit: `b8f671adf4982bb2997a4bf2f5d02207b19cfe68`
- Game/source/root/site SHA-256:
  `4e11d01d9b5b5bc662ce153e880ce1466de529f77cef40152bbd525fb4e2b5ca`
- Browser bridge SHA-256:
  `cf9c0cadc8b3cd7c45d4a411c475ba789893d5a8e0712e177fc39b352addd7c0`
- Browser harness SHA-256:
  `bffb1cd227314642d23f8b913de100855a29b7188e9f75b2c77c84e629c76dd1`

## Adjudication basis

- Independent runtime/data-boundary review: **APPROVE**.
- Independent security review: **APPROVE**, no remaining code-level must-fix.
- Founder dashboard visual/browser QA: **PASS** on desktop and mobile with all eight views, complete
  exports, player search/timelines, every survey answer, and fail-closed denial/outage behavior.
- Contract/regression evidence: Cloudflare 23/23; client 7/7; dashboard 5/5; CQSAFE 27/27;
  release controls 15/15; artifact parity 5/5; Boss 1 audio 5/5; verifier 26/0/0/1.
- Exact game Browser evidence: 37/37 and immediate same-iframe repeat 74/74 cumulative, no captured
  runtime/console error.

## What this decision means

The code is ready to become the next production candidate after external Cloudflare setup. The
intended fresh D1 dataset can become the clean post-cutover beta baseline only after the
empty-baseline gate passes. Existing accounts, saves, player IDs, and historical Supabase rows have
not been changed or deleted.

Supabase is intentionally still required for signed-in accounts/cloud saves, historical beta data,
and the temporary telemetry fallback. The private dashboard will show Cloudflare D1 data after
cutover; Build 367/earlier history will appear only after a later authenticated import.

## Hard release gates still open

1. Create/migrate production D1 and bind `BETA_DB`.
2. Set `BETA_RATE_SALT`, `CF_ACCESS_ISSUER`, and `CF_ACCESS_AUD`.
3. Create the deny-by-default Founder Access policy for `/founder` and `/founder/*`.
4. Prove the production D1 baseline is empty at the recorded cutover.
5. Run live write, survey, dashboard allow/deny, full export, v14-upgrade privacy, returning-player,
   and rollback smoke tests.
6. Create the normal release manifest/lock/gate and obtain the separate Build 368 deployment
   authorization before pushing `main`.

Until all six close, Build 367 remains the serving production build and beta collection is
unaffected.
