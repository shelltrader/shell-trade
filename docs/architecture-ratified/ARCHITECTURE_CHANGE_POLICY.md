# ChartQuest Architecture Change Policy

**STATUS: RATIFIED · Architecture v1.0 · Ratified 2026-07-15 · GOVERNANCE LAYER**

The architecture is frozen at v1.0. This policy is the **only** way to change it. Its purpose is to make change deliberate and traceable, so the foundation cannot drift by accident. Gameplay, content, and polish do **not** go through this policy — only changes to the canonical architecture documents do.

**Golden rule: no direct edits to canonical documents.** Every change starts as an ADR and ends as a re-ratification.

---

## When this policy applies

| Change | Needs this policy? |
|---|---|
| Editing a schema field, a `VR-*`/`PR-*`/`V-*` rule, an ownership boundary, a frozen decision (D1–D8, P1–P8) | **Yes** — ADR required |
| Adding a new object type, system, or validation registry | **Yes** — ADR required |
| Authoring a new lesson / pattern / chart *within* the existing schemas | No — that is content creation (use the authoring guides) |
| Fixing a typo or broken link (no semantic change) | No — but note it in the doc's change log |

## The workflow (eleven steps)

1. **Problem identified.** State the concrete symptom (a bug, an authoring friction, a missing capability). One paragraph.
2. **Root cause documented.** Why the current architecture produces the problem. Distinguish "architecture is wrong" from "we used it wrong."
3. **Alternatives explored.** At least two options, including "do nothing / work within the current design."
4. **Proposed solution.** The single recommended change, named precisely (which document, which field/rule).
5. **Impact analysis.** Every document, schema, validator, and existing asset the change touches. Which SoT hierarchy level is affected.
6. **Migration plan.** How existing lessons/patterns/charts move to the new shape. Breaking vs non-breaking.
7. **ADR created.** A record in the owning system's decision-records file (`ARCHITECTURAL_DECISION_RECORDS.md` or `PATTERN_DECISION_RECORDS.md`) using the template below.
8. **Approval.** The architecture owner signs off on the ADR. Until then the change does not proceed.
9. **Implementation.** The **owning** document is edited (and only it). Downstream references need no edit — they never held a copy.
10. **Validation.** The governance review re-runs: references resolve, no duplication, no cross-level contradiction, hierarchy respected.
11. **Ratification.** The Manifest version history is updated; the affected documents' headers get the new version/date. The change is now canon.

## ADR template

```
# ADR-<system>-<n> — <short title>

Status:        Proposed | Approved | Superseded
Date:          YYYY-MM-DD
Owning doc:    <the single document this amends>
SoT level:     <0–6>

## Problem
## Root cause
## Alternatives considered
## Decision
## Impact (documents / schemas / validators / assets)
## Migration plan (breaking?)
## Tradeoffs
## Long-term benefits
## Future risks
## Review date
```

## Failure modes this prevents

- **Silent drift** — a number copied into two docs that later disagree. (Reference-only kills it.)
- **Ownership creep** — two documents both claiming a fact. (Single-owner edits kill it.)
- **Unvalidated change** — a schema edit that breaks existing assets. (Step 5–6 + step 10 catch it.)
- **Undocumented "why"** — a future contributor undoing a deliberate decision. (The ADR preserves intent.)
