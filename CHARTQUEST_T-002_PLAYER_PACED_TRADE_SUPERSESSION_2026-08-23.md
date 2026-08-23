# CHARTQUEST — T-002A · PLAYER-PACED GUIDED TRADES

**Date:** 2026-08-23
**Target:** Build 370 local candidate
**Status:** Founder-directed implementation; local verification in progress; **not production approval**

## Decision

Build 370 supersedes only the pacing decision in
`CHARTQUEST_T-002_CANONICAL_TRADE_ARCHITECTURE_2026-07-24.md` (Build 298).
That earlier record remains the historical explanation for the trade clock; it is not the current
product rule.

During Level 1–3 guided trades, price advances with the player's forward traversal. It does not
advance because wall-clock time elapsed, carry Finn forward automatically, or clamp Finn to a moving
live edge. A player may stop to read, put the phone down, or walk backward to review without losing
the trade. Walking forward resumes the chart at the normal visible frontier.

## Laws that remain unchanged

1. The drawn candle is the truth. Automatic resolution occurs only on the first Finn-traversed candle
   whose body or wick visibly touches the correct take-profit or stop-loss line.
2. The deciding candle is recorded in the path before settlement, and the replay must retain the real
   exit candle.
3. Guided automatic paths visibly reach their deciding line between candle 30 and candle 60. There is
   no hidden timeout award or off-chart forced result.
4. Manual close remains a separate player choice and may occur earlier.
5. A live position suppresses boxes, Lost Wisdom pages, mega events, portals, ambient shells, and their
   cadence/state mutations. Trading outranks platforming.
6. Paused, modal, guide-open, backgrounded, and hidden-page states are motionless and accrue no candle
   backlog.
7. Entry, stop, target, P&L, chart path, result, recap, music, trade reward, and save semantics stay
   under their existing owners. This decision does not authorize adjacent trade redesign.

## Ownership

| Concern | Owner in Build 370 |
|---|---|
| When guided price advances | Finn's monotonic reached frontier in `maintainCandles()` |
| Visible path shape and 30–60 envelope | `tradeDrivenCandle()` |
| Automatic outcome | Finn-right-edge traversal → `tradeTouchCheck()` → `CQ.priceTouched()` |
| Manual outcome | Existing Close Position action |
| Replay truth | `trade.path` plus terminal-preserving path storage |
| Hidden/pause safety | Shared world-motion predicate used by both generation and frame update |

## Explicitly removed from the current architecture

- `TRADE_CANDLE_MS` and wall-clock guided candle production
- direct clock-driven reveal/session advancement
- `RIDE THE TRADE` automatic carry
- `RIDE THE LIVE EDGE` clamp
- six-second authored-outcome force resolution

The 2.5-second automatic hop remains only as a wall-collision anti-softlock. It does not advance an
idle player, decide an outcome, or replace player pacing.

## Required verification before candidate approval

- Long/short × win/loss seeded path matrix: every automatic exit is candle 30–60, touches only the
  authored line, and emits no candle after the terminal touch.
- Idle, backtracking, resize, guide, pause, modal, hidden, and resume checks show no advancement or
  accumulated catch-up.
- Candle IDs remain contiguous after the pre-trade suffix is removed.
- The terminal candle exists in the live path and persisted replay before one-and-only-one settlement.
- Trade-time world/reward/event state is byte-still.
- Mobile movement, entry/SL/TP visuals, manual close, trade summaries, and all three game mirrors pass
  the protected regression gates.

## Founder evidence

The Founder directed that guided trades return to the normal game's player-controlled rhythm: players
must be able to pause, analyze, move quickly, or look away without the chart forcing them forward.
The Founder also explicitly required the Trade Bible to remain intact and asked that no other trade
mechanic change in this experiment.
