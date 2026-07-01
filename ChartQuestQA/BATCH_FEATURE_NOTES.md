# ChartQuestQA — Batch Screenshots + editable transcripts

Added two things. **Not yet compiled** — these were written without an Xcode build (macOS-only frameworks can't compile in the authoring environment), so build once in Xcode / Claude Code before relying on them. `project.yml` globs `Sources/`, so the new files are picked up automatically when the launcher runs `xcodegen generate`.

## 1. Batch Screenshots
Open it three ways: menu-bar item **“Batch Screenshots…”**, **⌘⇧B**, or the **Batch** button in the dashboard toolbar.

- Drag/drop up to **30** images (or **Add Images…**). Each is copied into the store and grouped under one id, e.g. **CQ-0018**.
- Each row has a **Record note** button (reuses the existing recorder + transcriber) and an **editable caption** (keyboard-editable; transcription pre-fills it, you can fix it).
- **Copy to Claude** writes one readable composite PNG per shot (screenshot + caption below it, same trick as the single-review “Copy for Claude”) into `…/Exports/CQ-00NN_batch_<timestamp>/`, drops a `notes.md` + a `.zip`, **and opens that folder in Finder with the PNGs selected** so you select-all and drag them into Claude.
  - The `.zip` is for your archive only — **drag the PNGs, not the zip** (Claude can't read images inside a zip).
- Hitting Copy also saves a one-line summary review (CQ-00NN) to the dashboard so the id is real and the batch is logged.

New files: `Sources/Presentation/Batch/BatchImportView.swift`, `Sources/Services/BatchExporter.swift`, plus `ClipboardComposer.composeCaptioned(...)`.

## 2. Editable voice-note transcripts (app-wide)
- **Annotation editor**: the transcript is now a `TextEditor` (was read-only) — record then edit, or type by hand.
- **Review detail**: new **Voice note / transcript** section with a Save button to fix a transcript after the fact.

## Build & verify
1. Run **`Launch ChartQuest QA.command`** (or `scripts/build.sh`) — it regenerates the project and builds.
2. Smoke test: ⌘⇧B → drag 3–4 screenshots → record/type a note on each → **Copy to Claude** → confirm Finder opens with composite PNGs selected → drag into Claude.
3. Check the transcript `TextEditor` accepts keyboard edits in both the annotation editor and review detail, and that edits persist after save.

## Likely-fine, worth an eye on first build
- SwiftUI `ForEach($items)` binding + `.onDrop(of: [UTType.fileURL])` drop parsing.
- `BatchExporter.makeZip` shells out to `/usr/bin/ditto` — fine here (app sandbox is OFF), best-effort `try?` so failure can't break the export.
- The summary review stores one image (first shot) as `originalPath`; the full set lives in the export folder. If you later want all 30 first-class in the dashboard, that's a data-model change (Review currently holds one image).
