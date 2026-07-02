# ChartQuest — Level 1 Constitution Audit (build 214)

**Date:** 2026-07-02
**Build audited:** 214 (chart-quest.html / index.html, in sync — 5 known block-2 hunks)
**Trigger:** on-device playtest (build 213) felt broken — instant first trade with no lessons, a Lost Page celebration landing mid-trade, ~10 flat candles during a winning trade.
**Reference:** ChartQuest Design Constitution (2026-07-02) — LEARN → PRACTICE → APPLY → TEST; the Golden Rule; TEACH → PRACTICE → TRADE ×3 → BOSS.
**Status:** AUDIT ONLY. No flow, lesson, trade, or boss code was changed as part of this audit. Fixes A and B below are **awaiting approval**.

---

## 0 · Executive summary

**The game is not broken, and the full Level 1 curriculum still exists and runs.** The playtest that prompted this audit was performed on a device whose localStorage marks the player as a veteran — that cohort intentionally skips every lesson. The complete intro flow (cinematic → green/red lesson → practice → prediction → momentum/pullback/confirmation lessons → 3 guided trades → Gambler) was verified live in a browser with cleared storage during this audit.

The real, structural finding is that **ChartQuest currently ships two different Level 1s** — one for fresh players (fully constitution-compliant) and one for returning players (skips TEACH/PRACTICE entirely) — and that the game's **persistence model is internally inconsistent** (lessons persist forever; boss/Notebook progress resets every session). That inconsistency, not a regression, produced the "broken" feel.

One genuine pre-existing defect was found and fixed (flat candles during small-R trades — visual only), and one defect introduced by Lost Wisdom V2 was found and fixed (page spawning/celebrating during an open trade).

---

## 1 · Current flow (as implemented)

### 1a · Cohort A — fresh player (no localStorage)

Traced through `introFlow` in code and verified live (cleared storage → cinematic boots, `introFlow.active = true`).

| # | Step | Code evidence |
|---|------|---------------|
| 1 | Intro cinematic ("Escape the Blockchain") → faction pick | `IntroCinematic.start` (~line 2191) |
| 2 | Movement taught contextually — A/D, jump, boost hints | `coach` (~line 3431) |
| 3 | Candle 40: **GREEN vs RED** discovery portal (auto-starts at candle 52 if ignored) | ~line 11911 |
| 4 | Green/Red **animated lesson** → **Trader View practice** → **Prediction Bet** (first win) | `beginGreenRedLearn` → `openIntroLesson('candle')` → `openConceptPractice('greenred')` → `triggerPredictionBet` (~line 15567) |
| 5 | Explore gap (~30 candles) → **Momentum lesson → practice** → "I'M READY" hard-stop card → **Trade #1** (guided, full ENTRY/STOP/TARGET walkthrough, engineered win) | `beginIntroFirstTrade` → `armExplore('momentum', …, armFirstGuidedTrade)` (~line 15610) |
| 6 | Trade review → explore → **Pullback lesson → practice → Trade #2** | `teachThenNextTrade('pullback')` (~line 12326) |
| 7 | Explore → **Confirmation lesson → practice → Trade #3** | `_nextConcept = 'confirmation'` (~line 12318) |
| 8 | Final-approach gameplay stretch → Gambler portal → **Boss 1** | `waitThenIntroBoss` → `'prove'` phase (~line 11920) |

Hard guarantees in code:

- `INTRO_TRADES_NEEDED = 3` (~line 12396) — three real trades before the Gambler.
- Anti-skip rule (~line 11890): *"If the player keeps skipping the setup, RE-SURFACE it — NEVER skip to the boss. HARD RULE: all 3 guided trades must happen before the Gambler."*
- Concept order per trade: momentum ← T1, pullback ← T2, confirmation ← T3.

### 1b · Cohort B — returning player (what the playtest device experiences)

All teaching state persists in localStorage: `cq_played`, `cq_traded_v1`, `cq_mgseen_*`, taught flags, `cq_maxHour_v1`. Boss progress (`bossesDone`) does **not** persist — it is a session-only `Set` (~line 9011).

| # | Step | Code evidence |
|---|------|---------------|
| 1 | Boot straight into Level 1, no cinematic, no lessons | `cq_played` short-circuits intro (~line 1823) |
| 2 | First setup can appear from **candle 8** (~15 s in) | `SETUP_WARMUP = 8` (~line 4110) |
| 3 | Trades at will; Guardian locked behind the **mastery gate**: 3 trades, 2 wins, 3 correct reads (+ Journal review once the Notebook exists) | `tradeGateRequired()` → `{ n:3, w:2, p:3 }` for L≤4 (~line 4779); enforced at intermission `imNext` (~line 11429) |
| 4 | Candle 190 → intermission → (gate) → **Boss 1** | `session.perHour = 190`, `endHour()` |

So the veteran Level 1 is: *walk → trade → trade → trade → reads → boss* — with zero TEACH/PRACTICE steps.

---

## 2 · Intended flow (constitution)

> Intro → Green vs Red lesson → practice → Prediction exercise → Momentum lesson → practice → Trade #1 → Pullback lesson → practice → Trade #2 → Confirmation lesson → practice → Trade #3 → Boss 1

**Verdict: the fresh-player code path matches this step for step.** The build-201 intro refactor implemented exactly this structure; it has not been lost, reordered, or compressed by any subsequent build (including Lost Wisdom V1/V2, builds 212–214, which touch no flow code).

---

## 3 · Violations

### Vio-1 — Level Structure Rule: returning players get TRADE ×3 → BOSS with no TEACH/PRACTICE
- **Rule affected:** "Every level follows TEACH → PRACTICE → TRADE → TRADE → TRADE → BOSS."
- **What happens:** teaching state persists forever, so replays skip every lesson, practice, and the prediction exercise.
- **Golden Rule status:** *technically satisfied* — the player was taught, in a previous session; nothing untaught is tested. But the level structure as written is not followed on replays.
- **Severity:** design-decision, not a regression. This is the exact experience reported from the playtest device.

### Vio-2 — Inconsistent persistence (root cause of the "broken" feel)
- **Rule affected:** spirit of the core loop + Notebook Rule ("Notebook is progression… should feel valuable").
- **What happens:** lessons persist across sessions, but `bossesDone` (and therefore the Notebook) resets every session. A veteran simultaneously experiences "the game remembers me" (no lessons) and "the game forgot me" (Notebook re-locked, Lost Pages shown as *"Finn can't read it yet"* to a player who already earned the Journal).
- **Severity:** high for perceived coherence; small, contained fix.

### Vio-3 — Chart realism: flat candles during small-R trades *(pre-existing; fixed in build 214)*
- **Rule affected:** chart realism / quality of the trade systems ("these systems must be used" — and must look right).
- **What happened:** `tradeDrivenCandle` (the L1–3 win/loss drive) floored candle bodies at `R × 0.10–0.16`. The ticket's stop distance can be as small as `max(14, atr)` world units, so a tight-stop trade printed 2–6-unit bodies — visually flat — for 20+ candles (the reported "ten flat candles before the win"). The scripted terrain enforces ≥46-unit bodies, so the contrast was stark.
- **Fix applied (disclosed under Change Control, §5):** absolute world-unit floors on drive bodies (main step ≥18–27, counter ≥12). Visual only — every outcome-safety clamp (win never breaches stop, snap-on-tag) is preserved. No change to trade frequency, pacing phases, or outcomes.

### Vio-4 — Lost Wisdom interrupting a live trade *(introduced by V2 in build 213; fixed in build 214)*
- **Rule affected:** "Lost Wisdom supplements learning. It never replaces (or interrupts) it."
- **What happened:** a Lost Page could spawn on the route while a position was open; on-device evidence shows "MYSTERIOUS PAGE FOUND" rendering over the live trade UI.
- **Fix applied:** page spawns defer while a setup is forming, a ticket is open, or a trade is live (`setupFlow / pending / trade` gate in `maybeSpawnWisdomPage`). Pages now belong to the calm stretches between trades.

---

## 4 · Explicitly NOT violations (checked and cleared)

| Check | Result |
|---|---|
| "Trade at the very beginning of the game" seen during audit testing | **Test-harness artifact** — the audit forced `setupCountdown/genSetupIn` in a preview browser to reproduce Vio-3 quickly. The shipped game never does this. |
| ≥3 trades before every boss | Enforced for both cohorts: `INTRO_TRADES_NEEDED = 3` (fresh) and the mastery gate `n:3, w:2, p:3` (all levels; `n:5, w:3, p:4` from L5). |
| Decision count 5–8 per level | Fresh L1 ≈ 9–11 decisions (practice, 3 bet rounds, 3 trades + trader-view calls, boss rounds). Veteran L1 ≈ 7 (3 reads + 3 trades + boss). |
| L1 curriculum leakage (support/resistance/VWAP/BOS) | `teach()` is curriculum-gated; L1 focus list is `candles_intro, long_vs_short, candle_close` only. The banner's `teach('htf')/teach('vwap')` calls are blocked by the gate at L1. |
| Boss 1 tests only taught concepts | Gambler round 1 is the candle lab; `beginGreenRedLearn` pre-marks `cq_mgseen_candle` so the boss goes straight to exercise without re-teaching. |
| Lost Wisdom placement rules | 1 easy + 1 hidden per level (`WISDOM_SPOTS`), ≥65-candle gap, easy after the movement coach (~candle 60), L1 hidden additionally gated behind the first trade, never referenced by any boss, never on the walking route (112/190-px clearance + local-path clamp + hill-top guard). |
| Lesson delivery via animated chart system | All L1 concepts use `openIntroLesson`/`LessonChart` scenes (verified `typeof LessonChart === 'object'` in-browser, build 212+). |

---

## 5 · Change Control disclosure — build 214 (applied before the constitution arrived)

Per the Change Control Rule, the three changes already in build 214, none of which touch lesson order, level flow, trade count, boss timing, or curriculum:

1. **Trade-drive flat-candle floor** (Vio-3 fix) — why: chart realism hard rule; improves learning (the chart must always look believable). Visual only.
2. **Lost Wisdom trade-focus spawn gate** (Vio-4 fix) — why: Lost Wisdom must never interrupt the core loop; improves learning (protects trade focus).
3. **`?fresh=1` playtest reset param** — why: testing infrastructure; wipes `cq_*`/`shellTrade*` localStorage and strips itself from the URL so a device can replay the true first-run. No effect on normal players.

Any of the three can be reverted on request.

---

## 6 · Fixes — RESOLVED (approved 2026-07-02, implemented build 217)

### Fix A (Vio-1) — DECIDED: Option A1
Replays keep lesson-skip. The Golden Rule's intent ("never test the *untaught*") is satisfied because teaching persists; `?fresh=1` is the canonical true-first-run playtest path (see the Beginner-Mode Testing Rule). No code change.

### Fix B (Vio-2) — IMPLEMENTED (build 217): "Notebook persists, fights re-earnable"
Two-set model:
- **`bossesEverBeaten`** (NEW, persisted in `cq_bosses_v1`) drives KNOWLEDGE + PRESENTATION: Notebook visibility (`preNotebook`), Lost Wisdom readability (`canRead`) + hint pulse, the Guardians bestiary, Trading Glasses, concept tiers from boss wins, profile Guardian count, Daily-Drill unlock, journal mentions, and the ONCE-EVER unlock cinematics (Journal + Glasses cinematics and their "UNLOCKED" victory-card notes are gated by `bfState._firstEverKill`).
- **`bossesDone`** (unchanged, session-only) keeps driving the RUN: every Guardian must be re-fought each run (intermission gate), victory pips, early-game pacing heuristics.
- `?fresh=1` wipes `cq_bosses_v1` with the rest — beginner-mode testing unaffected.
- Verified live: seeded `cq_bosses_v1=[0]` → reload → Notebook visible at boot, page collection reads "LOST CHAPTER FOUND", session fight-set empty (Gambler re-fight required), Glasses still locked at 1 boss.

### Fix C — no action (already shipped in 214, see §5).

---

## 7 · Verification evidence collected during this audit

- Fresh boot with cleared storage → intro cinematic renders, `introFlow.active = true` (screenshot in session transcript).
- `?fresh=1` → all `cq_*`/`shellTrade*` keys wiped, URL param self-strips, cinematic boots.
- Organic setup → banner → portal → ticket → trade opened and resolved in-browser; drive-candle bodies measured post-fix: minimum observed main-step body 27 units (one 0-unit doji at the snap candle — the tag candle, acceptable), no flat runs.
- Lost Wisdom trade gate: no page spawned while `trade` was live across the full test run.
- Both files: 4 script blocks syntax-clean, no cross-block redeclarations (only the known-legal `hexA`), divergence exactly the 5 known block-2 hunks.

---

*Audit performed against chart-quest.html (canonical) build 214. Line references are approximate (single-file build; lines shift between builds). Companion docs: `CHARTQUEST_L1_L2_CURRICULUM_AUDIT_v82.md`, `PHASE_2_MASTERY_GATES_v98.md`, `docs/lesson-teach-order.md`.*
