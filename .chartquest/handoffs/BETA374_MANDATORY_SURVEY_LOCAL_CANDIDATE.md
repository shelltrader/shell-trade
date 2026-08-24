# Build 374 — Mandatory Response-Specific Survey Local Candidate

**Date:** 2026-08-25

**Status:** **VERIFIED LOCALLY — AWAITING NEW EXACT-TIP APPROVAL FOR NON-PRODUCTION PREVIEW**

## Exact identity

- Branch: `codex/build373-feedback-recovery`
- Runtime parent and prior exact upload approval: `da6198eff153b49c6bc75d86e98ab77a15a0cbcf`
- Exact Build-374 gameplay/runtime payload commit:
  `1f10dfc63c70f3a6c71a8e84e74e7d2718429ff2`
- Build: **374**
- Source/root/site game SHA-256:
  `e0ae9ae618020b8ecb9327d0773355b722998bb7c9a0d8638c21061481837ca4`
- The three game artifacts are byte-identical:
  `chart-quest.html`, `index.html`, and `website/game.html`.
- Service worker: `chartquest-site-v20`, SHA-256
  `44b72ec95d9407a4599ebadfd2989543bf8afdec36fb1cee6dba1559411330e2`.
- Canonical tracker SHA-256:
  `2bae11f8de700d088edba56cf08ff10719bc08cac697265e4eaff51ef0f2d931`.
- Survey page SHA-256:
  `b93d586428c37aad1d97f51258a9fc283adfc2f83fd73895420f85c8d2379e24`.
- Play wrapper SHA-256:
  `34f54c9b7c837842f5e9a87e4e90a820eb0a3e5194cc5559a2e84c01e3fe8201`.
- Deploy provenance stamp embedded in game bytes: parent `da6198eff1` at
  `2026-08-24T17:32:07Z`.
- Resolve the latest command-center closeout identity with
  `git log -1 --format=%H -- .chartquest/handoffs/BETA374_MANDATORY_SURVEY_LOCAL_CANDIDATE.md`.
- Production remains Build 367. No GitHub upload, Preview/production deployment, provider/database
  mutation, migration, `main` push, manifest, lock, tester link, production fingerprint, or
  recovered-archive change occurred in this work.

## Authorization boundary

The Founder explicitly approved pushing **commit `da6198e`** to
`github.com/shelltrader/shell-trade` on branch `codex/build373-feedback-recovery` for a
non-production Cloudflare Preview. In the same request, the Founder added a material requirement:
the survey must populate for every playtest and must have no exit except closing the game.

That requirement changed the candidate bytes. It is not safe to substitute runtime `1f10dfc` or
the later command-center tip for the explicitly named `da6198e`. The old approval is therefore not
used. A new approval naming the exact final tip is required before `git push`. This is an identity
gate only; no additional product decision is open.

## Founder requirement and truthful guarantee

Build 374 implements the strongest defensible browser contract:

- every supported completed beta run immediately becomes `survey_due`;
- every ChartQuest-owned route remains survey-owned until an exact receipt is durably confirmed;
- reload, restart, Back, Escape, Home, background/resume, offline recovery, and worker replacement
  cannot silently convert that due state back to gameplay;
- the player's answers, step, and immutable pending response survive supported interruption; and
- closing the browser/game remains allowed, exactly as requested.

No web application can truthfully guarantee a submission after browser/OS termination, denied site
storage, a destroyed device profile, or permanent network loss. Build 374 fails those conditions
closed: it does not claim completion, erase the pending row, or expose an in-app exit.

## Implemented behavior

### 1. Exact terminal authority

The existing `cq_beta_flow_v1` key is retained and its row advances to schema version 2. The only
terminal condition is:

`surveyReceipt === surveyResponseId === r-<current cq_pid>`

The following are explicitly non-terminal:

- historical `cq_bt_survey_submitted` analytics evidence;
- a version-1 `survey_submitted` row;
- a foreign, malformed, missing, or stale response id;
- a receipt belonging to an old/corrected player id;
- an ordinary `advance('survey_submitted')` call;
- a wrapper navigation acknowledgment; and
- a non-exact, rejected, timed-out, count-only, or HTML HTTP response.

Legacy/generic terminal evidence migrates back to the current response-specific `survey_due` row.
No new save key was added; the protected-key contract remains intact.

### 2. Immediate non-dismissible handoff

The Journal WAIT_POST race is corrected: an early ordinary callback cannot finish the beta while the
Journal tutorial is still active. Durable `journal_completed` evidence or an explicit skip owns the
terminal handoff.

Once terminal:

- the game displays a full-screen survey-opening lock with no button or dismiss control;
- same-origin parent and direct top-level handoffs run together;
- `location.replace` retries indefinitely until navigation unloads the game;
- the wrapper accepts completion only from its own game iframe and exact same origin;
- the wrapper writes/readbacks `survey_due` before acknowledging navigation; and
- public `beta=0` is disabled unless `_CQ_DEV === true`; tester QR generation rejects beta flags.

### 3. Shared route lock

The canonical tracker publishes `CQSurveyGate` on landing, play, game, offline, and survey pages.
While the current response is due it:

- promotes an embedded survey/game to the same-origin top window;
- redirects non-survey ChartQuest routes before their ordinary controls initialize;
- blocks application links, Home/Restart, backdrop exits, Escape, and browser Back;
- re-arms the Back lock after history navigation, page show, visibility return, and a late direct
  survey transition to due; and
- installs no `beforeunload` listener, leaving browser/game close available.

### 4. No-loss Q1-Q7 survey

The survey draft is response-specific schema v2 and records:

- validated Q1-Q7 answers;
- the exact visible question;
- the exact current response id; and
- an immutable, normalized completed pending row.

Q1-Q4 and Q6-Q7 are required; Q5 remains optional. Every question uses an explicit Next action.
Reload restores selected radios, text, question position, and a completed pending submission.
Stale drafts from another response are discarded rather than misattributed.

Submission catches synchronous throws, promise rejections, non-exact receipts, and a 12-second
timeout. It retries after 1.5, 4, 10, 30, and 60 seconds, then every 60 seconds indefinitely; online,
reload, and foreground events also retry. The form and pending draft remain locked until both:

1. `CQTrack.survey(row)` confirms the exact Cloudflare survey-v2 receipt for that row; and
2. `CQSurveyGate.markSubmitted(response_id)` persists and reads back the exact local receipt.

Only then are the draft and lock cleared and the post-receipt Home link revealed.

### 5. Offline/returning-worker recovery and disclosure

Service worker v20 precaches the survey shell and serves it for offline survey navigation. Static
cache lookup ignores the query so the v374 tracker cachebuster resolves to the verified precache.
The offline fallback loads the shared gate and immediately recovers an owed survey.

Landing-page copy now discloses before play: “Closed beta playtest · ends with 7 required feedback
questions.” All six tracker surfaces use `?v=374` so returning clients request the new gate.

## Verification evidence

| Gate | Result |
|---|---|
| Full `scripts/verify.js` on Build-373 parent diff | **30 pass / 0 fail / 0 warn / 1 optional Puppeteer skip** |
| Exact-runtime-tree verifier before control closeout | **28 pass / 0 fail / 0 warn / 3 expected skips: Puppeteer plus two HEAD-diff gates N/A** |
| Mandatory survey adversarial contracts | **15/15 PASS** |
| Seven-question research/draft contracts | **7/7 PASS** |
| Restart/survey/reward safety | **8/8 PASS** |
| Build-373 retained feedback/recovery | **10/10 PASS** |
| Public marketing/market-truth | **8/8 PASS** |
| Startup music | **10/10 PASS** |
| Player-paced trade contracts | **13/13 PASS** |
| Narrow protected save-key gate | **4/4 PASS** |
| Cloudflare game cutover | **7/7 PASS** |
| Cloudflare client/exact survey receipt | **15/15 PASS** |
| Repository release-control negative/positive matrix | **15/15 PASS** |
| Game artifact parity | **PASS — all three SHA-256 `e0ae9ae...`** |
| Inline/standalone syntax and `git diff --check` | **PASS** |

The optional Puppeteer package is unavailable; inline and standalone syntax remain the documented
boot proxy. No local result is represented as served Preview, physical-device, credentialed Founder,
real Cloudflare receipt, or audible-speaker evidence.

## Scoped local Browser evidence

At 390x844 on loopback-only local bytes:

- all seven questions used explicit progression and Q5 remained optional;
- reload restored the exact question, all entered answers, and selected controls;
- the completed Q7 pending response survived reload with identical content;
- an intentionally unreceipted local POST remained visibly locked with automatic retry state; and
- the pre-receipt surface exposed no Home, Skip, Close, Dismiss, or backdrop exit.

The local server intentionally returned no real survey receipt. Preview receipt delivery,
physical offline/online/background/close/reopen behavior, a genuine v19-to-v20 worker transition,
and assistive-technology screen-reader behavior remain unverified.

## Runtime and test files

Product/runtime:

- `chart-quest.html`
- `index.html`
- `website/game.html`
- `website/assets/cq-track.js`
- `website/play.html`
- `website/survey.html`
- `website/offline.html`
- `website/sw.js`
- `website/index.html`
- `website/bosses.html`
- `website/courses.html`
- `scripts/tester_qr.py`

Executable gates:

- `scripts/mandatory_survey.test.js`
- `scripts/survey_research.test.js`
- `scripts/beta_restart_safety.test.js`
- `scripts/build373_feedback.test.js`
- `scripts/cloudflare_client.test.js`
- `scripts/cloudflare_game_cutover.test.js`
- `scripts/marketing_copy.test.js`
- `scripts/verify.js`

## Remaining Preview and release sequence

1. Commit this command-center evidence and record the exact final tip.
2. Obtain explicit approval to push that exact tip to
   `github.com/shelltrader/shell-trade`, branch `codex/build373-feedback-recovery`, for the
   non-production Cloudflare Preview.
3. Push only after that approval. Do not push `main` and do not change production.
4. Do not reapply Preview migration `0003`; it is already present on the verified Preview `BETA_DB`.
5. Wait for the Preview deployment, identify its deployment route/branch alias, and verify `/game`
   plus `sw.js` fingerprints twice before using the URL for QA.
6. On Preview, complete Q1-Q7 through a real exact receipt; exercise Back/Escape/Home/Restart,
   reload/background/foreground, offline/online, close/reopen, and returning-worker recovery.
7. Run the inherited Build-373 live-phone matrix: Bitcoin entry, actual Smash/cue retirement,
   audible startup/background audio, W-L-W, automatic long/short TP/SL, manual Close/replay,
   reward non-duplication, Journal recovery, invite/cohort attribution, Founder Access/dashboard/
   export, and fresh-cohort display.
8. Preserve recovered Supabase archives. Do not claim historical migration complete without exact
   source-to-destination reconciliation.
9. Production remains a later, separate Release-Manager workflow: Production `0003` recovery and
   exact binding proof before affected Functions, release manifest/lock/gates, explicit final
   authorization before any `main` push, and two production fingerprints before tester links.

## Decision

**BUILD 374 LOCAL CANDIDATE VERIFIED — AWAITING NEW EXACT-TIP APPROVAL FOR NON-PRODUCTION PREVIEW —
DO NOT PUSH MAIN OR SEND TESTER LINKS — EXACT PREVIEW RECEIPT/RECOVERY, PHYSICAL PHONE, FOUNDER/
COHORT/WORKER, PRODUCTION MIGRATION, ROLLBACK/RECONCILIATION, RELEASE CONTROLS, AUTHORIZATION, AND
TWO PRODUCTION FINGERPRINTS REMAIN — BUILD 367 LIVE**
