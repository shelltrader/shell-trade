# PROJECT FINN — PRODUCTION LOCK REVIEW
**Date:** 2026-07-10 · **Role:** Character Director, final review before animation production.
**This is a decision + build record, not new canon.** The one genuine canon addition (Core Beliefs + The Shell-Check signature + Player Relationship + Growth) was made **inside** `FINN_BEHAVIOR_BIBLE.md`. Nothing else was expanded.
**Docs reviewed:** the full suite — `FINN_CANONICAL_CHARACTER_SYSTEM`, `_ANIMATION_BLUEPRINT`, `_EXPRESSION_LIBRARY`, `_POSE_LIBRARY`, `_WEBSITE_ANIMATION_GUIDE`, `_GAMEPLAY_ANIMATION_GUIDE`, `_REFERENCE_PACKAGE`, `_FUTURE_ASSET_QUEUE`, `_BEHAVIOR_BIBLE`, + `docs/canon/finn_canon.md`.

---

## 1 · Final character review — what to SIMPLIFY (be ruthless)

The suite is coherent and non-contradictory. The risk is not gaps — it's **volume.** Findings:

| # | Finding | Ruling |
|---|---|---|
| S1 | **The legs-animate ghost.** Old Bibles describe diagonal-gait legs; the lockdown says legs are **static/baked**. Already reconciled in canon, but it caused builds 226→250 of regressions. | **Keep static. Full stop.** This is the #1 implementer trap — flag it at the top of every handoff. Gait spec = rigged-productions-only. |
| S2 | **Beat overlap.** The same micro-beats (Read / Shell-Check / Settle / Peek / Exhale) recur across Motion Language, the Idle System, the 28 habits, and the 100 surprises. | **Consolidate to 5 atomic beats** (below). Everything composes from them. This turns "hundreds of behaviors" into *a small vocabulary + a scheduler.* |
| S3 | **Sheer quantity** — 28 habits + 100 surprises + 15 emotions + 5 idles. | Correct to *own*, wrong to *build first.* Beta needs ~6 behaviors (§8). The rest is a post-beta library, not a launch requirement. |
| S4 | **Expression over-promise.** 15 emotions imply facial range the 7 sprites don't have (faces are baked). | Set expectation: at beta, emotion = **body + motion**, not face-swaps. Only 2 new-art items unlock more (eye overlay, neck). Don't animate faces you don't have. |
| S5 | **Hover confusion risk.** Hover reads as a capability. | Reinforce: **hover is marketing/cinematic only — never a gameplay state.** Do not implement a hover verb. |

**The 5 atomic beats (the whole motion vocabulary):**
> **The Read** (gaze across structure) · **The Shell-Check** (the signature dip-and-peek) · **The Exhale** (calm after refusing FOMO) · **The Settle** (overshoot→rest after any motion) · **The Peek** (crane to look; art-gated).
Every habit, reaction, and surprise is a *composition* of these + breathing/blink. Build the five; the rest is scheduling.

---

## 4 · Signature habits — ranked (stronger, not more)

From 28 habits → a tight core. Merges applied: *compass glance/brush/bearings → one "Compass Check"; checks-chart + The Read → one "The Read"; patient-plant + slow-in-on-stillness → one "The Patient Plant."*

| Tier | Habit | Note |
|---|---|---|
| **ESSENTIAL** (identity — build first) | **The Shell-Check** | THE signature |
| | **The Read** | eyes to structure before acting |
| | **The Patient Plant** | visible, deliberate waiting = "waiting is a decision" |
| | **The satisfied nod** | the honest-good-decision beat |
| | **The slow exhale** | anti-FOMO payoff (his most on-brand beat) |
| | **Breathing + blink** | already built; the aliveness floor |
| **HELPFUL** (depth) | Compass Check · weight-shift · head-tilt-at-messy-candle · glasses push-up (on unlock) · companion check · recover-and-lift |
| **OPTIONAL** (flavor, post-beta) | the rest of the 28 + **all 100 idle surprises** — a treasure library, not a launch list |

---

## 7 · Implementation audit & roadmap (the important section)

Classified by what each actually needs. **Headline: a credibly *alive* Finn ships with ZERO new art** — from existing sprites + code + timing.

| Behavior | Classification |
|---|---|
| Breathing, blink, body-rock idle, landing squash, flame flicker, cursor-lean, 6 gameplay states | **READY NOW** (already built) |
| **Victory/menu hero pose** | **READY NOW** — `hero.png` wired (build 255), verified |
| Reactions via existing states (win→hero · boss→plant/vboost · loss→dazed→recover) | **READY NOW** |
| **The Shell-Check** (head-dip transform; deeper tuck reuses `shell`) | **CODE ONLY** |
| The Read (head-pan), Patient Plant, satisfied nod, slow exhale, weight-shift | **CODE ONLY** |
| Jetpack-puff (scale the existing flame overlay) | **CODE ONLY** |
| Reaction-matrix wiring (trigger→state, **player-first**) + idle-surprise scheduler | **CODE ONLY** |
| Blink cadence/jitter, Process-beat pauses, ease curves, non-sync seeds | **ANIMATION TIMING ONLY** |
| **Pupil / eye overlay layer** (eye-darts, lid-lower, true eyes-first) | **NEW ART — P0-A1** |
| **Neck-extension frame** (true Peek) | **NEW ART — P0-A2** |
| Worried / surprised faces, pointing pose, head-look up/down/left | **FUTURE ASSET — P1** |
| Most of the 100 surprises, rich environmental reactions, growth cues, turnarounds | **POST-BETA POLISH / P2** |

**Roadmap order:** (1) wire the 5 atomic beats + player-first reactions (code) → (2) tune timing + the idle scheduler → (3) add the 2 P0 art overlays → (4) P1 faces/poses as beta feedback warrants → (5) post-beta surprise/growth library.

---

## 8 · Beta minimum (one day before beta)

**MUST exist** — all achievable from existing sprites + code + timing, **no new art**:
1. Breathing + blink *(built)*
2. **The Shell-Check** *(code — the signature; if only one thing ships, this)*
3. The Patient Plant / calm idle *(built + a hold)*
4. Win → hero pose *(built)* · Loss → recover beat *(code)*
5. The satisfied nod *(code)*
6. The **anti-FOMO slow exhale** on a loud candle *(code — his soul, made visible)*
7. Reactions that fire on the **player** first *(wiring choice)*

**Can safely wait:** the eye overlay, the neck frame, the 100 surprises, extra faces/poses, environmental richness, and all growth cues. **None block beta.**

---

## 9 · The last 5% (Pixar / Nintendo / Riot would all say)

Only what materially improves the felt experience:
1. **The Process-beat, everywhere** *(timing)* — the tiny think-pause before every action. Single biggest aliveness lever; costs nothing.
2. **A non-repeating, non-syncing idle scheduler** *(code/timing)* — kills the "looped puppet" tell.
3. **The eye overlay (P0-A1)** — the one new-art item worth pulling early; darting/settling eyes are the jump from *puppet* to *alive*.
4. **Player-first reaction priority** — Finn reacts to *you* before the chart. This is what makes him a *companion*, not a HUD element.
5. **The visible anti-FOMO exhale** — wire his restraint so players can *see* him choose patience. It's the whole game in one beat.

---

## 10 · Production lock

**Question:** if all documentation stops today, could future developers implement Finn consistently for the next five years?

**Answer: YES.** Identity, proportions, palette, rig, physics, motion, expressions, poses, behavior, beliefs, the one signature, and a prioritized build order all exist and agree. The only open items are **implementation tasks, not documentation gaps**: the 2 P0 art overlays (queued), the `index.html` mirror sync for build 255, and an optional hero-pose size tune. None block the lock.

```
██████████████████████████████████████████████
   PROJECT FINN
   VERSION 1.0
   CANON LOCKED
   PRODUCTION READY
██████████████████████████████████████████████
```

**No further Finn documentation should be created** unless real implementation exposes a genuine gap. From here: **build the five beats, wire the reactions player-first, tune the timing, add the two overlays. Ship.**
