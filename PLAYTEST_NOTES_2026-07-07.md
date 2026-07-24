# ChartQuest — Playthrough Notes (2026-07-07)

> **IMPLEMENTED in build 253** (all 7). Verified: syntax gate pass (8/8 substantive checks), clean browser boot, zero console errors, flame removal confirmed visually.
> - N1 music: `GameMusic.play('trade')` focus bed + triggers in `commitTrade`/`resolveTrade`.
> - N2 trading: 2a entry re-anchored to Finn's candle (intro path); 2b Finn-reach resolution gated on `MIN_TRADE_CANDLES`; 2c live P&L + R-multiple made the star of the close button.
> - N3 movement: tap-a-side turn+jump in the pointer tap-timer (protected #4, approved).
> - N4 flame: baked plume erased from `finn/run.png` (protected #1 art, approved) — live flame only.
> - N5 lesson header: `openIntroLesson` eyebrow now `📈 Lesson · <Title>`.
> - N6 popups: render-time anti-overlap for centered/box floaters.
> - N7 candle-lab: `build()` chart `bot` reserves the bottom band so the drawn candle can't overlap the button.
>
> **Deploy note:** `index.html` mirror + protected-ship gate (`CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship`) NOT yet run — the bypass flag needs explicit founder approval. Not required for the LAN test QR (server serves `chart-quest.html`).


**Build under test:** 252 ("Finn cleanup Phase 1") · **Mode:** beginner (`?fresh=1`) · **Source:** founder live playthrough.
**Status:** CAPTURE ONLY — documented for later improvement passes. No code changed from these notes. Appended live as notes arrive.

---

## Note 1 — Event-driven music (emotional pacing)

**What the founder wants:** distinct soundtracks per context, so music itself gives an emotional pattern-break that amps the player up for the moment they're in:
- **Chart / walking** → the main exploration soundtrack (the "world" theme).
- **Boss fight** → a separate battle soundtrack.
- **Exercise / taking a trade** → a *new*, dedicated soundtrack (focus/decision energy).

**Current state (code):** `GameMusic` (≈17511) is a **synthesized** engine, not audio files — it builds themes procedurally from key/bpm/wave. It has **two** states today:
- `GameMusic.play('explore')` — chart/walking (exists ✅).
- `GameMusic.boss(level)` — per-realm battle track from `BOSS_THEME` (exists ✅, and already distinct per boss).
- **Trade / exercise → no dedicated state (the gap ❌).** Trades and mini-game exercises currently play under the `explore` theme, so there is no musical "lean in, this matters" cue.

**Improvement direction:** add a third `GameMusic` state (e.g. `focus`/`trade`) triggered when the trade ticket opens or a mini-game/exercise starts, then return to `explore` on close/resolve. Keep it synthesized in the same engine (tempo/timbre shift, not an imported file) so it layers cleanly with the existing stop/return logic.

**Scope note:** audio is **not** a protected system — this is a normal Medium change (one system: `GameMusic` + its call-sites at trade-open / mini-game-start / resolve). Would need on-device verification (music on/off toggle respected; no double-track overlap on state changes).

---

## Note 2 — Trade setup still feels bad; entry point floats in the air above the chart

**What the founder observed:** entering the portal and opening the first trade setup, the **entry point renders in the air above the candles** — not on the chart. Trades "feel way worse than they ever did." The new trade rules have **not** been implemented.

**Why (grounding):** correct — the trading system is still **build-250/252 behavior**, untouched. It remains the pre-authored **Trading Canon violates** state:
- Entry is not reliably anchored to the confirmation candle's surface → it can sit in empty space above/below the chart. This is exactly [trading_canon.md](docs/canon/trading_canon.md) **Rule 6** (entry = confirmation-candle close, never the portal/Finn), **Rule 8** (entry must sit inside chart structure), **Rule 19** (portal renders on the candle surface, never floating), and Failure-Analysis ranks #6/#8/#9.
- The deeper "feels arbitrary/worse" is the coin-flip + puppeteered-candle spine the canon exists to replace (Rules 2/3/21).

**Status / blocker:** the fix is **frozen behind protected system #9** and awaiting the founder's greenlight on the **Option B (pre-authored scenario) pipeline** — which is still at the analysis/decision-gate stage. Nothing has regressed *mechanically* from a specific edit; rather, with attention now on trading, the existing flaws read as worse.

**Two improvement paths (founder's call):**
1. **Interim, targeted fix (smaller):** just fix **entry anchoring + portal hover** so the entry line/portal always sit on the confirmation candle's surface (Rules 6/8/19). This is largely independent of the big pipeline rebuild and kills the "entry floating in the air" bug specifically. Still a protected-#9 change → needs a PRE-FLIGHT + approval, but far smaller than Option B.
2. **Full fix (the real one):** implement the **Option B author-first pipeline** (Changes #1–#3 as one), which makes entry honest *and* makes outcomes caused by the readable chart.

**Severity:** HIGH — this is the flagship "trading feels broken" symptom and the founder is hitting it on the very first trade.

### Note 2 — UPDATE (refined live during play)

**2a — Entry-in-air is FIRST TRADE ONLY.** The floating-above-chart entry only happens on the *first* trade. From the *second* trade on, entry / stop / take-profit all look good and correctly placed. → narrows the bug to the guided first-trade path: the `_introTrade` branch in `commitTrade` (~11789) and the first-trade guide that repositions Finn onto the entry line (~11812). Not a general entry bug.

**2b — NEW: trades resolve far too fast (3–4 candles).** Even the good second trade is over in 3–4 candles. The intended ~30-candle emotional arc (`MIN_TRADE_CANDLES=30` + the dip→hold→recover→run "scare" in `tradeDrivenCandle`) is not being felt. Candidate cause (confirm in-browser): at L1–3 the trade also resolves the instant **Finn physically reaches the TP/SL line** (`_finnTP`/`_finnSL`, ~12481–12486), and that trigger has **no min-duration gate** — so if Finn climbs onto the target quickly, the 30-candle arc is short-circuited. Alt causes: trade not on the driven path, or an L4+ honest first-touch.

**2c — THE THEME: zero emotional investment (the real problem).** Founder verbatim: right now you "just click buttons and you're in the trade — there's no meaning, no payoff, no repercussions." The trade must become something the player *feels*:
- **Real-time P&L the player watches go up and down** during the trade (green → red → green tension).
- **Felt duration** — long enough to live through the dip and the recovery (Trading Canon Rules 16/17; Part 7: beginner ideal ~30–45 candles / 30–60s).
- **Stakes / payoff / repercussions** — the shells at risk must matter; the outcome must land emotionally.
- Key insight: the machinery already exists (`tradeDrivenCandle`'s dip→hold→recover→run arc + live P&L on `closeTradeBtn`) — it's being **skipped** because trades end too fast (2b). **Fixing duration likely unlocks most of the emotional investment.** This is the north-star for the trading redesign, above any single mechanic.

**Priority:** 2b + 2c are the highest-value trading findings so far — arguably more urgent than the full Option B rebuild, and partly fixable *within* the current architecture (gate resolution on min-duration; make live P&L prominent). Still protected #9 → needs a PRE-FLIGHT.

---

## Note 3 — Follow-the-finger movement (tap/point to steer)

**What the founder wants:** movement should track where the player points, so turning and hopping feel immediate:
- **Tap on the LEFT side of Finn** → he turns around and jumps toward the finger (left). Same on the right.
- **Finger ahead of Finn on the chart** → he follows it; swipe/point right → jump right, point left → jump left.
- Goal: kill the "have to tap multiple times to turn around" clunk; Finn always heads toward the finger.

**Current state (code, input handlers ≈3966–4066):** touch model today is **tap = jump**, **swipe up = boost**, **swipe down = tuck**. Turning is a horizontal **swipe** — `dx < -40 → turtle.dir = -1` (left), `dx > 40 → dir = +1` (right). So a turn needs a deliberate sideways swipe past a 40px threshold, and a plain tap only ever jumps in the current facing. There is **no** tap-a-side-to-turn and **no** continuous follow-the-finger. That's the clunk.

**Improvement direction:** make the tap/point **position relative to Finn** set facing + hop direction — tap/point on the side opposite his facing → turn and jump that way; tap on his facing side → jump forward. Effectively "jump toward the finger."

**Design tensions to resolve before building (documented, not decided):**
- **Protected system #4 (core movement).** gameplay_canon: "no new verbs, no difficulty change." A follow-the-finger steering model is a **new input model**, so it needs an explicit PRE-FLIGHT + founder approval as a protected change.
- **Tap disambiguation:** tap currently *is* jump. Need a rule for "tap to jump straight" vs "tap a side to turn+jump" (e.g. tap within Finn's column = jump up; tap left/right of his column = turn + jump toward it).
- **Keep frozen:** jump/boost/dive/roll feel, physics, hitbox, walk speed, and the canvas-vs-DOM tap boundary (must not break DOM buttons — ui_canon).
- Verify on-device (touch), beginner mode, both facing directions.

---

## Note 4 — Flame: kill the static flame, keep one live flame (confirms Finn-pass Priority 2)

**What the founder observed:** there are **two flames** — one **static**, one **moving** — and the moving one sits **behind** the static one. Fix: **eliminate the static flame**, keep a single good flame that moves at all times so it feels alive.

**Grounding:** the shipping renderer (`drawFinnSprite`) draws exactly **one** flame in code — `finnLiveFlame` (≈13741), called **after** the sprite at grounded run (13943), i.e. on top. The animated one being *behind* a static one strongly implies the **static flame is a residual plume baked into `run.png`** — despite the code comment at 13732 claiming "the baked plume never ships." (To be confirmed in-browser per animation_canon: "verify by looking, not by formula.")

**Scope flag (important):**
- If the static flame is a **second code draw** → render-only fix (delete it), non-protected-art. Easy.
- If it's **baked into `run.png`** → removing it means **editing the art asset** (crop the plume), which is **protected system #1** ("no asset swap / no palette-proportion change") *and* conflicts with the founder's own "NO NEW ART" instruction on the Finn pass. That would need an explicit art-edit approval — it can't be done as a render tweak.

**Cross-ref:** this is the same issue as **Priority 2** of the parked Finn animation pass (still awaiting the founder's two decisions: walk-fix method + blink approach). Note 4 sharpens it: the moving flame is fine; the job is removing the static one, and the fix path depends on where that static flame actually lives.

---

## Note 5 — Lesson header should name the lesson (not just "Lesson")

**What the founder wants:** the animated LEARN-beat lesson shows a generic header — a small "📈 Lesson" eyebrow at the top, the animated LessonChart below it, then the caption. The player can't tell what the lesson is without reading the bottom caption. Put the **lesson's title in the header**, e.g. "Lesson · Pullback" / "Lesson: Pullback", so it reads at a glance.

**Current state (code):** `openIntroLesson` (≈19117) builds the LEARN-beat overlay; its header is a hardcoded eyebrow at **line 19132: `'📈 Lesson'`** — no concept name. The `sceneKey` (e.g. `pullback`, `momentum`, `candle`) is already in scope there. By contrast the mini-game concept card `showConcept` (~19153–54) *already* shows a real title (`g.title`) under a `📘 CATEGORY` eyebrow — so the pattern exists; the LEARN overlay just doesn't use it.

**Improvement direction:** replace the static `📈 Lesson` with `Lesson · <Title>`, mapping `sceneKey` → a readable 10-year-old title (`pullback → "Pullback"`, etc.). Small, non-protected UI/text change (one string + a key→title map). Verify no header overflow on mobile.

---

## Note 6 — Kill the rising/overlapping text popups; use timed box popups

**What the founder observed:** after the "impossible candle" exercise, right before Guardian 1, **two text popups overlap** and become unreadable. Fix: remove all popups where text **floats vertically up the screen**, and replace them with **actual box popups with proper timing** — one at a time, readable, queued.

**Current state (code):** these are the `floaters` — `floaters.push({ text, color, y, t, center })` — transient strings that rise and fade. Unlike the queued/guarded messages (`lessonQ`, and `tradeIncoming` which has an `_anyBlockingUI()` "never appear over another message" hard rule), floaters have **no anti-collision or queue**, so two pushed close together overlap. The pre-Guardian-1 beat evidently fires two at once.

**Improvement direction:** route any message with a *sentence to read* through a **single queued, boxed popup** (like `lessonQ`'s card, or a small toast queue) with proper enter/hold/exit timing that never overlaps. Audit `floaters.push` call-sites and split: quick juice ("+5 🐚") can stay a floater; readable sentences become queued boxes. Non-protected UI change, but many call-sites → Medium; verify the pre-Guardian-1 sequence specifically.

---

## Note 7 — Boss candle-lab: the drawn candle can overlap the "Bearish" button

**What the founder observed:** during the boss fight, in the candle-lab exercise where you draw the **bearish** candle, drawing the candle **too far down** makes it overlap the BEARISH answer button. Nothing may ever overlap — fix it.

**Current state (code):** this is a boss-round mini-game (the "draw the candle" candle-lab, in the MG mini-game system / 2nd `<script>` block). The candle's draggable draw region isn't clamped to stay clear of the answer buttons below it. (Exact clamp site to confirm when implementing.)

**Improvement direction:** clamp the candle's draw bounds so it can **never** reach the button zone (or reserve/relayout the button area outside the draw area). Non-protected mini-game UI fix. Verify by dragging to the extreme.

---

> **Cross-cutting theme emerging (Notes 4, 6, 7):** "nothing may ever overlap." Two flames overlapping, two text popups overlapping, a drawn candle overlapping a button. Worth a **global UI rule + an overlap audit** rather than three one-off fixes — every interactive/animated element should be clamped or z-managed so it can never occlude another. Recommend a dedicated overlap-hygiene pass.

## Note 8 (follow-up) — Old turtle model in the `?fresh=1` intro → DELETED (build 254)

**Observed:** founder saw the previous/procedural turtle model on a fresh playthrough. **Root cause:** the Finn lockdown was scoped to *gameplay* (`drawFinnSprite`+`run.png`); the opening cinematic + Candle Academy used a *separate* procedural render (`drawAcadShell`) that was out of scope, and the deprecated assets were frozen-not-deleted (still loading `walk-sheet.png`/`body.png`/`leg.png`). My run.png flame edit was NOT the cause (verified: run.png loads, ready=true).

**Fixed (build 254, founder-approved protected #1):**
- `drawAcadShell` now renders the official `run.png` Finn (all ~9 call sites incl. the cinematic) — procedural body kept only as an early-load fallback. Verified visually (real Finn: shell, jetpack, compass, clean nozzle).
- Deleted the walk-sheet slicing, the walk-sheet render path, and the `walk`/`walkC` arrays; removed the deprecated assets from the loader.
- Physically deleted `finn/walk-sheet.png`, `finn/body.png`, `finn/leg.png` (backed up).
- Regression gate check [2] now FAILS the build if any deprecated asset/ref/PNG returns ("set in stone").
- Also cleaned residual flame smudge from run.png's nozzle.

Verified: gate [2] "old model DELETED" passes, syntax clean, build 254 boots with zero console errors.

<!-- Append further playthrough notes below as they arrive. -->
