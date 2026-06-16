# Content Event Schema — Shell Trade

> The game emits one structured JSON event per meaningful educational action. These events are the only input the content-generation pipeline (`agents/`, `automation/architecture.md`) ever needs — every agent downstream works from this schema, never from raw gameplay logs. If an event type doesn't appear here, the pipeline doesn't know how to use it; add it here first.

## Common Envelope

Every event, regardless of type, shares this envelope. Type-specific fields live inside `payload`.

```json
{
  "event_id": "uuid",
  "event_type": "trade_win | trade_loss | lesson_completed | boss_encounter | boss_defeated | level_up | achievement_unlocked | pattern_identified | risk_management_success | risk_management_failure",
  "timestamp": "ISO 8601",
  "player_id": "uuid (anonymous/pseudonymous — never PII)",
  "session_id": "uuid",
  "faction": "BTC | ETH | SOL | XRP | DOGE | BNB",
  "player_level": "integer",
  "player_rank": "DRIFTER | PLANKTON | MINNOW | CRAB | PUFFERFISH | OCTOPUS | DOLPHIN | SHARK | WHALE | TRADER",
  "payload": { "...": "type-specific, see below" },
  "educational_metadata": { "...": "see per-type section" },
  "content_flags": {
    "clip_candidate": "boolean — was this captured by the auto-clipping system (automation/auto-clipping.md)?",
    "clip_asset_ref": "string|null — path into content-assets/clips/ if clip_candidate is true",
    "significance_score": "0-100 integer — Content Director triage signal, see below"
  }
}
```

`significance_score` is a simple heuristic the game computes at emit-time (not an agent decision) — e.g., a clean boss-one-shot scores higher than a narrow win, a personal-best scores higher than a routine repeat. The Content Director still makes the final editorial call, but this field lets low-signal events skip the pipeline cheaply.

---

## 1. `trade_win`

**Required fields:** `direction` (long/short), `entry_price`, `exit_price`, `risk_percent`, `stop_loss_price`, `take_profit_price`, `leverage`, `pnl_shells`, `setup_type` (e.g., "order_block_bounce", "vwap_reclaim", "structure_break").
**Optional fields:** `lesson_ref` (which Hour's concept this trade demonstrates), `personal_best` (boolean), `streak_count` (consecutive wins).

**Educational metadata:** `concept_demonstrated` (e.g., "risk:reward discipline," "patient entry at a confirmed Order Block"), `grade` (game's own setup-quality grading, independent of outcome — a good setup can still lose, per `PROJECT_STATUS.md` trade-psychology design).

**Content generation opportunities:** Trading Education breakdowns ("here's the setup that worked and why"); Turtle Journey progress beats; Build-in-public proof-of-concept that the teaching mechanics produce real decision quality, not just luck.

```json
{
  "event_type": "trade_win",
  "payload": {
    "direction": "long",
    "entry_price": 64200,
    "exit_price": 65100,
    "risk_percent": 1.5,
    "stop_loss_price": 63800,
    "take_profit_price": 65100,
    "leverage": 3,
    "pnl_shells": 180,
    "setup_type": "order_block_bounce",
    "lesson_ref": "hour_3_structure",
    "personal_best": false,
    "streak_count": 2
  },
  "educational_metadata": {
    "concept_demonstrated": "Entered on a confirmed Order Block bounce instead of chasing the breakout candle.",
    "grade": "A"
  }
}
```

## 2. `trade_loss`

**Required fields:** same trade fields as `trade_win`, plus `loss_reason` (e.g., "stopped_out", "invalidated_structure").
**Optional fields:** `grade` (a bad outcome on a good setup is still gradeable as good, per the game's psychology design), `would_have_won_without_sl` (boolean — useful for "your stop-loss did its job even though it stung" framing).

**Educational metadata:** `concept_demonstrated`, `is_teachable_mistake` (boolean — was this a process error, e.g. oversized risk, or just a fine setup that didn't work out, which is normal and not a mistake).

**Content generation opportunities:** The most credibility-building content type available — showing losses openly (per `marketing/brand-voice.md`) is core to brand trust. Strong source for "good setups can still lose" Trading Education content and for risk-management-success companion pieces when the stop-loss worked as intended.

```json
{
  "event_type": "trade_loss",
  "payload": {
    "direction": "short",
    "entry_price": 65400,
    "exit_price": 65900,
    "risk_percent": 1.0,
    "stop_loss_price": 65900,
    "take_profit_price": 64200,
    "leverage": 2,
    "pnl_shells": -90,
    "setup_type": "vwap_rejection",
    "loss_reason": "stopped_out"
  },
  "educational_metadata": {
    "concept_demonstrated": "Stop-loss triggered exactly at the invalidation level — the setup failed cleanly, the risk plan worked.",
    "is_teachable_mistake": false
  }
}
```

## 3. `lesson_completed`

**Required fields:** `hour` (curriculum Hour number), `lesson_id`, `lesson_title`, `quiz_score`, `attempts`.
**Optional fields:** `time_spent_seconds`, `terms_unlocked` (array of glossary terms newly unlocked, from `TERMS`).

**Educational metadata:** `concept_summary` (one-line plain-language takeaway), `difficulty_tier`.

**Content generation opportunities:** Market/Trading Education explainer source material; Turtle Journey progression beats ("Shell just learned what VWAP means"); evergreen YouTube/X explainer content built directly from lesson substance.

```json
{
  "event_type": "lesson_completed",
  "payload": {
    "hour": 4,
    "lesson_id": "vwap_intro",
    "lesson_title": "VWAP as Institutional Fair Value",
    "quiz_score": 100,
    "attempts": 1,
    "terms_unlocked": ["VWAP", "Fair Value"]
  },
  "educational_metadata": {
    "concept_summary": "VWAP shows the average price institutions actually paid today — it acts like a magnet and a support/resistance line.",
    "difficulty_tier": "intermediate"
  }
}
```

## 4. `boss_encounter`

**Required fields:** `boss_id` (0–6), `boss_name`, `boss_emoji`, `hour`, `attempt_number`, `boss_hp`, `player_hp`.
**Optional fields:** `is_first_attempt` (boolean).

**Educational metadata:** `concept_tested` (the Hour's core teaching focus that this boss validates — e.g. Boss 2 "The Liquidator" tests stop-loss discipline/1-2% risk/R:R/leverage danger).

**Content generation opportunities:** Turtle Journey cold-opens/cliffhangers ("Shell is about to face The Structure Shark"); trailer-style teaser clips; Build-in-public previews when a new boss ships.

```json
{
  "event_type": "boss_encounter",
  "payload": {
    "boss_id": 3,
    "boss_name": "THE STRUCTURE SHARK",
    "boss_emoji": "🦈",
    "hour": 3,
    "attempt_number": 1,
    "boss_hp": 5,
    "player_hp": 3,
    "is_first_attempt": true
  },
  "educational_metadata": {
    "concept_tested": "Break of Structure (BOS), Order Blocks, and Change of Character (ChoCh)"
  }
}
```

## 5. `boss_defeated`

**Required fields:** `boss_id`, `boss_name`, `attempts_to_defeat`, `damage_taken`, `reward_shells`, `reward_xp`, `clean_win` (boolean — defeated without taking damage).
**Optional fields:** `time_to_defeat_seconds`, `is_personal_best`.

**Educational metadata:** `concept_mastered`, `mastery_signal` (e.g., "first-attempt clean win" is strong signal of genuine understanding vs. "defeated on 5th attempt" which is still a win worth celebrating but a different narrative).

**Content generation opportunities:** The single highest-signal content moment in the schema — Turtle Journey climaxes, shareable clip-worthy wins, and (per `content-events/schema.md` significance scoring) usually the highest `significance_score` events in the stream, especially on `clean_win: true` or `is_personal_best: true`.

```json
{
  "event_type": "boss_defeated",
  "payload": {
    "boss_id": 2,
    "boss_name": "THE LIQUIDATOR",
    "attempts_to_defeat": 1,
    "damage_taken": 0,
    "reward_shells": 350,
    "reward_xp": 140,
    "clean_win": true,
    "is_personal_best": true
  },
  "educational_metadata": {
    "concept_mastered": "Stop-loss discipline, 1-2% risk sizing, risk:reward ratio, leverage danger",
    "mastery_signal": "first-attempt clean win"
  }
}
```

## 6. `level_up`

**Required fields:** `new_level`, `previous_level`, `rank_changed` (boolean), `new_rank`, `previous_rank`.
**Optional fields:** `xp_total`, `days_since_last_level_up`.

**Educational metadata:** `rank_milestone_note` (the rank's in-game "blurb" description, reused verbatim for content so it stays consistent with what the game itself says).

**Content generation opportunities:** Turtle Journey progression beats, especially when `rank_changed` is true — rank-up moments are the cleanest "show visible growth" content unit in the entire schema, ideal for Stories/Shorts.

```json
{
  "event_type": "level_up",
  "payload": {
    "new_level": 9,
    "previous_level": 8,
    "rank_changed": true,
    "new_rank": "PUFFERFISH",
    "previous_rank": "CRAB",
    "xp_total": 4200
  },
  "educational_metadata": {
    "rank_milestone_note": "Pufferfish traders are learning to puff up their position size carefully — not recklessly."
  }
}
```

## 7. `achievement_unlocked`

**Required fields:** `achievement_id`, `achievement_name`, `achievement_description`.
**Optional fields:** `rarity_tier` (e.g., "common," "rare," "legendary" — if/when an achievement-rarity system exists), `reward_shells`.

**Educational metadata:** `concept_tied_to` (if the achievement is tied to a specific skill rather than a pure milestone, e.g. "10 trades in a row with a stop-loss set").

**Content generation opportunities:** Lightweight, high-frequency content filler — good for Stories, quick X posts, and maintaining posting cadence on lighter content days without manufacturing significance that isn't there.

```json
{
  "event_type": "achievement_unlocked",
  "payload": {
    "achievement_id": "disciplined_ten",
    "achievement_name": "Disciplined Ten",
    "achievement_description": "Set a stop-loss on 10 consecutive trades.",
    "reward_shells": 100
  },
  "educational_metadata": {
    "concept_tied_to": "Consistent risk-management habit formation, not a single lucky decision."
  }
}
```

## 8. `pattern_identified`

**Required fields:** `pattern_type` (e.g., "doji", "wick_rejection", "order_block", "vwap_reclaim", "change_of_character"), `correct` (boolean), `confidence_context` (e.g., quiz vs. live boss fight vs. live trade).
**Optional fields:** `time_to_identify_seconds`.

**Educational metadata:** `pattern_definition` (plain-language definition pulled from the in-game `TERMS` glossary, kept identical to avoid terminology drift per `agents/trading-educator.md`).

**Content generation opportunities:** Bite-sized Trading Education content — "can you spot the [pattern] before Shell does" interactive-style formats, quiz-style carousel/Reels content.

```json
{
  "event_type": "pattern_identified",
  "payload": {
    "pattern_type": "order_block",
    "correct": true,
    "confidence_context": "boss_fight",
    "time_to_identify_seconds": 4
  },
  "educational_metadata": {
    "pattern_definition": "An Order Block is the last opposing-colour candle before a structure break — it marks where big players likely entered."
  }
}
```

## 9. `risk_management_success`

**Required fields:** `mechanism` (e.g., "stop_loss_triggered", "position_sized_correctly", "avoided_overleverage"), `capital_saved_shells` (estimated Shells saved versus a counterfactual without the risk control).
**Optional fields:** `related_trade_event_id` (links to the `trade_loss` or `trade_win` event this is paired with).

**Educational metadata:** `principle_demonstrated`.

**Content generation opportunities:** The cornerstone of the "educational authority over hype" growth strategy (`company-context.md`) — "your stop-loss saved you $400" is the flagship Trading Education content format and should be one of the highest-frequency content types generated from the schema.

```json
{
  "event_type": "risk_management_success",
  "payload": {
    "mechanism": "stop_loss_triggered",
    "capital_saved_shells": 410,
    "related_trade_event_id": "evt_8841"
  },
  "educational_metadata": {
    "principle_demonstrated": "A stop-loss isn't a sign you were wrong — it's the tool that keeps being wrong cheap."
  }
}
```

## 10. `risk_management_failure`

**Required fields:** `mechanism` (e.g., "no_stop_loss_set", "overleveraged", "oversized_risk_percent"), `capital_lost_shells`, `risk_percent_used`.
**Optional fields:** `related_trade_event_id`.

**Educational metadata:** `principle_violated`, `is_recoverable_lesson` (boolean — almost always true; framing should be corrective, never shaming, per `marketing/brand-voice.md`).

**Content generation opportunities:** Cautionary-but-empathetic Trading Education content — pairs naturally with the "Liquidated Luis" persona in `company-context.md`. Must be handled carefully per brand voice: the lesson is the point, not mockery of the mistake.

```json
{
  "event_type": "risk_management_failure",
  "payload": {
    "mechanism": "overleveraged",
    "capital_lost_shells": 600,
    "risk_percent_used": 8.0
  },
  "educational_metadata": {
    "principle_violated": "Risking 8% on a single trade turns a normal pullback into a near-liquidation. 1-2% keeps you in the game.",
    "is_recoverable_lesson": true
  }
}
```

---

## Implementation Notes

- Events are emitted client-side by the game (`chart-quest.html`) at the moment the action completes, and POSTed to the content database described in `automation/architecture.md`. No event should ever require a server round-trip to compute — the game already has every field listed above in memory at the moment of the action.
- All `player_id`/`session_id` values are pseudonymous identifiers, never email addresses or other PII — the content pipeline only ever needs gameplay facts, never player identity.
- `significance_score` is a simple, transparent heuristic (e.g., weighted by clean win, personal best, streak length, boss tier) computed at emit-time so low-signal events can be cheaply filtered before they ever reach the Content Director.
- New event types should be added to this file before they're wired into the game — the schema is the contract the entire downstream pipeline depends on.
