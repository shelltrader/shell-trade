# metadata/

JSON sidecar files linking every asset in the other `content-assets/` subfolders back to its originating game event. Each sidecar carries, at minimum, `event_id`, `event_type`, `timestamp`, the relevant `educational_metadata` block (per `content-events/schema.md`), and a `media_ref` pointing to its paired clip/screenshot/script/export file.

Naming convention: `{event_type}_{event_id}_{descriptor}.json`, matching the paired media file's name exactly (swap only the extension and folder) — see `content-assets/README.md`. This is what lets every downstream agent (especially the Script Writer, `agents/script-writer.md`) work from real, specific footage and real event facts instead of generic description.
