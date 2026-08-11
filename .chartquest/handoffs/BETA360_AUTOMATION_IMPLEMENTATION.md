# Beta-360 Browser Automation Implementation

## TASK

Implement the approved durable, dependency-free, local-only browser QA system for the beta-360
readiness candidate. The system must exercise the real ChartQuest artifact through a same-origin
iframe without changing canonical artifact bytes, contacting providers, reading credentials,
deploying, or touching production.

## OBJECTIVE

1. Serve only the exact game/harness asset allowlist from a random loopback port with no caching.
2. Block all external connections and replace the one external Supabase library tag in memory only.
3. Refuse the QA bridge outside a same-origin loopback development/QA iframe.
4. Render visible expected/actual/PASS/FAIL/geometry/error evidence for F1-F7 and the 16-cell
   C1-C4 matrix at 390 x 844, 667, 468, and 340.
5. Exercise the genuine trade-3 auto-review ordering through replay/details, prove/THE LIE hold,
   real X close, and downstream release.
6. Provide a separate safe URL for one unforced fresh run; never combine `fresh=1` and `qa=1`.

## CURRENT STATE

The local automation implementation is complete but intentionally **uncommitted and unstaged**.
Python, bridge, harness JavaScript, focused source contracts, parity, release controls, and the full
verifier pass against byte-identical build-362 game artifacts at SHA-256:

`d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b`

The definitive build-362 random-port Browser run passed **23/23, 0 FAIL** at the artifact SHA above
and bridge SHA-256 `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`.
It covered F1-F7 plus C1-C4 at 390 x 844, 667, 468, and 340 with no fatal, runtime, or
captured-console errors. F5 exercised the genuine auto replay, reached visible details, held prove,
THE LIE, and practice while the exact token owned the review, closed through the real central X,
released the token, and proved downstream progression after the existing breathing beat.

The full unforced fresh Level-1 flow was completed on build 361 and exposed INV-003. Build 362 reran
the exact affected lifecycle through F5, but it did not receive a second full end-to-end unforced
playthrough. That boundary is retained honestly in this handoff.

## WORK COMPLETED

- Added a dependency-free Python server bound only to `127.0.0.1`; port `0` is the default.
- Added strict path normalization, file allowlisting, hidden/secret path denial, no-store headers,
  same-origin response headers, and a `connect-src 'none'` CSP.
- Added an in-memory QA response rewrite that replaces the exact Supabase CDN tag with a local inert
  stub, injects early runtime/console-error capture, and publishes the untouched canonical SHA-256.
- Added strict, mutually exclusive game query modes:
  `qa=1&mute=1` for automation or `fresh=1&mute=1` for the separate unforced run.
- Added a same-origin visible-report harness with Run all, F1-F7, and 16-cell matrix controls.
- Added a narrow bridge that refuses non-loopback, non-HTTP, non-development, non-QA,
  top-level, cross-origin, or `fresh=1` contexts.
- Added accumulated and per-case fail-closed evidence for runtime errors, unhandled rejections, and
  captured `console.error` calls.
- Added deterministic fixture isolation so trade-replay pollers, first-win timers, effects,
  completion overlays, coins, portals, prior wisdom state, and world state cannot contaminate later cells.
- Implemented real-path coverage for trade commit, positive/negative/flat manual close, authored
  stop touch, genuine auto replay, X hit/teardown, and box/page deferral and exactly-once rewards.
- Linked F5/F6 to the real build-362 trade-3 order: genuine `autoOpenTradeReplay(record)` followed by
  `waitThenIntroBoss(token)`, real startReplay-to-details, a hold longer than the retired blind 2.2s
  race, no THE LIE/practice while the token owns the chart, real X hit, token release, and prove reachability.
- Implemented maximum-Level-10 C1 evidence, including all four toggles plus REPLAY, one-row legend,
  positive chart height, DOM/registry agreement, and headline/badge clearance.
- Added deterministic X hit-target evidence, including the hit element, id/class, stacking values,
  pointer-event values, button rectangle, and complete review/legend/replay teardown state.
- Made F7 select two genuinely absent wisdom indices and prove reveal-then-collect and exactly-once
  shell/collection behavior without an intervening game-loop frame.
- Updated runtime identity expectation to build 362.

## FILES CHANGED

Automation-owned paths:

- `.chartquest/qa/BETA360_BROWSER_HARNESS.html`
- `.chartquest/qa/beta360-bridge.js`
- `scripts/beta360_qa_server.py`
- `.chartquest/handoffs/BETA360_AUTOMATION_IMPLEMENTATION.md`

The game artifacts, focused suite, verifier, sprint state, and investigation handoffs are concurrent
core/PM paths. Do not use `git add -A`.

## IMPLEMENTATION

The server serves only the canonical game, exact QA files, known root media/assets, `finn/`,
`bosses/`, an inert local Supabase stub, an exact `/survey.html` mapping, and an inert service worker.
`.git`, `.codex`, `.env`, credential/token/private-key names, unrelated scripts, packages, traversal,
backslashes, and unrecognized paths are denied. The canonical game file is read and hashed but never
rewritten on disk.

The harness itself and bridge do not call Storage, IndexedDB, cookies, providers, production URLs,
or arbitrary evaluation. Genuine ChartQuest boot and trade/journal paths do use their normal local
storage APIs; this is safely contained by a unique random-port disposable origin.

The bridge does not expose `resolveTrade('loss')`. F4 drives the authored loss candle and proves the
real `CQ.priceTouched` / `tradeTouchCheck` stop path. Fixture trade resolution temporarily captures
the normal auto-replay request so later cases cannot inherit a stale poller. F5/F6 then invoke the
genuine review and intro-wait owners in production order and exercise the real rendered lifecycle.

## TESTS

- `python3 -c 'import ast; ast.parse(open("scripts/beta360_qa_server.py", encoding="utf-8").read())'` — PASS.
- `node --check .chartquest/qa/beta360-bridge.js` — PASS.
- Extracted harness inline JavaScript with `node --check` — PASS.
- `python3 scripts/beta360_qa_server.py --self-test` — PASS against the exact SHA above.
- Server self-test covers loopback/random-port defaults, CSP, no disk mutation, exact source hash,
  offline CDN rewrite, early console capture, strict QA/fresh query separation, exact survey mapping,
  allowlist/denials, storage-free harness/bridge contracts, bridge guards, and genuine stop seams.
- Core focused suite — PASS, 16/16.
- Canonical inline syntax — PASS, 10 script blocks.
- Game artifacts — byte-identical at the exact SHA above.
- `node scripts/verify.js` — PASS: 24 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip.
- `node scripts/release_control.test.js` — PASS, 15/15.
- `node scripts/artifact_parity.test.js` — PASS, 5/5.
- Prior build-361 in-app Browser run — historical PASS, 23/23; superseded as acceptance evidence
  for changed build-362 bytes.
- Full unforced fresh Level-1 flow on build 361 — completed; it exposed INV-003.
- Definitive build-362 in-app Browser run — **PASS, 23/23; 0 fail** at artifact SHA
  `d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b` and bridge SHA
  `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`; no fatal, runtime, or
  captured-console errors.
- Build-362 F5 affected-lifecycle rerun — **PASS** through genuine auto replay, exact token-owned
  details, hold beyond the former race, real central X, token release, and downstream prove.
- Full unforced fresh Level-1 flow on build 362 — not repeated end-to-end.

## REGRESSION RESULTS

Static/local contracts are green. No canonical artifact bytes are modified by the server. No package
was installed, no external network action was taken, and no provider, credential, production,
deployment, Git index, branch, or release state was touched by this implementation.

Rendered Browser evidence is green for the exact build-362 artifact and bridge: **23/23 PASS,
0 FAIL**, with F1-F7, every 4-height C1-C4 cell, and all runtime/console fail-closed checks green.
The exact INV-003 seam passed in F5 through production-order owners and the real rendered X lifecycle.
This is not represented as a second complete unforced Level-1 journey; that longer end-to-end run
was completed only on build 361, where it found the defect.

## KNOWN RISKS

- A second full unforced `fresh=1&mute=1` journey was not completed on build 362. The exact affected
  seam did pass through the genuine build-362 F5 lifecycle; independent QA may retain the longer run
  as a bounded follow-up.
- C2's definitive rendered acceptance uses the Level-1 beginner trade chip. The longer Level-5+
  RISK/TARGET chip remains a documented post-beta geometry case.
- The harness dispatches the real controls/events in the same-origin game document; representative
  physical Safari touch, safe-area/address-bar behavior, DPR 2/3, audio/haptics, performance/heat,
  and subjective readability remain Founder/device checks after automated QA passes.
- The runtime build number is 362. The embedded CQOPS stamp was refreshed before candidate commit
  and correctly identifies parent `b8b3457e72`; future release packaging must stamp before its own
  separate commit and rerun hash-bound QA.

## NEXT ACTION

1. Record the definitive 23/23 evidence, exact hashes, geometry, errors, and F5 lifecycle result in
   `.chartquest/handoffs/BETA360_BROWSER_QA.md`.
2. Rerun frozen static gates and have independent QA adjudicate whether the second full unforced
   Level-1 journey is required before Founder test or may remain a bounded follow-up.
3. Only independent all-green QA may advance to candidate commit/release review and the
   small Founder checklist.

## DO NOT TOUCH

- Do not weaken the loopback bind, CSP, allowlist, query separation, or bridge guards.
- Do not add a package, browser driver, production URL, provider call, credential read, or storage
  shortcut to make a case pass.
- Do not change gameplay economics, authored outcomes, curriculum content, save keys, Finn/movement,
  boss engine, providers, deployment controls, or release policy from this harness task.
- Do not stage all shared-worktree changes, push, merge, deploy, modify `main`, or treat this
  implementation handoff as final browser/release evidence.
