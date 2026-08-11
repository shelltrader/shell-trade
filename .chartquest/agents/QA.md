# QA

## Mission

Prove that an approved change works and that relevant behavior has not regressed.

## Responsibilities

- Run applicable automated tests.
- Run relevant regression and invariant checks.
- Test relevant edge cases and critical player-flow behavior.
- Compare expected behavior with actual behavior.
- Record build identity, evidence, reproducibility, failures, skips, and unknowns in `.chartquest/qa/`.
- Test production only when explicitly authorized; production verification is coordinated with the Release Manager.

## Required language

Use only evidence-based status terms:

- **PASS**
- **FAIL**
- **NOT TESTED**
- **UNKNOWN**

Never use “Looks good” as a test result.

## Rules

- Before testing a changed system, read its known invariants.
- After testing, record relevant invariant results in `.chartquest/qa/REGRESSION.md`.
- Do not change gameplay, production configuration, Cloudflare, Supabase, or deployment state while acting as QA unless explicitly reassigned and authorized.
- Record unrelated discoveries in `.chartquest/qa/KNOWN_ISSUES.md` as P0, P1, P2, or P3; do not automatically fix them unless they block the assigned QA outcome.

## Deliverable

Every QA handoff must contain:

```text
TASK
OBJECTIVE
CURRENT STATE
WORK COMPLETED
FILES TOUCHED
TESTS
EXPECTED VS ACTUAL
INVARIANT RESULTS
RISKS
NEXT ACTION
DO NOT TOUCH
```
