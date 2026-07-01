# ChartQuest — First 15 Minutes Audit V3 (QA + Curriculum Enforcement)

**Method:** verified against the **live deployed build** (v40) — not assumed. I ran JavaScript
probes against the running game and reviewed the exact code that's deployed. The single most
important finding reframes everything below.

## ⚠️ Root cause of the "still present" bugs

**The live site was an old build (~v34) until minutes ago.** Almost every curriculum/economy
fix from the last several passes was written but **never deployed** — and one pass shipped a
fatal load-order bug (a `const` read in the temporal dead zone) that **halted the whole script**,
so even what *was* deployed didn't run. Both are now fixed: the TDZ bug is patched and **v40 is
live**. Your playtest complaints were real — they were just against code that wasn't running.

---

## Live verification (probed on v40, fresh player)

```
session.level: 1     player.shells: 100     perHour (candles/level): 140
conceptTier at Level 1 → bos:0 choch:0 ob:0 sweep:0 vwap:0 htf:0 confluence:0   (all HIDDEN)
setups allowed at Level 1 → ["momentum"]    (no BOS/VWAP/OB)
Level 1 lessons → candles_intro, long_vs_short, candle_close   (candles only)
Boss 1 rounds → candle, error, predict   (candle-reading only)
Daily/Training button display → "none"   (locked)
```

This is **Phase 1 and Phase 2 passing on the live build.**

---

## Per-phase verified status

| Phase | Item | Status on v40 | Evidence / note |
|---|---|---|---|
| **1** | Curriculum enforcement (no concept before taught) | ✅ **Live** | Probe: all advanced concepts tier 0 for a fresh player; setups, chart labels, trade panel, inspector, journal overlays, setup charts all gated by `conceptTier`. |
| **2** | Level 1 = candles only; Boss 1 = candle-reading only | ✅ **Live** | Probe confirms L1 focus + Boss 1 rounds. |
| **5a** | Portals never below/inside candles | ✅ **Live** | `spawnPortal` anchors above the tallest candle in its column. |
| **5b** | Portal **colour** identity (purple/blue/gold) | ✅ **Fixed this pass** | Were all purple. Now **purple = lesson, blue = trade, gold = boss** (`PORTAL_COLORS`). |
| **6** | Candles touch | ✅ **Live** | `gapMin/gapMax = 0`. |
| **7** | Graduation cap removed | ✅ **Live (code)** | The `🎓 INTRO BOSS` tag is gone (now `🎲 FIRST GUARDIAN`). The splash **logo.png** is a fixed art asset — if a cap shows there, it's the image, not the game. |
| **3** | Trade opportunity = pause / darken / focus / must-interact | ⚠️ **Partial** | The world freezes (`turtle.halt`), the banner pops in, the turtle locks to "focused". **Missing:** full screen-darken, camera push-in, and a hard "must interact" gate (you can still skip). Real gap. |
| **4** | Trade education ("YOU ARE HERE" / "PREDICT NEXT" / empty future) | ⚠️ **Partial** | "you are here" marker exists on the setup chart. **Missing:** a clear "PREDICT THE NEXT MOVE" marker and reserved empty future space. Real gap. |
| **6b** | Chart visual noise | ⚠️ **Verify** | A faint per-candle "living" halo still draws; the glowing pickups are the canonical shells (intended). The halo is the likely "glowing dots" — candidate for removal. |
| **8** | Boss experience (fullscreen art → dialogue → arena) | ⚠️ **Needs work** | A cinematic reveal exists (letterbox, rising villain, FIGHT) but the layout/mobile/art-featuring needs the redesign you describe. |
| **9** | Boss victory screen | ⚠️ **Needs work** | Shows DEFEATED + shells + XP + lore. **Missing:** "1 / 11 GUARDIANS CLEARED", "Market Maker remaining", shell/XP burst, sound cue. |
| **10** | Level-up celebration | ⚠️ **Needs work** | Rank-up shows a floater; a plain XP level-up is near-silent. Needs animation + sound + glow. |
| **11** | Mobile usability sweep | ⚠️ **Not done** | Needs a dedicated screen-by-screen pass. |

---

## The 7 requested audit sections (current state, v40)

**1. Remaining confusion points**
- Trade discovery is emphasized but still *skippable* — a distracted beginner can walk past the
  most important moment (Phase 3).
- The beginner trade panel says "TRADE SETUP" but doesn't yet spell out *what just happened / where
  am I / what do I predict* in one glance (Phase 4).

**2. Remaining UI problems**
- Boss intro and victory screens are functional but not "special" on mobile (Phases 8–9).
- A full mobile sweep for clipped/overlapping text hasn't been run (Phase 11).

**3. Remaining curriculum violations**
- **None for a true first-time player** (verified). One nuance: chart *labels* gate on the
  furthest level ever reached (learn-once), so a **returning** player replaying Level 1 sees
  labels they already learned (e.g., trend/levels). That's consistent with "taught → shown," not
  a first-time violation — but if you want Level 1 to look pristine even on replay, that's a
  one-line change (gate labels on `session.level` instead of furthest-reached).

**4. Remaining onboarding problems**
- Trade moment needs the full "stop everything, this matters" treatment (Phase 3).
- Level-ups pass unnoticed (Phase 10).

**5. Retention concerns**
- Intentionally minimal (per your direction). Daily Drills are correctly locked out of onboarding.
  No streak/login pressure in the first 15 minutes. ✅

**6. Monetization concerns**
- None present and none recommended for V1 — no IAP, ads, or paywalls in the build. The economy is
  closed (shells are skill capital, not purchasable). Keep it that way for launch.

**7. Top 10 issues remaining before launch (priority order)**
1. **Phase 3 — Trade pause/darken/focus** (highest: trading is the core mechanic).
2. **Phase 4 — Trade education markers** (you-are-here / predict-next / empty future).
3. **Phase 9 — Victory screen** (Guardian count, bursts, sound, strong continue).
4. **Phase 8 — Boss intro** (fullscreen art, mobile layout, drama).
5. **Phase 10 — Level-up celebration.**
6. **Phase 11 — Mobile usability sweep** (clipping/overlap/readability).
7. **Phase 6b — Remove the per-candle "living" halo** for a cleaner chart.
8. **Full cinematic→Boss-1 screenshot playthrough on a truly fresh save** (incognito) to confirm visuals frame-by-frame.
9. **Decide the replay-label rule** (furthest-reached vs current-level).
10. **Deploy discipline:** add a load-time browser smoke-check to the deploy step so a TDZ-style halt can never ship again.

---

## What changed this pass
- Fixed the fatal TDZ halt (`updateDailyDrillLock` deferred past `bossesDone` init) and redeployed.
- Added **portal colour identity** (purple = lesson, blue = trade, gold = boss).
- Verified Phases 1, 2, 5a, 6, 7 are live and correct.

The big redesign items (Phases 3, 4, 8, 9, 10, 11) are **real remaining work** — but they are
redesigns of existing screens, not new mechanics, so they fit the "polish, don't add" rule. Given
the last rushed deploy shipped a fatal bug, I recommend doing them in **small, individually
smoke-tested batches** rather than one giant change. Tell me the order and I'll start at the top.
