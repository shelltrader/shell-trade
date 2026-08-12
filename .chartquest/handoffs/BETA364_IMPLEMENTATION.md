# Build 364 Beta Blocker Implementation

## Outcome

**IMPLEMENTED.** Build 364 closes the three Founder-confirmed blockers as one bounded beta-readiness
strike. Production remained frozen and no remote, provider, credential, main, push, merge, or deploy
action occurred.

## Changes

### Reward interaction

- `tradeInProgress()` now means an actual open ticket or live position, not setup formation.
- Boxes and Lost Wisdom pages share `finnSweptRewardTouch()`, which evaluates Finn’s prior-to-current
  body sweep rather than a single center-point sample.
- Boxes still require the authored tucked/shell-roll state. Real ticket/position focus still defers
  smash, reveal, and collect without deleting the object.

### FIRST WIN

- Replaced the system trophy/duplicate-text stack with one `firstWin` milestone object.
- Added a single responsive canvas composition: opaque obsidian card, cyan/gold rail and rim,
  bespoke faceted trophy/rays/handles, canonical shell, `PLAYER MILESTONE`, `FIRST TRADE WON`,
  `NOT LUCK. YOU READ THE CHART AND EXECUTED.`, READ/WAIT/EXECUTE beats, and an earned-shell badge.
- The card has one owner, one lifetime, and one safe mobile layout; the legacy emoji and loose large
  text are absent.

### First real trade

- The intro trade owns `_firstRide` and selects `GameMusic.play('firstTrade')`; ordinary trades still
  select `trade`.
- The dedicated score is a louder, denser 112 BPM minor track with phase-aware ducking.
- The first path is deterministic in structure: near-stop dip (`-0.82R` target), profit surge
  (`+1.15R` target with observed overshoot), hard give-back (`-0.10R` target), then target run.
- Transitions require reaching their authored target plus minimum dwell. The stop remains untouched,
  risk/target/economics do not change, and the later-trade generator is unchanged.

### Preview and verification

- `scripts/cq.sh qr` now supplies `?fresh=1`, not `?fresh=1&mute=1`.
- The loopback QA server prints the unmuted fresh URL while retaining an explicit muted option.
- Focused suite expanded to 21 cases. Browser suite expanded to F1-F10, M1-M2, and the 16 collision
  cells, with a fail-closed per-case timeout and isolated diagnostic controls.
- Canonical output was stamped and regenerated to both mirrors.

## Exact implemented candidate

- Parent HEAD: `bbf3aa559082220de39f9b46cfb38b761e2ac990`
- Build: **364**
- `chart-quest.html`, `index.html`, `website/game.html` SHA-256:
  `ea4c7fdc958b8f502e2588377068813881e37d9e9450c6c45ce7edbddf109a52`
- Browser bridge: `228f70b79f1d8f062bbfaa59a3166ed3680856539fc455135a1109ce02cda940`
- Browser harness: `7fa745f009206704ff1de631644085f201df63ca6b1d48278f40a78b404a4e67`
- Focused suite: `61b45ae0fa3d9d5df01ef1f3dcad788a474ea7bb220829a6d60b88a40453e99c`
- Verifier: `fdfd62153e54d0a2c10b79ec9a6bb27cd19d8d3fb6b0115014eaeac9f02a07aa`
- QA server: `720319dfb52670bdd9b216e694b080a3f321361b0384df0d52269f4d907895c4`

The implementation is ready for PM/CTO review and exact-byte QA. It is not release authorization.
