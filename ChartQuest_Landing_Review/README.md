# ChartQuest Landing — Review Packet (V7 · the opening sequence)

The homepage is now the **first level** of the game, not a marketing page.

## In this folder
- **chartquest-landing.html** — the full page. Double-click to open (live chart + game load in the browser).
- **assets/** — key art, Finn art, styles.
- **screenshots/** — `1-desktop-full`, `2-desktop-hero`, `3-mobile-full`, `4-mobile-hero`.

## The journey (top → bottom)
1. **Cinematic hero** — pure boss key art (no chart overlay now; the artwork breathes). Galaxy softly breathes.
2. **3 ways to play** → **"He jumps inside it"**.
3. **NEW — "This is a real market."** A large live **BTC/USD** chart. Above it, **Finn flies in and enters the chart** (one-shot animation, on scroll). This is the fantasy→reality bridge.
4. Why it beats courses → Meet Finn → Roadmap.
5. **NEW ending — "ENTER THE CHART."** (echoes the hero's "the chart is the world"). The **real game mounts right in the page** — press **Enter the Chart** and it loads inline (no redirect, no popup, borderless). The site becomes the game.

## Notes
- **Live chart + embedded game are real, cross-origin** — they render in a browser but are blank/loading in the static screenshots. Open the HTML to see them live.
- **Game embed** loads `play.html` on click (lazy, for performance). Change the target via the button's `data-game` attribute if you want a different build.
- **Painted price numbers** on the key art's right edge are baked into your image (not removable without cropping / a scale-free art).
- **"Watch Trailer"** scrolls to "How it works" until you have a trailer.
- **Deploy CSP:** allow TradingView (`s3.tradingview.com` script-src; `*.tradingview-widget.com` frame-src; `*.tradingview.com` connect-src), Binance (`api.binance.com`), Google Fonts (`fonts.googleapis.com` style-src; `fonts.gstatic.com` font-src) — or deploy `website/` on its own. And the game iframe needs `frame-src 'self'` (same-origin, already allowed).

## Prompt for ChatGPT
> ChartQuest homepage as the *opening sequence* of a trading RPG: cinematic boss hero → "this is a real live BTC chart" (Finn flies into it) → the page ends by embedding the actual playable game. Attached: desktop + mobile screenshots + HTML. Critique as a creative director: does it build excitement to *play*, does it feel like entering a world (not a marketing page), first-10-second clarity, mobile, top 5 fixes. (The live chart + embedded game are blank in the stills but live in-browser.)
