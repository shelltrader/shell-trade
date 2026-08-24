# Build 371 — Preview QA Evidence

**Date:** 2026-08-24
**Status:** **SERVED PACING P0 PASS — RELEASE HELD BY DEVICE/CREDENTIAL MATRIX GAPS**

## Candidate and Preview identity

- Runtime repair payload: `3019058b32c6acddc8fc5530569f24d95c76a98f`.
- Preview control-plane source: `f311dfa0375305ce08c2d4af06a72f30356f2fd3`.
- Preview branch: `codex/beta370-player-paced-trades`.
- Cloudflare Pages deployment: `1c56b4ee-a726-4116-8e4c-cc6450b6f7cd` (success).
- Deployment route: `https://1c56b4ee.chartquest.pages.dev/game`.
- Branch-alias route used for the independent fresh-origin guide run:
  `https://codex-beta370-player-paced-t.chartquest.pages.dev/game`.
- Served `/game` SHA-256 on both routes:
  `3224c603255ee5d1210295b31151f7de04ca6c3b2a211b158f14627b76a0ab09`
  (`2212400` bytes), exactly matching source/root/site Build-371 artifacts.
- The Preview-only `0003_beta_survey_research.sql` migration was already applied and was not
  reapplied.
- Local and remote `main` remain `8c858aabd27aa0c4032fef9599d958735d959283`; Build 367 remains
  the documented production release.

This record covers only the non-production Preview. No production route, database, provider
configuration, `main` ref, tester cohort, or tester link was changed.

## Executed checks

| Check | Result | Evidence |
|---|---|---|
| Exact served artifact | **PASS** | Deployment route and branch alias both returned the approved Build-371 `/game` hash and byte count above. |
| Local regression/static gates | **PASS** | Player pacing 13/13, teaching UI 5/5, full verifier 27 pass / 0 fail / 0 warn / 1 optional Puppeteer skip, byte parity, and two independent final approvals. Production release controls remain unexecuted. |
| Post-evidence control-plane verification | **PASS** | With only documentation changed from the already-verified game HEAD, `scripts/verify.js` returned 25 pass / 0 fail / 0 warn / 3 expected skips: optional Puppeteer plus build-tag/protected-diff checks marked N/A because the game is unchanged versus HEAD. |
| Ordinary first-session route at 390×844 | **PASS (scoped)** | Two fresh-origin runs traversed opening, Home Market candle bridge, movement teaching, candle lesson, two prediction rounds, first setup, and first-trade guide without a developer shortcut. |
| First-trade guide content and exits | **PASS (scoped)** | All four Entry/Stop/Target/Control pages rendered. The final page said `Reveal one candle at a time` and `Finn waits after each one`. Escape dismissed the direct-deployment guide; the visible × dismissed a separate branch-alias guide. Both routes remained idle afterward. |
| Guide scroll owner | **PASS — configuration; no overflow displacement required at this viewport** | On exact Build 371 at 390×844, `#cqTradeGuideScroll` computed `overflow-y:auto` and `touch-action:pan-y`. Its final-page `scrollHeight` and `clientHeight` were both 172 px, so all copy fit and a displacement gesture was not necessary. The older Build-370 Preview had separately accepted a real scroll gesture; this record does not relabel that older gesture as a Build-371 device result. |
| Guide freeze | **PASS (scoped)** | Entry/stop/target labels and chart state remained unchanged while the multi-page guide owned the screen. |
| Original Escape/idle P0 reproduction | **PASS — DEFECT NOT REPRODUCED** | Immediately after Escape, the live close state was `+0 Safe profit`; with no input for 5.6 seconds it remained exactly `+0`. |
| One explicit action / one visible resolved update | **PASS** | One deliberate forward action moved through the next wall/boundary and changed the live close state once, from `+0` to `+1`. Another 5.6 seconds with no input remained exactly `+1`; the byte-identical 13/13 production-geometry contract is the raw frontier/path-delta proof. |
| Backtrack and idle | **PASS (scoped)** | One `A` action moved Finn backward while resolved P&L remained `+1`; another 5.4 seconds with no input remained `+1`. |
| Manual Close, replay truth, and free roam | **PASS** | Manual Close banked `+1`. The recap stated `CLOSED EARLY +1 shells` and `You closed it yourself and kept the profit`; replay rendered the bounded path. Ordinary free-roam visibly resumed afterward without another movement command. |
| Automatic long terminal path | **PASS — TP/WIN** | The next ordinary setup opened a long. Deliberate candle steps reached the authored automatic endpoint; Wallet recorded `▲ LONG +10 SHELLS`, leaving two trades, 100% wins, and net `+11`. Replay completed. |
| Automatic short terminal path | **PASS — TP/WIN** | The third ordinary setup opened a short. Deliberate candle steps reached Take Profit; details recorded `▼ SHORT`, `WIN +10 shells`, `TARGET HIT`, and `Price went DOWN and hit your Take Profit.` |
| Trade-time world suppression | **PASS (observational) / local contract remains canonical** | No shell/box/page/portal/world reward spawned in the exercised live long or short paths. The exact-source 13/13 suite remains the exhaustive owner for event/pruning suppression. |
| Survey Q1–Q7 confirmed-write receipt | **PASS** | Exact Build 371 completed all seven steps and displayed the thank-you state after Q6 `gamer_not_trader`, Q7 `probably`, and a blank optional Q5. The client exposes success only after a response-specific `chartquest-beta-survey-v2` receipt matches response id plus stored Q6/Q7. This is served API receipt evidence; no separate Build-371 D1 row query is claimed. |
| Controlled invite capture and D1 ingest | **PASS (scoped)** | Internal pair `b371-beta100` / `i-M2B7D9K2Z9W6T7K8` was captured and stripped from the exact branch-alias URL. A token-filtered Preview D1 read returned four rows for one pseudonymous session; the exact-game row carries `build=371`, and every row carries the pair. No tester link was sent. The shared browser identity had earlier QA history, so fresh-entry cohort freezing/dashboard display is not inferred. |
| Founder Access deny | **PASS** | Preview `/founder/beta.html` without an Access JWT returned `{"error":"Forbidden"}` / HTTP 403 behavior. |
| Current service-worker artifact | **PASS (scoped)** | Served `sw.js` contains `chartquest-site-v17`. This proves the candidate worker version, not an old v16-to-v17 returning-client upgrade. |

## Still unverified / release blockers

- A real physical-phone pass, including true app background/resume, touch/gesture feel, audio/haptic
  behavior, and subjective Founder acceptance. The in-app browser cannot make its controlled page a
  true hidden mobile tab; exact-source background cancellation is covered locally but is not
  misreported here as live-phone evidence.
- Automatic Stop Loss/loss terminal paths for both long and short. Served automatic TP paths for both
  directions and manual Close passed; a win is not evidence of the opposite terminal outcome. The
  ordinary deterministic loss is Level 2's second trade, the eighth committed trade overall, and it
  is once per browser storage context. Both directions therefore require two clean full-progression
  contexts; no developer flag or state injection may substitute for those served paths.
- A Build-371 guide overflow gesture on a viewport where overflow is actually present. The exact
  390×844 copy fit; the scroll owner and touch policy are present.
- Founder Access allow, private cohort/research dashboard views, and CSV/export. No Access JWT was
  forged and no protected export was downloaded.
- Fresh-player entry-cohort freezing and the Access-private Founder cohort view. Controlled served
  capture/validation/D1 persistence passed, but the browser identity had earlier QA history. A
  tester cohort and tester links remain prohibited until release approval.
- A genuine returning v16 service worker upgrading to v17, plus fresh-cache/old-client behavior.
- Residual provider/rollback gates: Production `0003`; authenticated Founder checks; account/data
  rollback compatibility; and post-promotion confirmation that exact Build-367 deployment
  `38d166bd...` exposes `Rollback to this deployment`. Environment bindings, required-secret
  presence, Access issuer/audience coherence, the static target hash, and Cloudflare's historical
  rollback control already pass their scoped audits.
- Release manifest, release lock, release-control pass, explicit final production authorization,
  `main` push, production deployment, double production fingerprint, and tester-link send.
- Historical Supabase-to-Cloudflare application-data reconciliation remains separate and incomplete;
  no recovered archive was changed.

## Decision and next safe action

The exact served Build-371 candidate closes the specific Build-370 idle/P&L P0 on Preview and passes
the exercised engineering browser matrix. It is **not release-ready** because the physical-device,
true background/returning-worker, automatic-loss, fresh-entry cohort view, Founder allow/dashboard/
export, Production migration, and account/data rollback gates are incomplete.

Do not prepare or sign a production manifest/lock, push `main`, deploy production, or send tester
links yet. Keep Preview migration `0003` in place and do not reapply it to Preview. Complete the
listed Founder/device/credential gates on this exact deployment first; only then run the
release-control and authorization sequence. Production requires its own authorized one-time `0003`
application before Functions. A release-authorized tester cohort is a later, separate action. After
any future production deployment, verify the production fingerprint twice before sharing links.

See `handoffs/BETA371_PROVIDER_ROLLBACK_AUDIT.md` for the provider, attribution, Production schema,
Access, and rollback evidence.
