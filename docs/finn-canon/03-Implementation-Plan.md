# FINN — IMPLEMENTATION PLAN

**Goal:** Swap the deprecated teal/2-leg/no-necklace Finn for the canonical orange/4-leg/compass Finn **without touching gameplay** (movement, jump, boost, dive physics, and hitbox all unchanged).

## Architecture reality
Finn is **procedurally drawn on canvas** — there are **no PNG sprites** for gameplay. One function, `drawTurtle(cameraX)`, renders every frame, and one `COLOR` object feeds every Finn surface. This is a large advantage: a palette edit cascades to all Finn representations at once (gameplay hero, HTF minimap marker, academy shell, victory/hero pose). The only hard-coded Finn art is the small `finnIconHTML()` SVG badge used in the UI.

**Source of truth:** `chart-quest.html` → obfuscated to `index.html` via `node build.js`.

## Change set (all in `chart-quest.html`)

1. **Palette (`COLOR`)** — replace the 5 teal shell tokens with the orange family; add `turtleBodyShadow` (rear legs) and 3 `compass*` tokens; warm `engineGlow` from cyan to amber (flame is canon orange→yellow, no blue). Body, belly, jetpack, flame tokens unchanged in role.
2. **`finnIconHTML()` SVG** — shell fill teal→orange, outline→brown-orange, highlight→warm, add a small gold compass so the badge matches canon.
3. **`drawTurtle()` — 4 legs** — add a **rear leg pair** drawn *before* the shell/near legs: 12% smaller, `turtleBodyShadow` green, offset up 2 u, animated in counter-phase to the near pair. Near (front) pair unchanged.
4. **`drawTurtle()` — compass necklace** — new draw block after the plastron: gold ring + cream face + red N-needle + tiny chain to the neck base, on the plastron front. Swings subtly under `landC` / boost accel; omitted inside the `tucked`/`spinning` ball.
5. **Ball states** — Tuck/Spin already read `COLOR.turtleShell`, so they turn orange automatically; hex pattern uses the brown outline. No structural change.

## Explicitly NOT changed (Task 4 + Task 5)
- `turtle.w/h` hitbox (**36 × 24**), `VIS` (1.35), authoring frame (46 × 30).
- `CFG` physics: `jumpVelocity`, `jetpack1/2Velocity`, `jetpackHang`, `tuckMinVy`, `gravity`, `walkSpeed`, `maxBoosts`, `jetpackCost`, `fuelMax`.
- Boost system: discrete two-tap vertical boost. **No** hover, **no** free flight, **no** fuel-meter UI, **no** diagonal boost.
- Input handling, camera, collision, candle/shell/portal logic.

## Build & deploy
1. Edit `chart-quest.html`.
2. `node build.js` → regenerates obfuscated `chart-quest.min.html` + mirror `index.html`.
3. Bump `BUILD_TAG` so a playtest can confirm the loaded build.
4. Local check via `serve.command`; deploy path unchanged (Netlify mirror = `index.html`).

## Verification
- Grep-confirm: no `#2EC4C7` teal remains in Finn art; orange tokens present; `turtle.w/h` and `CFG` values byte-identical to pre-change.
- Static syntax check of the edited script block (node `--check` on the extracted JS or a headless load).
- Visual smoke test across the 13 poses (idle, run, jump, boost, fall, dive prep/tuck, spin, impact, land, hurt, victory, blink) — confirm 4 legs, orange shell, visible compass, right-facing, vertical flame.
- Confirm cascade: HTF minimap marker, academy shell, and hero/victory pose all read orange.

## Rollback
Single-file, version-controlled (`git`). Revert `chart-quest.html` + rebuild. The `_old_*.zip` snapshots and git history provide additional restore points.
