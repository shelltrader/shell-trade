> **STATUS: RATIFIED** — ChartQuest Architecture v1.0 · Ratified 2026-07-15
> **Do not modify directly.** Part of the official ChartQuest ratified architecture. Changes require an ADR, migration notes, approval, and re-ratification — see `docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md`.

# ChartQuest Canonical Object Registry

**Status: CANONICAL, v1.0.0, ratified 2026-07-15.** This registry names the **single source of truth (SoT)** for every major object in ChartQuest's educational system. It exists to end the drift the 5-lens review found (four divergent lesson schemas across the suite). **Rule: if any document conflicts with the SoT named here, the SoT wins and the document is wrong.** Every other document REFERENCES these objects by field name; none re-declares them.

This is deliberately minimal. It adds no architecture beyond the two artifacts required — this Registry and [`CHARTQUEST_LESSON_SCHEMA.json`](CHARTQUEST_LESSON_SCHEMA.json) — so that implementation can accelerate.

---

## 1. Object → Single Source of Truth

| Object | Single Source of Truth | Everyone else… |
|---|---|---|
| **Lesson** (shape/fields) | [`CHARTQUEST_LESSON_SCHEMA.json`](CHARTQUEST_LESSON_SCHEMA.json) | references field names; never re-declares a field table |
| **Lesson** (human companion) | `CHARTQUEST_LESSON_OBJECT_MODEL.md` (annotates the JSON; adds nothing normative) | — |
| **Concept** (identity + `conceptKey` + `→ masteryCategory`) | the Concept Catalogue (owned by **Pattern Library**, Phase 2; today the live keys are `LESSON_MASTERY` @chart-quest.html:3795) | lessons reference a `conceptKey` only |
| **Mastery Category** (the 7) | `MASTERY_CATS` @3788 → mirrored in the schema `masteryCategory` enum | reference the enum |
| **Curriculum Graph / Guardian roster** | `CHARTQUEST_CURRICULUM_GRAPH.md` (one roster table, one edge set) | reference node/edge ids |
| **Validation Rule (`VR-*`)** | `CHARTQUEST_VALIDATION_CONTRACTS.md` (the ONLY VR registry) | cite VR ids by link; never list rules locally |
| **System ownership** | `CHARTQUEST_SYSTEM_INTERFACES.md` (one ownership matrix) | reference it |
| **Authoring pipeline / state machines** | `CHARTQUEST_AUTHORING_PIPELINE.md` | reference stage/state names |
| **Data exchange contracts** | `CHARTQUEST_DATA_CONTRACTS.md` (I/O envelopes only — NOT a second lesson schema) | reference the JSON `$id` |
| **Trade truth / causality** | `docs/canon/trading_canon.md` + `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` | reference; never restate trade logic |
| **All candle/chart visuals** | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (Appendix A.6 spine) | reference; never restate geometry |
| **Rendering engine reality** | `docs/implementation/VISUAL_MARKET_PHASE1_AUDIT.md` (`window.CQ`) | reference |

## 2. Frozen Decisions

These resolve every contradiction the review found. They are LAW; encoded in the schema's `$comment`.

| id | Decision |
|---|---|
| **D1 — Placement** | `guardian` (0..10) is the **one authored** placement field. `hour` and `unlockLevel` are **aliases equal to `guardian`** — never separately authored, never DAG-derived. (Kills the "authored vs derived hour" contradiction and the `bos` hour-2-vs-3 drift.) |
| **D2 — The gate** | The knowledge gate is **`taught(conceptKey)`**, owned by the Curriculum Engine, read by lesson/trade/boss alike. The argument is a lesson's `primaryConcept`, **never a `lessonId`**. |
| **D3 — Concept ids** | Every `conceptKey`/`primaryConcept` is a **short snake_case key matching live code** (`bos`, `choch`, `vwap`, `risk_reward`, `what_is_sl`, `support_resist`, …) — no invented long forms. |
| **D4 — One concept** | A lesson teaches **exactly one** `primaryConcept`. |
| **D5 — Concept ownership** | Concept identity and `concept → masteryCategory` are owned by the **Concept Catalogue (Pattern Library)**. A lesson only **references** a `conceptKey`; it does not own the category. (Kills the two-owner overlap.) |
| **D6 — One VR registry** | `CHARTQUEST_VALIDATION_CONTRACTS.md` is the **sole** `VR-*` registry. Lessons carry VR **ids**; other docs cite ids by link. |
| **D7 — Intro boss** | `guardian: 0` = **The Gambler** (intro/teaching boss). `guardian == test.guardian` is permitted at 0. |
| **D8 — Cut ceremony** | No SemVer envelopes, content-hashing, or tri-format (JSON+YAML+MD) duplication of the lesson object. The lesson exists once, as JSON, validated against the schema. This is a single-file, harness-less game; ceremony that does not accelerate shipping is removed. |

## 3. Canonical example lessons

These four instances are the **only** version of reality. Every doc that shows a worked example uses **exactly these values** (regenerated from the schema + `MASTERY_CAT_LEVEL` placement). Fields omitted here are optional.

```json
[
  {
    "lessonId": "bos", "schemaVersion": "1.0.0", "status": "production", "owner": "curriculum",
    "primaryConcept": "bos", "title": "Break of Structure", "masteryCategory": "Structure", "guardian": 3, "difficultyTier": 3,
    "learningObjective": "Spot when a price break means the trend keeps going.",
    "prerequisites": ["what_is_trend", "support_resist"], "unlocks": ["choch"], "reinforces": ["candle_close"],
    "learn": { "patternRef": "pat_bos_up", "lessonChartScene": "bos", "text": "When price CLOSES past the last high, the trend keeps going. That break is a Break of Structure." },
    "practice": { "minTrades": 3, "setups": ["bos_long_1", "bos_long_2", "bos_cont"] },
    "apply": { "tradeScenarioRef": "scn_bos_uptrend", "regime": "uptrend", "evidence": ["higher high broke", "strong close"], "honestOutcome": "win" },
    "test": { "bossRoundId": "bos", "mgId": "bos", "guardian": 3 },
    "assessment": { "question": "Price just CLOSED above the last high. What is that?", "choices": ["A Break of Structure — the trend keeps going", "A reversal — the trend flips"], "correct": 0, "why": "A close beyond the last high means buyers won, so the trend continues." },
    "misconceptions": [ { "belief": "A wick past the high counts as a break", "distractor": "It broke as soon as the wick poked through", "whyWrong": "Only the CLOSE counts — a wick that closes back is a fake-out.", "remediationConceptKey": "candle_close" } ],
    "beat": { "hook": "The Guardian dares you: is this the real break, or a trap?", "stakes": "Call it wrong and the trend fools you.", "payoff": "You read the close and rode the trend." },
    "validationRules": ["VR-OBJECTIVE", "VR-SINGLE-PRIMARY", "VR-ORDER", "VR-TAUGHT-BEFORE-TEST"]
  },
  {
    "lessonId": "choch", "schemaVersion": "1.0.0", "status": "production", "owner": "curriculum",
    "primaryConcept": "choch", "title": "Change of Character", "masteryCategory": "Structure", "guardian": 3, "difficultyTier": 3,
    "learningObjective": "Spot when a break means the trend is FLIPPING, not continuing.",
    "prerequisites": ["bos"], "unlocks": [], "reinforces": ["bos"],
    "learn": { "patternRef": "pat_choch", "lessonChartScene": "choch", "text": "When price breaks the OTHER way for the first time, the trend's character changed." },
    "practice": { "minTrades": 3, "setups": ["choch_1", "choch_2", "choch_flip"] },
    "apply": { "tradeScenarioRef": "scn_choch_flip", "regime": "reversal", "evidence": ["first lower low", "momentum flipped"], "honestOutcome": "win" },
    "test": { "bossRoundId": "choch", "mgId": "choch", "guardian": 3 },
    "assessment": { "question": "In an uptrend, price makes its first LOWER low. What is that?", "choices": ["A Change of Character — trend may flip", "Just a pullback — trend continues"], "correct": 0, "why": "The first break the other way is the trend changing character." }
  },
  {
    "lessonId": "risk_reward", "schemaVersion": "1.0.0", "status": "production", "owner": "curriculum",
    "primaryConcept": "risk_reward", "title": "Risk : Reward", "masteryCategory": "RiskMgmt", "guardian": 5, "difficultyTier": 3,
    "learningObjective": "Only take trades that can win more than they risk.",
    "prerequisites": ["what_is_sl"], "unlocks": [], "reinforces": ["what_is_sl"],
    "learn": { "patternRef": "pat_rr_2to1", "lessonChartScene": "risk_reward", "text": "If you can win $2 while risking $1, that's a 2:1 trade. Take those." },
    "practice": { "minTrades": 3, "setups": ["rr_2to1", "rr_3to1", "rr_bad"] },
    "apply": { "tradeScenarioRef": "scn_rr_setup", "regime": "range_breakout", "evidence": ["stop is close", "target is far"], "honestOutcome": "win" },
    "test": { "bossRoundId": "rr", "mgId": "rr", "guardian": 5 },
    "assessment": { "question": "You risk $1 to make $2. What is the reward-to-risk?", "choices": ["2 to 1 — a good trade", "1 to 2 — a bad trade"], "correct": 0, "why": "Reward ($2) over risk ($1) is 2:1 — the kind of trade to take." }
  },
  {
    "lessonId": "vwap", "schemaVersion": "1.0.0", "status": "production", "owner": "curriculum",
    "primaryConcept": "vwap", "title": "VWAP", "masteryCategory": "Trend", "guardian": 2, "difficultyTier": 2,
    "learningObjective": "Use the VWAP line as the day's fair-price magnet.",
    "prerequisites": ["what_is_trend"], "unlocks": ["vwap_trade"], "reinforces": ["what_is_trend"],
    "learn": { "patternRef": "pat_vwap", "lessonChartScene": "vwap", "text": "VWAP is the day's average price. Price likes to come back to it." },
    "practice": { "minTrades": 3, "setups": ["vwap_bounce", "vwap_reject", "vwap_ride"] },
    "apply": { "tradeScenarioRef": "scn_vwap_bounce", "regime": "trend_day", "evidence": ["price above VWAP", "pullback to line"], "honestOutcome": "win" },
    "test": { "bossRoundId": "vwap", "mgId": "vwap", "guardian": 2 },
    "assessment": { "question": "Price pulls back to the VWAP line in an uptrend. What often happens?", "choices": ["It bounces — VWAP acts as support", "It ignores VWAP completely"], "correct": 0, "why": "VWAP is the fair-price magnet; in an uptrend it often supports price." }
  }
]
```

## 4. How every other document must cite this

1. To describe a lesson field, **name it and link the schema**: "``guardian`` (see `CHARTQUEST_LESSON_SCHEMA.json`)". Do **not** paste a field table.
2. To show an example, **copy from §3 verbatim** — never invent alternate values.
3. To reference a rule, cite its **`VR-*` id** (resolved in `CHARTQUEST_VALIDATION_CONTRACTS.md`).
4. To reference a concept, use its **short snake_case `conceptKey`** (D3).
5. On any conflict, this Registry and the schema **govern**.

## 5. Duplication eliminated (kill-list)

- **Four divergent lesson schemas** → one JSON schema; the other seven docs de-declared.
- **Three VR registries** → one (`VALIDATION_CONTRACTS`).
- **`taught(conceptKey)` vs `taught(lessonId)`** → `taught(conceptKey)` (D2).
- **`hour` authored vs derived** → `guardian` only (D1).
- **`bos` at hour 2 vs 3; `risk_reward` at 5 vs 7; `vwap` at 2 vs 8** → the §3 frozen values.
- **Concept→category owned twice** → owned by the Concept Catalogue (D5).
- **Envelope/SemVer/tri-format ceremony** → removed (D8).
