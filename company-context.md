# Company Context — Shell Trade

> Single source of truth for what we're building and why. Every agent, prompt template, and piece of content in this repo should trace back to this document. If a piece of content contradicts this file, the content is wrong.

---

## Elevator Pitch

Shell Trade is a side-scrolling RPG where a turtle named Shell learns to trade crypto by jumping across live candlestick charts — turning the single hardest thing to teach a beginner (reading price action without blowing up an account) into a platformer you actually want to keep playing. Every boss fight teaches a real trading concept (candle reading, stop-loss discipline, market structure, VWAP, multi-timeframe analysis, leverage math), every run is built from real market data, and every meaningful in-game moment — a clean boss win, a stop-loss save, a level-up — is structured data the company can turn into social content automatically. The game is the product. The gameplay is also the marketing department.

## Vision

A generation of new traders who learn risk management before they learn to ape into a coin — because they learned it from a turtle, not from a liquidation. Long-term, Shell Trade becomes the on-ramp every crypto-curious beginner hits first: free, addictive, and quietly rigorous, with a turtle mascot as recognizable in trading circles as Duolingo's owl is in language learning.

## Mission

Make real trading education so mechanically fun that people finish it, and make every minute of gameplay double as content that teaches the same lessons to people who haven't installed the game yet.

## Core Gameplay Loop

1. **Pick a faction.** The player selects a crypto faction (BTC, ETH, SOL to start; BNB, DOGE, XRP unlock later by level/Shells) — each with its own color identity, volatility profile, and difficulty rating, all driven by live Binance market data.
2. **Run the chart.** Shell platforms across live candlesticks rendered as the level geometry — candle color, wicks, and structure are the terrain.
3. **Take the trade.** The player reads the setup and enters a simulated trade: direction (long/short), risk %, stop-loss, take-profit, leverage.
4. **Learn the lesson.** A "Hour" of curriculum (`CURRICULUM` / `LESSONS` / `QUIZ_QUESTIONS` / `TERMS`) gates progress — concepts build from candle basics to leverage math across 6+ hours.
5. **Face the boss.** Each Hour culminates in a data-driven boss fight (`BOSSES{}`) that tests the Hour's concept directly — lose your simulated HP for wrong reads, deal damage for right ones.
6. **Earn and rank up.** Wins pay out Shells 🐚 (in-game currency) and XP. XP drives player level, which drives rank (`RANKS[]`: Drifter → Plankton → Minnow → Crab → Pufferfish → Octopus → Dolphin → Shark → Whale → Trader).
7. **Review and retain.** The Trading Journal (Terms, Lessons, Trades, Notes tabs) lets players replay annotated trades, see what actually happened versus what they predicted, and build a permanent record — reinforcing the lesson after the dopamine of the win/loss fades.

## Target Audience

Primary: crypto-curious adults aged 18–34 who already lurk in trading/crypto content (TikTok, YouTube Shorts, X) but have never taken a real position, or took one and got liquidated. Secondary: existing retail traders looking to shore up fundamentals they skipped (risk management, structure, multi-timeframe analysis) without sitting through a paid course first. Tertiary: parents/older siblings looking for a financially literate alternative to "let a 16-year-old learn trading from a Discord call."

## User Personas

**"Liquidated Luis," 24** — Aped into a memecoin off a TikTok, got margin-called within a week, still curious about crypto but scared of losing money again. Wants to understand what he did wrong before he risks real capital again. Finds Shell Trade through a "this is why your stop-loss matters" clip.

**"Curious Casey," 29** — Has indexed into ETFs for years, crypto-curious but intimidated by jargon (VWAP, order blocks, leverage). Treats Shell Trade like Duolingo — a few minutes a day, low stakes, gamified, no fear of "doing it wrong" because nothing is real money.

**"Grinder Gabe," 21** — Already trades small amounts on a real exchange, mostly on vibes. Wants to actually understand structure and risk management rather than guess. Plays for the boss fights specifically because they're a real knowledge check, and shares clips of boss wins as a flex.

**"Worried Wendy," 45** — Has a younger relative getting into crypto unsupervised and wants something to point them at that teaches caution and risk management rather than YOLO trades. Discovers Shell Trade through Build-in-Public content and shares it as the "safe" alternative.

## Turtle Character Profile

**Name:** Shell
**Species:** Turtle (deliberately the opposite mascot energy of crypto's usual "ape," "bull," "diamond hands" iconography — turtles are patient, slow, careful, and famously win the race)
**Personality:** Calm under pressure, methodically curious, allergic to FOMO. Shell doesn't get excited by green candles or panic on red ones — Shell reads the chart. Dry, deadpan humor; the comic relief comes from how unbothered Shell is by chaos a human trader would panic over.
**Narrative role:** Shell is the player's in-fiction stand-in — every lesson the player learns, Shell is learning too, one Hour and one boss at a time. Shell has not "made it" yet; Shell is still leveling up, which keeps the character relatable rather than aspirational-and-distant.
**Visual identity:** Shell's shell doubles as a UI surface (rank insignia, faction color theming) — the character literally carries the player's progress on its back.
**Catchphrase energy:** Slow and steady. Protect the shell (capital). Never trade naked (without a stop-loss).
**Why a turtle, specifically:** It is the single clearest visual rebuttal to degen trading culture, and it's a built-in metaphor for the entire product thesis — patience and risk management beat speed and leverage over a long enough timeline.

## Educational Objectives

By the time a player clears the existing curriculum (Hours 0–6 and their bosses), they should be able to:
- Read a candlestick (body, wick, color) and identify dojis and wick rejections (Boss 0, The Market Maker).
- Distinguish a real breakout from a fakeout by reading the whole candle, not just color (Boss 1, The Fakeout).
- Apply stop-loss discipline, size risk at 1–2% per trade, and understand risk:reward ratio and leverage danger (Boss 2, The Liquidator).
- Identify market structure: Break of Structure (BOS), Order Blocks, and Change of Character (ChoCh) (Boss 3, The Structure Shark).
- Use VWAP as an institutional fair-value and support/resistance reference (Boss 4, The VWAP Phantom).
- Perform multi-timeframe / top-down analysis and align higher-timeframe and lower-timeframe confluence (Boss 5, The Timeframe Titan).
- Do leverage math, size positions correctly, and understand trading expectancy (Boss 6, The Leverage King).

The throughline across every Hour: risk management is not a footnote, it is the curriculum. Every boss after #0 is, underneath its theme, another test of "did you protect your capital."

## Monetization Assumptions

- **The game itself is free and ungated at the core-loop level** — it is the top of funnel, not the product being sold.
- **Course upsell**: a separate, paid ~20-hour in-depth trading course is the actual monetization product; the game is the funnel and trust-builder that proves the teaching method works before asking for money. Upsell happens primarily via email after account signup, not as a paywall inside the game.
- **Account layer**: free email+password accounts (no KYC) via Supabase let players save progress and sync their Trading Journal — this is also the email capture mechanism for the course upsell funnel.
- **Cosmetic/progression monetization (future, unconfirmed)**: Shells 🐚 and a planned secondary currency ("Pearls") are currently earned in-game only; a paid-currency layer is a plausible future lever but is explicitly not part of the current monetization plan and should not be assumed in content or roadmap claims.
- **Distribution cost stays near zero by design**: browser-first (GitHub Pages / Netlify), portrait-mobile-first, no app install required to start — App Store wrapper is a later-stage distribution play, not a monetization gate.

## Brand Voice

See `marketing/brand-voice.md` for the full specification. Summary: calm, dry, competence-flexing rather than hype-flexing. Shell Trade talks about trading the way a good teacher talks about a hard subject — plainly, a little wry, never condescending, and allergic to the "🚀 TO THE MOON 🚀" register of crypto-native marketing. The brand is the rebuttal to that register, not a participant in it.

## Growth Strategy

1. **Gameplay-as-content engine (primary, structural advantage)**: every meaningful in-game moment (boss win, stop-loss save, level-up, pattern correctly identified) is captured as a structured content event (see `content-events/schema.md`) and routed through an agent pipeline (see `agents/` and `automation/architecture.md`) into platform-native clips, scripts, and posts — at a marginal cost per piece of content that approaches zero once the pipeline is built.
2. **Build-in-public**: the development of the game itself (and, recursively, the development of this content pipeline) is a content pillar — crypto-adjacent audiences reward visible, fast-moving builders.
3. **Educational authority over hype**: lead with "here's why your stop-loss matters" rather than "here's a coin going up" — this differentiates Shell Trade from the sea of price-action hype accounts and builds the trust the course upsell later depends on.
4. **Platform-native distribution, not a single funnel**: short-form clip platforms (TikTok, Shorts, Reels) drive top-of-funnel discovery; X drives credibility within the trading/crypto community; YouTube long-form houses the deeper educational content and doubles as SEO surface area; community management (Discord/comments) converts viewers into players and players into community.
5. **Mascot-led brand recall**: Shell is designed to be screenshot-able, clip-able, and meme-able independent of any single platform's algorithm — durable brand equity that doesn't evaporate if one platform's reach drops.
6. **Funnel discipline**: game (free, top of funnel) → account (email capture) → course (paid product) — growth activity is judged by how well it feeds this funnel, not by vanity metrics alone.

## Current Roadmap

Source of truth for build sequencing is `ROADMAP.md` (90-day execution plan) and `PROJECT_STATUS.md` (engineering handoff doc). High-level priorities, in order:

1. **Accounts / membership** — email+password via Supabase, no KYC, to save progress and sync the Trading Journal (also the course-funnel email capture).
2. **More bosses** for Hours 3–8, extending the curriculum past leverage math into more advanced trading concepts.
3. **Polish layer** — secondary currency ("Pearls"), Perfect Runs, live events (Bull Run, Market Crash) to deepen retention.
4. **Course + monetization** — the ~20-hour paid trading course as a standalone product, with the game as its funnel.
5. **Hosting → permanent URL → App Store wrapper** — moving off temporary hosting to a permanent domain, then wrapping for app store distribution.

Running in parallel with all of the above, per this document's own mandate: the content-generation operating system (Phases 1–7 covered by this repository's `marketing/`, `agents/`, `content-events/`, `automation/`, and `content-assets/` directories) — so that by the time Hours 3–8 and the course ship, the distribution engine to market them already exists and is already producing content from the current build.
