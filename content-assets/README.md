# Content Assets — Shell Trade

This directory is the physical/logical home for every media asset the content pipeline produces or consumes — raw gameplay capture, generated voiceovers, scripts, finished renders, and the metadata tying it all back to the game event that caused it to exist. See `content-events/schema.md` for the events that originate this content and `automation/architecture.md` for how assets move through the pipeline.

## Subfolders

- **`clips/`** — raw and lightly-processed gameplay video clips, primarily produced by the auto-clipping system (`automation/auto-clipping.md`) once built, manually captured in the meantime.
- **`screenshots/`** — still frames captured at significant moments (boss defeats, rank-ups, achievements).
- **`voiceovers/`** — generated narration audio (ElevenLabs output) keyed to a specific script.
- **`scripts/`** — Script Writer Agent output: master scripts and per-platform adaptation notes, kept as text/markdown so they're diffable and reviewable in git like any other content in this repo.
- **`exports/`** — finished, platform-ready renders (the FFmpeg-assembled output that actually gets uploaded to a platform).
- **`metadata/`** — JSON sidecar files linking every asset above back to its originating `event_id` and `educational_metadata`, per `content-events/schema.md`.

## Naming Convention

All assets should be named to make their lineage traceable at a glance:

```
{event_type}_{event_id}_{descriptor}.{ext}

e.g.
boss_defeated_evt8841_liquidator-clean-win.mp4
trade_loss_evt9012_stopped-out-vwap-reject.png
risk_management_success_evt9100_stop-loss-save.json
```

This keeps every asset self-describing even if it's moved out of its subfolder context, and makes it trivial to grep this directory for everything tied to a specific event or event type.

## Lifecycle

1. An event fires in the game (`content-events/schema.md`).
2. Raw capture lands in `clips/` and/or `screenshots/`, with a paired file in `metadata/`.
3. The Script Writer Agent produces a script in `scripts/`, referencing the raw capture.
4. Voice Generation produces a file in `voiceovers/`, referencing the script.
5. Video Creation (FFmpeg) assembles clip + voiceover + on-screen text into a platform-ready render in `exports/`.
6. The relevant platform agent publishes the `exports/` file; the publish confirmation is recorded in the content database (`automation/architecture.md`), not as a file here.

## Storage Note

This folder is appropriate for early volume. As covered in `automation/architecture.md` → Storage Systems, large binary media should migrate to object storage (e.g., a Supabase Storage bucket) once volume makes keeping large binaries in git impractical — the naming convention and metadata structure documented here carry over unchanged to that migration; only the physical storage location changes.
