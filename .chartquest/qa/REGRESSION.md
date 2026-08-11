# Regression Tracking

Record one row per verified regression check. Do not mark a behavior passed without evidence.

| Invariant ID | Test | Expected behavior | Actual behavior | Status | Build | Evidence |
|---|---|---|---|---|---|---|
| INV-001 | Step 7 scope and game-artifact diff checks | `chart-quest.html` remains source of truth and no generated game artifact is modified by this tooling ticket. | Only three tooling files changed; source, root mirror, and site artifact had no candidate diff. | Pass | `31ffd6f` | `handoffs/STEP7_REVIEW.md`; `handoffs/STEP7_QA.md` |
| INV-007 | Three-artifact parity fixture matrix and full regression gate | Equal local artifacts pass; root/site mismatch or missing paths fail nonzero and identify the exact path. | 5/5 fixtures passed; full gate 20 pass, 0 fail, 0 warn, 3 allowed skips; dirty-primary drift failed and named both paths. | Pass | `31ffd6f` | `handoffs/STEP7_QA.md`; `handoffs/STEP7_COMPLETE.md` |

## Status vocabulary

- **Pass** — expected behavior was observed and evidence is linked.
- **Fail** — actual behavior differs from expected behavior.
- **Blocked** — execution could not proceed; record why.
- **Not run** — no execution claim is made.
