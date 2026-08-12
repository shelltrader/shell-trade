# Build 363 Independent QA

## Verdict

**PASS FOR FOUNDER MOBILE TEST.**

The exact uncommitted Build 363 candidate closes the bounded first-session safe-inset, main-canvas
DPR, and terrain-relative resize defects without changing protected gameplay systems. Independent
static/VM verification is all green, and the PM/CTO's in-app Browser evidence is bound to the exact
hashes below and satisfies the bounded Browser contract.

This is **not production release authorization**. Production remains frozen. Do not push, merge,
deploy, alter `main`, change the release freeze, access providers, or touch credentials.

## Exact candidate identity

- Branch: `codex/beta-360-readiness`
- Parent HEAD: `8732cd44f9272a917428e772df4c7107d221bc40`
- Build: **363**
- `chart-quest.html`: `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- `index.html`: `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- `website/game.html`: `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- `.chartquest/qa/beta360-bridge.js`: `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`
- `.chartquest/qa/BETA360_BROWSER_HARNESS.html`: `701fbac50d68bf9bdcb740ad02f947d41d681a2ae02f61258b96793e453225ab`
- `scripts/cqsafe.test.js`: `8a802f5fc336b3bb619925b797ea7755fa3c0c2ffceed8e60e8dfabe8b2e2391`
- `scripts/verify.js`: `11958d618e2b39f72625f5620d260b97a85be40e8b3225522eba5dab2b283b53`
- `scripts/beta360_qa_server.py`: `41e27528e6ec5178d37b263928f0492f980d7e523906053bfdca98298f0dda05`

All three game artifacts are byte-identical. The QA server self-test identified the same canonical
game SHA. The Git index was empty during QA; no QA action changed repository bytes.

## Scope adjudication

The evidence-bound Build 363 delta is bounded to:

- CSS safe-area probes and frozen `window.CQVIEW` owner.
- Opening DOM Skip, retained canvas Skip, movement-tutorial Skip, and opening Enter safe-bottom placement.
- 44px first-session Skip targets with shared draw/hit geometry.
- Main `#game` canvas effective DPR cap of 2.
- Main-world Finn/terrain-anchor translation by literal `groundY` delta.
- Active movement-tutorial ownership guard during viewport changes.
- Build identity, focused tests, verifier labels, and two Browser cases M1/M2.
- Canonical game regeneration into the two byte-identical mirrors.

No trade economics, outcomes, curriculum, save keys, CFG movement model, lesson set, boss engine,
release control, provider, credential, production, art, or binary changed. Verifier gate #10
independently passed protected-system comparison against HEAD.

## Independent static and VM results

| Check | Result |
|---|---|
| Candidate SHA-256 identity | **PASS** — every supplied fingerprint matched |
| Three-artifact byte parity | **PASS** |
| `git diff --check` | **PASS** |
| Game inline syntax | **PASS** — 10/10 script blocks |
| Standalone JavaScript syntax | **PASS** — 25 tracked files |
| Browser bridge/harness syntax | **PASS** |
| Python QA server parse/self-test | **PASS** |
| Focused viewport/CQSAFE suite | **PASS — 18/18** |
| Release-control negative/positive suite | **PASS — 15/15** |
| Artifact-parity fixture suite | **PASS — 5/5** |
| Full verifier | **PASS — 24 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip** |
| Build increment | **PASS — 362 → 363** |
| Protected systems | **PASS — unchanged** |
| Repository files changed by QA | **None** |

The one verifier skip is the pre-existing optional Puppeteer headless-boot check; the exact candidate
was exercised separately in the in-app Browser.

## Viewport contract results

| Contract | Evidence | Result |
|---|---|---|
| U1 — inset parsing | CSS values and explicit fixtures parse finite positive values; negative, invalid, non-finite, missing, and throwing inputs fail closed to zero without throwing. | **PASS** |
| U2 — first-session DOM controls | `#mmSkip` uses `14px + safe top/right`, owns a 72×44 minimum target above the portal, and Enter clears safe bottom. Zero-inset edge offsets remain 14px. | **PASS** |
| U3 — canvas Skip geometry | Retained cinematic Skip and movement Skip read the same inset owner. Movement draws from one 84×44 rectangle and assigns that exact object to `S.skipBox`. | **PASS** |
| U4 — main-canvas DPR cap | Raw DPR 1/2/3/4 fixtures produce effective DPR 1/2/2/2; 430×932 at DPR3 produces 860×1864 backing while CSS remains 430×932. Pointer math remains in CSS pixels. | **PASS** |
| U5 — resize bootstrap/idempotence | Early owner/TDZ path is contained; delayed 0→valid recovery applies the real delta; 812→730→812 is reversible; same-size resize is a no-op. | **PASS** |
| U6 — grounded/airborne Finn | Finn y and terrain-relative sweep/fall anchors translate by the same delta while x, velocity, grounded state, timers, and camera owner remain unchanged. | **PASS** |
| U7 — spin/derived anchors | Active spin tip/base/grab, finite trails, rings, portal launch ground, and fall-top anchors translate; camera framing remains independently owned. | **PASS** |
| U8 — false-event prevention | `_pcy` translates with Finn, preventing an artificial swept pickup; Browser M2 preserves collection, floater, and portal counts across collapse/restore; tutorial ownership prevents a main-world double shift. | **PASS** |

## Browser evidence audit

Browser execution was performed by the PM/CTO in the Codex in-app Browser against the exact game,
bridge, harness, focused-test, verifier, and server hashes recorded above. Independent QA inspected
the exact harness/bridge source and adjudicated the supplied results; it did not replace Browser
evidence with a CLI or headless substitute.

- Expanded harness: **25/25 PASS, 0 FAIL, 0 PENDING**.
- F1-F7, M1-M2: all passed at the 390×844 flow viewport.
- C1-C4: all passed at 390×844, 390×667, 390×468, and 390×340.
- No captured runtime failure.
- Fresh non-QA direct game at **375×667**: real DOM cinematic Skip click → premise Continue → real
  canvas movement-Skip coordinate tap → Home Market: **PASS**.
- Fresh non-QA direct game at **390×844**: same real-control path: **PASS**.

### B1-B5 adjudication

| Browser contract | Result | Basis |
|---|---|---|
| B1 — exact identity and legacy regression | **PASS** | Exact fingerprints matched; expanded 25/25 includes the prior F1-F7/C1-C4 coverage. |
| B2 — fresh non-QA real controls | **PASS** | Both required phone sizes reached Home Market through the actual cinematic and movement controls without QA boot. |
| B3 — nonzero inset geometry/hit ownership | **PASS** | M1 applied top 47/right 21/bottom 34, verified `CQVIEW` values, DOM Skip at the expected inset, `elementFromPoint` ownership, Enter safe bottom, and movement draw/hit geometry. Actual zero-inset clicks in B2 exercise the unchanged handlers; shared geometry and M1 hit ownership close the synthetic-inset seam. |
| B4 — dynamic viewport ownership | **PASS** | M2 exercised 844→667→844 grounded main-world geometry and 844→390→844 active tutorial ownership; no collection, floater, portal, state, or canvas-backing drift. VM contracts cover delayed recovery and derived terrain anchors. |
| B5 — visual/backing sanity | **PASS for automated boundary** | F1 validated CSS/backing dimensions using effective DPR; Browser flows remained visible and interactive. True physical DPR3 heat/performance remains outside this claim. |

## Residual Founder/device boundaries

These are explicit boundaries, not hidden passes:

- Physical Safari notch/Dynamic Island, collapsing address bar, home indicator, touch feel,
  audio/haptics, and subjective readability.
- Real-device `env(safe-area-inset-*)` behavior; automation uses a deterministic nonzero CSS fixture.
- True physical DPR3 heat, sustained FPS, memory pressure, and battery behavior.
- Global HUD/modal safe-area migration and historical 28-30px controls outside the first-session seam.
- Secondary-canvas DPR behavior.
- `/play` wrapper, manifest/PWA/service-worker/cache topology, online survey submission, and
  production-served fingerprint.
- A full subjective mobile playthrough beyond the automated Home Market handoff.

These boundaries are appropriate for **Founder mobile retest**, but they prevent any production or
broad beta-release claim from this handoff alone.

## Final decision

The exact Build 363 candidate is **READY FOR FOUNDER MOBILE RETEST**.

Founder checklist:

1. Open the supplied local Build 363 mobile URL on the intended phone.
2. Confirm the opening Skip and Enter controls clear the notch/status and home-indicator areas.
3. Use movement Skip, then play through the first real trade and manual profitable close.
4. Collapse/restore browser chrome or rotate once and confirm Finn stays attached to the chart.
5. Confirm the replay/details X works and the manual close says Finn closed it himself and kept the profit.

Any change to an evidence-bound game artifact, bridge, harness, focused suite, verifier, or QA server
invalidates this verdict and requires new hashes plus proportional reruns. Documentation-only
closeout may record this verdict without changing the evidence-bound fingerprints.
