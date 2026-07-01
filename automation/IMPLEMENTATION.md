# Content Production Engine — Implementation Notes

Status: **built and verified** (headless browser). This document records what is now
running code (vs. the design docs in `content-events/`, `agents/`, `automation/architecture.md`).

## What was implemented

| System | Where | State |
|---|---|---|
| **Event Logger** | `chart-quest.html` → `window.ContentLog` | ✅ live, emits on real gameplay |
| **Special-Events detection + scoring** | `ContentLog.score()` / `detectSpecial()` | ✅ priority/content/virality/educational → significance |
| **Replay capture (descriptors)** | `ContentLog.attachReplay()` (+ trade replay film) | ✅ stored, capped |
| **Content instrumentation (metadata)** | event `payload` + `educational_metadata` + `content_flags` | ✅ schema-conformant |
| **Storage (localStorage ring buffer)** | `cq_content_events_v1`, `cq_content_replays_v1` | ✅ capped 600/50, quota-safe |
| **Content database (Supabase)** | tables `content_events`, `content_replays`, `content_briefs`, `content_exports`, `content_generated` | ✅ created + RLS |
| **Cloud mirror** | `ContentLog.flush()` → REST POST `content_events` | ✅ debounced, fire-and-forget |
| **AI Content Director** | `window.ContentDirector` | ✅ rules-based, AI-swappable interface |
| **Social Agent framework** | `window.SocialAgents` | ✅ interfaces only (no publishing) |
| **Dashboard Content Engine** | `dashboard.html` → Content tab + `Content` module | ✅ Event Log, Special, Briefs, Replays, Search, Export, Instrumentation |
| **Search** | `ContentLog.query()` + dashboard filters | ✅ type/concept/outcome/virality/special/text |
| **Analytics foundation** | `ContentLog.stats()` (byType, topMoments, mostCommon) | ✅ counts + leaders |
| **Export** | `ContentLog.exportPackage()` + dashboard per-platform JSON download | ✅ |

## Data flow

```
gameplay action ──▶ hook ──▶ ContentLog.emit(type,payload,edu)
                               │  ├─ score() → 4 sub-scores + significance
                               │  ├─ detectSpecial() → tags
                               │  ├─ localStorage ring buffer (canonical, instant)
                               │  └─ pending → flush() → Supabase content_events
                               ▼
        Dashboard "Content" tab  ◀── Supabase REST (persistent, cross-device)
                                 ◀── 'cq-content' postMessage bridge (live, same-origin)
                                 │
                                 ├─ Event Log / Special Events / Search
                                 ├─ ContentDirector.review() → briefs (pillar/urgency/angle)
                                 ├─ Replay Manager (descriptors)
                                 └─ Export (per-platform JSON package)
```

## Instrumented event hooks (real game points)

- `resolveTrade()` → `trade_win` / `trade_loss` (+ `risk_management_success` on a defended stop-out), with trade replay film attached.
- `addXP()` → `level_up` (detects rank change).
- `openBoss()` → `boss_encounter` (tracks attempt number).
- `bossWin()` → `boss_defeated` (clean_win, attempts, personal-best).
- `bossLose()` → `boss_failed`.
- MG engine `finish()` → `mini_game_completed` / `mini_game_failed` (+ `pattern_identified` for classify/annotate).
- `markLessonRead()` → `lesson_completed`.

All hooks are wrapped in `try/catch` and guarded by `window.ContentLog` — **logging can never break gameplay**.

## Scoring (computed at emit-time, transparent — no agent needed)

Four 0–100 sub-scores — **priority, content, virality, educational** — blend into
`significance` (0.35/0.30/0.20/0.15). `clip_candidate` = significance ≥ 60 OR any special tag.
Special tags: Perfect Boss Victory, First-Attempt Boss Win, Personal Best, Large Winning Trade,
A-Grade Setup Win, Win Streak, Risk Management Save, Flawless Mini-Game, Educational Milestone, Rank Up.

## Supabase

- Migration: `automation/migrations/0001_content_pipeline.sql` (applied to project `ymxppzhczvmiuoncuqqu`).
- RLS allows anon INSERT + SELECT — acceptable because events carry **no PII** (pseudonymous `player_id` + gameplay facts only). For a stricter posture, route writes through an Edge Function with the service role and drop the anon INSERT policies.
- The dashboard prefers Supabase (persistent / cross-device); if it returns no rows it falls back to the live same-origin bridge so the panel is always functional.

## Extending to true AI (future)

`ContentDirector.review()` is rules-based today but is the exact seam for an LLM: replace
`brief(ev)` with a Claude call that takes the same event JSON + standing context
(`marketing/brand-voice.md`, `marketing/content-pillars.md`) and returns the same brief shape.
The Social Agents (`window.SocialAgents.*`) already expose `adapt(brief, draft)` / `publish()` —
wire `publish()` to each platform API when volume justifies it (`automation/architecture.md`).

## How to use now

1. Open the Dashboard → **Content** tab. The embedded session captures live; the QA tab can also generate events (boss/mini-game launches) which appear here (shared origin).
2. Browse Event Log / Special Events, search, click any event for full instrumentation.
3. **AI Director Briefs** shows triaged content recommendations (pillar, urgency, angle, priority).
4. **Export** downloads a platform-shaped JSON package of the current view (events + briefs).
5. As real players play the deployed game, events persist to Supabase and surface here across sessions/devices.
