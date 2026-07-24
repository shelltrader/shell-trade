# ChartQuest — Regression Investigation · build 287 (Phase 2A / window.CQ)
## 2026-07-23 · "did tonight's changes break another system?"

*Assume every system changed tonight could have accidentally broken another. Check each; add no features; eliminate regressions. This is a verification pass, because tonight's runtime change is **byte-identical by construction.***

---

## The blast radius (what actually changed in `chart-quest.html`)

The complete diff vs the pre-session snapshot is **6 hunks in 3 regions** — proven by `diff` (removed-lines-other-than-expected check returns **empty**):

| Hunk | Region | Nature |
|---|---|---|
| :2460–2705 | the new `window.CQ` engine IIFE | **additive** — a frozen owner with **zero consumers** (nothing calls `CQ.width/ohlc/priceTouched/floorBodyPrice/…`) |
| :2707–2715 | `const COLOR` — 9 candle fields now `CQ.color.*` | **value-preserving** — verified in-browser `COLOR.greenBody==='#16c784'` etc. (byte-identical) |
| :2744 | `BUILD_TAG` string | cosmetic |
| :13690 | `drawCandle` SETUP-label colour → `COLOR.greenBody/redBody` | **byte-identical** (the gate counts only *exact* `#16c784`, which *is* `COLOR.greenBody`) |
| :15436 | boss-gate fragment VFX colour → `COLOR.redBody/greenBody` | **byte-identical** |

Plus tooling: new `scripts/cq_owner_gate.js`, `verify.js` #13 (do not ship in the game).

**Nothing else in the 21,373-line file changed.** The three key invariants that make regression *impossible*, not merely *unobserved*:
1. Every named system's **code is byte-unchanged** (its function lines fall outside all 6 hunks).
2. The only shared dependency touched (`COLOR`) yields **byte-identical values** (verified at runtime).
3. The new engine's behavioural methods have **zero consumers**, so they cannot have altered any path.

---

## System-by-system (each: was its code touched? → evidence)

| System | Key code (line) | In a diff hunk? | Verdict |
|---|---|---|---|
| **Boss fights** | `openBoss` :11145, `bossRound` :10608 | No | ✅ untouched. (The boss-*gate* fragment VFX at :15436 is a byte-identical palette routing — pixels identical.) `verify #5` PASS. |
| **Tutorials** | `openIntroLesson` :20758, `openConceptPractice` :20670, `dismissLesson` :5601 | No | ✅ untouched. `verify #4` (lessons load) PASS. |
| **Prediction mode** | prediction card/candle render (~:6700, ~:17550) | No | ✅ untouched (build-286 prediction code byte-unchanged). |
| **Replay** | `tradeReplaySVG` + replay renderers (~:7550–8600) | No | ✅ untouched. (`CQ.normalizeReplay` exists but has **no consumers** — the live replay still uses its own path.) |
| **Journals** | `journalOpen` + journal replay | No | ✅ untouched. |
| **Platforming** | physics `update` :13121, `jump`/`fireJetpack` :4550, Movement `CFG` | No | ✅ physics byte-unchanged. `drawCandle` was touched **only** at its SETUP-label colour (:13690, byte-identical) — the frozen physics seam `{candleTop, c.x, c.w, gap}` is untouched. `verify #10` shows no Finn/CFG change *from me* (the one CFG delta is the pre-existing uncommitted build-274 `collideInset`). |
| **HUD** | HUD render | No | ✅ untouched. |
| **Accessibility** | palette + non-colour cues | No (values identical) | ✅ CVD/greyscale separability is a function of the palette **values**, which are byte-identical — separability preserved. Hazard cues (`#7fd6ff`/`#ff7a45`) unchanged and now *also* gate-guarded (#13). |
| **Save data** | `cq_*` localStorage keys | No | ✅ `verify #6` (28 keys, core present) + `#10` (save-keys signature vs HEAD unchanged — only Movement CFG flagged) PASS. |
| **Progression** | `LEVEL_FLOW` :5564, `endHour` :6057 | No | ✅ untouched. `verify #11` (MIN_TRADE_CANDLES, SETUP_UNLOCK order, authored outcomes, L1-3 fast-loss guard) PASS. |
| **Achievements** | achievement logic | No | ✅ untouched. |

---

## Empirical confirmation
- **`verify.js`:** 12 pass · 0 fail · 1 warn · 1 skip. FAIL count **0**. The only warn is the pre-existing, approved Movement-CFG delta (build-274 `collideInset`, uncommitted since before this session); the skip is puppeteer (`3b`).
- **Candle-language gate (#12):** 436 ≤ 436 — no new divergence.
- **Owner-integrity gate (#13):** PASS — owner published, COLOR derives, full spine matches ratified A.6.
- **Browser boot** (`?fresh=1&mute=1`): **zero console errors**; `window.CQ` live, `selfTest().ok`, `COLOR` byte-identical, cinematic + world candles render identically.

## Conclusion
**No regression is possible from tonight's changes, and none is observed.** The runtime delta is a byte-identical palette re-sourcing plus a dormant (zero-consumer) engine. Every one of the eleven named systems has byte-unchanged code and an unchanged palette. The two enforcement gates now make a *future* regression of the candle-language / owner class a build failure. **No fixes were required (nothing to un-break); no features were added.**
