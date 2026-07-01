# ChartQuest QA & Design Review Assistant

A native macOS app that turns *"that looks wrong"* into a documented, AI-analyzed, tracked review in **under 10 seconds** — purpose-built for playtesting **ChartQuest**.

Press a hotkey → select a region → annotate (circle, arrow, highlight, type, voice note) → **Analyze** → the review is saved to the Founder's Dashboard and you keep playing.

---

## Features

| Spec area | Status |
|---|---|
| Global capture hotkey (**⌘⇧A**) → region screenshot → auto-saved | ✅ |
| Annotation editor: circle, rectangle, arrow, pencil, highlighter, text, X-marker, eraser | ✅ |
| Move / resize / select annotations, **undo / redo, zoom, pan** | ✅ |
| Annotations stored as **structured data** (tool, coords, size, color, text) | ✅ |
| **Voice notes** — record + auto-transcribe (Apple Speech **and** whisper.cpp, toggle in Settings) | ✅ |
| **Analyze Screenshot** — Claude reviews original + annotated images, annotation metadata, transcript & notes | ✅ |
| Structured AI issues: Title · Severity · Description · Why it matters · Recommended fix · Dev notes | ✅ |
| **Founder's Dashboard** — review cards (ID, date, category, status, priority, thumbnails, AI analysis, dev notes) | ✅ |
| Review history: **Original → Annotated → Resolved** permanent visual trail | ✅ |
| **Mark as Resolved** (upload fix screenshot, linked under same review) | ✅ |
| Search + filter by keyword, category, date, status, priority | ✅ |
| **Playtest Session Reports** (critical/medium/minor, top UX/tutorial/chart problems, next actions) | ✅ |
| Categories: Bug, UI, Tutorial, Chart, Balance, Boss, Dialogue, Art, Progression, Monetization, Other | ✅ |
| Exports: **Markdown, PDF, CSV, JSON** | ✅ |
| Bonus: Quick Notes Mode (**⌘⇧N**), Floating Review Panel, Side-by-side Comparison, Batch Analysis, Daily QA Summary | ✅ |

---

## ⭐ Quick start — one click

You don't need to touch a terminal. In Finder, open the `ChartQuestQA` folder and **double-click `Launch ChartQuest QA.command`**.

- **First time:** it builds the app (~1 minute) and opens it. It will auto-install the small `xcodegen` helper if needed.
- **Every time after:** it opens instantly, and only rebuilds if the code changed.

Then keep it handy: once built, a real **`ChartQuestQA.app`** sits in the folder — drag it to your Dock and click it whenever you work on ChartQuest. (The launcher is the safest way to open it, because it picks up any code changes.)

**One-time requirements the launcher checks for you:**
- **Xcode** (free, App Store) — needed to compile a native Mac app. Open it once after installing.
- **Homebrew** (only if `xcodegen` isn't already installed) — from https://brew.sh.

> If macOS ever says *"unidentified developer"*, right-click `ChartQuestQA.app` → **Open** once. The launcher already strips the quarantine flag, so this is rare.

First launch will ask for **Screen Recording**, **Microphone**, and **Speech Recognition** permission, and you'll paste your **Claude API key** in Settings ▸ AI. After that, press **⌘⇧A** anytime to capture a review.

---

## Tech stack

- **SwiftUI** + **AppKit** (windows, status bar, panels, `screencapture`)
- **SQLite** (C library via a thin Swift wrapper — no ORM)
- **Speech.framework** (Apple on-device) + **whisper.cpp** (local, optional)
- **Anthropic Claude API** (Messages API, vision)
- **Clean Architecture + MVVM** (Domain / Data / Services / Presentation / App)

---

## Architecture

```
Sources/
├── App/                     # Composition root: @main, DI container, status bar, hotkey, windows
│   ├── ChartQuestQAApp.swift, AppController.swift, AppDelegate.swift
│   ├── AppEnvironment.swift  (DI), WindowManager.swift, CaptureCoordinator.swift
│   ├── Info.plist, ChartQuestQA.entitlements
├── Domain/                  # Pure model layer — no UI, no I/O
│   ├── Entities.swift, Enums.swift, Repositories.swift (protocols), AIService.swift (protocols)
├── Data/                    # Implementations of domain protocols
│   ├── Persistence/         # SQLite.swift, Database.swift, *RepositoryImpl.swift
│   ├── Network/             # ClaudeClient.swift, ClaudeAIService.swift, PromptBuilder.swift
│   ├── Speech/              # Transcriber.swift, AppleSpeechTranscriber, WhisperTranscriber, AudioRecorder
│   ├── FileStore/           # FileStore.swift (folder layout + filenames)
│   └── Security/            # KeychainStore.swift (Claude API key)
├── Services/                # HotKeyManager, ScreenshotService, AnnotationRenderer, ExportService, PDFRenderer
├── Presentation/            # SwiftUI + MVVM
│   ├── Annotation/          # Editor view, canvas, view-model
│   ├── Dashboard/           # Dashboard + view-model, review card, detail
│   ├── Session/ Settings/ QuickNote/ Floating/ Comparison/ Components/
└── Support/                 # AppSettings, ColorHex, Constants
```

**Dependency rule:** Presentation → Domain ← Data. The Domain layer defines protocols (`ReviewRepository`, `AIAnalyzing`); Data implements them; the App wires concrete instances into `AppEnvironment` and injects it through the SwiftUI environment.

---

## Requirements

- **macOS 14 (Sonoma)** or later
- **Xcode 15** or later
- **[XcodeGen](https://github.com/yonaskolb/XcodeGen)** — `brew install xcodegen`
- A **Claude API key** (https://console.anthropic.com) — entered in-app, stored in the Keychain
- *(optional)* **whisper.cpp** for offline transcription — `brew install whisper-cpp` + a `ggml-*.bin` model

---

## Build

```bash
cd ChartQuestQA
brew install xcodegen          # one time
xcodegen generate              # creates ChartQuestQA.xcodeproj from project.yml
open ChartQuestQA.xcodeproj
```

In Xcode:
1. Select the **ChartQuestQA** target → **Signing & Capabilities**.
2. Set your **Team** (or choose "Sign to Run Locally" for personal use). The entitlements file is already wired (App Sandbox **off**, Hardened Runtime **on**, audio-input + network-client).
3. Press **⌘R**.

> No XcodeGen? Create a new **macOS App** target (SwiftUI lifecycle, macOS 14), drag the `Sources` folder in, set `Info.plist` and `ChartQuestQA.entitlements` in Build Settings, and link `libsqlite3.tbd`, `Carbon`, `Speech`, `AVFoundation`, `PDFKit`. Everything else is plain Swift.

---

## First-run setup

1. **Permissions** (macOS will prompt; grant in System Settings ▸ Privacy & Security):
   - **Screen Recording** — required for `screencapture` to capture regions.
   - **Microphone** + **Speech Recognition** — required for voice notes.
2. Open **Settings ▸ AI**, paste your **Claude API key** (stored in Keychain only), pick a model (default **Claude Opus 4.8**).
3. *(optional)* **Settings ▸ Voice** — switch the engine to **whisper.cpp** and set the binary + model paths.
4. *(optional)* **Settings ▸ Storage** — choose where the `ChartQuest QA/` data folder lives (default `~/Documents/ChartQuest QA`).

---

## The 10-second workflow

1. Notice an issue while playtesting.
2. Press **⌘⇧A** (works from any app, including the game).
3. Drag to select the region — it's captured and saved instantly.
4. The **annotation editor** opens. Circle / arrow / highlight / type / 🎙 record a note.
5. Click **Analyze Screenshot**.
6. Claude returns prioritized issues; the review auto-saves to the **Dashboard** and the window closes.
7. Keep playing. Repeat.

**Fast path:** **⌘⇧N** (Quick Note) skips the editor — type a note, press **Enter**, done.

### Menu-bar item
The camera icon in the menu bar gives Capture, Quick Note, Dashboard, Floating Panel, Settings, Quit. Closing the dashboard keeps the app running in the menu bar.

---

## Data & database

Everything lives in the data folder (default `~/Documents/ChartQuest QA`):

```
ChartQuest QA/
├── Screenshots/    YYYY-MM-DD_HH-MM-SS_CQ-XXXX.png      (originals)
├── Reviews/        ..._CQ-XXXX_annotated.png / _resolved.png
├── Exports/        markdown / pdf / csv / json
├── Audio/          voice-note recordings (.m4a)
└── chartquest_qa.sqlite
```

The SQLite schema (also in `schema.sql`) has tables: `reviews`, `annotations`, `voice_notes`, `ai_analyses`, `ai_issues`, `sessions`. The app creates it on first launch via `Database.migrate()`. Search is LIKE-based across review fields + AI summary/issues (the optional FTS5 table in `schema.sql` is a documented upgrade path, not required).

---

## Deployment (signed & notarized)

**Automated:** the bundled scripts do the whole pipeline. Set your Team ID in `ExportOptions.plist`, store notary credentials once, then:

```bash
NOTARY_PROFILE=CQ_NOTARY TEAM_ID=ABCDE12345 ./scripts/notarize.sh   # archive → export → notarize → staple
./scripts/make-dmg.sh                                               # → dist/ChartQuestQA.dmg (drag-to-Applications)
```

**Manual equivalent**, for distribution outside your own Mac:

```bash
# 1. Archive
xcodebuild -project ChartQuestQA.xcodeproj -scheme ChartQuestQA \
  -configuration Release -archivePath build/ChartQuestQA.xcarchive archive

# 2. Export with a Developer ID (needs an ExportOptions.plist with method = developer-id)
xcodebuild -exportArchive -archivePath build/ChartQuestQA.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/export

# 3. Notarize (store credentials once with: xcrun notarytool store-credentials)
xcrun notarytool submit build/export/ChartQuestQA.app --keychain-profile "CQ_NOTARY" --wait

# 4. Staple the ticket
xcrun stapler staple build/export/ChartQuestQA.app
```

Then drop the `.app` into a DMG (e.g. `create-dmg`) and ship. Hardened Runtime is already enabled (required for notarization). Because the app is **not** sandboxed it can register the global hotkey and run `screencapture`; if you ever need Mac App Store distribution you'd re-enable the sandbox and replace the Carbon hotkey + CLI capture with sandbox-friendly equivalents.

---

## Notes & constraints

- The Claude API key is stored **only** in the macOS Keychain (`KeychainStore`), never in the DB, UserDefaults, or the repo.
- This codebase was authored and statically verified, but **not compiled in this environment** (no macOS toolchain here). Build it in Xcode on a Mac; if the API surface of any framework has shifted, fixes will be localized and obvious. The architecture, data layer, and prompts are production-shaped.
- Screen-region capture uses the system `screencapture -i` (native crosshair UI) — fast, reliable, and the standard approach for tools like this.
- Annotation geometry is stored in the screenshot's pixel space, so marks render identically at any zoom and flatten pixel-accurately into the annotated PNG.

---

*Slow and steady. Protect the shell. 🐢*
