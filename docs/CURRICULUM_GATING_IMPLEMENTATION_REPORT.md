# Chart Quest — Curriculum Gating Implementation · Report

All five priorities plus the structural changes (Level rename, level length, intermission
redesign) are implemented and machine-validated. The game parses clean (4/4 scripts),
`index.html` is byte-identical to `chart-quest.html`, and the service worker is bumped
**v34 → v35**.

**Locked systems untouched** (verified): Guardian roster/names/order/artwork/realms/lore,
boss rounds & rewards, curriculum sequence, economy, XP, shells, ranks. The only changes are
*when* things appear and *what words* wrap them.

---

## The gating model, as built

Every concept now passes four gates in order — **Taught → Tested → Shown → Allowed-in-Setup** —
keyed off the existing `conceptTier()` (for chart/UI surfaces) and a new `SETUP_UNLOCK` map
(for setup generation). A player can no longer see a chart element, a setup type, a trade
reason, a confluence, or a lesson reference before its concept is learned.

---

## Priority 1 — Setup generation gated by concept unlock

The three ungated setup branches were replaced by one **level-gated generator** in
`onCandleEntered`. A setup type can only fire once `session.level` reaches its unlock level:

| Setup type | Unlocks at | Concept taught |
|---|---|---|
| momentum | Level 1 | reading candles |
| pullback | Level 2 | trend & levels |
| bos / choch / trend_break | Level 3 | market structure |
| ob | Level 4 | order blocks |
| vwap_bounce | Level 6 | VWAP |

The generator builds the most advanced *unlocked* setup the candle supports, then falls back to
a beginner type — so a Level-1 player only ever sees momentum opportunities, a Level-2 player
momentum + pullback, and so on. (Validated: every type's unlock ≥ the level its concept is taught.)

## Priority 2 — Two beginner opportunity types

- **`detectMomentum` (Level 1):** fires on a decisive candle close (body clearly larger than the
  recent average). Banner reads **"STRONG GREEN/RED CLOSE — TAP TO TRADE."** Explainable with
  candle-reading alone — no structure, VWAP, or confluence.
- **`detectPullback` (Level 2):** fires on a with-trend resumption after a short pullback. Banner
  reads **"UPTREND/DOWNTREND PULLBACK."** Explainable with trend + levels only.

Both carry **no probability/grade claim** in the banner (beginner setups show the plain reason
only). The intro's "first real trade" now naturally resolves to a Level-1 momentum setup.

## Priority 3 — Chart systems gated

Hidden until their concept is learned: the **VWAP line + label** (`drawVWAP`, Level 6), the
**support/resistance trend lines** (`drawTrendLines`, Level 2), and the **higher-timeframe panel**
(`drawHTFPanel`, Level 8) — *and* the HTF-panel tap target, so a beginner can't open the zoom by
tapping the now-invisible panel. **Setup quality** (`gradeSetupQuality`) is computed only from
taught concepts (trend from L2, VWAP from L6; neutral before that). Structure/OB/VWAP annotations
were gated everywhere they're drawn: the live chart, the trade-ticket mini-chart, the full-screen
explore chart (title, key-level line, OB/BOS arrows, **and the bottom explainer cards** — which now
have momentum/pullback versions), the journal-review chart and its overlay toggles, and the
candle-tap **inspector** (a beginner tapping a candle now sees plain anatomy, not "BREAK OF STRUCTURE").

## Priority 4 — Trade panel simplified before Level 5

Until risk is taught (Level 5), the trade panel hides the **Risk / Amount / Stop-Loss /
Take-Profit / Reward-Risk** controls (`.tp-adv` rows + `.simple` mode) and runs on the
auto-recommended values. A note reads *"Stop & size are handled for you — just pick a direction."*
At Level 5 the full risk panel is revealed.

## Priority 5 — Post-trade feedback gated by level

Before confluence is taught (Level 10), the A/B/C grade card with confluence factors is replaced
by a **plain, setup-type-aware line** via `plainSetupReason` — e.g. *"You rode a strong green
close — and it paid off,"* *"You bought the dip with the uptrend."* The net result appears only
once risk is taught. The full grade card returns at Level 10.

---

## Structural changes

- **Hour → Level (player-facing).** All visible "HOUR" strings now read "LEVEL" — the mission HUD,
  the chart status line, the boss banner, the goal card, and the intermission. Internal variable
  names (`perHour`, `maxHourReached`, `session.level`) are unchanged.
- **Level length 60 → 110 candles** (`perHour: 110`) — room for multiple trades, shell collection,
  a lesson, and reinforcement without rushing.
- **Intermission redesigned as a progression moment** (`imRender`) with the required sections:
  **LEVEL COMPLETE** → **Trading Performance** (Trades / Wins / Losses / Shells Earned) →
  **Knowledge Progress** (Concept learned / mastered / new unlock) → **Upcoming** (⚔ *Guardian
  Approaching* with name & emoji, or 📚 *Next Level*) → **Rewards** (XP / Shells / Unlock). The
  rich trade-replay and lesson-detail sheets are preserved.
  - **Bonus fix:** the redesigned CONTINUE button previously skipped the Guardian fight entirely.
    It now correctly launches the level's Guardian before advancing (and reads **"FACE THE GUARDIAN →"**),
    restoring the boss step. `bossFinish()` rolls into the next level as before.

---

## Validation pass (all ✅)

1. **No concept appears before its lesson** — chart, inspector, setup mini-chart, explore chart,
   and journal-review chart all gate structure/OB/VWAP by `conceptTier`.
2. **No setup type appears before its unlock** — `SETUP_UNLOCK` ≥ taught-level for every type.
3. **No chart element appears before its unlock** — VWAP line, S/R lines, HTF panel + its tap target.
4. **No trade feedback references future concepts** — simple plain-language feedback before Level 10.
5. **All beginner opportunities are explainable with current knowledge** — momentum (candles),
   pullback (trend + levels); no probability/grade claims.
6. **Levels function with the new duration** — `perHour = 110`.
7. **Intermission shows correct progression information** — all five sections present; CONTINUE
   launches the Guardian.

Plus: syntax 4/4 clean; `index.html` identical to `chart-quest.html`; SW at v35.

---

## Remaining risks / notes

- **Beginner setup frequency** depends on market volatility producing decisive closes; with
  110-candle levels and the existing cooldown there's room for several momentum/pullback
  opportunities per Level 1–2, but exact counts will vary by run. Worth a quick playtest to confirm
  the early levels feel trade-rich.
- **Trade-gate at the intermission:** to avoid soft-locking a player who under-traded a level, the
  CONTINUE button launches the Guardian without hard-enforcing the 3-trade gate. If you'd prefer the
  gate enforced, that's a one-line change — flagged for your call.
- The **dashboard** (dev/QA tool) still uses internal "Hour" labels in places; it's not
  player-facing, so it was left as-is.

*Implementation complete. Synced to `index.html`; service worker at v35. Ready to deploy when you are.*
