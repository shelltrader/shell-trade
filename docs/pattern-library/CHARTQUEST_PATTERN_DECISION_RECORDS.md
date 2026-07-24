> **STATUS: RATIFIED** — ChartQuest Architecture v1.0 · Ratified 2026-07-15
> **Do not modify directly.** Part of the official ChartQuest ratified architecture. Changes require an ADR, migration notes, approval, and re-ratification — see `docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md`.

# ChartQuest Pattern Library — Architecture Decision Records

> **CANONICAL REFERENCE.** The single source of truth for the Pattern object is [`CHARTQUEST_PATTERN_SCHEMA.json`](CHARTQUEST_PATTERN_SCHEMA.json); ownership & examples live in [`CHARTQUEST_PATTERN_OBJECT_MODEL.md`](CHARTQUEST_PATTERN_OBJECT_MODEL.md). This document references them; it does not redefine them. Where it conflicts, they govern.

**Status: CANONICAL, v1.0.0, ratified 2026-07-15.** No game code was changed. This is the *why* behind Phase 2A (the Pattern Operating System). Each record below is an Architecture Decision Record (ADR): a frozen decision, the forces that shaped it, the roads not taken, and the cost of walking it back. The frozen decisions **P1–P8** are declared verbatim in the schema's `$comment`; this document is their rationale of record.

---

## How to read this document

Every ADR follows one shape so a zero-knowledge future reader — human or AI — can act on it without re-deriving the reasoning:

- **Problem** — the concrete failure or gap that forced a decision.
- **Context** — the ratified systems and constraints in play at decision time.
- **Alternatives Considered** — the real options, each with why it lost.
- **Decision** — the single ruling, stated so a validator could enforce it.
- **Tradeoffs** — what we gave up to get it.
- **Long-Term Benefits** — the compounding payoff.
- **Future Risks** — how this decision could rot, and the early-warning sign.
- **Review Date** — when to revisit, and the trigger that forces an early review.

**The one-line map.** A pattern **owns** market structure, visual educational intent, trade-opportunity *placement*, traversal geometry, emotional beat, and concept identity. It **references** everything else: geometry to the [Visual Market Constitution](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md), trade truth to [`trading_canon.md`](../canon/trading_canon.md) + the Trading Experience System, and lesson sequencing to the [Curriculum Engine](../curriculum-engine/). No ownership is duplicated. Every ADR below defends one seam of that map.

**ADR index.**

| ADR | Frozen decision | One-line ruling |
|---|---|---|
| [ADR-0](#adr-0--patterns-are-first-class-objects) | — | Patterns are first-class objects, not lesson sub-fields. |
| [ADR-P1](#adr-p1--the-pattern-schema-is-the-sole-definition-of-pattern-structure) | P1 | The schema is the sole definition of pattern structure. |
| [ADR-P2](#adr-p2--patterns-delegate-all-candle-geometry-to-the-visual-market-constitution) | P2 | Visuals delegate to the Constitution; geometry is never restated. |
| [ADR-P3](#adr-p3--the-pattern-library-owns-the-concept-catalogue) | P3 | The Pattern Library owns the Concept Catalogue (Curriculum D5). |
| [ADR-P4](#adr-p4--a-pattern-anchors-exactly-one-primary-concept) | P4 | A pattern anchors exactly one `primaryConcept`. |
| [ADR-P5](#adr-p5--the-pattern--lesson-ownership-split) | P5 | Patterns own structure/placement/beat; lessons own sequence/flow. |
| [ADR-P6](#adr-p6--trade-truth-defers-to-trading_canon) | P6 | Trade outcome/probability/causality defers to `trading_canon`. |
| [ADR-P7](#adr-p7--validation-delegates-pr--is-a-thin-layer-over-v--and-vr-) | P7 | Validation delegates: `PR-*` is a thin layer over `V-*`/`VR-*`. |
| [ADR-P8](#adr-p8--the-lessonpattern-reference-direction-is-one-way-by-compatibility) | P8 | Lessons reference patterns; patterns declare compatibility, never couple. |
| [ADR-9](#adr-9--five-reference-patterns-not-fifty) | — | Ship 5 gold-standard reference patterns, not 50. |

---

## ADR-0 — Patterns are first-class objects

**Problem.** Before Phase 2A, a "pattern" existed only as an emergent side effect of a lesson: candle proportions were minted inline inside whichever draw path a lesson happened to trigger. The Constitution names the exact bug this produced — *"every new lesson invents new candle proportions"* — across nine-plus independent draw paths ([Constitution §Pattern Library Standards](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md), ~L796). Because no object represented "the impulse pattern," two lessons that both taught momentum could not share terrain, could not be validated against each other, and drifted apart with every edit. Levels 1–3 were slow precisely because each one re-invented geometry, re-categorized concepts, and re-supposed a lesson context.

**Context.** Four ratified systems already existed — the Visual Market Constitution (geometry), the Curriculum Engine (lesson sequencing + the `VR-*` registry), Trading canon / TES (trade truth), and the Block-4 event engine. Each was authoritative in its lane, but nothing sat at their junction. An authored candle sequence must satisfy all four at once (teach a concept, walk as terrain, host a trade), yet no single object could be validated as satisfying all four.

**Alternatives Considered.**
1. **Keep patterns implicit (status quo).** Zero new surface area. Rejected: it *is* the root bug. An implicit pattern cannot be given an id, a status, a validator run, or an owner — so it cannot be reused, and reuse is the entire point.
2. **Make the pattern a sub-field of the Lesson object.** Cheap to wire. Rejected: it hard-couples terrain to one lesson, forbidding the many-lessons-share-one-pattern relationship the Concept Catalogue needs (see [ADR-P8](#adr-p8--the-lessonpattern-reference-direction-is-one-way-by-compatibility)), and it forces a re-author every time a lesson changes.
3. **A pattern is a first-class object with its own id, lifecycle, ownership, and validators.** Chosen.

**Decision.** A **pattern is a first-class, reusable educational building block** — an authored candle sequence that teaches ONE named concept, functions as walkable terrain, and hosts a trade setup, defined by [`CHARTQUEST_PATTERN_SCHEMA.json`](CHARTQUEST_PATTERN_SCHEMA.json). It has a stable `patternId`, a `uuid` assigned once at draft, a `status` lifecycle (`draft → in_review → validated → approved → production → deprecated → retired`, [Object Model §4](CHARTQUEST_PATTERN_OBJECT_MODEL.md)), and an `owner`. It is authored, validated, and versioned independently of any lesson.

**Tradeoffs.** A new object class means a new schema, a new validation suite (`PR-*`), a new lifecycle to maintain, and one more thing an author must learn. We accept that ceremony in exchange for reuse and machine-checkability.

**Long-Term Benefits.** Terrain becomes a shared asset: pattern #200 is built by analogy to five references, not from scratch ([Object Model §6](CHARTQUEST_PATTERN_OBJECT_MODEL.md)). Every pattern is independently testable against the Human Playtest Gate. The "every lesson invents geometry" bug becomes structurally impossible because geometry now lives on a shared, validated object.

**Future Risks.** Object proliferation — hundreds of near-duplicate patterns that differ only cosmetically. Early-warning sign: two `approved` patterns with the same `primaryConcept`, `marketStructure`, and `chartTypes` and near-identical terrain. Mitigation: `dependencies[]` + the five-reference discipline of [ADR-9](#adr-9--five-reference-patterns-not-fifty).

**Review Date.** 2026-10-15, or immediately if the library exceeds 60 patterns before that date.

---

## ADR-P1 — The pattern schema is the sole definition of pattern structure

**Problem.** ChartQuest's earlier failures traced to *structure defined in many places*: a field would live in prose in one doc, in an example in another, and in code in a third, and the three would silently diverge. If pattern structure were described in the Constitution, in the Object Model, and in a lesson doc simultaneously, the same drift would recur at the pattern layer.

**Context.** JSON Schema draft-2020-12 gives a single machine-checkable artifact with `required`, enums, `pattern` constraints, and `additionalProperties: false`. The Curriculum Engine had already proven the model: its Lesson shape is owned entirely by `CHARTQUEST_LESSON_SCHEMA.json`, and its validation doc [defines NO lesson schema](../curriculum-engine/CHARTQUEST_VALIDATION_CONTRACTS.md) (§2).

**Alternatives Considered.**
1. **Prose specification** in the Object Model, with the JSON as an illustrative sample. Rejected: prose is not machine-checkable and invites divergence.
2. **Schema plus a normative field table** in a companion doc. Rejected: two normative sources means two things to keep in sync — the exact failure mode we are eliminating. The Curriculum precedent is explicit that there is "no second field table to consult."
3. **The JSON Schema is the sole normative definition; every other doc references it.** Chosen.

**Decision (P1).** [`CHARTQUEST_PATTERN_SCHEMA.json`](CHARTQUEST_PATTERN_SCHEMA.json) (`$id: https://chartquest.dev/schema/pattern/1.0.0`) is **the single source of truth for the shape of every pattern**. No document, code path, or tool may define pattern structure anywhere else. The Object Model is explicitly the schema's *human companion* and "adds nothing normative the JSON lacks" ([Object Model banner](CHARTQUEST_PATTERN_OBJECT_MODEL.md)). Shape validation is a single delegated step: validate against the `$id`; if it fails, stop.

**Tradeoffs.** JSON Schema cannot express whole-graph reasoning (teach-order, one-teacher-per-concept, the ≥3-trade gate). Those live in the `PR-*`/`VR-*` layer ([ADR-P7](#adr-p7--validation-delegates-pr--is-a-thin-layer-over-v--and-vr-)), so a reader must consult two artifacts, not one. We accept that: shape is one place, cross-object rules are another, and neither overlaps.

**Long-Term Benefits.** A pattern is `SCHEMA-VALID` or it is not — a deterministic, tooling-friendly verdict. `additionalProperties: false` makes unknown fields a hard error, so schema drift cannot creep in as "extra" keys. Any draft-2020-12 validator, in any language, gates authorship identically.

**Future Risks.** Schema ossification: authors want a field the schema forbids and are tempted to stuff it into a free-text field. Early-warning sign: `teachingNotes` or `educationalPurpose` carrying structured data. Mitigation: a real schema version bump (the `schemaVersion` const moves off `1.0.0`) with a migration note, never an in-band workaround.

**Review Date.** 2026-10-15, or on the first ratified request for a field the schema cannot hold.

---

## ADR-P2 — Patterns delegate all candle geometry to the Visual Market Constitution

**Problem.** Candle geometry is the single most-duplicated, most-drifted quantity in the codebase — the origin of the "every path invents proportions" bug. If a pattern restated even one pixel rule (a body-width band, a floor, a corner radius), that restatement would become a second source that could disagree with the Constitution.

**Context.** The Constitution already owns the one width rule (`bodyW` derived from the slot — see its Standards Table), the A/B/C chart types, the per-type readability floors, the Accessibility Law, and the visual-clarity validator table ([Constitution §Pattern Library Specification](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md), ~L815). Constraint #1 of the ten is unambiguous: "No pattern enters the library by inventing geometry; every pattern **consumes** the governing width rule and cites the Standards Table."

**Alternatives Considered.**
1. **Embed the geometry the pattern needs** (its floors, its band) directly on the object for convenience. Rejected: convenience today, divergence tomorrow — the precise anti-pattern P2 exists to kill.
2. **Copy the Standards Table into the pattern doc as an appendix** for offline reference. Rejected: a copy is a fork waiting to happen; the Constitution's table must be the only table.
3. **Store only a typed *reference* to the Constitution, plus the pattern's chosen type and exaggeration position, and let validators pull the real numbers.** Chosen.

**Decision (P2).** A pattern **references** the Visual Market Constitution for ALL candle geometry and readability; it never restates a pixel rule. The `requiredVisualRules` object carries exactly three required keys — `authority` (a const pointer to `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table`), `chartType` (A/B/C, which *selects* the band/density/floor), and `exaggerationGain` (0–1 position on the ramp) — plus an optional `playtestRecordRef`. `requiredTerrainCharacteristics` carries only *intent* (target visible count, rhythm profile, verticality); "the numeric floors they must satisfy live in the Visual Market Constitution (referenced, not restated)" (schema `requiredTerrainCharacteristics.description`). Visual validation *delegates* to the Constitution's `V-*` chart validators.

**Tradeoffs.** A pattern record is not self-contained: to know the actual pixel band an `approved` pattern must satisfy, a reader must follow `authority` to the Standards Table. We accept the extra hop; it is the price of a single geometry source.

**Long-Term Benefits.** When the Constitution tunes a floor, every pattern inherits the change with zero edits and zero drift. A pattern can never contradict the geometry law because it never states the geometry law. Authoring pattern #200 re-invents no pixels ([Object Model §6](CHARTQUEST_PATTERN_OBJECT_MODEL.md)).

**Future Risks.** The `authority` const points at a specific anchor (`#appendix-a-standards-table`); if the Constitution renames that anchor, the pointer dangles. Early-warning sign: a `PR-VISUAL` run that cannot resolve `authority`. Mitigation: anchor stability is a Constitution-side invariant; a rename is a breaking change that must update the const via schema migration.

**Review Date.** Co-reviewed with any Constitution revision that touches the Standards Table or the A/B/C type definitions.

---

## ADR-P3 — The Pattern Library owns the Concept Catalogue

**Problem.** "What concept does this teach, and what mastery category does it belong to?" needs exactly one authoritative answer. Both lessons and patterns ask it. If either owned the map, the other would have to reach across a system boundary — or worse, keep a private copy that drifts.

**Context.** The Curriculum Engine's frozen decision **D5** assigned concept identity and the `concept → masteryCategory` map to the Pattern Library. The categories are the 7 live `MASTERY_CATS`; each concept's `guardian` equals `MASTERY_CAT_LEVEL[category]` (chart-quest.html:3792). [Object Model §2](CHARTQUEST_PATTERN_OBJECT_MODEL.md) materializes the catalogue verbatim (23 conceptKeys: `candles_intro`, `momentum`, `pullback`, `bos`, `choch`, `support_resist`, `sweep`, `ob`, `risk_reward`, `htf`, `confluence`, …). The Curriculum's `VR-NAMING` explicitly resolves keys "in the Concept Catalogue (owned by the Pattern Library, D5)."

**Alternatives Considered.**
1. **The Curriculum Engine owns the catalogue** (it consumes concepts for sequencing). Rejected by D5: a pattern's whole identity is its concept, so the catalogue belongs where concept identity is born, not where it is scheduled.
2. **A standalone concept registry** owned by neither. Rejected: it adds a fifth system and a new ownership seam for no benefit; the pattern already needs concept identity as a required field.
3. **The Pattern Library owns the catalogue; lessons and patterns both reference it.** Chosen — and mandated by D5.

**Decision (P3).** The Pattern Library **owns the Concept Catalogue**: the `conceptKey → { masteryCategory, guardian }` map ([Object Model §2](CHARTQUEST_PATTERN_OBJECT_MODEL.md)). `primaryConcept` and `supportingConcepts` are conceptKeys the catalogue defines. `masteryCategory` is **DERIVED from the catalogue, never stored on the pattern** — the schema carries no `masteryCategory` field. Both `Pattern.primaryConcept` and `Lesson.primaryConcept` resolve here; neither re-owns the category.

**Tradeoffs.** The Pattern Library now carries a curriculum-shaped responsibility (the category map), which couples a Constitution-adjacent library to a Curriculum concern. We accept it because D5 already ruled, and because concept identity is genuinely a pattern property.

**Long-Term Benefits.** One map, one owner: adding a concept is a single edit in one file, and every consumer sees it. Because `masteryCategory` is derived, a concept can never carry two categories, and the `guardian` a concept tests at is computed, not hand-copied.

**Future Risks.** The catalogue and the live `MASTERY_CATS` / `MASTERY_CAT_LEVEL` in chart-quest.html can drift, since one is a doc and one is code. Early-warning sign: a `conceptKey` whose `guardian` in §2 disagrees with `MASTERY_CAT_LEVEL[category]`. Mitigation: a validator that diffs the catalogue against the live constants; this doc treats chart-quest.html:3792 as the runtime authority the catalogue mirrors.

**Review Date.** On any change to `MASTERY_CATS`, `MASTERY_CAT_LEVEL`, or the addition of a new taught concept.

---

## ADR-P4 — A pattern anchors exactly one primary concept

**Problem.** A candle sequence that "teaches two things" teaches neither cleanly: the reader cannot tell which read is the point, the misconception-handling has two targets, and the Human Playtest Gate cannot measure comprehension of a single idea. It also breaks the concept→lesson bijection the Curriculum relies on.

**Context.** The whole architecture rests on one-concept-per-unit. The Constitution's authoring template says the Purpose field "Names exactly one primary concept … A pattern with two 'main points' is split" ([Constitution §Pattern Library Specification](../../CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md)). The Curriculum's `VR-OBJECTIVE` requires "exactly one `primaryConcept`," and `VR-SINGLE-PRIMARY` enforces one teacher per concept across the whole graph.

**Alternatives Considered.**
1. **Allow multiple primary concepts** for "efficient" combo patterns. Rejected: it collapses the bijection, muddies playtesting, and re-creates the untestable blob the whole system is escaping.
2. **One primary + unbounded supporting concepts treated as co-equal.** Rejected: supporting concepts must be *assumed-taught background*, not co-taught foreground, or the "never test the untaught" law leaks.
3. **Exactly one `primaryConcept`; `supportingConcepts` are strictly secondary and must already be taught.** Chosen.

**Decision (P4).** A pattern **anchors exactly ONE `primaryConcept`** — a single conceptKey from the catalogue. `supportingConcepts[]` are secondary reinforcements that "may be assumed only if taught earlier," enforced by the Curriculum teach-order DAG (`VR-ORDER`). `educationalPurpose` "Names the same concept as primaryConcept" (schema `educationalPurpose.description`). Many patterns may share one concept (that is [ADR-P8](#adr-p8--the-lessonpattern-reference-direction-is-one-way-by-compatibility)'s many-to-one), but no pattern splits its own focus.

**Tradeoffs.** Genuinely compound market situations (e.g. a pullback *inside* a breakout) must be authored as two patterns with a `dependencies` edge, not one. More objects, cleaner objects.

**Long-Term Benefits.** Every pattern is comprehension-testable against a single claim, so the ≥90% label-hidden playtest gate is meaningful. The concept→category→guardian chain stays a clean function. Misconception handling ([`expectedBeginnerMistake`](CHARTQUEST_PATTERN_SCHEMA.json)) has exactly one target.

**Future Risks.** Authors smuggle a second concept into `supportingConcepts` and teach it as if primary. Early-warning sign: a lesson using the pattern spends LEARN time on a supporting concept. Mitigation: `PR-ONE-CONCEPT` plus `VR-ORDER`; supporting concepts must resolve as already-taught, never introduced-here.

**Review Date.** 2026-10-15; no early trigger anticipated — this is a load-bearing invariant unlikely to be relaxed.

---

## ADR-P5 — The pattern ↔ lesson ownership split

**Problem.** A pattern and a lesson both touch the same player moment (a chart, a trade, a replay). Without a hard line, the same fact — say, "what the replay shows" — gets authored in both, and they diverge. Overlapping ownership is how ChartQuest doc-sets rotted before.

**Context.** [Object Model §1](CHARTQUEST_PATTERN_OBJECT_MODEL.md) states the "Ownership law (no overlap)": "A field appears in exactly one of these lists." The two lists are fixed. The schema encodes the split field-by-field: patterns carry `marketStructure`, `requiredTerrainCharacteristics`, `tradeOpportunities[]` (placement), `requiredEmotionalBeat`, `primaryConcept`; lessons carry sequence, flow, notebook content, replay *sequence*, and trade *scripting*.

**Alternatives Considered.**
1. **Let lessons own everything, patterns own only geometry.** Rejected: it demotes the pattern back toward a lesson sub-field and re-couples terrain to a single lesson ([ADR-0](#adr-0--patterns-are-first-class-objects)).
2. **Let patterns own the emotional/narrative beat and the lesson merely render it, with fuzzy edges.** Rejected: fuzzy edges are the disease. The split must be total.
3. **A total partition: patterns own structure/placement/beat/concept-identity; lessons own sequence/flow/notebook/replay-sequence/trade-scripting.** Chosen.

**Decision (P5).** **Patterns own:** market structure, visual educational intent, trade-opportunity **placement** (visual), traversal geometry, emotional beat, concept identity. **Lessons own:** learning sequence, lesson flow, notebook, replay **sequence**, trade scripting. The `*Compatibility` booleans on a pattern (`replayCompatibility`, `notebookCompatibility`, `journalCompatibility`) declare only *suitability*; the *content* and *sequence* are the lesson's ([Object Model §1](CHARTQUEST_PATTERN_OBJECT_MODEL.md)). The emotional beat "originates with the pattern"; "A Lesson may frame it, but the beat originates with the pattern" (schema `requiredEmotionalBeat.description`).

**Tradeoffs.** Authors must know which side of the line every field sits on — there is a learning curve, and edits sometimes touch two objects. The partition table ([Object Model §1](CHARTQUEST_PATTERN_OBJECT_MODEL.md)) is the reference that removes the guesswork.

**Long-Term Benefits.** One fact, one home: no field is authored twice, so nothing can diverge. Patterns are reusable across lessons precisely because they carry no lesson-specific sequence. Lessons stay thin, referencing shared terrain.

**Future Risks.** A field's rightful owner becomes ambiguous as new features arrive (e.g. a future "hint system" — pattern intent or lesson flow?). Early-warning sign: a proposed field that plausibly belongs to both. Mitigation: no field ships until it is assigned to exactly one list here, by amendment to §1.

**Review Date.** On any new player-facing feature that spans chart + lesson.

---

## ADR-P6 — Trade truth defers to trading_canon

**Problem.** The single most dangerous failure mode in a trading game is a visual that *encodes the outcome* — a candle drawn to "look like a win," making the market a puppet and the trade a coin-flip dressed as skill. This is a firewalled concern: what a trade *means* must never be decidable from how a candle is drawn.

**Context.** Trade truth — outcome, probability, causality — is supreme in [`docs/canon/trading_canon.md`](../canon/trading_canon.md) and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`. The Constitution's constraint #10 is explicit: the library "governs the **visual** layer only … it may never encode a trade outcome as a visual win-knob." The founder has repeatedly rejected outcome-as-visual-knob designs (memory: quality-weighted RNG rejected; quality is a firewalled read, never a win knob).

**Alternatives Considered.**
1. **Let a pattern carry the trade's outcome/probability** so the setup is self-contained. Rejected outright: this is the win-knob the entire trading canon exists to forbid.
2. **Let a pattern carry a "quality" score that softly biases outcome.** Rejected: the founder killed exactly this; quality may be *read* for feedback but must never move the result.
3. **A pattern encodes only WHERE the decisive candle sits and HOW CLEARLY it reads, pointing to the canon for the outcome.** Chosen.

**Decision (P6).** Trade **outcome, probability, and causality are owned by `trading_canon.md` + the Trading Experience System.** A pattern "says only WHERE the decisive candle sits and HOW CLEARLY it reads" (schema `$comment` P6). Each entry in `tradeOpportunities[]` carries `decisiveCandle`, `direction`, `readsAs` (the visual evidence a 10-year-old reads), and a `tradeTruthRef` that *points* to the canon/TES scenario owning the outcome — "never an outcome value here" (schema `tradeOpportunities[].tradeTruthRef.description`). `allowedTradeTypes` declares which directions the setup visually supports; "Outcome/causality NOT decided here."

**Tradeoffs.** A pattern is not a runnable trade on its own — outcome resolution requires following `tradeTruthRef` into the canon. That indirection is the firewall, and it is deliberate.

**Long-Term Benefits.** The market can never become a puppet through the visual layer, because the visual layer structurally cannot hold an outcome. Visual authors and trade-truth authors work independently without corrupting each other's domain. The felt-stakes trade the beta identified as the fulcrum stays honest.

**Future Risks.** `readsAs` prose subtly implies an outcome ("a candle that always bounces") and back-doors a win-knob through language. Early-warning sign: `readsAs` text that asserts what *will happen* rather than what is *visible now*. Mitigation: `PR-TRADE-PLACEMENT` checks placement/legibility only; outcome language in `readsAs` fails review.

**Review Date.** Co-reviewed with any `trading_canon.md` or TES revision.

---

## ADR-P7 — Validation delegates: PR-* is a thin layer over V-* and VR-*

**Problem.** A pattern must satisfy visual rules (geometry), educational rules (teach-order, the trade gate), and pattern-structural rules (one concept, DAG-clean dependencies). If the pattern suite re-defined the visual or educational rules it needs, it would fork two mature registries and re-introduce the drift the whole architecture fights.

**Context.** Two registries already own their rules and declare themselves sole owners. The Constitution owns the `V-*` chart validators (e.g. V-44 relational-pattern law, V-46 teach-order DAG, V-47 the ≥3-trade gate). The Curriculum's [`CHARTQUEST_VALIDATION_CONTRACTS.md`](../curriculum-engine/CHARTQUEST_VALIDATION_CONTRACTS.md) is "the **sole `VR-*` registry** (D6)" and states every other document "cites these `VR-*` ids **by link**; none lists rules locally." Its governing rule: "If any validation fails, implementation stops" (`blocksImplementation: true`).

**Alternatives Considered.**
1. **One giant pattern validator** that re-checks geometry, teach-order, and structure itself. Rejected: it forks `V-*` and `VR-*`, guaranteeing three-way drift.
2. **No pattern-specific validators; reuse only `V-*`/`VR-*`.** Rejected: genuinely pattern-only invariants exist (exactly one primary *concept on a pattern*, the pattern `dependencies` DAG, trade-placement legibility) that neither existing registry expresses.
3. **A thin `PR-*` layer for pattern-only invariants that otherwise delegates to `V-*` and `VR-*`.** Chosen.

**Decision (P7).** Validation **delegates**. A pattern's `validationRules[]` is an array of ids constrained by the schema to `^(PR|VR|V)-[A-Z0-9-]+$`, where: **`PR-*`** (pattern-structural — e.g. `PR-ONE-CONCEPT`, `PR-VISUAL`, `PR-TRAVERSAL`, `PR-TRADE-PLACEMENT`, `PR-DAG`) resolve in this suite's sibling `CHARTQUEST_PATTERN_VALIDATION_CONTRACTS.md`; **`VR-*`** resolve in the Curriculum registry; **`V-*`** resolve in the Constitution. "No rule is re-defined here" (schema `validationRules.description`). `PR-VISUAL` *delegates* to the Constitution's chart validators; `PR-*` that concern sequence *reuse* `VR-ORDER` et al. A pattern reaches `approved` only when every applicable validator PASSes ([Object Model §4](CHARTQUEST_PATTERN_OBJECT_MODEL.md)); the whole chain is `blocksImplementation: true`.

**Tradeoffs.** A reader must consult three registries to fully validate one pattern. We accept that: three thin authoritative registries beat one fat forked one. The `PR-*` layer must be kept genuinely thin — every rule expressible as `V-*` or `VR-*` belongs there, not here.

**Long-Term Benefits.** When the Constitution tightens a floor or the Curriculum tightens teach-order, patterns inherit the tightening for free. `PR-*` stays small and comprehensible. The default-closed discipline (an unmet contract is a hard stop, never a silent fallback) extends to patterns unchanged.

**Future Risks.** `PR-*` scope-creeps into re-checking geometry or teach-order "for convenience," forking the registries P7 protects. Early-warning sign: a `PR-*` predicate that reads a pixel band or a `guardian` directly instead of delegating. Mitigation: any `PR-*` that duplicates a `V-*`/`VR-*` assertion is deleted and replaced by a reference in code review.

**Review Date.** On ratification of `CHARTQUEST_PATTERN_VALIDATION_CONTRACTS.md`, and on any `V-*`/`VR-*` registry change.

---

## ADR-P8 — The Lesson→Pattern reference direction is one-way, by compatibility

**Problem.** If a pattern named the concrete lesson it belongs to, reuse would die: the many-lessons-share-one-momentum-pattern relationship would be impossible, and moving a pattern between lessons would mean re-authoring the pattern. Bidirectional hard coupling also creates two places that must agree about the same link.

**Context.** The Curriculum owns the Lesson object and its reference fields; `VR-REFS` requires that "every asset id a lesson references — `learn.patternRef`, … resolves to a real, existing asset." The Concept Catalogue is intentionally many-patterns-to-one-concept ([ADR-P4](#adr-p4--a-pattern-anchors-exactly-one-primary-concept)), and lessons select among compatible patterns. The ship gate is one-directional: "only an `approved`/`production` pattern may be named by a production `Lesson.patternRef`" ([Object Model §4](CHARTQUEST_PATTERN_OBJECT_MODEL.md)).

**Alternatives Considered.**
1. **Pattern stores its owning `lessonId`.** Rejected: hard-couples one pattern to one lesson, killing reuse and duplicating the link.
2. **Bidirectional link** (lesson names pattern *and* pattern names lesson). Rejected: two sources of the same truth, guaranteed to disagree; also blocks many-to-one.
3. **Lessons point to patterns; patterns declare only compatibility (allow/forbid), never a concrete `lessonId` binding.** Chosen.

**Decision (P8).** The link is **one-way**: `Lesson.learn.patternRef` / `Lesson.requiredPatterns[]` → `Pattern.patternId`. A pattern **declares lesson COMPATIBILITY** via `allowedLessons[]` (or `['any']`) and `forbiddenLessons[]` — "Compatibility only — the lesson decides actual usage" (schema `allowedLessons.description`) — but **never hard-couples to a concrete lessonId**. The lesson resolves the reference (gated by Curriculum `VR-REFS`); the pattern merely advertises the contexts it may serve. Likewise `dependencies[]` links pattern→pattern (a DAG, `PR-DAG`), never pattern→lesson.

**Tradeoffs.** The link's integrity is enforced from the lesson side (`VR-REFS`), so a pattern alone cannot prove it is referenced — that is the point of one-way ownership, but it means "is this pattern used?" is answered by scanning lessons, not by reading the pattern. The `production` status transition ([Object Model §4](CHARTQUEST_PATTERN_OBJECT_MODEL.md)) captures exactly this ("referenced by ≥1 production Lesson").

**Long-Term Benefits.** One pattern serves many lessons; a lesson swaps patterns without touching them. The link exists in exactly one place (the lesson), so it cannot disagree with itself. Retirement is clean: a `deprecated` pattern retires once "no production Lesson references it."

**Future Risks.** `allowedLessons` compatibility hints drift out of sync with which lessons actually reference the pattern, giving a false sense of usage. Early-warning sign: a pattern with `forbiddenLessons` entries that a lesson nonetheless references (or `allowedLessons` naming lessons that no longer exist). Mitigation: compatibility is advisory metadata; the authoritative usage fact is always the set of lesson `patternRef`s resolved by `VR-REFS`.

**Review Date.** On any change to the Lesson schema's `patternRef` / `requiredPatterns` fields.

---

## ADR-9 — Five reference patterns, not fifty

**Problem.** A pattern library is only as good as its worked examples: a future author (or AI) building pattern #200 copies the nearest example. Ship too few and the examples don't span the taxonomy; ship too many and they drift, contradict, and become a second un-owned specification competing with the schema.

**Context.** The schema names five gold-standard structures directly: "The five gold-standard reference patterns are impulse / pullback / breakout / range / reversal" (schema `marketStructure.description`). [Object Model §5](CHARTQUEST_PATTERN_OBJECT_MODEL.md) materializes exactly these five — `impulse-bull`, `pullback-bull`, `breakout-bos`, `range-sr`, `reversal-choch` — as `approved`, and declares them "the only version of reality; other docs cite these verbatim." They span all three chart types (A/B/C), four difficulty tiers (2–4), five `marketStructure` values, and a real `dependencies` chain (`pullback-bull` → `impulse-bull`; `breakout-bos` → `range-sr`; `reversal-choch` → `breakout-bos`).

**Alternatives Considered.**
1. **A large seed set (~50) covering many concepts up front.** Rejected: 50 hand-authored examples become 50 things to keep consistent, and inconsistent examples are worse than none — they teach the wrong geometry by imitation.
2. **Zero examples; the schema alone is the guide.** Rejected: schemas specify shape, not craft. Without worked examples, every author re-derives composition, emotional beat, and trade placement — the slowness [ADR-0](#adr-0--patterns-are-first-class-objects) set out to end.
3. **Exactly five canonical, `approved` reference patterns that span the taxonomy and demonstrate dependencies.** Chosen.

**Decision (ADR-9).** The library ships **five gold-standard reference patterns, not fifty** ([Object Model §5](CHARTQUEST_PATTERN_OBJECT_MODEL.md)). They are the canonical reference implementations: "every future pattern is built by analogy to them," and "other docs cite these verbatim." No document invents alternate examples. Together they demonstrate every required field, all three chart types, the exaggeration-gain range (1.0 → 0.6), a dependency DAG, and both single and multi-direction trade setups — the full vocabulary an author needs, and nothing they must reconcile.

**Tradeoffs.** Five examples do not cover all 23 catalogue concepts; an author building a pattern for, say, `sweep` or `ob` has no exact-concept example and must analogize from the nearest structural match. We accept that: coverage of *structure and craft* matters more than coverage of *every concept*, and five consistent examples beat fifty drifting ones.

**Long-Term Benefits.** Five canonical patterns are cheap to keep perfectly consistent and to re-validate whenever the schema or Constitution moves. They compress build time exactly as [Object Model §6](CHARTQUEST_PATTERN_OBJECT_MODEL.md) promises: copy the closest of five, reference the Constitution for pixels and the catalogue for the concept, run the validators. New authors learn the whole system from five readable records.

**Future Risks.** Pressure to promote convenience patterns to "reference" status, diluting the canonical five into an un-owned example sprawl. Early-warning sign: a sixth pattern described as a "reference" or "gold-standard." Mitigation: exactly these five are canonical; all others are ordinary library entries built *by analogy*, never new sources of truth. Growing the reference set is a ratified amendment to §5, not an ad-hoc addition.

**Review Date.** When the library first needs a pattern whose structure none of the five resembles (a genuinely new `marketStructure` or `patternFamily`), reconsider whether a sixth reference is warranted.

---

## Cross-cutting invariants (the through-line of all ten records)

1. **One source per fact.** Shape → the schema (P1). Geometry → the Constitution (P2). Concept identity → the Catalogue (P3). Trade truth → `trading_canon` (P6). Sequence → the Curriculum. No fact has two homes ([ADR-P5](#adr-p5--the-pattern--lesson-ownership-split)).
2. **Reference, never restate.** Every seam is a typed pointer (`requiredVisualRules.authority`, `tradeTruthRef`, `validationRules[]`, `patternRef`), not a copy.
3. **Default-closed validation.** Every applicable `PR-*`/`VR-*`/`V-*` is `blocksImplementation: true`; an unmet contract is a hard stop, not a silent fallback ([Curriculum §0](../curriculum-engine/CHARTQUEST_VALIDATION_CONTRACTS.md)).
4. **One concept, one direction of coupling.** A pattern anchors one concept (P4) and is *referenced by* lessons, never bound to them (P8).
5. **The visual layer can never hold an outcome.** The trade-truth firewall (P6) is structural, not conventional.

**Amendment procedure.** A frozen decision (P1–P8) changes only by editing the schema's `$comment` **and** the matching ADR here in the same change, with a schema `breakingChanges` entry and a `migrationNotes` note. This document is the rationale of record; the schema is the law. Where they conflict, [the schema and the Object Model govern](CHARTQUEST_PATTERN_SCHEMA.json).
