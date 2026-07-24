# ChartQuest — Founder Acceptance Test
## The checklist to run during tomorrow morning's playtest · 2026-07-23

*Play the first hour (Levels 1–3) on a phone-sized window, muted, `?fresh=1&mute=1`. Do not read code. For each item, mark ✅ pass / ❌ fail from what you **see and feel**. Every item names the **subsystem that owns it**, so a ❌ converts subjective disappointment into a reproducible bug routed to the right place. Order roughly follows the playthrough.*

**How to fail an item:** if the observable criterion is not obviously true, mark ❌ and note the screen. The "Owner" column is where the fix lives.

---

### A · Boot & build health
| # | Observable criterion (pass = ✅) | Owner |
|---|---|---|
| A1 | The game boots to the cold-open with **no black frame** and no error toast. | boot / cold-open |
| A2 | Console (if open) shows **no red errors** on load or during play (network/audio warnings are fine). | engine health |
| A3 | The build is **287** (or higher) — check the loaded `BUILD_TAG` reflects Phase 2A. | release |
| A4 | ⚠️ **Known-fail:** the cold-open emotion-ring still reads "**LIOSLANT**" (garbled). Mark ❌ until the art is regenerated. | **cold-open art asset** |

### B · Visual language — one market, one voice *(the whole point of tonight)*
| # | Observable criterion | Owner |
|---|---|---|
| B1 | **Every candle uses the same visual language** — the same green, the same red, a crisp 1px darker edge, a faint top sheen. No screen has an off-hue green or a differently-styled candle. | `window.CQ` / `COLOR` / Constitution |
| B2 | **No candle is a rounded pill or a flat line.** Bodies are sharp rectangles; even small candles have a readable body (or are an explicit grey doji cross). | Constitution / candle floor |
| B3 | The green and red are **always distinguishable in greyscale** (edge inset + sheen position), not by hue alone. | accessibility |
| B4 | The **prediction, replay, journal, and boss** charts look like the **same market** as the world chart — not a different art style. | renderer migration *(NOTE: not yet migrated — expect minor drift here; log which screen)* |

### C · Market behaviour — believable before game-like *(Educational Market DNA)*
| # | Observable criterion | Owner |
|---|---|---|
| C1 | **Charts contain meaningful vertical movement** — no long flat stretch; the market visibly climbs, dips, and climbs. | DNA / rhythm |
| C2 | An **uptrend reads as a staircase** (higher highs / higher lows); a pullback is a **dip that recovers**, not a collapse. | DNA (trend / pullback) |
| C3 | A **big momentum candle forces a boost** — the terrain difficulty follows the market, not the reverse. | DNA (impulse) |
| C4 | A **fakeout / sweep** feels like a *trap you could have read* (the wick pokes, the body fails), not a cheap gotcha. | DNA (fakeout) |
| C5 | **Markets feel believable before they feel game-like** — a real trader glancing over your shoulder would not wince. | DNA (realism) |

### D · Trade honesty
| # | Observable criterion | Owner |
|---|---|---|
| D1 | **No trade remains open after price visibly satisfies its taught exit** (touches the target or the stop). | trade resolver / `CQ.priceTouched` (not yet wired — log if violated) |
| D2 | Price **does not print through the stop line** and keep going while the trade stays open. | trade drive / resolver |
| D3 | The **replay shows the trade that actually happened** — the same candles, resolving where it resolved. | replay / `CQ.normalizeReplay` (not yet wired) |
| D4 | The **stop and target have breathing room** — a normal wiggle doesn't instantly tag the stop; the band never renders as a sliver. | levels / TES |

### E · Platforming feel
| # | Observable criterion | Owner |
|---|---|---|
| E1 | The turtle **regularly uses jumping, boosting, and shell-roll** — and each is triggered *by market structure* (a wall = a boost, a dip = a tuck), not randomly. | platforming / DNA translation |
| E2 | **No jump is impossible** — you are never stranded under a gate or a candle you cannot reach (the build-284 failure must not recur). | platforming / reachability |
| E3 | You **never get stuck / vibrating** between candles; movement feels fluid, not glitchy. | movement feel |
| E4 | Every candle-top you're asked to land on is **wide enough to stand on** (no landing on a sliver narrower than the turtle), on phone too. | DNA (min landing width) / collision inset |

### F · First-hour emotion *(Campaign Bible — the make-or-break)*
| # | Observable criterion | Owner |
|---|---|---|
| F1 | **Wonder before difficulty** — the first ~20 min teach "this water holds me" before any real fear. | pacing / Campaign Bible |
| F2 | **The first win feels like a payoff** — a real punch (camera, shells flying to the wallet, a count-up), clearly *bigger* than a loss, never a slightly-louder loss. | TES / win VFX |
| F3 | **The scare is scary-but-safe** — the dip toward the stop makes you hold your breath, and holding the plan is rewarded. | TES (EP-4 scare) |
| F4 | **The First Loss lands on a *perfect read*** and is framed with **no shame** ("a good read can still lose, and your stop kept it small"). It never feels like the game cheated. | TES / authored First Loss |
| F5 | By the third Guardian you can honestly say **"I can actually read a chart."** | the whole product |

### G · Onboarding clarity
| # | Observable criterion | Owner |
|---|---|---|
| G1 | In the **first 20 seconds** a total beginner knows what to do (move, jump, where to go — the "THIS WAY" compass and control legend are visible). | onboarding / coach hints |
| G2 | **No untaught jargon** appears before it's taught — no "2R", "R:R", "order block" in front of a first-timer. | curriculum / copy |
| G3 | **The controls do what the legend says** — pressing A/D moves, Space jumps, W boosts, from the first beat. | input |
| G4 | Every lesson card is **easy to read and hard to mis-dismiss** — you don't accidentally skip a lesson with a stray tap/Space. | lessons / input |

---

## Scoring
- **Any ❌ in B, D, or E** → a **regression or an unmet Phase-2A promise**; route by the Owner column and reproduce before shipping the beta.
- **Any ❌ in F** → the product's core is not landing; this outranks everything else (defer up to the Campaign Bible).
- **A4 (LIOSLANT)** is a **known ❌** pending an art regen — not a new bug.
- **B4 / D1 / D3** are expected to be **partially unmet** tonight: the palette owner exists but the prediction/replay/boss renderers and the trade-resolution truth are **not yet migrated onto it** (see the Phase-2A certification §3). Log *which* screen drifts — that log becomes the migration work-list.
