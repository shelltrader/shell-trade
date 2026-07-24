# ChartQuest Landing — V3 "Portal" Experience

**Date:** 2026-07-07 · **File:** `website/index.html` (reimagined from scratch) · Marketing site only — no game code touched.

**North star:** don't design a landing page — design a *portal into another world*. Mix target **50% game · 30% adventure · 20% trading**. The visitor's first thought must be **"that looks insanely fun,"** before "I might learn trading."

---

## 1 · Creative direction

- **One idea dominates: THE CHART IS THE WORLD.** Finn doesn't stand *beside* a chart — he dives *inside* it. Every visual serves that.
- **Tone:** premium game-launch page (think a Steam hero or a AAA reveal), not a SaaS/course/exchange page.
- **Adventure framing over trading framing:** worlds, Guardians, descent, "the chain," expedition map. Trading vocabulary is present but secondary.
- **No AI-website clichés:** no particle spam, no random glow, no generic SaaS cards, no cyberpunk cosplay. The one world motif is **candlesticks as architecture/terrain**, lit with gold. Effects are few and purposeful.
- **Finn is the guide** (Duolingo-owl / Pikachu role) — present in the hero, all three pillars, the descent, the preview, his own section, and the finale.

## 2 · Page architecture (IA)

1. **Hero Portal** — movie poster: "THE CHART IS THE WORLD" + a portal Finn dives into (live-chart placeholder).
2. **What is ChartQuest** — three world-pillars: **Explore · Trade · Battle**.
3. **Meet the Guardians** — 8 mysterious boss medallions (locked/legend), 11 total.
4. **How the World Works** — a vertical *descent*: enter the chart → candles are terrain → setups are puzzles → bosses teach.
5. **Gameplay Preview** — a few elegant **video/screenshot placeholders** (no screenshot walls).
6. **Quests > Courses** — short objection-handler.
7. **Meet Finn** — the mascot moment.
8. **The Expedition** (roadmap).
9. **Final CTA** — "STEP INTO THE CHAIN."

Rationale: hook + wonder first (hero), then "what even is this?" (pillars), then desire/mystery (Guardians), then comprehension (descent), then proof-to-come (preview), then objection, then warmth (Finn), then momentum (roadmap), then the jump (CTA).

## 3 · Hero concept

- Left: eyebrow **"◆ The world's first trading RPG"**, huge **THE CHART IS THE WORLD.**, sub *"Run across real charts. Spot trade setups. Defeat bosses. Become a trader."*, **Play Free** + **Watch the trailer**, a "↓ descend into the world" cue.
- Right: **the portal** — a gold-rimmed 3D-tilted window containing a stylised candlestick *world* receding to a gold horizon, with **Finn diving in** along a dashed arc + an "▾ ENTER" pulse. A clear placeholder line: *"↑ live bitcoin chart mounts here · you play inside it."* Subtle pointer parallax on desktop.
- Communicates in 5s: it's a game (portal + mascot), it's about charts/trading, the chart is the world (he's going *inside*), it's free (chip).

## 4 · Visual system

- **Palette:** deepened base `#060910`; bull `#16C784`, bear `#EA3943`, **gold `#FFD60A`** as the "treasure/portal" accent; blue/cyan for depth.
- **Type:** system stack, very large confident display (`clamp` up to ~104px), mono for kickers/labels with wide tracking.
- **World background (fixed, subtle):** brand glows + a masked grid + a faint **candlestick skyline** ("architecture in the fog") + 3 slow vertical "data streams." All low-opacity, reduced-motion-aware, GPU-cheap.
- **Signature components:** the portal, gold **Guardian medallions**, world-pillar cards with candle scenes, the numbered **descent** rail.

## 5 · Section designs — see the implementation in `website/index.html`. Exact copy is in the file (kept lean and adventurous).

## 6 · Placeholder media strategy (nothing faked)

Designed *around* future assets, clearly labeled, grep-able tokens in the HTML:

| Token | Where | Becomes |
|---|---|---|
| `[LIVE-CHART]` | Hero portal | the live BTC/USD chart widget mounts inside the frame |
| `[VIDEO:trailer]` | Gameplay Preview (feature) + trailer modal | main gameplay trailer (.mp4, muted loop) |
| `[VIDEO:boss]` | Preview | a boss-battle clip |
| `[SHOT:trade]` | Preview | a first-trade screenshot |
| `[ART:guardian]` | Guardians | real boss art replaces the gold sigil medallions |

No real gameplay screenshots are used on the page (per direction) — only elegant placeholders + Finn mascot art (which is real).

## 7 · Mobile strategy

- Single column; portal drops below the headline and reads native (it's already a framed scene).
- Pillars, previews, versus stack; Guardians go 2-up; descent + roadmap become vertical rails.
- Burger nav; full-width CTAs; sticky bottom "Play Free" bar; background skyline shortened.
- Verified: **no horizontal overflow at 390px**; reduced-motion disables all animation.

## 8 · Production code

Shipped in `website/index.html`: self-contained (inline CSS/JS, no frameworks/CDNs, CSP-safe). Motion is tasteful and cheap (CSS keyframes + one pointer-parallax handler), all gated by `prefers-reduced-motion`. Robust reveal with a safety net so content can never get stuck hidden.

## 9 · Assets to add later (highest impact first)

1. **Live BTC chart widget** in the hero portal (`[LIVE-CHART]`) — the payoff of the whole concept.
2. **Gameplay trailer** (`[VIDEO:trailer]`) — silent autoplay loop; single biggest excitement lift.
3. **Real Guardian art** (`[ART:guardian]`) — replace the emoji sigils with painted boss portraits; huge for the "mysterious world" feel.
4. Boss-battle clip + first-trade shot for the preview tiles.
5. A real **Discord** invite (`CQ.discord`).

## 10 · Ideas to make it unforgettable

- **Scroll = descent.** Lean harder into "going deeper into the chain": each section a layer, with a thin depth-gauge on the side ("DEPTH: World 3").
- **The portal comes alive on load:** candles build once, Finn does a single dive animation into the chart on first view.
- **A named world per Guardian** with its own color grade (a mini biome preview on hover).
- **"Enter" as the verb** everywhere instead of "Play" in a few spots — reinforces the portal metaphor.
- **A 3-second silent hero loop** (once assets exist) of Finn literally landing on a candle — that single clip will sell the whole thing on social.
- **Shareable "world map"** image (all 11 Guardians) as the `og:image` so links look like a game, not a site.

---

# V4 · Elevation pass (worldbuilding, not restructure)

Same architecture — elevated to feel like a handcrafted game world (Hollow Knight / Hades / Zelda, built from markets). Changes, all in `website/index.html`:

1. **Cinematic hero.** Added a full-bleed **hero-scape** behind the portal: giant candlestick **mountains** receding into a **glowing gold horizon**, with atmospheric haze. The chart world now extends *beyond* the portal — a sense of entering another dimension, not looking at a window.
2. **The page is one descent.** A fixed **depth rail** on the left tracks scroll as depth and names the current layer — *Surface → The Gates → The Bestiary → The Descent → The Vault → The Trials → The Map*. Full labelled gauge on wide screens; a thin glowing depth-line on laptops; hidden on mobile (kept out of the content gutter).
3. **Guardians → The Bestiary.** No longer feature cards. A dramatic **Final Boss banner** (The Market Maker: spinning rune sigils, red/gold danger glow, "SEALED · ???", and a **nervous dazed Finn** sizing him up) over an ominous grid of rune-ringed medallions with **SEALED / ??? / Undiscovered** states. Reads like discovering raid bosses.
4. **Handcrafted texture.** A subtle **film-grain** overlay kills the flat "AI page" look; gold torchlight vignette on the Bestiary.
5. **Premium placeholders.** Preview frames got **viewfinder corner brackets** and the brief's labels: `[ TRAILER GOES HERE ]`, `[ BOSS BATTLE GOES HERE ]`, `[ FIRST TRADE GOES HERE ]`.
6. **More Finn** as guide (hero dive, all three pillars, every descent step, the Bestiary's nervous cameo, the preview, his own section, the finale).

Bug fixed en route: the depth rail overlapped the headline on narrow laptops (the 92vw layout leaves thin gutters) → made it a tiered gauge (thin line ≤1360px, full gauge above, hidden ≤900px).

**Visual-only comprehension check** (brief's test — would a no-text visitor get it?): portal + mountains = *the chart is a world*; Finn on the arc = *he goes inside*; pillars' candle scenes = *trade/battle happen on the chart*; the Bestiary = *bosses exist*; the depth rail + roadmap = *progression*. ✔

---

# V5 · Fewer boxes, more world

Feedback: *"remove 50% of the boxes/cards it instinctively wants to create."* Done — dissolved the card grids into open, editorial compositions and kept only a **handful of intentional frames**: the hero portal, the Final-Boss banner, the trailer frame, and the final CTA.

- **Pillars (Explore/Trade/Battle):** 3 cards → 3 open vignettes (candle scenes float on a soft ground-glow, no borders/panels).
- **Bestiary:** 8 boss cards → a borderless **wall of glowing sigils** (rune-ringed medallions + names, hovering on the section's atmosphere).
- **Quests > Courses:** 2 boxed columns → open two-list comparison with a hairline divider + the central VS.
- **Gameplay Preview:** 3 boxes → 1 real trailer frame + 2 lightweight **ghost slots** (dashed, no panel).
- Net: ~15 boxes removed; the page now breathes and reads as a world, not a landing-page grid.

---

# V5 · Polish / simplify / premiumize (send-to-friends pass)

Goal: a first-time visitor understands *what / how / why* in ~10s, and it feels like a premium indie-game launch (Apple/Stripe/Riot), not AI-generated.

1. **Removed the Guardians/Bestiary section** entirely (bosses not visually ready; it asked questions before the game was understood). Reintroduce later as one cinematic image of all 11.
2. **Removed "See the world in motion"** (gameplay preview) — no trailer yet; placeholder sections hurt trust.
3. **Real live BTC/USD chart** in the hero portal — TradingView Advanced Chart (5m, dark, candles only, no indicators/toolbars), `pointer-events:none` so it's a live but non-hijacking backdrop. Finn still dives *into* it (real market → enters → world). Replaces the illustrated chart.
4. **Moved "He jumps inside it"** to right after "3 ways to play" (auto-result of removing Guardians between them).
5. **Typography overhaul** — **Space Grotesk** (display) + **Inter** (body) via Google Fonts, with system fallbacks; tightened scale/tracking; replaced most `--mono` labels (eyebrows, trust, kickers) with Inter uppercase. This was the biggest "AI-generated" tell and the biggest premiumization.
6. **Fewer boxes / subtler background** (removed the animated data-streams; kept glows + grid + skyline + grain). Nav + footer links updated to the surviving sections. Depth rail layers reduced to Surface / The Gates / The Descent / The Trials / The Map.

### ⚠️ Deploy requirement (external resources now used)
The page loads **TradingView** (chart), **Google Fonts**, and **Binance** (chart feed). The repo `netlify.toml` CSP blocks all three. To ship: add `s3.tradingview.com` (script-src), `www.tradingview-widget.com`+`s.tradingview.com` (frame-src), `api.binance.com`+`*.tradingview.com` (connect-src), `fonts.googleapis.com` (style-src), `fonts.gstatic.com` (font-src) — or deploy `website/` as its own site / self-host fonts. Verified: the widget loads (network 200 + loading spinner rendered); candles draw in a real browser after a few seconds. Cross-origin iframe = not visible in static screenshots.

---

# V6 · Cinematic key-art hero

New official boss key art (`website/assets/hero-key-art.jpg`, optimized from the founder's `hero.png`) becomes the hero.

- **Full-bleed movie-poster hero** (`.hero-cine`, ~94vh, `object-fit:cover`): Finn faces the eleven Guardians; Market Maker center. Replaced the portal hero entirely.
- **Layout:** left = eyebrow · `THE CHART IS THE WORLD` · subline · **Play Free** + **Watch Trailer** (Watch Trailer → `#how` until a real trailer exists). A soft left→right + base scrim keeps text legible while preserving boss silhouettes; Finn stays visible center-bottom.
- **Real live chart merged into the scene:** the TradingView widget is positioned lower-right, feathered with a `mask-image` (fades left + top) so it reads as part of the landscape — no card/window. Its real price axis aligns with the art's rising chart (BTC ≈ the painted 40k–72k range), so the scale "continues upward naturally."
- **Removed** the old portal, fake tags (BTC/USD, LIVE, ENTER, p-note), the hero-scape mountains.
- **Mobile:** key art fills the hero (chart hidden — the art carries it), text + CTAs at the bottom over a base scrim. No horizontal overflow.

**Notes / open items:** the painted price numbers on the far right are baked into the key art (can't remove raster pixels) — offer to crop the right edge or use a scale-free key art. Preview screenshotter hangs on the live-updating chart iframe (verify via headless / real browser). CSP deploy requirement unchanged (TradingView + Binance + Google Fonts).

---

# V7 · The homepage IS the opening sequence

Goal shift: the page is no longer a marketing site — it's the first level. Emotional arc: *"never seen this" → "the chart is the world" → "that's a REAL chart" → "Finn jumps in" → "what's inside?" → "I'll try it" → the game begins.*

1. **Removed the live chart from the hero.** The two charts (painted + live) were competing — hero is now purely cinematic; the artwork breathes.
2. **New "This is a real market." section** right after "He jumps inside it" — the fantasy→reality bridge. A large, minimal, live **TradingView BTC/USD** chart (5m, dark, candles) in a clean frame. Subheading: *every adventure begins on a real Bitcoin chart… Finn jumps inside it — and so will you.*
3. **"Finn enters the chart" one-shot animation** above that chart: Finn flies in (jetpack glow), fades as he reaches the surface, the chart **pulses once** and glows, Finn's gone, the chart remains. ~2.6s, plays **once** on scroll-in (IntersectionObserver), GPU-only (transform/opacity/filter), respects `prefers-reduced-motion`.
4. **Microinteractions (AAA-subtle):** the Market Maker galaxy softly **breathes + turns** (blended radial + very slow conic, almost imperceptible); button + Finn-jetpack hover glows; the chart pulse. No flashy effects.
5. **Removed all course references** (footer `courses.html` link gone; footer now links The live market / Roadmap / Enter the game / Guild). No course funnels anywhere. Only goal: play.
6. **The page ends by BECOMING the game.** Final section **"ENTER THE CHART."** (gradient on "CHART", echoing the hero's "THE WORLD" — closes the loop: *the chart is the world → he jumps inside it → a real BTC chart → **enter the chart***) mounts the **real game** (`play.html`) inline on click — lazy (perf), borderless, full-width, no redirect/popup/new-page. A "▶ Enter ChartQuest" cover loads the iframe in place; a small "open full-screen ↗" link remains. *(Swap the embed target via the button's `data-game` / `CQ.game`.)*
7. **Continuity:** soft fog gradients at section tops + a subtle transform-only **hero parallax** (desktop, reduced-motion off) so sections feel like one descent, not a stack. Depth rail extended: Surface → The Gates → The Descent → **The Threshold** → The Trials → The Map → **The Portal**.
8. **Performance:** CSS transforms/opacity/filter + small SVG + one rAF (parallax) + IntersectionObserver. No WebGL/Three/Lottie. Game is lazy-loaded on click.

Verified via headless + eval (the preview screenshotter hangs on the live chart iframe). Same CSP deploy requirement.
