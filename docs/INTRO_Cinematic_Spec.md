# Chart Quest — Opening Cinematic: Design + Implementation Spec

**Deliverable for:** the new permanent introduction ("Lost in the Blockchain")
**Companion file:** `preview-intro-cinematic.html` — a fully playable prototype of everything below. Play it first; this doc explains the decisions and how to ship it.
**Source of truth:** `chart-quest.html` (8,591 lines). All line numbers below are from that file.

---

## 1. Critical evaluation of the concept

The core idea is strong and on-brand: a turtle lost *inside* the blockchain, escaping by becoming a Trader, is a better frame than the existing "Hey! I'm Shell 🐢" greeting card because it gives the player a **goal and a mystery** instead of a tooltip. The Tron-fall aesthetic is achievable cheaply on the existing canvas. Keep the premise.

But several beats in the brief, implemented literally, would hurt the product:

**a) The faction pick as a stop-and-choose menu (Scene 4) breaks the fall.** The brief's biggest risk is momentum. You spend Scenes 2–3 establishing free-fall and control, then Scene 4 freezes everything for a UI decision. That kill-and-restart of motion is exactly where players bounce. **Fixed by making the choice diegetic** — three portals rise into the fall lane and the player *steers the turtle into one*. No pause, no menu. The choice becomes a gameplay moment that also teaches the core verb (steer the turtle) before real gameplay starts.

**b) The Validator's seven lines are a lore dump** — which the brief itself forbids elsewhere. Seven sequential text boxes before gameplay is the same sin as the old greeting card, dressed in a hood. **Cut to three lines.** Mystery comes from what you *don't* explain. Leaving "Where am I / what is this world" partly unanswered is the hook; over-explaining kills it.

**c) "Narrowly avoids collisions" (Scene 5) implies a fail state.** A collision that hurts or restarts during onboarding is a retention disaster — punishing a player before they've learned anything. **Near-misses must be cosmetic only.** Candles streak past for drama; touching one does nothing. There is no way to fail the intro.

**d) Auth ordering is the silent killer.** Today the flow is **Auth wall → Faction picker → game** (`resolveAuth`, line 997). If the cinematic sits *behind* the login wall, it can't be the shareable cold-open the brief wants, and it violates "the player must gain control almost immediately." The single highest-impact change is **play the cinematic first, defer the account prompt.** There's already a "Play as Guest" path (line 544), so this is low-friction.

**e) Don't throw away the existing interactive onboarding.** The game already has a genuinely good first-run teaching loop: Flash Quiz (green/red/doji) → Prediction Bet → Intro Boss "The Market Maker" (the `introFlow` system, line 1934; `BOSSES[0]`, line 5202). The cinematic should **replace only the greeting card and the DOM faction picker**, then hand off *into* that loop. The Validator's "Learn. Trade. Survive." is the perfect motivation for the quiz/bet/boss that immediately follow. This keeps emotional onboarding and educational onboarding both, each doing its job.

**Verdict:** ship the concept, with the fall-through faction choice, a 3-line Validator, a no-fail rule, and cinematic-before-auth. That is what the prototype implements.

---

## 2. Recommended improvements (what changed and why)

| Brief says | Shipped instead | Why |
|---|---|---|
| Scene 4: select a portal (menu) | Steer the falling turtle *into* one of three rising portals | Preserves momentum; teaches the core verb; more shareable |
| Validator: 7 lines | 3 lines, tap-to-advance, auto-advance fallback | Avoids the lore dump the brief warns against |
| Scene 5: "narrowly avoids collisions" | Cosmetic near-misses, **no fail state** | Never punish a player during onboarding |
| (unspecified) auth placement | Cinematic **before** auth; account prompt deferred | "Immediate control" + shareable cold-open |
| Replace the whole intro | Replace greeting + faction picker only; hand into existing Quiz→Bet→Boss | Keeps the proven teaching loop |
| 3 portals BTC/ETH/SOL | Uses the existing 3 **starter** factions exactly (BTC/ETH/SOL; `FACTION_META`, line 1638) | Zero new config; matches what's already unlockable at level 0 |

One naming note, not a blocker: the brief says factions are cosmetic only, but the live faction picker tells players the choice "determines which **real live market** you'll trade on" (line 747) and the code swaps the data feed in `_confirmFaction` (`fetchMarketData`, line 1266). The portals inherit whatever that system does — if you truly want cosmetic-only, that's a separate change to the faction system, not the intro.

---

## 3. Full implementation plan

The cinematic is a **single self-contained module** (`IntroCinematic` in the prototype) that draws to the existing `#game` canvas and depends only on primitives the game already exports: `ctx`, `W`, `H`, `rr()`, `drawAcadShell()`, `COLOR`, `FACTION_CONFIG`. It runs as a phase *in front of* the game, exactly the way `candleAcademy` already does at the top of `frame()` (line 8516).

Phase machine: `glitch → fall → choose → plunge → impact → validator → title → done`.

Handoff: on the last frame it calls `window._confirmFaction(key)` (line 1262) — which already re-inits candles, HTF, and the turtle to a clean start — then clears itself so the normal game loop continues, with the existing `introFlow` checkpoints firing during the first run.

Build order:
1. Paste the `IntroCinematic` IIFE (and optional `Audio` IIFE) into the game's script, near `drawAcadShell`.
2. Add a 3-line guard at the top of `frame()` so the cinematic owns the screen while active.
3. Add a 1-line guard at the top of the main pointer handler so taps route to the cinematic.
4. Replace the two first-run triggers (greeting card + DOM faction picker) with a call to `IntroCinematic.start(...)`.
5. (Recommended) Move that trigger to *before* auth.

---

## 4. Required file changes

Only **one file changes: `chart-quest.html`** (then re-sync `index.html`: `cp chart-quest.html index.html`, per `PROJECT_STATUS.md`).

- **Add** ~430 lines: the `IntroCinematic` module (+ optional `Audio` module).
- **Edit** `frame()` — 3 lines (line ~8516).
- **Edit** the main `pointerdown` handler — 1 line (line ~2199).
- **Edit** `resolveAuth()` / guest handler — swap `showFactionPicker()` for the cinematic trigger (lines 997–999, 1308).
- **Edit** `candleAcademy` init — disable the old greeting for first-timers (line 1925).

No build-system, dependency, or hosting changes. No new `<script>` tags, no CDN additions.

---

## 5. Required asset changes

**None.** This is the key cost saver.

- **Turtle:** reuses `drawAcadShell()` (line 7501) verbatim.
- **Candles / wicks / flame:** reuses `COLOR` (line 1397) and the same rounded-rect primitive `rr()` (line 6286).
- **Faction colors / glyphs / glow:** reuses `FACTION_CONFIG` (line 1555) — BTC `#f7931a ₿`, ETH `#627eea Ξ`, SOL `#8b5cf6 ◎`.
- **The Validator:** drawn from primitives (a dark candle-shaped silhouette with two faction-colored glowing eyes). No illustration, no sprite.
- **Audio:** fully synthesized via WebAudio (whoosh, portal chime, impact thud, glitch hiss). Zero audio files. Entirely optional — delete the `Audio` module and the cinematic runs silently.

No PNGs, no sprite sheets, no fonts. The only existing image referenced anywhere nearby (`logo.png`) is **not** used by the cinematic — the wordmark is rendered as text so it's crisp at any DPR and trailer-safe.

---

## 6. Exact integration points

**6.1 — Paste the module.** Insert the `IntroCinematic` IIFE (and optional `Audio` IIFE) from `preview-intro-cinematic.html` just **after** `drawAcadShell` ends (~line 7595). Delete the prototype's *Primitives copied from chart-quest.html* block and its *Preview driver* block — the game already has `ctx/W/H/rr/COLOR/FACTION_CONFIG`, and `frame()` replaces the driver. Change the one call `drawTurtle(...)` inside the module to `drawAcadShell(...)` (same signature).

**6.2 — `frame()` guard.** At the very top of `frame()` (after `dt` is computed, line ~8514), before the `candleAcademy` block:

```js
// New opening cinematic owns the screen while active
if (typeof introCine !== 'undefined' && introCine.active) {
  introCine.update(dt); introCine.draw();
  requestAnimationFrame(frame); return;
}
```
(Expose the module's state as `const introCine = IntroCinematic._S;` or rename `_S` → a shared handle.)

**6.3 — Pointer guard.** At the top of the main `pointerdown` handler (line ~2199), add as the first line:

```js
if (typeof IntroCinematic !== 'undefined' && IntroCinematic._S.active) return; // cinematic handles its own input
```
The module attaches/detaches its own listeners, so this just prevents double-handling.

**6.4 — Disable the old greeting (line 1925).** Change:
```js
const candleAcademy = { active: !localStorage.getItem('cq_played'), ... }
```
to `active: false` — the cinematic's title card replaces it. (Leave `introFlow.active` as-is at line 1934; you still want the Quiz/Bet/Boss.)

**6.5 — Trigger the cinematic (two options).**

*Option A — recommended, cinematic before auth.* This is the higher-retention, shareable version. At boot, if `!localStorage.getItem('cq_played')`, start the cinematic immediately and keep the auth overlay hidden until it finishes; on completion, show a soft "Save your progress?" prompt (or just let them play as guest and prompt after World 1). The cinematic already calls `_confirmFaction`, so faction is set before gameplay.

*Option B — lowest-risk, drop-in.* Leave auth first. In `resolveAuth()` replace:
```js
if (!localStorage.getItem('cq_faction')) { showFactionPicker(); }
```
with:
```js
if (!localStorage.getItem('cq_played')) {
  IntroCinematic.start((key) => { window._confirmFaction(key); });
} else if (!localStorage.getItem('cq_faction')) {
  showFactionPicker();
}
```
Do the same in the guest handler (line 1308). `showFactionPicker` stays wired to the account panel for "change faction later."

Ship Option B first (safe), move to Option A once you've watched it land.

**6.6 — Completion callback.** `IntroCinematic.start(onDone)` calls `onDone(factionKey)`. Production `onDone` = `window._confirmFaction(key)`. Nothing else required — `_confirmFaction` resets the world to a clean start, and `cq_played` is still set later by the existing `introComplete()` (line 8152) after the Quiz/Bet/Boss, so returning players skip both the cinematic and the checkpoints.

---

## 7. Complete code implementation

The complete, working implementation is in **`preview-intro-cinematic.html`** — the `IntroCinematic` module (state machine, all seven phase draws, input, failsafes) and the synthesized `Audio` module. It has been syntax-checked and run headless through (a) a forced sweep of every phase and (b) two full playthroughs — idle/failsafe and with a simulated portal choice — with no exceptions thrown.

To productionize, follow §6: paste the two IIFEs, swap `drawTurtle`→`drawAcadShell`, drop the prototype's primitive/driver scaffolding, add the four guard/trigger edits. The module API is intentionally tiny:

```js
IntroCinematic.start(onDone)   // begin; onDone(factionKey) fires at the end
IntroCinematic._S.active        // is the cinematic running
IntroCinematic.update(dt)       // call from frame()
IntroCinematic.draw()           // call from frame()
```

Tuning knobs (all in the `S` object / phase timers): glitch length (2.4s), fall-before-portals (4.2s), choose failsafe-magnet (6s) and force (8s), plunge ramp (2.8s), Validator per-line auto-advance (3.4s), title hold (4.0s). Idle worst-case ≈ 30s; a player who steers and taps finishes in ≈ 15s.

---

## 8. Development time estimate

| Task | Estimate |
|---|---|
| Paste modules, swap `drawTurtle`→`drawAcadShell`, remove scaffolding | 0.5 hr |
| `frame()` + pointer guards, disable greeting (§6.2–6.4) | 0.5 hr |
| Wire trigger **Option B** (drop-in, behind auth) + re-sync `index.html` | 0.5 hr |
| On-device visual pass (timings, turtle scale, portal hitboxes) via Claude-for-Chrome or a screenshot loop | 1.5 hr |
| Build a `preview-*.html` per your convention + DOM-stub node test | already done (this file's companion) |
| **Subtotal — shippable v1 (Option B)** | **~3 hr** |
| Upgrade to **Option A** (cinematic before auth, deferred account prompt) | +1.5–2 hr |
| Optional: capture trailer master (screen-record the canvas at 60fps) | +1 hr |

The estimate is small precisely because there are **no new assets** and the module is decoupled — the only entanglement with the 8.5k-line file is four short, reversible edits.

---

## 9. Risks and simplifications

**Risks**
- *Editing one giant file.* All four edits are additive/guarded and trivially revertible; the module is namespaced. Mitigation: ship behind the `cq_played` flag so it only ever affects first-run, and keep the prototype as the reference.
- *Auth reorder (Option A).* Moving the cinematic before login touches the most sensitive flow. Mitigation: do Option B first; treat Option A as a deliberate, separately-tested follow-up.
- *Audio autoplay policies.* Browsers block audio before a user gesture. In production the cinematic is entered right after a tap (auth/guest button), so the context resumes cleanly. The `Audio` module is wrapped in try/catch and is fully optional.
- *Idle worst-case length (~30s).* A distracted player who never touches the screen sits through failsafes. Mitigation knobs in §7; or shorten the `choose` force-timeout to ~5s.
- *Motion sensitivity.* The fall + shake could bother some users. Cheap mitigation: honor `prefers-reduced-motion` to damp shake/streaks (≈15 min).

**Simplifications already taken**
- Diegetic faction choice removes a whole menu screen.
- Validator and portals are primitive-drawn — no art pipeline.
- Synthesized audio — no asset hosting.
- Reuse of `_confirmFaction` means the cinematic inherits the existing clean-start reset for free.
- One file, four edits, behind one existing flag.

**Recommended cut if you want it even leaner:** the `plunge` acceleration phase (Scene 5) is the most optional beat — collapsing it into a 1-second speed-ramp before `impact` saves nothing in code but tightens pacing. Keep `glitch`, `fall`/`choose`, `impact`, `validator`, `title` — those carry the four questions the brief wants ("what happened / where am I / how do I get out / what is this world").
