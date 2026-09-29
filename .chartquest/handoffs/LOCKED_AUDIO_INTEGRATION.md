# Locked campaign audio — build 376

## Authorization and baseline

- **DOCUMENTED:** Founder requested implementation of the locked music across all levels/events and publication to the live game on 2026-09-30 (Asia/Bangkok).
- **VERIFIED:** starting source, mirrors and served `https://playchartquest.com/game` were build 367, SHA-256 `1d97b90627bac3af5b5f430f5505d4ba2d98f22335717b83ce666fb90a7af2e9`; remote `main` was `8c858aabd27aa0c4032fef9599d958735d959283`.
- **VERIFIED:** GitHub ruleset 20679373, ChartQuest production freeze, returned `enforcement: disabled`. Historical freeze notes describe the earlier state; no rule or provider setting was changed in this task.
- Work is isolated on `codex/locked-campaign-audio`. Existing audition files and their approval entry belong to this audio task and are included as the canonical listening reference.

## Implemented mapping (all campaign levels and Guardians 1–11)

| Event / screen | Locked music or event cue |
|---|---|
| Exploration, movement tutorial, ordinary traversal, return from overlays | Core + Snare, 96 BPM |
| Wallet / scanner browsing | Continue Exploration; same running Core + Snare transport |
| Trade ticket, chart setup / prediction, every live trade including the first | Decision Point, 108 BPM |
| Guardian gate approach, entrance and fight | Original Collision, 116 BPM |
| Guardian result, trade replay, active practice / daily drill | Forward Page, 98 BPM |
| Journal history / profile / Guardian browsing and level intermission | Chamber Steps, 100 BPM |
| Lessons, detailed trade explanation, Journal knowledge / wisdom / notes | Quiet Review (intentional musical silence; action feedback remains available) |
| Opening cinematic | Existing cinematic owns its sound; ordinary score stops |
| Guardian 1 intro / reactions | Existing authored media-time mix owns ducking over Collision |
| Jump, boost, dive, spin, release, landing, recharge | Existing distinct movement cues |
| Box smash / reward, target / stop, level / milestone, Guardian hit / hurt | Existing event stings; now through the shared GameMusic mute output |
| Coin / shell pickup | Previously unhandled `coin` sting now has a brief two-note cue |
| Journal open / portal entry | Short paper/key cue / rising passage cue |

The approved scores are copied exactly from the audition, including Decision Point's approved high-chime replacement. The unapproved effect-preview draft has not replaced existing action sounds. No new external sound assets are needed. Music choices are based on visible state, not random notes, player results predicted in advance, or level-specific transposition.

## Lifecycle and scope review

- One scheduled score with a short transition; repeat requests are idempotent. Explore/Continue share a transport.
- Audio initializes after interaction. `cq_music` remains the only saved sound authority.
- Mute and hidden-page transitions stop scheduling, gate output, disconnect active GameMusic effect tails, and stop roars. Foreground and gesture unlock restore the current screen's music.
- Scheduler skips elapsed time after a stall instead of bursting queued notes.
- Guardian 1 authored audio controller, its media assets and duck ownership remain intact.
- All gameplay/economics/curriculum/boss engine/physics/save-key protected signatures are unchanged. `GameMusic` is exposed for existing late UI callers that already check `window.GameMusic`.
- Self-review inspected the source diff and module boundaries. No independent agent review or physical listening claim is made.

## Verification

- **VERIFIED:** locked audio suite 6/6: seven score configurations and two complete cycles of note/voice/timing parity; level 0–11 route matrix; real state/DOM selector inputs; all Guardians; gesture/mute/continuity/silence; foreground/stall handling; output/duck ownership.
- **VERIFIED:** existing CQSAFE/beta suite 27/27, including preserved trade progression and Guardian cinematic lifecycle.
- **VERIFIED:** Boss 1 media suite 5/5 (run by full gate); release-control fixtures 15/15; artifact-parity fixtures 5/5.
- **VERIFIED:** full regression gate 26 pass, 0 fail, 0 warn, 1 optional Puppeteer skip. Source/root/site files match exactly. Ten inline scripts parse.
- **UNKNOWN:** physical-phone listening, subjective mix balance in actual play, and long-term retention effects. None is represented as automated proof.
- Browser and production verification are recorded in the release manifest after the candidate is published.

## Files

`chart-quest.html`, generated `index.html` and `website/game.html`; `scripts/locked_audio.test.js`, `scripts/cqsafe.test.js`, `scripts/verify.js`; the existing audition/cue map/handoff; decision/invariant/sprint/QA records. No production configuration, credentials, or binary media changes.

## Release

Founder authorized publication; the Release Manager workflow must still identify a committed clean candidate, acquire its lock, pass the release gate, and verify the served fingerprint. Candidate readiness alone is not a deployment claim.
