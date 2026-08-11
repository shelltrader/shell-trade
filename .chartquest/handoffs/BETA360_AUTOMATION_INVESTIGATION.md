# Beta 360 Automated-Playtest Investigation

**Candidate reviewed:** `b8b3457e727576722912686f104f721bd4d84b3e`
**Decision:** **INVESTIGATION PASS — AUTOMATION IMPLEMENTATION REQUIRED**

## Executive result

Build 360 has internal seams for deterministic beta-path automation, but the existing dev-only `?qa=1` bridge only supports boot, levels, lessons, bosses, and player-state changes. It cannot currently drive real trade setup/resolution, replay state, box/page fixtures, X hit-testing, or CQSAFE scenarios.

The approved execution design is a loopback-only same-origin HTML harness exercised through the Codex in-app Browser. It must not use standalone Chrome/CDP/Playwright, production URLs, package installation, or direct browser-storage access.

## Evidence run

- Full verifier: 20 pass, 0 fail, 0 warn, 3 allowed skips.
- Exact CQSAFE core extracted from the candidate and exercised unchanged: API, hard-zone placement, left-only price-ladder avoidance, SOFT-priority fallback, one-frame staleness, and sticky persistence all passed (6/6).
- This proves pure registry mechanics, not rendered collision behavior.

## Critical URL rule

Never combine `fresh=1` with `qa=1`: the synchronous fresh-state handler removes `qa` before the later QA bridge initializes. Use `?qa=1&mute=1` on a unique loopback origin. A random port supplies a disposable origin without the harness reading or clearing storage.

## Required durable automation

### Files

- `.chartquest/qa/BETA360_BROWSER_HARNESS.html`
- `.chartquest/qa/beta360-bridge.js`
- A small loopback-only QA server script.
- Execution handoff: `.chartquest/handoffs/BETA360_BROWSER_QA.md`.

### Server and isolation contract

- Bind only to `127.0.0.1` on an OS-selected port.
- Send `no-store` and a QA CSP with `connect-src 'none'`.
- Serve only allowlisted candidate/game assets and exact QA harness files; deny `.git`, `.env`, secrets, nested worktrees, and unrelated hidden paths.
- The harness never reads/writes storage, cookies, IndexedDB, providers, or production URLs.
- The game iframe loads `chart-quest.html?qa=1&mute=1` same-origin.

### Bridge contract

The same-origin test bridge must refuse initialization unless the host is loopback, `_CQ_DEV` is true, `window.QA` exists, and parent/game origins match. It may expose only narrow fixture, action, snapshot, and cleanup operations. The real stop case must flow through the genuine candle-touch path; direct `resolveTrade('loss')` is not accepted as stop-loss evidence.

## Seven required flow cases

| ID | Case | Required evidence |
|---|---|---|
| F1 | Boot | Build 360 identity, canvas dimensions, QA/dev guard, auth/faction walls absent, no uncaught error. |
| F2 | Trade open | Genuine commit path produces an in-bounds open trade, visible close control, closed ticket, and active trade predicate. |
| F3 | Manual-profit close | In-app Browser presses the visible close button; record is manual/positive, replay exists, truthful manual wording appears, and no stop-loss claim appears. |
| F4 | Real stop | Authored loss candle genuinely touches SL through the real touch check; record is loss/negative with stop-loss wording. |
| F5 | Replay to details | Real auto-details replay opens, contains candles, completes within a bound, and ends in details with summary visible. |
| F6 | X hit and close | X-center `elementFromPoint()` returns `.uxX`; Browser activation closes chart/legend, stops replay, clears review state and sticky reservation. |
| F7 | Box/page deferral | Box, clue page, and collectible page cannot trigger/reward/delete/reveal/collect during a real trade; they remain and work once the fixture trade ends without duplication. |

## Required 16-cell CQSAFE matrix

Use iframe width 390 and heights 844, 667, 468, and 340. At every height test:

- **C1:** review legend versus summary headline/result badge, plus registry/DOM rectangle agreement and visible summary.
- **C2:** open-trade chip versus live price/wallet after at least two frames; both zones exist, remain in bounds, and do not intersect with required padding.
- **C3:** `THIS WAY` versus price-axis gutter; no padded intersection, including the 340px-short case.
- **C4:** trade-incoming notice versus ticket in both event orders; no sampled frame may show both.

The harness must render expected, actual, PASS/FAIL, geometry, and errors as visible DOM so the in-app Browser can inspect and capture it.

## Pass criteria

- F1–F7 pass.
- All 16 collision cells pass.
- No external request succeeds and the harness does not access browser storage.
- The server is loopback-only.
- Browser runs do not change game artifacts or production state.
- Full repository verification remains green.
- A durable QA handoff records exact candidate identity and expected-versus-actual results.

## Residual Founder-only boundary

Automation cannot replace real-device safe-area insets, Safari touch/address-bar behavior, DPR 2/3 rendering, audio/haptics, performance/heat, or subjective readability/game feel. After automated PASS, Founder testing should be limited to one profitable close, one real stop, the visible replay X, and a scan of the four former collision states on representative phones.

## Files touched by QA Investigator

None. PM/CTO transcribed this handoff because the QA investigator's sandbox was read-only for the candidate.
