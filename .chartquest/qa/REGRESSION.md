# Regression Tracking

Record one row per verified regression check. Do not mark a behavior passed without evidence.

| Invariant ID | Test | Expected behavior | Actual behavior | Status | Build | Evidence |
|---|---|---|---|---|---|---|
| INV-001 | Step 7 scope and game-artifact diff checks | `chart-quest.html` remains source of truth and no generated game artifact is modified by this tooling ticket. | Only three tooling files changed; source, root mirror, and site artifact had no candidate diff. | Pass | `31ffd6f` | `handoffs/STEP7_REVIEW.md`; `handoffs/STEP7_QA.md` |
| INV-007 | Three-artifact parity fixture matrix and full regression gate | Equal local artifacts pass; root/site mismatch or missing paths fail nonzero and identify the exact path. | 5/5 fixtures passed; full gate 20 pass, 0 fail, 0 warn, 3 allowed skips; dirty-primary drift failed and named both paths. | Pass | `31ffd6f` | `handoffs/STEP7_QA.md`; `handoffs/STEP7_COMPLETE.md` |
| INV-008 | Step 8 clean-integration and fresh-clone acceptance matrix | Only approved control files enter the branch; unsafe main/legacy paths fail closed; standalone primary clone activates its own local hook; tests leave no state. | All 10 acceptance criteria passed; 15/15 release controls, 5/5 parity, 20/0/0 regression, exclusions/modes/bootstrap/cleanup passed. | Pass | `04227af` | `handoffs/STEP8_INTEGRATION_REVIEW.md`; `handoffs/STEP8_INTEGRATION_QA.md`; `handoffs/STEP8_COMPLETE.md` |
| INV-019 | Build-373 opening-sequence plus retained pacing contracts | Automatic opening is W-L-W; trade two is the sole stop-protected First Loss; trade three recovers; old Level-2 injector is disabled; “2–1” is not R:R; visible first-touch/player pacing remains intact. | Feedback/recovery 10/10 and retained pacing 13/13 passed on exact runtime payload; independent final review approved. | Pass | `291d384` | `scripts/build373_feedback.test.js`; `scripts/trade_pacing.test.js`; `handoffs/BETA373_FEEDBACK_RECOVERY_LOCAL_CANDIDATE.md` |
| INV-020 | Restart/survey/reward safety plus protected-key gate | Resume starts at the next unpaid safe boundary; completed rewards cannot duplicate; survey stays due until confirmed receipt; only one new ledger key is added and no established key is removed/renamed. | Restart/reward safety 7/7, feedback/recovery 10/10, and save-key gate 4/4 passed; exact delta is one new key plus four established CQTrack once literals. | Pass | `291d384` | `scripts/beta_restart_safety.test.js`; `scripts/build373_feedback.test.js`; `scripts/cloudflare_save_key_gate.test.js`; `handoffs/BETA373_FEEDBACK_RECOVERY_LOCAL_CANDIDATE.md` |
| INV-021 | Build-374 response-specific mandatory-survey adversarial matrix | An owed survey owns all ChartQuest routes and survives supported navigation/reload/background/offline failure until the exact current response receipt is confirmed; generic/stale evidence cannot close it and browser close remains allowed. | Mandatory 15/15, survey 7/7, restart/reward 8/8, save-key 4/4, and full verifier 30/0/0/1 passed. Mobile Browser restored exact progress and kept the failed receipt locked. | Pass | `1f10dfc` | `scripts/mandatory_survey.test.js`; `scripts/survey_research.test.js`; `scripts/beta_restart_safety.test.js`; `handoffs/BETA374_MANDATORY_SURVEY_LOCAL_CANDIDATE.md` |

## Status vocabulary

- **Pass** — expected behavior was observed and evidence is linked.
- **Fail** — actual behavior differs from expected behavior.
- **Blocked** — execution could not proceed; record why.
- **Not run** — no execution claim is made.
