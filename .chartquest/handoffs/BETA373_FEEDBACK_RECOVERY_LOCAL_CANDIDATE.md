# Build 373 — Beta Feedback and Restart Recovery Local Candidate

**Date:** 2026-08-24

**Status:** **APPROVED LOCALLY — DO NOT DEPLOY OR SEND TESTER LINKS**

## Exact identity

- Branch: `codex/build373-feedback-recovery`
- Control-plane base: `9ec219ef21ffceee51664270094b19bbfd4e5c67`
- Exact gameplay/runtime payload commit: `291d3849e8aa1d27631792ead5271036184efc42`
- Exact hero-visibility follow-up commit: `f20bc481833bfa904017ab55452b06c9059889e0`
- Build: **373**
- Source/root/site SHA-256:
  `69eb93f0f97c60567cfd33c1e7654ec2a3e0bc76cc354ca426ad76145c1b3faa`
- The three game artifacts are byte-identical:
  `chart-quest.html`, `index.html`, and `website/game.html`.
- Landing page SHA-256:
  `08b770b0a3fea5edd6c76c9215eb999908589569c9ce83faca4d202427a72ef0`
- Service worker: `chartquest-site-v19`, SHA-256
  `9c0c295c4519fb6057e02605012a4d17f38a24fd6558773080a67ea2e48e9934`
- Deploy provenance stamp embedded in game bytes: parent `9ec219ef21` at
  `2026-08-24T16:11:16Z`.
- Resolve the latest command-center closeout identity with
  `git log -1 --format=%H -- .chartquest/handoffs/BETA373_FEEDBACK_RECOVERY_LOCAL_CANDIDATE.md`;
  do not substitute the runtime payload when preparing a future control-plane manifest.
- Production remains Build 367. No Preview/production deployment, provider/database mutation,
  migration, `main` push, manifest, lock, tester link, production fingerprint, or recovered-archive
  change occurred in this work.

## Founder direction and evidence boundary

An anonymized skilled marketer reported:

- no survey after an unexplained restart to the movement tutorial;
- website subtext that did not address the pressure of rising costs and escaping the 9–5;
- weak recall of how to Shell Smash after the tutorial;
- too much first-run market choice and messaging that could imply markets behave alike; and
- an all-win opening that did not establish credible loss risk.

The Founder approved implementation. The tester's exact served build/fingerprint and restart moment
were not captured. The initiating restart cause was not reproduced and remains **[UNKNOWN — REQUIRES
VERIFICATION]**. Build 373 repairs the interruption outcome and one known controller-reload hazard;
it does not claim either was the tester's cause.

## Implemented product changes

### 1. Pain-point and market-truth copy

The public landing subtext now speaks to rising costs and building income beyond the 9–5. Public
copy calls the experience a practice chart and does not imply that Bitcoin, equities, forex, and
other markets share one volatility or media/political behavior model. The old “free / no download /
no signup” subtext is removed from the relevant public surface.

Founder visibility follow-up `f20bc48` promotes that message from a small trust line into a
high-contrast glass panel before the primary CTA. The first sentence is bold, normal-case type is
14.5–18px across responsive layouts, and compact/landscape rules keep both the message and complete
Play button visible.

### 2. Bitcoin-first without removing returning choice

A fresh run receives one explicit **Start With Bitcoin** confirmation card. This removes opening
decision fatigue without pretending the game has only one market. Returning **Change Chart** keeps
the complete eight-market chooser. Fresh/reset parameters are one-shot and do not survive wrapper
normalization; release QR generation rejects those flags.

### 3. Shell Smash teaching that persists until success

The movement tutorial points to a visible box and uses device-specific input language. The main game
adds a second device-specific cue anchored to the visible smash target. A failed attempt does not
retire the cue; only a real smash does.

### 4. Authored 2–1 opening

The three automatic guided opening results are:

1. **WIN** — the established first-win emotional anchor.
2. **LOSS** — the sole authored, stop-protected First Loss with explicit coaching.
3. **WIN** — the immediate recovery beat.

The former Level-2 loss injector is retired so the scripted loss cannot duplicate. “2–1” is the
opening record, not reward:risk: every automatic guided trade remains **2:1 R:R**. Player-controlled
traversal, one-action/one-boundary behavior, 30–60-candle visible paths, first traversed body/wick
TP/SL touch, manual Close, replay truth, rewards, and live-trade world-event suppression remain
unchanged.

The Founder-approved doctrine record is
`CHARTQUEST_T-002B_OPENING_FIRST_LOSS_SUPERSESSION_2026-08-24.md`. TES v1.1 remains formal
architecture canon until re-ratification; its unchanged prose also preserves the historical
baseline. Production is held on that reconciliation.

### 5. Safe-boundary restart and survey continuity

Device-local `cq_beta_flow_v1` owns a fixed monotonic stage vocabulary:

`new` → `movement_started` → `movement_complete` → `market_selected` → `trade_1_complete` →
`trade_2_complete` → `trade_3_complete` → `boss_won` → `journal_due` → `journal_started` →
`journal_completed` → `survey_due` → `survey_submitted`.

Checkpoint order is durable-after-effect:

- a trade stage advances only after Journal/log, reward, XP, and player state persist;
- the Guardian checkpoint advances only after reward state persists and verifies;
- Journal completion advances only after its shell reward persists and verifies; and
- survey remains due until the response-specific confirmed receipt sets
  `cq_bt_survey_submitted`.

Resume begins at the next unpaid safe boundary. A lesson/review or unfinished Journal action may
replay; a completed trade, Guardian, Journal reward, or shell/XP payment may not. Malformed or newer
ledger versions fall back to established durable evidence rather than clearing progress. The exact
approved protected-key delta is one new ledger key plus four already-established CQTrack once-key
literals, with no removal or rename.

Wrapper Restart and destructive Fresh/reset now require confirmation. A service-worker controller
change defers reload during an active beta flow. The marketing cache advances through v19 so changed
public assets and the prominent landing root have a distinct returning-client identity while private
API/data bypass remains intact.

### 6. Music and survey contract retained

Build 372's music-on-every-ordinary-start behavior is retained. An explicit `?mute=1` remains a
per-document QA exception and browser policy still requires the first permitted tap/key for sound.
Player-facing survey preparation copy now says seven questions. Q1–Q7 draft and confirmed-receipt
rules remain intact.

## Verification evidence

| Gate | Result |
|---|---|
| Full `scripts/verify.js` on parent diff | **29 pass / 0 fail / 0 warn / 1 optional Puppeteer skip** |
| Post-runtime exact-tree verifier with control docs present | **27 pass / 0 fail / 0 warn / 3 expected skips: Puppeteer plus the two HEAD-diff gates N/A** |
| Build-373 feedback/recovery contracts | **10/10 PASS** |
| Restart/survey/reward safety | **7/7 PASS** |
| Public marketing/market-truth contracts | **8/8 PASS** |
| Startup music contracts | **10/10 PASS** |
| Player-paced trade contracts | **13/13 PASS** |
| CQSAFE/protected Build-368 contracts | **27/27 PASS** |
| Narrow protected save-key gate | **4/4 PASS** |
| Cloudflare game cutover | **7/7 PASS** |
| Cloudflare client/receipt/attribution | **15/15 PASS** |
| Game artifact parity | **PASS — all three SHA-256 `69eb93f...`** |
| Standalone/inline syntax and `git diff --check` | **PASS** |
| Independent final review | **APPROVE — no actionable finding** |
| Independent hero-visibility responsive review | **APPROVE after compact portrait/landscape fixes** |

The optional Puppeteer package is unavailable; production inline and standalone syntax are the
documented boot proxy. No test result is represented as physical-device, Preview, credentialed,
provider, or audible-speaker evidence.

## Scoped in-app Browser evidence

At 390×844 on loopback-only local bytes:

- the landing page displayed the new income-pressure subtext and truthful market language;
- the visibility follow-up kept the prominent panel and complete CTA in view at 1440×900,
  1366×768, 390×844, 375×667, compact 320×568, and landscape 844×390, with no horizontal overflow;
- a fresh wrapper run used the internal `hmc=1` UI-staging flag, stripped `fresh=1`, displayed only
  the Bitcoin confirmation card, and handed off to BTC; executable contracts own the ordinary
  no-flag first-run decision;
- a returning Change Chart UI path, staged with the same internal flag, displayed all eight markets;
- ordinary startup showed music on, explicit mute showed off, and the next ordinary launch returned
  to on;
- Q1–Q7 were reachable, Q6/Q7 retained their experience and proposed-$19 distinction, and an
  unsubmitted Q1/Q2 draft survived reload;
- movement teaching reached the device-specific “BOOST, then SWIPE DOWN onto the BOX” cue with
  glowing visible boxes; a failed down-swipe did not retire it;
- a clean URL resumed from the completed `market_selected` boundary directly into BTC; and
- the wrapper Restart action produced the native confirmation prompt.

Limits:

- the Browser did not submit a survey or create a tester response;
- the Browser did not reliably complete a physical Smash, so cue retirement on real success is
  executable-contract evidence only;
- native-confirm automation could not safely accept the dialog, so one-shot restart behavior is
  executable-contract evidence;
- UI music state does not prove audible speaker output or physical-phone autoplay/background rules;
- this did not emulate a genuine prior-worker→v19 installation; and
- an internal `?guest` development shortcut still exposes a pre-existing synchronous-boot TDZ. Plain
  tester entry does not use that flag; Build 373 does not claim it fixed.

## Files in the runtime payload

Product/runtime:

- `chart-quest.html`
- `index.html`
- `website/game.html`
- `website/index.html`
- `website/play.html`
- `website/assets/site.js`
- `website/bosses.html`
- `website/manifest.webmanifest`
- `website/sw.js`
- `scripts/tester_qr.py`

Executable gates:

- `scripts/beta_restart_safety.test.js`
- `scripts/build373_feedback.test.js`
- `scripts/marketing_copy.test.js`
- `scripts/cloudflare_client.test.js`
- `scripts/cloudflare_game_cutover.test.js`
- `scripts/cloudflare_save_key_gate.js`
- `scripts/cloudflare_save_key_gate.test.js`
- `scripts/verify.js`

Durable doctrine/control evidence is committed after the runtime payload:

- `CHARTQUEST_T-002B_OPENING_FIRST_LOSS_SUPERSESSION_2026-08-24.md`
- `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` (prominent amendment notice only)
- `.chartquest/ACTIVE_SPRINT.md`
- `.chartquest/CURRENT_STATE.md`
- `.chartquest/DECISIONS.md`
- `.chartquest/INVARIANTS.md`
- `.chartquest/qa/KNOWN_ISSUES.md`
- `.chartquest/qa/BETA_FINDINGS.md`
- `.chartquest/qa/REGRESSION.md`
- this handoff

## Remaining release gates and exact next sequence

1. **Do not reapply Preview migration `0003`.** It was applied exactly once to the verified Preview
   `BETA_DB`; the historical-row/schema evidence is already recorded.
2. Deploy exact Build-373 Functions/static bytes only to authorized non-production Preview. Verify
   the served game fingerprint before testing.
3. On real phones, execute fresh Bitcoin entry, returning eight-market Change Chart, movement and
   actual Shell Smash/cue retirement, ordinary startup music with audible output, intro/Guardian
   audio, true background/resume, and the complete W-L-W opening. Verify long/short automatic TP/SL,
   loss coaching, recovery, manual Close, replay, rewards, and trade-time suppression.
4. Interrupt and resume at every ledger boundary. Prove no duplicate trade/Guardian/Journal shell or
   XP reward, no skipped unpaid boundary, and survey recovery from `survey_due` through a real Q1–Q7
   response-specific receipt.
5. Verify valid invite/cohort attribution, authenticated Founder Access allow/deny, dashboard,
   export, experience/$19 views, fresh-cohort display, and genuine prior-worker→v19 behavior.
6. Complete formal TES/architecture re-ratification for ADR-TES-1 or explicitly reject/revise the
   placement before production authorization.
7. Re-audit Preview/Production bindings, encrypted-secret presence, Access identity, retained
   Build-367 rollback bytes, account/data rollback, and unreconciled historical-data boundaries.
   Recovered Supabase archives must not be deleted or altered, and migration must not be called
   complete without exact reconciliation.
8. Under explicit release authorization, capture Production recovery evidence, verify the correct
   Production `BETA_DB`, and apply `0003` exactly once **before** deploying Functions that select or
   write Q6/Q7. Additive columns remain on code rollback.
9. Re-run release controls on the exact final tree, create the normal exact manifest and lock, and
   request/confirm final production authorization before any `main` push.
10. After production deployment, verify the production fingerprint twice and complete live smoke
    before generating or sharing any tester link.

## Decision

**BUILD 373 LOCAL CANDIDATE APPROVED — DO NOT DEPLOY OR SEND LINKS — CANON RE-RATIFICATION,
EXACT PREVIEW/PHYSICAL PHONE, W-L-W/SMASH/BITCOIN/MUSIC/INTERRUPTION/SURVEY, FOUNDER/COHORT/WORKER,
PRODUCTION MIGRATION, ROLLBACK/RECONCILIATION, RELEASE CONTROLS, AUTHORIZATION, AND TWO PRODUCTION
FINGERPRINTS REMAIN — BUILD 367 LIVE**
