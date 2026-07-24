# ChartQuest RC1 — Deployment Verification Report (Stage 1)

**Date:** 2026-07-14 · **Author:** Release verification pass · **Rule:** nothing changed yet; every line below verified against the live domain, git, and the actual source — not from any prior report.

---

## Corrections to earlier reports (verified wrong)

Two claims in my own earlier `WEEKEND_LAUNCH_PLAN` / `PRODUCTION_READINESS_REPORT` were **incorrect**:

1. **"Deployed game is build 254, source is 261, mirrors are 254."** Half wrong. Production *is* 254,
   source *is* 261, but the **working-tree mirrors (`index.html`, `website/game.html`) are build 259** —
   they already contain the beta-critical gameplay (authored fair trade = 4 hits). The only source→mirror
   gap is `FINN_V3` (present in 261, absent in 259).

2. **"`hero.png` is an untracked landmine that will 404 and fall back to the old turtle."** WRONG. The game
   loads **`finn/hero.png`** (line 13030: `im.src = 'finn/hero.png'`), which is **tracked, committed to
   `origin/main` (`website/finn/hero.png`, 312 KB), and explicitly graceful** ("a hero.png miss never blocks
   gameplay"). The untracked **root `hero.png` / `website/hero.png` (2.97 MB each) are STRAY clutter** —
   a byproduct of `cq.sh site`'s media auto-discovery matching the word "hero.png" in a code *comment* and
   copying the stray root file. They are **not a dependency** and must **not** be committed.

The user was right to say "verify everything yourself."

---

## Verified build state

| Location | Build | Fair trade (`authoredTutorialOutcome`) |
|---|---|---|
| **Production** (`origin/main:website/game.html`, live at `/game`) | **254** | **0 — old coin-flip-era trade** |
| Working-tree mirrors (`index.html`, `website/game.html`) | 259 | 4 ✅ |
| **Source of truth** (`chart-quest.html`) | **261** | 4 ✅ |

**261 vs 259 diff:** identical on `authoredTutorialOutcome` (4), `MIN_TRADE_CANDLES` (6), `bossSkipForNow`
(3), `record_site_visit` (1), `update-progress` (1), `localStorage` (80). The **only** difference is
`FINN_V3` (1 vs 0). Build 261's tag: *"REVERT V3 weight-model: Finn movement restored to build 259."* So
**with the `FINN_V3` flag default-OFF, build 261 plays exactly like 259** — the experimental renderer is
dormant scaffolding, and the problematic weight-model was already reverted.

**Net:** deploying 261 upgrades production from the **rejected coin-flip trade (254)** to the **authored
fair-trade confidence phase**. This is objectively better for the beta's core question ("does the first
trade feel good"). It is the single highest-value action available.

---

## Release gate (`scripts/verify.js`, run against source 261)

**9 pass · 2 fail · 1 skip.** Both fails are *process* gates, not quality:

- ✅ [11] **TES: `MIN_TRADE_CANDLES=30` (≥24) · curriculum order intact · outcomes AUTHORED (no 0.58 coin-flip)** — the trading-fairness gate PASSES.
- ✅ [1–7,9] syntax, lessons, bosses+art, saves, build-tag-incremented (254→261), no large binaries.
- ❌ [8] **`index.html` mirrors source** — fails only because the mirror is 259, not yet re-mirrored to 261. Fixed by `cq.sh mirror`.
- ❌ [10] **Protected systems changed: "Save keys"** — verified the *exact* change: **one new key, `cq_firstloss`** (the one-shot "First Loss shown" flag from the authored-trade work, build 256). Benign, additive, no migration. Safe to approve with `CQ_ALLOW_PROTECTED=1`.

**Conclusion: Build 261 is production-ready.** After `cq.sh mirror` + `cq.sh site`, the gate passes clean
with the one approved protected change.

---

## Critical beta blockers found in source (Phase C targets)

| # | Blocker | Verified how | Beta-critical |
|---|---|---|---|
| C1 | **Guest core progress not persisted.** shells/level/xp/rank push to cloud only (`cloudPushProgress → /functions/v1/update-progress`, needs a session). localStorage saves only faction/maxHour/bosses-beaten/first-loss/first-win/quick-read/music — **not the player object**. A guest resets shells/level/rank on reload. | Read all `localStorage.setItem('cq_*')` sites + the cloud-push functions | **YES** |
| C2 | **Cold-open fragility** — `#mmVideo` has no poster/fallback; first ~15s can black-screen on slow paint. (Canvas cinematic draws independently, which partly mitigates.) | Inspected the teaser markup | YES (first impression) |
| C3 | **Email signup broken** — dev SMTP throttles + Auth Site URL `localhost:3000`. **Guest play bypasses it** (always-available "Play as Guest"). | Auth flow + DB (2 users, 1 unconfirmed) | Mitigated by guest; **founder dashboard toggle** |

## Telemetry (Phase D) — verified gap

Only `record_site_visit` (visit counter) and `update-progress` (cloud save) exist. **No funnel events**
(reached-first-trade, Guardian-1, first-loss, quit-location, session-duration, device). Phase D must build them.

---

## Git / deploy pipeline (verified)

- **Production:** Cloudflare Pages `chartquest`, output dir `website/`, push-to-`main` → prod in ~60s. `origin/main = 19c4085` (the hardened site + game **254**).
- **Rollback anchor for RC1:** `19c4085` (current prod). Cloudflare Deployments→Rollback is atomic; git fallback = push `19c4085:main`.
- **Ship pipeline:** `cq.sh ship` = `mirror` (chart-quest→index.html) + `verify` + `site` (chart-quest→website/game.html + copies `finn/`,`bosses/`, media, `logo.png`, `icon-192.png`; guards `website/finn/run.png`). `set -e` stops on gate FAIL; protected change needs `CQ_ALLOW_PROTECTED=1`.
- **Working-tree files to EXCLUDE from the game commit:** `dashboard.html` (admin, not deployed), `.claude/launch.json`, `ChartQuestQA/*.swift` (separate iOS app), stray `hero.png` + `website/hero.png` (2.97 MB clutter), the `.md` docs.
- **Not yet verified (requires Phase B browser test):** that build 261 *boots cleanly* with `FINN_V3` off (no console errors from the dormant renderer). This is the one open risk and gates the promote.

---

## Verdict

**GO to deploy build 261 as RC1**, contingent on the Phase B browser boot-check passing. It is objectively
better (fair trade), passes all quality gates, has no real asset landmine, and its rollback is ready. Then
fix C1 (guest progress) and C2 (cold-open) — the only two code blockers that would invalidate the beta —
add funnel telemetry, and QA the whole candidate on preview before one clean production promotion.
