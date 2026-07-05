# Development Health Report

**Status:** Point-in-time (2026-07-04, build 250). The honest state of the codebase from a Technical Director's chair.

---

## 1. Biggest architectural risks

1. **The monolith.** One 20,600-line HTML file, **810 functions**, 4 inline `<script>` blocks, no modules. Every change loads/edits the whole thing; cross-block scope collisions crash silently (the build-202 trap). This is the root cause of most other risks — velocity drops as the file grows.
2. **Doc↔code drift.** The Finn Character Bible names a renderer (`drawTurtle`) that no longer ships. Canon that lies is worse than no canon. (This folder is the fix, but the pattern will recur without discipline.)
3. **Deprecated code stays live.** The rig, walk-sheet, legacy boss object, dormant quiz canvas, and prototype flow-reads all still parse and load. Anything reachable gets reached.
4. **Single-loop fragility.** A throw in `frame()`/`update()` freezes the entire game (observed this session). No error boundary around the loop.
5. **Fragile first-impression path.** The 32-second video-gated intro can strand a new player on a black screen — the highest-stakes 30 seconds in the product, and the most brittle.

## 2. Most duplicated systems
1. **Finn walk** — 3 renderers + 3 asset sets + a 4th "canon" renderer in docs. (Critical; see [duplicate_report.md](duplicate_report.md) C1/C2.)
2. **Finn drawing generally** — 5 functions draw Finn (`drawFinnSprite`, `drawTurtle`, `drawHeroFinn`, `drawTurtleFalling`, `finnIconHTML`).
3. **The game file** — source + mirror + stale obfuscated build.
4. **Audio infra** — 2 separate `AudioContext`s.
5. **`drawShell`** — two same-named functions.

## 3. Most dangerous files / regions
| Rank | File / region | Danger |
|---|---|---|
| 1 | `chart-quest.html` → `drawFinnSprite` frame-select (13760–13985) | Most-churned, deprecated branches lurking, has already caused an art regression + upset founder |
| 2 | `chart-quest.html` → `frame()`/`update()` (13034, ~18590) | One throw = whole-game freeze; movement+camera+world coupled |
| 3 | `chart-quest.html` → input handlers (3935–4103) | Canvas/DOM tap boundary; break it and mobile dies |
| 4 | `index.html` | Deployed mirror; hand-editing it silently forks the build |
| 5 | `chart-quest.min.html` | Stale obfuscated build; could ship old code if the deploy path uses it |
| 6 | `deploy.zip` (137 MB) tracked in-tree | Accidental commits balloon the repo; a `git add -A` disaster waiting |

## 4. Most likely future regression points
1. **Finn art** — a future "leg/animation" request re-touching the 5 render paths. (Now guarded by [finn_canon.md](finn_canon.md).)
2. **Movement `CFG` tuning** bleeding into chart density / setup reach (shared config).
3. **Lesson/teach-order** edits testing an untaught concept via `conceptTier`.
4. **Boss work** reading the deprecated `rounds/bossHP` object.
5. **Deploy** shipping the stale `min.html` or an un-mirrored `index.html`.
6. **Commits** sweeping in `deploy.zip` / Swift / website changes via `git add -A`.

## 5. Maintainability score

### **5.0 / 10**

**Why not lower:** the game *works*, ships, and is heavily commented with build-history rationale (rare and valuable). It has real anti-softlock safety nets, versioned saves, an offline stub, and — now — a canon layer. The founder's instincts and documentation habit are strong.

**Why not higher:** a 20k-line, 810-function single file with no modules, live deprecated code, doc↔code drift, five ways to draw the main character, and a 137 MB binary in-tree. Development velocity is *already* decreasing (the stated symptom), and the recent Finn saga (builds 248→250) is a textbook example of the cost.

### What would move the score (future work, NOT this pass)
| Action | Δ | Effort |
|---|---|---|
| Delete deprecated Finn assets + rig/walk-sheet code paths (after this canon lands) | +0.5 | S |
| Wrap `frame()` in a try/catch that keeps the loop alive + logs | +0.5 | S |
| Remove `deploy.zip` from the tree; `.gitignore` it | +0.5 | S |
| Split `chart-quest.html` into a few `<script src>` modules (or a small build step) | +1.5 | L |
| Make `index.html`/`min.html` build-only (never source) | +0.5 | S |
| Retire the legacy boss object + dormant quiz canvas + prototype | +0.5 | S |

Estimated reachable score after the small (S) items alone: **~6.5–7.0** — most of the gain is low-effort, because the problems are *structural clarity*, not deep bugs.

---

## Director's one-paragraph verdict
ChartQuest is a **good game trapped in a hard-to-maintain container.** The content, feel, and instincts are strong; the container (one giant file, live deprecated code, duplicated character systems, doc drift) is what's slowing you down and causing regressions. The single highest-leverage move is the one this pass just made: **lock the canon, freeze the protected systems, and make every future task read them first.** After that, the highest-value *code* work is small and structural — delete the deprecated Finn paths, guard the game loop, and get the 137 MB binary out of the tree. Do not refactor the monolith under launch pressure; do it deliberately, post-launch, one module at a time.
