# ChartQuest Beta Portal — Final Audit
85 confirmed findings → 41 after dedupe. Ranked by one test: *does fixing this measurably increase trust, excitement, beta participation, or survey completion for the first closed beta?*

---

## A. SHIP-BLOCKERS — before a single tester sees this

### A1 · Roadmap sells 10 worlds and 11 Guardians as the CURRENT phase
**P0 · S ·** `website/index.html:1418-1419`
Evidence: `<div class="ex-phase">Phase 02 · Now</div><div class="ex-title">Open Beta</div><div class="ex-desc">10 worlds, 11 Guardians, playable free.</div>` — gold-pulsed as "now" (CSS `:319`) while only L1 + the Gambler exist.
Impact: the page's only explicit scope statement overstates the build ~10x; a tester who hits the end of L1 concludes the team lies, and stops answering anything.
Fix — rewrite three nodes (keep the `&amp;` entity; **do not** write "Closed Beta", there is no gate anywhere):
- `:1418` → title `Alpha` / desc `We built the first world and the first Guardian.`
- `:1419` → phase `Phase 02 · You are here` / title `Early Beta` / desc `World 1 and the first Guardian are playable now. The rest gets built with beta players.`
- `:1420` → title `Launch` / desc `10 worlds. 11 Guardians. Every device.`

### A2 · Nine more places repeat the "eleven Guardians / every world / live charts" promise
**P0 · M ·** `index.html:7, 44, 52, 1182, 1319, 1325, 1331, 1333, 1388, 1421, 1447` · `play.html:7, 77` · `assets/site.js:66`
Evidence: `:1333` "A boss guards every world."; `:1388` "Bosses, ranks, worlds to unlock"; `:1182` alt "stands before the eleven Guardian bosses"; `:1331` alt describes "a towering serpent made of candles" (a boss that does not ship); `play.html:7` + `:77` "live crypto charts" — the game fetches only a price anchor, candles are authored (`game.html:4340`).
Impact: fixing A1 alone leaves nine quieter versions of the same lie in the exact copy a careful visitor reads.
Fix — one sweep, one honest line everywhere:
- `:1333` → `<h3>Beat the Guardian</h3><p>A giant boss made of candles guards the end of the world. Beat it with the trick you just learned. One Guardian is awake right now — the Gambler.</p>`
- `:1388` → `A real boss fight you have to earn`
- `:1182` / `:52` alt → `Finn the turtle stands before the Guardians of the Blockchain Ocean.` (drop "eleven")
- `:1325` alt → `A trade in ChartQuest: a line where Finn gets in, a line where he gets out if he's wrong, and a line where he wins.`
- `:1319` alt → `Finn running across a Bitcoin chart` (drop "live")
- `play.html:7` / `:77` / `site.js:66` → delete the word **live**. Loader: `<h3>Getting your chart ready…</h3><p>Waking up Finn 🐢</p>`
- `:7` meta → `The ChartQuest beta is open. Play World 1, fight the Gambler, and tell us what to build next. Free, in your browser, no sign-up.`

### A3 · The only community link is dead and pops a developer instruction at the player
**P0 · S ·** `index.html:1455, 1518, 2069-2073`
Evidence: `<a href="#" data-discord data-url="">Join the guild</a>` + `CQ.discord = ""` → the live branch is `alert("The guild opens soon! 🐢\n\nPaste your Discord invite into CQ.discord (in this page's script) or the button's data-url to activate it.")`.
Impact: the one click a beta candidate makes to join shows them internal setup instructions. Reads as abandoned, not early — and breaks the 10-year-old wording rule outright.
Fix: set `CQ.discord` at `:1518` to a real invite and relabel to `Join the beta chat`. If there is no chat, repoint the `<li>` at the survey (A-group dependency: ship B1 first). Never ship the alert; if a fallback must stay, `(a.closest('li')||a).remove()` — removing only the `<a>` leaves a 9px flex gap (`:336`). Note "guild" also collides with roadmap Phase 05 "Guilds" at `:1422`.

### A4 · courses.html is live, sells $149.99 of product that does not exist, and its checkout alerts a config-file instruction
**P0 · S ·** `courses.html:7, 32, 87, 140-141, 167` · `assets/config.js:23, 30-31` · `assets/site.js:107-111`
Evidence: `:87` "Over $600 of value. $149.99 today."; `:32` "LAUNCH PRICING — locked in for early students"; claims 120+ lessons, private community, monthly live Q&A; `cqBuy()` falls back to `alert("Checkout is opening soon! 🐢 … Set the link in assets/config.js.")`. `robots.txt` allows both paths.
Impact: a tester who searches "ChartQuest" during the beta can land on a paid-course page with a refund guarantee, no email address to claim it, and a checkout that tells them to edit a config file. Nothing else on this list is more scam-shaped.
Fix: remove `courses.html` from the deploy output for the beta window (it has no gate). For `bosses.html`, flip `assets/config.js:23` to `showBossesPage: false` — the built-in gate at `bosses.html:24-32` already renders on-brand "The Guardians are resting in the deep 🌊", and `site.js:53/68` auto-strip the nav and footer links. Gate both together: `site.js:71` still renders footer links to `courses.html#foundations`.

### A5 · The signup consent gate's Privacy and Terms links 404 in production
**P0 · S ·** `website/game.html:1207, 1874` · repo-root `privacy.html`, `terms.html`
Evidence: a **required** checkbox under the email/password signup reads `I agree to the <a href="privacy.html">Privacy Policy</a> and <a href="terms.html">Terms</a>`, enforced at `:1874`. Both files exist only at repo root, outside the `website/` Pages output dir → both hrefs 404.
Impact: the site already collects credentials from children behind an agreement they cannot open. This is a live legal exposure, not a future one, and it blocks any email capture the beta adds.
Fix: copy `privacy.html` and `terms.html` into `website/` (do **not** rewrite the hrefs to `../` — `game.html` is byte-mirrored to repo root). Add to `sitemap.xml`. Add to the footer bottom row `index.html:1459`: `<span><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></span>`.

### A6 · Inside the embed, tapping the ChartQuest logo loads the whole marketing site inside the game box
**P0 · S ·** `play.html:57`
Evidence: `<a class="home" href="index.html">` with no `target`; `index.html:1995-2012` iframes `play.html` into a 16:10 / 3:4 box (`:691`, `:703`). No frame-busting anywhere.
Impact: the most obviously broken thing a visitor can trip over, one attribute from correct.
Fix: add `target="_top"`. Leave `play.html:80` (`#cqOpenTab`) alone — its `target="_blank"` is the deliberate stuck-loader escape.

### A7 · logo.png is 1.87 MB and gates the loading spinner on the primary CTA path
**P0 · S ·** `game.html:1195` (also `:1550`) · `logo.png` = 1,871,495 B, 1254×1254, rendered ~340px
Evidence: eager `<img src="logo.png">` on the auth overlay (visible on first paint, `game.html:1044`); `play.html:109` only hides the loader on iframe `load`, which waits for every subresource. Confirmed served uncompressed from production (`content-length: 1871495`, no Cloudflare WebP), and absent from the `sw.js` precache list.
Impact: ~9.4 s on slow-4G of pure logo before the spinner clears. The tester who bounces here never sees Level 1 or the survey.
Fix: re-encode to 512×512 WebP q80 (~30 KB, ~98% cut), keep the PNG as an `srcset` fallback. If you add `width`/`height` to `:1195`, you **must** add `height:auto` to `game.html:1062` in the same edit — that rule is `width:100%` only, and the attribute would stretch the logo to 1254px tall.

### A8 · Nothing in the entry path says "beta" — title, meta, OG, hero, play page all sell a finished game
**P0 · M ·** `index.html:6, 7, 43-44, 52-56, 1210-1216` · `play.html:6, 7, 15, 63`
Evidence: `grep -i beta index.html` returns exactly one hit — the false claim at `:1419`. `play.html` returns zero, has no OG/Twitter tags at all, and splits the brand ("Chart Quest" at `:6, :7, :15`, also `bosses.html:29`).
Impact: every visitor and every shared link forms a finished-eleven-Guardian expectation before a pixel loads. "You're early" is the strongest excitement lever the page has and it is entirely unused.
Fix:
- `:6` title → `ChartQuest Beta — Play World 1 Free`
- `:43/:54` og/twitter title → same; `:44/:55` description → `The beta is open. Play the first world free, beat the Gambler, and help us build the other ten.`
- `:1210` eyebrow → `Early beta · World 1 is open`
- `:1212` sub → `Charts turn into a world you can run through. World 1 and the first Guardian are ready today — the rest gets built with your help.`
- `:1216` trust → `Free · No download · No sign-up`
- `play.html:6` → `Play the ChartQuest Beta`; `:15` → `ChartQuest`; `:63` bar label → `BETA · WORLD 1` **and drop the `hideSm` class** or it vanishes below 520px (`play.html:51`)
- **Placement trap:** `index.html:1078` hides `.eyebrow` and `.hero-trust` under `@media (orientation:landscape) and (max-height:520px)`. Beta framing must also live in the `h1`/`.sub` (`:1211-1212`), which survive.

### A9 · Bump the service worker cache with this release
**P0 · S ·** `website/sw.js:10, 66-75`
Evidence: `const CACHE = 'chartquest-site-v7'` + pure cache-first for all static assets. Runtime-cached-only images (`hero-key-art.jpg`, `EXPLORE/TRADE/BATTLE.jpg`, `finn-*.png`) are pinned until the string is renamed. Commit `94f1a8b` shows this exact failure already happened once.
Impact: re-cut the eleven-Guardian hero art per A2 without a bump, and returning testers keep looking at the old overclaim.
Fix: `chartquest-site-v8` in the same commit as any asset change. (Longer-term SWR rewrite → group D.)

**TOTAL A: 7×S + 2×M ≈ 1 day**

---

## B. HIGH-VALUE BETA-PORTAL CONVERSION WORK

### B1 · There is no survey. Survey completion is 0% by construction.
**P0 · M ·** `index.html` (zero `<form>`, zero `<input>`) · `play.html:100-191` · `assets/site.js:72-77`
Evidence: exhaustive grep — zero `mailto:`, zero survey/typeform/tally, zero feedback link across `index.html`, `play.html`, `site.js`, `config.js`. The only form in the codebase (`site.js:72`) renders on the two orphan pages only and is a **lie**: `cqNews` (`:77`) unhides "Thanks — you're on the list! 🐢" and sends nothing.
Impact: the brief's primary metric cannot be non-zero. A tester who beats the Gambler and loves it has no button to press.
Fix: build ONE survey (Tally/Typeform), max 5 questions, all tappable, one free-text. Wire the URL into the **inline** `CQ` object at `index.html:1518` — `var CQ = { game:"play.html", survey:"…", discord:"" };` — **not** `assets/config.js`, which `index.html` never loads. Mirror into `config.js` only if the orphan pages survive. Do **not** reuse the `cqNews` component.

### B2 · Nothing happens after play — the page goes straight to a courses comparison
**P0 · M ·** `index.html:1362-1374`
Evidence: after the game mount, the next content is the full-screen escape link (`:1363`), then `<!-- Everything below is supporting content -->` (`:1368`), then "You don't finish courses. You finish games." (`:1374`).
Impact: peak goodwill — the entire budget for survey completion — is spent on a marketing argument about online courses.
Fix: insert a card **inside the existing `.wrap`** at `:1364`, gated on `.game-mount.loaded` (the class is already set at `:1997`) so scrollers who never played don't see a false "you made it back". Copy:
> **You made it back.**
> **Now help us build World 2.**
> You just played the very first part of ChartQuest. Tell us what was fun and what was confusing — 3 questions, about a minute.
> `[ Answer 3 questions → ]`
> *Didn't finish? Even better — tell us where you stopped.*

`.journal-teaser` (`:819-832`) is orphaned CSS with no element using it — reuse the rule if you like, but it is not an existing visible pattern.

### B3 · Put the ask where the player actually is
**P1 · S ·** `play.html:56-68`
Evidence: `.play-bar` is home + "▶ NOW PLAYING" + Install/Fullscreen/Restart. Most testers arrive here by direct link and never see `index.html`'s footer.
Impact: a persistent, low-key ask in the bar out-converts anything in the marketing footer, and it catches the players who never touch the embed.
Fix: add `<button class="prime" id="cqFeedback">💬 <span>Tell us what you think</span></button>` opening the survey in a new tab; demote Restart to a ghost button. Add a quiet line under the bar: `Beta · World 1 only · pretend money, never real money`.

### B4 · The best survey trigger already exists in the game and nothing listens
**P1 · M ·** `game.html:13138-13154`
Evidence: `bossWin()` already fires `__qaReport` (`:13143`) and `ContentLog.emit('boss_defeated', …)` (`:13150-13152`). A parent-postMessage pattern exists at `:25607` but is gated behind `QA_ON` (`:25605`), inert for real players.
Impact: asking at the one real ending is the difference between a 40% and a sub-5% survey rate.
Fix: after the try block closes at `:13154`, add — gated to `bfState.level === 1`, unconditional on `qa`:
`try { if (window.parent && window.parent !== window) window.parent.postMessage({source:'cq-beta', type:'milestone', milestone:'boss1_defeated', attempts: bfState.attempt||1}, location.origin); } catch(e){}`
Then listen in `play.html` after `:108` and reveal the panel over `.frame-wrap` (`:70`), styled like `.loader` (`:43-50`). **Three constraints:** (1) edit the canonical `chart-quest.html` and propagate via `cq.sh mirror` — `website/game.html` is a byte-identical mirror (md5 `4f3c4f3c…`); (2) if you also hook `introComplete()` (`:20132`) as the reveal trigger, gate it on having received `boss1_defeated` first — `bossSkipForNow()` (`:13356`) also calls it for a player who *passed* on the fight; (3) `play.html:80` opens the game top-level, where `parent === window`, so postMessage can never be the only route to the survey.
Panel copy:
> **You beat the Gambler. 🐢**
> That's the end of the beta — World 1 is all we have built so far. You're one of the first people ever to finish it. Tell us what you thought and we'll build the next world around your answers.
> `[ Answer 5 quick questions → ]`  ·  *Not now*

### B5 · Two rival funnels: seven CTAs bypass the mount the whole page is built toward
**P1 · M ·** `index.html:1151, 1156, 1214, 1356, 1363, 1430, 1451, 1469`
Evidence: seven links go to `play.html`; exactly one — `#gameEnter` at `:1356` — is the in-page portal, sitting ~3,900px down desktop / ~5,100px mobile. `:1363` is an escape hatch *out of* the mount, directly beneath it.
Impact: almost nobody sees the "website becomes the game" moment, and "entering the beta" has two different meanings.
Fix (the safer of the two options — deleting `#play` orphans the depth-rail layer at `:1166` and the bridge at `:1339`): keep `#play`, point the hero CTA at `href="#play"`, auto-fire the mount on arrival, delete `:1363`, and set `data-game="game.html"` (`:1356`) so the embed stops nesting `play.html`'s 52px bar inside a 340px box (~11.5% of it) — the `CQ.game` fallback at `:1518` is also `play.html`, so it must be explicit.

### B6 · The sticky gold "Play Free" bar parks on top of the running game
**P1 · S ·** `index.html:343, 1467-1470, 1997`
Evidence: `.sticky-cta{position:fixed;bottom:12px;z-index:70}`, shown at `scrollY>640` (`:1690`). `.game-mount` creates no stacking context; the `loaded` class is consumed only by `:700`. Nothing stands the bar down. The game's own fixed bottom UI is there (`game.html:271`, `:646`) and is deliberately reserved for control hints.
Impact: a bar telling the player to do the thing they just did, sitting on the touch controls — tapping it navigates them out of the embed.
Fix: in the mount click handler (`:1995`) add `document.body.classList.add('cq-playing')`, plus `body.cq-playing .sticky-cta{transform:translateY(200%)}` — the exact standdown pattern already at `:433`.

### B7 · The loader hides blind at 9s and destroys its own escape hatch
**P1 · M ·** `play.html:80, 109-112, 114`
Evidence: unconditional `setTimeout(…hide…, 9000)` with no `loaded` flag, no `error` listener, no fail branch. The "Open in a new tab" link at `:80` is a **child of `#cqLoader`** — it appears at 5s and is removed at 9s, exactly when it becomes necessary. Restart at `:114` reassigns `gframe.src = CQ_GAME` **without `CQ_QS`**, silently dropping `?fresh`/`?guest`/`?mute`.
Impact: on the majority CTA path, a slow 1.86 MB download ends on an empty frame with the escape gone.
Fix: track a `loaded` flag set in the `load` handler; never hide the loader unless it fired; at 15 s render the fail state (mirror `index.html:2002-2005`) with a `game.html` link. Keep the 5 s escape link visible. Preserve `CQ_QS` on restart.

### B8 · Nav has no beta marker; the CTA reads "Play Free" in eight places
**P1 · S ·** `index.html:1143, 1151, 1156, 1214, 1356, 1363, 1430, 1451, 1469` · `:167` (stale comment)
Evidence: `.nav` is `position:sticky` (`:155`) — on screen at every scroll position — and carries no build state. `.jt-tag` (`:828`) is an unused gold pill style ready to reuse.
Impact: "Free" is table stakes; "you're early" is the reason to click and the reason to answer a survey afterwards.
Fix: `<span class="beta-pill">BETA</span>` after the wordmark at `:1143`. Change every label to `Play the Beta` (including the `aria-label` on `:1356`). Sticky sub (`:1468`) → `Free · World 1 is open`. Because "beta" is not a 10-year-old word, the hero must gloss it once: `Early beta · World 1 is open`.

### B9 · Zero instrumentation — the funnel cannot be measured
**P2 · M ·** `index.html:1516-2080`
Evidence: no `gtag`/`plausible`/`track(` anywhere; no CTA reports a click.
Impact: every decision after this audit is a guess — including whether the survey ask works.
Fix: one script tag (Cloudflare Web Analytics — cookieless, no consent banner needed) and four events: `cta_play_click{where}`, `game_loaded`, `survey_open`, `survey_submit`.

### B10 · hero-key-art.jpg is 834 KB, un-preloaded, and ~74% cropped on a phone
**P1 · M ·** `index.html:1182`
Evidence: 834,184 B / 1672×941, no `srcset`, no `<picture>`, no `rel=preload`; declared at byte ~93,377 of a 143,654-byte document. Cover-fitting into 390×844 discards ~74% of downloaded pixels. The hero copy block itself is `.reveal` (`:1208`), so the headline and Play button are opacity-gated too.
Impact: 1.2–4.2 s of empty dark rectangle as the first impression, then the CTA.
Fix: `<picture>` with a WebP/AVIF desktop source (~250-300 KB) and a dedicated portrait crop for `(max-width:720px)` (~900×1600, ~120-160 KB); add a head `rel=preload` with matching `imagesrcset`/`media`. Re-cut the art to stop depicting eleven Guardians (A2) in the same pass — and bump the SW cache (A9).

**TOTAL B: 3×S + 7×M ≈ 1.5–2 days**

---

## C. TRUST & POLISH

### C1 · `--ink-faint` fails WCAG AA everywhere, including the hero trust line and the financial disclaimer
**P1 · S ·** `index.html:89`
`#5f7285` on `--bg` = 4.01:1; on `--panel-2` = 3.52:1 (AA needs 4.5:1), across 26 selectors at 9–12.5px — `.hero-trust` (`:1027`), `.disclaimer` (`:339`), `.sticky-cta .sc-sub` (`:346`). Copy that exists to remove friction is itself hard to read.
Fix: `--ink-faint:#8195a8` (6.45:1 / 5.66:1 — clears AA on every background in the file). Promote `.hero-trust` and `.sc-sub` to `var(--ink-dim)`. `.hero-trust` sits over the key art under a fading scrim and, unlike its siblings at `:644/:646`, has **no text-shadow** — add one.

### C2 · The markets widget shows a 4-week-old price and mislabels a period change as a daily move
**P1 · S ·** `assets/market-data.js:1` · `index.html:1241, 1295, 1900`
`baked 2026-07-10` (today: 2026-08-04); `m.chg` is the change across the entire visible window (Apple 258.9→316.22 = +22.1%) rendered beside `m.last` in a price bar, under "Millions of people are buying and selling right now."
Fix: label the percentage — `+22.1% over this chart` — or move it out of the price bar. Emit a dateline from `m.c[0][0]`/`m.c[last][0]` in `head()` (`:1897-1903`); ranges differ per market so a hard-coded string would be wrong for four of six. Copy: `Real prices from April to July 2026 — a photo of the market, not today's.` Credit Yahoo Finance beside the TradingView library credit. **Do not** grey out `.mk-dot` — `:1902` shows it encodes direction, not liveness.

### C3 · The footer says nothing about build state, and the disclaimer is written for adults
**P2 · S ·** `index.html:1458`
Six adult-register phrases in four sentences ("loss of capital", "do your own research") in the one block whose job is to reassure a parent — and no beta line at all.
Fix, prepend: `<b>ChartQuest is in beta.</b> Right now you can play World 1 and fight the first Guardian, the Gambler. The other worlds are being built — what beta players tell us decides which one comes next.` Then plain-language the rest: `Every trade inside the game uses pretend money — you can never lose real money by playing. We are not financial advisors, and nothing here is advice about your money. Buying and selling real things like crypto or shares is risky and people do lose money doing it. Always check things for yourself before you use real money.` Add a short version under the hero CTA and the mount button: `Pretend money only. You can never lose real money in ChartQuest.`

### C4 · One unguarded localStorage read can blank the entire page
**P1 · S ·** `index.html:1591, 2, 356`
`localStorage.getItem('cq_installed')` with no try/catch, called synchronously at `:1604`/`:1610`, inside the IIFE that runs before the reveal observer at `:1677` — while `:1645-1646` wrap identical calls in try/catch. A throw (storage blocked by policy/settings) leaves every `.reveal` at `opacity:0` forever: key art and nothing else.
Fix: wrap `:1591` in try/catch; add `<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>`. **Keep `class="js"` on line 2** — the only `<script>` is at `:1516`, end of body; removing it causes a full-page content flash on every load. (`:480` already exempts reduced-motion users.)

### C5 · The Trade pillar tells the player to guess
**P2 · S ·** `index.html:1327`
"Spot the clue. **Guess up or down.** It's play money, so a wrong call costs you nothing." — in the one panel that describes trading, on a page arguing "real skills, learned by doing" (`:1385`).
Fix: `<h3>Spot the clue</h3><p>The chart leaves you a hint about what happens next. You pick up or down and find out. It's pretend money, so a wrong answer costs nothing.</p>` (alt text at `:1325` handled in A2.)

### C6 · Six market chips imply six in-game markets
**P2 · S ·** `index.html:1281, 1287-1294`
Chips + "waiting for you inside ChartQuest" read as a menu; World 1 is one authored market.
Fix: `:1281` → `The charts couldn't load on this page. They still work inside the game.` Add after `:1294`: `The beta starts you on one chart. Read it, and the rest come free.`

### C7 · Landscape phones: the pinned hero stage overflows its shortened parent
**P2 · S ·** `index.html:669-670 vs 1075`
`.hero-cine-stage{height:100svh}` is never overridden, while `.hero-cine` is shortened in `@media (orientation:landscape) and (max-height:520px)` and keeps `overflow:visible` — a hard-edged strip of key art bleeds behind the bridge.
Fix: add `.hero-cine-stage{position:static;height:auto}` to the block at `:1072`, or simply restore `overflow:hidden` on `.hero-cine` there.

### C8 · Keyboard trust: the skip link sticks, the install dialog has no focus trap
**P2 · S ·** `index.html:1133, 1486, 1612-1636, 776`
Skip link has `onfocus` styling and **no `onblur`** — it stays pinned over the logo for the rest of the session; `#main` is not in the `scroll-margin-top` selector so it lands under the 66px sticky nav. `#installSheet` is `aria-modal="true"` but Tab walks straight out, and close restores focus to nothing — while the nav sheet at `:1560-1565` implements the pattern correctly.
Fix: `:focus-visible` class for the skip link (hook `:708`), add `main[id]` to `:776`, lift the nav sheet's trap into a shared helper and store/restore `document.activeElement` in `openSheet`/`closeSheet`.

### C9 · Below-fold images eager-loaded, competing with the LCP hero
**P2 · S ·** `index.html:1273, 1357, 1475, 1489`
`finn-boost.png` (62 KB) eager twice; PWA icons eager inside `display:none` modals — while every other below-fold image correctly carries `loading="lazy"` (`:1319-1331`).
Fix: add `loading="lazy" decoding="async"` to all four.

### C10 · The TradingView credit is a full-width off-site tap target under the market chips
**P2 · S ·** `index.html:988, 1059, 1295`
On touch it becomes a ~45px-tall, 100%-wide link to an external trading platform, directly under a wrapping row of 44px chips. Chip clicks also lock the showcase permanently (`:1984`).
Fix: `display:table;margin-inline:auto` so only the text is tappable; move the credit into the footer disclaimer block; restart auto-rotation after ~15 s idle instead of locking.

### C11 · play.html disables pinch-zoom and ignores the bottom safe area
**P2 · S ·** `play.html:5, 22, 37`
`user-scalable=no, maximum-scale=1` (index.html does not do this) on the one page with the smallest text; `--sab` is declared and never used, so in the installed PWA the home indicator overlaps the game canvas.
Fix: drop `maximum-scale=1, user-scalable=no` (the game canvas already has `touch-action:none`); set `.frame-wrap{bottom:var(--sab)}`.

**TOTAL C: 11×S ≈ 0.75 day**

---

## D. POST-BETA BACKLOG

| # | Finding | Sev | File:line | Effort |
|---|---|---|---|---|
| D1 | Security headers: `_headers` sits at repo root, outside `website/`, so nothing ships — and as written `X-Frame-Options: DENY` + `frame-ancestors 'none'` would break the site's own same-origin embed, and `font-src 'self'` would kill Google Fonts | P2 | `_headers:19, 24` | M |
| D2 | Google Fonts render-blocks both documents; discrete-weight syntax returns 7 static files; the stylesheet's own header at `:82` claims "self-contained, no CDNs" | P2 | `index.html:64`, `game.html:29` | M |
| D3 | 34 declarations at font-weight 800/850/900 that no loaded font file provides | P2 | `index.html:64` + 34 sites | S |
| D4 | H1 is the smallest, lightest display heading at **every** width (41px/500 vs five H2s at 72/72/56/56/56 at 700) — note `:642-643` documents this as deliberate art direction | P2 | `index.html:644, 890, 1350` | M |
| D5 | ~150 lines of dead CSS from five superseded passes, plus two JS handlers bound to `.modal` (zero exist) | P2 | `index.html:174-213, 231-288, 511-597, 818-832` | M |
| D6 | Live rules cancelled by later passes instead of edited — incl. `.markets` padding-top (`:888`) silently dead against `:1024` | P2 | `index.html:888, 216/562, 129/610` | M |
| D7 | Two incompatible section rhythms (130px vs 54px top padding) keyed off `.bridge` adjacency, not markup | P2 | `index.html:146, 1024` | S |
| D8 | Mono at 9.5–12px with 0.14–0.32em tracking used for prose microcopy; the "fewer mono labels" pass at `:600-613` was left half-done | P2 | `index.html:983, 988, 1027, 1033` | M |
| D9 | Heading sizes/colours set inline at four call sites; two kicker colours with no rule behind either | P2 | `index.html:1349, 1350, 1401` | S |
| D10 | `--radius` has one consumer (dead markup); `--glass`/`--blue`/`--gold-2` have zero; 17 hand-written radius values | P3 | `index.html:85-93` | S |
| D11 | 641–720px band gets the mobile hero and portrait mount with the desktop nav and **no sticky CTA** | P2 | `index.html:378 vs 652` | M |
| D12 | Market chips stay enabled and handler-less when the chart lib fails; no static `aria-pressed` | P2 | `index.html:1287-1292, 1744` | S |
| D13 | The always-on `.worldbg` FX layer is exempt from the `[data-fx]` offscreen pause and never reduced on mobile (~23 animating elements + two blend modes) | P2 | `index.html:1089, 2032` | S |
| D14 | SW cache-first with no revalidation — replace with stale-while-revalidate + a release check that fails the build if `CACHE` wasn't bumped | P1→D | `sw.js:66-75` | M |
| D15 | Launch chain: `play.html` render-blocks on `site.css` (25 KB) + `config.js` for a value identical to its own hardcoded fallback | P2 | `play.html:16-17, 102` | S |
| D16 | "The world's first trading RPG" — unbackable superlative in six places incl. `<title>` and meta description | P2 | `index.html:6, 7, 43, 54, 1210, 1447` | S |
| D17 | Nav label "The world" points at a section headed "What is ChartQuest?"; three vague links compete with the one CTA | P2 | `index.html:1146-1148` | S |
| D18 | Roadmap 03–05 use internal jargon: "the full descent", "factions & setups" | P2 | `index.html:1420-1421` | S |
| D19 | `"blocking the embed"` in the game-failure message — developer vocabulary at the highest-frustration moment | P2 | `index.html:2004` | S |
| D20 | Market tooltip asserts an unmeasured number and breaks its own parallel structure | P2 | `index.html:1735` | S |
| D21 | Welcome toast (z95) animates over the still-closing install sheet (z90) | P3 | `index.html:1671` | S |
| D22 | Sticky CTA appears while the hero's own Play button is still on screen | P3 | `index.html:1691` | S |
| D23 | Footer headings jump h2 → h5 | P3 | `index.html:1450, 1454` | S |

**TOTAL D: 14×S + 9×M ≈ 3–4 days**

---

## THE BETA PORTAL NARRATIVE

The page currently tells a launch story. A beta portal tells a **recruitment** story: *here is exactly what exists, you are early, your answer builds the next bit.* Three edits carry it — an honest promise at the top, one door, and one ask at the end.

**Proposed page order** (moves are cheap; every section already exists):

| # | Section | Job | Change |
|---|---|---|---|
| 1 | Nav — wordmark + **BETA** pill + `Play the Beta` | Build state, always visible | new pill (B8) |
| 2 | Hero — beta eyebrow, promise, ONE button | Set the true expectation, then launch | copy (A8) |
| 3 | **What's open today** *(new, ~6 lines)* | The honest scope card, above the fold-ish | new, S |
| 4 | `#play` — the door, auto-mounting | The single funnel | B5 |
| 5 | **Post-play ask** *(new, gated on `.loaded`)* | Survey at peak goodwill | B2 |
| 6 | `#markets` → `#what` → `#roadmap` | Why it works · what it is · what's next | A1/A2/C6 |
| 7 | `#why` (courses) → Finn | Supporting argument | unchanged |
| 8 | Footer — beta line, Privacy · Terms, feedback link | Careful readers = survey answerers | A3/A5/C3 |

**Copy, at a 10-year-old reading level:**

Hero eyebrow — `Early beta · World 1 is open`
Hero headline — `THE CHART IS THE WORLD.` *(unchanged)*
Hero sub — `Charts turn into a world you can run through. World 1 and the first Guardian are ready to play today — the rest gets built with your help.`
Hero trust — `Free · No download · No sign-up`
Under the button — `You're one of the first people ever to play this.`

**"What's open today" card (new, section 3):**
> **You're early. Here's exactly what that means.**
> Right now you can play **World 1** and fight the first Guardian — the Gambler. That's it. That's the whole game so far.
> Ten more worlds are drawn, planned and waiting to be built. Which one we build first depends on what beta players tell us.
> **So play it, then tell us what you thought. That's the deal.**

**Roadmap heading line (`index.html:1415`):**
> `Right now you can play the first world and fight the first Guardian. Everything after that is being built — and what you tell us decides what gets built first.`

**Post-play ask (section 5):**
> *You made it back*
> **Now help us build World 2.**
> You just played the very first part of ChartQuest. Tell us what was fun and what was confusing — 3 questions, about a minute.
> `[ Answer 3 questions → ]`
> *Didn't finish? Even better — tell us where you stopped. That's the most useful answer of all.*

**Footer beta line (before the disclaimer):**
> **ChartQuest is in beta.** Right now you can play World 1 and fight the first Guardian, the Gambler. The other worlds are being built — what beta players tell us decides which one comes next.

**Friction removed, in order:** the hero's second button, the mount's full-screen escape hatch (`:1363`), the sticky bar during play, the "Install app" option before anyone has played, and two of the three vague nav links. One promise, one door, one ask.

---

## TOTAL EFFORT

| Group | Findings | S | M | L | Estimate |
|---|---|---|---|---|---|
| **A — Ship-blockers** | 9 | 7 | 2 | 0 | **~1 day** |
| **B — Beta-portal conversion** | 10 | 3 | 7 | 0 | **~1.5–2 days** |
| **C — Trust & polish** | 11 | 11 | 0 | 0 | **~0.75 day** |
| **D — Post-beta backlog** | 23 | 14 | 9 | 0 | ~3–4 days |
| **Beta-ready (A+B+C)** | **30** | **21** | **9** | **0** | **~3.5 days** |

**Hard dependency:** A3, B2, B3 and B4 all need a live survey URL. Build the survey (B1) first, or every one of them ships a second `href="#"` dead link identical to the one this audit is fixing.