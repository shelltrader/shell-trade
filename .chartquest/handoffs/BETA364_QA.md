# Build 364 QA

## Verdict

**PASS FOR FOUNDER MOBILE RETEST** on the exact fingerprint below. This is not production release
authorization. Production remains frozen.

## Exact identity

- Branch: `codex/beta-360-readiness`
- Parent HEAD during QA: `bbf3aa559082220de39f9b46cfb38b761e2ac990`
- Build: **364**
- All three game artifacts:
  `ea4c7fdc958b8f502e2588377068813881e37d9e9450c6c45ce7edbddf109a52`
- Bridge: `228f70b79f1d8f062bbfaa59a3166ed3680856539fc455135a1109ce02cda940`
- Harness: `7fa745f009206704ff1de631644085f201df63ca6b1d48278f40a78b404a4e67`
- Focused test: `61b45ae0fa3d9d5df01ef1f3dcad788a474ea7bb220829a6d60b88a40453e99c`
- Verifier: `fdfd62153e54d0a2c10b79ec9a6bb27cd19d8d3fb6b0115014eaeac9f02a07aa`
- QA server: `720319dfb52670bdd9b216e694b080a3f321361b0384df0d52269f4d907895c4`

## Automated results

| Gate | Result |
|---|---|
| Game inline syntax | **PASS — 10/10** |
| Build 364 focused suite | **PASS — 21/21** |
| Release controls | **PASS — 15/15** |
| Artifact-parity fixtures | **PASS — 5/5** |
| Full verifier | **PASS — 24/0/0/1 allowed skip** |
| Three-artifact exact parity | **PASS** |
| QA server self-test | **PASS** |
| Diff integrity | **PASS** |
| In-app Browser suite | **PASS — 28/28, 0 fail, 0 pending** |
| Captured Browser runtime/console errors | **0** |

The one verifier skip is the pre-existing optional Puppeteer proxy; the exact candidate was exercised
in the in-app Browser instead.

## Blocker-specific Browser evidence

### F8 — boxes and Lost Wisdom

With `setupFlow` active and no real ticket/position, the exact case produced:

- `boxBroken: true`
- `pageCollected: true`
- `pageFoundCount: 1`
- one shell reward
- one swept pass from x=1106 to x=1190 through reward x=1148

Result: **PASS**. The visible interaction no longer disappears merely because setup is forming.

### F9 — first-trade music and path

- First-trade route: `firstTrade`; ordinary route: `trade`.
- 42 candles.
- Phase indices: surge 13, shakeout 21, run 35.
- Near-stop scare: `-0.90R` without touching the `-1R` stop.
- Profit peak: `+1.47R`.
- Give-back: `-0.23R`.
- Final: target at `+1.67R`.
- 17 red and 25 green candles.

Result: **PASS**. The authored first trade now visibly scares, rewards, gives back, and resolves.

### F10 — FIRST WIN

- One milestone card.
- Zero emoji floaters.
- Zero loose large-text floaters.
- Exact title `FIRST TRADE WON`.
- Exact earned reward 10 shells in fixture.
- Visible for approximately eight seconds in the QA preview.

Rendered inspection at 390x844: **PASS**. The final card is opaque/readable, uses the bespoke trophy and
canonical shell, and owns the full copy/reward hierarchy.

## Audio preview posture

The exact fresh local route was opened without `mute=1`. After the fresh confirmation the URL
normalized to `chart-quest.html`, the visible music control was `🎵`, and the Build 364 preview command
now defaults to the same music-on posture. Browser automation verifies routing/state, not subjective
speaker loudness; the Founder mobile retest owns the audible mix judgment.

## Founder retest checklist

1. Shell-roll through one box and one visible Lost Wisdom page before opening a trade.
2. Hear the dedicated music when the first real trade opens.
3. Watch the first trade approach stop, surge well into profit, give most of it back, then finish.
4. Judge the new FIRST TRADE WON milestone, bespoke trophy, copy, and shell reward.
5. Confirm later trades and normal shell collection still feel unchanged.

Any change to an evidence-bound artifact, bridge, harness, focused suite, verifier, or QA server
invalidates this verdict and requires proportional reruns.
