# Build 370 — Player-Paced Next-Beta Local Candidate

**Date:** 2026-08-24

**Status:** **APPROVED LOCALLY — DO NOT DEPLOY OR SEND TESTER LINKS**

## Exact identity

- Branch: `codex/beta370-player-paced-trades`
- Payload commit: `08d3b3c930f86ca4894ff9c26c813f78b43fb040`
- Game/source/root/site SHA-256:
  `b615adb1c06558b5409111384c406053dfb9dee802eda86d7000db8b2e63103d`
- CQTrack SHA-256:
  `55b523b5806963a57f4ca3a94b8437b1c1fc0b10a5e55ccbba692c78bcd18c1f`
- Survey migration SHA-256:
  `3283707ade48d84447cf003377613b897bb004d836b89a5175df082930032a4d`
- Canonical/deployed BetaModel SHA-256:
  `f3ff3b9f01b68d5490318bd43978a583306784bb0760d99722a49196e1e69562`
- Deploy provenance stamp: parent `54666ab248` at `2026-08-23T17:15:17Z`
- Production status: Build 367 remains live. No Build-370 push, provider mutation, database
  mutation, deployment, or tester-data write occurred in this implementation.

## Founder direction implemented

The forced trade clock and automatic carry were removed from guided Level 1–3 trades. Finn's first
arrival at a new frontier candle is again the pace owner. A player can stop to read, look away,
answer somebody, or walk backward without price progressing independently.

No adjacent trade redesign was authorized or performed:

- visible body/wick first-touch through `CQ.priceTouched()` remains the automatic outcome owner;
- authored result, entry, stop, target, risk, reward, P&L, manual close, score, audio, recap, and save
  owners remain in place;
- automatic guided paths stay within 30–60 visible candles;
- the real deciding candle enters the path before settlement and remains in the bounded replay;
- live positions produce price terrain only: shells, boxes, Lost Wisdom, portals, mega/world events,
  cadence state, collection, and pruning remain deferred;
- pause, guide, modal, hidden/background, resize, and backtracking states cannot produce a hidden
  candle backlog or forced catch-up.

The superseding architecture record is
`CHARTQUEST_T-002_PLAYER_PACED_TRADE_SUPERSESSION_2026-08-23.md`. The original Build-298 clock
record remains historical and is explicitly marked superseded for guided pacing only.

## Next-beta learning changes

1. The first-trade guide is a scrollable DOM card with explicit Continue and Close owners; arbitrary
   canvas touches cannot advance it. Escape, reset, abort, resolution, final Continue, and Close use
   one teardown path.
2. The intro lesson receives the same bounded mobile scrolling and explicit Close treatment.
3. The Level-1 HUD names the diamond interaction: `SWIPE ↓ / SMASH 💎`.
4. Home Market selection explains candles and Finn's chart traversal before chart handoff.
5. Survey Q1–Q5 stay unchanged. Q6 records prior experience; Q7 tests a clearly labelled proposed
   one-time $19 early-access offer that is explicitly separate from the existing $24.99 full-journey
   concept.
6. Historical surveys keep nullable Q6/Q7. Old clients cannot erase stored research answers.
7. A survey draft clears only after a response-specific v2 readback proves the submitted research
   values landed; a Build-369 count-only response fails closed.
8. Cohort attribution uses `b<build>-beta<1..100>` and invite values containing exactly eight
   issuer-generated consonant-digit pairs. PII-shaped/free-form values are rejected on both sides.
9. The Access-private Founder dashboard adds prior-experience and proposed-$19 distributions,
   not-asked denominators, cohort funnel, invite reuse warning, and cohort/invite drill-down.

## Verification evidence

| Gate | Result |
|---|---|
| Full `scripts/verify.js` | 27 pass, 0 fail, 0 warn, 1 optional Puppeteer skip |
| Player-paced trade contracts | 11/11 |
| Teaching/mobile UI contracts | 5/5 |
| Seven-step survey form | 4/4 |
| Cloudflare beta service/migration/receipt | 26/26 |
| Browser tracker/queue/attribution | 15/15 |
| Founder beta dashboard | 8/8 |
| CQSAFE / protected Build-368 contracts | 27/27 |
| Artifact parity | Source, root mirror, and site byte-identical |
| Final independent adversarial review | APPROVE after two required fixes |

The final review's two required fixes are now regression-locked:

- trade-time cleanup returns before any candle/coin/uncollected-page pruning; and
- `i-SARAHLEE23456789` plus other name-like values fail the alternating generated-token grammar.

In-app Browser evidence at 390×844:

- all seven survey steps were reachable without submission;
- the proposed $19 offer distinction fit without horizontal overflow;
- the Home Market chart explanation and all market cards fit;
- the ordinary first-session path loaded and progressed into Level 1.

This is not a claim of subjective physical-phone trade acceptance. The inherited internal
`?dev=1` path can hit a pre-existing `candleAcademy` TDZ; plain tester links never use that flag.

## Hard release order

1. Export/bookmark BETA_DB and record current survey count and schema.
2. Inspect that Q6/Q7 columns are absent.
3. Apply `cloudflare/migrations/0003_beta_survey_research.sql` exactly once to BETA_DB only.
4. Prove old survey rows remain unchanged and the two nullable CHECKed columns exist.
5. Deploy exact Build-370 Functions/static bytes to Preview.
6. Verify long/short win/loss, pause/background/backtrack, manual close, replay truth, no trade-time
   rewards/events, survey v2 stored-value receipt, dashboard/exports, Access allow/deny, v16/v17
   returning service worker, and rollback.
7. Founder performs a real-phone trade-feel pass.
8. Generate ten unique invite links only after the exact candidate is approved for release.
9. Prepare the normal manifest, lock, release gate, production deployment, served fingerprint, and
   post-deploy live smoke. Run one final old-client/tail-data reconciliation.

Applying Functions before migration is forbidden: new survey writes and Founder reads can fail.
On code rollback, leave the additive nullable columns in place.

## Rollback boundary

- Before production writes: restore the prior Pages deployment; additive columns may remain.
- After new Build-370 survey writes: do not Time Travel or drop columns, because that can erase new
  Q6/Q7 answers. Forward-fix or roll back code while retaining D1 rows.
- This candidate does not weaken the separate Build-369 application/account migration,
  reconciliation, claim, and restore gates.

## Decision

**BUILD 370 LOCAL CANDIDATE APPROVED — DO NOT DEPLOY OR SEND LINKS — BETA_DB MIGRATION,
PREVIEW/PHONE QA, RELEASE CONTROLS, AND LIVE FINGERPRINT PENDING — BUILD 367 REMAINS LIVE**
