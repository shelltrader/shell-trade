# Build 370 — Preview QA Evidence

**Date:** 2026-08-24  
**Status:** **FAIL — PLAYER-PACED TRADE RELEASE BLOCKER; PRODUCTION HELD**

## Candidate and Preview identity

- Runtime payload: `08d3b3c930f86ca4894ff9c26c813f78b43fb040`
- Control-plane evidence commit: `7bb0ed7185c37c39cd1ed1688e981dbd25d06eb1`
- Preview branch: `codex/beta370-player-paced-trades`
- Preview Pages deployment: `c8c138b1-3e77-45a5-bc5a-094c8f6a83f2` (success; source `7bb0ed7`)
- Served route: `https://c8c138b1.chartquest.pages.dev/game`
- Served `/game` SHA-256: `b615adb1c06558b5409111384c406053dfb9dee802eda86d7000db8b2e63103d`

The deployment and all browser observations in this record are Preview-only. No production database,
configuration, deployment, `main` push, or tester link was changed or issued.

## Executed checks

| Check | Result | Evidence |
|---|---|---|
| Preview artifact parity | PASS | Served `/game` hash equals approved Build-370 game artifact hash above. |
| Ordinary first-session route at 390×844 | PASS (scoped) | Home Market rendered the candle/trade bridge; normal movement, lessons, two prediction rounds, first setup, and first-trade guide were reached. No observed browser-console runtime error. |
| First-trade teaching | PASS (scoped) | Guide rendered its four Entry/Stop/Target/Control steps. Explicit Close worked; the scroll region accepted a scroll gesture; Escape dismissed the guide in a separate first-trade run. |
| Guide freeze | PASS (scoped) | While the guide was open, an approximately four-second visual observation showed the same displayed trade path/levels. This is not a substitute for the complete background/resume matrix. |
| **Idle player-paced behavior after guide** | **FAIL — P0** | After Escape dismissed the first-trade guide, no further input was sent. The live `CLOSE POSITION` label changed from `−2 In the red` to `−4 In the red` across a five-second idle observation. The player-facing chart then showed a live short at `−3`. A set-down phone therefore changed displayed live-trade state. |
| Survey Q1–Q7 and persistence | PASS (scoped) | Preview survey completed and showed its thank-you state. A Preview D1 receipt confirmed Q1–Q7 storage, Q6 `gamer_not_trader`, Q7 `probably`, and `ingest_source = cloudflare`; optional Q5 blank is stored as an empty string by the current client. One intentionally retained Preview QA row is evidence. |
| Founder Access deny | PASS | Preview `/founder/beta.html` without an Access JWT returned 403. |

## Not run / unverified

- Long and short win/loss traversal, manual-close/replay truth, world-event suppression across all
  terminal paths, explicit backtrack, and pause/background/resume.
- Founder Access allow, dashboard data views, and export. A valid Founder Access identity is required;
  no JWT was forged and no export was downloaded.
- Valid invite/cohort attribution. Unique invite issuance and tester links remain prohibited before
  release approval.
- Returning old service-worker client, rollback exercise, and physical-phone touch/audio/haptic/
  subjective pacing checks.

## Decision and next safe action

Do not prepare a production release manifest/lock, push `main`, deploy production, or send tester
links. Investigate and correct the idle guided-trade state change on the exact Preview behavior, then
redeploy a new Preview candidate and repeat the complete matrix. Existing Preview migration `0003`
must remain in place; it is additive and must not be reapplied or rolled back merely for a code fix.
