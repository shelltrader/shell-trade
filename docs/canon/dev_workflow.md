# Dev Workflow — tooling & preview gotchas

**Status:** PERMANENT. The fast path for building, testing, and previewing ChartQuest. Read this to avoid re-deriving the same tricks every session.

---

## The helper: `scripts/cq.sh`
One command for the repetitive loop (run from repo root):

| Command | Does |
|---|---|
| `scripts/cq.sh check` | syntax-check the inline game `<script>` (`node --check`) |
| `scripts/cq.sh mirror` | `cp chart-quest.html → index.html` + verify identical (the canonical mirror step) |
| `scripts/cq.sh tag` | print the current `BUILD_TAG` |
| `scripts/cq.sh ship` | **check + mirror + tag** — run before every commit |
| `scripts/cq.sh serve [port]` | start the no-cache LAN preview server (default 8795) |
| `scripts/cq.sh qr [port]` | print a scannable LAN QR to the beginner-mode URL (`?fresh=1`) |

Server script: `scripts/serve_nocache.py` (repo-local, stable path, binds `0.0.0.0`, no-cache). The `.claude/launch.json` `chartquest` config points at it, so `preview_start` "chartquest" works every session (the old per-session scratchpad servers went dead each session — that's fixed).

## Standard change loop
1. Edit `chart-quest.html` (the source — never `index.html`).
2. Bump `BUILD_TAG`.
3. `scripts/cq.sh ship` (syntax + mirror + confirm tag).
4. Verify in browser if observable (see below).
5. Run [regression_checklist.md](regression_checklist.md); commit by explicit path.

## Preview gotchas (hard-won — don't re-learn these)
- **The `?fresh=1` intro is a 32 s video that will NOT play in a headless preview** → you land on a black screen with only SKIP. Forcing past it (dispatching the video `ended`, hiding overlays) tends to **desync the game and freeze the rAF loop** (`animT` stops advancing).
- **To render the frozen game:** frame-pump manually — `frame(performance.now())` in a short loop advances `update()`+`draw()` deterministically. (Physics still runs, so the turtle can walk off / spin / go "OFF THE CHART".)
- **To inspect a sprite cleanly (physics-free):** draw it on a **separate overlay `<canvas>`** appended to the page — the game can't redraw over it. This is how to verify Finn art without fighting the loop. (See build 250 verification.)
- **Verify colors/positions with `preview_inspect`**, not screenshots. Verify text/structure with `preview_snapshot`.
- **On-device is mandatory for feel/touch/art** — serve + QR (`scripts/cq.sh serve` then `scripts/cq.sh qr`) and scan on a phone on the same Wi-Fi. Beginner mode is always `?fresh=1`.

## Build & deploy
- `chart-quest.html` = source of truth. `index.html` = plain mirror (kept in sync by `cq.sh mirror`). `chart-quest.min.html` = obfuscated build via `build.js` — **gitignored**, regenerate only for a build task; it is currently not the shipped artifact.
- `deploy.zip` is **gitignored and untracked** (it was a 131 MB blob in-tree). Do not re-add it.

## Fast, allowlisted commands (no permission prompt)
`.claude/settings.local.json` allows the read-only commands used constantly: `git status/diff/log/show/ls-files`, `grep`, `ls`, `wc`, `find`, `node --check`, `qrencode`, `scripts/cq.sh …`, and `curl` to localhost/LAN. Extend this list rather than re-approving the same commands each session.
