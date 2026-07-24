# ChartQuest Architecture Constitution

**STATUS: RATIFIED · Architecture v1.0 · Ratified 2026-07-15 · GOVERNANCE LAYER**

This is the governing law of ChartQuest's architecture. Every canonical document, every future contributor (human or AI), and every implementation obeys it. It may be amended only through the [Architecture Change Policy](ARCHITECTURE_CHANGE_POLICY.md). Where any document conflicts with this Constitution, this Constitution governs.

The principles are deliberately short and enforceable — each is a rule a reviewer or a CI check can apply.

---

## The Twelve Principles

1. **One Source of Truth.** Every fact — a field, a rule, a number, an ownership boundary — is defined in exactly one document. That document is its source of truth (SoT).

2. **Single Ownership.** Every object and every system has exactly one owning document. No fact is owned twice.

3. **Reference, Never Duplicate.** A document that needs a fact it does not own **links** to the owner. It never restates the fact — not as a table, not as a mnemonic, not as an example value.

4. **Schema First.** A machine-readable schema (Level 1) is the definition of an object's shape. Prose describes it; prose never redefines it. Where prose and schema disagree, the schema wins.

5. **Validation Before Implementation.** No lesson, pattern, or chart ships until it passes its validation contracts. A failing validator blocks implementation — it is not advisory.

6. **No Silent Drift.** A copied number is a fork waiting to happen. Constitution-owned geometry, curriculum-owned rules, and trade truth appear by reference only, so a retune in the owner cannot silently diverge elsewhere.

7. **No Duplicate Registries.** There is one validation registry per domain: `VR-*` (Curriculum), `PR-*` (Pattern), `V-*` (Visual). Rules are cited by id; no document re-defines another's rule.

8. **No Duplicate Schemas.** There is one schema per object: one Lesson schema, one Pattern schema. A second field-table for the same object is a defect.

9. **No Gameplay Logic Inside Specifications.** Specifications describe structure, ownership, and rules. They contain no runtime code, no game loop, no live behavior.

10. **No Rendering Logic Inside Educational Documents.** Curriculum and Pattern documents reference the [Visual Market Constitution](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md) for all candle/chart geometry; they never state a pixel, ratio, or hex.

11. **No Educational Logic Inside Rendering Documents.** The Visual Market Constitution governs pixels; it never defines lesson sequencing, mastery, or the `taught()` gate.

12. **No Trade Outcome Inside Pattern Documents.** A pattern specifies *where* a decisive candle sits and *how clearly* it reads. Whether a trade wins, its probability, and its causality are owned by the Trading canon and referenced, never encoded.

## Domain boundaries (who may say what)

| A document in this domain… | may define | must reference (never restate) |
|---|---|---|
| **Visual** (Visual Market Constitution) | candle/chart geometry, readability, chart types A/B/C, `V-*` | — |
| **Trading** (trading_canon, TES v1.1) | trade truth, outcome, causality, feel | — |
| **Curriculum** (docs/curriculum-engine) | lesson structure, sequencing, `taught()`, `VR-*` | Visual, Trading |
| **Pattern** (docs/pattern-library) | pattern structure, market structure, concept identity, traversal geometry intent, `PR-*` | Visual (pixels), Trading (outcome), Curriculum (`VR-*`) |

A document may write only within its domain's "may define" column. Crossing a boundary is a constitutional violation and fails governance review.

## Enforcement

- Every canonical document carries the standard ratification header and appears in the [Architecture Index](ARCHITECTURE_INDEX.md).
- Consistency is checkable: referenced ids resolve in their registry; no restated owner-numbers; one schema per object. These are the checks the [final governance review](ARCHITECTURE_MANIFEST.md#governance-review) runs.
- A violation is fixed by amending the **owning** document through the Change Policy — never by editing a downstream copy.
