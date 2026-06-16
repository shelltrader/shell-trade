# Content Automation Architecture — Shell Trade

> The complete workflow turning a gameplay moment into a published post, end to end: Game Event → Content Database → Content Director Agent → Platform Agents → Voice Generation → Video Creation → Publishing. This document is the engineering counterpart to `agents/README.md` (which describes agent responsibilities) and `content-events/schema.md` (which describes the data contract at the top of the pipeline).

## Pipeline Overview

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│  Game Event   │────▶│ Content Database │────▶│ Content Director    │────▶│ Trading Educator │
│ (chart-quest  │     │ (events + assets │     │ Agent (triage)      │     │ Agent (validate) │
│  .html emits) │     │  + calendar)     │     └──────────┬──────────┘     └────────┬─────────┘
└──────────────┘     └──────────────────┘                │                          │
                                                            ▼                          │
                                                   ┌────────────────┐                  │
                                                   │ Script Writer   │◀─────────────────┘
                                                   │ Agent (drafts)  │
                                                   └────────┬────────┘
                                                            ▼
                              ┌─────────────────────────────────────────────────┐
                              │       Platform Agents (X / TikTok / YouTube /     │
                              │       Instagram) — adapt draft to platform        │
                              └───────────────────────┬───────────────────────────┘
                                                        ▼
                                          ┌─────────────────────────┐
                                          │   Voice Generation        │
                                          │   (ElevenLabs)             │
                                          └────────────┬─────────────┘
                                                        ▼
                                          ┌─────────────────────────┐
                                          │   Video Creation           │
                                          │   (FFmpeg assembly)         │
                                          └────────────┬─────────────┘
                                                        ▼
                                          ┌─────────────────────────┐
                                          │   Publishing                │
                                          │   (n8n-orchestrated)         │
                                          └────────────┬─────────────┘
                                                        ▼
                                  ┌────────────────────────────────────────┐
                                  │ Community Agent (monitor) + Analytics   │
                                  │ Agent (measure) → feed back to Director │
                                  └──────────────────────────────────────────┘
```

## GitHub Structure

This repository already hosts the game and now hosts the company/content operating system in the same place — single source of truth, single deploy pipeline, no separate "marketing repo" to keep in sync. Recommended structure (current and target state):

```
/chart-quest.html              # the game (existing)
/company-context.md            # business OS (this build)
/marketing/                    # content OS — voice, pillars, platform strategy
/agents/                       # agent specs — purpose/inputs/outputs/prompts/metrics
/content-events/               # event schema (the data contract between game and pipeline)
/automation/                   # this document + auto-clipping spec + (future) actual automation code
/content-assets/               # generated clips, screenshots, voiceovers, scripts, exports, metadata
/ROADMAP.md                    # 90-day execution plan
```

As the automation moves from documented architecture to running code, add (not yet present, planned):

```
/automation/
  architecture.md              # this file
  auto-clipping.md             # Phase 6 spec
  workflows/                   # n8n workflow exports (JSON), one per pipeline stage
  scripts/                     # FFmpeg assembly scripts, event-ingestion webhook handler
  prompts/                     # versioned prompt templates pulled from agents/*.md, kept in sync
```

Game changes (new bosses, new Hours, new factions) and content-OS changes ship through the same PR/commit flow already established for the game (per `PROJECT_STATUS.md` conventions) — content-event schema changes should be reviewed with the same care as gameplay changes, since every downstream agent depends on the contract staying stable.

## Database Structure

A lightweight relational structure is sufficient — this is a content pipeline, not a high-throughput trading system. Recommended (Supabase, reusing the project already in place for accounts/journal per `PROJECT_STATUS.md`'s roadmap, ref `ymxppzhczvmiuoncuqqu`):

- **`content_events`** — one row per emitted event, full JSON payload per `content-events/schema.md`, plus `processed_status` (`new` / `triaged` / `rejected` / `in_production` / `published`) and `significance_score`.
- **`content_briefs`** — Content Director output: `event_id` (FK), `pillar`, `platforms` (array), `urgency`, `angle`, `status`.
- **`content_drafts`** — Script Writer output: `brief_id` (FK), `master_script`, `adaptation_notes`, `teaching_note`.
- **`content_assets`** — pointers into `content-assets/` storage (or its production equivalent — see Storage Systems below): `draft_id` (FK), `asset_type` (clip/screenshot/voiceover/render), `storage_path`, `platform_variant`.
- **`published_posts`** — one row per live post: `asset_id` (FK), `platform`, `post_url`, `published_at`.
- **`performance_snapshots`** — Analytics Agent input/output: `post_id` (FK), `captured_at`, per-platform metric JSON.

RLS should be enabled on all of these tables consistent with the rest of the Supabase project's security posture (per `SECURITY_AUDIT.md` conventions) — this pipeline has no end-user-facing read/write surface, so default-deny with service-role-only access is appropriate.

## APIs

- **Claude / ChatGPT** — power the Content Director, Trading Educator, Script Writer, and all four platform agents (text generation/decisioning steps). Claude is prioritized for tasks requiring adherence to detailed brand-voice/accuracy constraints (the bulk of this pipeline); ChatGPT can serve as a secondary/fallback model or for specific platform-voice experimentation.
- **ElevenLabs** — voice generation for any script that calls for narration (TikTok/Shorts voiceover, YouTube long-form narration). Should use a single consistent voice profile so "Shell's voice" (when narration is presented as the character) stays recognizable across platforms.
- **Platform publishing APIs** — X API, TikTok Content Posting API, YouTube Data API, Instagram Graph API. Each platform agent's "publish" step should call the relevant API directly rather than relying on manual upload, once volume justifies the integration effort (see `ROADMAP.md` for sequencing — manual publishing is an acceptable starting point).
- **Binance market data** — already integrated into the game (`fetchMarketData()`) for live faction pricing; no additional integration needed for the content pipeline itself, though Market Education content can reference the same live data source for accuracy.

## Storage Systems

- **`content-assets/`** in this repository is the canonical structure and naming convention (see `content-assets/README.md`) and is appropriate for early volume.
- **As volume grows**, raw video/audio assets (clips, renders, voiceovers) should move to object storage (e.g., a Supabase Storage bucket or S3-compatible bucket) rather than living as binary files in git — git should retain the metadata/scripts/READMEs, not large media binaries. This is a "when it hurts" migration, not a day-one requirement.
- **Metadata always stays structured and queryable** (in `content_assets`/`published_posts` tables), regardless of where the underlying binary lives — the database is the index, the bucket is the shelf.

## Automation Tools — Priority Order

1. **Claude** — primary reasoning/writing engine for every agent in `/agents/`. Prioritized first because brand-voice and accuracy adherence (the two hardest constraints in this pipeline) are best served by careful instruction-following.
2. **GitHub** — single source of truth for all documentation, prompts, and (eventually) automation code; also the existing deployment mechanism for the game itself, so the content OS inherits a workflow the team already trusts.
3. **n8n** — orchestration layer connecting every stage: webhook ingestion of game events, agent-call nodes (Claude/ChatGPT), conditional routing (Content Director's triage outcome determines the next node), ElevenLabs/FFmpeg calls, and publishing-API calls. Chosen over a fully custom orchestration service because it's visual, inspectable, and fast to modify as the pipeline evolves — important while the architecture is still young.
4. **ElevenLabs** — voice generation, as above.
5. **FFmpeg** — video assembly: combining gameplay clips/screenshots, voiceover audio, on-screen text overlays, and platform-specific aspect-ratio/length formatting into final renders. Run as a scripted step inside an n8n workflow or a dedicated worker process.
6. **ChatGPT** — secondary text-generation engine, used where useful for redundancy or specific creative experimentation, per the API section above.

## Recommended Build Sequence

This architecture is intentionally documented in full before any of it is wired into running automation — see `ROADMAP.md` for exactly when each piece gets built relative to core game development. Building the database and event-emission first, then validating the Content Director's triage quality manually (a human reviewing Claude's briefs before any auto-publishing exists), is the safest order: it derisks the most subjective part of the pipeline (editorial judgment) before any irreversible action (publishing) is automated.
