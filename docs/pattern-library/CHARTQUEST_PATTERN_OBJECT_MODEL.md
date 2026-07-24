> **STATUS: RATIFIED** — ChartQuest Architecture v1.0 · Ratified 2026-07-15
> **Do not modify directly.** Part of the official ChartQuest ratified architecture. Changes require an ADR, migration notes, approval, and re-ratification — see `docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md`.

# ChartQuest Pattern Object Model

> **CANONICAL REFERENCE.** The single source of truth for the Pattern object is [`CHARTQUEST_PATTERN_SCHEMA.json`](CHARTQUEST_PATTERN_SCHEMA.json). This document is its **human companion** — it explains the object, materializes the Concept Catalogue, and gives the five gold-standard reference patterns. It adds nothing normative the JSON lacks. Where prose and the schema differ, **the schema governs.**

**Status: CANONICAL, v1.0.0, ratified 2026-07-15.** No game code was changed. This is Phase 2A of the ChartQuest architecture: the Pattern Operating System. It **extends** the ratified architecture and duplicates none of it.

---

## 1. Architectural audit — how Patterns integrate (the FIRST TASK)

A pattern sits at the junction of four ratified systems. It **owns** its slice and **references** the rest; there is no duplicated ownership, schema, or validation.

| System (SoT) | What it owns | The Pattern's relationship |
|---|---|---|
| **Pattern OS** (this suite) | market structure, visual educational intent, trade-opportunity *placement*, traversal geometry, emotional beat, **concept identity** | owns — the Pattern object |
| **Visual Market Constitution** (`CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md`) | all candle geometry, readability floors, chart types A/B/C, the visual-clarity validator table | **references** via `requiredVisualRules`; validation *delegates* to its chart validators (never restated) |
| **Curriculum Engine** (`docs/curriculum-engine/`) | lesson sequencing, the `taught()` gate, `VR-*` rules, the Lesson object | Lessons **reference** a pattern via `Lesson.learn.patternRef` / `requiredPatterns[]`; pattern validation *reuses* `VR-*` |
| **Trading canon / TES** | trade truth: outcome, probability, causality | **references** via `tradeOpportunities[].tradeTruthRef`; a pattern encodes *where/how-clear*, never an outcome |

**Ownership law (no overlap).** Patterns own: market structure · visual educational intent · trade opportunities (placement) · traversal geometry · emotional beat · concept identity. Lessons own: learning sequence · lesson flow · notebook · replay sequence · trade scripting. A field appears in exactly one of these lists.

**The Concept Catalogue lives here.** Curriculum decision **D5** assigned concept identity and `concept → masteryCategory` to the Pattern Library. §2 materializes it. Lessons and patterns both *reference* conceptKeys; neither re-owns the category.

## 2. The Concept Catalogue (Pattern OS owns this)

`conceptKey → { masteryCategory, guardian }`. Categories are the 7 live `MASTERY_CATS`; `guardian` = `MASTERY_CAT_LEVEL[category]` (chart-quest.html:3792). This is the sole map of concept → category; `Pattern.primaryConcept` and `Lesson.primaryConcept` both resolve here.

```json
{
  "candles_intro": { "masteryCategory": "Structure", "guardian": 3 },
  "what_is_doji":  { "masteryCategory": "Structure", "guardian": 3 },
  "long_vs_short": { "masteryCategory": "Structure", "guardian": 3 },
  "momentum":      { "masteryCategory": "Structure", "guardian": 3 },
  "pullback":      { "masteryCategory": "Structure", "guardian": 3 },
  "bos":           { "masteryCategory": "Structure", "guardian": 3 },
  "choch":         { "masteryCategory": "Structure", "guardian": 3 },
  "bull_patterns": { "masteryCategory": "Structure", "guardian": 3 },
  "bear_patterns": { "masteryCategory": "Structure", "guardian": 3 },
  "head_shoulders":{ "masteryCategory": "Structure", "guardian": 3 },
  "what_is_trend": { "masteryCategory": "Trend", "guardian": 2 },
  "support_resist":{ "masteryCategory": "Trend", "guardian": 2 },
  "vwap":          { "masteryCategory": "Trend", "guardian": 2 },
  "vwap_trade":    { "masteryCategory": "Trend", "guardian": 2 },
  "trendlines":    { "masteryCategory": "Trend", "guardian": 2 },
  "sweep":         { "masteryCategory": "Liquidity", "guardian": 4 },
  "ob":            { "masteryCategory": "OrderBlocks", "guardian": 4 },
  "what_is_sl":    { "masteryCategory": "RiskMgmt", "guardian": 5 },
  "risk_reward":   { "masteryCategory": "RiskMgmt", "guardian": 5 },
  "leverage_intro":{ "masteryCategory": "RiskMgmt", "guardian": 5 },
  "htf":           { "masteryCategory": "MultiTF", "guardian": 8 },
  "htf_align":     { "masteryCategory": "MultiTF", "guardian": 8 },
  "confluence":    { "masteryCategory": "TradeMgmt", "guardian": 1 }
}
```

## 3. Field groups (the schema, explained)

The [schema](CHARTQUEST_PATTERN_SCHEMA.json) groups the metadata the brief requires:

- **Identity & lifecycle** — `patternId`, `uuid`, `version`, `schemaVersion`, `status`, `owner`, `lastReviewed`.
- **Educational** — `primaryConcept` (one, P4), `supportingConcepts`, `educationalPurpose`, `difficultyTier`.
- **Market & visual (owned)** — `marketStructure`, `patternFamily`, `patternCategory`, `chartTypes`, `requiredCandleVocabulary`, `requiredTerrainCharacteristics`, `requiredVisualRules` (references the Constitution, P2), `requiredEmotionalBeat`.
- **Player pedagogy** — `expectedPlayerObservation`, `expectedBeginnerMistake`, `teachingNotes`.
- **Integration (compatibility, not coupling, P8)** — `allowedLessons`/`forbiddenLessons`, `allowedTradeTypes`/`forbiddenTradeTypes`, `replayCompatibility`, `notebookCompatibility`, `journalCompatibility`, `analyticsEvents`.
- **Trade opportunity (placement, not truth, P6)** — `tradeOpportunities[]`.
- **Governance** — `validationRules` (PR-*/VR-*/V-*), `dependencies`, `breakingChanges`, `migrationNotes`, `retirementRules`.

## 4. Pattern lifecycle state machine

`draft → in_review → validated → approved → production → deprecated → retired`

| From | To | Guard (transition condition) |
|---|---|---|
| `draft` | `in_review` | all required schema fields present (`SCHEMA-VALID`) |
| `in_review` | `validated` | every applicable `PR-*` + delegated `V-*`/`VR-*` PASS (CHARTQUEST_PATTERN_VALIDATION_CONTRACTS.md) |
| `validated` | `approved` | Human Playtest Gate on file (≥5 children, ≥90%, ≥1 CVD) + owner sign-off |
| `approved` | `production` | referenced by ≥1 production Lesson; shipped |
| `production` | `deprecated` | superseded; `migrationNotes` set |
| `deprecated` | `retired` | no production Lesson references it; `retirementRules` satisfied |

**Ship gate:** only an `approved`/`production` pattern may be named by a production `Lesson.patternRef`. A lesson referencing a non-approved pattern fails Curriculum `VR-REFS`.

## 5. The five gold-standard reference patterns

These are the canonical reference implementations — every future pattern is built by analogy to them. They are the only version of reality; other docs cite these verbatim.

```json
[
  {
    "patternId": "impulse-bull", "schemaVersion": "1.0.0", "status": "approved", "owner": "pattern-library",
    "primaryConcept": "momentum", "supportingConcepts": ["long_vs_short"],
    "educationalPurpose": "Feel one strong push: when buyers take over, price runs.",
    "difficultyTier": 2, "marketStructure": "impulse", "patternFamily": "momentum", "chartTypes": ["B"],
    "requiredCandleVocabulary": ["body", "close"],
    "requiredTerrainCharacteristics": { "targetVisibleCount": 12, "rhythmProfile": "a rising staircase of strong green bodies, one clear big push", "verticalityIntent": "steady climb, net up" },
    "requiredVisualRules": { "authority": "CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table", "chartType": "B", "exaggerationGain": 0.6 },
    "requiredEmotionalBeat": { "hook": "The buyers wake up.", "stakes": "Miss the push and you miss the move.", "payoff": "You rode the run up." },
    "expectedPlayerObservation": "Green bodies get bigger and price keeps climbing.",
    "expectedBeginnerMistake": "Thinking one green candle already means a trend.",
    "allowedLessons": ["momentum"], "allowedTradeTypes": ["long"],
    "tradeOpportunities": [ { "decisiveCandle": "the third strong green close", "direction": "long", "readsAs": "each candle closes near its high", "tradeTruthRef": "trading_canon:momentum_long" } ],
    "replayCompatibility": true, "notebookCompatibility": true, "journalCompatibility": true,
    "validationRules": ["PR-ONE-CONCEPT", "PR-VISUAL", "PR-TRAVERSAL", "PR-TRADE-PLACEMENT", "VR-ORDER"], "dependencies": []
  },
  {
    "patternId": "pullback-bull", "schemaVersion": "1.0.0", "status": "approved", "owner": "pattern-library",
    "primaryConcept": "pullback", "supportingConcepts": ["momentum"],
    "educationalPurpose": "See price rest before it goes again — a pullback is a pause, not a stop.",
    "difficultyTier": 2, "marketStructure": "pullback", "patternFamily": "continuation", "chartTypes": ["B"],
    "requiredCandleVocabulary": ["body", "wick"],
    "requiredTerrainCharacteristics": { "targetVisibleCount": 12, "rhythmProfile": "up-run, a small dip of 2 red candles, then up again", "verticalityIntent": "climb, shallow dip, climb" },
    "requiredVisualRules": { "authority": "CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table", "chartType": "B", "exaggerationGain": 0.6 },
    "requiredEmotionalBeat": { "hook": "Uh oh — is it turning?", "stakes": "Panic-sell the dip and you miss the next push.", "payoff": "The pause ended and the climb continued." },
    "expectedPlayerObservation": "A short dip that stays above the last low, then green returns.",
    "expectedBeginnerMistake": "Reading the dip as a reversal and bailing.",
    "allowedLessons": ["pullback"], "forbiddenLessons": [], "allowedTradeTypes": ["long"],
    "tradeOpportunities": [ { "decisiveCandle": "the first green close after the dip", "direction": "long", "readsAs": "dip holds above the prior low, buyers step back in", "tradeTruthRef": "trading_canon:pullback_long" } ],
    "replayCompatibility": true, "notebookCompatibility": true, "journalCompatibility": true,
    "validationRules": ["PR-ONE-CONCEPT", "PR-VISUAL", "PR-TRAVERSAL", "PR-TRADE-PLACEMENT", "VR-ORDER"], "dependencies": ["impulse-bull"]
  },
  {
    "patternId": "breakout-bos", "schemaVersion": "1.0.0", "status": "approved", "owner": "pattern-library",
    "primaryConcept": "bos", "supportingConcepts": ["support_resist", "momentum"],
    "educationalPurpose": "Watch price CLOSE past the last high — that break means the trend keeps going.",
    "difficultyTier": 3, "marketStructure": "breakout", "patternFamily": "breakout", "chartTypes": ["A", "B"],
    "requiredCandleVocabulary": ["body", "close", "wick"],
    "requiredTerrainCharacteristics": { "targetVisibleCount": 10, "rhythmProfile": "a ceiling tested twice, then one decisive break-and-go", "verticalityIntent": "flat-ish then a step up through the level" },
    "requiredVisualRules": { "authority": "CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table", "chartType": "A", "exaggerationGain": 1.0 },
    "requiredEmotionalBeat": { "hook": "The ceiling has held twice… will it break?", "stakes": "Guess the break wrong and the trap gets you.", "payoff": "A strong close broke it — you called the Break of Structure." },
    "expectedPlayerObservation": "A candle closes clearly above the level that rejected price twice.",
    "expectedBeginnerMistake": "Counting a wick that pokes above (but closes back) as the break.",
    "allowedLessons": ["bos"], "forbiddenLessons": [], "allowedTradeTypes": ["long"],
    "tradeOpportunities": [ { "decisiveCandle": "the breakout close", "direction": "long", "readsAs": "full body closes past the prior high", "tradeTruthRef": "trading_canon:bos_long" } ],
    "replayCompatibility": true, "notebookCompatibility": true, "journalCompatibility": true,
    "validationRules": ["PR-ONE-CONCEPT", "PR-VISUAL", "PR-TRAVERSAL", "PR-TRADE-PLACEMENT", "PR-DAG", "VR-ORDER"], "dependencies": ["range-sr"]
  },
  {
    "patternId": "range-sr", "schemaVersion": "1.0.0", "status": "approved", "owner": "pattern-library",
    "primaryConcept": "support_resist", "supportingConcepts": [],
    "educationalPurpose": "Spot the floor and the ceiling — in a range, price bounces between them.",
    "difficultyTier": 2, "marketStructure": "range", "patternFamily": "range", "chartTypes": ["B"],
    "requiredCandleVocabulary": ["body", "wick"],
    "requiredTerrainCharacteristics": { "targetVisibleCount": 12, "rhythmProfile": "flat-ish bounce between a floor and ceiling, no net direction", "verticalityIntent": "oscillate within a band" },
    "requiredVisualRules": { "authority": "CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table", "chartType": "B", "exaggerationGain": 0.6 },
    "requiredEmotionalBeat": { "hook": "Price is stuck in a box.", "stakes": "Trade the middle and you get chopped up.", "payoff": "You bought the floor and sold the ceiling." },
    "expectedPlayerObservation": "Price keeps bouncing off the same low and the same high.",
    "expectedBeginnerMistake": "Chasing trades in the middle of the range.",
    "allowedLessons": ["support_resist"], "allowedTradeTypes": ["long", "short"],
    "tradeOpportunities": [ { "decisiveCandle": "the bounce off the floor", "direction": "long", "readsAs": "price rejects the floor with a wick", "tradeTruthRef": "trading_canon:range_bounce" } ],
    "replayCompatibility": true, "notebookCompatibility": true, "journalCompatibility": true,
    "validationRules": ["PR-ONE-CONCEPT", "PR-VISUAL", "PR-TRAVERSAL", "PR-TRADE-PLACEMENT", "VR-ORDER"], "dependencies": []
  },
  {
    "patternId": "reversal-choch", "schemaVersion": "1.0.0", "status": "approved", "owner": "pattern-library",
    "primaryConcept": "choch", "supportingConcepts": ["bos"],
    "educationalPurpose": "Catch the turn: the first break the OTHER way means the trend is changing.",
    "difficultyTier": 4, "marketStructure": "reversal", "patternFamily": "reversal", "chartTypes": ["A", "C"],
    "requiredCandleVocabulary": ["body", "close", "wick"],
    "requiredTerrainCharacteristics": { "targetVisibleCount": 10, "rhythmProfile": "an up-trend that makes its first lower low", "verticalityIntent": "climb, then break down through structure" },
    "requiredVisualRules": { "authority": "CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md#appendix-a-standards-table", "chartType": "A", "exaggerationGain": 1.0 },
    "requiredEmotionalBeat": { "hook": "The trend has been your friend… until now.", "stakes": "Stay long into the turn and you give it all back.", "payoff": "You spotted the Change of Character first." },
    "expectedPlayerObservation": "For the first time, price makes a lower low instead of a higher high.",
    "expectedBeginnerMistake": "Treating the first lower low as just another pullback.",
    "allowedLessons": ["choch"], "forbiddenLessons": ["momentum"], "allowedTradeTypes": ["short"],
    "tradeOpportunities": [ { "decisiveCandle": "the close below the last higher-low", "direction": "short", "readsAs": "structure breaks the opposite way", "tradeTruthRef": "trading_canon:choch_short" } ],
    "replayCompatibility": true, "notebookCompatibility": true, "journalCompatibility": true,
    "validationRules": ["PR-ONE-CONCEPT", "PR-VISUAL", "PR-TRAVERSAL", "PR-TRADE-PLACEMENT", "PR-DAG", "VR-ORDER"], "dependencies": ["breakout-bos"]
  }
]
```

## 6. How this cuts build time

A future author (or AI) creating pattern #200 fills one schema, copies the closest of these five, references the Visual Constitution for pixels and the Concept Catalogue for the concept, and runs the validators. No geometry is re-invented, no concept is re-categorized, no lesson is pre-supposed — the reasons Levels 1–3 were slow.
