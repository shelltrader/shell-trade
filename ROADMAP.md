# 90-Day Implementation Roadmap — Shell Trade

> Execution-ordered roadmap covering both tracks this repository now serves: the game itself, and the content-generation operating system built on top of it (`company-context.md`, `marketing/`, `agents/`, `content-events/`, `automation/`, `content-assets/`). Priority order, per the founding directive: (1) Core game development, (2) Content event system, (3) Content automation, (4) Social media automation, (5) AI-generated content pipeline. Each later priority depends on the one before it actually working — this roadmap sequences accordingly rather than running all five in parallel from day one.

Start date: 2026-06-16. Dates below are relative (Day 1 = today) so the plan stays usable regardless of exactly when each phase actually starts.

---

## Days 1–30: Foundation — Core Game + Event System Groundwork

**Priority 1 work (Core game development) leads this phase; Priority 2 (Content event system) is designed in parallel but not yet wired into live gameplay.**

1. Ship the accounts/membership layer (Supabase email+password, no KYC) — first item on the existing `PROJECT_STATUS.md` roadmap, and a prerequisite for the course-funnel email capture referenced in `company-context.md` monetization assumptions.
2. Continue boss development for Hours 3–8, extending the curriculum past the current Hour 6 ("The Leverage King") roster.
3. Finalize the `content-events/schema.md` field set against the actual in-progress Hour 3–8 bosses — confirm new boss/lesson content maps cleanly onto existing event types before instrumenting any code.
4. Instrument `chart-quest.html` to emit the 10 schema event types client-side at the moment each action completes (no server round-trip required) — start with the highest-signal types first: `boss_defeated`, `level_up`, `risk_management_success`.
5. Stand up the Supabase tables described in `automation/architecture.md` (`content_events`, `content_briefs`, `content_drafts`, `content_assets`, `published_posts`, `performance_snapshots`) with RLS enabled, service-role-only access.
6. Wire event emission to write into `content_events` — validate against real gameplay sessions that emitted events match the schema exactly before building anything downstream.
7. Manually capture 10–15 real clips/screenshots from actual gameplay sessions into `content-assets/clips/` and `content-assets/screenshots/`, with hand-written metadata sidecars — this becomes the test corpus for every agent prompt template before any automation exists.
8. Draft and hand-test the Content Director and Trading Educator prompt templates (`agents/content-director.md`, `agents/trading-educator.md`) against the manually captured event/asset corpus — run them manually (a human pasting into Claude), not yet through n8n.

## Days 31–60: Content Automation — Priority 3

**Priority 2 (event system) reaches production maturity; Priority 3 (content automation) becomes the focus.**

9. Continue Priority 1 work in parallel at a sustainable pace: polish layer (secondary currency "Pearls," Perfect Runs, live events) per the existing `PROJECT_STATUS.md` roadmap — content automation should not stall core game development, it runs alongside it.
10. Hand-test the Script Writer Agent prompt template (`agents/script-writer.md`) against Content-Director-approved, Trading-Educator-validated briefs from Days 1–30 — validate output quality against `marketing/brand-voice.md` before automating.
11. Stand up the first n8n workflow: webhook ingestion from `content_events` → Content Director agent call → Trading Educator agent call, with human-in-the-loop review before anything proceeds further (no auto-publishing yet at this stage).
12. Integrate ElevenLabs for voiceover generation, tested against 3–5 real Script Writer outputs — confirm a consistent voice profile before scaling volume.
13. Build the FFmpeg assembly step (clip + voiceover + on-screen text → platform-ready render) as a standalone script first, then wire it into the n8n workflow.
14. Run the full pipeline (event → brief → script → voiceover → render) end-to-end on 5–10 real events with a human reviewing and manually publishing the output — this is the "automation built, publishing still manual" checkpoint.
15. Review pipeline output quality against `agents/trading-educator.md`'s accuracy bar and `marketing/brand-voice.md`'s tone bar before increasing volume — fix prompt templates here, not after automation scales.

## Days 61–75: Social Media Automation — Priority 4

**Priority 3 is functioning with human review; Priority 4 (social media automation) adds platform-native publishing.**

16. Integrate platform publishing APIs one at a time, in the order of lowest integration friction first: start with whichever of X / TikTok / YouTube / Instagram has the most straightforward API access for the team, rather than strictly following the platform list order.
17. Wire each platform agent (`agents/x-agent.md`, `agents/tiktok-agent.md`, `agents/youtube-agent.md`, `agents/instagram-agent.md`) into the n8n workflow as its publishing API comes online, keeping human approval as a gate before the first auto-publish on each new platform.
18. Stand up the Community Agent (`agents/community-agent.md`) in monitoring-only mode first (reads and digests, no auto-replies) — validate its recurring-theme signal is actually useful before letting it post replies autonomously.
19. Once monitoring is validated, enable Community Agent auto-reply for clearly low-risk, routine interactions only, with the documented escalation rules (hostile/ambiguous/billing-adjacent → human) enforced from day one, not added later.
20. Remove the human-approval gate on publishing for platforms with at least two weeks of clean, on-brand automated output — gate removal is per-platform and earned, not a single global switch.

## Days 76–90: AI-Generated Content Pipeline at Scale — Priority 5

**Priorities 1–4 are operating; Priority 5 closes the loop and scales volume.**

21. Stand up the Analytics Agent (`agents/analytics-agent.md`) against real published-post performance data accumulated since Day 61 — first output should be the weekly per-platform/per-pillar digest, reviewed by a human before it starts directly informing Content Director triage.
22. Close the feedback loop: route Analytics Agent's "what's working" signal and Community Agent's recurring-theme signal into the Content Director's triage prompt automatically, rather than a human relaying it manually.
23. Increase event-type coverage to all 10 schema types in production emission (if not already complete) — by this point `boss_defeated`, `level_up`, and `risk_management_success` should be fully automated; extend the same rigor to `trade_win`, `trade_loss`, `lesson_completed`, `achievement_unlocked`, `pattern_identified`, `boss_encounter`, and `risk_management_failure`.
24. Begin design work (not implementation — see `automation/auto-clipping.md` status note) for the auto-clipping system, informed by 90 days of real data on which manually-captured clip types actually performed well — this is the right time to start that design, not before.
25. Conduct a full pipeline retrospective: review output volume, brand-voice/accuracy adherence rate, publishing cadence adherence against `marketing/social-strategy.md` targets per platform, and the funnel signal (account signups, course-funnel email capture) tied back to content activity — use this to set the next 90-day plan rather than assuming the current architecture is final.

---

## Sequencing Principles

- **Never automate publishing before the editorial judgment behind it has been validated by a human** — every new automation step earns its way to autonomy by demonstrating quality first, per the gate-removal logic in Days 61–75.
- **Core game development never fully pauses** for content-system work — Priority 1 continues at a sustainable pace throughout, since the content pipeline has nothing to run on without new gameplay, bosses, and lessons to draw from.
- **Each priority is a prerequisite for the next, not a phase that fully completes before the next starts** — event system groundwork begins in Days 1–30 even though content automation doesn't start until Days 31–60, and so on.
