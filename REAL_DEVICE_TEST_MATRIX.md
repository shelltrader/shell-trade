# ChartQuest — Real Device Test Matrix

**Run against the preview URL, never production.**
`https://site-beta-hardening.chartquest.pages.dev`

Everything in this file requires **manual verification on hardware**. Nothing here was, or
could be, verified in the browser harness — the reasons are listed per section so you know
*why* a human has to look.

**Legend:** ✅ pass · ❌ fail · ⚠️ works with a caveat · — not applicable

---

## Why emulation was not enough

| Signal | What emulation reported | Reality |
|---|---|---|
| `(pointer:coarse)` | `fine` | A real phone matches; the 44px tap-target rules only activate there (they're also mirrored under `max-width:640px`, which *is* testable) |
| `env(safe-area-inset-*)` | always `0px` | Only a notch/home-indicator device produces non-zero insets |
| `beforeinstallprompt` | never fires | Fires only on Chromium with a real engagement heuristic |
| `appinstalled` | never fires | Fires only on a genuine install |
| Fullscreen API | `fullscreenEnabled: true`, but `requestFullscreen()` never engages | Headless Chrome has no window manager |
| `document.hidden` | `true` most of the time | Freezes `rAF`, CSS transitions, IntersectionObserver, and the document timeline — several "bugs" during the audit were this artifact |
| Device pixel ratio | 1 | 3× on every modern iPhone |
| Frame rate / thermals | unmeasurable | — |

---

## 1 · iPhone Safari (the flagship path — 3× dpr, no Fullscreen API)

| # | Check | Expected | Result |
|---|---|---|---|
| 1.1 | Land on `/` | Hero art crisp; no horizontal scroll; CTA above the fold | ☐ |
| 1.2 | Rotate to landscape | Eyebrow + trust line disappear; **Play button still above the fold** | ☐ |
| 1.3 | Scroll the page | ~60fps; no jank at the markets chart | ☐ |
| 1.4 | Markets chart | Rotates every ~3s; Finn never covers a candle or the price axis | ☐ |
| 1.5 | Tap ☰ | Sheet **animates**; page does **not** scroll behind it | ☐ |
| 1.6 | Close the menu | Returns to the exact prior scroll position | ☐ |
| 1.7 | Tap a market chip | Registers first time (44px target) | ☐ |
| 1.8 | Address bar collapse | No dead strip at the bottom of `/play` | ☐ |
| 1.9 | `/play` → tap ⛶ | **Opens the install sheet.** It must NOT silently do nothing (that was the bug) | ☐ |
| 1.10 | Install sheet | Share + Add glyphs render; steps read correctly; "Got it" closes | ☐ |
| 1.11 | Share → **Add to Home Screen** | Icon preview is the candlestick mark, **not cropped**, not a turtle | ☐ |
| 1.12 | Launch from the home screen | **No browser chrome**. Branded launch screen — **no white flash** | ☐ |
| 1.13 | First standalone launch | Welcome card appears once: "ChartQuest is on your home screen" | ☐ |
| 1.14 | Close and relaunch | Welcome card does **not** reappear | ☐ |
| 1.15 | Standalone, `/play` | ⛶ button is **hidden** (already chromeless) | ☐ |
| 1.16 | Notch / safe areas | Nav below the status bar; sticky CTA above the home indicator | ☐ |
| 1.17 | Play the game 10 min | Stable frame rate; phone not noticeably warm *(watch: DPR patch not yet applied)* | ☐ |
| 1.18 | Rotate mid-game | Canvas resizes; no input offset; no letterbox artefacts | ☐ |
| 1.19 | Backgrounded → return | Game resumes; chart rotation resumes | ☐ |
| 1.20 | Airplane mode → reload | Branded offline page, not Safari's error | ☐ |
| 1.21 | VoiceOver on the ☰ | Announces expanded/collapsed state | ☐ |

**Devices:** iPhone SE (375×667, dpr 2) · iPhone 13/14 (390×844, dpr 3) · iPhone 16 Pro Max (430×932, dpr 3)

---

## 2 · Chrome Android

| # | Check | Expected | Result |
|---|---|---|---|
| 2.1 | Land on `/` | No horizontal scroll at 360px | ☐ |
| 2.2 | Install button appears | After the engagement heuristic, ⬇ Install shows in the nav | ☐ |
| 2.3 | Tap Install | **Native prompt** (not the walkthrough) | ☐ |
| 2.4 | Install dialog | Shows the 3 screenshots (rich UI, not the minimal one) | ☐ |
| 2.5 | Accept | Welcome card appears once; install button disappears for good | ☐ |
| 2.6 | Launcher icon | Not clipped by the circle/squircle mask | ☐ |
| 2.7 | Launch installed app | Standalone, no browser chrome, correct theme colour | ☐ |
| 2.8 | `/play` → ⛶ | **Real fullscreen**; label becomes "Exit" | ☐ |
| 2.9 | In fullscreen | Orientation **locks to portrait** | ☐ |
| 2.10 | Hardware back | Exits fullscreen; the label re-syncs to "Fullscreen" | ☐ |
| 2.11 | Standalone `/play` | ⛶ hidden | ☐ |
| 2.12 | Airplane mode | Offline page | ☐ |
| 2.13 | Mid-range device, scroll | ~60fps *(watch: 5 `backdrop-filter` layers)* | ☐ |
| 2.14 | Gesture nav insets | Sticky CTA clears the gesture bar | ☐ |

**Devices:** Pixel (412×915, dpr 2.625) · Galaxy S (360×800, dpr 3)

---

## 3 · iPad Safari

| # | Check | Expected | Result |
|---|---|---|---|
| 3.1 | Portrait layout | Gameplay pillars stack; no overflow | ☐ |
| 3.2 | Landscape | Desktop nav; no burger | ☐ |
| 3.3 | ⛶ on `/play` | **Real fullscreen** — iPad *does* support the API (unlike iPhone) | ☐ |
| 3.4 | Add to Home Screen | 167px icon used; launch screen correct | ☐ |
| 3.5 | Split view / Slide Over | Layout survives a narrow pane | ☐ |
| 3.6 | Magic Keyboard: Tab | Focus order sane; focus ring visible | ☐ |

---

## 4 · Desktop browsers

| Check | Chrome | Safari | Edge | Firefox |
|---|---|---|---|---|
| Hero renders, no overflow | ☐ | ☐ | ☐ | ☐ |
| Markets chart rotates + morphs to platforms | ☐ | ☐ | ☐ | ☐ |
| Chip click stops auto-rotation | ☐ | ☐ | ☐ | ☐ |
| Bridges + scroll cue animate | ☐ | ☐ | ☐ | ☐ |
| `/play` ⛶ enters fullscreen | ☐ | ☐ | ☐ | ☐ |
| Install button (Chromium only) | ☐ | — | ☐ | — |
| `text-wrap: pretty` supported | ☐ | ☐ | ☐ | ⚠️ falls back to normal wrap — cosmetic only |
| `backdrop-filter` | ☐ | ☐ | ☐ | ☐ |
| Keyboard: Tab through nav → menu → Play | ☐ | ☐ | ☐ | ☐ |
| Reduced motion (OS setting) | ☐ | ☐ | ☐ | ☐ |
| Console clean | ☐ | ☐ | ☐ | ☐ |

**Firefox note:** no `beforeinstallprompt`, no PWA install. The install button is hidden on
desktop Firefox by design (it only shows on touch or when a prompt exists). Confirm it's absent,
not broken.

**Safari note:** `screen.orientation.lock()` does not exist. The call is wrapped in `try/catch`
and the rejection is swallowed — confirm no console error.

---

## 5 · Social / SEO (do this from a phone, in the real apps)

| # | Check | Expected | Result |
|---|---|---|---|
| 5.1 | Paste the URL into **Discord** | Large card, key art, title, description | ☐ |
| 5.2 | Paste into **iMessage** | Rich preview with the image | ☐ |
| 5.3 | Paste into **X / Twitter** | `summary_large_image` card | ☐ |
| 5.4 | Facebook Sharing Debugger | 1200×630 image, no warnings | ☐ |
| 5.5 | `curl -sI /robots.txt` | `content-type: text/plain` (NOT `text/html`) | ☐ |
| 5.6 | `/sitemap.xml` | Valid XML, `sitemaps.org` namespace | ☐ |
| 5.7 | Google Rich Results / URL Inspection | Canonical resolves to `https://playchartquest.com/` | ☐ |

---

## 6 · Cross-cutting

| # | Check | Result |
|---|---|---|
| 6.1 | **No procedural turtle anywhere**: game loader, `/play` bar, install modal, `bosses`, `courses` | ☐ |
| 6.2 | No "Shell" or "Chart Quest" (two words) in visible copy on `/`, `/play` | ☐ |
| 6.3 | Game intro: subtitle in the bottom band, never over Finn or the Market Maker's face *(only after the game release)* | ☐ |
| 6.4 | Deploy a second time → returning visitor gets the new build (SW cache bumped) | ☐ |
| 6.5 | `/play` still loads after the SW update (clean-URL redirect guard) | ☐ |
| 6.6 | Private/incognito: install button + welcome degrade gracefully (localStorage throws) | ☐ |

---

## Sign-off

- [ ] Section 1 complete on **two** iPhones (one 2×, one 3×)
- [ ] Section 2 complete on **one** Android
- [ ] Section 3 complete on an iPad
- [ ] Section 4 complete on all four desktop browsers
- [ ] Section 5 complete
- [ ] Section 6 complete
- [ ] Any ❌ triaged as *ship / fix / postpone* before promoting to `main`
