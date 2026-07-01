# ChartQuest — First 15 Minutes Audit V4

**Method (honest).** Wiped the save to a true first-time state (`localStorage` cleared →
`maxHourReached = 1`, no `cq_played`, no faction, no first-win, no lessons), reloaded the
**live v52 build**, and played from the splash. I observed the **intro cinematic + Level 1
opening** live as a brand-new player, and I verified the downstream screens (trade ticket,
boss intro/victory, lessons, celebrations) this session via forced fresh-Level-1 states and
real renders. Where I did **not** do a continuous human play of Boss 1 → Level 2 → Boss 2,
I say so. Nothing below is assumed fixed — the "✅ verified fresh" items were probed on this
actual cleared save.

---

## ✅ What's genuinely working (verified on the cleared save, not assumed)

- **Curriculum gating holds for a real new player.** At Level 1: `conceptTier` for bos / choch /
  ob / sweep / vwap / htf / confluence / trend / sr = **all 0 (hidden)**; setups allowed =
  **["momentum"] only**. No Order Block / BOS leaked onto the Level-1 chart this time.
- **Chart is clean.** The per-candle halo and glowing dots are gone — solid candle bodies, only
  the forming candle pulses. Reads instantly.
- **HUD overlap fixed.** FUEL sits in the bar; the "Ƀ BTC" coin badge is tucked below it. No
  overlap.
- **Economy fresh & correct.** Starts at 100 shells; +1 pickups work (ticked 100 → 102 while
  walking). Reserve intact.
- **Control onboarding exists.** Level 1 immediately shows **"⬆ SWIPE UP to BOOST · jet over the
  tall candles."** A newcomer is told the core control.
- **Skip works** and drops straight into Level 1.
- **Guardian progress is visible** — a "GUARDIAN 1 / 11" chip sits top-centre, framing the goal.

---

## 1. Top 10 remaining issues (priority order)

1. **🔴 Mission goal is broken on the skip path → "Reach 0 SHELLS · GOAL 0."** Verified:
   `session.startBal = 0` at Level-1 start (should be ~100), so target = `startBal × 1.02 = 0`.
   The player's headline objective is meaningless, and "NOW 100 ✓" makes the level look already
   won. This is the single worst first-impression bug. *(One-line fix: set `startBal =
   player.shells` when a level begins if it's unset.)*
2. **🔴 The intro's opening "glitch" runs ~8–10 s of cryptic scattered candle-fragments** with a
   half-hidden terminal line and no clear hook. Most new players will reach for Skip before the
   Market Maker payoff lands.
3. **🔴 Game-HUD chrome shows *during* the cinematic.** The JOURNAL / WALLET buttons and the
   `> reco…` narration render over the intro, and the narration is **clipped behind the buttons**
   (unreadable). The cinematic doesn't own the screen.
4. **🟠 Top-of-chart text overlap.** "Grow 🐢 · Out-trade 11 Guardians · Escape the market"
   collides with the "LEVEL 1 · n/140 · BTC/USDT 1m · BINANCE" header — two lines stacked on the
   same pixels.
5. **🟠 "Reach 0 SHELLS … GOAL 0 … BUST 0"** triple-zero mission strip (consequence of #1) gives
   the player no sense of target, danger, or progress in the first 90 seconds.
6. **🟠 Continuous Boss 1 → Level 2 → Boss 2 human play not yet validated for *feel/pacing*.**
   The screens are verified individually (intro cinematic, victory "1/11", trade ticket), but
   nobody has played the 140-candle Level 1 end-to-end into the Eel to confirm it doesn't drag.
7. **🟡 The first real *trade* moment wasn't reached in this run** (it's deep into Level 1).
   Worth confirming the spotlight + "TAP TO TRADE" actually fire for a passive walker, not just
   an engaged one.
8. **🟡 No explicit "what is this / why am I a turtle" framing after Skip.** Skipping the intro
   means skipping the *only* narrative setup; the player lands on a chart with a jetpack turtle
   and a "GUARDIAN 1/11" with zero story context.
9. **🟡 "DRIFTER" rank + "LVL 1" + "GUARDIAN 1/11" are three different progress numbers** in the
   top bar at once. A newcomer can't tell which one matters.
10. **🟡 Mission line says "139 candles left"** — "candles" as a unit of time is jargon a brand-new
    player won't parse as "how long is this level."

---

## 2. Biggest confusion points

- **"Reach 0 SHELLS."** Nothing communicates the actual objective. (#1/#5)
- **Three progress meters at once** — Level, Rank (DRIFTER), and Guardian 1/11 — with no hierarchy.
- **"Candles left" as a clock.** New players read candles as chart objects, not a timer.
- **Post-skip context vacuum.** After Skip, a jetpack turtle on a BTC chart with no "you are
  escaping the market by out-trading 11 Guardians" beat actually delivered.

## 3. Biggest retention risks

- **The first ~10 seconds are a cryptic black glitch screen.** That's the highest-bounce moment in
  any game, and right now it's the least legible. (#2)
- **A broken/trivial goal ("already at 100, goal 0")** removes the pull to play — there's nothing
  to chase in the opening minute. (#1)
- **Reward loop is sound but back-loaded.** The genuinely great moments (trade spotlight, first-win
  celebration, boss cinematic, "1/11 GUARDIANS CLEARED") all live *after* the rough opening minute.
  Players who bounce in the intro never see the good part.

## 4. Biggest UX problems

- **Cinematic doesn't suppress the game UI** (buttons + narration bleed through, text clipped). (#3)
- **Mission strip is information-dense but currently meaningless** (triple zeros). (#1/#5)
- **Top header double-stacks** two text lines. (#4)
- **No persistent "what do I do right now?"** beyond the (good) one-time SWIPE-UP hint — once it
  fades, a confused player has no anchor.

## 5. Biggest visual problems

- **Intro glitch reads as "is it broken?"** rather than "something cool is loading." Sparse,
  low-contrast fragments on black.
- **Top-left/top-centre text overlap** (#4) is the only in-game clipping I hit — the chart itself
  is now clean (declutter verified).
- Everything downstream that I verified this session (trade ticket, boss cinematic, victory screen,
  celebrations) is visually strong; the visual problems are concentrated in the **intro + the top
  HUD band**, not the chart.

## 6. Biggest onboarding problems

- **The objective never lands.** Best onboarding in the world can't fix a "Reach 0 SHELLS" goal. (#1)
- **Skip is a trap.** It's the right escape hatch for the slow intro, but it also strips 100% of the
  narrative/role setup, and nothing re-establishes it in-level. Either the intro must earn the watch
  (tighten #2/#3) or the *role + goal* must be re-stated in the first 10 s of Level 1.
- **Time is measured in "candles."** Onboarding should say "~5 minutes" or show a clear progress
  bar, not "139 candles."

## 7. What would stop a stranger from loving it in the first 15 minutes

**The opening 60 seconds, not the game underneath it.** Once a stranger is past the intro and into a
real trade, the game is genuinely good — clean chart, plain-English "THIS CANDLE · STRONG CLOSE →
WHAT NEXT?", a spotlighted decision, a celebrated win, and a cinematic Guardian. The verified
curriculum gating means they're never shown jargon they haven't learned. That core is lovable.

What stops them is the **threshold**: a cryptic 10-second glitch, UI bleeding through the cinematic,
and then — the moment they land — a mission that says **"Reach 0 SHELLS, GOAL 0,"** which reads as
either broken or pointless. A stranger doesn't know the good part is 90 seconds away; they judge on
the first minute, and the first minute currently undersells everything you've built.

**If I could fix only three things before putting it in front of strangers:**
1. **Fix the goal** (`startBal = player.shells` on level start) so the mission reads "Reach 130
   SHELLS · ~5 min" with real BUST/GOAL numbers. *(Trivial, highest impact.)*
2. **Make the cinematic own the screen** — hide JOURNAL/WALLET/narration chrome during it, and
   tighten the glitch to ~2–3 s before the Market Maker beat.
3. **De-conflict the top HUD** — one progress identity, and stop the "Grow · Out-trade…" line from
   overlapping the ticker header.

None of these touch the locked curriculum, economy, levels, or shell systems — they're all opening-
minute polish. Fix them and the first 15 minutes match the quality of everything after minute two.

---

*Audited on the live v52 build from a cleared save. Items marked ✅ were probed on this actual
fresh state; the intro + Level-1 opening were observed live; downstream screens were verified
screen-by-screen this session. A continuous human play of Level 1 → Boss 1 → Level 2 → Boss 2 for
pacing/feel is the one piece of validation still worth doing.*
