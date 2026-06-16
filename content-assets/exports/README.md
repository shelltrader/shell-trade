# exports/

Finished, platform-ready renders — the FFmpeg-assembled output (clip + voiceover + on-screen text + platform-correct aspect ratio/length, per `automation/architecture.md`) that actually gets uploaded to a platform by the relevant platform agent.

Naming convention: `{platform}_{event_type}_{event_id}_{descriptor}.mp4` (platform prefix added at this stage since the same source content may be exported multiple times for different platforms) — see `content-assets/README.md`. Once published, the resulting post URL is recorded in the content database (`automation/architecture.md` → Database Structure → `published_posts`), not as a file here.
