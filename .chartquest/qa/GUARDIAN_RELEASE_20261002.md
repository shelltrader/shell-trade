# Guardian cinematic release candidate — 2026-10-02

VERIFIED: build 377 on codex/guardian-live-candidate, based on production commit 3910319.
Founder scope: integrate all approved selections, preserve approved creative imperfections for launch, optimize only oversized clips, remove unused runtime assets, correct source/website parity and deployment-route documentation.

VERIFIED: 55 clips, 110 root/website copies; exact approved-source to release-derivative provenance is in guardian-media-release.json. Four surviving-hit reactions plus a final defeat for each Guardian. Selected Hydra defeat V2 is retained; rejected V3 is absent. Journal and Eel glasses progression gates remain intact. All three game HTML files are byte-identical. Gameplay, save, lesson and Finn protections pass. Committed production campaign music and Gambler intro mix are preserved. Superseded flinch mixes and roars are removed; new videos use their native audio.

VERIFIED: 32 oversized clips re-encoded using two-pass veryslow H.264; all clips ≤5 MiB. Original resolution, every frame, frame rate, duration and exact AAC payload preserved. 23 clips remain byte-identical. Set size 409,376,336 →234,338,256 bytes (42.8% reduction). Minimum full-reference SSIM 0.962404. No generation credits used.

VERIFIED: 36 audited unused runtime assets removed from the candidate, including obsolete intro clips, placeholder portrait, unused website art, legacy roar tracks/flinch mixes, and superseded versioned Gambler defeat. Tracked active assets remain. Creative source archives and unrelated concurrent logo files are preserved outside this cleanup scope. Release candidate contains no untracked runtime video dependencies.

TEST: node scripts/verify.js —27 PASS,0 FAIL,0 WARN,1 SKIP (Puppeteer unavailable). node scripts/guardian-cinematics.test.js —22 PASS. CQSAFE suite —27/27 PASS; locked campaign audio suite —6/6 PASS. Full FFmpeg decode —55/55 PASS. Browser boot —PASS. Browser audit using actual candidate players at8× muted playback —55 loaded,55 ended,0 errors. This is a local technical playback check, not a physical iOS device/full campaign production playthrough.

REVIEW: scoped changes are the approved cinematic maps/players, hit intensity presentation, defeat routes, obsolete audio owner removal, unused asset deletion, metadata/build stamp, source parity, deployment documentation and corresponding regression expectations. No provider settings, Supabase, production configuration or shared checkout edits performed in this preparation. Source baseline was refreshed after discovering the initial shared branch was behind and divergent from production; its unrelated branch changes were excluded.

VERIFIED EXTERNAL: GitHub production-freeze ruleset20679373 reported enforcement=disabled on October2. Existing documentation claiming active freeze is stale. The Release Manager authority requirement and local release-control gate still apply.

[UNKNOWN — REQUIRES VERIFICATION]: production deployment and served fingerprint, fresh service-worker behavior on production, physical iOS audio policy and full reward/campaign flows. This candidate has not been deployed. Release Manager must reconcile the latest main, acquire its lock, produce exact manifest, pass main release gate, deploy through documented Git path and verify production. Do not use a provider dashboard/token bypass.

Evidence: guardian-media-release.json (55-source provenance and exact removals), guardian-player-test-results.json, guardian-final-media-audit.json, guardian-browser-playback-results.json, guardian-release-gate.txt. Local visible proof and original encodes are retained under content-assets/guardian-animation-production/sol-20261002-release-preparation, outside website/.

## Release Manager verification follow-up

Founder explicitly assigned Codex Release Manager and authorized production deployment. Build377 passed main lock/gate and was pushed normally. Returning-player audit found unchanged service-worker cache v14 could retain old clips. Build378 increments it to v15 and adds a permanent activation/fetch regression. No video bytes changed. Final production evidence is maintained in the release manifest.
