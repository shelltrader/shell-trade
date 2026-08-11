# Beta-360 Readiness Implementation

## TASK

Close the confirmed beta-360 readiness blockers in the isolated `codex/beta-360-readiness`
worktree, add durable executable and rendered-browser regression coverage, and present one exact
candidate for independent Review/QA. No staging, commit, integration, push, deployment, provider,
credential, production, or `main` action was authorized.

## OBJECTIVE

1. Keep every `CQSAFE` public entry point non-throwing for malformed or hostile input.
2. Give sticky `cfLegend` state one teardown owner and keep its maximum Level-10 layout clear on
   390px-wide screens down through 340px height.
3. Use the canonical inclusive `|delta| <= 0.5` break-even rule on every persisted and immediate
   manual-close display without changing trade economics, scoring, mastery, XP, or authored outcomes.
4. Keep replay X, ticket/notice ordering, and box/page trade-time lifecycles reachable and fail-closed.
5. Make the exact third guided trade own its auto-review from synchronous scheduling through visible
   replay/details and intentional close, so the prove/THE LIE transition cannot cover or bypass it.
6. Lock the behavior into focused tests, repository verifier gates, and a local-only visible Browser
   harness covering F1-F7 plus all 16 C1-C4 geometry/lifecycle cells.
7. Keep `chart-quest.html`, `index.html`, and `website/game.html` byte-identical.

## CURRENT STATE

Implementation is complete but intentionally **uncommitted and unstaged** on base
`b8b3457e727576722912686f104f721bd4d84b3e`. Served-code changes advanced the candidate from build
360 through build 361 to **build 362**. All three game artifacts are byte-identical at SHA-256:

`d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b`

Focused/source tests, server/bridge contracts, syntax, protected-system checks, artifact parity,
release-control tests, and the full verifier are green. PM/CTO's definitive in-app Browser run on
the exact build-362 artifact above and bridge SHA-256
`52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf` passed **23/23**:
F1-F7 plus C1-C4 at 390 x 844, 667, 468, and 340, with 0 failures and no fatal, runtime, or
captured-console errors. F5 exercised the exact affected lifecycle using the genuine auto-replay
and intro-wait owners, visible replay/details, a hold past the retired 2.2-second race, real central
X close, token release, and downstream prove reachability.

The full unforced fresh Level-1 flow was completed on build 361; that run found INV-003. It was not
repeated end-to-end after the build-362 correction. The exact affected lifecycle was rerun on build
362 through the definitive Browser F5 case described above. This boundary is explicit so the
23/23 build-362 matrix is not misrepresented as a second full unforced playthrough.

This handoff is implementation evidence, not a release authorization. Production remains frozen.

## WORK COMPLETED

- Contained throwing rectangle getters inside `CQSAFE.place()`'s defensive boundary.
- Added `hideReviewLegend()` and `closeReviewChart()` as the shared teardown path for review,
  replay, Journal, tutorial fallback, and tutorial-thaw exits. It stops replay, clears chart/predict
  state, hides the legend, clears sticky `CQSAFE.cfLegend`, clears review state, and resets the
  auto-details latch.
- Added display-only `tradeOutcomeDisplay()`. It retains the three exit reasons
  `win | loss | manual` and applies the same inclusive break-even band as `resolveTrade`:
  `Math.abs(delta) <= 0.5` is neutral, signless, and displayed/stored as zero.
- Normalized Journal persistence inside that inclusive neutral band so JavaScript rounding cannot
  turn persisted `+0.5` into a win. Routed Journal rows, stats, note labels/options, summary, replay,
  intermission, and immediate post-trade copy through the classifier.
- Kept generic win/loss teaching and first-loss reassurance exclusive to genuine `win`/`loss`
  resolution. A manual close no longer queues target-hit/stopped-out teaching.
- Rendered an empty AVG LOSS as neutral `0`, not red `−0`.
- Made TRADE INCOMING terminally obsolete while a ticket is pending/open or a live trade owns the
  screen; `hideTradeIncoming()` also cancels any delayed retry. Both event orders are covered through
  ticket commit/close so a stale notice cannot resurface during the trade.
- Made the review legend one horizontally scrollable row. `cfTopInset(VW,VH)` now converts measured
  CSS height using the limiting rendered axis and caps inset to preserve positive chart height.
  Level-10 maximum legend geometry is covered at 390 x 844, 667, 468, and 340.
- Preserved an operable replay close target: the legend background passes pointer hits through,
  legend buttons remain interactive, and the scoped replay X retains higher stacking priority.
- Added a tokenized post-trade review owner. `autoOpenTradeReplay()` creates the token synchronously;
  `resolveTrade()` hands the exact third-trade token to `waitThenIntroBoss()`; `closeReviewChart()`
  completes the open token. Older/newer pollers cannot clear one another.
- Made the guided third-trade token required and fail-closed. Its ordinary 12-second idle and
  120-second absolute budgets cannot release prove/THE LIE. A blocker or failed review open keeps
  retrying until the exact review opens and closes. Missing replay data creates a sentinel that can
  be released only by explicit intro reset/abort.
- Replaced the detached 2.2-second prove timer with a polled clear window. Normal pacing still gets
  the same 2.2-second breathing beat after intentional review close; the 18-second fallback can
  shorten that post-review beat but can never bypass a pending/open required review.
- Added a 16-case focused `CQSAFE`/readiness suite and fail-closed verifier gate #22. The INV-003 case
  executes exact extracted lifecycle functions with deterministic timers across real order, delayed
  blockers, both timeout ceilings, failed open, missing token, X/central close, and reset/abort.
- Added the dependency-free, loopback-only Browser QA server, visible harness, guarded same-origin
  bridge, F1-F7 flows, 16 C1-C4 cells, fail-closed error capture, and verifier gate #23.
- Extended the Browser flow to exercise genuine trade-3 auto replay -> real replay -> visible details,
  prove/THE LIE hold, real X close, token release, and downstream prove reachability.
- Isolated Browser fixtures from replay timers, completion overlays, effects, coins, boxes, pages,
  portals, and prior wisdom state without changing canonical gameplay paths.
- Advanced `BUILD_TAG` to build 362 and regenerated both served mirrors through the project workflow.

## FILES CHANGED

Implementation/automation paths:

- `chart-quest.html`
- `index.html`
- `website/game.html`
- `scripts/cqsafe.test.js`
- `scripts/verify.js`
- `.chartquest/qa/BETA360_BROWSER_HARNESS.html`
- `.chartquest/qa/beta360-bridge.js`
- `scripts/beta360_qa_server.py`
- `.chartquest/handoffs/BETA360_IMPLEMENTATION.md`
- `.chartquest/handoffs/BETA360_AUTOMATION_IMPLEMENTATION.md`

Command-center/Investigator/QA paths in the shared worktree are separately owned and must be staged
only by explicit pathspec:

- `.chartquest/ACTIVE_SPRINT.md`
- `.chartquest/handoffs/BETA360_INVESTIGATION.md`
- `.chartquest/handoffs/BETA360_AUTOMATION_INVESTIGATION.md`
- `.chartquest/handoffs/BETA360_BROWSER_QA.md` (when final QA evidence is recorded)

Do not use `git add -A` in this shared worktree.

## DURABLE COVERAGE

The focused suite covers:

1. reserve/get/clear lifecycle;
2. degenerate and non-finite rectangles;
3. one-frame staleness and expiry;
4. sticky survival and explicit release;
5. SOFT/NORMAL/HARD priority behavior;
6. bounds and wide-rectangle vertical fallback;
7. malformed input and throwing getters across every public entry point;
8. maximum review-legend measurement, two-axis inset, positive chart height, one-row layout,
   pointer routing, render order, and hidden-state clear;
9. open-trade chip versus price/wallet at 844, 667, 468, and 340px heights;
10. `THIS WAY` versus the price axis across a 4-height x 3-card-line matrix;
11. ticket/TRADE INCOMING convergence in both orders, including delayed-retry cancellation;
12. every sticky review close lifecycle;
13. positive, negative, and inclusive `-0.5..+0.5` manual outcome classification plus end-to-end
    Journal persistence/display and immediate/persisted copy contracts;
14. replay X reachability, pointer ownership, auto-details, and central teardown;
15. box/page trade-time deferral without deletion or duplicate rewards;
16. exact trade-3 auto-review ownership, required timeout/open-failure/missing-token fail-closed
    behavior, no prove/THE LIE/practice over review, close pacing, and abort cleanup.

No curriculum, save keys, Finn/movement configuration, boss engine, trade economics/resolution,
authored outcomes, mastery/XP, provider configuration, credentials, or deployment behavior changed.

## TESTS

- `node scripts/cqsafe.test.js` — **PASS, 16/16**.
- Focused-suite disposable corrupted fixture — expected FAIL, nonzero exit.
- `node scripts/check_syntax.js chart-quest.html` — **PASS**, 10 inline scripts.
- `node --check .chartquest/qa/beta360-bridge.js` — **PASS**.
- Python AST parse for `scripts/beta360_qa_server.py` — **PASS**.
- `python3 scripts/beta360_qa_server.py --self-test` — **PASS** against the exact artifact SHA above.
- Harness inline JavaScript syntax — **PASS** through verifier gate #23.
- `git diff --check` — **PASS**.
- `node scripts/verify.js` — **PASS: 24 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip**.
- Verifier gate #7 — **PASS**, build 360 -> 362.
- Verifier gate #8 — **PASS**, all three game artifacts byte-identical.
- Verifier gate #10 — **PASS**, protected systems unchanged.
- Verifier gate #22 — **PASS**, 16/16 focused contracts.
- Verifier gate #23 — **PASS**, bridge/harness syntax and server self-test.
- `node scripts/release_control.test.js` — **PASS, 15/15**.
- `node scripts/artifact_parity.test.js` — **PASS, 5/5**.
- Prior build-361 in-app Browser F1-F7 + 16-cell matrix — **historical PASS, 23/23**, superseded
  as acceptance evidence for changed build-362 bytes.
- Full unforced fresh Level-1 flow on build 361 — **completed**; it exposed INV-003 and therefore
  does not prove the correction.
- Definitive build-362 in-app Browser F1-F7 + 16-cell matrix — **PASS, 23/23; 0 fail** at artifact
  SHA `d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b` and bridge SHA
  `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`; no fatal, runtime, or
  captured-console errors.
- Build-362 F5 affected-lifecycle rerun — **PASS**: genuine auto replay -> exact token-owned
  replay/details -> hold beyond the former 2.2-second race -> real central X -> token release ->
  downstream prove.
- Full unforced fresh Level-1 flow on build 362 — **not repeated end-to-end**; independent QA may
  retain this as a bounded follow-up rather than treating the harness result as that playthrough.

## REGRESSION RESULTS

All static and local executable gates are green. The canonical source and both served mirrors have
the same bytes. The QA server hashes but never rewrites the canonical artifact and blocks external
connections with a local-only CSP/stub. No package was installed and no provider, credential,
production, deployment, Git index, branch, or release state was touched.

Rendered Browser evidence is green for the exact build-362 bytes: **23/23 PASS, 0 FAIL**, with all
F1-F7 and 16 C1-C4 cells green and no fatal, runtime, or captured-console errors. In particular, F5
proved the corrected real-order lifecycle from auto-replay scheduling through visible details,
race hold, central X, token release, and downstream prove.

The evidence boundary remains important: build 361 received the full unforced fresh Level-1 run
that exposed INV-003; build 362 received the exact affected-lifecycle rerun inside the real local
Browser artifact, not a second full end-to-end unforced playthrough.

## KNOWN RISKS

- The guided third-trade review intentionally fails closed. A persistent blocker keeps a controlled
  200ms poll alive until the screen clears; explicit intro reset/abort cancels the exact token and
  poller. This trades silent curriculum overlap for visible, recoverable waiting.
- Missing replay data also fails closed instead of silently spawning THE LIE. The existing trade
  snapshot fallback should prevent this in normal play; the sentinel is the corruption backstop.
- The harness uses a disposable random-port loopback origin. Harness/bridge code does not access
  storage, while genuine game boot and journal paths retain normal storage behavior inside that
  disposable origin.
- The definitive C2 rendered acceptance cell uses the Level-1 beginner trade chip. The longer
  Level-5+ RISK/TARGET chip remains a documented post-beta geometry case; focused coverage still
  locks the four beta viewport heights and the current beta acceptance path.
- The full unforced Level-1 journey was not repeated end-to-end on build 362. Its exact INV-003 seam
  was rerun and passed through the genuine build-362 Browser lifecycle; independent QA may retain a
  second complete unforced run as a bounded follow-up.
- Representative physical Safari touch, safe-area/address-bar behavior, DPR 2/3, audio/haptics,
  performance/heat, and subjective readability remain Founder/device checks after automated QA.
- Player-close versus forced-hour-close semantics at L4+ remain explicitly deferred. This work
  changes display classification only and does not alter resolution semantics.
- The embedded CQOPS stamp was refreshed before candidate commit at
  `2026-08-11T18:11:35Z` and correctly names parent `b8b3457e72`; the format intentionally cannot
  name the commit that contains it. Any later release package must start from the committed
  candidate, stamp before a separate packaging commit, regenerate mirrors, and rerun all hash-bound
  gates.

## NEXT ACTION

1. Record the definitive 23/23 build-362 Browser matrix and its F5 lifecycle evidence in the
   QA-owned durable handoff.
2. Reviewer/QA reruns read-only gates against the frozen bytes and issues PASS/PASS WITH ACTION/FAIL,
   explicitly adjudicating whether a second full unforced Level-1 run is required before Founder test.
3. Only an all-green adjudication may become **BUILD READY FOR FOUNDER TEST**.
4. Any later release packaging/review remains separate. Do not push, merge, deploy,
   modify `main`, or remove the production freeze in this task.

## DO NOT TOUCH

- Do not stage all shared-worktree changes or overwrite concurrent command-center evidence.
- Do not change curriculum content, gameplay economics, trade resolution, authored outcomes,
  mastery/XP, save keys, Finn/movement, boss engine, providers, or credentials.
- Do not push, merge, deploy, modify `main`, remove the release freeze, or access production.
- Do not treat this uncommitted handoff or a local build label as release evidence.
