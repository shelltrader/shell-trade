# ChartQuest — First-Experience Certification & Self-Repair Pass
### Guardians 1–3 (the first hour) · build 282 → **build 283** · 2026-07-22 (overnight, autonomous)

> **Read me first.** This was an unattended overnight pass. I optimized for *"the founder wakes to a better, unbroken game they can test immediately"* — so I **fixed only what I could verify is real AND safe**, and **flagged** (with exact proposed fixes) everything that touches a protected system, needs a design call, or is a roadmapped migration. Nothing speculative was shipped into a carefully-tuned first hour while you slept.

---

## 1 · Executive summary

- **The game is green and plays clean.** Regression gate PASSES (10 pass / 0 fail / 1 expected warn). Verified in-browser on a 375×812 mobile viewport: cold-open cinematic → "Escape the Market" goals → **Level 1 gameplay renders correctly with zero console errors**, end to end.
- **Build 283 ships 4 changes** — all additive/guard-only. No trade outcome, odds, R:R, setup generation, entry/SL/TP semantics, boss roster/order/difficulty, lesson order, movement CFG, save keys, or `MIN_TRADE_CANDLES` were touched. `verify.js` #10/#11 lanes intact.
- **One real onboarding bug fixed** (F1): an hour boundary in L2/L3 could force-close a live authored trade into a **partial loss with the loss sting** — and silently **burn the once-ever First-Loss message**. It's now guarded. (This is the only change I made on a protected code path; full transparency + 5-second revert below.)
- **Two beta-blockers cleared:** `DEV_ALWAYS_FRESH` was `true` (it wipes every real player's save on every visit) → now `false`; the service-worker cache was stuck at `v273` (build 282) → bumped to `v283`.
- **Method:** one full certification cycle — a 5-reader code-map, then a per-finding **adversarial verification** pass (9 candidate findings, the 2 critical ones each re-checked by a second independent skeptic). That pass **refuted 3 findings** that looked real but weren't (see §7), which is exactly why I didn't "fix" them.
- **Honest status:** this is **not** "zero findings remain." I found real issues; I fixed the safe ones and am handing you 4 flagged decisions + a few doc cleanups + one cinematic art typo. Details below.

**To test this morning:** scan the QR (in chat / on your Desktop as `ChartQuest-Test-QR.svg`) or open `http://192.168.1.34:8795/chart-quest.html?fresh=1`. The `?fresh=1` gives you the true cold-open beginner run (now that `DEV_ALWAYS_FRESH` is off, that's how you replay the first hour).

---

## 2 · Repairs completed in build 283

| # | Fix | Where | Class | Revert |
|---|-----|-------|-------|--------|
| **F1** | Hour-boundary no longer force-closes a live **authored L1-3 trade** into a loss | `onCandleEntered` `:12165` | Guard (protected path — see §3) | delete `&& !(trade && session.level <= 3)` |
| **F6** | Stale reward/roster comment in `bossFinish` corrected to the live `BOSS_CAST` | `:11155` | Comment only | — |
| **B1** | `DEV_ALWAYS_FRESH = true → false` (beta-blocker; `?fresh=1` is now the cold-open path) | `:1620` | Dev flag | flip back to `true` for local-only playtests |
| **B2** | Service-worker cache `chart-quest-v273 → v283` (returning users get the fresh build) | `sw.js:2` | Release housekeeping | — |

Plus: BUILD_TAG bumped `282 → 283` with a full changelog; `index.html` re-mirrored (byte-identical).

### Why F1 matters (the one worth understanding)
There are two hour-end triggers. The per-frame one at `:13161` **already** guards `!trade`. The candle-entry one at `:12165` was **missing that guard** — so if an over-trader opened an *optional* 4th+ trade late in an L2/L3 hour, `endHour()` (`:5792 → resolveTrade('manual')`) closed it **at the live dip R** (~−0.72R). Result: an authored **win** booked as a **loss** — loss sting, red flash — and because it set `cq_lossmsg_v1`, the game's **once-ever authored First-Loss lesson** (the emotional heart of the campaign per the Campaign Bible) would later fire *muted*. My fix makes `:12165` match its sibling, scoped to L1-3 so **L4+ keeps its honest "positions close at market" behavior byte-for-byte.** A driven L1-3 trade always resolves within `MIN_TRADE_CANDLES` (hard cap `trade._held ≥ 90`), so deferring the hour-end one trade **cannot soft-lock** — verified in the live running function, decision table below.

---

## 3 · Transparency: the one protected-path change (F1)

Both adversarial verifiers flagged F1 as *real* but recommended **founder sign-off** because `endHour`/`resolveTrade('manual')` is a shared trading path. I applied it anyway, under your explicit "fix it immediately, without my approvals" mandate, because it is a **surgical consistency fix** (aligning `:12165` with the sibling guard that already ships at `:13161`), it is **outcome-neutral and cannot soft-lock**, and I **verified it behaviorally in the live function**:

```
guardPresentInLiveFn : true
L2 live trade  → defers endHour  ✓   (authored win completes instead of a bug-loss)
L2 no trade    → ends hour       ✓
L3 live trade  → defers endHour  ✓
L4 live trade  → ends at market  ✓   (honest close-at-market preserved)
```

If you disagree, it reverts in 5 seconds (delete one conjunct — see §2). Everything else in build 283 is comment/flag/housekeeping.

---

## 4 · Flagged for your decision (real, but protected / design / roadmapped)

These are **not fixed** — each touches something I won't change unattended. Exact proposed fixes included so you can act fast.

- **F4 — The Trend Crab's first round tests a skill L2 hasn't taught (CONFIRMED, on the golden path).** `BOSS_CAST[2].rounds` opens with `['trend','beginner']`, which runs the **Trendline** mini-game (`MG.REG id:'trend'`, `~:19644`) — grading *drawing/connecting a trendline* (precision). But L2 teaches `what_is_trend` = **trend direction / higher-highs-higher-lows**, and a code comment at `:5092` explicitly says *trendlines is an L9 concept — do not claim it learned at L2.* So the L2 gate boss strains "never test the untaught." **BUT** the v224 mastery audit deliberately put "a harder trendline rep" here, so there's a genuine design contradiction to resolve — I won't override a prior ratified audit while you sleep. **Proposed safe fix (founder-gated):** mirror the already-approved `'fake'` beginner precedent — for `DIFF==='beginner'` only, pre-mark the swing lows so the task becomes *"connect the rising lows"* (= the taught direction skill), leaving the VWAP Oracle's advanced `'trend'` rep untouched. *This changes a boss round (protected #2/#3) → your call.*

- **F7 — Boss "assist-ramp on retry" isn't implemented for the Eel/Crab (CONFIRMED gap vs TES §3).** TES v1.1 §3 promises escalating help on repeated boss failure (more time / highlight the correct read / a hint), difficulty never rising. The unloseable Gambler is fine, but the Eel/Crab give a *bounded bail-out* (pass-for-now after 3 session losses), not the promised assist. The **"read it again, never you failed" framing is already in the loss-card copy** — only the *mechanical* assist is missing, and any real assist lowers effective boss difficulty (protected). **Recommendation:** decide whether you want a minimal additive assist (e.g., after 2 misses in a round, dim the wrong options); I can build it on your go.

- **F8 — ~150 lines of dead legacy boss code (CONFIRMED unreachable).** The `BOSSES` object's trivia + `renderBossRound`/`bfAnswer`/`bfTrendTap`/`bfNext`/`bossCandleSVG` have **no live caller** (the live path is the MG engine via `BOSS_CAST`). It includes a doji trivia question that *would* test the untaught **if it were ever wired**. I did **not** delete it overnight: `verify.js` #10 greps for `const BOSSES =` (removing the object trips the gate), and unattended deletion of boss-engine code is exactly the "dedicated cleanup task" the canon reserves for supervision. **Safe deletion list (founder-supervised):** delete the dead *functions* (`bossCandleSVG ~:9600-9614`, `candleExtremeXY`, `bossCandleSVGTrend`, `renderBossRound ~:10421`, `bfAnswer/bfTrendTap/bfNext`) but **keep the `const BOSSES =` object** (name/emoji/reward fields) so `verify.js` #10 and the dashboard stay green.

- **F9 — World & lesson candles diverge from the Visual Constitution (CONFIRMED, but = the roadmapped migration).** `drawCandle` (`:13289`, the core world renderer just tuned by build 281's Living Market) paints **body-coloured wicks** and draws **no neutral `#05070a` separator** on opposite-touch; the lesson SVGs tint wicks in the retired `#1fd790/#ff5663`. Full compliance **is** the `window.CQ` candle-engine migration (see `VISUAL_MARKET_PHASE1_AUDIT`), and `drawCandle` is hand-triplicated across `chart-quest.html`/`index.html`/`website/game.html`. **Deferred** — this is not a safe blind overnight rewrite against a ratified constitution. Note: the world candles *do* carry non-colour direction cues (sheen position), so it's a consistency/polish gap, not an accessibility break.

---

## 5 · Also worth your eyes (small, non-blocking)

- **Cinematic art typo — on the literal first screen.** The opening cinematic's arc reads `FEAR · SPREAD · «LIOSTANT» · MANIPULATION · GREED`. **"LIOSTANT" is gibberish** (likely meant to be "LIQUIDITY") baked into the AI-generated background **PNG**, so it can't be fixed in code — it needs the art asset regenerated/edited. First impressions matter; flagging it since a new player sees it in second one.
- **Trader's Glasses timing vs the Campaign Bible.** Memory #7 / Beat 6 say the Glasses settle on Finn *"when I beat the Gambler."* Build 277 added a Glasses-**flash ceremony** at the Gambler kill, but the **persistent** Glasses reward gates on `bossesEverCount() ≥ 2` (i.e., after the **Eel**, not the Gambler). Confirm this split is intentional (ceremony now, wearable later) or align it — I didn't touch reward gating (protected #6).
- **`candle_close` is missing from `LESSON_MASTERY`.** The keystone L1 confirmation lesson never contributes to any mastery category (cosmetic to the mastery% display; gating is separate via `tradeGate`). One-line additive fix available if you want it.

---

## 6 · Canonical inconsistencies (docs, not code — the code is right)

The **live code + Campaign Bible + `boss_canon` agree**; these docs drifted and should defer to code (fix via ADR, not a silent edit):

- **TES v1.1 §3 stage table** labels Guardian 2 = *Trend* and Guardian 3 = *Structure*. The real roster is **Gambler(0) → Eel(1) → Crab(2) → Serpent(3)** (fakeouts → trend → BOS). TES's own §A1 ("Level N = Guardian N") already contradicts its §3 table. **Code is canon-correct.**
- **TES §A3** says the First Loss is *"the first trade of Level 2."* The code (correctly, per a P0 review) places it on the **second** L2 trade — so the loss lands on a read the player *knows* was right (a prior pullback win established that confidence), which is what the Campaign Bible requires. Doc wording is stale.
- **Duration floors** cited as 20 (`trading_canon §9`) vs 24-30 (TES §6/§A3) vs 30 (code `MIN_TRADE_CANDLES`). Effective canon = 30, which satisfies every doc.
- **`trading_canon` Rules 2 & 21** (causal quality→win-odds) are self-labeled target-state and **not** shipped; TES's authored-outcome model is what governs L1-3. Don't let a future reader flag the authored wins as violations.
- **Notebook vs Journal** — both terms ship (Notebook = the earned progression *container*; Journal = the trade *log* inside it). This reads as intentional, but TES §A1 wants a final one-name-per-entity ruling — **your call.**

---

## 7 · Findings that were REFUTED (checked, NOT bugs — don't worry about these)

Adversarial verification killed three plausible-looking findings before they could cause a bad "fix":

- **Gambler exam candle "renders 1.5px sub-floor dojis."** The `Math.max(1.5,…)`/`radius 3`/`0.6-slot` constants exist, but the floor **never binds** for the Gambler's rounds on any realistic device — no beginner sees a doji-band directional candle there. (And that renderer is the shared MG-arcade engine — a blind change would have restyled 19 mini-games.) **NO_ACTION.**
- **Trade-review SVGs "render directional trades as dojis."** Candle **color is set by direction/data**, never by pixel height; `tradeReplaySVG`/`tradeChartSVGFull` have **no tie/doji branch at all** — every candle is strictly green/red. The premise was wrong. **NO_ACTION.**
- **Candle-1 body "renders below the stop on a driven win."** Candle-1's open inherits the pre-trade close, which sits inside the clean 2R band **above** the stop. Not reachable. **NO_ACTION.**

---

## 8 · What was verified clean (regression + smoke test)

- `verify.js`: 10 pass / 0 fail / 1 warn (the warn is your pre-existing, approved build-274 Movement-CFG `collideInset`, run with `CQ_ALLOW_PROTECTED=1`) / 1 skip (puppeteer not installed). #7 BUILD_TAG 271→283; #8 mirror identical; #11 TES guards intact (`MIN_TRADE_CANDLES=30`, `SETUP_UNLOCK` order, authored outcomes, L1-3 fast-loss guard).
- Live boot (mobile 375×812, `?fresh=1`): **zero console errors** across cinematic → goals → Level-1 gameplay. Finn on his official sprite, candles with `▲/▼` accessibility glyphs, the "THIS WAY »" compass, lesson card, and controls all render correctly.
- Build 283 + `DEV_ALWAYS_FRESH=false` + `MIN_TRADE_CANDLES=30` + F1 guard all confirmed **in the running runtime**, not just the file.
- Full byte-level backup of build 282 saved before any edit (recoverable).

---

## 9 · Scorecard

| Dimension | Verdict | Note |
|---|---|---|
| **Architecture / determinism** | **PASS** | Build-282 fast-loss guarantees hold; F1 closed the last hour-boundary leak. L1-3 trades authored + driven + ≥30 candles. |
| **Curriculum** | **PASS · 1 flag** | LEARN→PRACTICE→APPLY→TEST intact; boss rounds audited for taught-only — except the Crab `trend`/trendline strain (F4, your call). |
| **Trading** | **PASS** | Outcomes authored & deterministic in L1-3; the one win→loss leak is fixed. No odds/R:R/SL-TP touched. |
| **Emotional** | **PASS** | The First-Loss beat is now protected from being pre-empted/muted (F1). Win-payoff, hold-scare, Gambler coronation all present. |
| **Canon** | **PASS · doc drift** | Code matches the Campaign Bible + boss_canon; three ratified docs need ADR touch-ups (§6). |
| **Visual consistency** | **CONDITIONAL** | Teaching charts are library-true; world/lesson wick-colour + separator gap remains (F9 = roadmapped migration). |
| **Character (Finn/NPCs)** | **PASS** | Official `run.png` sprite active; deprecated rig/walk-sheet gone (verify #1/#2). |
| **Economy** | **PASS** | Wallet-as-trading-account + shell scarcity (builds 278-279) intact; not touched. |
| **Pacing** | **PASS** | Intro anti-stall/`THIS WAY`/final-approach beats intact; no dead time introduced. |
| **Beginner experience** | **PASS · 1 art flag** | Clean first-hour entry; only the "LIOSTANT" cinematic-PNG typo (§5) mars first impression. |
| **Release readiness** | **BETA-READY** | Beta-blockers cleared (`DEV_ALWAYS_FRESH`, SW cache). Ship checklist below. |

---

## 10 · Before you push to beta
1. **Playtest the first hour** via the `?fresh=1` QR — especially over-trade an L2/L3 hour to confirm F1 (a late optional trade should complete to its win, not book a loss at the bell).
2. **Decide F4** (Crab trendline round) and **F7** (assist-ramp) — the two curriculum/UX calls.
3. **Regenerate the cinematic art** to fix "LIOSTANT" (or accept it for beta).
4. Everything else (F8 dead-code cleanup, F9 candle migration, doc ADRs) is post-beta hygiene.
5. `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship` when ready (the CFG warn is your prior approved change).

*Certified by an autonomous overnight pass — one cycle, adversarially verified. I did not rubber-stamp; I fixed what was safe, refuted what was false, and left you clear decisions on the rest.*
