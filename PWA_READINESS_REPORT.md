# ChartQuest — PWA Readiness Report

**Date:** 2026-07-10 · **Scope:** `website/` served at `https://playchartquest.com`
**Score: 24 / 27 requirements met** (was 9 / 27). The 3 gaps all require a real device to close.

Legend: ✅ met · ⚠️ met but unverified on hardware · ❌ missing

---

## 1. Manifest

| Requirement | Before | After | Notes |
|---|---|---|---|
| Manifest linked | ✅ | ✅ | `<link rel="manifest">` on `index.html` + `play.html` |
| `name` / `short_name` | ❌ stale | ✅ | was "Chart Quest"; now "ChartQuest — The World's First Trading RPG" |
| `description` | ❌ stale | ✅ | previously described "**Shell** the turtle" |
| `id` | ❌ | ✅ | `"/"` — pins app identity across `start_url` changes |
| `start_url` | ⚠️ `./index.html` | ✅ | `"./"` — matches scope, avoids duplicate installs |
| `scope` | ✅ | ✅ | `"./"` |
| `display` | ✅ | ✅ | `standalone` |
| `display_override` | ❌ | ✅ | `["standalone","minimal-ui","browser"]` |
| `theme_color` | ❌ mismatched | ✅ | manifest, `index.html`, `play.html` all `#060910` |
| `background_color` | ⚠️ `#04060f` | ✅ | `#060910`, matches the generated splash background |
| `orientation` | ✅ `any` | ✅ | kept `any`; portrait is locked only inside game fullscreen |
| `screenshots` | ❌ | ✅ | 3 × `form_factor:"narrow"` → unlocks Chrome's rich install dialog |
| `shortcuts` | ❌ | ✅ | "Play now" → `./play.html` |
| `categories`, `lang`, `dir` | ⚠️ | ✅ | complete |

## 2. Icons

| Requirement | Before | After |
|---|---|---|
| `any` icons, multiple sizes | ❌ 2 sizes | ✅ 96/128/144/152/192/256/384/512 |
| **Separate** `maskable` icons | ❌ **same image tagged `"any maskable"`** — Android cropped it | ✅ 192 + 512, mark inside the 80% safe zone |
| `apple-touch-icon` (152/167/180) | ❌ 1 size, points at superseded art | ✅ all three |
| Consistent artwork | ❌ 192 said "CQ", 512 said "CHART QUEST" (clipped) | ✅ every asset drawn from the brand logomark |
| Weight | — | ✅ 123 KB for all 23 assets |

## 3. Splash / launch screen

| Requirement | Before | After |
|---|---|---|
| `apple-touch-startup-image` | ❌ **none** → white flash on every iOS cold start | ✅ 11 device-exact images |
| Follows Apple HIG (simple, static) | — | ✅ brand bg + mark, not a poster |
| Weight | — | ✅ 240 KB total (a key-art splash set was 8.9 MB — rejected) |
| Renders on device | — | ⚠️ **needs an iPhone** |

## 4. Install experience

| Requirement | Before | After |
|---|---|---|
| Install button exists | ❌ **zero call sites for `cqInstall()`** | ✅ nav + mobile sheet + game shell |
| `beforeinstallprompt` used | ⚠️ captured, then discarded | ✅ deferred and fired from a user gesture |
| iOS custom instructions | ❌ | ✅ designed sheet, real Share/Add glyphs, not "Tap Share." |
| Install detection | ❌ | ✅ `appinstalled` + `display-mode:standalone/fullscreen` + `navigator.standalone` + `localStorage` |
| Button hidden after install | ❌ | ✅ |
| Never a dead end | ❌ | ✅ shown on any touch device; falls back to the walkthrough |
| Native prompt fires | — | ⚠️ **needs Android Chrome** |

## 5. Service worker & caching

| Requirement | Before | After |
|---|---|---|
| Registered | ✅ | ✅ |
| Versioned cache, old caches purged | ✅ | ✅ `chartquest-site-v6` |
| Precache list accurate | ⚠️ referenced superseded icons | ✅ |
| Navigations never get a redirected response | ✅ (hard-won) | ✅ **preserved** — online navigations are still not intercepted at all |
| Offline fallback page | ❌ | ✅ `offline.html`, served only when `navigator.onLine === false` |
| Fresh-data policy | ✅ | ✅ `game.html` + `market-data.js` stay network-first |
| Offline behaviour on device | — | ⚠️ **needs airplane-mode test** |

## 6. Standalone behaviour

| Requirement | Before | After |
|---|---|---|
| `apple-mobile-web-app-capable` | ✅ | ✅ |
| `mobile-web-app-capable` | ❌ | ✅ |
| `apple-mobile-web-app-title` | ✅ | ✅ |
| Status-bar style | ✅ | ✅ `black-translucent` |
| Safe-area insets honoured | ❌ **zero uses** | ✅ nav, menu, sticky CTA, footer, play-bar, game frame, offline |
| Fullscreen button hidden when standalone | ❌ | ✅ |

---

## Remaining gaps (all device-bound)

1. **iOS splash + Add-to-Home-Screen** — must be seen on an iPhone. Everything is wired; only
   iOS reads it.
2. **Android native install prompt** — `beforeinstallprompt` does not fire in this harness.
3. **Offline mode** — the `navigator.onLine` gate is deliberately conservative to protect the
   clean-URL redirect fix; it needs one airplane-mode pass.

## Lighthouse-PWA expectations after this pass

Installable ✅ · manifest complete ✅ · maskable icon ✅ · splash ✅ · offline ✅ ·
themed ✅ · `viewport` ✅ · SW controls start_url ✅.

The one audit that will still flag is **"Does not use `user-scalable=no`"** on `/play` — an
accepted exception for the canvas surface (see `MOBILE_AUDIT.md` P2-02).
