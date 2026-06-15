# Chart Quest — Project Status & Handoff

> Read this first to continue the project in a new chat. Everything is saved in this folder.

## What it is
A **portrait mobile browser game** that teaches crypto trading. A turtle named **Shell** runs along a live candlestick chart (candles are platforms); the player spots setups and takes simulated trades (long/short, risk %, stop-loss/take-profit, leverage) and learns to trade along the way. Built originally with Fable 5.

**The whole game is one self-contained file: `shell-trade.html`.** (`index.html` is a synced copy used for hosting.)

## Files in this folder
- `shell-trade.html` — THE GAME (edit this).
- `index.html` — hosting copy. **Re-sync after every change:** `cp shell-trade.html index.html`.
- `PROJECT_STATUS.md` — this file.
- Design docs: `Shell_Trade_Progression_Design.md`, `World_1_Blueprint.md`, `Integration_Map.md`.
- `preview-*.html` — one per feature; before/after + live interactive render of each change.

## What's built (done)
- **Curriculum**: 6 "Hours" (levels) with lessons + quizzes (`CURRICULUM`, `LESSONS`, `QUIZ_QUESTIONS`).
- **Trading Journal** (persistent, localStorage) with 4 tabs: **Terms** glossary, **Lessons** library, **Trades** history, **Notes** (free-form, can link to a term/lesson/trade).
- **Trade review**: full-screen annotated chart (entry/SL/TP, OB/BOS, VWAP, why-this-setup, what-happened) **+ animated replay** that plays the trade from entry to its TP/SL. Toggle legend (VWAP / Structure / OB / SL-TP).
- **Setup accuracy**: Order Block = the last opposing-colour candle before the break; structure ray shows the broken level; review snapshot captured at entry (not exit).
- **ChoCh (Change of Character)** vs BOS — generated in the market, drawn (orange vs blue), with lesson/term/quiz.
- **Candle-close confirmation** lesson (wait for the close).
- **Trade psychology**: grade-aware "what happened" (good setups still lose; bad setups can win), reassurance floater on good-setup stop-outs.
- **Rank ladder**: Drifter → Plankton → … → Whale → TRADER (over player level), with rank-up moments.
- **Daily Drill + streak** (seeded daily, Shell multiplier, localStorage).
- **Boss fights** (data-driven `BOSSES{}`): Hour 1 "The Fakeout" (read whole candles), Hour 2 "The Liquidator" (risk). Gate hour advance; retry-friendly. Adding more = more data.
- **Portrait lock**: game + all overlays render inside a centered portrait `#stage`, letterboxed on wide screens; pointer input offset by `stageX/stageY`; `MAX_ASPECT = 0.58`.

## Conventions / workflow (important)
- **Every change ships with a `preview-*.html`** (before/after + a live render of the new UI), so changes can be reviewed without replaying the game.
- **Verify previews with a strict DOM-stub node test**: `getElementById` returns `null` for unknown ids and registers child ids from innerHTML. (Lenient stubs hid two dead-preview bugs — don't repeat that.)
- **Re-sync `index.html`** after each change.
- Persistence localStorage keys: `shellTradeJournal_v1`, `shellTradeNotes_v1`, `shellTradeDaily_v1`.
- Data-driven systems to extend: `BOSSES`, `CURRICULUM`, `LESSONS`, `QUIZ_QUESTIONS`, `TERMS`, `RANKS`.
- No headless browser in the sandbox (npm registry blocked) → can't screenshot canvas screens here; use Claude for Chrome or a user screenshot loop for visual polish.

## Open TODOs / notes
- **Polish pass** on canvas screens (intro cards, intermission, HUD) — needs a visual loop (Claude for Chrome ideal). Already fixed intro card 0/1/5 overflow + iOS safe-area.
- `MAX_ASPECT` (0.58) and BOS impulse size (`bosMin/bosMax` = 130–200, reduced from 240–320 to let the market trend) may need feel-tuning after playtests.
- Hosting: tiiny.host injects a bottom banner that covers the trade UI — use **Netlify** (banner-free) for testing.

## Roadmap (what's next)
1. **Accounts / membership** — email+password, save progress, sync journal, **no KYC**. Pairs with **Supabase** connector.
2. **More bosses** for Hours 3–8.
3. **Polish layer** — Pearls currency, Perfect Runs, events (Bull Run, Market Crash).
4. **Course + monetization** — the 20h trading course is a separate premium product; game is the funnel; upsell via email after signup.
5. **Hosting → permanent URL → App Store wrapper.**

## Suggested connectors
Claude for Chrome (live testing/polish), Netlify (deploy/host), Supabase (accounts phase), Supermetrics (paid-ads analytics at launch).

## Model guidance
Do routine building on **Sonnet** (large allowance, plenty capable for this work). Use **Opus** only for genuinely hard reasoning/architecture. The Opus *weekly* limit is separate from the general one — that's what was filling up.
