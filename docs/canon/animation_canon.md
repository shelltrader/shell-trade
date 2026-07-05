# Animation Canon

**Status:** PERMANENT. Defines the official animation systems and forbids the retired ones.

## Official animation systems
| System | Where | Notes |
|---|---|---|
| **Finn sprite frame-select** | `drawFinnSprite` 13760–13985 | Chooses run/jump/vboost/land/shell/dazed by physics state |
| **Static-leg walk + body-rock** | 13936 (build 250) | `run.png`; whole-body rock/squash only, **legs do not animate** |
| **Landing squash** (render-only, impact-scaled) | build 247, in `drawFinnSprite` | Never touches physics |
| **Idle personality** | ~13000, ~13926 | breath, blink, curious-peek, rare chart-egg |
| **Live jetpack flame** `finnLiveFlame` | ~13724 | scales with `flameT` |
| **Boss arena ambient** `BossArena` | 18540 | per-realm particles; `prefers-reduced-motion` aware |
| **Opening cinematic** (`IntroCinematic` + `drawTurtleFalling`) | 17179+ | cinematic only |

## Approved animation contract (from `docs/finn-canon/02-Finn-Animation-Bible.md`)
- Frame timing, nose-up/down eases, apex behavior, ball spin/tuck, dazed wobble are specified there. That Bible is the **design authority**; `drawFinnSprite` is the **implementation of record**.
- Finn's **legs never animate** (baked into `run.png`). Motion/life comes from body-rock, flame, and idle personality.

## Deprecated / retired animation systems — never re-enable
| Retired | Where | Why |
|---|---|---|
| **Procedural 4-leg rig** (`drawFinnRigLeg`/`drawFinnRigTail`, `body.png`+`leg.png`) | 13765/13776 | Legs overlapped/messy; dropped build 250 |
| **Baked walk-sheet** 12-frame cycle | slicing ~13694 | Old art |
| **Landing frame swap** (`landT` → `land` frame squash) | build 237 disabled | Replaced by render-only squash |
| Legacy quiz/recap canvas animation | 5704 | Dormant (`im.phase='redesign'`) |

## Rules
- Animation changes to Finn touch character art indirectly → treat as **protected** ([protected_systems.md](protected_systems.md)).
- Frame pacing uses EMA-smoothed `dt` (build 234) — do not feed raw `rAF` dt into world scroll.
- Verify animation changes **in the browser** (visible preview), never by formula alone — this is a repeatedly-learned lesson (builds 236–242 chased animation symptoms of physics bugs).
