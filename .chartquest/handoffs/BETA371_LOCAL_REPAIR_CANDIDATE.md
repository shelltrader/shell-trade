# Build 371 Local Pacing Repair Candidate

**Date:** 2026-08-24  
**Status:** **VERIFIED LOCALLY — PREVIEW/PRODUCTION RELEASE HELD**

## Exact identity

- Branch target: `codex/beta370-player-paced-trades` (non-production only).
- Repair payload commit: `3019058b32c6acddc8fc5530569f24d95c76a98f`.
- Parent control-plane evidence commit: `2a438facd1acdc41eaad41f4184e5b25b7a4ce53`.
- Build: **371**.
- Source/root/site SHA-256:
  `3224c603255ee5d1210295b31151f7de04ca6c3b2a211b158f14627b76a0ab09`.
- Unchanged CQTrack SHA-256:
  `55b523b5806963a57f4ca3a94b8437b1c1fc0b10a5e55ccbba692c78bcd18c1f`.
- Unchanged survey migration SHA-256:
  `3283707ade48d84447cf003377613b897bb004d836b89a5175df082930032a4d`.
- Production: Build 367 remains live. No `main` push, production deployment, tester-link send, or
  production provider/database mutation occurred.

## Verified root cause

Build 370 removed the guided wall clock and special forced carry, but the inherited platformer
still advanced `turtle.x` every frame whenever `turtle.halt` was false. Guide dismissal cleared
`paused` and left that base walk active. Finn therefore crossed new candle frontiers with no new
input; the resolver updated real `trade.lastPrice`, replay path, and P&L. The old pacing test called
`maintainCandles()` with a fixed frontier and never executed the production horizontal-update owner,
so its 11/11 result did not cover the served failure.

## Minimum repair

Build 371 adds one narrow Level 1–3 live-trade movement-intent owner:

- trade entry, guide open/Close/Escape, pointer cancel, blur, page hide, and background/resume halt
  and disarm guided horizontal movement;
- each explicit keyboard, canvas tap, or swipe action owns at most one spatial candle boundary;
- the boundary is clamped against touching-candle geometry and abnormal movement spikes, so the
  price frontier, session progress, path, and `lastPrice` advance exactly once;
- backtracking/review consumes one spatial boundary without changing the monotonic price frontier;
- the entry resolver cursor is seeded even when no future suffix existed before the approved +2
  terrain lookahead;
- TP, SL, or manual Close releases the guided owner before `trade` is cleared, restoring inherited
  free-roam auto-walk; no-trade and Level 4+ motion remain unchanged;
- the final teaching step now says exactly how the interaction works and its button closes the guide
  without falsely claiming that it already started movement.

The bounded `maxSeen + 2` lookahead remains the approved collision/render terrain supply. It may
author two unreached candles at entry, but idle time cannot extend it again, and those candles cannot
change resolved `lastPrice`, replay path, P&L, session progress, or outcome until Finn traverses them.

## Verification evidence

| Gate | Result |
|---|---|
| Player-paced production-geometry contracts | **13/13 PASS** |
| Teaching/guide contracts | **5/5 PASS** |
| Full `scripts/verify.js` | **27 pass, 0 fail, 0 warn, 1 optional Puppeteer skip** |
| Source/root/site parity | **PASS — SHA-256 `3224c603...`** |
| Protected systems | **PASS — Finn, CFG, lesson set, boss engine, and save keys unchanged** |
| Independent root-cause/runtime re-review | **APPROVE — no remaining finding** |
| Independent adversarial test re-review | **APPROVE — no remaining finding** |

Permanent coverage now runs the real horizontal and frontier/resolver fragments with touching
candles, a deliberately excessive movement boost, five idle seconds before and after a step,
backtracking, background cancellation, guide entry/exit, no-overhang cursor seed, wall anti-hop,
manual release, free-roam reset, Level 4+ reset, and all keyboard/tap/swipe arming routes.

## Release hold and exact next action

This local approval does not supersede the failed served Build-370 result. Next:

1. Push only exact payload `3019058` to `codex/beta370-player-paced-trades` and wait for a successful
   non-production Pages deployment.
2. Prove the served `/game` bytes equal `3224c603...` before testing.
3. Repeat Preview pacing timing, one-action/one-candle, guide scroll/Close/Escape, backtrack,
   pause/background/resume, long/short TP/SL/manual Close/replay, Q1–Q7, valid invite attribution,
   Founder Access/dashboard/export, and returning-service-worker checks. Physical phone remains the
   Founder's acceptance gate.
4. Only after every gate passes: re-run release controls, prepare an exact manifest/lock, verify
   provider bindings/secrets and rollback evidence, and obtain explicit release authorization before
   any `main` push. After deployment, verify the production fingerprint twice before sharing links.

Do not reapply Preview migration `0003`; it is already present. Do not alter recovered Supabase
archives or claim historical reconciliation complete.
