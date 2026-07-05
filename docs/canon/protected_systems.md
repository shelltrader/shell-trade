# Protected Systems

**Status:** PERMANENT. These systems are **frozen by default.** Do not modify, restyle, reorder, or "improve" them unless the founder **explicitly requests that specific change**. Approval for one change does not extend to these.

> A task that says "improve movement feel" does NOT authorize touching art, bosses, lessons, or the economy — even if it seems related. Scope stops at the requested system.

## The frozen list

| # | Protected system | What "frozen" means | Where it lives |
|---|---|---|---|
| 1 | **Finn character art & sprites** | No new renderer, no asset swap, no re-enabling the rig/walk-sheet, no palette/proportion change | `finn/run.png` + `drawFinnSprite`; rules in [finn_canon.md](finn_canon.md) |
| 2 | **Boss roster, order & progression** | No adding/removing/reordering bosses, no HP/difficulty change, no re-using the legacy boss object | `GuardianTrial` 9948; `bosses/`; [boss_canon.md](boss_canon.md) |
| 3 | **Lesson order & curriculum** | Never test the untaught; no reordering `LESSONS`/`conceptTier` gates | 4419 / 4870 / 3714; [progression_canon.md](progression_canon.md) |
| 4 | **Core movement model** | Responsiveness edits OK *only* via `CFG` + `drawFinnSprite`; no new verbs, no hover/fuel/flight, no difficulty change | `CFG` 2254 + `update()` 13034; [gameplay_canon.md](gameplay_canon.md) |
| 5 | **Monetization** | Do not add/enable a paywall or checkout (currently a stub) | [progression_canon.md](progression_canon.md) §economy |
| 6 | **Save schema & keys** | No renaming/removing `cq_*` keys; new state uses a versioned `cq_*_v` key | [progression_canon.md](progression_canon.md) |
| 7 | **UI flow & portal colors** | No reordering the auth→cinematic→academy→play flow; purple/blue/gold portal identity is fixed | [ui_canon.md](ui_canon.md) |
| 8 | **The canonical file mirror** | `chart-quest.html` is source; `index.html` is a mirror — never hand-edit `index.html` | [regression_checklist.md](regression_checklist.md) |

## If a change seems to require touching a protected system
1. Stop.
2. State plainly: *"This needs a change to [protected system], which is frozen. Do you want me to change it?"*
3. Proceed only on an explicit yes, and only to the extent granted.

## What is NOT protected (free to change with normal care)
- Dev/debug scaffolding, the build tag, comments, the QR/preview harness.
- Point-in-time audit docs (`docs/*_AUDIT_*.md`).
- Anything explicitly marked Legacy/inert in [system_inventory.md](system_inventory.md) — but only to **remove** it in a dedicated cleanup task, never to extend it.
