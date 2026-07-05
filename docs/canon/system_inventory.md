# Phase 1 — Project Inventory

**Scope:** `chart-quest.html` (the game; all line refs are to it unless noted) + repo assets.
**Legend:** ✅ Active · 🟡 Legacy (leave, don't extend) · ⛔ Deprecated (never reuse) · ♻️ Duplicate · ❓ Unknown

The game is a **single-file monolith**: ~20,600 lines, **810 functions**, 4 inline `<script>` blocks. There is no module system; "systems" below are code regions, not files.

---

## 1. Character Systems
| Component | Where | Status |
|---|---|---|
| Finn sprite renderer `drawFinnSprite` | 13792 | ✅ **Official** (build 250) |
| Finn procedural renderer `drawTurtle` | 13948 | 🟡 Legacy **fallback** (used only if PNGs fail to load) — but the Character Bible wrongly calls it "renderer of record" |
| Hero/victory pose `drawHeroFinn` | 4338 | ✅ Active (menus/win) |
| Cinematic falling turtle `drawTurtleFalling` | 17756 | ✅ Active (opening cinematic only) |
| Finn SVG badge `finnIconHTML` | 2338 | ✅ Active (HTF marker, academy) |
| Boss roster (10 Guardians + Market Maker) | `bosses/` art, boss data in-file | ✅ Active — see [boss_canon.md](boss_canon.md) |
| Deprecated boss roster object | 9206 (`⚠ LEGACY OBJECT`) | ⛔ Deprecated, unused |

## 2. Animation Systems
| Component | Where | Status |
|---|---|---|
| Sprite frame-select (run/jump/vboost/land/shell/dazed) | 13760–13985 | ✅ Official |
| Static-leg walk (`run.png`, body-rock only) | 13936 (build 250) | ✅ Official |
| Procedural leg rig (`body.png`+`leg.png`, 4-leg swing) | `drawFinnRigLeg`/`drawFinnRigTail` 13765/13776 | ⛔ Deprecated (defined but unused; do NOT re-enable) |
| Baked walk-sheet (12 frames from `walk-sheet.png`) | slicing ~13694 | ⛔ Deprecated (old art) |
| Landing squash (render-only) | 247 patch, in `drawFinnSprite` | ✅ Active |
| Idle personality (breath, blink, curious peek, chart egg) | ~13000, ~13926 | ✅ Active |
| Boss arena ambient animation `BossArena` | 18540 | ✅ Active |

## 3. Movement Systems
| Component | Where | Status |
|---|---|---|
| Physics `update(dt)` + `CFG` tunables | 2254 (CFG), ~13034 (update) | ✅ **Single** system (good — no duplication) |
| Coyote time / jump buffer / landing weight | build 247 | ✅ Active |
| Movement verbs: jump/fireJetpack/shellTuck/startSpin | 3881–3960, 12928+ | ✅ Active |
| Input (keyboard + pointer/tap-timer) | 3935–4103 | ✅ Active |
| "Flow Reads" prototype (movement = reading) | 12117 (`PROTOTYPE`) | ❓ Prototype still in file — classify |

## 4. Boss Systems
| Component | Where | Status |
|---|---|---|
| `GuardianTrial` (V2, on live chart) | 9948 | ✅ Official |
| `chartTrial` (wick-swirl trial state) | 10386 | ✅ Active (works with GuardianTrial) |
| `#bossFight` DOM UI + `bfState` | 442 (CSS), in-file | ✅ Active |
| `BossArena` (per-boss animated bg) | 18540 | ✅ Active |
| `triggerIntroBoss` | 16653 | ✅ Active |
| Legacy `rounds`/`bossHP`/`playerHP` object | 9206, 9525 | ⛔ Deprecated (explicitly flagged unused) |

## 5. UI Systems
| Component | Where | Status |
|---|---|---|
| Canvas HUD (ticker, lesson chip, goal bar, price scale) | game loop draw | ✅ Active |
| DOM overlays: auth, `#introSkipCard`, `#bossFight`, journal, daily drill, panels | 1531+ (HTML), handlers | ✅ Active |
| Opening cinematic (video `#mmTeaser` + canvas `IntroCinematic`) | 17179 | ✅ Active — **fragile** (video-gated; see health report) |
| Candle inspector / HTF zoom | 4105+, 4048+ | ✅ Active |
| Legacy hidden canvas | 1501 (`legacy canvas, kept hidden`) | 🟡 Legacy |
| Legacy `emBtn` | 11842 | 🟡 Legacy |
| Dormant quiz/recap canvas | 5704 | ⛔ Deprecated (dormant) |
| `dashboard.html` (Founder Dashboard) | separate 154 KB app | ✅ Active, **separate app** |

## 6. Lesson Systems
| Component | Where | Status |
|---|---|---|
| `LESSONS` data | 4419 | ✅ Official |
| `LESSON_MASTERY` category map | 3714 | ✅ Active |
| `conceptTier(key)` gating | 4870 | ✅ Official (teach-order gate) |
| `teach()` + `lessonQ` | 4931, 4894 | ✅ Active |
| `LessonChart` engine + LEVEL_FLOW | in-file + `lesson-chart-preview.html` | ✅ Active |
| `candleAcademy` greeting | 3449 | ✅ Active |
| Legacy randomised cartoon candles | 2982 | ⛔ Deprecated (superseded by handcrafted scripts) |

## 7. Save Systems
| Component | Where | Status |
|---|---|---|
| `localStorage` `cq_*` keys (~30, many versioned `cq_*_v`) | throughout | ✅ **Primary** persistence |
| Supabase auth (`signInWithPassword`) + offline stub | 1592–1820 | ✅ Active |
| Telemetry: `ContentLog.emit` → `ingest` edge fn → `player_mastery` | 3748, 5287, 10834 + `supabase/functions/ingest/index.ts` | ✅ Active |
| `cq_faction`, `cq_played`, `cq_lesson`, `cq_max`, `cq_flow`, `cq_firstwin_v`, `cq_traded_v`, … | — | ✅ Active (see [progression_canon.md](progression_canon.md)) |

## 8. Monetization Systems
| Component | Where | Status |
|---|---|---|
| Paywall / checkout / subscription | — | ⛔ **NOT IMPLEMENTED** (stub). No Stripe/checkout in code. Memory + audits describe a "BUY below fold + checkout stub." |
| Leverage/shell economy (in-game currency) | leverage/`player.shells` | ✅ Active (gameplay economy, not real money) |

## 9. Audio Systems
| Component | Where | Status |
|---|---|---|
| `GameMusic` (synth soundtrack + stings + `GameMusic.move` SFX) | 18334 | ✅ Official |
| `CineAudio` (cinematic audio) | 18286 | ✅ Active (cinematic only) |
| **2 separate `AudioContext`s** | 18288, 18343 | ♻️ Duplicate infra (both create their own context) |
| Mute toggle (`cq_music`) gates both music + all SFX | 18627 | ✅ Active |

## 10. Visual Effects Systems
| Component | Where | Status |
|---|---|---|
| `floaters`, `tradeFx`, `rings`, `coins` bob, `turtle.trail` | throughout draw | ✅ Active (scattered, no central VFX manager) |
| Live jetpack flame `finnLiveFlame` | ~13724 | ✅ Active |
| Portal glow/spark, boss realm particles (`BossArena`) | 18540 | ✅ Active |
| Cinematic FX (warp, dive, embers) | 17179+ | ✅ Active |
| Legacy unused color tokens (`turtleScute`, `turtleShell shadow` unused) | 2373 | 🟡 Legacy |

---

## Cross-cutting: entry points & apps in this ONE repo
| File / dir | Role | Status |
|---|---|---|
| `chart-quest.html` | **The game — source of truth** | ✅ |
| `index.html` | Plain mirror of the game (deployed) — kept in sync by `cp` / `build.js` | ✅ Active, ♻️ duplicate-by-design |
| `chart-quest.min.html` | Obfuscated build via `build.js` | 🟡 **Stale** (older than source; not currently shipped) |
| `dashboard.html` | Founder Dashboard | ✅ separate app |
| `lesson-chart-preview.html` | Lesson-chart dev harness | ✅ dev tool |
| `website/` | Marketing site (own `sw.js`, `index/game/play/bosses/courses.html`) | ✅ separate deliverable |
| `ChartQuestQA/` | Native macOS Swift QA/capture app | ✅ separate deliverable |
| `privacy.html`, `terms.html` | Legal | ✅ |
| `bosses/`, `finn/`, `content-assets/` | Art/asset stores | ✅ (see [duplicate_report.md](duplicate_report.md) for asset dupes) |
