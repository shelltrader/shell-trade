# ChartQuest — V1 Launch Alignment Report

Measuring the existing game against the locked V1 vision (*"a beginner's journey from confused
novice to disciplined trader"*). The good news: the last several passes already moved ~70 % of
the game onto this vision. This report is honest about what's **aligned**, what's a **gap**, and
implements the gaps in highest-impact order. No redesign — alignment only.

Legend — **Status**: ✅ aligned · ⚠️ partial · ❌ gap.

| # | System | Current state | Desired state | Changes required | Priority | Est. impact |
|---|---|---|---|---|---|---|
| 1 | **Golden Rule** (never show before taught) | Setups gated by level; VWAP line, HTF panel, BOS/OB/structure labels, trade-panel grades, candle-inspect, journal overlays all gated by `conceptTier` ✅ | No concept on chart/lesson/trade/boss before its lesson | Spot-verify only | ✅ done | Critical — already realized |
| 2 | **Trade immediately** (candle-only) | Momentum (L1) + pullback (L2) beginner setups; first real trade inside the intro ✅ | Trade in first minutes using only candle direction/close/momentum | None | ✅ done | High — realized |
| 3 | **Levels not Hours** | Player-facing "LEVEL" everywhere; internal time-tracking kept ✅ | Levels, not hours | None | ✅ done | Medium — realized |
| 4 | **Shell economy / one shell** | Canonical `drawShell` (canvas) + `shellHTML` (UI); reserve; trading-primary ✅ | One iconic premium shell everywhere | Transient floaters keep the glyph (impractical to swap in canvas text) | ✅ done | High — realized |
| 5 | **Intro / Market Maker** | Market Maker teaser (video + dialogue) replaces the Validator; establishes the final challenge ✅ | MM as the destination from minute one | None | ✅ done | High — realized |
| 6 | **Onboarding / plain English** | Beginner setups, simplified panel < L5, plain-language feedback, no early jargon ✅ | Shorter, clearer, plain-English lessons | Minor lesson copy trims (later) | ⚠️ mostly | Medium |
| 7 | **Daily Drills positioning** | Permanent primary-HUD button, available from minute one ❌ | Locked until Guardian 2; optional "training"; out of the onboarding HUD | Hide `dailyBtn` until Guardian 2 defeated; reframe as optional training; unlock toast | 🔴 **HIGH** | High — declutters onboarding |
| 8 | **Level length** | ~110 candles ≈ 2–4 min ❌ | 5–10 min per level | ↑ candles/level, ↓ walk speed | 🔴 **HIGH** | High — pacing & "traversing a chart" feel |
| 9 | **Candles on screen** | ~10 visible (`candleTargetVisible 6.5`) ⚠️ | ~12 visible | Nudge target up | 🟡 MED | Medium — readability/realism |
| 10 | **Portals vs candles** | Float ~280px above the nearest candle top (prior fix) ⚠️ | Never intersect / inside / under candles | Anchor above the **tallest** candle in a window, not just the nearest | 🟡 MED | Medium — readability/intent |
| 11 | **Level completion** | Redesigned intermission: LEVEL COMPLETE badge, stars, trading performance, knowledge progress, account, upcoming Guardian ✅ | Celebration + recap + shell/trade summary + guardian progress | Add a small celebratory flourish | 🟡 MED | Medium — "I accomplished something" |
| 12 | **Visual philosophy** (chart is star) | Chart-centred; effects gated; VWAP/HTF hidden early ✅ | Readability above effects | Covered by #10 portal fix | ✅ mostly | Medium |
| 13 | **Retention philosophy** | No streaks/battle-pass/login loops; the only streak is the Daily Drill's, which #7 gates away from onboarding ✅ | No addiction loops | None (don't build more) | ✅ aligned | Low |
| 14 | **The journey / final vision** | Teach → practice → trade → boss order holds; MM is the destination ✅ | Curious beginner → disciplined trader → defeat MM | Keep reinforcing | ✅ aligned | Foundational |

---

## Implementation order (this pass)

Highest-impact gaps, in order:

1. **Daily Drills** → lock until Guardian 2, remove from the onboarding HUD, reframe as optional training.
2. **Level length** → raise candles-per-level and slow the walk so a level runs ~5–10 min.
3. **Candles** → ~12 on screen.
4. **Portals** → guarantee they never intersect candles (anchor above the tallest local candle).
5. **Level completion** → a small celebratory flourish on the (already-rich) intermission.

Everything else is already aligned from prior passes and needs no change — only the spot-checks noted.

---

## What was implemented this pass

1. **Daily Drills locked & repositioned** — the `TRAINING` button is hidden during onboarding
   and only appears after **Guardian 2** is defeated (`DAILY_UNLOCK_GUARDIAN = 2`), announced
   with a "🔓 Training unlocked — optional drills to sharpen your edge" toast. The panel header
   now reads **TRAINING DRILLS** with the subhead *"Optional training. The chart teaches through
   experience — the drills sharpen your edge."* The system is intact, just gated and reframed.
2. **Level length** — candles-per-level **110 → 160** and walk speed **72 → 58 px/s**, sizing a
   level at ~1.5 min of pure traversal plus trades/lessons/setups → roughly **4–8 min** of
   engaged play (in the 5–10 target band; exact time scales with how much the player trades).
3. **Candles** — `candleTargetVisible 6.5 → 8.5`, so **~12 candles** are on screen — it reads
   like a real chart you're traversing.
4. **Portals never touch candles** — `spawnPortal` now scans the portal's whole column and
   floats above the **tallest** local candle (plus a clearance margin), while still sitting high
   enough to demand the jetpack. No portal can intersect, sit inside, or hide under a candle.
5. **Level completion flourish** — a short confetti burst now celebrates a cleared level on top
   of the already-rich intermission (badge, stars, performance, knowledge progress, account
   breakdown, upcoming Guardian).

**Verification:** scripts parse 4/4; `index.html` synced; service worker **v38**. The
already-aligned systems (Golden Rule gating, trade-immediately, Levels rename, one shell,
Market Maker intro) were left intact and re-confirmed present.

### Remaining (low priority, not blocking launch)
- A light copy-trim pass on the earliest lessons for maximum plain-English brevity (#6).
- A real playtest to confirm level duration *feels* like 5–10 min for a typical player (the
  estimate is engagement-dependent) and that ~12 candles reads well on your device sizes.
