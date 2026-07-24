# FINN V3 — IMPLEMENTATION PLAN
### Phase 10 · Ranked roadmap, effort, risk, regression exposure

**Status:** 🔴 **PROPOSAL — AWAITING APPROVAL. Nothing has been implemented.**
**Companions:** `FINN_RENDERER_V3_ARCHITECTURE.md` · `FINN_ANIMATION_SYSTEM.md`
**Baseline:** build 259 · **Protected system #1 (Finn art/render) is touched by every item.**

**Governing rule:** *if a solution permanently improves Finn, prefer it; if it is merely a temporary workaround, reject it.* Applied literally — this is why bottom-band leg warping and leg-slicing are **not on this plan** despite being cheap.

---

## P0 — Must ship before beta · zero new art · all of it survives into the rigged era

| # | Item | Why it's permanent | Effort | Risk | Files | Regression risk |
|---|---|---|---|---|---|---|
| **0.1** | **V3 core skeleton**: extract `FinnLife` → `FinnRenderer` with the **Asset Provider** abstraction (Monolithic mode), the Doc-3 joint table, and a Pose Solver that *collapses* joints onto the root. | The keystone. Swapping to the rigged provider later needs **zero behaviour rewrite**. | 1.5 d | **Med** | `chart-quest.html` | Low — pure refactor behind a flag |
| **0.2** | **Weight package**: gait **arc** (replaces the sine translate), acceleration-driven **squash/stretch**, **pivot transfer** front↔rear foot, **shear-lag** spring, damped landing recovery, easing everywhere. | The rig inherits every line of it. Fixes the actual complaint. | 2 d | Med | `chart-quest.html` | **Med** — must not alter movement *feel* (coyote 90/buffer 120 are untouched; render-only) |
| **0.3** | **Responsive shadow** — scales with height + squash, opacity ∝ contact. | Ground contact is a permanent requirement of weight. | 2 h | Low | `chart-quest.html` | Low |
| **0.4** | **Character Brain v1** — the 11 canon states + intent vector; deletes `Math.random()` behaviour. | The mind is asset-independent. Lives forever. | 1.5 d | Med | `chart-quest.html` | Low (render-only) |
| **0.5** | **Attention bus v1** — `Finn.notice()`, salience weights, hysteresis, saccade staging. Wire the existing hooks (boss, trade, land, jump). | Same bus will serve website + trailers. | 1 d | Low | `chart-quest.html` | Low |
| **0.6** | **Desync guarantee** — irrational frequency ratios, Poisson beats + refractory, per-instance seeds, amplitude jitter. | Kills the "loop" tell permanently. | 4 h | Low | `chart-quest.html` | Low |
| **0.7** | **Flame v2** — curl-noise turbulence + thrust/pressure coupling + exhaust wake (replaces 3 summed sines). | "Weak flame" is called out in the brief. Code-only, permanent. | 6 h | Low | `chart-quest.html` | Low |
| **0.8** | **Anticipation + follow-through (root)** — counter-move before jump/boost/hop; body settles after the stop. | Core animation law. | 4 h | Low | `chart-quest.html` | Low |

**P0 total ≈ 7 working days.** Expected outcome: **the "moving picture" feel is gone.** Finn has mass, intention, and a non-repeating idle. Legs still do not move.

**P0 acceptance:** (1) 60 s autocorrelation of the root transform has no peak > 0.3 beyond 1 s lag; (2) every motion traces to a state + attention target; (3) frame budget ≤ 0.8 ms; (4) regression gate green; (5) side-by-side at real device scale — founder says it no longer reads as a picture.

---

## P1 — The permanent architecture · requires the 7-piece atlas

| # | Item | Effort | Risk | Files | Regression risk |
|---|---|---|---|---|---|
| **1.1** | **Commission the 7-piece part atlas** (body+compass+sockets · head+neck · 4 legs · pupils), drawn on-model from `content-assets/finn-canon-poses-A/B.png`. Each part must pass the Doc-10 validation checklist. | artist: 3–5 d | **Med** — art fidelity is the whole risk | `finn/parts/` | **Med** — must load **separately** and never gate `FINN_SPRITES.ready` |
| **1.2** | **Rigged Asset Provider** + joint unbinding. Legs draw **behind** the plastron → structurally cannot clip the compass (build 244's failure, fixed by z-order). | 2 d | Med | `chart-quest.html` | Med |
| **1.3** | **Diagonal gait** per Animation Bible §2 — front pair ±step, rear pair counter-phase, feet ±2.2u. **Ship only if it beats static side-by-side** (canon's own gate). | 2 d | **High** — this is the historical failure zone | `chart-quest.html` | **High** — behind a flag; A/B against static; instant rollback |
| **1.4** | **Head/neck articulation** — real turn, tilt, nod, and the neck-crane **Peek**. Overlapping action arrives here. | 1.5 d | Med | `chart-quest.html` | Low |
| **1.5** | **True eye-darts** — pupils saccade independently; the eyes-lead-head law becomes literal. | 1 d | Low | `chart-quest.html` | Low |
| **1.6** | **Secondary dynamics on parts** — compass pendulum, tail follow-through, jetpack shrug. | 1 d | Low | `chart-quest.html` | Low |
| **1.7** | **Unify the website** onto the same Brain via a DOM/canvas provider; retire the divergent CSS system. | 2 d | Med | `website/index.html` | Med — marketing surface |

**P1 total ≈ 11 days + artist.** Outcome: Finn walks, looks, thinks, and stretches his neck. One brain across game, site, trailers.

---

## P2 — Nice to have

| # | Item | Effort | Risk |
|---|---|---|---|
| 2.1 | Jetpack + tail as separate parts (recoil, shrug, whip) | 1 d + art | Low |
| 2.2 | Dust, heat shimmer, exhaust particles v2 | 6 h | Low |
| 2.3 | Expression faces (worried / surprised / a-ha) | art + 1 d | Low |
| 2.4 | **Marketing pose exporter** — drive the rig headlessly to render trailer/social frames | 2 d | Low |
| 2.5 | The 100 idle surprises (Behavior Bible §8) as scheduled behaviours | 2 d | Low |

---

## Art order — and exactly what each piece buys

Commission in this order; each is independently useful.

| Order | Piece | Unlocks | Blocked without it |
|---|---|---|---|
| 1 | **Body + compass + sockets painted** | everything else | the whole rig |
| 2 | **Head + neck stub** | head turn/tilt/nod, neck-crane Peek, overlapping action | 1.4 |
| 3–6 | **4 legs** | diagonal gait, walk/run, landing splay | 1.3 |
| 7 | **Pupils** | true eye-darts, eyes-lead-head | 1.5 |

**Do not commission:** shadow, flame, particles, eyelids, walk-cycle frames. All are code, or superseded by the rig.

---

## Canon amendments required (founder decision, before P1.3 ships)

1. `finn_canon.md`: *"Legs never animate"* → *"Legs never animate **in monolithic mode**. The rigged provider gaits them per Animation Bible §2, **only after proving side-by-side that it beats static.**"*
2. Add `finn/parts/*` to the approved asset list — **loaded separately; must never gate `FINN_SPRITES.ready`** (the reactivation trap).
3. Record that the deprecated `body.png` / `leg.png` / `walk-sheet.png` remain **permanently deleted and gated**. The rig is a new system, not their return.

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Leg gait looks worse than static (builds 244/248/249) | **High** | Feature flag `FINN_V3_GAIT`; mandatory side-by-side at device scale; canon's own "must beat static" gate; instant rollback |
| Part art drifts off-model | High | Every piece passes Doc-10 checklist; authored from the canonical source sheets |
| Movement *feel* changes | High | Render-only. `CFG`, coyote 90 ms, buffer 120 ms, hitbox 36×24 untouched. Feel Patch V1 constants frozen |
| Perf regression on mid phones | Med | ≤ 0.8 ms budget; pooled particles; springs are O(1); profile before merge |
| Part loading breaks Finn | Med | Parts load **separately**; any miss → monolithic provider (today's Finn). Never a blank hero |
| Concurrent edits to `chart-quest.html` | Med | Land V3 in one focused window; `cq.sh check` + gate before every ship |
| Regression gate blocks | Low | New assets under `finn/parts/`; deprecated names never reappear |

---

## Verification protocol (every phase)

1. `scripts/cq.sh check` — syntax.
2. **Browser, at real device scale** — never by formula (the repeatedly-learned lesson of builds 236–242).
3. **10-second stillness test** — watch him do nothing. Alive or not?
4. **Side-by-side A/B** against the previous build (mandatory for 0.2 and 1.3).
5. `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship` — regression gate must be green.
6. Beginner-mode QR (`?fresh=1`) for founder playtest.

**Rollback:** every phase sits behind a flag. `FINN_V3=false` restores build 259 exactly.

---

## The final question

> *Would Nintendo, Pixar and Ghibli believe Finn has a personality — or still say "that's a moving PNG"?*

**Today: "moving PNG."** Because he is one rigid body with a random timer.
**After P0:** they would say *"it has weight and it has a mind"* — mass, intention, non-repeating life. They would still note the legs don't carry him.
**After P1:** the honest answer becomes **yes.** Overlapping action, a head that leads, eyes that arrive before the head, legs that take his weight, and a compass that settles a beat late — that is the vocabulary those studios actually read as "alive."

**P0 makes him credible. P1 makes him iconic. Neither is a workaround.**

---

*Proposal only. No code, art, gameplay, or canon was modified. Awaiting approval to begin P0.*
