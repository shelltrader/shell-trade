# Regression Invariants

This registry begins with only rules evidenced by existing project documentation. It does not redefine gameplay canon. Add an invariant only when its canonical wording and evidence are known.

## Existing confirmed invariants

| ID | Invariant | Evidence / canonical source | Status |
|---|---|---|---|
| INV-001 | `chart-quest.html` is the source of truth; `index.html` is its generated mirror and must not be hand-edited. | `docs/operations/README.md`; `docs/operations/GitWorkflow.md` | Confirmed on exact build-363 candidate `0d6201b`: source, root mirror, and site artifact are byte-identical at `26601a81...`. |
| INV-002 | A manual trade close is a distinct result from a stop-loss or target exit; replay/summary text must not characterize a manual close as a stop loss. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0b | Confirmed on exact build 363 through retained focused boundary/persistence coverage and Browser F3/F4. |
| INV-003 | Every resolved trade must reach the post-trade replay/summary path, including manual and hour-close paths. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0d | Confirmed for build-363 beta/Level-1 scope: genuine trade-three replay/details remains required and fail-closed until intentional close; Browser F5 passed. L4+ forced-hour semantics remain a canonical-definition/post-beta boundary. |
| INV-004 | Trade-time encounters covered by the RC pass defer rather than delete journal pages and breakable boxes. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0c | Confirmed on exact build 363 by retained focused lifecycle coverage and Browser F7, including exactly-once post-trade rewards. |
| INV-005 | Event spacing is owned by `CQBEAT`; repository documentation describes its active mode as `enforce`. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_T-005b_CQBEAT_EVENT_SPACING_2026-08-05.md` | Confirmed owner/mode; exact universal spacing rule requires canonical definition |
| INV-006 | The operations block and the canonical CQTrack source must remain synchronized with their game integration; the repository provides dedicated regression gates for this. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_CQTRACK_DRIFT_GATE_2026-08-05.md` | Confirmed |
| INV-007 | Production build identity must be observable through build metadata and artifact verification. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/STEP7_QA.md` | Local candidate portion confirmed on build-363 commit `0d6201b`: gate #8 and independent QA prove all three local artifacts at `26601a81...`. Served `/game` identity remains unverified. |
| INV-008 | The command-center/release-control package must be versioned as one explicit non-game scope, exclude nested worktrees/secrets, fail unsafe release paths closed, and support verified project-local hook activation in a clean primary clone. | `handoffs/STEP8_INTEGRATION_INVESTIGATION.md`; `handoffs/STEP8_INTEGRATION_REVIEW.md`; `handoffs/STEP8_INTEGRATION_QA.md` | Confirmed on reviewed/QA-passed integration HEAD `04227af`; promotion to `main` remains a separate production release action. |
| INV-009 | Mobile viewport state has one owner: first-session Skip/Enter controls respect physical safe-area insets and retain shared draw/hit targets of at least 44px; main-canvas backing scale is capped at DPR 2; viewport-height changes preserve terrain-relative Finn/world positions while an active movement tutorial retains sole terrain ownership. | `handoffs/BETA363_INVESTIGATION.md`; `handoffs/BETA363_REVIEW.md`; `handoffs/BETA363_QA.md` | Confirmed locally on exact build 363 by focused cases, Browser M1/M2, and fresh mobile paths at 375x667 and 390x844. Physical Safari remains Founder validation. |

## Requires canonical definition

- The local rule is now defined: `chart-quest.html`, `index.html`, and `website/game.html` must be byte-identical. The separate method for proving that the served `/game` response equals the approved local artifact remains **[REQUIRES CANONICAL DEFINITION]**.
- Exact event spacing distances, priorities, trigger zones, and validation protocol: **[REQUIRES CANONICAL DEFINITION]**
- Distinction between player-initiated manual close and forced hour-close result semantics: **[REQUIRES CANONICAL DEFINITION]**
- Current Definition of Done for a production release: **[REQUIRES CANONICAL DEFINITION]**
