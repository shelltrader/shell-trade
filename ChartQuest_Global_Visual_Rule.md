# ChartQuest — Global Visual Rule: Chart Continuity

**Type:** Binding global rendering rule • **Scope:** Every screen, every mode, every future feature
**Priority:** Chart continuity overrides rigid camera behavior whenever the two conflict.

---

## 1. The Rule

**The chart must always appear as a continuous, living market.**

The newest visible candle must always feel visually connected to the live edge. The chart is the world the player stands inside — not a panel they look at.

| The player should always feel | The player must never feel |
| --- | --- |
| "I am standing inside a living chart." | "I am looking at a chart UI." |

---

## 2. Why This Is Non-Negotiable

ChartQuest's entire fantasy is *being a trader inside a live market*. That fantasy is fragile. The instant the chart looks like a UI element — dead space, a floating scale, an abrupt ending — three things break at once:

1. **Immersion breaks.** The player snaps from "trader in the market" to "user of an app." The patient-hunter fantasy can't survive that.
2. **Trust breaks.** This is a game about *live BTC*. If the chart looks broken, the player stops believing the market is real, and the core premise dies.
3. **It reads as a bug.** Empty regions and disconnected scales are indistinguishable from a rendering failure. A correct game state that *looks* like a crash is, for our purposes, a crash.

Continuity is not polish. It is load-bearing for the product's central promise.

---

## 3. Hard Prohibitions

At no point, in any mode, may the player see:

- **Large empty horizontal gaps** between the newest candle and the live edge.
- **Price scales disconnected** from visible candles (a scale with no price action beside it).
- **Abrupt chart endings** — the candle stream visibly "stopping."
- **Floating price labels** with no visible market activity nearby.
- **Dead space exceeding ~15–20% of viewport width.**

If any of these appears, the frame is failing — regardless of whether the underlying logic is "correct."

---

## 4. Camera Rules

- Keep **candle visibility ahead** of the player.
- Keep **meaningful market structure visible** at all times.
- The **chart occupies the majority** of the viewport.
- **Future space is limited and intentional** — never accidental, never large.
- **Empty space never dominates** the screen.

---

## 5. Auto-Correction System

Many features intentionally move or reframe the chart: camera movement, zoom changes, boss encounters, Trader View, tutorials, setup detection, and future modes. Any of these can *create* empty regions. When that happens, the system must automatically restore continuity by adjusting one or more of:

- Camera position
- Live edge position
- Candle density
- Zoom level
- Future candle buffer

**Suggested correction priority** (pull the gentlest lever first, so we fix the gap without disorienting the player):

1. **Reframe the camera / live-edge position** — reposition so candles fill the frame. *(Least disruptive — preserves what the player understands.)*
2. **Trim the future candle buffer** — shrink intentional future space back inside the limit.
3. **Adjust candle density** — pack more structure into the frame to fill space.
4. **Change zoom level** — *last resort,* because zoom changes the player's read of market context and should be a deliberate design choice, not an auto-patch.

The goal of the hierarchy: never let an auto-correction change *what the player is reading* if simply *reframing* would solve it.

---

## 6. The Priority Principle

> **Chart continuity takes priority over rigid camera behavior.**

When a scripted camera path, a fixed zoom, or any "ideal" camera rule would produce a discontinuous frame, **continuity wins** and the camera bends. No camera behavior is sacred enough to justify a broken-looking chart.

---

## 7. Visual Quality Test (Acceptance Criteria)

A frame **fails visual review** if a screenshot of it could be mistaken for:

- a rendering bug,
- missing candles,
- broken scaling, or
- disconnected price action.

Run it as a literal check on any new screen or feature: *"Pause here, screenshot it, show it to someone cold. Do they think it's broken?"* If yes, it must be corrected before it ships. This test is the final gate for everything below.

---

## 8. Global Scope

This rule applies everywhere, with no exceptions:

`exploration` · `lessons` · `setups` · `trades` · `guardian trials` · `boss encounters` · `trader view` · **and all future game modes.**

---

## 9. Where This Bites in the V2 Trade Loop

The Trade System V2 loop has specific moments that *deliberately* reframe the chart and therefore carry the highest continuity risk. Each must satisfy this rule:

- **Trader View zoom-out (Setup Detection).** Zooming back to ~20 candles is the single biggest risk: pulling the camera out can expose a dead right edge or a scale floating past the last candle. The live edge must stay populated and the right-side future buffer must stay tight — the zoomed-out view should look like *more market*, never *less*.
- **Setup scanning / the turtle pausing.** When the player slows to hunt for a pullback, candles must keep flowing at the live edge. A paused player is not a paused market.
- **Entry — waiting for the confirmation candle.** While the player waits for the trigger candle to close, the forming candle at the live edge must stay visually connected. The "wait" must never look like the chart has frozen or ended.
- **Trade Management — the watch (Phase 3).** As the trade clock advances candles toward TP/SL, the future buffer *ahead* of price must stay limited and intentional so the path forward never reads as empty space.
- **Boss encounters & guardian trials.** Quiz/overlay states must not strand the chart behind them with a dead edge or disconnected scale. The living market stays alive *behind* the encounter.

In short: every place V2 asks the player to *slow down and look* is a place the chart is most exposed — and therefore where this rule matters most.
