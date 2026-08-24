# Current Technical State

## 2026-08-24 Build-371 Preview QA addendum — SERVED PACING P0 PASS; RELEASE HELD

- **VERIFIED — exact non-production deployment:** control source
  `f311dfa0375305ce08c2d4af06a72f30356f2fd3` deployed successfully as Cloudflare Pages deployment
  `1c56b4ee-a726-4116-8e4c-cc6450b6f7cd`. Both the deployment route and current branch alias serve
  `/game` at SHA-256 `3224c603255ee5d1210295b31151f7de04ca6c3b2a211b158f14627b76a0ab09`
  (`2212400` bytes), exactly matching the Build-371 source/root/site candidate.
- **VERIFIED — original P0 closed on served bytes:** at 390×844, Escape dismissed the first-trade
  guide and the live close state remained `+0 Safe profit` through 5.6 seconds of no input. One
  explicit forward action changed resolved state once to `+1`; another 5.6 seconds of no input
  remained `+1`. A separate first-trade run used the visible × and held `−1` for 5.6 seconds.
- **VERIFIED — served trade behaviors:** one backtrack moved Finn without changing resolved `+1` and
  remained idle for another 5.4 seconds; manual Close banked `+1`, recap truth said `CLOSED EARLY`,
  replay rendered, and ordinary free roam resumed. A later ordinary long reached automatic TP and
  Wallet recorded `+10`; an ordinary short reached automatic TP and details recorded `TARGET HIT`
  and `WIN +10 shells`. No ambient reward/world event was observed while either live position was
  exercised; the exact-source 13/13 contract remains the exhaustive suppression owner.
- **VERIFIED — teaching/research/protection:** two ordinary fresh-origin paths reached all four guide
  pages. Escape and the visible × both worked; the final Build-371 copy explicitly explains one
  candle at a time. The computed guide scroll owner is `overflow-y:auto` with `touch-action:pan-y`;
  at 390×844 its 172 px content fit exactly, so this is not a claim of an overflow-displacement
  gesture on Build 371. Q1–Q7 completed on exact Build 371 and the receipt-gated thank-you state
  proves the response-specific v2 API receipt matched response id plus stored Q6
  `gamer_not_trader` and Q7 `probably`; no separate Build-371 D1 row query is claimed.
  Unauthenticated Founder access returned 403. Served `sw.js` identifies `chartquest-site-v17`.
- **VERIFIED — scoped attribution/provider/rollback:** internal pair `b371-beta100` /
  `i-M2B7D9K2Z9W6T7K8` was captured on the exact Build-371 alias, stripped from the URL, and persisted
  to four token-filtered Preview D1 rows for one pseudonymous session; the exact-game row carries
  `build=371`. Preview/Production D1 binding names and UUIDs, required encrypted-secret presence,
  and Access issuer/audience coherence were re-audited. Retained Production deployment
  `38d166bd-2aa2-4fd3-8aa9-8d1423f39220` serves the exact tagged Build-367 `/game` hash
  `1d97b906...` and service worker v14.
- **RELEASE HOLD:** true physical-phone background/resume and subjective feel, automatic SL/loss
  outcomes for long and short, Founder Access allow/dashboard/export and fresh-entry cohort display,
  a genuine v16→v17 returning-worker upgrade, Production `0003`, account/data rollback compatibility,
  release manifest/lock/gate, explicit final production authorization, `main`, production, and
  double production fingerprint remain incomplete. The in-app browser cannot substitute for a
  hidden physical phone or a valid Founder JWT. Do not infer these passes.
- **PROTECTION:** Preview migration `0003` was not reapplied; no recovered Supabase archive or
  production state was changed. Production `BETA_DB` still has only the original 13 survey columns,
  so `0003` must be authorized and applied exactly once there before Build-371 Functions. Local/
  remote `main` remain `8c858aab...`; Build 367 remains the documented production release. No tester
  link was issued.

See `handoffs/BETA371_PREVIEW_QA.md`. The Build-370 failure below is retained as historical root-cause
evidence and no longer describes the current Preview artifact.

See `handoffs/BETA371_PROVIDER_ROLLBACK_AUDIT.md` for the exact external provider and rollback
boundary.

## 2026-08-24 Build-371 local pacing repair — VERIFIED LOCALLY; RELEASE BLOCKED

- **VERIFIED — root cause:** Build 370 removed its special wall-clock/carry path but inherited the
  platformer's always-on horizontal walk. Closing the first-trade guide cleared `paused` without a
  player-intent gate, so Finn crossed real candle frontiers and changed `lastPrice`, path, and P&L
  while no player input was sent. The former 11/11 suite held `maxSeenCandleId` fixed and did not run
  production horizontal movement, so it could not reproduce the served defect.
- **VERIFIED — exact local repair:** payload `3019058b32c6acddc8fc5530569f24d95c76a98f`,
  Build 371. `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `3224c603255ee5d1210295b31151f7de04ca6c3b2a211b158f14627b76a0ab09`.
- **VERIFIED — behavior:** a Level 1–3 live trade begins halted. Each explicit keyboard/tap/swipe
  action owns at most one touching-candle boundary, then Finn halts again. Guide Close/Escape,
  entry, pointer cancel, blur, page hide, and background/resume clear stale intent. Backtracking
  consumes one spatial step without changing price/progress. TP/SL still resolves on the first
  traversed visible body/wick touch; every resolution, including manual Close, returns normal
  free-roam movement. Level 4+ and no-trade auto-walk are unchanged.
- **VERIFIED — terrain distinction:** the approved bounded `maxSeen + 2` collision/render lookahead
  may author the two candles Finn needs to platform on, but idle time cannot grow it again and those
  unreached candles cannot change resolved `lastPrice`, trade path, P&L, session progress, or outcome.
- **VERIFIED — evidence:** player pacing 13/13 using production gap-zero geometry and an adversarial
  movement spike; teaching UI 5/5; full verifier 27 pass / 0 fail / 0 warn / 1 optional Puppeteer
  skip; diff check clean; two independent adversarial re-reviews APPROVE with no remaining finding.
- **PREVIEW FOLLOW-UP:** exact Build 371 is now deployed to non-production Preview and its original
  idle/P&L blocker is closed by the scoped evidence above. Physical/device, opposite-terminal,
  authenticated Founder/export/fresh-entry cohort, returning-worker, Production `0003`,
  post-promotion rollback action, account/data rollback, and production gates remain. Production
  remains Build 367.

See `handoffs/BETA371_LOCAL_REPAIR_CANDIDATE.md` for the implementation evidence and
`handoffs/BETA371_PREVIEW_QA.md` for the current external result.

## 2026-08-24 Build-370 Preview QA addendum — RELEASE BLOCKED

- **VERIFIED — Preview only:** source `7bb0ed7` deployed successfully as Pages deployment
  `c8c138b1-3e77-45a5-bc5a-094c8f6a83f2` on branch
  `codex/beta370-player-paced-trades`. The served `/game` SHA-256 is exactly
  `b615adb1c06558b5409111384c406053dfb9dee802eda86d7000db8b2e63103d`.
- **VERIFIED — migration/write path:** the seven-step Preview survey completed with Q1–Q7; a
  response-specific Preview D1 receipt confirmed Q6 `gamer_not_trader`, Q7 `probably`, the existing
  fields, and `ingest_source = cloudflare`. The optional Q5 blank is stored by the current client as
  an empty string. This deliberately retained QA row is Preview-only evidence; no historical answer
  content or identifiers were inspected.
- **VERIFIED — teaching controls at 390×844:** Home Market's candle bridge rendered; the first-trade
  guide appeared after the ordinary route, the explicit Close control worked, the guide's scroll
  region accepted a scroll gesture, and a separate first-trade run dismissed the guide with Escape.
  No browser-console runtime error was observed in these exercised flows.
- **FAILED — release blocker:** immediately after the Escape dismissal, leaving the phone untouched
  changed the live `CLOSE POSITION` state from `−2 In the red` to `−4 In the red` over five seconds.
  This is incompatible with the required idle/player-paced guided-trade behavior. The candidate must
  not proceed to physical acceptance, release manifest/lock, `main`, production, or tester links.
- **VERIFIED — protection:** unauthenticated Preview Founder page access returned 403. Founder
  Access allow/dashboard/export, valid invite attribution, old-client service-worker return,
  long/short terminal paths, pause/background/backtrack, rollback, and physical-phone QA are
  unverified; none may be inferred from the local suite.
- Production was not queried, changed, pushed, or deployed. Build 367 remains live.

See `handoffs/BETA370_PREVIEW_QA.md` for scoped evidence. Lower sections are historical snapshots
and do not override this release-blocking addendum.

## 2026-08-24 Build-370 next-beta local candidate — VERIFIED LOCALLY

- Exact payload commit: `08d3b3c930f86ca4894ff9c26c813f78b43fb040` on
  `codex/beta370-player-paced-trades`.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `b615adb1c06558b5409111384c406053dfb9dee802eda86d7000db8b2e63103d`, stamped from parent
  `54666ab248` at `2026-08-23T17:15:17Z`. Production remains Build 367; this branch was not pushed
  or deployed.
- Founder-directed pacing change: Level 1–3 guided trades print candles only as Finn reaches the
  monotonic frontier. Wall time, idle state, resize, pause, guide/modal state, backgrounding, and
  backtracking cannot move price or carry Finn. Automatic paths visibly touch their authored TP/SL
  between candles 30 and 60; `CQ.priceTouched()` remains the one automatic resolver. Manual close,
  economics, trade result/reward, music, replay, and all adjacent movement/boss/save rules remain
  under their prior owners.
- A live guided trade generates price terrain only. Shells, boxes, Lost Wisdom, portals, mega/world
  events, cadence ledgers, collection, and behind-camera pruning are deferred until the position
  closes. The actual deciding candle is stored before settlement and survives bounded replay
  storage.
- Teaching changes are bounded: the first-trade guide and intro lesson have scrollable mobile cards
  with explicit Continue/Close owners; the Level-1 HUD connects dive to diamond smash; Home Market
  selection explains candles before chart handoff.
- The original five survey questions remain, followed by prior experience and a clearly labelled
  proposed **$19 one-time early-access** intent question. Additive migration
  `0003_beta_survey_research.sql` is SHA-256 `3283707a...` and leaves old rows nullable. The client
  clears a draft only after a v2 response-specific stored-value receipt proves Q6/Q7 landed.
- Next-cohort attribution accepts only `b<build>-beta<1..100>` plus eight issuer-generated
  consonant-digit invite pairs. Name/email/phone-like values fail both client and server validation;
  failed browser persistence leaves the link available for retry. The private Founder dashboard
  reports cohort funnels, invite reuse, experience, and $19 intent without counting historical
  not-asked rows as negative answers.
- Local evidence: full verifier **27 pass / 0 fail / 0 warn / 1 optional Puppeteer skip**; trade
  pacing 11/11; teaching UI 5/5; survey 4/4; beta service 26/26; client 15/15; Founder beta
  dashboard 8/8; canonical/deployed model and all three game artifacts match. Independent final
  review approved after trade-time pruning and name-like invite cases were added to the gates.
- **Preview provider evidence (2026-08-24):** after verifying that the Pages Preview environment
  binds `BETA_DB` to `chartquest-preview` (`d2f3e508-7f2c-400e-9522-d89c38545e9e`), the Release
  Manager made a pre-write D1 recovery bookmark, recorded the six-row aggregate and absent Q6/Q7
  columns, then applied the approved `0003` statements once each. The two nullable checked columns
  now exist; all historical rows retain the same aggregate and have null research fields. The
  separate Production binding was inspected but not queried or changed. Evidence:
  `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`.
- In-app Browser at 390×844 verified the seven-step survey and its offer distinction without
  horizontal overflow, plus the Home Market chart bridge. The ordinary first-session route loaded;
  subjective complete-trade feel still requires Founder physical-device QA. The inherited internal
  `?dev=1` boot TDZ remains outside the plain tester path and is not claimed fixed here.
- **Hard release order:** the Preview BETA_DB backup/count, schema inspection, `0003` application,
  and old-row/new-column proof are complete. Deploy Functions/static candidate to Preview; test survey
  v2, dashboard, trade matrix, Access, old service worker, and rollback; only then prepare normal
  manifest/lock/gate/live-fingerprint evidence. Leave additive columns in place on code rollback.
- Decision: **BUILD 370 LOCAL CANDIDATE APPROVED — DO NOT DEPLOY OR SEND LINKS — BUILD 367 REMAINS
  LIVE.**

Lower sections are historical snapshots and do not override this Build-370 addendum.

## 2026-08-23 Build-369 Cloudflare-only local candidate — VERIFIED LOCALLY

- Exact payload commit: `df0053c05506d6691b6545d96be6202dc685f1b6`, with D1 Studio-compatible
  trigger follow-up `1b8f4e53e42b3a91c9243f8ba7ee38a6dd120baa`, Cloudflare password-runtime
  compatibility follow-up `c0f0b5ab1714a69fd72cf9e631d1cadd7f3da3ab`, and privacy-safe account-stage
  logging follow-up `42982171ecf8942a223ec83702ef92448ef00902`, on
  `codex/cloudflare-only-beta`.
- The three game artifacts are byte-identical at SHA-256 `201682c4...`, stamped from parent
  `47cb1b866f` at `2026-08-23T10:35:13Z`; production still serves Build 367.
- Build 369 removes Supabase SDK/URLs/credentials/fallback writes from the published runtime and
  routes beta telemetry, surveys, accounts/sessions, profile, Journal, streak, mastery, bug reports,
  visits, content events, and market data through same-origin Cloudflare Functions. Existing local
  gameplay/save keys remain authoritative and unchanged; writes require exact receipts and stay in
  account-scoped durable queues otherwise.
- APP_DB schema identity is `8d2be65b...`. The private Founder dashboard reads APP_DB through one
  coherent bounded snapshot and reads beta events/surveys through separately validated keyset pages;
  it does not claim a cross-database point-in-time snapshot. It masks private fields by default,
  supports protected exports, and produces deterministic evidence-backed suggestions. It has no
  imported recent tester data yet.
- Local tests passed on payload `df0053c`: application plane 31/31, adapter 22/22,
  importer/reconciler 27/27, beta plane 23/23, beta client 7/7, content handoff 3/3, game cutover
  7/7, save-key gate 4/4, Founder all-data dashboard 7/7, legacy Founder beta dashboard 5/5, and
  full verifier 26/0/0/1 (optional Puppeteer skip). The unchanged importer remains 27/27; current
  preview HEAD `4298217` passes app 31/31 and full verifier 24/0/0/3 because the two game-diff gates
  are correctly N/A and Puppeteer remains optional.
- **Release-Manager-observed external state (2026-08-23; not independently reproduced by repository
  tests):** the signed-in Cloudflare dashboard showed database resources, Pages bindings, encrypted
  secret names, and Founder Access resources. A new isolated preview database,
  `chartquest-app-preview-b369` (`038efb97-a6b5-457b-8681-7d71e31f826c`), was created and verified
  with 32 app tables, 8 guards/triggers, 20 named indexes, zero FK violations, and zero application
  rows; the preview `APP_DB` binding now points to it. Preview `BETA_DB` was also verified with 3
  tables, 2 guards/triggers, 9 named indexes, zero FK violations, and zero rows. The prior preview
  APP database and all production databases remained untouched. Production schema verification is
  still a release-time gate.
- **Release-Manager-observed preview evidence (2026-08-23):** feature HEAD `4298217` deployed
  successfully to Preview as deployment `297c2141`. A disposable account request returned HTTP 201
  and produced the expected identity, profile, session, exact mutation receipt, and outbox state.
  Cleanup deleted only those disposable preview rows plus preview rate-limit buckets. Post-clean
  `app_identities/app_profiles/app_sessions/app_mutation_receipts/app_outbox/app_rate_limits` counts
  were `0/0/0/0/0/0`, with zero FK violations. The new `account.create_failed` diagnostic emits only
  a fixed stage label and exception class; it does not include email, password, payload, token, hash,
  or user ID. Full route/Access/dashboard/save/rollback preview smoke remains pending; production
  and Supabase were untouched.
- **Release-Manager-observed external state (2026-08-23; provider processing unverified):** the
  Supabase case flow showed identity verification and the Release Manager sent a reply in case
  `SU-452541` requesting a complete read-only export, urgently including `public.beta_events` and
  `public.beta_surveys`. Current source row presence/count remains unknown. This work retrieved,
  deleted, reset, imported, and analyzed no recent tester row.
- The importer requires source-generated proof for every required table and leaves migration status
  pending until independently exported D1 business/audit data matches. Supabase must remain intact
  until that proof, account restoration, preview/live smoke, and rollback evidence pass.
- Decision: **BUILD 369 PREVIEW CORE ACCOUNT-CREATION SMOKE PASSED — DO NOT DEPLOY — BUILD 367
  REMAINS LIVE; SOURCE EXPORT AND VERIFIED MIGRATION ARE THE DATA BLOCKER.**

Lower sections are historical snapshots and do not override this Build-369 addendum.

## 2026-08-15 build-368 Cloudflare beta-data addendum — VERIFIED LOCALLY

- Exact local runtime payload commit:
  `b8f671adf4982bb2997a4bf2f5d02207b19cfe68` on `codex/cloudflare-only-beta`.
- The three game artifacts are byte-identical at `4e11d01d...`; the Browser bridge is
  `cf9c0cad...`; Build 367 remains live in production.
- Build 368 adds a fresh D1 schema, confirmed-write Cloudflare-primary beta ingest with the existing
  Supabase endpoint as a confirmed-write fallback, and an Access-verifying private Founder dashboard.
- Supabase intentionally remains for authentication, cloud saves, historical beta rows, and fallback.
  No provider, database, player row, account, remote ref, deployment, or served website changed.
- Local review/QA passed: Cloudflare 23/23, client 7/7, dashboard 5/5, CQSAFE 27/27, release 15/15,
  parity 5/5, audio 5/5, verifier 26/0/0/1, Browser 37/37 and repeat 74/74.
- The dashboard shows new Cloudflare D1 data only after cutover. Build 367/earlier Supabase history is
  preserved in place and requires a later authenticated import; already-latched milestones do not
  re-emit automatically.
- External gates remain: migrate/bind D1, set rate-limit and Access configuration, create the exact
  deny-by-default Access policy, prove empty-at-cutover state, and run live write/read/export/v14
  upgrade/returning-player/rollback smoke.
- PM/CTO decision: **BUILD 368 LOCAL ENGINEERING CANDIDATE APPROVED — DO NOT DEPLOY — CLOUDFLARE
  D1/ACCESS CONFIGURATION AND LIVE SMOKE PENDING — BUILD 367 REMAINS LIVE**.

Lower sections are historical snapshots and do not override this verified-local addendum.

## 2026-08-13 build-366 cosmetic-closeout addendum — VERIFIED

- Exact local candidate payload commit: `19c443414bc4ebc74dfbc5b3ce7bafdd1c381765` on
  `codex/beta-360-readiness`.
- The three game artifacts are byte-identical at `fdbf6980...`; the Browser bridge is `477cd8b0...`.
- The Journal and victory card share the current versioned Gambler portrait; the Journal mastery
  finale retains the existing book in a compact premium card; the existing defeat clip now includes
  Finn's compass necklace throughout its front-facing victory frames.
- Independent review approved and exact-byte QA passed: focused 25/25, release controls 15/15,
  artifact parity 5/5, verifier 24/0/0/1, and in-app Browser 34/34 with zero captured errors.
- PM/CTO decision: **BUILD 366 READY FOR FOUNDER FINAL COSMETIC RETEST**. Portrait crop, card taste,
  and necklace visual remain subjective phone checks. The inherited upright cinematic pose is
  beta-deferred art debt and is not claimed as repaired.
- This is not release approval. Production remains frozen; served identity, fresh-cache evidence,
  manifest/lock/gate, Founder release acceptance, and the account-level freeze action remain future
  Release Manager work.

Lower sections are historical snapshots and do not override this verified build-366 addendum.

## 2026-08-12 build-365 final-send addendum — VERIFIED

- Exact local candidate payload commit:
  `7b3679c6497d8d4e9bfd8cdac3754489aaa9c4f7` on `codex/beta-360-readiness`.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `f80cecb3a4ed343ae21fa491b71cda46e2485176b56019a8484b11b490352879`; the guarded Browser bridge
  is `114d91e611a125d6e6ebadb80029deae04357db1f960abed05b27103b4614937`.
- A trade portal now publishes only after every unbroken box in/beyond its corridor is deferred and
  its governed or legacy reward budget is restored. Planned replay/recap exits place Finn beyond the
  exact TP/SL line in the correct direction and retain the crossed frame for about 960 ms.
- The first trade now uses a sparse warmer authored score while retaining its deterministic four-act
  price path. Ordinary centered feedback routes through one premium non-blocking toast owner.
- PM/CTO review approved and exact-byte QA passed: focused 24/24, release controls 15/15, artifact
  parity 5/5, verifier 24/0/0/1, and in-app Browser 31/31 with zero captured errors.
- PM/CTO decision: **BUILD 365 READY FOR FOUNDER FINAL MOBILE RETEST**. Subjective phone audio and
  visual taste plus one final real-trade/reward feel pass remain Founder judgments.
- This is not release approval. Production remains frozen; served identity, fresh-cache verification,
  manifest/lock/gate, Founder release acceptance, and the account-level freeze action remain future
  Release Manager work.

Lower sections are historical snapshots and do not override this verified build-365 addendum.

## 2026-08-12 build-364 Founder-blocker addendum — VERIFIED

- Exact local candidate payload commit:
  `45803665bce75df319b9b8a6dae5e8262f5d8f06` on `codex/beta-360-readiness`.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `ea4c7fdc958b8f502e2588377068813881e37d9e9450c6c45ce7edbddf109a52`; the guarded Browser bridge
  is `228f70b79f1d8f062bbfaa59a3166ed3680856539fc455135a1109ce02cda940`.
- Build 364 limits reward deferral to a real ticket/position and gives boxes/Lost Wisdom the same
  swept body-aware interaction seam as shell pickups; setup formation no longer disables them.
- FIRST WIN is one opaque ChartQuest-native milestone card with a bespoke vector trophy, revised
  copy hierarchy, canonical shell, and earned reward; the system emoji/loose-text stack is gone.
- The first real trade now owns a dedicated 112 BPM score and a deterministic near-stop scare,
  profit surge, hard give-back, and target run. Preview links no longer force/persist mute.
- PM/CTO review approved and exact-byte QA passed: focused 21/21, release controls 15/15, artifact
  parity 5/5, verifier 24/0/0/1, and in-app Browser 28/28 with zero captured errors.
- PM/CTO decision: **BUILD 364 READY FOR FOUNDER MOBILE RETEST**. Physical speaker/autoplay policy,
  subjective score mix, subjective FIRST WIN quality, touch feel, and full-device play remain Founder
  judgments.
- This is not release approval. Production remains frozen; served production identity, fresh-cache
  verification, manifest/lock/gate, Founder release acceptance, and the account-level freeze action
  remain future Release Manager work.

Lower sections are historical snapshots and do not override this verified build-364 addendum.

## 2026-08-12 build-363 mobile-retest addendum — VERIFIED

- Exact local candidate payload commit:
  `0d6201bb64a913525fdf4d6d624d88cfbbb4dbc0` on `codex/beta-360-readiness`.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`; the guarded Browser bridge
  is `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`.
- Build 363 adds one fail-closed `CQVIEW` safe-area owner for the bounded first-session Skip/Enter
  seam, shared 44px draw/hit targets, a main-canvas backing DPR cap of 2, and transactional
  Finn/world terrain re-anchoring while the active movement tutorial retains sole terrain ownership.
- Independent Reviewer approved and independent QA passed the exact fingerprints. Evidence:
  focused 18/18, release controls 15/15, artifact parity 5/5, full verifier 24 pass / 0 fail /
  0 warn / 1 allowed skip, and in-app Browser 25/25 with no captured runtime failure.
- Fresh non-QA real-control paths passed at 375x667 and 390x844: DOM cinematic Skip, premise
  Continue, canvas movement Skip, and Home Market.
- PM/CTO decision: **BUILD 363 READY FOR FOUNDER MOBILE RETEST**. Physical Safari notch/address-bar
  behavior, real touch feel, audio/haptics, sustained performance/heat, global HUD/modal safe areas,
  wrapper/PWA/cache behavior, online survey, and subjective readability remain explicit device or
  post-beta boundaries.
- This is not release approval. Production remains frozen; served production identity, fresh-cache
  verification, manifest/lock/gate, Founder release acceptance, and the account-level freeze action
  remain future Release Manager work.

Lower sections are historical snapshots and do not override this verified build-363 addendum.

## 2026-08-12 build-362 Founder-readiness addendum — VERIFIED

- Exact local candidate payload commit:
  `3ef4bf6e30d8a75ba21abf2df8ebede74e9d02a1` on
  `codex/beta-360-readiness`.
- `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical at SHA-256
  `d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b`;
  the guarded Browser bridge is
  `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`.
- Independent Reviewer approved and independent QA passed the exact fingerprints. Evidence:
  focused 16/16, release controls 15/15, artifact parity 5/5, full verifier 24 pass / 0 fail /
  0 warn / 1 allowed skip, and in-app Browser 23/23 with no fatal, runtime, or captured-console
  errors.
- The complete unforced Level-1 journey passed on build 361 and exposed the trade-three
  replay/prove race. Build 362 changed that exact lifecycle seam, then passed genuine
  auto-replay/details, hold, central-X close, token release, and downstream prove in the exact
  Browser artifact. QA accepted the impact-based rerun and closed the fresh-Level-1 gate.
- PM/CTO decision: **BUILD READY FOR FOUNDER TEST**. Physical Safari/touch/DPR/audio/performance,
  subjective readability, online survey submission, and L4+ forced-hour-close semantics remain
  non-blocking Founder/post-beta boundaries.
- This is not release approval. Production remains frozen; served production identity, fresh-cache
  verification, manifest/lock/gate, Founder release acceptance, and the account-level freeze action
  remain future Release Manager work.

**Snapshot basis:** repository inspection during Command Center initialization Step 3 (2026-08-10), with an external-control addendum verified on 2026-08-11.

## 2026-08-11 Step 8 durability addendum — VERIFIED

- Local branch `codex/command-center-integration` combines the QA-passed Step 7 parent with the Step 6B controls, project-scoped Codex configuration, complete control plane, cited RC evidence, ignore boundary, and fresh-clone hook bootstrap.
- Exact reviewed/QA-tested HEAD: `04227af12f2596cbfde1ee0189821a9f1c259ec4`; exact parent: `31ffd6f3003a439c051c0dd4c2358e40a3b5f1af`.
- Independent Reviewer approved the complete 48-path range; independent QA passed all 10 acceptance criteria, 15/15 release tests, 5/5 parity tests, and the full 20-pass regression gate with no failure or warning.
- A disposable standalone clone activated its own project-local hook path and remained clean. Linked-worktree bootstrap refused to repoint shared configuration.
- No game/art file, primary index, `main`, provider, credential, push, merge, or production state changed. The branch is local and unpushed.

## 2026-08-11 Step 7 engineering addendum — VERIFIED

- The first complete Investigator → Implementer → Reviewer → QA chain passed on the bounded three-artifact parity defect.
- QA-approved feature commit `31ffd6f` makes routine regression gate #8 byte-check `chart-quest.html`, `index.html`, and `website/game.html` and fail path-specifically on mismatch or absence.
- Five disposable positive/negative fixtures passed, and the post-commit full gate passed with 20 pass, 0 fail, 0 warn, and 3 allowed skips.
- The commit exists only on `codex/step7-artifact-parity`; it was not merged or pushed, `main` and the dirty build-360 source were not changed, and no production action occurred.
- Served `/game` identity remains a distinct unverified release concern.

## 2026-08-11 external-control addendum — VERIFIED

- GitHub `main` is covered by the active **ChartQuest production freeze** ruleset: exact `main` target, empty bypass list, restricted updates/deletions, and blocked force pushes.
- Cloudflare project `chartquest` remains connected to `shelltrader/shell-trade`, production branch `main`, output `website`, and automatic deployments. One human Super Admin and no account/user API tokens were observed.
- Netlify `chart-quest-game` is a fallback without a custom production domain. It is unlinked from GitHub, its build hooks were removed by unlinking, and Netlify MCP OAuth access was revoked; all displayed personal access tokens were expired.
- No deployment, push, merge, rollback, secret read, or production-content change occurred.

Full evidence and limits: `handoffs/STEP6B_EXTERNAL_CONTROLS.md`.

## VERIFIED

### Repository and build identity

| Item | Verified state |
|---|---|
| Current branch | `main` |
| Current `HEAD` | `bdf7dd4` |
| Source artifact | `chart-quest.html` is the documented source of truth. |
| Local source build label | `build 360`; the source file is already modified in the working tree. |
| Root mirror build label | `index.html` identifies `build 359`. |
| Cloudflare game artifact build label | `website/game.html` identifies `build 359`. |
| Metadata stamp in all three artifacts | `cq-build` content `7213f152d4`, timestamp `2026-08-10T14:27:54Z`. |
| Immediate release-control condition | The working tree has an existing source/mirror artifact drift: build 360 source versus build 359 mirrors. No attempt was made to change it. |

### Repository structure

| Area | Verified purpose |
|---|---|
| `chart-quest.html` | Self-contained game source: HTML, CSS, JavaScript, canvas game systems. |
| `index.html` | Generated root mirror of the source; operations documentation says not to hand-edit it. |
| `website/` | Cloudflare Pages output, including landing pages, `play.html`, `game.html`, service worker, runtime assets, and `_headers`. |
| `scripts/` | Release helper, verification, sync, deploy-smoke, and related tooling. |
| `ops/` | `CQOPS` operational framework and its behavioral tests. |
| `supabase/` and `automation/migrations/` | Edge Function source and SQL migration artifacts. |
| `beta-qa/` and `beta-qa.html` | Beta analysis/dashboard tooling. |
| `ChartQuestQA/` | Native macOS SwiftUI QA-review application. |
| `docs/`, `docs/canon/`, and `docs/operations/` | Product, architecture, canon, and release documentation. |

### Build and deployment system

- The product is a static site without a framework build step. `build.js` exists for optional obfuscation, but the Cloudflare deployment document states that it is disabled and the Cloudflare build command is empty.
- `scripts/cq.sh ship` is the documented local release helper: it runs the operations sync/stamp step, mirrors source to `index.html`, assembles `website/game.html` and runtime assets, then runs verification.
- `scripts/verify.js` on `main` provides the existing static regression gates. QA-approved feature commit `31ffd6f` extends gate #8 to all three local game artifacts. `ops/cq-ops.test.js`, `beta-qa/parity.js`, `scripts/check_test_prefixes.py`, and `scripts/smoke_deploy.js` provide additional checks documented in the repository.
- The documented Cloudflare Pages configuration is project `chartquest`, output directory `website/`, production branch `main`, with an auto-deploy on each push to that branch. `website/_headers` is the documented live header authority.
- `netlify.toml` and `netlify-direct-deploy.command` are documented as legacy/retired deployment paths.

### Production URL and deployment path

- Existing Cloudflare documentation identifies `https://playchartquest.com` as the production domain and `https://playchartquest.com/game` as the game route.
- `website/play.html` embeds the game; `website/game.html` is the deployed game artifact described by the Cloudflare documentation.

### Supabase

- The game uses Supabase for authentication, cloud-save/profile data, journal data, beta telemetry, and Edge Functions.
- Repository Edge Function source exists for `ingest`, `beta-ingest`, and `market-price`. The game also calls `update-progress`, but source for that function is not present in this repository.
- The Supabase project reference and client anon key are intentionally present in client-side source; backend service-role credentials belong outside the repository according to deployment documentation.

### Analytics and beta infrastructure

- `CQTrack` is the documented beta telemetry client; its canonical source is `website/assets/cq-track.js` and the game contains an inlined copy checked by a regression gate.
- Beta telemetry is sent through the `beta-ingest` Edge Function to beta data structures.
- `CQBeta` controls the in-game beta completion/survey flow. `beta-qa.html`, `beta-qa/`, and root `dashboard.html` provide documented beta/founder analysis tooling.
- `dashboard.html` is not part of the documented `website/` Cloudflare output.

### Major game systems

- **Trade:** deterministic authored training/replay flow; trades are resolved through the game trade system and recorded by Journal systems.
- **Event:** `CQBEAT` is the documented event-spacing owner, currently documented as `MODE='enforce'`.
- **Journal:** local and signed-in cloud journal/trade/note/streak paths; the post-boss journal tutorial connects to the beta flow.
- **Lessons:** embedded lessons, curriculum, levels, bosses, and boss scenes in the monolithic game source.
- **Operations:** `CQOPS` supplies operations metadata, environment resolution, flags, logging/error infrastructure, and health/reporting seams.

### Existing quality and fingerprinting infrastructure

- Static gate coverage is provided by `scripts/verify.js`; Step 7's committed feature candidate passed with 20 passes, no failures or warnings, and three allowed skips for optional/not-applicable checks.
- `CQOPS.build` and the `cq-build` meta stamp record build number, commit/stamp value, timestamp, and environment metadata.
- Feature commit `31ffd6f` replaces the two-file source/root-mirror check with a fail-closed byte comparison across `chart-quest.html`, `index.html`, and `website/game.html`; controlled integration into `main` remains pending.
- The Cloudflare site uses a service-worker cache version in `website/sw.js`.

### Concurrent-worktree and deployment risks

- `docs/beta-qa/MERGE_AUDIT_2026-08-05.md` records that a branch in a shared working tree did not isolate concurrent sessions; it explicitly states that isolation needs a Git worktree.
- The same audit documents an unresolved merge conflict risk in `scripts/verify.js` from another worktree.
- Existing local linked worktrees were discoverable during the earlier repository reconnaissance.
- Cloudflare documentation states that `main` auto-deploys on every push. A worktree does not, by itself, separate remote credentials or push/deployment authority.
- `docs/operations/GitWorkflow.md` contains stale pre-Step-6B protection guidance. Step 6B added shared local pre-push/release-gate controls in this checkout and an externally verified no-bypass GitHub production-freeze ruleset; the local files still require controlled repository integration for fresh-clone reproducibility.

## UNKNOWN — REQUIRES VERIFICATION

| Item | Why it is unknown |
|---|---|
| Current served production build and fingerprint | This initialization did not make a live production request. The dated RC release report claims build 359 was verified live but later contains stale/conflicting statements that production remains on 357. |
| Complete Cloudflare deployment history and current served response identity | Project settings and one production deployment record were inspected on 2026-08-11, but the complete history and live served fingerprint were not established. |
| Current Supabase deployment state, schema parity, and `update-progress` function source | The repository contains partial Edge Function and migration artifacts, not a verified external-state inventory. |
| Current dashboard availability and access-control state | The local dashboard implementation exists; live access was not checked. |
| Current beta participants, live telemetry health, and survey data | No external database query was performed. |
| Current release approval | The dated RC report says **DO NOT SHIP**, but its production/build assertions conflict internally and the local source is now at a different, unmirrored build. |

## Documented release blockers and gaps

- `CHARTQUEST_RC_RELEASE_2026-08-10.md` records a **DO NOT SHIP** decision pending complete production playthrough, fresh-browser verification, production fingerprint verification, and a Level 1 event-spacing validation report. Its build/production claims are internally inconsistent and require verification before use as a release decision.
- The local `website/game.html` byte-comparison defect is resolved and QA-passed in feature commit `31ffd6f`, with controlled integration into `main` pending. The separate deployment-smoke/served-response identity gap remains unresolved.
- Current local artifact drift (source build 360 versus mirror/website build 359) is a present repository condition and must not be confused with a verified production deployment.
- Durable controls and command-center state are available on reviewed/QA-passed local integration HEAD `04227af`; promotion into `main` remains a production release action and is blocked by the active freeze.

## Sources

- `docs/operations/README.md`
- `docs/operations/CloudflareDeployment.md`
- `docs/operations/GitWorkflow.md`
- `docs/beta-qa/MERGE_AUDIT_2026-08-05.md`
- `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md`
- `CHARTQUEST_RC_RELEASE_2026-08-10.md`
- `CHARTQUEST_RC_BASELINE_2026-08-10.md`
