# Build 376 — locked campaign audio release

| Field | Value |
|---|---|
| Release ID | locked-audio-376-20260930 |
| GIT COMMIT | 39103190052d49b9e5ca8dde355c585da8896d5d |
| BRANCH | main |
| RELEASE OWNER | Release Manager |
| RELEASE START | 2026-09-29T19:06:44.269911+00:00 |
| PRODUCTION URL | https://playchartquest.com |
| BUILD ARTIFACT | Build 376 self-contained game and unchanged existing media |
| REVIEW / QA EVIDENCE | .chartquest/handoffs/LOCKED_AUDIO_INTEGRATION.md; .chartquest/qa/LOCKED_AUDIO_376.md; 26 full-gate passes; exact seven-score parity; 27 focused regressions; 15 release and 5 parity fixtures |
| DEPLOYMENT ID | 927b4b04-a845-4329-a374-91b97b210e1f — Cloudflare Pages production success for commit 3910319 |
| DEPLOYMENT TIME | Success verified 2026-09-29T19:15:31.035559+00:00 |
| PRODUCTION FINGERPRINT | build 376; canonical live /game SHA-256 62c96ed4a70beec0bfe89ea8ac8f9278d762de1054d0182a470dd4b6a8f55081; cq-build 8c858aabd2 at 2026-09-29T19:01:06Z. See response-transform exception below. |
| FRESH-BROWSER VERIFICATION | Preview boot, opening sequence, tutorial skip, market selection, rendered campaign, mute toggle and persisted mute on reload verified with CUA; no captured warning/error logs. Production fresh-tab boot and metadata verified. No captured runtime errors; two external-asset warnings documented below. |
| FOUNDER VERIFICATION | Locked sounds approved; explicit integration and live publication request on 2026-09-30. No new physical-device listening claim. |
| RELEASE DECISION | PUBLISHED AND VERIFIED — Release Manager accepts the documented Cloudflare response-transform exception; physical-device mix judgment remains untested |

| Field | Value |
|---|---|
| BUILD | build 376 |
| SOURCE SHA256 | 62c96ed4a70beec0bfe89ea8ac8f9278d762de1054d0182a470dd4b6a8f55081 |
| MIRROR SHA256 | 62c96ed4a70beec0bfe89ea8ac8f9278d762de1054d0182a470dd4b6a8f55081 |
| WEBSITE GAME SHA256 | 62c96ed4a70beec0bfe89ea8ac8f9278d762de1054d0182a470dd4b6a8f55081 |
| WEBSITE TREE SHA256 | e38d7e978b1dd0234342b1137dbebfa68d440380f72b64c9b0f2a793a3c49ddb |
| CQ-BUILD CONTENT | 8c858aabd2 |
| CQ-BUILD BUILT-AT | 2026-09-29T19:01:06Z |

## Release context

The remote production-freeze ruleset was read as disabled before preparation. No policy setting was changed. The isolated release clone uses its own exact local main and installed pre-push guard, while the original project common directory also holds this release lock to prevent competing local releases. Other active checkouts and their branches are untouched. Remote main must remain a fast-forward of the verified starting SHA.

## Historical publication block (resolved)

The exact `git push origin refs/heads/main:refs/heads/main` action was rejected by automatic approval review before execution. Reason: the protected production branch deploys the live service, the constitution reserves that action for Release Manager, and the reviewer found no explicit role assignment. No bypass was attempted. Founder was asked to authorize this agent as Release Manager for build 376 / commit 39103190052d49b9e5ca8dde355c585da8896d5d. The candidate and both release locks remain intact pending that response.

## Explicit Release Manager authorization

Founder replied **authorized** to the exact request: “Please authorize me to act as Release Manager and publish build 376.” This explicitly assigns the production role and authorizes candidate 39103190052d49b9e5ca8dde355c585da8896d5d. Remote main was rechecked at the original base and the production-freeze ruleset remains disabled.

## Production verification and accepted checker exception

- **VERIFIED:** main fast-forwarded from 8c858aa to 39103190052d49b9e5ca8dde355c585da8896d5d through the installed pre-push gate. Cloudflare Pages deployment 927b4b04-a845-4329-a374-91b97b210e1f and GitHub build/deploy checks succeeded.
- **VERIFIED:** live canonical `/game` downloaded with curl is byte-for-byte equal to the approved candidate, SHA-256 `62c96ed4a70beec0bfe89ea8ac8f9278d762de1054d0182a470dd4b6a8f55081`. Browser meta stamp matches.
- The strict Node smoke checker reports **51 PASS / 1 FAIL**, not an unconditional pass. Its HTTP response has SHA-256 `b5b2a98be0a0de333567c1a72294fd202dcbc84b347d4003663a39aba8d3c8ee`. A byte comparison proves the sole difference is one provider-inserted `static.cloudflareinsights.com/beacon.min.js` script immediately before `</body>`. Removing exactly that observed script from the diagnostic response produces the candidate bytes. No game code, deployment policy, server setting, or checker was altered to conceal the discrepancy. Initial attribution to propagation was superseded by this verified cause.
- All other live route/asset/content-type/size checks pass. Source/mirror/site parity and the pre-deploy release gate pass.
- **VERIFIED:** a fresh live browser tab rendered the opening screen and persisted the existing muted preference; build metadata matched. Captured console contained no runtime errors. It warned about Google Fonts and the jsDelivr Supabase script failing to load on two browser loads. Account/online features and the cause of those external-asset warnings were not tested; recorded as a follow-up, without claiming those flows passed.
- Preview browser verification covered entry, tutorial exit, market selection, rendered campaign, mute and mute persistence. Automated audio checks cover all-level routing and exact score parity; physical-phone listening is not claimed.
- **FOUNDER AUTHORITY:** approved the sound choices, requested game integration and publication, then explicitly authorized this agent as Release Manager. No new subjective live listening approval is inferred.
- **RELEASE MANAGER DECISION:** publication is verified with the precisely explained edge-script exception. No rollback is indicated by the deployed game identity or audio checks.

## Release closure

Both owned release locks were marked COMPLETE and archived in their Git common directories under `chartquest-release-history/locked-audio-376-20260930`. No active lock remains for this release. The production commit remains `39103190052d49b9e5ca8dde355c585da8896d5d`; subsequent record-only commits on the feature branch do not change production.
