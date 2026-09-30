# Build 376 audio QA

**VERIFIED — local automated checks passed.** Details, mapping and limitations: `../handoffs/LOCKED_AUDIO_INTEGRATION.md`.

Commands: `node scripts/locked_audio.test.js` (6/6); `node scripts/cqsafe.test.js` (27/27); `node scripts/release_control.test.js` (15/15); `node scripts/artifact_parity.test.js` (5/5); `node scripts/verify.js` (26 PASS, 0 FAIL, 0 WARN, optional Puppeteer unavailable); `git diff --check`.

The first new audio test run caught a fixture selecting a voice envelope instead of the effect bus. The fixture now selects the effect bus created at sting entry and verifies that mute disconnects it. The initial old-score test correctly failed because the first trade intentionally uses the newly approved Decision Point; its obsolete arrangement assertions were replaced by exact audition parity in the new suite while all four-act trade-path assertions remain.

Acceptance: each locked configuration matches the audition; correct scene music across levels 0–11 and Guardians 1–11; no duplicate score transport; no sound scheduled while muted/hidden; quiet Review schedules no music; foreground uses the current activity; Guardian 1 authored controller/media retained; protected gameplay signatures unchanged.

**UNKNOWN / not claimed:** physical-device speaker balance, browser listening and retention benefits. Release/fresh-browser results belong in the exact candidate release manifest.

## Production result

Published candidate `39103190052d49b9e5ca8dde355c585da8896d5d`. Canonical live SHA-256 matches source/mirrors. Strict smoke: 51 pass / 1 known byte-transform failure caused solely by a Cloudflare analytics script in the Node response; diagnostic byte comparison verifies no other differences. Release Manager accepted the explained exception. Browser boot/metadata verified; Google Fonts and Supabase CDN load warnings remain follow-up items. Full evidence: `../releases/LOCKED_AUDIO_376.md`.
