# Regression Invariants

This registry begins with only rules evidenced by existing project documentation. It does not redefine gameplay canon. Add an invariant only when its canonical wording and evidence are known.

## Existing confirmed invariants

| ID | Invariant | Evidence / canonical source | Status |
|---|---|---|---|
| INV-001 | `chart-quest.html` is the source of truth; `index.html` is its generated mirror and must not be hand-edited. | `docs/operations/README.md`; `docs/operations/GitWorkflow.md` | Confirmed |
| INV-002 | A manual trade close is a distinct result from a stop-loss or target exit; replay/summary text must not characterize a manual close as a stop loss. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0b | Confirmed in documented RC verification; current artifact requires verification |
| INV-003 | Every resolved trade must reach the post-trade replay/summary path, including manual and hour-close paths. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0d | Confirmed in documented RC verification; current artifact requires verification |
| INV-004 | Trade-time encounters covered by the RC pass defer rather than delete journal pages and breakable boxes. | `CHARTQUEST_RC_RELEASE_2026-08-10.md`, P0c | Confirmed in documented RC verification; current artifact requires verification |
| INV-005 | Event spacing is owned by `CQBEAT`; repository documentation describes its active mode as `enforce`. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_T-005b_CQBEAT_EVENT_SPACING_2026-08-05.md` | Confirmed owner/mode; exact universal spacing rule requires canonical definition |
| INV-006 | The operations block and the canonical CQTrack source must remain synchronized with their game integration; the repository provides dedicated regression gates for this. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_CQTRACK_DRIFT_GATE_2026-08-05.md` | Confirmed |
| INV-007 | Production build identity must be observable through build metadata and artifact verification. | `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`; `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/STEP7_QA.md` | Local candidate portion confirmed in QA-passed feature commit `31ffd6f`: gate #8 byte-checks source, root mirror, and site artifact. Served `/game` identity remains unverified. |
| INV-008 | The command-center/release-control package must be versioned as one explicit non-game scope, exclude nested worktrees/secrets, fail unsafe release paths closed, and support verified project-local hook activation in a clean primary clone. | `handoffs/STEP8_INTEGRATION_INVESTIGATION.md`; `handoffs/STEP8_INTEGRATION_REVIEW.md`; `handoffs/STEP8_INTEGRATION_QA.md` | Confirmed on reviewed/QA-passed integration HEAD `04227af`; promotion to `main` remains a separate production release action. |

## Requires canonical definition

- The local rule is now defined: `chart-quest.html`, `index.html`, and `website/game.html` must be byte-identical. The separate method for proving that the served `/game` response equals the approved local artifact remains **[REQUIRES CANONICAL DEFINITION]**.
- Exact event spacing distances, priorities, trigger zones, and validation protocol: **[REQUIRES CANONICAL DEFINITION]**
- Distinction between player-initiated manual close and forced hour-close result semantics: **[REQUIRES CANONICAL DEFINITION]**
- Current Definition of Done for a production release: **[REQUIRES CANONICAL DEFINITION]**
