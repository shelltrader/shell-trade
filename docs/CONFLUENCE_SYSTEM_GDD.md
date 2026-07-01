# Chart Quest — Confluence System
## Game Design Document & Implementation Roadmap (for approval — no code yet)

---

## 0. Philosophy check

The mission is **"Learn How To Trade Through Gaming."** The single most important *mental* habit of a real trader is **stacking confluence** — not "I saw one signal," but "I have five reasons." Chart Quest already teaches the individual concepts (Trend, Structure, BOS, CHOCH, S/R, Liquidity, Order Blocks, VWAP, SL, Position Sizing, R:R, Trade Management, MTF) in isolation through lessons, mini-games, and bosses. **What it does not yet teach is how those concepts combine into a decision.** The Confluence System is the connective tissue that turns a collection of taught concepts into a trader's thinking process.

Every feature below is checked against the 10 design rules; none add indicators, inventory, skill trees, equipment, or MMORPG mechanics. The system is built almost entirely by **generalizing systems that already exist.**

---

## 1. What already exists (reuse map)

This is the most important section: ~70% of the work is generalizing current code, not building new systems.

| New feature | Reuses existing system | File anchors |
|---|---|---|
| Confluence Engine | `setupZone` proto-grading: `{type, quality A/B/C, vwapAligned, trendAligned}` computed at setup detection; candle flags `c.bos/c.choch/c.sweep/c.ob`; `trade.rr`, HTF panel state | `showBanner()`/setup detection ~L6090–6145; candle factory ~L1825; `trade.quality` ~L5923 |
| Trade Quality Grades | Existing A/B/C grade already shown in trade panel + journal | trade panel render ~L4334, ~L5861; journal ~L4630, ~L4827 |
| Pre-Trade Checklist | `#tradePanel` / `panelEl` / `#btnConfirm` open flow | markup L650–689; `panelEl.classList.add('open')` ~L3946 |
| Post-Trade Feedback | `resolveTrade()` (has delta, result, quality, setup, rr) + floaters | `resolveTrade()` ~L6125; ContentLog hooks already there |
| Mastery Tracking | Mini-game scores `saveScore()`→`PROGRESS` (`cq_minigames_v1`); REG `category` tags (Structure/Levels/Risk/Execution/Patterns); `lessonProgress`; boss `onRoundDone`; ContentLog event stream | `saveScore` ~L10278; REG ~L10339+; `lessonProgress` ~L3088 |
| Trader Profile | `RANKS`/`rankForLevel`, `player`, journal stats `renderJournalStats()`, ContentLog `stats()` | RANKS ~L1898; journal stats ~L4791 |
| Boss Weaknesses | `BOSS_GAMES` round game-ids per boss, `bfState`, `onRoundDone`, `bossWin` | BOSS_GAMES ~L5527; `onRoundDone` ~L5650 |
| Mastery Levels (tiers) | Parallel to `RANKS` ladder; per-category thresholds | — |
| Scanner Mode | Mini-game generators `REG[id].gen(seed,diff)` already produce charts **with known concept locations** (e.g. `genBOS` returns `ans`, OB returns `obZone`); `ChartView`; daily-drill round/answer UI (`ddState`) | gens ~L10339+; daily drill ~L5128–5191 |
| Journal Integration | `logJournalTrade()`, `tradeRecord`, `journal_trades` (Supabase), `renderJournalList/Section` | `logJournalTrade` ~L3063; `tradeRecord` ~L6209 |

**Key insight:** the game already grades setups A/B/C from VWAP + trend alignment. The Confluence Engine is that exact idea, generalized from 2 factors to ~11, with the values pulled into one config object.

---

## 2. FEATURE 1 — Confluence Engine

### 2.1 Central configuration (single source of truth)
One object, `CONFLUENCE_CONFIG`, holds every factor. Fully editable in one place. Proposed shape (data spec, not code):

```
CONFLUENCE_CONFIG = {
  maxScore: 100,
  factors: {
    trend_alignment:  { points: 20, label: "Trend Alignment",      mastery: "Trend",        phase: "pre"  },
    structure_break:  { points: 20, label: "Structure Break (BOS)", mastery: "Structure",    phase: "pre"  },
    choch:            { points: 15, label: "Change of Character",   mastery: "Structure",    phase: "pre"  },
    support:          { points: 12, label: "Support Reaction",      mastery: "Trend",        phase: "pre"  },
    resistance:       { points: 12, label: "Resistance Reaction",   mastery: "Trend",        phase: "pre"  },
    liquidity_sweep:  { points: 15, label: "Liquidity Sweep",       mastery: "Liquidity",    phase: "pre"  },
    order_block:      { points: 18, label: "Order Block",           mastery: "OrderBlocks",  phase: "pre"  },
    vwap_reaction:    { points: 10, label: "VWAP Reaction",         mastery: "Trend",        phase: "pre"  },
    risk_reward:      { points: 15, label: "Risk:Reward ≥ 2:1",     mastery: "RiskMgmt",     phase: "pre"  },
    htf_alignment:    { points: 20, label: "Higher-TF Alignment",   mastery: "MultiTF",      phase: "pre"  },
    trade_management: { points: 15, label: "Trade Management",      mastery: "TradeMgmt",    phase: "post" } // graded at close
  },
  grades: [ {min:95,g:"A+"}, {min:85,g:"A"}, {min:70,g:"B"}, {min:55,g:"C"}, {min:40,g:"D"}, {min:0,g:"F"} ]
}
```

Notes:
- Raw factor points sum to **>100 on purpose** (a "perfect" textbook setup is rare). The engine **sums detected factors and caps at `maxScore`**, so "5 strong reasons" already reaches A territory — reinforcing the philosophy without requiring all 11.
- `phase: "pre"` factors are evaluated **before entry** (checklist); `phase: "post"` (Trade Management) is evaluated **at close** and folded into the final grade.
- Each factor names its **mastery category**, so detection doubles as a mastery signal.

### 2.2 Factor detection (no new indicators — reads signals the game already produces)
| Factor | Detected from (already in memory at trade time) |
|---|---|
| Trend Alignment | `setupZone.trendAligned` (exists) |
| Structure Break | `setupZone.type==='bos'` or `c.bos` flag near entry |
| CHOCH | `c.choch` flag in the lookback window |
| Support / Resistance | entry within N ticks of a tracked swing level / HTF level |
| Liquidity Sweep | `c.sweep` flag in lookback |
| Order Block | `setupZone.type==='ob'` / `c.ob` flag |
| VWAP Reaction | `setupZone.vwapAligned` (exists) |
| Risk:Reward | `trade.rr >= 2` (exists) |
| HTF Alignment | HTF panel bias vs trade direction (HTF state already tracked) |
| Trade Management | at close: did player trail/partial/respect stop vs. panic-exit? (derive from exit behavior) |

A single function `evaluateConfluence(setupZone, candles, trade, htf)` returns `{score, factors:[{id, hit, points}], grade}`. This **replaces** the current 3-line A/B/C computation at `setupZone.quality`.

**Satisfies rules:** teaches the core trader skill (1), beginner-readable checklist (2), reinforces every existing concept (3), zero indicators (4), one bounded config (5).

---

## 3. FEATURE 2 — Trade Quality Grades

- Numeric `confluenceScore` (0–100) → letter via `CONFLUENCE_CONFIG.grades` (A+/A/B/C/D/F).
- Replaces today's A/B/C. Display everywhere a grade currently shows (trade panel, floaters, journal) using the **existing mini-game result ring** component for the score ring.
- **Outcome-independent by construction** — score comes only from setup factors + management, never from win/loss. This is what enables "won but C-grade."

---

## 4. FEATURE 3 — Pre-Trade Checklist (Trade Validation Screen)

- Inject into the **existing `#tradePanel`** (no new modal). When a setup is tapped, before `CONFIRM TRADE`, the panel shows the live checklist:
  ```
  Trend          ✓
  BOS            ✓
  Liquidity      ✓
  Risk:Reward    ✗
  Higher TF      ✗
  ───────────────
  Confluence  65 / 100   Grade B
  ```
- Two thumb-sized actions: **[Enter Trade Anyway]** and **[Improve Setup]** (closes panel, returns to chart — the game never forces the choice).
- R:R is interactive: the player can already adjust SL/TP; doing so updates the R:R factor live, teaching cause→effect in real time.

**Mobile:** single column, ≥44px rows, score ring top-right, the two buttons pinned to the bottom of the panel.

---

## 5. FEATURE 4 — Educational Feedback (post-trade)

- Hook into `resolveTrade()` (already the close point). After the existing P&L floater, show a compact result card:
  - **Grade** (same ring), **Strengths** (hit factors), **Weaknesses** (missed factors), **Result** (target/stop), and a **process verdict** that contrasts grade vs outcome.
- Verdict copy rules (data-driven templates keyed by grade×outcome):
  - High grade + loss → "Great process. Losses on A-grade setups are variance, not mistakes. Keep taking them."
  - Low grade + win → "This won, but leaned on luck — only 2 of 6 reasons were present. Strong traders wait for more confluence."
- **Process over outcome is enforced**: grade never reads the result; the verdict is the only place the two are compared.

---

## 6. FEATURE 5 — Player Mastery Tracking

### 6.1 Categories (7, mapped to existing concept groups)
`Trend, Structure, Liquidity, OrderBlocks, RiskMgmt, TradeMgmt, MultiTF`
(These map cleanly onto REG mini-game `category` tags + curriculum focus.)

### 6.2 Calculation (EMA, not raw counts — anti-grind, rewards consistency)
Each category score 0–100 is a weighted exponential moving average over its **sources**:

```
mastery_new = mastery_old + α * (signal - mastery_old)
```
Source signals (each normalized 0–100), with suggested source weights:
- Mini-game performance (best score per game in category): **35%**
- Boss round outcomes for that concept: **25%**
- Trade decisions that used the factor well (from confluence evals): **25%**
- Lesson completion for the concept: **15%** (one-time bump, capped)

`α` small (~0.15–0.25) so mastery climbs steadily and reflects sustained skill, not a single lucky run. Identify **weakest category = min(scores)** for the profile and boss targeting.

### 6.3 Persistence
`cq_mastery_v1` (local) + `player_mastery` (cloud) — see §11.

---

## 7. FEATURE 6 — Personal Trader Profile ("Trader Report")

A new scrollable screen (reuse the journal's section/tab pattern — not a new nav paradigm). Shows:
- Rank, Level, **Overall Mastery** (avg of categories)
- **Best Skill / Weakest Skill** (max/min category)
- **Average Trade Grade**, **Best Trade Grade**, **Last 20 grades** (sparkline of letters)
- **Win Rate**, **Average R:R** (already in `renderJournalStats`)
- **Lessons Completed**, **Bosses Defeated** (already tracked)
- A 7-spoke **mastery bar chart** (no radar lib needed; reuse canvas bar drawing already in dashboard tiles).

Data is read, not recomputed live — mastery from `cq_mastery_v1`, grades from journal entries (§10), counts from existing trackers.

**Mobile:** stacked cards, one metric group per card, the mastery chart full-width.

---

## 8. FEATURE 7 — Boss Weaknesses

- Add `weaknesses: [category,…]` to each boss (extends `BOSS_THEME`/`BOSSES`). Themes already align (e.g. Liquidator → RiskMgmt; Structure Shark → Structure; VWAP Phantom → Trend/MultiTF).
- In `onRoundDone()`, scale boss damage by the player's mastery in that round's concept category:
  ```
  damage = base * (1 + masteryBonus)      // masteryBonus = clamp((mastery-50)/100, 0, 0.5)
  ```
  A player who has truly mastered the boss's weakness clears it faster — **mechanically reinforcing that knowledge = power.** Capped at +50% so mastery helps without trivializing.
- Surface it: boss intro card lists "Weakness: Liquidity, Order Blocks" so the player knows what to study to win — turning the boss into a **study objective**, not just a gate.

---

## 9. FEATURE 8 — Mastery Levels (tiers replace future "unlocks")

Per category, derived purely from the mastery score (no new state):
```
0–39 Apprentice · 40–69 Adept · 70–89 Expert · 90–100 Master
```
e.g. "Liquidity: Adept (58)". Displayed on the profile and as a one-line toast when a tier is crossed (reuse the rank-up floater). This is the **progression-without-complexity** lever: it makes the existing concepts feel like a deepening skill ladder.

---

## 10. FEATURE 9 — Scanner Mode (learning tool)

- A relaxed, timer-free mode: "Find 3 BOS examples," "Find 2 Liquidity Sweeps," "Find a CHOCH."
- **Reuses mini-game generators**: `REG[id].gen(seed, diff)` already produces charts whose concept locations are *known* (BOS index, OB zone, sweep candle). Scanner stitches a few generated segments into a scrollable chart, the player taps suspected examples, and answers are validated against the generators' known positions (the same `validate` logic the mini-games use).
- Rewards: XP + Shells (existing economy) + **mastery progress** in the scanned concept's category. Diminishing mastery returns per session (anti-grind).
- Entry point: from the menu / daily area (reuse daily-drill launch pattern). No new HUD.

**Mobile:** horizontal scroll/drag chart, tap-to-mark with a confirmation tick, single "Done" button; fully one-handed.

---

## 11. FEATURE 10 — Journal Integration

Extend the trade record (`tradeRecord` / `logJournalTrade`) and `journal_trades` with:
`confluence_score, trade_grade, concepts_used[], concepts_missing[], educational_feedback`.
- The journal list shows grade + score per entry; the **trade replay** (already exists) gains a "Why this grade" panel listing hit/missed factors and the verdict — turning replays into post-mortems.
- This is mostly free once Features 1–4 exist (they already compute every field).

---

## 12. Implementation aspects (the 10 requested)

**1. Database changes**
- Supabase migration: `alter table journal_trades add confluence_score int, trade_grade text, concepts_used jsonb, concepts_missing jsonb, educational_feedback text;` and new `player_mastery (player_id, category, score, updated_at)` (+ RLS consistent with existing tables). Reuse the migration pattern in `automation/migrations/`.
- localStorage: `cq_mastery_v1`, optional `cq_confluence_config` (override), `cq_scanner_v1`. Journal entries carry the new fields.

**2. New data structures**
- `CONFLUENCE_CONFIG` (§2.1), `MASTERY` (`{category: score}`), `BOSS.weaknesses[]`, `confluenceResult {score, factors[], grade}`, extended journal entry.

**3. UI changes**
- Pre-trade checklist inside `#tradePanel`; post-trade feedback card in the close flow; Trader Profile screen (journal-tab pattern); boss intro "weakness" line; Scanner Mode screen; grade rings reuse the mini-game result ring.

**4. Journal modifications** — §11 (extend record + replay "why graded" panel).

**5. Boss integration** — §8 (weaknesses + mastery-scaled damage in `onRoundDone`, weakness shown on intro).

**6. Mastery calculations** — §6.2 (EMA blend of mini-game/boss/trade/lesson signals; weakest = min).

**7. Trade grading formulas** — §2.1 grade bands; grade = bands(confluenceScore); outcome-independent.

**8. Confluence formulas** — `score = min(maxScore, Σ points of detected pre-factors)`; final grade folds in Trade Management at close.

**9. Progression balancing**
- Weights tuned so a typical early setup with trend+structure ≈ **B**; reaching **A/A+** requires 5–6 stacked factors (the teaching goal). 
- Mastery `α` low so Master tier (90+) takes sustained cross-source performance, not grinding one mini-game.
- Boss damage bonus capped +50%. Scanner mastery gains decay per session.
- Early curriculum hours only expose a few factors (so beginners aren't overwhelmed); the checklist grows as concepts unlock per Hour — **difficulty-curve aware**.

**10. Mobile UX** — single-column checklist, ≥44px targets, bottom-pinned actions, reuse existing letterboxed portrait stage, canvas bar chart (no chart libs), one-handed scanner.

---

## 13. Implementation roadmap (highest → lowest ROI)

> ROI = (trading-skill taught × players reached × retention) ÷ build effort. Each phase ships independently and leaves the game stable.

### PHASE 1 — Confluence core (Features 1, 2, 3, 4 + the Journal fields from 10) — **HIGHEST ROI**
The core trade loop *is* the game; this turns every trade into a confluence lesson and reuses `setupZone` almost wholesale. Effort: **M**. Risk: low (generalizes existing grading). Dependencies: none.
Deliverables: `CONFLUENCE_CONFIG`, `evaluateConfluence()`, pre-trade checklist, post-trade feedback, grade rings, journal fields populated.
*Why first:* every other feature consumes confluence output; nothing ships without this.

### PHASE 2 — Mastery + Trader Profile (Features 5, 6, 8) — **HIGH ROI**
Converts per-trade grades + existing mini-game/lesson/boss data into a long-term progression and a "real trader evaluation." Big retention lever. Effort: **M**. Risk: low–medium (balancing). Depends on Phase 1 (trade signals) + existing score stores.
Deliverables: `MASTERY` model + persistence, mastery tiers, Trader Report screen, weakest-skill surfacing.

### PHASE 3 — Boss Weaknesses (Feature 7) — **MEDIUM-HIGH ROI**
Closes the loop "study the concept → beat the boss faster." Strong motivation to improve weak areas. Effort: **S–M**. Depends on Phase 2 (mastery scores). Risk: balance (damage cap).

### PHASE 4 — Scanner Mode (Feature 9) — **MEDIUM ROI**
Excellent reinforcement + replayable calm content, but it's an additive mode rather than core-loop change, so ROI is lower than the trade-loop work. Effort: **M** (mostly reuses generators). Depends on mastery (to award progress) but can ship standalone for XP/shells first.

### Cross-cutting (ships with Phase 1, finalized in 2): Journal Integration (Feature 10) — rides on Phases 1–2 data; the replay "why graded" panel lands in Phase 2.

---

## 14. Risks, guardrails, and open decisions

- **Overwhelm risk:** 11 factors could intimidate beginners. Mitigation: checklist only shows factors for concepts the player has unlocked that Hour; grows over the curriculum.
- **Balance risk:** confluence weights and mastery `α` need playtest tuning — all in one config for fast iteration.
- **Process-over-outcome integrity:** grade computation must never read win/loss (enforced by separating `evaluateConfluence` from `resolveTrade`'s P&L).
- **Scope discipline:** no factor requires a new indicator; every factor maps to an already-taught concept. Trade Management is the only post-entry factor — confirm we want it in the grade vs. a separate "execution" sub-score.

**Decisions needed before build:**
1. Approve `CONFLUENCE_CONFIG` factor weights (or adjust).
2. Confirm 7 mastery categories (or merge Trend+S/R).
3. Confirm boss-damage bonus model (+50% cap) and whether weaknesses are shown pre-fight.
4. Confirm Scanner rewards (XP/shells now, mastery in Phase 2+) — ship order.
5. Cloud `player_mastery` table now, or localStorage-first then sync?

---

*No code has been written. On approval, Phase 1 begins with `CONFLUENCE_CONFIG` + `evaluateConfluence()` replacing the current `setupZone.quality` computation, then the pre-trade checklist in `#tradePanel`.*
