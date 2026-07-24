# ChartQuest Architecture Manifest

**STATUS: RATIFIED · Architecture v1.0 · Ratified 2026-07-15 · GOVERNANCE LAYER**

This is the **entry point** to the ChartQuest architecture. A new contributor — human or AI — starts here. It is governance metadata: it points to the canonical documents (which live in their working folders) and defines the order, hierarchy, and ownership that bind them. It does not restate their content.

---

## 1. Purpose of the architecture

ChartQuest is an educational trading game. Its architecture exists to make **content creation cheap and consistent**: a new lesson, pattern, or chart is *composed* from ratified building blocks, never *invented*. Levels 1–3 were slow because every lesson partially reinvented candles, sequencing, and validation. This architecture ends that — the reason it can support Levels 4–20 far faster.

## 2. Design philosophy

- **Compose, don't invent.** Every asset references shared truth (a schema, a palette, a concept catalogue).
- **One truth, many readers.** A fact has one home; everything else links to it.
- **Machine-checkable governance.** Consistency is a grep, not a vibe.
- **Freeze the foundation, iterate the game.** Architecture is stable (v1.0); gameplay, content, and polish are where effort now goes.

## 3. Read order (fastest path to competence)

1. [ARCHITECTURE_README.md](ARCHITECTURE_README.md) — what this is and how to navigate (≤30 min).
2. This Manifest — hierarchy + ownership.
3. [ARCHITECTURE_CONSTITUTION.md](ARCHITECTURE_CONSTITUTION.md) — the twelve laws.
4. The Level-1 schemas: `CHARTQUEST_LESSON_SCHEMA.json`, `CHARTQUEST_PATTERN_SCHEMA.json`.
5. The registries: `CHARTQUEST_CANONICAL_OBJECT_REGISTRY.md`, `CHARTQUEST_PATTERN_OBJECT_MODEL.md`.
6. Your task's domain doc (validation / authoring guide) via the [Index](ARCHITECTURE_INDEX.md).

## 4. Folder structure

```
docs/architecture-ratified/     ← THIS governance layer (manifest, constitution, change policy, readme, index)
CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md   ← Domain constitution: VISUALS (root)
docs/curriculum-engine/         ← System A: the Curriculum Engine (lessons)
docs/pattern-library/           ← System B: the Pattern Operating System (patterns)
docs/canon/                     ← Legacy canon (gameplay/boss/progression/ui) — supporting
docs/implementation/            ← Rendering migration contract (window.CQ) — supporting
docs/architecture-ratified/ points to all of the above; nothing is moved or duplicated.
```

## 5. Source-of-Truth Hierarchy

**No document may contradict a document above it.** Higher levels are more authoritative; on any conflict, the higher level wins.

| Level | Kind | Documents |
|---|---|---|
| **0 — Domain Constitutions** | cross-cutting authorities | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (visuals) · `docs/canon/trading_canon.md` + `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` (trade truth) |
| **1 — Canonical JSON Schemas** | object shape (machine) | `curriculum-engine/CHARTQUEST_LESSON_SCHEMA.json` · `pattern-library/CHARTQUEST_PATTERN_SCHEMA.json` |
| **2 — Object Models & Registries** | object meaning, ownership | `CANONICAL_OBJECT_REGISTRY` · `LESSON_OBJECT_MODEL` · `CURRICULUM_OBJECT_MODEL` · `CURRICULUM_ENGINE_SPECIFICATION` · `SYSTEM_INTERFACES` · `CURRICULUM_GRAPH` · `PATTERN_OBJECT_MODEL` · `PATTERN_LIBRARY_SPECIFICATION` |
| **3 — Validation Contracts** | pass/fail rules | `curriculum VALIDATION_CONTRACTS` (`VR-*`) · `PATTERN_VALIDATION_CONTRACTS` (`PR-*`) · `DATA_CONTRACTS` |
| **4 — Authoring Guides** | how to build | `AUTHORING_PIPELINE` · `IMPLEMENTATION_GUIDELINES` · `PATTERN_AUTHORING_GUIDE` |
| **5 — Decision Records** | why | `ARCHITECTURAL_DECISION_RECORDS` · `PATTERN_DECISION_RECORDS` |
| **6 — Supporting Documentation** | context, plans, history | `VISUAL_MARKET_PHASE1_AUDIT` · `ARCHITECTURE_COMPLETION_REPORT` · `docs/canon/*` · `_REVIEW_FINDINGS_AND_REMEDIATION` (historical) |

Domain constitutions (Level 0) bind Levels 1–5 on their domain: a Level-1 Pattern schema defers to the Level-0 Visual Constitution for pixels and the Level-0 Trading canon for outcomes.

## 6. Canonical ownership map

Exactly one owner per system. (System-internal ownership matrices live in `SYSTEM_INTERFACES` and `PATTERN_OBJECT_MODEL §1`; this is the document-level map.)

| System / fact | Owning document |
|---|---|
| Candle & chart **visuals** (geometry, readability, chart types, `V-*`) | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` |
| **Trade truth** (outcome, causality, feel) | `trading_canon.md` + `TES v1.1` |
| **Lesson** shape | `CHARTQUEST_LESSON_SCHEMA.json` |
| Curriculum **object → SoT map** + frozen decisions D1–D8 | `CHARTQUEST_CANONICAL_OBJECT_REGISTRY.md` |
| **System ownership matrix** (curriculum) | `CHARTQUEST_SYSTEM_INTERFACES.md` |
| **Curriculum graph / Guardian roster** | `CHARTQUEST_CURRICULUM_GRAPH.md` |
| **VR-* registry** | `curriculum-engine/CHARTQUEST_VALIDATION_CONTRACTS.md` |
| **Pattern** shape | `CHARTQUEST_PATTERN_SCHEMA.json` |
| **Concept Catalogue** (concept id + concept→category) | `CHARTQUEST_PATTERN_OBJECT_MODEL.md §2` |
| **PR-* registry** | `CHARTQUEST_PATTERN_VALIDATION_CONTRACTS.md` |
| **Rendering engine** plan (`window.CQ`) | `docs/implementation/VISUAL_MARKET_PHASE1_AUDIT.md` |

## 7. Architectural principles

The twelve enforceable principles are the [Constitution](ARCHITECTURE_CONSTITUTION.md). In one line: **one source of truth, single ownership, reference never duplicate, schema first, validate before ship, no silent drift.**

## 8. Amendment procedure

No canonical document is edited directly. A change follows the [Architecture Change Policy](ARCHITECTURE_CHANGE_POLICY.md): problem → root cause → alternatives → proposal → impact → migration → **ADR** → approval → implementation → validation → re-ratification. Amending a fact means amending its **owning** document; downstream references update automatically because they never held a copy.

## 9. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-07-15 | Curriculum suite first draft (failed self-review: 4 divergent lesson schemas) |
| 1.0 | 2026-07-15 | Curriculum canonicalized (one Lesson schema, D1–D8); Pattern OS ratified (one Pattern schema, P1–P8); **architecture frozen** |

## 10. Ratification date & current status

**Ratified 2026-07-15. Status: FROZEN (v1.0).** The educational architecture is stable and closed to direct edits. Development focus shifts to gameplay, content, playtesting, and shipping the beta. Governance-review results and confidence are recorded in the [Index](ARCHITECTURE_INDEX.md#governance-review) and the ratification summary.

<a id="governance-review"></a>
## 11. Final governance review

The ten-point audit (every doc has one owner and one purpose; no duplicate schemas / registries / ownership / diagrams; no contradictions; every reference resolves; hierarchy respected; supports the remaining ~75% of ChartQuest) is executed at ratification and re-run on any amendment. Results and the stability confidence score are in the ratification summary and [Index](ARCHITECTURE_INDEX.md).
