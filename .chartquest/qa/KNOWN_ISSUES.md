# Known Issues

Only repository-documented issues are listed below. The severity/status reflects the cited document where available; it does not assert that the issue is currently live.

## Build-370/371 player-paced next-beta candidate

**P0 — Preview release blocker (2026-08-24):** the exact Build-370 artifact was served on Preview as
deployment `c8c138b1-3e77-45a5-bc5a-094c8f6a83f2` (source `7bb0ed7`, `/game` SHA-256
`b615adb1...`). In a fresh ordinary Level-1 route at 390×844, the first-trade guide was dismissed
with Escape. With no subsequent player input, the live `CLOSE POSITION` state changed from `−2 In the
red` to `−4 In the red` during five seconds of idle time. The required player-paced rule says an idle
or set-down phone must not advance guided-trade price/outcome. This Preview observation overrides the
prior local-code conclusion for release purposes. Evidence: `handoffs/BETA370_PREVIEW_QA.md`.

**Local remediation exists; issue remains open pending served proof:** Build 371 payload
`3019058b32c6acddc8fc5530569f24d95c76a98f` gates every guided movement action to one production
touching-candle boundary, cancels stale intent on guide/background/input lifecycle changes, restores
free roam after manual Close, and seeds the entry price cursor even when no future suffix exists.
The three game artifacts match at `3224c603...`; pacing is 13/13, teaching UI 5/5, the full gate is
27/0/0/1, and independent re-review APPROVED. This does not close the P0 until exact Build 371 is
served on Preview and the idle/P&L, action-step, background/resume, backtrack, terminal, and physical
phone paths pass. Evidence: `handoffs/BETA371_LOCAL_REPAIR_CANDIDATE.md`.

The additive Preview-only `0003_beta_survey_research.sql` migration remains valid: it was applied once
after backup/bookmark and inspection, leaving six historical rows unchanged and both nullable checked
columns present. Survey Q1–Q7 receipt was exercised on Preview. A code rollback must leave the
additive columns in place. See `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`.

The guide Close and Escape controls, ordinary Home Market bridge, and survey v2 storage path passed
their limited Preview checks. Unauthenticated Founder access correctly denied. These do not close the
remaining founder-Allow/dashboard/export, valid invite attribution, returning-service-worker,
long/short terminal, pause/background/backtrack, rollback, or physical-phone gates.

Build 370 was published only to its non-production branch and Preview; Build 371 is local only at
this record. `main` and production remain Build 367. Do not send cohort links or start release
controls until the P0 is closed by the full matrix.

## Build-369 complete Cloudflare migration candidate

No known local code P0 remains on exact payload commit `df0053c` plus D1 compatibility follow-up
`1b8f4e5` and preview runtime follow-ups `c0f0b5a`/`4298217` (game artifact `201682c4...`, APP schema `8d2be65b...`). Independent migration/runtime
review approved after the Functions route,
content-key, versioning, Journal pagination, coherent APP_DB snapshot, mastery-owner, and source
export completeness defects were fixed. Payload regression evidence passed 26/0/0/1; the unchanged
importer remains 27/27; current preview HEAD `4298217` passes app 31/31 and verifier 24/0/0/3 (two
game-diff N/A checks plus the optional Puppeteer skip).

Production release remains blocked. A complete source-generated export for Supabase project
`ymxppzhczvmiuoncuqqu` has not been delivered, so recent tester events/surveys and any historical
account data are not yet visible or analyzed in Cloudflare. The Release Manager observed the
identity-verification flow and sent the export request in case `SU-452541`; provider processing and
current source row presence/count are unverified. Do not infer empty tables from missing access and
do not reset/delete rows.

The Release Manager observed Cloudflare database resources, Pages bindings, encrypted secret names,
and Founder Access resources in the signed-in dashboard on 2026-08-23; repository tests do not
independently prove that external state. The exact `0002_app.sql` schema was applied to a fresh empty
preview APP database and structural inventory/FK/empty checks passed; the empty preview beta database
also matches its expected table/trigger/index counts. Feature HEAD `4298217` then deployed as preview
`297c2141`; one disposable account returned HTTP 201 with the expected identity/profile/session/
receipt/outbox state. Exact cleanup restored six touched APP counts to zero with zero FK violations.
This closes core account creation, but not the full preview matrix. Production schema proof, source
import and independent D1 reconciliation, account claim/restore, remaining app routes, survey,
Founder Access/dashboard/export, returning-service-worker, release manifest/lock/gate, served
fingerprint, and rollback evidence remain release gates. Build 367 remains live.

The private dashboard is implemented and locally verified across all beta/application datasets, but
its improvement report cannot truthfully describe the real beta cohort until the historical import
is reconciled. APP_DB loads are snapshot-consistent; beta events/surveys are separately validated
keyset feeds and are not an atomic cross-database snapshot. A formal report therefore requires both
protected exports at one recorded cutoff. This work did not modify existing player IDs, game saves,
milestone latches, pending queues, accounts, or any source-provider row.

## Build-366 Founder final cosmetic-retest readiness

No known P0 remains for local Founder cosmetic retesting on exact candidate payload commit `19c4434`
(game artifact `fdbf6980...`, Browser bridge `477cd8b0...`). Independent review approved,
exact-byte QA passed, and the expanded in-app Browser matrix passed 34/34. The inherited upright
Finn pose in the defeat cinematic remains explicit beta-deferred art debt; only the necklace repair
is claimed. Production verification remains separate and blocked.

## Historical Build-365 Founder final mobile-retest readiness

No known P0 remains for local Founder mobile retesting on exact candidate payload commit `7b3679c`
(game artifact `f80cecb3...`, Browser bridge `114d91e6...`). PM/CTO review approved, exact-byte QA
passed, and the expanded in-app Browser matrix passed 31/31. Production verification remains separate
and blocked.

## P0 — Release blocker

| Issue | Status | Evidence |
|---|---|---|
| The dated RC release record says **DO NOT SHIP** until production playthrough/cache/fingerprint evidence is complete. The record also contains conflicting claims about the deployed build. | Production-release blocker only; local Founder mobile-retest gate is closed on build 365 | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/BETA365_QA.md` |
| Routine `scripts/verify.js` did not byte-compare `website/game.html` with the source and root mirror. | Resolved in the current build-365 candidate; gate #8 and parity fixtures passed | `handoffs/STEP7_QA.md`; `handoffs/BETA365_QA.md` |
| Step 6B controls and the durable `.chartquest` command center were absent from the base commit and not reproducible in a fresh clone. | Resolved and present in the build-365 candidate lineage; production promotion remains blocked by the freeze | `handoffs/STEP8_INTEGRATION_QA.md`; `handoffs/BETA365_COMPLETE.md` |
| Deployment smoke does not yet prove that the served `/game` response is the exact approved local artifact. | Unresolved release-verification gap; outside Step 7 local-check scope | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/STEP7_QA.md` |

## Resolved in build 363

| Issue | Status | Evidence |
|---|---|---|
| First-session Skip/Enter controls did not own physical safe-area geometry; viewport-height changes could move terrain without Finn and derived terrain anchors. | Resolved for the bounded local Founder mobile-retest seam on exact build 363 | `handoffs/BETA363_INVESTIGATION.md`; `handoffs/BETA363_REVIEW.md`; `handoffs/BETA363_QA.md` |

## Resolved in build 364

| Issue | Status | Evidence |
|---|---|---|
| Setup formation incorrectly disabled box smash and Lost Wisdom collection; fast body overlap could miss. | Resolved on exact build 364 with real-trade-only focus plus swept/body interaction | `handoffs/BETA364_INVESTIGATION.md`; `handoffs/BETA364_QA.md` |
| FIRST WIN used a generic system trophy and loose text stack below the Founder quality bar. | Resolved on exact build 364 with one authored vector milestone | `handoffs/BETA364_IMPLEMENTATION.md`; `handoffs/BETA364_QA.md` |
| The Founder first-trade preview was forced muted and the authored path was emotionally flat. | Resolved on exact build 364 with a music-on preview, dedicated score route, and four-act path | `handoffs/BETA364_INVESTIGATION.md`; `handoffs/BETA364_QA.md` |

## Resolved in build 365

| Issue | Status | Evidence |
|---|---|---|
| A box placed ahead could survive beyond a later trade portal and become unreachable during the trade. | Resolved on exact build 365 with atomic portal-corridor deferral and quota restoration | `handoffs/BETA365_INVESTIGATION.md`; `handoffs/BETA365_QA.md` |
| Replay/recap Finn could stop visually short of the planned TP/SL exit line. | Resolved on exact build 365 with four-direction exact crossing geometry and a readable terminal hold | `handoffs/BETA365_IMPLEMENTATION.md`; `handoffs/BETA365_QA.md` |

## P1 — Major issue

| Issue | Status | Evidence |
|---|---|---|
| Level 1 is not owned by `LEVEL_FLOW`; its order is hard-coded across several sites. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| Boss 1 `confirm` and `whowon` rounds are documented as degrading to bare one-line objectives without a LessonChart scene. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |

## P2 — Polish

| Issue | Status | Evidence |
|---|---|---|
| Independent `BUILD_TAG` regex parsers remain rather than a single `CQOPS.build` owner. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| `_anyBlockingUI()` does not check `trade`; the document reports several hand-rolled trade-in-progress predicates. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| CQBEAT header documentation is stale relative to documented `MODE='enforce'`. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |

## P3 — Post-beta

| Issue | Status | Evidence |
|---|---|---|
| `result:'manual'` is documented as conflating player manual close with forced hour-close. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| The Level-5+ long RISK/TARGET trade chip did not receive the definitive rendered four-height Browser matrix used for the Level-1 closed beta. | Post-beta geometry follow-up; not a Level-1 Founder-test blocker | `handoffs/BETA360_BROWSER_QA.md` |

## Founder/release validation boundaries

- Physical Safari notch/Dynamic Island and collapsing-address-bar behavior, real touch feel,
  audio/haptics, sustained DPR/GPU performance, heat/battery, and subjective readability require
  representative-device Founder testing.
- Global HUD/modal safe-area migration, historical small controls, secondary canvases, and the
  `/play` wrapper/PWA manifest/service-worker/cache topology remain post-beta/release follow-ups.
- Successful online survey telemetry was not exercised because the local harness blocks external
  connections by design.
- Served production fingerprint, fresh-cache behavior, release manifest/lock/gate, and account-level
  freeze changes remain future Release Manager work.
