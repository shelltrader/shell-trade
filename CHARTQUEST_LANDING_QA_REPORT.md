# ChartQuest Landing — Pre-Launch QA Report

**Date:** 2026-07-08 · **Scope:** `website/index.html` (polish only, no redesign) · **Method:** programmatic audit via DOM eval across breakpoints + headless-Chrome visual checks (the in-app preview screenshotter hangs on the live-updating chart iframe).

## Verdict
**No Critical defects** (no horizontal overflow, no broken layouts, no white-screen, no clipped content with fonts loaded). Fixed **3 High** + **4 Medium** issues below. Site is launch-ready pending the deploy CSP + the manual tests.

---

## Punch list

### HIGH — fixed
| # | Issue | Where | Fix |
|---|---|---|---|
| H1 | Hero sub-text **pinned to full width** by a `<br>`, clipping on ≤360px (and during the pre-font-load moment) | hero | Removed the `<br>`; text wraps naturally. Verified `scrollW == clientW` at 320px, no clip. |
| H2 | Hero CTAs **wrapped ragged** / risked clipping on narrow phones | hero | On ≤720px the two CTAs now **stack full-width** — clean, tappable, no clip. |
| H3 | **Embedded game had no loading/error state** — a slow or blocked load showed a blank iframe | game mount | Click now shows an **"Entering the chart…" spinner**; a 15s timeout / load error swaps to a **premium fallback card** ("The world didn't load here…" + **Open ChartQuest full-screen** button). |

### MEDIUM — fixed
| # | Issue | Fix |
|---|---|---|
| M1 | No visible **keyboard focus** ring | `:focus-visible` gold outline on all buttons/links/nav/burger. |
| M2 | **Footer link tap targets** ~17px (< 44px) | Padding → ~40px tap height (kept visual spacing via negative margin). |
| M3 | Safari: hero eyebrow `backdrop-filter` missing `-webkit-` prefix | Added `-webkit-backdrop-filter`. |
| M4 | **LCP risk:** 312 KB Meet-Finn image loaded eagerly below the fold | `loading="lazy" decoding="async"`. |

### Verified OK (no action needed)
- **No horizontal scroll** at 320 / 360 / 375 / 390 / 414 / 768 / 1024 / 1280 / 1440 / 2560 (body `overflow-x:hidden` + max-widths hold; offenders are decorative layers inside clipped containers).
- **Images:** `img{height:auto}` (no distortion), alt text present (decorative = `alt=""`), aspect ratios correct; hero art is `fetchpriority="high"` (LCP).
- **Reduced motion:** all animations disabled; the Finn-enters animation is skipped; galaxy glow off.
- **Hero:** the 4-line "THE CHART / IS / THE / WORLD" stack is intentional and consistent across widths; boss art + Finn always visible; nav never collides.
- **Live chart:** height is `clamp()`-responsive, usable on mobile, `async`-loaded.
- **Game embed:** loads `play.html`, `allow="fullscreen; autoplay"`, borderless, no scroll conflict.
- **Content stays centered** (max-width 1200) on ultra-wide (2560) — not stretched.

### LOW / recommendations (not blocking)
- **Defer the live chart until scroll** (perf / mobile-network): the real-market TradingView widget loads on page load. Ideal to lazy-mount it via IntersectionObserver — *kept as-is for now because dynamically injecting TradingView's embed script is fragile (`document.currentScript` config-read); revisit with an on-scroll iframe swap.*
- Lazy-load the remaining small below-fold Finn PNGs (minor).
- `--ink-faint` (#647689) micro-labels sit just under AA on the darkest backgrounds — fine for decorative mono captions; bump one step if you want strict AA everywhere.
- **Deploy CSP** (required for the chart/fonts/game to work publicly): allow `s3.tradingview.com` (script-src), `*.tradingview-widget.com`/`s.tradingview.com` (frame-src), `api.binance.com`+`*.tradingview.com` (connect-src), `fonts.googleapis.com` (style-src), `fonts.gstatic.com` (font-src), and `frame-src 'self'` for the game — or deploy `website/` on its own site.

---

## Manual tests to run before shipping (from the founder's list)
1. **10-Friend Test** — send the link cold; record their exact words for "what is this / what do you do / the goal / would you click Play Free / what confused you."
2. **Heatmap** (Clarity/Hotjar) — watch for scroll-stops, rage-clicks, missed buttons, exits.
3. **Lighthouse** — targets Perf 90+ / A11y 95+ / Best-Practices 95+ / SEO 90+. Biggest perf lever here = deferring the live chart (see recommendation) + the fonts (already `display=swap`; add `preconnect`, done).
4. **Real-phone 4G/5G** — does the hero image appear fast (834 KB JPG, `fetchpriority=high`), does the live chart delay the page, does the embedded game feel instant.
5. **First-Play timing** — time-to-understand, time-to-first-click, time-to-controlling-Finn (target < 60–90s). The new "Enter the Chart" mount is one click from the homepage.
