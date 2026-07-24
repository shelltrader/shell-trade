# ChartQuest — Weekend Beta Plan (10 friends)

**Date:** 2026-07-14 · **Goal:** invite 10 friends this weekend to an experience you're proud of.
**Time budget:** ~8h/day × 2–3 days. Synthesized from a full read of every session's docs + memory + a live verification pass.

---

## The one thing you may not realize

**Your website is done and live. Your *game* is not the version you think it is.**

- **Deployed game** (what friends play at `/play`) = **build 254**. It still resolves the
  tutorial trades the OLD way — the coin-flip-era feel you already rejected. `authoredTutorialOutcome`
  count in the live game: **0**.
- **Your latest game** = **build 261**, sitting **uncommitted in your working tree**. It has the
  authored fair-trade fix (L1–3 = earned confidence, no early-loss betrayal), the min-duration gate,
  the boss free-win fix, and more. It **passes the trading fairness gate** (`verify.js` check 11: PASS).

So the single highest-value launch action is **getting build 261 live**. Right now a friend's very
first trade could randomly lose (build 254), which is the exact thing that makes a non-gamer quit —
and the fix is already written, just not shipped.

Everything else below is secondary to that.

---

## Where we are

| Layer | Status |
|---|---|
| Marketing site (`playchartquest.com`) | ✅ **Live & hardened.** Mobile menu, PWA install, SEO/social card, offline — all deployed (`origin/main = 19c4085`). |
| Cinematic intro text fix | ✅ Live in the deployed game. |
| **Deployed game build** | ⚠️ **254** — 7 builds behind; missing the fair-trade fix. |
| **Latest game build (261)** | ⏳ Uncommitted in working tree; FINN_V3 renderer is flag-gated **default OFF** (safe); passes TES gate. |
| Guest play (no signup) | ✅ Works — friends can play with zero email. |
| **Guest progress saving** | ❌ **Not persisted** — a guest resets to Level 1 on reload. |
| Account signup (email) | ❌ Broken — dev SMTP throttles, Auth Site URL still `localhost:3000`. |
| Real-device testing | ❌ **Zero.** All mobile/PWA work is emulation-only. |

---

## Ranked blockers

### 🔴 TIER 0 — do before inviting anyone

| # | Blocker | Fix | Effort | Who |
|---|---|---|---|---|
| 1 | **Deployed game is build 254 (rejected coin-flip trade).** Build 261 (fair) isn't live. | Bless build 261 → track `hero.png` (untracked, 2.97MB) → add a `hero.png` guard to `verify.js` → mirror to `website/game.html` → deploy to preview. | ~½ day | You bless it; I can drive the mechanics |
| 2 | **Guest progress doesn't save** — friends reset to Level 1 on reload. Most friends play as guest. | Persist the core player object (shells/level/xp/rank) to `localStorage`, rehydrate at boot. | ~2h | I can do it |
| 3 | **Email signup silently fails.** | Supabase → Auth → **turn OFF "Confirm email"** (auto-confirm) + set Site URL/Redirects to `https://playchartquest.com`. One toggle, no code. | ~15min | **You (dashboard)** |
| 4 | **Nothing tested on a real device.** | One iPhone + one Android: install to home screen, standalone launch (no white flash), ⛶ fullscreen, game boots + Finn renders, cold-open doesn't black-screen. | ~1–2h | **You (needs phones)**; I prep the checklist |
| 5 | **Cold-open can black-screen** (first 15s, no video poster fallback). | Paint a static hero frame immediately + SKIP visible from frame 1 + fall back if video hasn't painted in ~1.2s. | ~3h | I can do it |

### 🟡 TIER 1 — do if time, before wider launch

| # | Item | Effort |
|---|---|---|
| 6 | **Traversal wall before the first trade** — a non-gamer can hover/stall and quit before reaching the hook. Cheapest tame: shorten the run + calm the jetpack overshoot + a gentle "this way →" pull. (Protected system — needs your OK.) | ~3–6h |
| 7 | **Lock down `dashboard.html` + anon RPCs** (migration 0009). Testers will submit bug reports (possible PII) readable by anyone with the public key. | ~1h |
| 8 | **First-win juice** — make the first win a *peak* (shake, sting, shells raining, name the skill) instead of a trophy card. | ~5h |
| 9 | **Basic funnel telemetry** so 10 friends produce data, not vibes (reached-first-trade → beat-Guardian-1 → hit-first-loss). | ~1–2h |

### ⚪ TIER 2 — postpone past this beta

- DPR performance cap (`patches/dpr-cap-main-canvas.patch`) — apply with the game release; frame-rate only, 3× phones.
- Trade-FEEL / ownership overhaul (~12h) — the real long-term fulcrum, too big for this week. **Observe it in the beta instead** (watch a friend's face on the first dip).
- Boss-1-is-a-quiz redesign (~16h). Checkout wiring. Structural stops/targets. Trading V2 (not greenlit).

---

## The 2–3 day plan

### Day 1 — Ship the *good* game + make progress stick
- **You (15 min):** flip the Supabase email-confirmation toggle + fix Site URL (blocker #3).
- **You (30 min):** review build 261 with FINN_V3 off (`?v3` absent) — is it what you want live? Bless it or say what to revert.
- **Me:** track `hero.png`, add the `verify.js` guard, add **guest localStorage persistence** (#2), mirror 261 → `website/game.html`, run the gate, deploy to the **preview** URL.
- **End of day:** the fair-trade, progress-saving game is on the preview, not yet production.

### Day 2 — Real device + first-impression
- **You (~2h):** the real-device pass on iPhone + Android against the preview (I'll hand you the exact checklist). This is the highest-value 2 hours of the week.
- **Me:** cold-open poster fallback (#5); migration 0009 dashboard lockdown (#7).
- **You + me:** the cheapest traversal tame (#6) if the device pass shows friends stalling.

### Day 3 — Polish, dry-run, invite
- **Me:** first-win juice (#8) + basic funnel telemetry (#9) if time.
- **You:** a real dry-run — you + 1–2 people play start→first boss on a phone, as guest AND with a new account.
- **Promote to production, tag the release, send the 10 invites.**

---

## Go / No-Go for the weekend

**GO when all of these are true:**
- [ ] Build 261 (fair trade) is deployed to production
- [ ] Guest progress survives a reload
- [ ] Email confirmation toggled off (or you tell friends "tap Play as Guest")
- [ ] One real-device pass: game boots, Finn renders (not the old turtle), first trade is reachable, no cold-open black screen

**NICE to have:** traversal tamed · dashboard locked · funnel telemetry · first-win juice

**ACCEPT for a first beta:** trade-feel is "watch their reaction," not fully juiced · Boss-1 stays a quiz · gate the free run at Guardian 3 (past it, honest trades can feel random)

---

## The honest bottom line

Would I be proud for 10 new friends to see this? **The website — absolutely, today.** **The game —
only once build 261 is live and guest progress saves.** Those two things (plus the 15-minute email
toggle and one real-device pass) are the difference between a beta that lands and one that
face-plants on a random first-trade loss or a Level-1 reset. Everything else can wait until after
you've watched 10 real people play.
