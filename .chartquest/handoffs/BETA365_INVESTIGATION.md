# Build 365 Investigation

## Founder report

The physical Build 364 retest exposed two release blockers and two bounded presentation requests:

1. A breakable box could appear beyond a trade portal and pass Finn while the trade owned input.
2. The replay/recap ending did not visibly show Finn crossing the exact take-profit or stop-loss line.
3. The first-trade score felt synthetic and overly computer-generated.
4. Ordinary centered feedback still used plain floating text below the game's visual bar.

## Root causes

- Box spawning checked only the instant a box was created. A box already placed ahead of Finn could
  remain beyond a subsequently spawned trade portal, making it unreachable while the live trade
  correctly deferred interaction.
- Replay exit annotations used the terminal price, but the Finn marker remained attached to the last
  candle body. The resolved frame was also visible for only one 240 ms interval before auto-details.
- The first-trade music route used a dense synthesized lead texture rather than one sparse authored
  score owner.
- Centered world feedback bypassed the authored milestone treatment and drew unframed text directly
  on the chart.

## Decision

Advance one bounded Build 365 strike. The trade portal owns an atomic reward-free corridor; planned
win/loss replay endings own an explicit crossed-line marker and readable terminal hold; the first
trade receives a warmer sparse score; ordinary centered feedback routes through one premium,
non-blocking ChartQuest toast. Do not change trade economics, curriculum, saves, movement, bosses,
release controls, providers, credentials, or production.
