# Build 372 — Music on Every Startup Local Candidate

**Date:** 2026-08-24
**Status:** **VERIFIED LOCALLY — AUDIBLE PHONE/PREVIEW AND RELEASE GATES HELD**

## Founder direction and defect

**DOCUMENTED:** after a player reported hearing no music, the Founder directed an immediate repair:
music must be enabled on every normal startup.

**VERIFIED root cause:** the existing `cq_music=off` browser value persisted indefinitely. A player
who muted once, or a browser that had previously opened a historical `?mute=1` QA URL, could return
on an ordinary visit and remain silently opted out without making a new choice. Browser autoplay
rules separately prevent sound before a permitted player gesture; this repair does not claim to
bypass that platform rule.

## Exact local identity

- Branch: `codex/build372-music-startup`.
- Parent/control-plane commit:
  `8bfc84c2f0ca58a20c3fd0d53aa028edb2c34f32`.
- Exact runtime payload commit: `e3382414624ea571a28e2c887bbe8593545734cc`.
- Build: **372**.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `64c157e311f5d2bffde5682a7acfc48ab1907daf95842ff6e3af8827ac0d7b90`.
- `website/sw.js` remains byte-unchanged at `chartquest-site-v17`, SHA-256
  `4da726985022a8ab518338b63e66e6e17df47a820edad20674690154e5a4d08b`.
- Production remains Build 367. No Preview/production deployment, database/provider mutation,
  migration, manifest, lock, `main` push, tester-link send, or recovered-archive change occurred.

## Minimum repair

1. Every ordinary game-document load writes `cq_music=on`, repairing missing, stale-on, and stale-off
   storage into one explicit startup decision.
2. Explicit `?mute=1` remains the automation/QA exception and writes `off` for that document. A later
   ordinary URL writes `on` again.
3. The music button still toggles the current document. Manual off stays silent through that
   document, but reload through an ordinary URL intentionally restores on.
4. Permanent capture-phase `pointerdown` and `keydown` listeners unlock `GameMusic`,
   `Boss1CineAudio`, and `CineAudio` on every permitted gesture. Capture prevents an opening control
   that stops propagation from swallowing the only legal autoplay gesture; permanence lets a later
   gesture recover a browser-suspended audio context after background/resume.
5. Explore-bed startup remains one-shot. An active intro defers the bed until a later gesture, and an
   active boss keeps its existing audio ownership. The shared music control now applies mute/unmute
   to procedural cinematic audio as well as the game and Guardian owners.

No soundtrack composition, mix, volume, gameplay, trade doctrine, save-progress key, survey/data
plane, or service-worker behavior changed.

## Verification evidence

| Gate | Result |
|---|---|
| Startup-audio executable contracts | **10/10 PASS** |
| Pre-commit parent-diff `scripts/verify.js` | **28 pass / 0 fail / 0 warn / 1 expected optional Puppeteer skip** |
| Post-commit exact-tree `scripts/verify.js` | **26 pass / 0 fail / 0 warn / 3 expected skips: Puppeteer plus build/protected diffs N/A at HEAD** |
| Inline game-script syntax | **11/11 PASS** |
| Release-control contracts | **15/15 PASS** |
| CQSAFE protected contracts | **27/27 PASS** |
| Cloudflare game-cutover contracts | **7/7 PASS** |
| Player-paced trade contracts | **13/13 PASS** |
| Teaching UI contracts | **5/5 PASS** |
| Seven-step survey contracts | **4/4 PASS** |
| Boss1 media contracts | **5/5 PASS** |
| Three-artifact byte parity | **PASS — SHA-256 `64c157e3...`** |
| `git diff --check` | **PASS** |
| Independent read-only review | **PASS — no P0–P2 finding** |

The exact tree did not change across the payload commit: the pre-commit verifier is the evidence for
the Build-371→372/protected-system comparisons, while the post-commit rerun is the clean exact-HEAD
result. The focused suite executes the actual launch and music-bootstrap source owners. It covers
ordinary missing/on/off storage, explicit mute, propagation-stopping pointer and keyboard targets,
post-background repeated unlock without duplicate playback, intro deferral, current-document manual
mute, ordinary reload-on, toggle-on unlock of all three engines, muted procedural cinematic silence,
and exact artifact parity.

## Local browser evidence and limit

**VERIFIED at the default in-app-browser viewport, with no dimension claim:**

- an ordinary load displayed `🎵` with `Music on`;
- clicking the control displayed `🔇` with `Music off`;
- reload returned to `🎵` / `Music on`;
- `?fresh=1&mute=1` normalized to `?mute=1` and displayed `🔇` / `Music off`;
- a later ordinary URL displayed `🎵` / `Music on`;
- the first `Enter the Market` gesture advanced the intro; and
- the exercised route produced zero console errors.

This is UI, storage, and gesture-path evidence only. The in-app browser observation did not prove
audible speaker output, subjective mix, physical phone autoplay behavior, or true mobile
background/resume.

## Service-worker boundary

The current v17 worker does not intercept online HTML navigations, and explicit `game.html` fetches
are network-first. The stale silence came from game-owned local storage, not CacheStorage. Because
Build 372 changes only the game document and no precached/runtime-cached asset, a worker bump would
add unrelated returning-client risk and is not required.

## Files changed

Runtime and executable gates:

- `chart-quest.html`
- `index.html`
- `website/game.html`
- `scripts/music_startup.test.js`
- `scripts/verify.js`
- `scripts/cloudflare_game_cutover.test.js`

Durable evidence:

- `.chartquest/ACTIVE_SPRINT.md`
- `.chartquest/CURRENT_STATE.md`
- `.chartquest/DECISIONS.md`
- `.chartquest/INVARIANTS.md`
- `.chartquest/qa/KNOWN_ISSUES.md`
- `.chartquest/handoffs/BETA372_MUSIC_STARTUP_LOCAL_CANDIDATE.md`

## Remaining gates and next safe action

1. On the exact committed candidate, run a physical-phone audible listen for ordinary fresh startup,
   first pointer/key, manual mute then reload-on, explicit `?mute=1`, intro handoff, Guardian audio,
   and true background/resume. Record what was actually heard; do not infer sound from the icon.
2. Deploy only to authorized non-production Preview and prove the served `/game` hash before
   repeating the startup matrix there. Preview migration `0003` is already present and must not be
   reapplied.
3. Complete every inherited Build-371 gate: automatic long/short Stop Loss, authenticated Founder
   allow/dashboard/export and fresh-entry cohort display, returning v16→v17 worker, physical trade
   feel/background, Production `0003` under recovery evidence and authorization, account/data
   rollback and historical reconciliation, and rollback-control confirmation.
4. Only after those gates pass, run release controls and prepare an exact manifest/lock, obtain
   explicit production authorization, push `main`, deploy, verify the production fingerprint twice,
   and then consider tester links.

Do not alter recovered Supabase archives or claim historical migration/reconciliation complete.

## Decision

**BUILD 372 STARTUP MUSIC REPAIR VERIFIED LOCALLY — DO NOT DEPLOY OR SEND LINKS — AUDIBLE PHONE,
EXACT PREVIEW, INHERITED BUILD-371 MATRIX, PRODUCTION MIGRATION, RELEASE CONTROLS, AUTHORIZATION, AND
DOUBLE PRODUCTION FINGERPRINT REMAIN — BUILD 367 REMAINS LIVE**
