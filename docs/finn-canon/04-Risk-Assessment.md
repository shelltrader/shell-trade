# FINN — RISK ASSESSMENT

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Orange shell vs RED candles** — orange and red are both warm; Finn could lose contrast on giant red candles. | Med | High (readability = core gameplay) | Keep the deep brown-orange **outline (3 u)**, the amber **rim-light**, and the **contact shadow**. Green head/legs + dark outline hold separation. Bright amber rim specifically breaks Finn off red. Flagged for playtest on red-heavy levels. |
| 2 | **Orange shell vs GREEN candles** — was the old teal's main selling point. | Low | Med | Orange is the natural complement of green — it actually **pops harder** on green candles than teal did. Net positive. |
| 3 | **4th-leg pair clutters the silhouette** at 40–60 px. | Med | Med | Rear pair is 12% smaller, darker, drawn *behind* and 2 u higher — reads as depth, not clutter. Near pair still carries the primary read. Tunable if a playtest shows mud. |
| 4 | **Compass necklace competes with the shell** for attention. | Low | Med | Medallion is small (Ø 9 u ≈ 0.24 SD), low on the plastron, gold. Eye path stays Head → Glasses → Shell → Necklace → Jetpack. |
| 5 | **Build/obfuscation breakage** — edits to `chart-quest.html` fail to obfuscate or `index.html` mirror breaks. | Low | High | `build.js` isolates only the main script block; `@javascript-obfuscator` already installed. Syntax-check before build; `git` + `_old_*.zip` rollback. |
| 6 | **Palette cascade hits a non-Finn surface** unexpectedly. | Low | Med | Audited all `COLOR.turtle*` uses — every consumer is a Finn representation (gameplay, HTF marker, academy shell, hero pose). Collectible shells use a separate palette and are untouched. |
| 7 | **Perceived gameplay change** — players feel the boost/jump differs after the art swap. | Low | High | Zero physics edits (constants byte-identical). Only `drawTurtle` visuals + palette change. Verified by diff of `CFG` and `turtle.w/h`. |
| 8 | **Canon drift back to teal** via the hard-coded `finnIconHTML` SVG or a stray hex. | Med | Low | SVG updated in the same pass; grep gate for `#2EC4C7` in verification; Character Bible §6 names the tokens as the single source of truth. |
| 9 | **Scope creep from sheet art** — Wall Slide/Jump, Hover, diagonal boost tempt new mechanics. | Med | High | Explicitly out of scope (Inconsistencies #3, #4, #10). Task 5 constraints restated in the Animation Bible cross-cutting contracts. |
| 10 | **Head-size / upright reads** violating "never stand upright" in Boost/Victory. | Low | Med | Boost capped at +8–12° nose-up, still quadrupedal; Victory is a 4-leg cheer hop, never a biped stand. Documented in the Animation Bible. |

**Overall risk: LOW–MEDIUM.** The dominant residual risk is #1 (orange-on-red readability), fully addressable with the existing outline/rim/shadow and confirmable in one playtest. No physics, input, or collision surface is touched, so the "visual changes, gameplay doesn't" contract is structurally guaranteed.
