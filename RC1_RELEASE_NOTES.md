# ChartQuest RC1 — Release Notes (build 262)

**Release:** RC1 / build 262 · **Date:** 2026-07-14 · **Tag:** `v0.1.1-rc1` · **Commit:** `9c4e490`
**Purpose:** first external beta (10 friends). Stabilization sprint — no gameplay redesign.

---

## Stage 5 · What changed (and why it raises feedback quality)

### Phase B — deployed the correct game
- **Game promoted from build 254 → 262.** Production was serving **build 254**, whose L1–3 trades
  resolve the old way (the coin-flip-era feel the founder rejected). Friends would have hit a
  *random early-trade loss* — the exact thing that makes a beginner quit. RC1 ships the **authored
  fair-trade confidence phase**: L1 all wins, L2's second trade is one telegraphed, stop-protected
  First Loss followed by a guaranteed recovery win, L3 wins. `authoredTutorialOutcome` present (×4).
- FINN_V3 renderer is present but **dormant** (nothing branches on the flag; weight-model reverted
  to build-259 movement; includes the dt-clamp crash fix). Verified: no console errors, Finn's real
  sprites load (`FINN_SPRITES.ready`), canvas fills the viewport.

### Phase C — critical beta blockers removed
- **C1 · Guest progress now persists.** `player {shells, level, xp, xpNeeded}` was cloud-only
  (needed a signed-in session), so a **guest reset to Level 1 + 5 shells on every reload** — the
  biggest silent retention leak, since most friends play as guest. Now mirrored to
  `localStorage['cq_player_v1']` with a `pagehide`/`visibilitychange` safety net. Cloud stays
  authoritative on sign-in. **Verified:** set 137 shells / level 4 → reload → survived; `?fresh=1`
  still wipes it (beginner-test stays clean).
- **C2 · Cold-open no longer black-screens.** `#mmVideo` (12 MB) fades in from `opacity:0`, so the
  first seconds were pure black. Now `#mmTeaser`'s base layer is a **real cinematic frame**
  (`mm-poster.jpg`, extracted from the intro, preloaded with `fetchpriority=high`). The video fades
  in on top and lines up; if it never loads, the poster stays. **Verified:** poster renders instead
  of the black screen build 261 showed.

### Phase D — instrumentation (this beta is a research experiment)
- **Telemetry ON by default.** ChartQuest already had a production-grade, cloud-backed capture
  system (`ContentLog` → durable queue → `ingest` Edge Function, **anon-keyed so guests capture
  too**, retry/backoff, `pagehide` flush) — but it was **OFF unless enabled from the admin Dashboard**,
  so remote friends recorded nothing. Now ON by default (`cq_content_enabled !== '0'`); the Dashboard
  can still disable it.
- **Added funnel milestones:** `session_start` (device / viewport / dpr / guest-vs-account / build /
  standalone) and `reached_first_trade`, alongside the existing `trade_win` / `trade_loss` /
  `boss_encounter` / `boss_defeated` / `boss_failed` / `level_up` / `lesson_completed` events.
- **Backend verified:** `ingest` function ACTIVE (`verify_jwt:true`, passes with the anon key);
  `content_events` table live with 433 rows from prior sessions (pipeline proven end-to-end).

### What the funnel now answers
| Beta question | Signal |
|---|---|
| Who played, on what, guest or account? | `session_start` |
| Can beginners **reach** the first trade? | `session_start` present, `reached_first_trade` absent = lost in the traversal wall |
| Did the first trade **complete**, win or lose? | `trade_win` / `trade_loss` |
| Do they continue after Boss 1? | `boss_defeated` (Guardian 1) → later events |
| Where did they quit? | last event per `session_id` |
| Session length | last − first event timestamp per `session_id` |

---

## Rollback

- **Anchor:** tag `rollback-pre-rc1` = `19c4085` (the last-good pre-RC1 prod, game 254).
- **Fastest:** Cloudflare → `chartquest` → Deployments → **Rollback** (atomic).
- **Git:** `git push origin rollback-pre-rc1:main --force-with-lease`.
- Granular: `e470347` is the build-261 base (fair trade, before the C/D stabilization).

---

## Deploy provenance
- Verified on **preview** (`site-rc1.chartquest.pages.dev`) then promoted to **production** via
  fast-forward. The deploy diff is **game + poster + gate only** — no `dashboard.html`,
  `.claude/launch.json`, `ChartQuestQA/`, stray `hero.png`, or docs. Release gate: **10 pass / 0 fail**
  (one approved protected change: the new `cq_firstloss` save key).
- Corrected two earlier-report errors: the mirrors were build **259** (not 254), and the game loads
  the tracked `finn/hero.png` (graceful) — the untracked root `hero.png` is stray clutter, **not** a
  dependency. There was **no** hero.png landmine.
