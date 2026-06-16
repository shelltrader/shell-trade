# Auto-Clipping System (Future) — Shell Trade

> A future system that captures gameplay automatically when a content-worthy moment happens, so the content pipeline (`automation/architecture.md`) never has to wait on a human to notice and manually record a good moment. This document specs the system; it is not yet implemented (see `ROADMAP.md` for sequencing — this is explicitly a Phase 4/5 priority, after the core content-event system and content automation architecture are working with manually-captured footage).

## Why this matters

Right now, any clip that ends up in `content-assets/clips/` has to be captured by someone watching gameplay happen in real time. That doesn't scale, and worse, it means the content pipeline's supply of raw footage is bottlenecked by human attention rather than by how often genuinely good moments occur in the game. The auto-clipping system removes that bottleneck: the game always has the last N seconds of play buffered, and the moment a `content_flags.clip_candidate`-worthy event fires (per `content-events/schema.md`), the buffer gets saved automatically, no human in the loop required.

## Architecture

```
┌────────────────────┐
│  Rolling Replay      │   Continuously overwriting circular buffer of the last
│  Buffer (client-side)│   N seconds of canvas frames + audio, held in memory.
└──────────┬───────────┘
           │ event fires (e.g. boss_defeated, clean_win: true)
           ▼
┌────────────────────┐
│  Trigger Evaluator    │   Checks the event's significance_score / content_flags
│  (client-side)        │   against a threshold. Below threshold → buffer discarded,
└──────────┬───────────┘   nothing saved (most events never produce a clip).
           │ above threshold
           ▼
┌────────────────────┐
│  Clip Extraction       │   Freezes the buffer window around the trigger moment
│  (client-side)         │   (pre-roll + post-roll), encodes to a compact format.
└──────────┬───────────┘
           ▼
┌────────────────────┐
│  Screenshot + Metadata │  Captures a single best-frame still (e.g. the boss-defeat
│  Generation             │  screen) and writes a metadata sidecar file referencing
└──────────┬───────────┘   the originating event_id.
           ▼
┌────────────────────┐
│  Upload / Storage       │  Pushes clip + screenshot + metadata to content-assets/
│                         │  (or its production object-storage equivalent, per
└────────────────────┘   automation/architecture.md Storage Systems section).
```

## Implementation Approach

- **Buffer**: maintain a short rolling window (target 15–20 seconds) of the game canvas as the player plays, using the browser's native screen/canvas capture capabilities (e.g., `MediaRecorder` against a `canvas.captureStream()`), continuously overwriting older frames so memory use stays bounded. This buffer exists whether or not anything ends up being saved — the cost is host-side memory, not network or storage, until a save actually triggers.
- **Trigger evaluation**: reuse the `significance_score` and `content_flags.clip_candidate` fields already defined in `content-events/schema.md` — the auto-clipping system should not invent a second significance heuristic; it should consume the same one the Content Director uses, so "what's clip-worthy" and "what's content-worthy" stay aligned by construction.
- **Pre-roll / post-roll**: most valuable moments (a boss-defeat, a clean win, a stop-loss save) are more legible with a few seconds of buildup before the trigger and a couple seconds of resolution after it — extract a window around the trigger timestamp, not just the instant itself.
- **Encoding**: compress client-side before upload (e.g., to a web-friendly H.264/VP9 container) to keep upload size and storage cost manageable at scale — full-fidelity capture is unnecessary for short-form social repurposing.
- **Screenshot generation**: in addition to the clip, capture a single high-quality still frame at the moment of peak significance (e.g., the exact boss-defeat frame) — stills are needed independently of video for carousels, thumbnails, and Stories.
- **Metadata generation**: every clip/screenshot pair is written alongside a metadata sidecar containing the originating `event_id`, `event_type`, `timestamp`, and the relevant `educational_metadata` from the schema — this is what lets the Script Writer Agent write to real, specific footage instead of generic description (see `agents/script-writer.md` Inputs).
- **Upload path**: batch-upload buffered clips opportunistically (e.g., end of session, or on a background timer) rather than blocking gameplay on an upload — content generation latency of a few minutes is entirely acceptable; gameplay responsiveness is not negotiable.

## Event Triggers

Not every event type should trigger a clip — most are better served by a screenshot, a stat callout, or nothing at all. Recommended default trigger policy (tunable via `significance_score` threshold, not hardcoded per type):

| Event type | Default capture |
|---|---|
| `boss_defeated` (clean win or personal best) | Clip + screenshot |
| `boss_defeated` (routine) | Screenshot only |
| `boss_encounter` (first attempt on a new boss) | Screenshot only (teaser use) |
| `trade_win` (personal best / high streak) | Clip |
| `trade_loss` | Screenshot only (clips rarely needed; the story is usually told in stats, not motion) |
| `level_up` (rank_changed: true) | Screenshot |
| `risk_management_success` (high capital_saved_shells) | Clip |
| `risk_management_failure` | Screenshot only — handled carefully, see brand-voice empathy rule |
| `achievement_unlocked` | Screenshot only |
| `pattern_identified` | No automatic capture (too frequent/low-signal individually; aggregate instead) |

## File Formats

- **Clips**: short-form-ready video, vertical-first (9:16) since portrait is the game's native orientation already (`MAX_ASPECT` lock per `PROJECT_STATUS.md`) and matches TikTok/Reels/Shorts default — no reframing/cropping step needed downstream, which is a meaningful pipeline simplification versus capturing landscape and converting later.
- **Screenshots**: PNG or high-quality JPEG, same native portrait aspect ratio, full resolution (down-sampling can happen per-platform downstream, but the source should stay high-fidelity).
- **Metadata sidecars**: JSON, named to pair predictably with their media file (see `content-assets/metadata/README.md` for the naming convention), containing at minimum `event_id`, `event_type`, `timestamp`, `educational_metadata`, and a `media_ref` pointing to the paired clip/screenshot file.

## Status

Not yet implemented. This document is the spec to build against once the manually-captured-footage version of the content pipeline (Phases 1–5) is proven out — see `ROADMAP.md` for exact sequencing. Building this too early risks over-engineering a capture system before we know, from real manually-curated clips, what actually makes a moment worth clipping.
