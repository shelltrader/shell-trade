# ChartQuest — Phase 2A · The Educational Market Engine (`window.CQ`)
## Migration record & contract · build 287 · 2026-07-23

> **Success metric of this sprint: architectural convergence, not visual novelty.**
> The player notices almost nothing. The codebase gains its single behavioural owner.

This document is the migration record for building `window.CQ` and the **contract** for the
follow-on renderer migrations. It executes steps **§8.2–§8.3** of
`CHARTQUEST_ROOT_CAUSE_EDUCATIONAL_MARKET_2026-07-23.md` and honours the ratified
`CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (Appendix A.6 spine) + the Phase-1 Audit
(`docs/implementation/VISUAL_MARKET_PHASE1_AUDIT.md`, "the migration contract for Phases 2+").

---

## 0 · The one sentence

Educational-market **behaviour** (how a candle looks, how price moves, whether price has touched
the stop/target) now has **one code owner** — the frozen `window.CQ` engine — from which the palette
already derives and onto which every renderer is being incrementally, gate-provably consolidated;
new divergence and owner-deletion are both build failures.

---

## 1 · What was built (the deliverable)

### 1.1 `window.CQ` — the behavioural owner (`chart-quest.html`, immediately before `const COLOR`)

A single frozen engine, published on `window` so all four `<script>` blocks (incl. the Block-2 MG
IIFE) consume the *same* behaviour. It is **not a renderer** — SVG bosses still draw SVG, the canvas
world still draws canvas — it owns the behaviour they share. API:

| Member | Owns | Notes |
|---|---|---|
| `CQ.SPINE` | the A.6 numbers (frozen) | width ratios, bw bands, floors, doji band, wick, spacing |
| `CQ.color` | the palette (the ONE source) | `bg/ground/wick/neutral/bull{body,edge,sheen}/bear{…}/doji{…}/separator/reserved/hazard` |
| `CQ.bodyCol/edgeCol/sheenCol(dir)` | body/edge/sheen for a direction | accepts `'green'/'red'/'bull'/'bear'/'long'/'short'/±number` |
| `CQ.wickCol(candle)` | wick colour truth | ordinary = body colour; `sweep`→orange, `spin`→cyan (hazard signal keeps its colour) |
| `CQ.ohlc(candle)` | **the schema adapter** | maps the native game candle `{open, h, wick, wick2}` → canonical wick-inclusive `{open, close, high, low}` (= live resolver, :4116); canonical bars pass through. The Phase-1-Audit adapter that lets the one owner consume the several data schemas. |
| `CQ.width(slot,type,isPhone)` | **the one governing width formula** | `round(clamp(slot×ratio[type], BW_MIN, BW_MAX))`, per-type/-device bands |
| `CQ.gap(slot,type)` | inter-candle gap | B `0` (walkable road) · C `0.28×slot` · A `max(slot−bw−1, 0.20×slot)` |
| `CQ.wickWidth(bodyW)` | wick thickness | `clamp(bodyW×0.05, 1.6, 3.0)` |
| `CQ.minBodyPx(type,isPhone,isDoji)` | **the price-space body floor** the codebase never had | A `24` · else `18`/`16` · doji `2` |
| `CQ.floorBodyPx(px,opts)` | floor a rendered body height | doji clamps INTO the 2–4 band; others floor up |
| `CQ.floorBodyPrice(open,close,pxPerPrice,opts)` | floor a body **in price space** | returns adjusted close; never crosses open (a green stays green) |
| `CQ.priceTouched(bar,level,dir,kind)` | **the ONE "has price hit SL/TP" truth** | wick-inclusive; long-tp `high≥lvl` · long-sl `low≤lvl` · short mirrored |
| `CQ.levelHit(low,high,level,fromBelow)` | low-level touch test | building block for the above |
| `CQ.normalizeReplay(seq)` | **the ONE replay film** | non-mutating; enforces `open===prevClose` connectivity + valid OHLC + colour |
| `CQ.isPhone(vw)` / `CQ.selfTest()` | device band / dev integrity | selfTest has **no** duplicated literals (that would re-fork the palette) |

Everything is `Object.freeze`d, so no renderer can mutate the owner mid-run.

### 1.2 The authority inversion — `COLOR` now DERIVES from `CQ` (root-cause §8.3)

`COLOR`'s nine candle-language fields changed from independent literals to projections:

```js
const COLOR = {
  bg:        CQ.color.bg,        ground:    CQ.color.ground,   wick:      CQ.color.wick,
  greenBody: CQ.color.bull.body, greenStripe: CQ.color.bull.sheen, greenEdge: CQ.color.bull.edge,
  redBody:   CQ.color.bear.body, redStripe:   CQ.color.bear.sheen,   redEdge:   CQ.color.bear.edge,
  /* …Finn/turtle/jetpack fields unchanged — NOT candle language… */
};
```

The values are **byte-identical**, so this is a zero-visual-risk change — but `COLOR` is no longer a
second source of truth. Critically, the **gold-standard world renderer `drawCandle`** already reads
`COLOR.greenBody`/`edge`/`stripe` by name, so it now **transitively consumes `CQ`** with no edit to
the frozen physics seam.

### 1.3 First renderer migration + gate ratchet (root-cause §8.3)

Routed the two remaining inline candle-body literals in the main render path onto `COLOR`
(byte-identical by construction — the gate counts only *exact* `#16c784`/`#ea3943`, which are by
definition equal to `COLOR.greenBody`/`redBody`):

- `drawCandle` SETUP-label ellipse (the last inline hex inside the gold-standard renderer → now 0)
- the boss-gate torn-candle fragments VFX

Candle-language gate baseline ratcheted **440 → 436** (`scripts/.candle_baseline.json`) — locked-in
convergence; those four literals can never be re-added.

**Extended sweep (same session).** Then routed the canonical candle/UI green-red ternary
(`… === 'green' ? '#16c784' : '#ea3943'` and its tight variant, **61 pairs across ~30 renderers** —
world, replay, recap, journal, prediction, quiz, drill, lesson-chart, boss-feedback) onto
`COLOR.greenBody`/`COLOR.redBody`. Byte-identical **by construction** (the gate counts only *exact*
`#16c784`/`#ea3943`, which are *definitionally* equal to the `COLOR` values), so zero visual risk.
Verified: all 4 script blocks parse; `COLOR` resolves in every block (all classic scripts → one shared
global lexical `const COLOR`; `LessonChart` in block 3 loads clean); zero console errors; candles render.
Gate baseline **436 → 314** — **128 literals converged, ~31% of the original 407 inline palette hexes
retired in one session.** `inline_bull_body` 242→179, `inline_bear_body` 165→102.

### 1.4 Enforcement — two gates now guard the owner

| Gate | Guards against | File |
|---|---|---|
| **#12** candle-language ratchet (pre-existing) | ADDING new divergence (inline hex, forks, rounded candles, `minBody:15`) | `scripts/candle_language_gate.js` |
| **#13** `window.CQ` owner-integrity (**NEW**) | DELETING the owner · COLOR re-forking its own hexes · the embedded spine DRIFTING from Constitution A.6 | `scripts/cq_owner_gate.js` |

#13 was adversarially self-tested: re-forking `COLOR.greenBody` back to an inline hex, drifting a
spine colour, and removing the `window.CQ = CQ` publication are each **caught** (build fails). This
finally makes VMC:94 ("when a citation goes stale, the build fails") real — for the spine.

---

## 2 · What was deliberately NOT done (honesty per the operation)

- **The ~60 existing copies are not yet collapsed.** This pass built the owner and migrated the
  palette (one source) + one render path. The remaining renderers migrate incrementally, each
  verified and each lowering the gate — the contract in §3.
- **The price-space body floor and the price-touch truth are built but not yet wired into
  consumers.** Wiring `CQ.floorBodyPx`/`floorBodyPrice` changes geometry (e.g. the world floors at
  `CFG.minBody=15`; the spec floor is 18/16) and wiring `CQ.priceTouched` changes *when the game
  agrees a trade is over* — both are intended, felt changes that must be verified **on-device**, so
  they are separate gated steps (§3.4–§3.5), never a blind unattended rewrite. Building them without
  wiring keeps this pass at **zero visual risk**.
- **`drawCandle` geometry untouched.** It is the frozen physics seam (`{candleTop, c.x, c.w, gap}`
  are collision boundaries). It consumes CQ for *palette* only in this pass.

---

## 3 · The migration contract (ordered, gated, each verifiable)

Every step **lowers the candle-language gate baseline** (visible convergence) and is individually
verifiable. Nothing here is a rewrite; it is consolidation onto the already-built owner.

- **§3.1 · Palette routing — the rest of Block-1 candle draws.** Replace exact-match inline
  `#16c784`/`#ea3943` in *candle-drawing* contexts with `COLOR.greenBody`/`redBody` (and edges with
  `COLOR.greenEdge`/`redEdge`, doji ties with `CQ.color.doji.body`). Byte-identical; ratchet the
  baseline down after each renderer. **Candidate renderers** (line numbers are approximate,
  post-build-287): the ticket/recap SVG builders (~7550–8600), the prediction/flash-quiz canvas
  candles (~6700–6950, 17550–17650), the mini-chart SVG (~9584). **DONE:** drawCandle SETUP label,
  boss-gate fragments.
- **§3.2 · Retire the per-renderer palette forks.** The Block-2 MG edges (`#5cf0b4`/`#ff7a82`), the
  box forks (`#1fe08a`/`#ff4d5e`), the intro-card edge (`#0d9460`), the retired wick tints. Route
  onto `CQ`/`COLOR`; where a fork is a *near-miss* of the canonical colour, this is a deliberate
  (tiny) visual convergence — verify on-device, then ratchet those signals toward their goal of `0`.
- **§3.3 · Width consolidation.** Point each renderer's bespoke width formula at `CQ.width(slot,type,
  isPhone)`. This is geometry — verify each renderer renders the same on desktop + a 360px phone
  before ratcheting. **Two constraints (from the review):** (a) `CQ.width` returns the deterministic
  BASE; the Constitution's required `widthJitterRequiredPct [4,8]` is **caller-applied** on top (a naive
  `candleW → CQ.width` swap would drop the jitter). (b) **⚠ the ratified type-B phone band `[18,44]`
  is narrower than the build-274 valley-wedge fix tolerates** (~22px min so Finn fits between touching
  candles) — do NOT migrate `candleW` to the raw band without reconciling this, likely via an ADR, or
  the "movement feels broken" wedge bug returns on phones.
- **§3.4 · The price-space body floor.** Route every renderer's pixel floor through
  `CQ.floorBodyPx` / `CQ.floorBodyPrice`. Kills "too many spinning tops / flat / small" **at the
  owner, once, for all screens.** On-device felt change — gated.
- **§3.5 · Trade-behaviour unification.** One `CQ.priceTouched` truth consumed by the drive +
  resolution + replay; stop the live path printing past TP; make the replay render the *resolved*
  sequence via `CQ.normalizeReplay`. Kills "continues after TP / through SL / replay violates logic."
  Protected canon (`MIN_TRADE_CANDLES`, authored L1–3 outcomes/odds/R:R) is **not** touched — this
  changes *when the game agrees the trade is over*, never *whether the authored trade wins*.
- **§3.6 · Boss/quiz/MG renderers + the Block-2 bridge**, then the trade-time UI compositor.

---

## 4 · The parity method (how to migrate a renderer safely)

1. **Snapshot** `chart-quest.html` before editing (diff target).
2. **Route only exact-match literals** to `COLOR`/`CQ` for palette (byte-identical by construction),
   or for geometry, compute the CQ value and assert it equals the old value for representative inputs
   *before* switching.
3. `node scripts/candle_language_gate.js` — confirm the count **dropped** by exactly what you routed;
   `--update` to ratchet the baseline down.
4. `node scripts/verify.js` (with `CQ_ALLOW_PROTECTED=1` while the pre-287 build-274 `collideInset`
   CFG delta is uncommitted) — expect #12/#13 green, #3a clean.
5. **Boot in the browser muted** (`?fresh=1&mute=1`), confirm zero new console errors and the
   migrated surface renders identically (screenshot for geometry changes).
6. `diff` vs the snapshot — confirm the change is confined to the intended region only.
7. `bash scripts/cq.sh mirror`, bump `BUILD_TAG`.

---

## 5 · Verification of this pass

- `window.CQ` live at boot, `VERSION 1.0.0-phase2a`, `selfTest().ok === true`, frozen.
- `COLOR.greenBody === CQ.bodyCol('green') === '#16c784'` (and all nine candle fields) — byte-identical.
- API smoke tests pass: `width(100,'B',false)=56`, `width(30,'C',true)=22`, `wickWidth(40)=2`,
  `floorBodyPx(5,{type:'B'})=18`, `floorBodyPx(9,{isDoji:true})=4`, `priceTouched` truth table.
- Candle-language gate: **436 ≤ 436 PASS** (converged 4 from 440).
- Owner-integrity gate #13: **PASS**, and proven to CATCH re-fork / spine-drift / owner-removal.
- Browser boot (`?fresh=1&mute=1`): **zero console errors**; cinematic + world candles render identically.
- Diff vs pre-CQ snapshot: **5 hunks in 3 regions** (CQ+COLOR insertion, drawCandle label, fragments);
  the only removed lines are the 9 old COLOR fields + the 2 routed literals. Nothing else touched.
- Protected lanes intact: verify #10 (Movement CFG delta is the pre-existing uncommitted build-274
  `collideInset`, not this pass), #11 TES green.

---

## 6.5 · Adversarial review (Prompt 2) — findings & actions

Two independent adversarial reviews ("assume it is wrong; find weaknesses"): a self-review and a
second reviewer with fresh eyes that grepped the real renderers. The second reviewer found the sharpest
issue — **the API was keyed to a candle data model the game does not use** — which is now fixed. Ranked
by the disposition that matters; each is fixed, documented, or deferred with reason.

**The headline correction (R1/R2 — HIGH, FIXED).** The game's candle is `{open, h, wick, wick2}` in
height-above-ground units (`h` IS the close; `wick`/`wick2` are the up/down wick lengths — pushCandle
:2760, candleTop :2789). `priceTouched`/`normalizeReplay` were written against canonical
`{open, close, high, low}`, which **does not exist** on a game candle — so they could not consume a real
renderer (a native candle → `NaN` comparisons / a flat-doji collapse). **Fixed** by adding the schema
adapter the Phase-1 Audit called for: `CQ.ohlc(candle)` maps the native model to wick-inclusive OHLC
(`max(open,h)+wick` / `min(open,h)−wick2`, EXACTLY the live resolver + HTF aggregation at :4116), and
both methods now normalize through it. Verified live: `priceTouched` on a native candle detects a **wick
sweep** of the stop (the whole liquidity lesson), and `normalizeReplay` on real `trade.path` shape
produces connected real bodies instead of dojis.

| # | Finding | Severity | Action |
|---|---|---|---|
| R1 | `normalizeReplay` keyed to `.close/.high/.low` (absent on game candles) → every replay candle collapsed to a doji at `open`. | HIGH | **FIXED** — `CQ.ohlc` adapter + normalize through it. |
| R2 | `priceTouched` couldn't consume a native candle (NaN → never resolves), and its "wick-inclusive" fallback was body-only (missed wick sweeps). | HIGH | **FIXED** — adapter makes it genuinely wick-inclusive; `kind` validated (unknown → false, no silent mis-branch). |
| F1 | The spine's **numeric** fields (bands, floors, wick, spacing) were hand-transcribed from A.6 and **unguarded** — #13 only diffed colour + widthRatio ("hand-copy re-creates the disease one level up"). | HIGH | **FIXED** — #13 now evals the real CQ IIFE and deep-diffs the ACTUAL `SPINE`/`color` object (incl. bands, floors, wick, spacing, **hazard palette**) against A.6. Proven to catch band/floor/wick/ratio/colour/hazard drift. |
| R6 | `floorBodyPrice` fabricated a **bullish** body from a true tie (`close===open` → green), and handled dojis as a floor-up (2px) vs `floorBodyPx`'s clamp-into-[2,4]. | MED | **FIXED** — a true tie is returned unchanged (no invented direction); sign preserved; doji clamps into the band, consistent with `floorBodyPx`. |
| R7 | "Deep-freeze" was shallow — `SPINE.bwBands.B.desktop` (and its array) stayed **mutable**; a rogue renderer could repoint the one width formula. | MED | **FIXED** — recursive `deepFreeze`; `selfTest` now asserts a nested band array is frozen. |
| F3 | API inconsistency: `width()` took `isPhone`, but `gap()` read `window.innerWidth` internally → non-deterministic / untestable. | MED | **FIXED** — `gap(slot, type, isPhone)`. |
| R5b / F1' | Hazard wick hexes (`#7fd6ff`/`#ff7a45`, 39 inline) guarded by neither gate; A.6 keys bands `phone360` vs engine `phone` (structural). | MED | **FIXED** — hazard added to #13's spine diff; the `phone360↔phone` mapping is explicit in #13. |
| R10 | #13 check-B prefix-matched — `CQ.color.bull.body \|\| '#16c784'` slipped past; check-A `/const CQ = \{/` was formatting-brittle. | LOW | **FIXED** — check-B anchored to end-of-value (catches both fallback + direct re-inline); check-A now evals (const/let/var agnostic). |
| R3 / R4 | Duplicated floor/width ownership that **already disagrees**: `CFG.minBody=15` vs CQ `18/16/24`; `candleW` (jitter, device-blind `[24,56]`) vs `CQ.width` (deterministic, phone `[18,44]`). Migrating is NOT byte-preserving. | HIGH (framing) | **DOCUMENTED, DEFERRED** — CQ carries the **ratified target** values; `CFG.minBody`/`candleW` are the legacy approximations the migration REPLACES (§3.3/§3.4), an intended felt change, on-device-gated. Byte-preservation was only ever claimed for the palette step. Width jitter (`widthJitterRequiredPct`) is caller-applied on top of `CQ.width`'s base. **⚠ CROSS-CONSTRAINT:** the ratified type-B phone band `[18,44]` is NARROWER than the build-274 valley-wedge fix needs (~22px min to fit Finn) — reconcile before §3.3, likely via an ADR. |
| F4 | `wickCol` can't re-derive the spin-pole rule (depends on `CFG.spinMinWick`, a protected movement constant). | MED | **DOCUMENTED** caller-contract: a migrating renderer sets `candle.spin`. |
| F5 | `floorBodyPrice` moves the close → landmine on an SL/TP-tagging candle. | MED | **DOCUMENTED** hard wiring constraint (never floor a meaningful close). |
| R8 | Speculative generality: ~15 methods + several spine fields have **no consumers** — "an owner with no consumers is a second spec that can disagree." | MED | **ACKNOWLEDGED** — building the owner ahead of consumers is the ratified plan (root-cause §8.2, "the single owner now exists, zero visual risk"); R1/R2 fixed the part that *couldn't* consume. The remaining dead surface is the complete contract, now guarded by #13. First real consumers land per §3, each on-device-verified. |
| F6/R11 | `dir2` over-flexible (colours + directions + numbers); a callsite could pass the wrong thing. | LOW | **PARTIALLY FIXED** — `priceTouched` now validates `kind`; `dir2` kept flexible (harmless). |
| R12 | The A.6 JSON's own `color.authority: "COLOR@chart-quest.html:2412"` is now stale (true authority is `CQ.color`; COLOR is at ~:2676) — the exact "stale citation" the gate exists to end. | LOW | **FLAGGED for ADR** — editing the ratified Constitution requires an ADR (never edit canon directly); this citation update is queued, not auto-applied. |
| F8 | Load-order coupling: `const COLOR` depends on the CQ IIFE running first. | LOW | **ACCEPTED** — inherent to derivation; blocks adjacent; a broken order throws loudly at boot (not silent). |

**Net.** The core design (one frozen owner, COLOR derived, incremental gated migration) **survived** —
no rewrite was justified. But the reviews materially **hardened** it: the owner can now actually consume
the real candle model (R1/R2 — the difference between "an owner" and "a second spec"), the enforcement
now guards the whole spine incl. hazards (F1/R5b), two real correctness bugs are gone (R6/R7), and the
biggest migration risk — the ratified phone band vs the valley-wedge fix (R3/R4) — is now flagged for an
ADR before any geometry migration, rather than lurking. Honest limit: **rendered** consistency is still
only realized for the palette; geometry/floor/touch/replay have the owner + adapters but not yet their
consumers (§3), by design.

## 7 · Why this class can no longer regrow

- **Adding divergence** → gate #12 FAIL.
- **Deleting / bypassing / drifting the owner** → gate #13 FAIL.
- **The only legal direction for the baseline is down** — you lower it by migrating a renderer onto
  the owner. Convergence is now the enforced default, and the invisible fix ("consolidate the
  renderers") is a number in every `verify` run that must not go up.
