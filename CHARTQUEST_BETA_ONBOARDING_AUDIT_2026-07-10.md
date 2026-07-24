# ChartQuest — Beta Onboarding Audit (per-persona)
**Date:** 2026-07-10 · **Build audited:** 261 (live playthrough, `?fresh=1`) + founder device notes (252/253) + first-hour direction (257)
**Goal of the beta:** 10 friends next week. Success = they reach Boss 3, feel it was *fun/rewarding*, and want to pay $25 to continue.
**Method:** I played the actual first hour headlessly, screen-by-screen, and read it against the founder's own playtest notes and the TES constitution. **Report 1 of 3** (Onboarding). See also: Retention audit, Top-10 actions.

---

## 0 · The 4 personas (used across all 3 reports)

| Tag | Who | Count | Games? | Markets? | The question they answer |
|---|---|---|---|---|---|
| **NOVICE** | your girlfriend | 1 | ❌ none | ❌ none | *Is this broad enough for a true non-gamer, non-trader?* (the floor) |
| **NEW-TRADE** | "no idea what trading is" | 2 | ✅ normal | ❌ none | *Does the game teach trading painlessly?* |
| **TRADER-LOWGAME** | know trading, barely game | 2 | ⚠️ low | ✅ yes | *Does the platformer get in their way?* |
| **TRADER-GAMER** | know both | 5 | ✅ yes | ✅ yes | *Is it deep/rewarding enough to respect?* (your evangelists) |

The **NOVICE is your canary** — if she bounces, the top-of-funnel is too narrow. The **5 TRADER-GAMERs are your amplifiers** — they decide whether this spreads.

---

## 1 · The first hour, beat by beat (what I actually saw)

| Beat | State in build 261 | Verdict |
|---|---|---|
| **0:00 Cold open** | Cinematic **video** → **black screen** + SKIP button (headless). On device it plays; if it stalls, the first thing anyone sees is black. | 🔴 **First-impression risk** — the literal first 15s is fragile |
| **0:20 Goal card** | "⚔ ESCAPE THE MARKET → 1. Learn to Trade · 2. Defeat the 10 Guardians · 3. Beat the Market Maker & Escape the Block Chain" + CONTINUE | 🟢 Clear, intriguing, a real quest spine |
| **0:30 First movement** | Drops into the chart-as-platformer. Lesson card "🟩▲ GREEN = UP · 🟥▼ RED = DOWN" pinned top-left (accessibility glyphs present ✅). Prompt: "SPACE to JUMP — hop across the candle tops." | 🟢 *Verbs before stakes* (Mario-1). Good instinct. |
| **0:40 Verb teaching** | Contextual prompts escalate: **JUMP** → **↑/W to BOOST — jet over the tall candles** → **↓/S to TUCK — drop through the gaps.** | 🟢 Genuinely well-sequenced teaching |
| **~1:00 Traversal** | **Here's the problem.** The movement is *floaty* — boost sends Finn way up above the chart; it's not obvious how to make **rightward progress** toward the goal. The world is **very sparse** (2–3 candles on a big empty screen). I repeatedly boosted up and hovered without advancing. | 🔴 **The hidden funnel leak** (see §2) |
| **~4:00 First setup + Trade 1.1** | *(Not reached headlessly — traversal too imprecise.)* Per docs: setup circled → portal → ENTRY/STOP/TARGET walkthrough → dip-scare → runs to target → WIN + First-Win trophy + Journal unlock. | ⚪ Assessed in Retention report from founder notes |
| **Persistent** | The **dev BUILD_TAG** ("build 261 — REVERT V3 weight-model…") is **rendered across the top of the play screen.** | 🟠 Ships an internal string to your friends — looks unfinished |

---

## 2 · THE headline finding: movement is a wall in front of the hook

Every design doc audits the **trade** (correctly — it's the core). But the funnel is:

```
intro → GOAL → [ PLATFORMER TRAVERSAL ] → first setup → first trade (the hook)
                        ▲
                 friends can leak out HERE, before they ever feel a trade
```

I lived it: floaty boost, sparse world, no strong "go right" gradient. For your personas:

| Persona | Traversal experience (predicted) | Leak risk *before the first trade* |
|---|---|---|
| **TRADER-GAMER** ×5 | Trivial. They platform on instinct. | 🟢 Low |
| **NEW-TRADE** ×2 | Fine — they game; they'll enjoy the hop-the-candles bit. | 🟢 Low |
| **TRADER-LOWGAME** ×2 | **Friction.** They came for trading, not a platformer; floaty controls annoy them *before* the payoff. | 🟠 Medium |
| **NOVICE** ×1 | **High.** Non-gamer + floaty jump/boost/tuck = confusion. She may get stuck hovering, like I did, and quit before a single trade. | 🔴 **High** |

**This is the #1 onboarding fix**, and it is *invisible* in the current docs because they start the clock at the trade. Options (detailed in Top-10 #2): shorten the run to the first setup, tame the boost, add a gentle "this way →" pull/breadcrumb, or an auto-assist for the first traversal.

---

## 3 · What the onboarding does *well* (keep, don't touch)

- **The quest framing** ("Escape the Market → beat the Guardians → beat the Market Maker") is a genuinely good spine — clear goal, mythic stakes, a finish line you can picture.
- **Verbs-before-stakes** structure (move/jump/boost/tuck taught before any trade) is textbook and correct.
- **Progressive contextual prompts** — each verb is taught exactly when the terrain demands it. This is real craft.
- **Accessibility glyphs** (▲/▼ on the green/red lesson) — colour-blind-safe, already done.
- **The authored confidence curve** (per the 257 doc): L1 all-wins → proud Guardian 1 → coached First Loss → recovery. No random loss can crush a beginner. This is the single best onboarding decision in the project.

---

## 4 · Onboarding friction map (ranked)

| # | Friction | Who it hurts most | Severity | Fix class |
|---|---|---|---|---|
| O1 | **Floaty traversal to the first trade** — can hover/stall, no strong forward pull | NOVICE, TRADER-LOWGAME | 🔴 High | Movement tuning / level design |
| O2 | **Cold-open black-screen** if the video stalls | ALL (first 15s) | 🔴 High | Add static fallback + instant skip |
| O3 | **Sparse world** — 2–3 candles, lots of void, feels low-budget & aimless | ALL | 🟠 Med | "Market breathing" (candle density) |
| O4 | **Dev build tag on the play screen** | ALL | 🟠 Med | Hide unless `?qa=1` |
| O5 | **Time-to-first-trade** may be long for the impatient trader | TRADER-LOWGAME | 🟠 Med | Shorten run to setup #1 |
| O6 | **Guardian 1 tests 2 untaught micro-rules** (`confirm`/`error`) | NEW-TRADE, NOVICE | 🟡 Low | Narrow playlist or teach first (protected #2) |
| O7 | **"Escape the Block Chain" / "Market Maker"** jargon in the goal card | NOVICE | 🟡 Low | Fine for flavour; watch NOVICE comprehension |

---

## 5 · Instrumentation you'll want live for the beta (so 10 friends = real data)

You already added A4 duration telemetry + confidence telemetry (build 256). Before launch, make sure you capture a **quit-point** for each friend:
- reached_first_movement · reached_first_setup · **completed_first_trade** · reached_guardian_1 · **beat_guardian_1** · reached_L2 · **hit_first_loss** · reached_boss_3 · saw_paywall.

With 10 humans, the **completed_first_trade** and **beat_guardian_1** drop-offs will tell you more than any amount of my analysis. Right now O1/O2 predict your biggest leak is *before* completed_first_trade — the telemetry will confirm or kill that.

---

## 6 · Onboarding verdict per persona (does the first hour hook them?)

| Persona | Reaches first trade? | Finishes first hour? | Confidence |
|---|---|---|---|
| **TRADER-GAMER** ×5 | ✅ easily | ✅ likely | High — they're your base case |
| **NEW-TRADE** ×2 | ✅ likely | ✅ likely if the trade *feels* good (see Retention) | Medium-High |
| **TRADER-LOWGAME** ×2 | 🟠 with mild friction | ⚠️ depends on trade depth | Medium |
| **NOVICE** ×1 | 🔴 **at risk** (traversal) | ⚠️ only if she reaches + loves a trade | **Low — the canary** |

**Bottom line:** the onboarding *design* is strong; the onboarding *execution* has one high-severity leak (traversal) and one high-severity risk (cold open) that sit **before** the trade — i.e. before your best asset gets a chance to work. Fix those two and the first hour is beta-ready for 8–9 of your 10. The 10th (NOVICE) also needs the trade itself to land — which is Report 2.

*Audit only. No code, gameplay, or canon was changed.*
