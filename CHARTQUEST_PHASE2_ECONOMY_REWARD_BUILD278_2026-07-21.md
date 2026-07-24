# ChartQuest — Phase 2: Economy & Reward Psychology · Build 278
## Change Report

**Date:** 2026-07-21 · **Build:** 277 → **278** · **Source of truth:** `chart-quest.html` (mirrored to `index.html`, sha256 identical) · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer)

**Scope discipline.** Every change is **additive economy tuning** or **display-only HUD**. Nothing touched trade outcomes, odds, R:R math, lesson order, the boss roster, save keys, `MIN_TRADE_CANDLES`, `SETUP_UNLOCK` order, or CFG constants. **`player.shells` remains the authoritative value** — the wallet fantasy is purely how that number is *presented.* No new currencies, shops, crafting, collectibles, journal/lore/progression additions.

**Headline finding (read §3).** The "breakable digital boxes" the brief instructs me to improve **do not exist in the shipping game (`main`).** I did not fabricate them or silently build a new feature — that decision is yours, and it's laid out below.

---

## 1. Every Economy Change — Shell Scarcity

*Goal from the brief: reduce loose shell pickups ~80–90% so **trading**, not platforming, becomes how you grow your account — "create value through scarcity," never artificial grind.*

| Change | Was | Now | Effect |
|---|---|---|---|
| **Ambient body-top shell chance** ([~3376](chart-quest.html)) | `_tall ? 0.5 : 0.22` | `_tall ? 0.08 : 0.035` | **~84% fewer** loose shells on ordinary/tall candles |
| **Spacing between pickups** ([~3389](chart-quest.html)) | skip 3–4 candles | skip **9–13** candles | pickups feel earned + spaced, never a stream |
| **High-route "cache" extra** ([~3391](chart-quest.html)) | 20% chance | **6%** chance | the boost-up bonus is now a genuine rarity |
| **Liquidity pole stack** ([~8629](chart-quest.html)) | **3 shells** per pole (0.38 / 0.72 / tip) | **1 shell** at the tip | the climb pays one meaningful shell, not a handful |
| **Spin-pole shell** ([~3358](chart-quest.html)) | 1 shell, ~every 10th pole | **kept** | it's a rare, wordless *liquidity-lesson* seed — pedagogical, not loot |

**Net:** loose-shell income drops on the order of **80–85%**. A player now reaches the Gambler having grown their account mostly by *winning trades*, not by sweeping the floor — exactly the brief's intent. No spawn was removed that carries a teaching purpose; nothing became a grind (fewer shells, each worth more — not more effort for the same reward).

*These are inline generation constants (`_shChance`, `_shGap`, pole literals) — **not** CFG, so `verify.js` #10 does not newly flag them, and #11 (TES) is untouched.*

---

## 2. Every HUD / Wallet Improvement — "My capital entered the market"

*Goal from the brief: the shell counter should stop feeling like a **score** and become the player's **trading wallet.** During trades, capital visibly leaves; winning, it returns with profit.*

The in-game wallet previously showed **equity** during a trade (balance + unrealised P&L) — so the staked capital never visibly *left.* The number just wiggled. Rebuilt so the wallet reads as an account with capital deployed into the market:

**During a live trade** ([in-game HUD ~15653](chart-quest.html)):
- The **top wallet number now shows what's still SAFE in the wallet** — `balance − deployed capital`. The instant you commit, your stake visibly **leaves** the wallet. It renders in a calm neutral tone (resting capital), not green/red.
- A dedicated **"▸ [amount] IN THE MARKET"** readout appears beneath it (gold), with the deployed capital's **live P&L** ticking green/red under it. The player literally sees *their shells working in the trade.*

**On a WIN** ([resolveTrade ~12189](chart-quest.html)):
- The existing shells-fly-home count-up now **starts from the deployed value** (the capital that left) and flies up to the win total — so in one continuous motion, **your capital returns AND the profit stacks on top.** Not "a number ticked up" — "my money came back bigger."

**On a LOSS:** the capital that left the wallet simply *doesn't return* — the wallet was already showing `balance − stake`, and the authoritative balance settles to exactly that. Seamless, and it *teaches* the felt cost of a loss without any shaming.

**Intermission label** ([~6331](chart-quest.html)): **"TOTAL SHELLS" → "TRADING ACCOUNT."** The between-level wallet stops calling itself a score.

*All of this is display-only. `player.shells` is never altered by the presentation — verified against the payout math (`resolveTrade` still does `player.shells = max(RESERVE, player.shells + delta)` unchanged).*

---

## 3. Every Breakable-Box Improvement — and why there are none

**There is no breakable-box mechanic in `main`.** I searched exhaustively — `box / crate / breakable / smash / shatter / cube / chest / pinata / vault / loot / destructible / node / block`, every entity array (`coins`, `obstacles`, `props`, `pickups`), and the reward paths. The only matches are unrelated: decorative background *nodes* in the intro cinematic, the boss-crest CSS, and the "Lost Pages" (explicitly *"knowledge, not loot"*). A **`feature/blockchain-journey`** branch exists and — per project memory — contains a reusable **"Blockchain Cube,"** but that branch is **not merged into `main`**, and the Cube there is a movement-primer prop, not a shell-bearing breakable box.

So the brief's premise *"the game already contains breakable digital boxes"* is **not true for the shipping file.** I did **not**:
- fabricate a box mechanic and claim I "improved" it, or
- silently build a brand-new interactive feature — the brief itself says *"Your mission is NOT to add features"* and *"No feature creep,"* and a net-new spawn/hit/particle/jackpot system is exactly that, on a file whose canvas I cannot visually verify in this environment.

**This is your call** (§6 of my summary poses it). If you want it, the spec is clean and small and I can build it to your exact numbers (1 shell normal · ~1-in-5 premium with subtle glow+jiggle · 5 shells · satisfying particle burst + audio + hit-feel · max 5, no extra RNG). It composes cleanly with the scarcity above — a *satisfying optional* shell source that never rivals a winning trade.

---

## 4. Reward Psychology — why each change makes players care about trading

Every reward now answers *"why does the player care?"* with **"because I made a good trading decision,"** not **"because a number increased":**

- **Scarcity makes the winning trade the loudest reward in the game.** When the floor was carpeted with shells, a +1 pickup and a won trade blurred together. Cut the ambient 80%+, and the trade win — capital returning *with profit*, flying home — becomes unmistakably the best way to earn. Value through scarcity, exactly as briefed.
- **The wallet fantasy converts an abstraction into a stake.** Seeing your own shells *leave the wallet and enter the market* makes the trade feel like *your money on the line* — which is the entire emotional point of the scare/hold/win arc. A number that just wiggles can't do that.
- **The loss now has honest weight.** With capital visibly deployed, a loss is capital that didn't come home — felt, but never shamed (it's small, the stop protected it). That's the First-Loss lesson made tangible at the HUD level.
- **No new systems to dilute the focus.** Restraint was the goal; the sprint added *zero* currencies/collectibles/trees. It made the *existing* shell mean more.

---

## 5. How each change supports the Campaign Bible

- **Memory 4 — "the shells flew home and I felt rich for one perfect second."** The wallet fantasy is the mechanical heart of this memory: capital leaves, then *returns with profit* in one fly-up. Scarcity ensures that moment isn't drowned out by ambient pickups.
- **Memory 5 — the Hold.** "IN THE MARKET" showing your deployed capital dropping toward the stop during the scare makes *holding* a decision about *your money*, not a number.
- **The Governing Image ("the market keeps a hand under your back").** Losses are felt but small and un-shamed — capital that didn't return, with the stop having kept it survivable. The economy now *teaches* the hand-under-the-back lesson.
- **"I built my trading account," not "I collected lots of shells."** The scarcity + the "TRADING ACCOUNT" framing + capital-in-the-market is precisely the emotional distinction the brief names as the purpose of this sprint.

---

## 6. Verification

| Check | Result |
|---|---|
| Syntax (all 4 script blocks) | ✅ parse clean |
| Boot (build 278, live `?fresh=1`) | ✅ **zero console errors** |
| Frame loop (120 pumped frames: wallet render + economy generation) | ✅ **no thrown errors** |
| `verify.js` regression gate | ✅ **10 pass · 0 fail** · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer) |
| TES guardrail (#11) | ✅ MIN_TRADE_CANDLES=30 · SETUP_UNLOCK order · authored outcomes intact |
| `index.html` mirror (#8) | ✅ sha256 identical |
| Payout math (`player.shells` authoritative) | ✅ unchanged — wallet is display-only |

**Honest limitation (unchanged from Phase 1):** this browser harness runs the tab backgrounded, so the game's rAF render loop is paused and canvas pixels screenshot as black — proven. The *no-trade* wallet path and world generation are exercised clean by the 120-frame pump; the **trade-active wallet** (capital leaving, "IN THE MARKET", the win fly-back) is verified by code-reading + parse but needs one **on-device `?fresh` pass** to eyeball. Watch for: the wallet number dropping by your stake on trade open, the gold "IN THE MARKET" readout, and the win count-up flying from the deployed value up past your old balance.

---

## 7. Remaining / Open

1. **The box decision (yours).** Build the elegant box mechanic to spec, point me at the `feature/blockchain-journey` Cube, or skip it — see the summary.
2. **On-device visual pass** of the trade-active wallet (harness can't render canvas).
3. **Starting-balance sanity** (optional): with ambient income cut, confirm on-device that the guided first trades still fund a satisfying account curve to the Gambler (the recommended stake is a % of balance, so it scales — but worth an eyeball).

*The sprint's purpose was one emotional distinction: players should remember "I built my trading account," not "I collected lots of shells." Scarcity + the wallet-as-account are how this build earns it.*
