# Beta-360 Readiness Browser QA

## Verdict

**PASS — FRESH LEVEL-1 GATE CLOSED — BUILD 362 QUALIFIES FOR FOUNDER TEST**

This verdict applies only to local Founder-test readiness. It does not authorize production release.

## Exact QA identity

- Branch: `codex/beta-360-readiness`
- Base HEAD: `b8b3457e727576722912686f104f721bd4d84b3e`
- All three game artifacts: `d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b`
- Browser bridge: `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`

The final CQOPS pre-commit refresh changed only the embedded `data-built-at` timestamp and
preserved parent identity `b8b3457e72`. Independent QA reconstructed the prior approved hash by
reversing only that timestamp, then reran the exact-fingerprint gates and accepted
`d36bb51f...`.

## Automated and rendered evidence

- Game source syntax: **PASS**, 10 inline scripts.
- Harness and bridge syntax: **PASS**.
- Loopback-only server self-test: **PASS** against the exact game hash.
- Focused readiness suite: **16/16 PASS**.
- Release-control suite: **15/15 PASS**.
- Artifact-parity fixtures: **5/5 PASS**.
- Full verifier: **24 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip**.
- Definitive in-app Browser run: **23/23 PASS, 0 FAIL, 0 PENDING**.
- Captured fatal, runtime, and console errors: **0**.
- Collision matrix: C1-C4 passed at 390 x 844, 667, 468, and 340.

F5 exercised the production-order third-trade sequence: genuine auto replay, exact token ownership, visible replay/details, a hold beyond the retired 2.2-second race, no THE LIE or practice overlay while the review owned the screen, real central X close, token release, and downstream prove progression. F6 independently confirmed X hit ownership and central teardown.

## Acceptance results

| Area | Result |
|---|---|
| Three-artifact identity | PASS — byte-identical |
| Sticky legend/review teardown | PASS |
| Manual positive/negative/break-even truthfulness | PASS |
| Inclusive `-0.5..+0.5` persistence and neutral empty AVG LOSS | PASS |
| Genuine stop-loss wording | PASS |
| Third-trade replay/details before THE LIE | PASS, fail-closed |
| Replay X hit and lifecycle teardown | PASS |
| Box/page deferral and exactly-once reward | PASS |
| Four-height collision matrix | PASS, 16/16 cells |
| Local isolation/no external connection | PASS |

## Fresh Level-1 adjudication

The complete unforced Level-1 journey passed on build 361 and exposed the third-trade sequencing defect. Build 362 changes only that confirmed lifecycle seam and its tests/identity; protected systems remained unchanged. The exact affected lifecycle then passed on build 362 through downstream prove in the definitive in-app Browser run. Independent QA accepts this impact-based rerun as sufficient and does not require a second complete unforced journey before Founder testing.

## Non-blocking Founder/device boundary

- Physical Safari notch/address-bar behavior, DPR 2/3, touch feel, audio/haptics, heat/performance, and subjective readability.
- Successful online survey submission telemetry was not exercised by the offline harness.
- L4+ forced-hour-close semantics remain a documented post-beta ambiguity.
- Served production identity remains unverified and production remains frozen.

## Next action

Pin the exact local candidate without changing its verified game or bridge bytes, then give the Founder only this subjective checklist:

1. On trade three, confirm replay becomes details before THE LIE appears.
2. Close the review with X and confirm progression resumes.
3. Confirm one manual close reads truthfully and the shortest-phone layout feels readable.

Do not push, merge, deploy, modify `main`, remove the production freeze, access providers, or touch credentials.
