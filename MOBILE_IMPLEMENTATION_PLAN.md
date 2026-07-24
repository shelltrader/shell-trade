# ChartQuest — Mobile Implementation Plan

**Date:** 2026-07-10 · Companion to `MOBILE_AUDIT.md`
Everything in "Done" is already in the working tree. Nothing is committed or deployed.

---

## Done in this pass

| Area | Files | Change | Risk | Effort |
|---|---|---|---|---|
| **Turtle purge** | `website/assets/site.js`, `play.html`, `bosses.html`, `courses.html` | Deleted the `#cq-turtle` sprite, `turtle()`, `window.cqTurtle` and the `[data-turtle]` mount loop. Nav/footer now use the candlestick logomark; the install modal uses the app icon; legacy pages use official `finn-hero.png`. | **Low** — `site.js` only serves 3 legacy pages | S |
| **Mobile menu** | `website/index.html` | Animated sheet, blurred backdrop, `position:fixed` scroll lock with scroll restore, Escape/backdrop/link close, focus trap + return, `aria-controls`, burger→X, `100dvh` internal scroll, safe areas. | **Low** — additive; desktop nav untouched (`min-width:641px`) | M |
| **Fullscreen** | `website/play.html` | Feature-detect → real fullscreen + orientation lock; iPhone Safari → install sheet; installed PWA → button hidden. Added `fullscreenchange`/`webkitfullscreenchange`, promise-rejection handling, `body.is-fs`. | **Medium** — behaviour differs per platform; needs device pass | M |
| **PWA install** | `website/index.html` | Install buttons (nav + mobile sheet), `beforeinstallprompt` → native prompt, `appinstalled` + `display-mode` + `navigator.standalone` detection, `localStorage` memo, designed iOS walkthrough sheet with real Share/Add glyphs. | **Low** | M |
| **Icons + splash** | `scripts/make_pwa_assets.py`, `website/assets/pwa/*` | 23 assets **drawn from the brand logomark** (no stale "CQ"/"CHART QUEST" raster): 10 `any` icons, 2 padded `maskable`, 11 iOS launch screens. **123 KB total.** | **Low** | M |
| **Manifest** | `website/manifest.webmanifest` | `id`, correct name/description, `start_url:"./"`, `display_override`, matching `theme_color`, separated `any`/`maskable` icons, `screenshots` (rich Android install UI), `shortcuts`. | **Low** | S |
| **Safe areas** | `index.html`, `play.html`, `offline.html` | `env(safe-area-inset-*)` on nav, menu, sticky CTA, footer, install sheet, play-bar, game frame. | **Low** | S |
| **Tap targets** | `website/index.html` | 21 sub-44px targets → **0**. Chips 29→44px; chevron keeps its 34px look, hit area grows to 44 via a transparent `::after`. | **Low** | S |
| **Landscape hero** | `website/index.html` | `(orientation:landscape) and (max-height:520px)` sizes the hero to `calc(100dvh - 66px)` and sheds the eyebrow/trust line. CTA now above the fold. | **Low** | S |
| **Offline** | `website/offline.html`, `sw.js` | Branded offline page. SW cache v5→v6. | **Medium** — see the redirect note below | S |
| **Game shell** | `website/play.html` | `100dvh`, `overscroll-behavior:none`, 44px controls, `theme-color` aligned, real `<button>`s instead of inline `onclick`. | **Low** | S |

### The one subtle bit: the service worker

`sw.js` historically must **never** hand a *redirected* response to a navigation — Cloudflare
Pages serves clean URLs (`/play.html` → 308 → `/play`) and a redirected response returned from
a SW makes the browser fail with `ERR_FAILED`. That bug once broke the Play button.

So the offline fallback intercepts navigations **only when `navigator.onLine === false`**:

```js
if (req.mode === 'navigate') {
  if (!self.navigator.onLine) e.respondWith(caches.match(OFFLINE_URL).then(h => h || fetch(req)));
  return;                       // online: never intercept -> redirects stay native
}
```

Online behaviour is therefore byte-for-byte what it was. Risk is confined to the offline path.

---

## Not done — with reasons

| Item | Why not | Recommendation |
|---|---|---|
| **P1-11 · cap main-canvas DPR at 2** (`chart-quest.html:2418`) | It lives in the protected game file, which currently carries **245 lines of uncommitted work from a previous session**. Touching it means mirroring to `index.html` + `website/game.html` and sweeping that WIP into a deploy. | Resolve the WIP first, then one-line: `const dpr = Math.min(window.devicePixelRatio || 1, 2);`. Expect a large fps win on 3× iPhones. |
| **P2-04 · in-game turtle chart marker** | `turtleMarkerSVG()` is functional UI (a "you are here" dot on lesson charts), not the mascot. Removing it needs replacement art, and it's in the protected file. | Decide: keep, or swap for a 15px Finn sprite crop. |
| **P2-02 · `user-scalable=no`** | Removing it lets pinch-zoom break canvas input. iOS ignores the directive anyway. | Leave; document as an accepted WCAG 1.4.4 exception for the game surface only. |
| **P2-05 · legacy `bosses.html` / `courses.html`** | Out of scope; they are still deployed and still link to dead anchors. | Either delete them or repoint their nav. |
| **Real-device verification** | No hardware in this environment. | Run `MOBILE_REGRESSION_CHECKLIST.md` on the matrix before release. |

---

## Suggested order to ship

1. **Land the site changes** (everything in "Done"). No game files touched → no ship gate, no WIP risk.
2. **Run the regression checklist** on one iPhone + one Android, preview URL first.
3. **Then** untangle the game-file WIP and land P1-11 (canvas DPR) as a separate, gated game release.

Step 1 is independently deployable and carries none of the game's risk.
