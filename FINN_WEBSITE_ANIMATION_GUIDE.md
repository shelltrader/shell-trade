# FINN — WEBSITE ANIMATION GUIDE (Phase 5)
**Status:** PRODUCTION GUIDE · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md` (Doc 7 idle system, Doc 8 principles).
**Scope:** homepage idle life for `website/index.html`. Every loop drives the **real official PNGs** (`finn/hero.png`, `finn/run.png`, `finn/vboost.png`) by transform + overlay — **no character art is redrawn**. The site already implements the hard parts via a clever **overlay technique**: per-sprite CSS vars (`--e1x/--e1y/--e1w/--e1h`, `--flx/--fly/…`) pin a **blink-lid** and a **live flame** onto the baked sprite so they ride its breathing transform.

---

## 1. Audit of what already ships (build as of 2026-07-09)

| Loop | Where (`index.html`) | Canon map | Verdict |
|---|---|---|---|
| **Blink** — upper-lid sweep, skin-matched, ~95ms | `.finnb .lid` / `@keyframes finnBlink` 4s | Doc 7 Idle-A/Blink | ✅ On-canon (non-metronomic feel; double-blink available) |
| **Breathing + head-glance** — bob + occasional 3D `rotateY` look | `@keyframes finnAlive` 9s (hero) | Doc 7 Idle-A + Chart-Glance | ✅ On-canon |
| **Pillar head-turns** — staggered glances | `@keyframes finnLook` 12s, `--lookd` offsets | Doc 7 Idle-E | ✅ On-canon (seeds prevent sync) |
| **Live flame flicker** — screen-blended over baked flame | `.flame` / `@keyframes flameFlicker` .5s | Doc 4 secondary motion | ✅ On-canon (orange→yellow, never blue) |
| **Portal / CTA float** — gentle dive bob | `@keyframes dive` 4.5s | ambient presence | ✅ Fine (non-idle décor) |
| **Cursor-lean** — Finn leans toward pointer | JS on `.finn-art` (desktop, motion-safe) | attention/"eye-tracking" | ✅ On-canon (subtle, transform-only) |
| **Finn-enters-the-chart** — launch → dive → run inside | `finnLaunch`/`cqMiniRun` (realmarket) | cinematic (not idle) | ✅ Keep (one-shot, IO-gated) |

**Infra already correct:** GPU-only (transform/opacity/filter), `IntersectionObserver` pauses offscreen + on tab-hide, `prefers-reduced-motion` disables all of it. This is the right foundation — extend it, don't rebuild it.

---

## 2. Requested Phase-5 loops — status & spec

Each loop: **3–10s, seamless, loopable, low-CPU (GPU transform/opacity only), pauses offscreen.**

| Loop | Status | Spec (drives existing PNG unless noted) |
|---|---|---|
| **Blink** | ✅ Built | Keep `finnBlink`; ensure interval jitter 2.4–4s; double-blink during any glance. |
| **Breathing** | ✅ Built | `finnAlive` bob 1–3px, 4.5–9s sinus; compass/tail lag is baked, so bob only. |
| **Weight Shift** | ✅ Built (implicit) | Formalize as ±1.4° `rotate` on `.finnb`, 6–9s, eased, random side. |
| **Chart Glance** | ✅ Built | `finnLook` `rotateY ≤25°` toward a candle/CTA + micro-nod; fire 15–25s, jittered. |
| **Jetpack Puff** | 🟡 Partial → buildable **no new art** | Add a periodic flare on the existing `.flame` overlay: `scale(1→1.6→1)` + opacity pulse over 0.6s, every 8–14s, + a ≤3° pack-adjacent body bob. Uses the flame overlay already positioned by `--fl*` vars. |
| **Eye Dart** | 🔴 **Needs an authored overlay** | Pupils are **baked into the PNG** — they cannot move by transform. A dart needs a **pupil overlay layer** authored the same way as the blink lid (measured `--p*` rects, on-model). **Do not fake by moving the whole head.** Until that overlay exists, blink carries eye-life. → commission item. |
| **Neck Stretch** | 🔴 **Needs art** | The neck is hidden/baked in `run.png`/`hero.png`; a true curious-peek extension needs the peek art (or a rigged neck). **Approximate only** with a small head `rotateY`+`translateY` (already have) — label it a glance, not a stretch. True neck-stretch → commission item. |

---

## 3. Homepage idle composition (Doc 7, ported to CSS)
- **Always on:** Breathing (A) + flame flicker + blink.
- **Overlays** (Weight-Shift, Chart-Glance, Jetpack-Puff): one at a time, **min 2s gap**, **±20–30% interval jitter**, seeded per instance so multiple Finns never sync (the site already does this with `--lookd`/`--bd` offsets).
- **Ease** every overlay in/out; always **return to A**. Goal: 30s with no visible repeat, no frozen frame > one breath.

---

## 4. Validation
| Check | Result |
|---|---|
| All loops drive real PNGs (no redraw) | ✅ |
| GPU-only, offscreen-paused, reduced-motion off | ✅ (already implemented) |
| Blink/breath/glance/weight-shift/puff achievable from current art | ✅ |
| Eye-dart / neck-stretch flagged as needing authored overlay/art (not faked) | ✅ escalated |
| Flame stays orange→yellow, vertical | ✅ |
