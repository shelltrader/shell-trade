# ChartQuest — Website Beta Launch Audit
**Date:** 2026-08-04 · **Target:** `https://playchartquest.com` (Cloudflare Pages, output dir `website/`)
**Scope:** UX · conversion · messaging · trust — the site as a **Beta Portal**, not a marketing site.
**Status:** AUDIT ONLY. Nothing was implemented. No file in `website/` was modified.

**Method:** 8 specialist auditors across the brief's dimensions → every P0/P1 finding independently
adversarially verified by a second auditor instructed to refute it → dedupe and re-rank.
**103 findings raised · 85 confirmed · 18 refuted.** Refuted findings are excluded entirely.
Live production was measured directly (headers, page content, asset weights, data freshness).

Screenshots: `audit-2026-08-04-website-beta/`

---

## THE VERDICT

The site is **beautifully made and materially dishonest about what the beta contains.** That is the
whole audit in one line.

The key art is genuinely world-class, the markets section is a real engineering achievement, and the
copy has real voice. None of that is the problem. The problem is that a page built to sell a finished
eleven-Guardian game is about to be handed to testers who will get Level 1 and one boss — and the page
never says so. The single explicit statement of scope on the entire page is **false by a factor of ten**,
and it is gold-pulsed as the *current* phase.

Then there is the second problem, which is bigger and wasn't in the brief: **the brief's primary metric
is survey completion, and there is no survey.** Not a broken one — none. Zero `<form>`, zero `<input>`,
zero feedback link, anywhere in `website/`. Survey completion is 0% by construction.

**Beta-ready in ~3.5 days** (groups A + B + C: 30 findings, 21×S + 9×M). Group A alone is ~1 day and is
the difference between "early access" and "these people are lying to me."

---

## 0 · PRODUCTION REALITY (measured live, 2026-08-04)

These were verified against the deployed site, not the repo. Several contradict what the repo implies.

| # | Finding | Sev | Evidence | Effort |
|---|---|---|---|---|
| **0.1** | **`/privacy` and `/terms` do not exist.** They return HTTP 200 serving the *homepage* — Cloudflare Pages' not-found handler. Both files live at repo root, outside the `website/` output dir. | **P0** | `curl /privacy` → `<title>ChartQuest — The World's First Trading RPG</title>` | S |
| **0.2** | **`/courses` is live in production** — "Chart Quest Academy", $39.99 and $149.99 products that do not exist, "Over $600 of value", refund guarantee. Unlinked from the landing page but publicly reachable and crawlable (`robots.txt` allows it). | **P0** | `curl /courses` → `<title>Chart Quest Academy — Trading Courses…</title>` | S |
| **0.3** | **`/bosses` is live** — "The 11 Guardians", contradicting the beta scope. Has a built-in hide gate that is switched **on**. | **P1** | `assets/config.js:23` `showBossesPage: true` | S |
| **0.4** | **Production serves market data baked 2026-07-10** — 25 days stale — beside copy reading "buying and selling **right now**". | **P1** | live `assets/market-data.js:1` | S |
| **0.5** | **Production is behind the repo.** The mobile-hero rework and the nav-burger centring fix are committed but not deployed. Auditing the repo ≠ auditing what testers will see. | **P1** | live HTML diff vs `website/index.html` | S |
| **0.6** | **No CSP, no X-Frame-Options, no HSTS, and `access-control-allow-origin: *`** in production. `_headers` sits at repo root, outside the output dir, so none of it ships. | **P2** | `curl -I` → only `x-content-type-options`, `referrer-policy` | M |

> **Trap on 0.6 — do not just move `_headers` into `website/`.** As written it would *break the site*:
> `X-Frame-Options: DENY` + `frame-ancestors 'none'` kill the site's own same-origin game embed, and
> `font-src 'self'` kills the Google Fonts the page depends on. It needs rewriting, not relocating.

---

## A · SHIP-BLOCKERS — before a single tester sees this

### A1 · The roadmap sells 10 worlds and 11 Guardians as the CURRENT phase
**P0 · S ·** `website/index.html:1418-1419` · screenshot `07-desktop-roadmap-FALSE-CLAIM.png`

```html
<div class="ex-phase">Phase 02 · Now</div>
<div class="ex-title">Open Beta</div>
<div class="ex-desc">10 worlds, 11 Guardians, playable free.</div>
```

Gold-pulsed as "now" (`:319`) while only L1 + the Gambler exist. This is the page's only explicit scope
statement and it overstates the build ~10×. A tester who hits the end of Level 1 concludes the team lies,
and stops answering anything.

**Fix** — rewrite three nodes (keep the `&amp;` entity; do **not** write "Closed Beta" — there is no gate anywhere):
- `:1418` → `Alpha` / `We built the first world and the first Guardian.` *(currently says "first Guardian**s**" — plural, also false)*
- `:1419` → `Phase 02 · You are here` / `Early Beta` / `World 1 and the first Guardian are playable now. The rest gets built with beta players.`
- `:1420` → `Launch` / `10 worlds. 11 Guardians. Every device.`

### A2 · Nine more places repeat the same promise
**P0 · M ·** `index.html:7, 44, 52, 1182, 1319, 1325, 1331, 1333, 1388, 1421, 1447` · `play.html:7, 77` · `assets/site.js:66`

`:1333` "A boss guards every world."; `:1388` "Bosses, ranks, worlds to unlock"; `:1182`/`:52` alt text
"stands before the **eleven** Guardian bosses"; `:1331` alt describes a boss that doesn't ship;
`play.html:7`/`:77` "**live** crypto charts" — candles are authored, only a price anchor is fetched.

Fixing A1 alone leaves nine quieter versions of the same lie. Sweep them together:
- `:1333` → `<h3>Beat the Guardian</h3><p>A giant boss made of candles guards the end of the world. Beat it with the trick you just learned. One Guardian is awake right now — the Gambler.</p>`
- `:1388` → `A real boss fight you have to earn`
- `:1182`/`:52` alt → drop "eleven"
- `:1319` alt → drop "live"
- `play.html:7`/`:77`/`site.js:66` → delete the word **live**. Loader → `Getting your chart ready… / Waking up Finn 🐢`

### A3 · The only community link is dead and shows the player a developer instruction
**P0 · S ·** `index.html:1455, 1518, 2069-2073`

`<a href="#" data-discord data-url="">Join the guild</a>` with `CQ.discord = ""` → the live branch is:

> `alert("The guild opens soon! 🐢\n\nPaste your Discord invite into CQ.discord (in this page's script) or the button's data-url to activate it.")`

The one click a beta candidate makes to join the community shows them internal setup instructions.
Reads as abandoned, not early — and breaks the 10-year-old wording rule outright.

**Fix:** set a real invite at `:1518` and relabel to `Join the beta chat`. If there is no chat, repoint
the `<li>` at the survey. Never ship the alert. If a fallback must stay, remove the whole `<li>` —
removing only the `<a>` leaves a 9px flex gap (`:336`).

### A4 · `courses.html` sells $149.99 of product that does not exist, and its checkout alerts a config-file instruction
**P0 · S ·** `courses.html:7, 32, 87, 140-141, 167` · `assets/config.js:23, 30-31` · `assets/site.js:107-111`

"Over $600 of value. $149.99 today." · "LAUNCH PRICING — locked in for early students" · claims 120+
lessons, private community, monthly live Q&A. `cqBuy()` falls back to
`alert("Checkout is opening soon! 🐢 … Set the link in assets/config.js.")`.

A tester who searches "ChartQuest" during the beta can land on a paid-course page with a refund
guarantee, no contact address, and a checkout that tells them to edit a config file. **Nothing else in
this audit is more scam-shaped.**

**Fix:** drop `courses.html` from the deploy for the beta window (it has no gate). For `bosses.html`,
flip `config.js:23` to `showBossesPage: false` — the gate at `bosses.html:24-32` already renders an
on-brand "The Guardians are resting in the deep 🌊", and `site.js:53/68` auto-strip the nav/footer links.
Gate both together: `site.js:71` still renders a footer link to `courses.html#foundations`.

### A5 · The signup consent gate's Privacy and Terms links 404
**P0 · S ·** `website/game.html:1207, 1874` + finding 0.1

A **required** checkbox under email/password signup reads:

```html
I agree to the <a href="privacy.html">Privacy Policy</a> and <a href="terms.html">Terms</a>.
```

enforced at `:1874`. Both targets 404 in production (0.1). **The site already collects credentials —
from an audience that includes children — behind an agreement they cannot open.** This is live legal
exposure, and it blocks any email capture or analytics the beta adds (tickets 2 & 3 both depend on it).

**Fix:** copy `privacy.html` and `terms.html` into `website/`. Do **not** rewrite the hrefs to `../` —
`game.html` is byte-mirrored to repo root. Add to `sitemap.xml` and to the footer at `index.html:1459`.

### A6 · Inside the embed, tapping the logo loads the whole marketing site inside the game box
**P0 · S ·** `play.html:57` — `<a class="home" href="index.html">` with **no `target`**

`index.html` iframes `play.html` into a 16:10 / 3:4 box. No frame-busting anywhere. The most obviously
broken thing a visitor can trip over, and it is one attribute from correct.

**Fix:** add `target="_top"`. Leave `play.html:80` alone — its `target="_blank"` is the deliberate
stuck-loader escape.

### A7 · `logo.png` is 1.78 MB and gates the loading spinner on the primary CTA path
**P0 · S ·** `game.html:1195` (also `:1550`) · 1,871,495 B · 1254×1254 · rendered ~340px

Eager `<img>` on the auth overlay, visible on first paint. `play.html:109` only hides the loader on
iframe `load`, which waits for every subresource. Served uncompressed from production, and absent from
the `sw.js` precache. **≈9.4 s on slow-4G of pure logo** before the spinner clears. The tester who
bounces here never sees Level 1 and never sees the survey.

**Fix:** re-encode to 512×512 WebP q80 (~30 KB, ~98% cut), keep the PNG as `srcset` fallback.
*Trap:* if you add `width`/`height` to `:1195` you must add `height:auto` to `game.html:1062` in the
same edit — that rule is `width:100%` only, and the attribute would stretch the logo to 1254px tall.

### A8 · Nothing in the entry path says "beta"
**P0 · M ·** `index.html:6, 7, 43-44, 52-56, 1210-1216` · `play.html:6, 7, 15, 63`

`grep -i beta index.html` returns **exactly one hit** — the false claim at `:1419`. `play.html` returns
zero and has no OG/Twitter tags at all. Every visitor and every shared link forms a finished-game
expectation before a pixel loads. "You're early" is the strongest excitement lever the page has and it
is entirely unused.

- `:6` title → `ChartQuest Beta — Play World 1 Free`
- `:44`/`:55` description → `The beta is open. Play the first world free, beat the Gambler, and help us build the other ten.`
- `:1210` eyebrow → `Early beta · World 1 is open`
- `:1212` sub → `Charts turn into a world you can run through. World 1 and the first Guardian are ready today — the rest gets built with your help.`
- `play.html:6` → `Play the ChartQuest Beta`; `:63` bar → `BETA · WORLD 1` **and drop `hideSm`** or it vanishes below 520px

> **Placement trap:** `index.html:1078` hides `.eyebrow` and `.hero-trust` under
> `@media (orientation:landscape) and (max-height:520px)`. Beta framing must *also* live in the
> `h1`/`.sub`, which survive that breakpoint.

### A9 · Brand splits at the moment of highest intent
**P1 · S ·** `play.html:6, 7, 15` · `bosses.html:29` · `sw.js` · `site.js`

`index.html` says "ChartQuest" 28 times and "Chart Quest" zero times. `play.html` — the page a tester
lands on the instant they click the primary CTA — says "**Chart Quest**" four times, including its
`<title>Play Chart Quest</title>`.

### A10 · Bump the service-worker cache in the same commit
**P0 · S ·** `website/sw.js:10, 66-75` — `CACHE = 'chartquest-site-v7'`, pure cache-first, no revalidation

Runtime-cached images (`hero-key-art.jpg`, `EXPLORE/TRADE/BATTLE.jpg`, `finn-*.png`) are pinned until
that string is renamed. Re-cut the eleven-Guardian art per A2 without a bump and returning testers keep
seeing the old overclaim. Commit `94f1a8b` shows this exact failure already happened once.

**TOTAL A: 8×S + 2×M ≈ 1 day**

---

## B · HIGH-VALUE BETA-PORTAL CONVERSION WORK

### B1 · There is no survey. Survey completion is 0% by construction.
**P0 · M ·** `index.html` (zero `<form>`, zero `<input>`) · `assets/site.js:72-77`

Exhaustive grep: zero `mailto:`, zero survey/typeform/tally, zero feedback link across `index.html`,
`play.html`, `site.js`, `config.js`. The only form in the codebase renders on the two orphan pages and
**is a lie** — `cqNews` (`site.js:77`) unhides "Thanks — you're on the list! 🐢" and sends nothing.

**Fix:** build ONE survey, max 5 questions, one free-text. Wire the URL into the **inline** `CQ` object
at `index.html:1518` — *not* `assets/config.js`, which `index.html` never loads. Do **not** reuse `cqNews`.

> This is ticket 3's survey. **Build it first** — A3, B2, B3 and B4 all depend on a live survey URL, and
> without it each one ships a second dead `href="#"` identical to the one A3 is fixing.

### B2 · Nothing happens after play — the page goes straight to a courses comparison
**P0 · M ·** `index.html:1362-1374`

After the game mount: the full-screen escape link, then `<!-- Everything below is supporting content -->`,
then "You don't finish courses. You finish games." **Peak goodwill — the entire budget for survey
completion — is spent on a marketing argument about online courses.**

**Fix:** insert a card inside the existing `.wrap` at `:1364`, gated on `.game-mount.loaded` (already set
at `:1997`) so scrollers who never played don't see a false "you made it back":

> **You made it back. Now help us build World 2.**
> You just played the very first part of ChartQuest. Tell us what was fun and what was confusing — 3 questions, about a minute.
> `[ Answer 3 questions → ]`
> *Didn't finish? Even better — tell us where you stopped.*

### B3 · Put the ask where the player actually is
**P1 · S ·** `play.html:56-68` — most testers arrive by direct link and never see `index.html`'s footer.

Add `💬 Tell us what you think` to `.play-bar`; demote Restart to a ghost button. Add a quiet line:
`Beta · World 1 only · pretend money, never real money`.

### B4 · The best survey trigger already exists in the game and nothing listens
**P1 · M ·** `game.html:13138-13154`

`bossWin()` already fires `__qaReport` and `ContentLog.emit('boss_defeated', …)`. A parent-postMessage
pattern exists at `:25607` but is gated behind `QA_ON` — inert for real players. **Asking at the one real
ending is the difference between a 40% and a sub-5% survey rate.**

**Three constraints:** (1) edit canonical `chart-quest.html` and propagate via `cq.sh mirror` —
`website/game.html` is a byte-identical mirror; (2) if you also hook `introComplete()` as the reveal
trigger, gate it on having received `boss1_defeated` first — `bossSkipForNow()` also calls it for a
player who *passed* on the fight; (3) `play.html:80` opens the game top-level where `parent === window`,
so postMessage can never be the only route to the survey.

### B5 · Two rival funnels: seven CTAs bypass the mount the whole page is built toward
**P1 · M ·** `index.html:1151, 1156, 1214, 1356, 1363, 1430, 1451, 1469`

Seven links go to `play.html`; exactly one — `#gameEnter` — is the in-page portal, sitting **~3,900px
down desktop / ~5,100px mobile** (screenshot `05-desktop-game-mount.png`). `:1363` is an escape hatch
*out of* the mount, directly beneath it. Almost nobody sees the "website becomes the game" moment.

**Fix (safer of two options — deleting `#play` orphans the depth-rail layer and the bridge):** keep
`#play`, point the hero CTA at `href="#play"`, auto-fire the mount on arrival, delete `:1363`, and set
`data-game="game.html"` so the embed stops nesting `play.html`'s 52px bar inside a 340px box (~11.5% of it).

### B6 · The sticky gold "Play Free" bar parks on top of the running game
**P1 · S ·** `index.html:343, 1467-1470, 1997`

Shown at `scrollY>640`; nothing stands it down when the game mounts. A bar telling the player to do the
thing they just did, sitting on the touch controls — and tapping it navigates them out of the embed.
**Fix:** add `body.cq-playing` in the mount click handler — the exact standdown pattern already exists at `:433`.

### B7 · The loader hides blind at 9s and destroys its own escape hatch
**P1 · M ·** `play.html:80, 109-112, 114`

Unconditional `setTimeout(…hide…, 9000)` with no `loaded` flag, no `error` listener, no fail branch. The
"Open in a new tab" link is a **child of `#cqLoader`** — it appears at 5s and is destroyed at 9s, exactly
when it becomes necessary. Restart (`:114`) drops `CQ_QS`, silently discarding `?fresh`/`?guest`/`?mute`.

### B8 · Nav has no beta marker; the CTA reads "Play Free" in eight places
**P1 · S ·** `index.html:1143` + 8 CTA sites

`.nav` is sticky — on screen at every scroll position — and carries no build state. Add a `BETA` pill
after the wordmark; change labels to `Play the Beta` (including the `aria-label`). Because "beta" is not
a 10-year-old word, the hero must gloss it once: `Early beta · World 1 is open`.

### B9 · Zero instrumentation — the funnel cannot be measured
**P2 · M ·** no `gtag`/`plausible`/`track(` anywhere. Every decision after this audit is a guess,
including whether the survey ask works. *(Ticket 3 covers this.)*

### B10 · `hero-key-art.jpg` is 834 KB, un-preloaded, and ~74% cropped on a phone
**P1 · M ·** `index.html:1182` — 834,184 B / 1672×941, no `srcset`, no `<picture>`, no `rel=preload`,
declared at byte ~93,377 of a 143,654-byte document. Cover-fitting into 390×844 discards ~74% of the
downloaded pixels. The hero copy block is itself `.reveal`, so the headline and Play button are
opacity-gated too → **1.2–4.2 s of empty dark rectangle as the first impression.**

**TOTAL B: 3×S + 7×M ≈ 1.5–2 days**

---

## C · TRUST & POLISH

| # | Finding | Sev | File:line | Fix | Eff |
|---|---|---|---|---|---|
| **C1** | `--ink-faint #5f7285` = **4.01:1** on `--bg`, **3.92:1** in the footer, **3.75:1** in the comparison table — all below AA 4.5:1, across 26 selectors at 9–12.5px. It is what the hero trust line *and the financial disclaimer* use. Copy that exists to remove friction is the least readable text on the page. | P1 | `index.html:89` | `--ink-faint:#8195a8` (6.45:1). Promote `.hero-trust`/`.sc-sub` to `--ink-dim`; `.hero-trust` sits over the key art with **no text-shadow** unlike its siblings — add one. | S |
| **C2** | Markets widget shows a 4-week-old price and renders a **period** change as if it were a daily move (Apple 258.9→316.22 = +22.1%) beside "buying and selling right now". | P1 | `market-data.js:1`, `index.html:1241,1295,1900` | Label it — `+22.1% over this chart` — and emit a dateline from `m.c[0][0]`/`m.c[last][0]`. Credit Yahoo Finance beside the TradingView library credit. **Do not** grey the `mk-dot` — it encodes direction, not liveness. | S |
| **C3** | Footer says nothing about build state; the disclaimer is written for adults ("loss of capital", "do your own research") in the one block whose job is to reassure a parent. | P2 | `index.html:1458` | Prepend a beta line; plain-language the rest: *"Every trade inside the game uses pretend money — you can never lose real money by playing…"* | S |
| **C4** | One unguarded `localStorage.getItem('cq_installed')` runs before the reveal observer while identical calls 50 lines later *are* wrapped. A throw (storage blocked by policy) leaves **every `.reveal` at opacity:0 forever** — key art and nothing else. | P1 | `index.html:1591` | try/catch + `<noscript>` reveal reset. **Keep `class="js"` on line 2** — removing it causes a full-page flash on every load. | S |
| **C5** | The Trade pillar tells the player to **guess** — in the one panel describing trading, on a page arguing "real skills, learned by doing". | P2 | `index.html:1327` | `The chart leaves you a hint about what happens next. You pick up or down and find out. It's pretend money, so a wrong answer costs nothing.` | S |
| **C6** | Six market chips imply six in-game markets; World 1 is one authored market. | P2 | `index.html:1281,1287-1294` | Add: `The beta starts you on one chart. Read it, and the rest come free.` | S |
| **C7** | Landscape phones: `.hero-cine-stage{height:100svh}` is never overridden while `.hero-cine` is shortened and keeps `overflow:visible` — a hard-edged strip of key art bleeds behind the bridge. | P2 | `index.html:669-670 vs 1075` | `position:static;height:auto` in the landscape block. | S |
| **C8** | Skip link has `onfocus` styling and **no `onblur`** — stays pinned over the logo all session; `#main` isn't in the `scroll-margin-top` selector so it lands under the sticky nav. `#installSheet` is `aria-modal` but Tab walks straight out — while the nav sheet implements the trap correctly. | P2 | `index.html:1133,1486,776` | `:focus-visible`; add `main[id]` to `:776`; lift the nav sheet's trap into a shared helper. | S |
| **C9** | `finn-boost.png` (62 KB) eager twice; PWA icons eager inside `display:none` modals — while every other below-fold image correctly lazy-loads. | P2 | `index.html:1273,1357,1475,1489` | Add `loading="lazy" decoding="async"`. | S |
| **C10** | The TradingView credit becomes a ~45px-tall, 100%-wide off-site link directly under a wrapping row of 44px chips. Chip clicks also lock the showcase permanently. | P2 | `index.html:988,1059,1295` | `display:table;margin-inline:auto`; restart auto-rotation after ~15s idle. | S |
| **C11** | `play.html` disables pinch-zoom (`user-scalable=no`) on the page with the smallest text — `index.html` does not. `--sab` is declared and never used, so the PWA home indicator overlaps the canvas. | P2 | `play.html:5,22,37` | Drop `maximum-scale=1, user-scalable=no`; `.frame-wrap{bottom:var(--sab)}`. | S |

**TOTAL C: 11×S ≈ 0.75 day**

---

## D · POST-BETA BACKLOG (23 findings — summary)

Design-system debt and non-blocking polish. Full detail retained in the audit data.

**Highest-value few:** `sw.js` cache-first with no revalidation → stale-while-revalidate plus a release
check that fails the build if `CACHE` wasn't bumped (D14, P1). Security headers rewritten and moved into
`website/` — *without* the two directives that would break the embed and the fonts (D1). ~150 lines of
dead CSS across five superseded design passes, plus two JS handlers bound to `.modal` when zero exist
(D5). Google Fonts render-block both documents while the stylesheet header claims "self-contained, no
CDNs" (D2), and 34 declarations request font weights 800/850/900 that no loaded font file provides (D3).
The H1 is the smallest, lightest display heading at every width — documented at `:642-643` as deliberate
art direction, so this is a decision to revisit, not a bug (D4). "The world's first trading RPG" is an
unbackable superlative in six places including `<title>` (D16). The 641–720px band gets the mobile hero
and portrait mount with the desktop nav and **no sticky CTA** (D11).

**TOTAL D: 14×S + 9×M ≈ 3–4 days**

---

## THE BETA PORTAL NARRATIVE

The page currently tells a **launch** story. A beta portal tells a **recruitment** story: *here is exactly
what exists, you are early, your answer builds the next bit.* Three edits carry it — an honest promise at
the top, one door, and one ask at the end.

| # | Section | Job | Change |
|---|---|---|---|
| 1 | Nav — wordmark + **BETA** pill + `Play the Beta` | Build state, always visible | B8 |
| 2 | Hero — beta eyebrow, promise, ONE button | Set the true expectation, then launch | A8 |
| 3 | **"What's open today"** *(new, ~6 lines)* | The honest scope card | new · S |
| 4 | `#play` — the door, auto-mounting | The single funnel | B5 |
| 5 | **Post-play ask** *(new, gated on `.loaded`)* | Survey at peak goodwill | B2 |
| 6 | `#markets` → `#what` → `#roadmap` | Why it works · what it is · what's next | A1/A2/C6 |
| 7 | `#why` → Finn | Supporting argument | unchanged |
| 8 | Footer — beta line, Privacy · Terms, feedback | Careful readers answer surveys | A3/A5/C3 |

**Copy (10-year-old reading level):**

- **Hero eyebrow** — `Early beta · World 1 is open`
- **Hero headline** — `THE CHART IS THE WORLD.` *(unchanged — it's good)*
- **Hero sub** — `Charts turn into a world you can run through. World 1 and the first Guardian are ready to play today — the rest gets built with your help.`
- **Hero trust** — `Free · No download · No sign-up`
- **Under the button** — `You're one of the first people ever to play this.`

**"What's open today" card:**
> **You're early. Here's exactly what that means.**
> Right now you can play **World 1** and fight the first Guardian — the Gambler. That's it. That's the whole game so far.
> Ten more worlds are drawn, planned and waiting to be built. Which one we build first depends on what beta players tell us.
> **So play it, then tell us what you thought. That's the deal.**

**Friction removed, in order:** the hero's second button · the mount's full-screen escape hatch · the
sticky bar during play · the "Install app" option before anyone has played · two of the three vague nav
links. **One promise, one door, one ask.**

---

## EFFORT SUMMARY

| Group | Findings | S | M | Estimate |
|---|---|---|---|---|
| **0 — Production reality** | 6 | 5 | 1 | *(folded into A/D)* |
| **A — Ship-blockers** | 10 | 8 | 2 | **~1 day** |
| **B — Beta-portal conversion** | 10 | 3 | 7 | **~1.5–2 days** |
| **C — Trust & polish** | 11 | 11 | 0 | **~0.75 day** |
| D — Post-beta backlog | 23 | 14 | 9 | ~3–4 days |
| **BETA-READY (A+B+C)** | **31** | **22** | **9** | **~3.5 days** |

**Hard dependency:** A3, B2, B3 and B4 all need a live survey URL. **Build the survey first (B1 / ticket 3),
or each of them ships a second dead link identical to the one A3 exists to fix.**

---

## SCREENSHOT INDEX — `audit-2026-08-04-website-beta/`

| File | Shows |
|---|---|
| `01-desktop-hero.png` | Hero at 1440×900 — the art is excellent; note zero beta signal, and the trust line at 4.01:1 |
| `02-desktop-markets.png` | "The World Runs on Charts" — the strongest section on the page |
| `03-desktop-pillars.png` | Chip rail + "Now imagine stepping inside one" |
| `04-desktop-three-ways.png` | Explore / Trade / Battle — note the Trade panel's labels clipped at the right edge |
| `05-desktop-game-mount.png` | "Enter the Chart" — the real door, ~3,900px down (B5) |
| `06-desktop-comparison-finn.png` | Courses comparison — what currently occupies peak post-play goodwill (B2) |
| `07-desktop-roadmap-FALSE-CLAIM.png` | **A1** — "Phase 02 · Now / Open Beta / 10 worlds, 11 Guardians, playable free" |
| `08-mobile-hero-390x844.png` | Mobile hero at a true iPhone viewport |
| `09-mobile-hero-scrolled.png` | Mobile hero mid-scroll (the pinned stage) |

---

## WHAT WAS CHECKED AND FOUND HEALTHY

Worth stating, because the list above is long and the site is better than it reads here.

- The **markets showcase** is genuinely well engineered — lazy-booted, `.failed` fallback state, gutter
  maths that keeps Finn off the price axis, identical zoom across six markets.
- **`sw.js` correctly refuses to intercept navigations** with a well-documented reason (redirected
  responses → `ERR_FAILED`), and correctly network-firsts `game.html` and `market-data.js`.
- The **mobile nav sheet** is a proper implementation: animation, backdrop, iOS-safe scroll lock with
  position restore, Escape, focus return, and a real focus trap.
- **`prefers-reduced-motion`** is honoured across the ambient FX, and `[data-fx]` sections pause offscreen
  and on tab-hide.
- **Safe-area insets** are handled on the nav, sticky CTA and footer.
- The **landscape-phone hero rules** are a deliberate, correct adaptation — checked and cleared, not a bug.
- The **hero key art** is the single strongest asset in the product. Every recommendation above keeps it.

---

*Audit only — no implementation. Next: ticket 2 (closed beta experience), ticket 3 (feedback + analytics
+ weekly Founder Report). Ticket 3's survey is the hard dependency for A3/B2/B3/B4 above.*
