# ChartQuest — Level 2 & Level 3 Learning Loop Rebuild (build 221 → 222)

**Date:** 2026-07-03 (overnight sprint 2) · **Directive:** bring L2/L3 to L1's LEARN→PRACTICE→APPLY→TEST standard. No new concepts, no new bosses, no new systems.
**Read first:** Design Constitution · CHARTQUEST_CONSTITUTION_AUDIT_v214 · CHARTQUEST_FIRST3_LEVELS_AUDIT_v217 · BOSS_ROUND_TPAT_AUDIT_v218 (+addenda) · LessonChart engine (block 2, `LessonChart` IIFE ~18961) · `openIntroLesson`/`openConceptPractice` (block 2) · `CONCEPT_PRACTICE` · mastery gate (`tradeGateRequired`) · `BOSS_CAST`/`openBoss`.

## 1–2 · Current L2/L3 flow (as of build 221, code-traced)

| Beat | Level 2 today | Level 3 today |
|---|---|---|
| Level entry | `closeIntermission` force-queues **text cards** back-to-back: MORE REASONS → WHAT IS A TREND? → SUPPORT & RESISTANCE (6390) | Text cards: BOS → ChoCh |
| Practice | Required recall tap on cards; **required practice overlays added in build 219** fire off card dismissal (trend → HIGHER HIGH; support_resist → SUPPORT bounce; bos; choch) — but they chain immediately after the front-loaded cards, i.e. still all at minute 0 | same (bos, choch) |
| Trades | 3× momentum→pullback framework; predict question asks the TREND (219); banner labels "UPTREND PULLBACK" | 3× framework + **structure detector live at L3** (219): bos/choch/trend_break setups arm on real structure candles |
| Boss | Crab: trend, support, resistance, fake, predict | Serpent: bos, choch, struct, trend, predict |

## 3 · Current LEARN→PRACTICE→APPLY→TEST chain

| Concept | LEARN | PRACTICE | APPLY | TEST |
|---|---|---|---|---|
| trend | text card (animated `uptrend` scene EXISTS, unused) | required tap (219) | predict question reads trend (219); banner label | Crab R1 ✓ |
| support | text card (scene `support` EXISTS, unused) | required tap (219) | ⚠ implicit only — SL sits at structure but is never named | Crab R2 |
| resistance | same text card (scene `resistance` EXISTS, unused) | ⚠ none of its own (support practice only) | ⚠ implicit — TP sits at the ceiling, never named | Crab R3 |
| bos | text card (scene `bos` EXISTS, unused) | required tap (219) | detector arms BOS setups (219) ✓ | Serpent R1 ✓ |
| choch | text card (scene `choch` EXISTS, unused) | required tap (219) | detector can arm ChoCh setups ✓ | Serpent R2 ✓ |

## 4 · Missing links

1. **LEARN is text, not animated** — the five LessonChart scenes (`uptrend`, `support`, `resistance`, `bos`, `choch`) were built in the lesson-framework sprint and **never wired**; L2/L3 teach through `teachForced` cards.
2. **Everything is front-loaded** — all concepts land in the first ~60 seconds of the level; zero spacing, zero interleaving with trades.
3. **Resistance has no practice of its own** and neither support nor resistance is ever NAMED in a trade.
4. (Closed in 219): bos/choch application, trend read, required practices.

## 5–6 · Revised flows (implemented this build)

**Level 2** — `Entry → 🎬 UPTREND lesson → HIGHER-HIGH practice → TRADE 1 → 🎬 SUPPORT lesson → SUPPORT-bounce practice → TRADE 2 → 🎬 RESISTANCE lesson → CEILING-reject practice → TRADE 3 → Crab`
**Level 3** — `Entry → 🎬 BOS lesson → BOS practice → TRADE 1 (structure events hastened) → 🎬 ChoCh lesson → ChoCh practice → TRADE 2 → TRADE 3 → Serpent`

Mechanism: a small **level-flow sequencer** (block 1) replaces the L2/L3 front-load (L4+ keeps current behavior). Beats fire at `tradeGate.completed` counts (0/1/2), each waiting for a clear screen (the same wait-for-clear pattern the intro uses, 18 s cap) then running `openIntroLesson(scene) → openConceptPractice(key)` — the exact L1 machinery. Beats are once-ever (localStorage `cq_flow_*`, wiped by `?fresh=1`), so veteran replays skip lessons per the constitution's replay ruling. `taught[]`/`markLessonRead`/`discoverFromLesson` are set by the sequencer so the Notebook, recaps and contextual `teach()` dedupe stay correct.

**APPLY (named, not implicit):** once support/resistance are taught, the L2 trade ticket's reason line names them — the pullback dip "stopped at the FLOOR (support)" and the target "sits under the CEILING (resistance)" — and the trade-review WHY echoes it. Trend keeps the predict-question read; L3 keeps detector BOS/ChoCh setups, with structure events hastened right after the BOS lesson so a structure setup reliably appears before the boss.

**Practice mandatory-ness:** each practice auto-opens in the chain and completes on a correct tap (or the 2-miss reveal). The universal ✕ remains as the emergency exit per the no-trapping permanent rule — closing skips the rep but never re-traps (flag set at open).

## 7 · Duration impact (modeled, 0.45 s/candle at 375 w)

Per level: +2 animated lesson+practice beats mid-level (~+45–70 s) minus the removed card stack (~−30–40 s) ⇒ **net +15–35 s per level** (~+5%). Trade count, boss timing, and the 190-candle hour unchanged; ≥3 trades before every boss preserved (beats are keyed to trade completions, not replacing them).

---

## ADDENDUM — IMPLEMENTED (build 222) — see chat report for verification transcript.
