# ChartQuest Architecture — Start Here

**STATUS: RATIFIED · Architecture v1.0 · Ratified 2026-07-15 · GOVERNANCE LAYER**

Welcome. This is the onboarding document for anyone — human or AI — about to work on ChartQuest. Read it once and you will know what the architecture is, why it exists, and where everything lives. Target: **competence in under 30 minutes.**

---

## What ChartQuest architecture is

ChartQuest is an educational trading game: a turtle (Finn) walks across a candlestick chart, learns to read the market, takes trades, and beats Guardians. The **architecture** is the set of ratified documents that define how lessons, patterns, and charts are structured — so new content is *composed* from shared building blocks, not reinvented each time.

It has three domains, each with one authority:

- **Visual** — how every candle looks and reads. Owner: the [Visual Market Constitution](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md).
- **Educational** — what a lesson is, how concepts sequence, and how patterns teach. Owners: the [Curriculum Engine](../curriculum-engine/) and the [Pattern Operating System](../pattern-library/).
- **Trading** — what a trade means and how it feels. Owner: the Trading canon + Experience System.

## Why it exists

Levels 1–3 were slow and buggy because every new lesson invented its own candle proportions, its own sequencing, its own validation — the same mistakes kept recurring. The architecture makes those mistakes *impossible to repeat*: there is exactly one Lesson schema, one Pattern schema, one validation registry per domain, and one owner per fact. Content now snaps together. This is what lets Levels 4–20 ship far faster than 1–3.

## The one idea that explains everything

**One source of truth; everyone else references it.** A candle's geometry is defined once (Visual Constitution) and referenced everywhere. A concept's category is defined once (the Concept Catalogue) and referenced everywhere. A validation rule is defined once (its registry) and cited by id. Nothing is copied — because a copy is a future contradiction.

## How to navigate (5 documents, in order)

1. **This README** — you are here.
2. [ARCHITECTURE_INDEX.md](ARCHITECTURE_INDEX.md) — the map: every document, its owner, its purpose, and two graphs.
3. [ARCHITECTURE_CONSTITUTION.md](ARCHITECTURE_CONSTITUTION.md) — the twelve laws (2 minutes; they are short).
4. [ARCHITECTURE_MANIFEST.md](ARCHITECTURE_MANIFEST.md) — the source-of-truth hierarchy and ownership map.
5. Your task's domain, found via the Index.

## Which document owns which system (quick reference)

| I need to… | Go to |
|---|---|
| know a **lesson's** fields | `curriculum-engine/CHARTQUEST_LESSON_SCHEMA.json` |
| know a **pattern's** fields | `pattern-library/CHARTQUEST_PATTERN_SCHEMA.json` |
| know a **concept's** category | `pattern-library/CHARTQUEST_PATTERN_OBJECT_MODEL.md §2` (Concept Catalogue) |
| know how a **candle** must look | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` |
| know what a **trade** means | `docs/canon/trading_canon.md` + `TES v1.1` |
| know what makes an asset **valid** | the `VR-*` (curriculum) / `PR-*` (pattern) validation contracts |
| author a **lesson** or **pattern** | the matching authoring guide |

## How new systems should be added

You (almost certainly) don't need to. The architecture is frozen at v1.0 and designed to cover the rest of ChartQuest without redesign. If you genuinely need a new object type, system, or rule, that is an **architecture change** — follow the [Change Policy](ARCHITECTURE_CHANGE_POLICY.md) (problem → ADR → approval → re-ratification). You do **not** edit a canonical document directly.

Adding *content* (a new lesson, a new pattern, a new chart) is **not** an architecture change — it is the everyday work the architecture exists to make easy. Fill the schema, copy the nearest example, reference the owners, run the validators.

## How future contributors should think

- **Reference, never restate.** If you find yourself typing a number that another document owns, stop and link instead.
- **Schema first.** The JSON schema is the truth; prose only explains it.
- **Validate before you ship.** A failing validator is a stop, not a suggestion.
- **When in doubt, find the owner.** Every fact has exactly one home; the Index tells you where.

That's the whole architecture. From here, the work is the game: gameplay, content, playtesting, polish, and shipping the beta.
