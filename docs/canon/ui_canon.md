# UI Canon

**Status:** PERMANENT. Screens, overlays, and HUD. Two rendering worlds coexist — respect the boundary.

## The two UI worlds (do not blur them)
1. **Canvas HUD** (drawn each frame inside the game loop): ticker chip, CURRENT LESSON chip, YOUR GOAL bar, price scale, LIVE EDGE line, coach prompts, candle inspector, HTF panel. Tap targets are hit-tested in the pointer handlers (e.g. HTF panel geometry ~4088).
2. **DOM overlays** (HTML elements, z-indexed over the canvas): auth screen, `#introSkipCard` (goal card), `#bossFight`, journal, daily drill, panels, `#mmTeaser` (cinematic video).

**Rule:** a canvas tap and a DOM tap are handled by *different* code. The global `pointerdown/up` handlers must never intercept taps on DOM UI (`e.target !== canvas` → return) — breaking this made buttons dead on mobile before. When adding UI, decide which world it lives in first.

## Official screens / flow
Auth (or Play as Guest) → Opening cinematic (`#mmTeaser` video → `IntroCinematic`) → Goal card (`#introSkipCard`) → Candle Academy greeting → Level 1 gameplay → boss (`#bossFight`) → repeat.

## Approved HUD elements
- Build tag banner (top; dev cache-check — `BUILD_TAG`).
- Bottom control hints (A/D · SPACE · BOOST) and mobile control chips.
- Portal color identity: **purple = lesson, blue = trade, gold/orange = boss** (`PORTAL_COLORS` 3377). This mapping is canon.

## Separate UI apps (not the game HUD)
| App | File | Note |
|---|---|---|
| Founder Dashboard | `dashboard.html` | separate 154 KB app |
| Lesson-chart harness | `lesson-chart-preview.html` | dev tool |
| Marketing site | `website/*.html` | separate deploy |
| Legal | `privacy.html`, `terms.html` | — |

## Deprecated / legacy UI — leave inert, do not extend
| Item | Where | Status |
|---|---|---|
| Legacy hidden canvas | 1501 | 🟡 kept so old refs don't null |
| Legacy `emBtn` | 11842 | 🟡 routed through `closeIntermission` |
| Dormant quiz/recap canvas | 5704 | ⛔ dormant |

## Known fragility (see health report)
- The opening cinematic is **hard-gated on a video** (`Market-maker-cinematic.mp4`, 32 s). If it fails to play, the player can be stranded on black with only SKIP. High-risk first-impression path — do not add more gates in front of first play.

## Rules
- UI is **protected** ([protected_systems.md](protected_systems.md)); do not restyle screens, reorder the flow, or change portal colors without an explicit request.
