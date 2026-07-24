# ChartQuest Curriculum Engine — Review Findings & Remediation Contract

> **⚠️ HISTORICAL / SUPERSEDED (2026-07-15).** This is the pre-reconciliation record of the 5-lens review and the *interim* fix options. The remediation was **executed** and the canonical rulings now live in [`CHARTQUEST_CANONICAL_OBJECT_REGISTRY.md`](CHARTQUEST_CANONICAL_OBJECT_REGISTRY.md) (Frozen Decisions D1–D8). Where this note and the Registry differ, **the Registry governs.** In particular, §4/§6 below floated "make the DAG canonical and *derive* `hour`" — that option was **NOT adopted**. The ratified ruling is **D1: `guardian` is the one authored placement; `hour`/`unlockLevel` are aliases of it.** Kept for provenance only.

**Status: 2026-07-15. The 10 documents are a complete FIRST DRAFT that FAILED its own 5-lens self-review on internal consistency.** No code was changed (chart-quest.html/index.html untouched — verified). This file is the reconciliation contract that takes the suite from v0.1 → v1.0. The **seal** pass that would have applied these fixes automatically was cut off by an account session limit.

---

## 1. Verdict

Five adversarial lenses (zero-knowledge AI author, Nintendo/Valve/Riot systems, Duolingo pedagogy, Pixar+Apple beats/DX, investment-committee velocity) scored the suite **2–3 / 10 on AI-Authoring Experience** and unanimously raised the same **critical** defect:

> **The suite committed the exact meta-bug it exists to kill** — the "one canonical Lesson object" is re-forked into **four incompatible schemas** across `LESSON_OBJECT_MODEL`, `DATA_CONTRACTS`, `CURRICULUM_GRAPH`, and `IMPLEMENTATION_GUIDELINES`. 8 of 10 docs re-typeset a lesson field schema; they drift.

64 unique critical/major findings were logged. They cluster into the root causes below.

## 2. Root cause

1. **No single machine-readable schema artifact.** Each doc re-states the lesson schema as prose/tables instead of *referencing* one normative JSON Schema. Prose copies drift.
2. **The ratified "spine" was a 7-key skeleton**, yet every doc claimed byte-fidelity to it for dozens of fields/enums/rules it never contained → authors invented divergent details.

## 3. Confirmed contradictions (spot-verified against the files)

| # | Contradiction | Evidence |
|---|---|---|
| C1 | `bos` placed at **hour/Guardian 2** vs **hour 3** | `LESSON_OBJECT_MODEL` `bossRound.guardian:2` vs `IMPLEMENTATION_GUIDELINES` `{hour:3,boss:3}` |
| C2 | `taught()` key type undefined | `LESSON_OBJECT_MODEL` uses **both** `taught(conceptKey)` (L40) and `taught(lessonId)` (L56/329/367); others use `conceptKey` |
| C3 | `hour` **authored** vs **derived** | required authored `guardian` field vs "Computed from the graph, not authored" |
| C4 | Three near-disjoint **VR-* rule registries** | `VALIDATION_CONTRACTS` vs `IMPLEMENTATION_GUIDELINES` vs `DATA_CONTRACTS` — guide cites rules absent from the registry |
| C5 | Two JSON Schemas with `additionalProperties:false` **reject each other's objects** | `DATA_CONTRACTS §6.1` vs `VALIDATION_CONTRACTS §4` |
| C6 | ConceptId casing law violated by the suite's **own examples** | `NAME-2` long id `break_of_structure` vs examples using short `bos` |
| C7 | **The Gambler (Guardian 0)** intro boss is unrepresentable | ordering law says `boss==hour`, intro breaks it |
| C8 | Ownership overlap: `masteryCategory` / concept catalogue have **two owners** | `SYSTEM_INTERFACES` vs `LESSON_OBJECT_MODEL`/`DATA_CONTRACTS` |
| C9 | Missing first-class fields | **APPLY beat** (¼ of LEARN→PRACTICE→APPLY→TEST), **emotional/narrative beat**, **misconception/distractor** in assessment |
| C10 | Ceremony vs reality | envelopes / SemVer / tri-format vs a single-file, harness-less game |

## 4. Canonical decisions to FREEZE (recommended rulings)

| Decision | Ruling |
|---|---|
| Single schema home | **`LESSON_OBJECT_MODEL`** owns the one schema, expressed as **one JSON Schema `$id`**. Every other doc references fields by link — **never re-declares**. |
| Ordering | The **dependency DAG is canonical**; `hour`/`boss`/`unlockLevel` are **derived projections** (delete authored `hour`/`guardian`). Define the derivation function once. |
| `taught()` key | **`taught(conceptKey)`** everywhere. Define `conceptKey` vs `lessonId` explicitly (a lesson teaches one primary `conceptKey`; ids are distinct namespaces). |
| VR registry | **`VALIDATION_CONTRACTS`** is the sole VR registry; every rule has one canonical id; other docs link by id only. |
| Worked examples | One frozen set (`bos`, `choch`, `risk_reward`, `vwap`) **regenerated from the graph**, byte-identical across every doc. |
| Missing fields | Add `apply` (trade-scenario binding per TES v1.1), `beat` (`{hook,stakes,guardianVoice,tensionArc,payoff}`, 10-yr-old wording), and `assessment.distractors[]` with `{why,remediationConceptKey}`. |
| Ownership | **Pattern Library owns concept identity + concept→category**; the Lesson *references* a conceptKey; Curriculum Engine owns sequence/`taught()`. |
| ConceptId | Freeze a snake_case ConceptId catalogue in one place; `primaryConcept` = the ConceptId; keep `lessonId` visibly distinct. |
| Guardian 0 | Intro is **hour 0** with `boss==hour` permitted; encode `hour ∈ 0..10` in the one schema. |
| Ceremony | Cut envelope/SemVer/tri-format to what pays for itself now (one schema, one validator, one authoring guide, one ADR log), or justify each. |
| Spine | Expand the ratified spine into the **complete normative schema** (all fields/enums/states/rules), or stop claiming byte-fidelity. |

## 5. Remediation order

0. **Author the one canonical machine-readable schema** (`CHARTQUEST_LESSON_SCHEMA.json` + its home in `LESSON_OBJECT_MODEL`) — the single source; freeze decisions in §4.
1. Reconcile `DATA_CONTRACTS`, `CURRICULUM_GRAPH`, `VALIDATION_CONTRACTS`, `IMPLEMENTATION_GUIDELINES`, `CURRICULUM_OBJECT_MODEL`, `SYSTEM_INTERFACES`, `ADR` to **reference** the schema, not re-declare it.
2. Regenerate all worked examples from the frozen graph; add a cross-doc consistency check to the ratify step.
3. Write `CHARTQUEST_CURRICULUM_ENGINE_SELF_REVIEW.md` (the ≥9.5 scorecard) once C1–C10 are closed.

## 6. Per-document punch-list

- **LESSON_OBJECT_MODEL** — become the sole schema owner; fix C2 (`taught(conceptKey)`), delete authored `hour`/`guardian` (C3), add `apply`/`beat`/`distractors` (C9).
- **DATA_CONTRACTS** — reference the one schema (C1/C5); one JSON Schema `$id`; drop unjustified envelope ceremony (C10); fix ConceptId (C6).
- **CURRICULUM_GRAPH** — nodes = concepts; PRACTICE/APPLY are edges/attributes not nodes (C-graph-model); regenerate Guardian 1–3 slice (C1); encode hour 0 (C7).
- **VALIDATION_CONTRACTS** — sole VR registry (C4); align JSON Schema with LOM (C5); add VR for one-primary-concept, ≥3-trades-gate as data (not prose).
- **IMPLEMENTATION_GUIDELINES** — regenerate Lessons A/B/C from the frozen schema+graph (C1); cite only real VR ids (C4); fix visual-reference field name (C6).
- **CURRICULUM_OBJECT_MODEL** — one roster table (C-roster); reconcile Guardian 2/3 Structure-vs-Trend.
- **SYSTEM_INTERFACES** — resolve ownership overlaps (C8).
- **ADR** — Appendix S: expand the spine or drop the byte-fidelity claim (root-cause 2); add ADR for hour-derived and the granularity decision.
- **SPECIFICATION / AUTHORING_PIPELINE** — trim ceremony to the happy path (C10).

*The full 64-finding review output is preserved in the workflow journal (`wf_f27aa754-753/journal.jsonl`).*
