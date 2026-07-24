# ChartQuest Landing — V2 Conversion Rebuild

**Date:** 2026-07-07 · **File:** `website/index.html` (rebuilt) · **Goal:** maximize "Play Free" clicks + make the concept understood in 5 seconds. Marketing site only — no game code touched.

---

## 1 · Conversion audit (what was hurting Play-Free clicks)

| Problem | Fix shipped |
|---|---|
| Hero was concept art on a decorative SVG — looked like branding, not a game | Replaced with a **real in-game screenshot** in a browser-window frame + "ACTUAL GAMEPLAY" badge |
| Concept not clear in 5s | Headline now leads with the action; a **"See how it works in 15 seconds"** section sits directly under the hero |
| Game not proven | New **"Real gameplay. No mockups."** section high on the page (real HUD + phone screens) |
| **Fake testimonials + fake metrics** (12k+, 4.8★, quotes) — actively damaged trust | **Deleted.** Replaced with an honest **"Playable now · Open Beta"** credibility block using only verifiable facts |
| Too much Finn lore early | Finn demoted to a compact one-row strip near the bottom |
| Weak mobile comprehension | Real screenshots are phone-shaped → render native; proof gallery horizontal-scrolls; copy trimmed |

**Guiding principle applied:** optimize for *first-time visitor comprehension*, not prettiness. The fastest path to belief is real gameplay + a one-click free game, not persuasion copy.

---

## 2 · New page hierarchy (and why)

1. **Hero** — comprehension + primary CTA. Real gameplay visual answers "what is this?" instantly.
2. **See how it works in 15s** — 3 real-shot beats (Run the chart → Spot the setup → Beat the boss). Removes the "I don't get it" bounce before it happens.
3. **Real gameplay proof** — moved *up*. Trust must land before asking again. Real HUD + 4 phone screens = "this exists."
4. **The chart is the world + core loop** — the USP + the Learn→Practice→Trade→Boss mechanics, once they're already sold.
5. **It's a game — not a course** — objection handling for anyone burned by trading courses/YouTube.
6. **Open beta credibility** — honest status + real facts + CTA. Replaces fake social proof.
7. **Meet Finn (compact)** — mascot warmth, but *after* the game is sold.
8. **Roadmap** — momentum / "built in the open."
9. **Final CTA** — last Play Free + Discord.

CTA repeats at: hero, end of 15s section, proof section, beta block, final band, sticky mobile bar, nav. Six+ chances to click Play Free.

---

## 3 · Hero

- **Eyebrow:** `🎮 FREE BROWSER GAME · NO SIGN-UP`
- **Headline (chosen):** **"Run across real charts. _Learn to trade._"**
- **Alternatives considered:**
  - "The game where the chart is the world."
  - "Learn to trade by playing a game."
  - "It's a game. The levels are real charts."
  - "Run the chart. Become a trader."
- **Sub:** "ChartQuest is a game where the candlestick chart **is the world**. Play as Finn — run across the candles, spot real trade setups, take practice trades, and beat bosses. It's the fun way to actually learn trading. **Beginner-friendly. Zero real money.**"
- **CTAs:** `▶ Play Free` (primary) · `See it in 15 seconds ↓`
- **Visual:** real screenshot (`shot-predict`) inside a browser-window frame, "ACTUAL GAMEPLAY" badge, caption "👆 You're the turtle on the chart — call the next move."

Hits all five required signals: it's a game (frame + badge + turtle), it teaches trading (chart + setup), chart-as-world (the screenshot literally shows it), beginner-friendly + free (eyebrow + sub).

---

## 4 · Gameplay proof section

- Heading: **"Real gameplay. No mockups."**
- Feature: the **trade HUD** screenshot (Entry / Stop-Loss / Take-Profit with real prices + Finn on the candle) — proves real risk-management mechanics.
- Gallery: 4 phone frames (first trade, momentum setup, short setup, boss/structure-break) with horizontal scroll on mobile.
- Closes with "play it yourself →".

All images are **real screenshots from the build** — honest proof beats claims.

---

## 5 · Credibility strategy (replaces fake proof)

Pre-launch trust without lying:
- **Honest status flag:** "Playable now · Open Beta."
- **Real gameplay** (the whole proof section) instead of testimonials.
- **Verifiable facts only:** 10 worlds · 11 Guardian bosses · 38 trading terms · $0 real money · any browser · no sign-up.
- **The strongest proof is the product:** "you can play it in the next 5 seconds."
- **Built in the open** roadmap.

When you have them, add: real player recordings/clips, a short gameplay trailer, and (post-launch) genuine reviews. Slots are ready (see §9).

---

## 6 · Mobile optimization

- Single-column stack; hero art below the headline.
- Real screenshots are already phone-shaped → they look native, not shrunk.
- Proof gallery = horizontal swipe (scroll-snap).
- Burger nav (dedup fixed); full-width CTAs; sticky bottom "Play Free" bar appears on scroll.
- Copy trimmed for fast scanning; `loading="lazy"` on below-fold shots for speed on cellular.
- Verified at 390px.

---

## 7 · Implementation

Shipped in `website/index.html` (self-contained: inline CSS/JS, no frameworks/CDNs — CSP-safe). New components: browser-window frame, phone frames, real-shot step cards, proof gallery, honest facts row, compact Finn strip. Reused: nav, footer, robust reveal (safety net), modals, sticky CTA.

---

## 8 · Real assets used (copied into `website/assets/`)

| Asset | Source (real capture) | Used in |
|---|---|---|
| `shot-predict.png` | `docs/screenshots/trade_screen_v43_preview.png` | Hero |
| `shot-terrain.png` | `docs/previews/handcrafted-levels.png` | 15s step 1 + chart-is-world |
| `shot-momentum.png` | `docs/screenshots/fullscreen_chart_long.png` | 15s step 2 + gallery |
| `shot-structure.png` | `docs/screenshots/bos_setup_level3_fixed.png` | 15s step 3 + gallery |
| `shot-hud.png` | `docs/previews/trader-mode.png` | Proof feature (Entry/SL/TP) |
| `shot-level1.png` | `docs/screenshots/level1_pristine_after_fix.png` | Gallery |
| `shot-short.png` | `docs/screenshots/fullscreen_chart_short.png` | Gallery |

---

## 9 · Assets still worth adding (highest → lowest impact)

1. **Fresh current-build screenshots.** The ones above are real but from an earlier build (older Finn sprite). Recapturing the same screens on the current build is the #1 upgrade for accuracy + polish. Drop-in: overwrite the `assets/shot-*.png` files.
2. **A 10–20s gameplay clip / trailer** (silent, looping `<video>`). Add a video slot in the hero or proof section. Local file (CSP blocks external embeds).
3. **A real boss-fight screen** (a Guardian character mid-challenge) for step 3 / gallery.
4. **A "running across candles" action shot** (Finn actually mid-run on the chart) — the one gameplay moment the current captures don't show cleanly.
5. Post-launch: real player quotes + a genuine rating.

---

## 10 · Further conversion levers (not yet done)

- Wire a real **Discord** URL (`CQ.discord` in the page script) — community = retention proof.
- Add an autoplaying muted **gameplay loop** in the hero (biggest lift once you have a clip).
- A/B test the headline (the 4 alternatives above).
- Consider a tiny **"▶ 0:15 how it works" video** button in the hero for reel-driven visitors.
- Add `og:image` = a real gameplay frame (currently the poster) so shared links show the game.
