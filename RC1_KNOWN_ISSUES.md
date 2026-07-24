# ChartQuest RC1 — Known Issues & Mobile Playtest Plan

Companion to `RC1_RELEASE_NOTES.md`. Build 262 is live in production.

---

## Stage 6 · Known issues (nothing here should surprise you post-launch)

### Founder actions (I can't do these; guest play means they don't block the beta)
| # | Item | Impact | Action | Blocks beta? |
|---|---|---|---|---|
| K1 | **Supabase: email confirmation ON + dev SMTP + Site URL = `localhost:3000`** | If a friend makes an ACCOUNT, the confirmation email throttles/doesn't arrive and its link is dead. | Supabase → Auth → turn **OFF** "Confirm email" (auto-confirm) **and** set Site URL/Redirects to `https://playchartquest.com`. 15 min, no code. | **No** — "Play as Guest" always works and now saves progress locally. Either tell friends to tap Guest, or flip this so accounts work too. |
| K2 | **Migration 0009 not applied** — `dashboard.html` is publicly reachable and the bug-report / analytics tables are anon-readable. | Testers' bug reports (possible PII) + telemetry readable by anyone with the public key. | Apply `0009_lockdown_switchover` (the RC1 client uses the sanctioned `ingest` fn, so this is now safe to apply), or block `/dashboard.html` at the Cloudflare edge. | **No** for the friends' experience; **yes** do it before a wider/public launch. |

### Deferred to Phase 2 (explicitly NOT touched — stabilization only)
| # | Item | Why deferred |
|---|---|---|
| K3 | **Traversal wall before the first trade** — a non-gamer can stall/quit before the hook. | Protected system; the founder wanted it left for a pre-flight. **RC1 now MEASURES it**: `session_start` with no `reached_first_trade` = stuck in traversal. Watch the data + a real face. |
| K4 | **Trade FEEL / ownership** ("click buttons, no meaning") | The real long-term fulcrum, but a redesign — out of scope for RC1. **Observe it in the beta** (watch a friend's face on the first dip) before building anything. |
| K5 | **Uncapped `devicePixelRatio`** on the main canvas (2.25× fill on 3× phones) | Perf, not correctness. Patch ready: `patches/dpr-cap-main-canvas.patch` (no-op ≤2×, −55% pixels on 3× phones). Ship in a follow-up if the device pass shows frame drops. |
| K6 | **First win is a trophy card, not a visceral peak** | Juice, not a blocker. Phase 2. |
| K7 | **Boss 1 is a quiz with a health bar** | Structural; the biggest ~15-min churn driver per the Game-Director audit, but not a first-10-minute blocker. Post-beta, data-informed. |
| K8 | **Checkout is a stub** (`cqStartCheckout`) | Few of 10 friends reach the Boss-3 paywall in a first sitting; WTP is a Phase-2 concern. |

### Smaller / cosmetic
- **K9 · Guest local save covers the player object only** (shells/level/xp + bosses-beaten + max-hour + first-loss/win flags). The **journal (trade history), notes, and daily streak** still persist to cloud only — a guest who reopens sees their level but an empty journal. Minor inconsistency; fine for a first-hour beta.
- **K10 · One `alert()`** for "note too long (max 2000)". Crude but a rare edge case.
- **K11 · Telemetry delivery unverified from a device.** The queue works and the `ingest` backend is proven (433 rows), but the sandboxed test browser can't reach Supabase (`status 0`). Confirm on a real device (see below). Events are durable — never lost, just delayed if delivery hiccups.
- **K12 · Real-device testing STILL not done.** Everything is verified in emulation + on the live domain by asset/content checks, but the on-phone install / fullscreen / cold-open / guest-reopen path needs a human with a phone.

---

## Stage 7 · Mobile playtest recommendations (before you invite 10 friends)

### The 30-minute real-device pass (highest-value time you have)
On **one iPhone (Safari)** and **one Android (Chrome)**, against `playchartquest.com`:

1. **Cold open:** load `/play` on a throttled connection → the Market Maker **poster shows immediately**, never a black screen; SKIP is tappable.
2. **Guest reopen (the C1 fix):** play as Guest, earn shells / level up, **fully close** the tab/app, reopen → **shells & level survive** (no reset to Level 1).
3. **First trade reachable:** can a *true non-gamer* get from the intro to the first trade without stalling in the traversal? (This is K3 — the one to watch.)
4. **Install:** Add to Home Screen (iOS) / native prompt (Android) → icon is the candlestick mark, not cropped; launch standalone → no browser chrome, no white flash.
5. **Fullscreen:** `/play` ⛶ → iPhone opens the install sheet (not a silent no-op); Android goes real fullscreen.
6. **Telemetry delivery (K11):** after a play session, open the admin Dashboard (or query `content_events` by your `cq_pid`) and confirm `session_start` + `reached_first_trade` + `trade_win/loss` actually landed in Supabase.

### Watch for the 4 beta questions
1. **Can complete beginners reach their first trade?** → sit beside a non-gamer; clock time-to-first-trade; cross-check with the `reached_first_trade` funnel.
2. **Does the first trade feel exciting?** → **watch their face on the dip.** Lean-in = you've won; blank = trade-feel (K4) is your Phase-2 roadmap.
3. **Do they continue after Boss 1?** → do they keep going, or put the phone down? (`boss_defeated` → later events.)
4. **What prevents them from loving it?** → the last event per session tells you where each friend stopped.

### Set expectations before inviting
- **Tell friends to tap "Play as Guest"** (unless you flip K1). Progress now saves locally either way.
- **The free run is strongest through Guardian 3** (the authored confidence phase). Past it, Level-4+ trades resolve honestly and can feel random to a beginner — that's expected; don't over-read late-game "it felt random" feedback.
- It's a beta: the goal is **feedback**, not a finished game. Boss-1-as-quiz, un-juiced first win, and the traversal wall are known and deliberately deferred.

### After the beta — turn data into decisions
Query `content_events` grouped by `session_id`:
- `session_start` count = who showed up (+ device/guest mix).
- `reached_first_trade / session_start` = the traversal-wall pass rate (validates or kills K3).
- `trade_win + trade_loss` per session = did the first trade land.
- Drop-off histogram of last-event-type = the single most actionable output.
