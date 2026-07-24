# ChartQuest — Mobile Regression Checklist

Run before every release. Deploy to a **preview URL** first
(`git push origin <branch>:<branch>` → `https://<branch-slug>.chartquest.pages.dev`), never
straight to `main`.

Minimum hardware: **one iPhone (Safari) + one Android (Chrome)**. Everything below marked 🔴
*cannot* be verified in desktop emulation.

---

## 1 · Landing page — layout

- [ ] No horizontal scroll at 320, 360, 375, 390, 430, 768, 820 px
- [ ] Hero CTA fully visible above the fold, **portrait and landscape**
- [ ] Landscape phone (≤520px tall): eyebrow + trust line hidden, Play button above the fold
- [ ] Real-markets chart renders; Finn sits in the right gutter, never over a candle or the price axis
- [ ] Market chips ≥44px tall and tappable without mis-hits
- [ ] Bridges, gameplay cards, roadmap, footer all reflow cleanly
- [ ] 🔴 Nav clears the notch; sticky CTA clears the home indicator (standalone mode)

## 2 · Mobile menu

- [ ] Burger is 44×44 and morphs to an X when open
- [ ] Sheet **animates** in/out (no instant pop)
- [ ] Backdrop dims and blurs the page
- [ ] **Page does not scroll behind the open menu**
- [ ] Closing restores the exact previous scroll position
- [ ] Closes on: link tap, backdrop tap, Escape, rotating to landscape ≥641px
- [ ] Focus moves into the sheet on open and returns to the burger on close
- [ ] Tab is trapped inside the sheet
- [ ] VoiceOver / TalkBack announce the burger's expanded state

## 3 · Fullscreen (game shell, `/play`)

- [ ] 🔴 **Android Chrome:** ⛶ enters fullscreen; label becomes "Exit"; back button exits and the label resyncs
- [ ] 🔴 **Android Chrome:** orientation locks to portrait in fullscreen and unlocks on exit
- [ ] 🔴 **iPhone Safari:** ⛶ opens the install sheet (it must NOT silently do nothing — this was the bug)
- [ ] 🔴 **Installed PWA:** the ⛶ button is hidden entirely
- [ ] 🔴 **iPad Safari:** ⛶ enters real fullscreen (iPad *does* support the API)
- [ ] Game canvas fills to the bottom with the URL bar collapsed (no dead strip)
- [ ] Rotate mid-game → canvas resizes, no letterbox artefacts, no input offset
- [ ] Return from fullscreen → top bar reappears, layout intact

## 4 · Install to home screen

- [ ] 🔴 **Android Chrome:** Install button appears → native prompt → accepting hides the button permanently
- [ ] 🔴 **Android Chrome:** install dialog shows the 3 screenshots (rich UI, not the minimal one)
- [ ] 🔴 **iPhone Safari:** Install button appears → walkthrough sheet with Share + Add glyphs
- [ ] 🔴 **iPhone:** after Add to Home Screen, the icon is the candlestick mark, **not cropped**
- [ ] 🔴 **iPhone:** cold start shows the branded launch screen — **no white flash**
- [ ] 🔴 **Android:** launcher icon is not clipped by the circle mask
- [ ] 🔴 Launching the installed app shows **no browser chrome**
- [ ] Install button never appears once installed (relaunch to confirm)
- [ ] "Got it" and ✕ both close the sheet; Escape closes it

## 5 · Safe areas 🔴

- [ ] Notch device, standalone: nav content is below the status bar
- [ ] Home-indicator device: sticky CTA and install sheet clear the indicator
- [ ] Landscape with a notch: content clears the left/right insets

## 6 · Performance 🔴

- [ ] Scrolling the landing page holds ~60fps on a mid-range Android
- [ ] The rotating markets chart does not drop frames during a crossfade
- [ ] Chart animation **stops** when scrolled offscreen and when the tab is backgrounded
- [ ] `prefers-reduced-motion: reduce` → no rotation, no morph, static frame
- [ ] Phone does not get noticeably warm after 10 minutes of play
- [ ] Game holds frame rate on a 3× device *(watch P1-11: main canvas DPR is uncapped)*

## 7 · Offline & service worker

- [ ] First load registers the SW; second load is fast
- [ ] 🔴 Airplane mode → navigating shows `offline.html`, not the browser error
- [ ] Returning online auto-reloads the offline page
- [ ] **`/play` still loads** (this is the clean-URL/redirect regression guard — a SW must never return a redirected response to a navigation)
- [ ] After a deploy, a returning visitor gets the new build (cache version bumped)
- [ ] `market-data.js` is fetched fresh, not served from cache

## 8 · Accessibility

- [ ] Every interactive control ≥44×44 (or has a ≥44px hit area)
- [ ] Focus ring visible on keyboard focus throughout
- [ ] Skip-to-content link works
- [ ] Install sheet: `role="dialog"`, `aria-modal`, focus lands on close
- [ ] 🔴 Screen reader can traverse hero → markets → gameplay → Play
- [ ] Reduced motion honoured on the landing page **and** the game intro

## 9 · Brand integrity

- [ ] **The old procedural turtle appears nowhere.** Check: game loader, `/play` top bar, install modal, `bosses.html`, `courses.html`
      (`grep -r "data-turtle\|cq-turtle\|cqTurtle" website/` must be empty)
- [ ] App icon, splash and favicon all show the candlestick logomark
- [ ] No "Shell", no "Chart Quest" (two words) in user-visible copy
- [ ] Game intro: dialogue sits in the bottom band, never over Finn or the Market Maker's face

## 10 · Device matrix

| Device | Portrait | Landscape |
|---|---|---|
| iPhone SE (375×667) | ☐ | ☐ |
| iPhone 13 / 14 (390×844) | ☐ | ☐ |
| iPhone 16 Pro Max (430×932) | ☐ | ☐ |
| Pixel (412×915) | ☐ | ☐ |
| Galaxy S (360×800) | ☐ | ☐ |
| iPad (820×1180) | ☐ | ☐ |

---

**Sign-off:** all 🔴 rows checked on real hardware, on a preview URL, before promoting to `main`.
