# ChartQuest — Landing Page V1 Build Report

**Date:** 2026-07-07
**Deliverable:** `website/index.html` (rebuilt in place, replacing the old "Shell"-branded landing page)
**Type:** Marketing website only — **no game code, art, bosses, lessons, saves, or monetization touched.**

---

## 1 · What changed

| File | Change |
|---|---|
| `website/index.html` | **Rebuilt** — new self-contained Finn-branded V1 landing page (9 sections per brief). |
| `website/assets/finn-hero.png` | **New** — copied from `finn/hero.png` (source of truth left untouched). |
| `website/assets/finn-run.png` | **New** — copied from `finn/run.png` (source of truth left untouched). |
| `website/assets/finn-jump.png` | **New** — copied from `finn/jump.png` (jetpack dash). |
| `website/assets/finn-roll.png` | **New** — copied from `finn/shell-fall-roll.png` (shell roll). |
| `website/assets/finn-dazed.png` | **New** — copied from `finn/dazed-after-fall.png` (dazed). |
| `website/assets/finn-boost.png` | **New** — copied from `finn/vboost.png` (vertical launch). |
| `CHARTQUEST_LANDING_V1_BUILD.md` | **New** — this report. |

Explicitly **not** touched: `chart-quest.html`, root `index.html` (the deployed game), `finn/*` originals, `bosses/*`, `website/play.html`, `website/bosses.html`, `website/courses.html`, `website/assets/site.css`, `website/assets/site.js`, all `docs/canon/*`.

**Why a rebuild was warranted:** the previous landing page branded the mascot as **"Shell"** and drew a *procedural* turtle. The game canon (and this brief) call the character **Finn**, and real Finn art now exists. The rebuild aligns branding and uses the real art.

---

## 2 · Architecture

- **Single, self-contained static HTML file.** Inline CSS + vanilla JS. No frameworks, no build step, no external fonts/CDNs. This keeps it a true drop-in and keeps it compatible with the site's strict Content-Security-Policy (`img-src 'self' data:`, no external script/style/font/frame origins).
- **Decoupled from the old design system on purpose.** It does *not* load `assets/site.css` / `site.js`, because the brief specifies a distinct palette and section structure. It carries its own nav, footer, install flow, reveal, and modals so it can't fight the legacy stylesheet. Sibling pages (`play.html`, `bosses.html`, `courses.html`) are unaffected and keep working.
- **One config block** at the top of the page script:
  ```js
  var CQ = { game: "play.html", discord: "" };
  ```
  Change `game` to point the primary CTA elsewhere; paste a `discord` invite URL to activate the Discord buttons.
- **PWA-ready:** keeps `manifest.webmanifest`, icons, theme-color, and registers the existing `sw.js`.

---

## 3 · Section map (wireframe)

| # | Section | Anchor | Purpose | Primary CTA |
|---|---|---|---|---|
| 1 | Hero | — | 5-second hook: "you're inside the chart." Finn on a live candlestick chart. | Play Free · Watch Gameplay |
| 2 | The Chart Is The World | `#world` | The core idea, told as a 3-beat visual storyboard (arrive → drop in → quest). | — |
| 3 | Meet Finn | `#meet-finn` | Character, short lore, real hero art. | — |
| 4 | How The Game Works | `#how` | The 4-move loop: Learn · Practice · Trade · Defeat Bosses. | — |
| 5 | Gameplay Showcase | `#gameplay` | Bento grid of **swappable media slots** for clips/gifs/screenshots. | — |
| 6 | Why ChartQuest Is Different | `#different` | Red "Traditional course" ✗ vs green "ChartQuest" ✓ comparison. | — |
| 7 | The Roadmap | `#roadmap` | 5-node timeline (Alpha ✓ · Beta now · Launch · Future · Community). | — |
| 8 | Social Proof | — | Placeholder metrics + 3 placeholder testimonials (clearly marked). | — |
| 9 | Final CTA | — | "Ready to begin your quest?" | Play Free · Join Discord |

Plus: sticky top nav (with mobile burger), sticky mobile bottom CTA (appears on scroll), footer with financial disclaimer, and two modals (Watch Gameplay, PWA Install).

---

## 4 · UX rationale (major decisions)

- **The hook is literal, not described.** Section 1 renders Finn *standing on rising candles* rather than saying "the chart is the world." The idea is felt in <5s, which is the brief's stated goal.
- **Movie-trailer, not textbook.** Copy is short, punchy, and scannable; no lore dump (per the brief's lore rule). Curiosity over explanation.
- **Palette does the trading-terminal work.** `#080C12` base, `#16C784` bullish, `#EA3943` bearish, `#FFD60A` gold, blue/cyan accents. Green/red are used semantically (wins/bull vs losses/bear), which reinforces the subject matter subconsciously.
- **Gameplay showcase is built to be filled later.** Every tile is a 16:10 media slot with an inline `ASSET:` label and a commented swap recipe (drop in a `<video>` or `<img>`). Content can be added without touching layout.
- **Trust + compliance are designed in.** A play-money / not-financial-advice disclaimer sits in the footer — important for a trading-adjacent product.
- **Reveal is robust by design.** Content fades in on scroll, but a safety net force-reveals everything if the IntersectionObserver never fires, so content can never get stuck invisible.
- **Accessibility:** skip-link, semantic landmarks/headings, `aria-hidden` toggled on modals, Esc-to-close, `prefers-reduced-motion` disables all animation and shows content immediately.

---

## 5 · Asset placement guide

| Slot | Location in `index.html` | How to fill |
|---|---|---|
| **Finn poses (woven in)** | hero frame + Meet Finn = `finn-hero`; storyboard = `finn-hero` → `finn-jump` → `finn-run`; Movement tile = `finn-roll` (spins); "Traditional course" column = `finn-dazed`; final CTA = `finn-boost` | All wired to `assets/finn-*.png`. To update, re-copy from `finn/` (never edit the originals). |
| **Gameplay clips/screenshots** | Each `.media-slot` in `#gameplay` | Replace the placeholder inner `<div>`s with `<video src="assets/clips/NAME.mp4" poster="…" muted loop playsinline autoplay></video>` or `<img src="assets/screenshots/NAME.png" alt="…">`. Keep 16:10. |
| **Gameplay trailer** | `#watchModal .video-slot` | Drop in `<video src="assets/gameplay-trailer.mp4" poster="assets/chartquest-poster.jpg" controls autoplay playsinline></video>` (local file — external embeds are CSP-blocked). |
| **Social share image** | `<meta property="og:image">` | Swap `assets/chartquest-poster.jpg` for a 1200×630 image. |
| **Discord link** | `CQ.discord` in the script, or `data-url` on `[data-discord]` buttons | Paste an invite URL to activate; until then buttons show a friendly note. |
| **Play destination** | `CQ.game` (`play.html`) | Points at the in-browser game shell, per your instruction. |
| **Testimonials / stats** | Section 8 | All placeholder; swap in real numbers/quotes. A "sample data" note is shown on the page. |

---

## 6 · Mobile responsiveness plan

Mobile-first, since traffic is expected from IG/FB/TikTok/YouTube.

- **≤900px:** How-It-Works → 2-col; storyboard stacks with rotated down-arrows; comparison stacks; Meet Finn stacks (art first); roadmap becomes a vertical timeline; showcase → 2-col.
- **≤720px:** nav collapses to a burger dropdown (the desktop CTA hides, the in-menu CTA shows — this fixed a duplicate-button bug found in testing); hero buttons + stats stack; sticky bottom "Play Free" bar appears on scroll; Finn hero art scales down inside the game frame.
- **≤480px:** How-It-Works and footer go single-column.
- Verified at 390px (hero, storyboard, Meet Finn, showcase, comparison, roadmap, social proof, CTA all read cleanly).

---

## 7 · Verification performed

- No console errors, no failed network requests (all assets load locally).
- Desktop (1280) and mobile (390) full-page screenshots reviewed for every section.
- Accessibility snapshot confirmed all copy/structure.
- "Watch Gameplay" modal open/close verified; reveal safety-net verified.

## 8 · Notes / not done (out of scope)

- **Not committed.** Working-tree change only — commit when you're ready.
- **Game regression gate not run.** `scripts/cq.sh ship` / `verify.js` guard the *game* (`chart-quest.html`); this change is website-only and doesn't go through that pipeline. The protected game files were untouched.
- `manifest.webmanifest` still describes the mascot as "Shell." Left untouched to avoid scope creep across shared site files — worth a one-line follow-up to say "Finn."
- To promote: this page is already `website/index.html`, so no rename needed.
