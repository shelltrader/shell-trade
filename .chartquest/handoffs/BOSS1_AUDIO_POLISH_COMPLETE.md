# Boss 1 Cinematic Audio Polish — Build 367

## Status

**BOSS 1 AUDIO READY FOR FOUNDER REVIEW**

Engineering, media, browser playback, regression QA, and independent review are complete on the exact candidate below. This status does **not** claim that automated testing can award the subjective 8/10 aesthetic score. Founder listening on headphones/Mac speakers and a physical iPhone speaker remains the final quality gate.

This work has not been pushed, merged, or deployed. Production remains frozen.

## Exact candidate identity

- Branch: `codex/boss1-audio-polish`
- Parent: `5416a6017490d82696d2cb03e193ce29bfb5cfda`
- Candidate commit: `7fd7a69cbee1f16c34ff5fc29ae135dd7e645b89`
- Build: **367**
- `chart-quest.html`, `index.html`, and `website/game.html`: `1d97b90627bac3af5b5f430f5505d4ba2d98f22335717b83ce666fb90a7af2e9`
- Browser bridge: `9e173ed1b2735d171b325b3c3a7dca9d6310563255e0af49de9caccb2f84fd52`
- Browser harness: `3b8b41cea752082a9073e5462b416b4466d199b0390ee3cae7476aa9c37132be`
- Focused suite: `c358b1f1f69a4b7971b922e6ae87113c82f2d1af063fa428ae541b4432bcc71f`
- Audio-media suite: `f5e61bfe998f2c63513b08e60141e2dba44aa04ba455c0d5fbd2d6125889be82`
- Full verifier: `32e4eb49bfe51c6602acd902479e8d0af131f003bc4bb733cffebe8c09bc0630`
- Local QA server: `19928d35ff8491625763cb96a2ff295007177fac7c4a5de3ef24142c5054f44e`

The three game artifacts are byte-identical. Every root audio asset is byte-identical to its `website/` deployment mirror.

## What was wrong before

- The Boss 1 intro video was muted and had no authored full-timeline creature reaction.
- Flinches fired a generic hit sting before the video, then started a randomly chosen roar and synthesized bed before a cold video had rendered.
- A second impact was scheduled from wall-clock time, so mobile decode/startup delay could make the sound lead the visible hit.
- The three old roars had measurably different loudness and did not cover all four distinct reaction timelines.
- Scheduled audio was not fully owned by the cinematic lifecycle, so replacement, skipping, muting, seeking, or a stalled video could produce drift, overlap, or a late tail.
- The 9-second wall-clock safety timer could cut the 10.0417-second intro or a slowly loaded flinch before its natural end.

The approved Boss videos and the original roar assets were preserved unchanged. Their hashes are locked by the media test.

## Source material inspected

- All shipped Boss 1 intro and flinch videos, their frame counts, durations, dimensions, and rendered movement peaks.
- The three existing `boss-roar-*.m4a` files.
- Synchronized embedded audio from the original high-resolution Boss 1 video masters.
- Founder reaction recordings `Flinch 1.m4a`, `Flinch 2.m4a`, and `Flinch 3.m4a`.

The final mixes retain the synchronized master reactions as their primary layer and use restrained Founder-source reinforcement for a consistent Gambler identity. No source asset was destroyed or overwritten.

## Timing map and final assets

All five additions are AAC-LC, mono, 48 kHz, start at media time zero, stay below 5 MiB, and are mirrored under `website/bosses/sfx/boss1-polish-v1/`.

| Scene | Video duration | Measured visual impact | Authored audio peak | Integrated loudness | True peak | Final asset SHA-256 |
|---|---:|---:|---:|---:|---:|---|
| Intro | 10.041667 s | no single discrete impact frame | 7.899 s | -16.1 LUFS | -1.7 dBTP | `3384ccde8bebf7b21df5ee05fce8349695c54563a6462e9a4ea81ea791c808f5` |
| Flinch 1 | 3.916667 s | 2.466667 s | 2.450 s | -18.0 LUFS | -2.0 dBTP | `e6dd59cdb78da70e5da59c6f5a79ee79231edde9a3b1c0d0d33c083c4bb0ee17` |
| Flinch 2 | 3.016667 s | 2.000000 s | 1.992 s | -16.6 LUFS | -2.0 dBTP | `238fe86c4fce0582aa99734957261fe4e81b99def4c09ab154ba4da6cac523bd` |
| Flinch 3 | 3.533333 s | 0.616667 s | 0.522 s | -19.3 LUFS | -2.1 dBTP | `b2938ab0abc51088c77019574dfba6c7d7ec9938c728028649fe9f824b45010d` |
| Flinch 4 | 5.183333 s | 1.683333 s | 1.611 s | -19.2 LUFS | -1.9 dBTP | `6d949154c1695d6c1e6ad61536a8396d89e7bb1462e3c42d9afdd40cf50e8632` |

Each flinch is a distinct full-timeline mix with impact, vocal/body reaction, recoil support, and a clean recovery tail. The intro is a continuous entrance rather than a single-hit reaction, so no per-frame visual-impact timestamp was claimed. Its measured media timeline is: video start 0.000 s; locked authored climax window 7.35–8.85 s with the strongest 20 ms audio window at 7.899 s; synchronized source audio remains present from 9.0–10.0 s; source audio ends at 10.000 s; and the video's final 0.041667 s is padded silent before the 10.041667 s end. A1 proves full-duration, media-time-bound playback; the subjective fit of wind-up, climax, recovery, and settle remains Founder listening work. Objective phone-band checks pass for all five mixes; the four flinches remain within a 2.7 LU loudness spread.

## Implementation

`Boss1CineAudio` is an observational, Boss-1-only controller. It does not own visual progression and cannot block gameplay.

- Audio begins only after the first rendered video frame and seeks to that frame's actual media time.
- Rendered-frame callbacks and a decoded-frame fallback keep the mix tied to video media time instead of arbitrary delays.
- Pause, waiting, cold start, seek, playback-rate changes, visibility changes, and drift over 85 ms are handled without a second initial start.
- A generation and play-attempt token prevents a late promise or stale callback from resurrecting replaced audio.
- Skip, replacement, error, mute, video end, boss retry, outro start, and arena teardown stop the exact session once and restore the music duck once.
- iOS gesture priming sets `muted=true` on all five elements before each synchronous prime request, rather than relying on a volume-zero setter, and then restores the prior element state. The ignored-volume simulation proves that controller contract; actual first-tap silence and later playback authorization remain physical iPhone Safari acceptance items.
- Boss music ducks to 0.18 while a mix owns the scene; the normal frame-level music producer yields until teardown.
- Progress-aware watchdogs allow slow mobile loading while media time advances: 10 seconds of true idle, with 60-second intro and 45-second flinch absolute fail-open caps.
- Existing saved music/mute authority remains `cq_music`. The controller performs no storage or cookie reads/writes and does not reset preferences.
- The old immediate hit, random roar, synthesized reaction bed, and delayed impact are suppressed only when a valid Boss 1 polished mix owns that scene. Other Guardians and the fallback path are unchanged.

## QA and review

### Static and media gates

| Gate | Result |
|---|---|
| Focused Build 367/CQSAFE suite | **PASS — 27/27** |
| Boss 1 media suite | **PASS — 5/5** |
| Release controls | **PASS — 15/15** |
| Artifact-parity fixtures | **PASS — 5/5** |
| Full verifier before candidate commit | **PASS — 25 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip** |
| Script/game syntax, QA-server self-test, diff integrity | **PASS** |
| Game and root/site asset parity | **PASS** |

Media gates decode the real assets and lock duration, format, loudness, true peak, phone-band retention, impact window, tail, root/site parity, and preservation of the approved videos and old roar sources.

### Browser playback

- Silent automated Run All: **37/37 PASS**, 0 fail, 0 pending, no captured runtime/console errors.
- Repeatability: two consecutive executions in the same iframe produced **74/74 cumulative PASS** with no leaked portal, tutorial, replay, or audio state.
- F17 verifies all five exact versioned audio assets decode without audible automation.
- F18 runs the five real muted videos and proves first-rendered-frame ownership and media-time alignment.
- F19 exercises cold waiting, buffered seek without a new `playing` event, stall/resume, drift correction, iOS-style muted priming even when a fake volume setter is ignored, replacement, mute/error/end/skip teardown, slow progress beyond the former cutoff, true-idle failure, and one music-duck restore. Playback-rate and visibility handlers were independently inspected as lifecycle code, but are not claimed as direct F19 behavioral simulations.
- Manual A1 audition used a real in-frame user gesture for each exact scene. The intro and all four flinches each emitted the matching controller `play` trace and reached the real video `ended` event at full duration: **5/5 COMPLETED**.

Independent engineering review found no remaining code, asset, timing, regression, or integration must-fix on the exact hashes above.

## Protected scope

The diff does not redesign or materially alter Boss 1 visuals. It does not change trade economics, curriculum, movement, saves, rewards, boss questions/health/progression, player controls, or release/provider state. No visual video, boss portrait, old roar, credential, binary outside the five new sound pairs, or production configuration changed.

## Founder-only acceptance boundary

Automation and this AI-run playback cannot honestly award the final subjective 8/10 score. Before beta approval, Founder must:

1. Listen to the intro and all four complete flinches on Mac speakers/headphones and a phone speaker.
2. Confirm the intro feels substantially more threatening and connected to the movement.
3. Confirm each impact, vocal reaction, body motion, and recovery tail feels connected to the visible flinch and the four reactions are distinct without sounding like different monsters.
4. On physical iPhone Safari, confirm the first normal game tap is silent, later Boss audio is audible and synchronized, and persisted mute remains silent.
5. Reject the candidate if it does not subjectively meet 8/10; that returns the status to `NOT READY` for a targeted remix, not a controller rewrite.

## Integration safety

The isolated candidate commit is safe to advance into the normal beta integration workflow, subject to the usual exact-byte merge verification. Any conflict resolution or byte change to a game artifact, audio asset, bridge, harness, focused suite, media suite, verifier, or QA server invalidates the evidence identity and requires proportional reruns.

Do not deploy independently. Do not push or merge without the normal beta/release authorization.
