# ChartQuest — Golden Path Review

**Product review — the first 15 minutes, screen by screen.**
**Date:** 2026-07-15 · **Beta in:** ~4 days (10 friends) · **Branch:** `site/rc1` · **Build:** ~266
**Scope:** PRODUCT review only — no code, no gameplay, no architecture changes. The ratified systems (Visual Market Constitution, Curriculum Engine, Pattern OS, Finn animation/expression system, replay/notebook) are assumed correct; every recommendation USES them, none redesign them.
**Target player:** never traded, never seen a chart, never heard the word "candlestick," may not know what "price" means. May be an excellent gamer or a total non-gamer. Treat as an intelligent 10-year-old — never dumbed down, just de-complicated.
**Builds on, does not duplicate:** the four 2026-07-10 beta audits (Onboarding, Retention, Top-10, Growth) plus the 07-07 experience docs. Their three headlines — **the traversal leak**, **the trade-feel fulcrum**, **the cold-open hard-gate** — are carried forward as established. Where this build has since *closed* one of their defects, it is marked FIXED so the 4-day window is not re-spent on solved problems.

---

## Executive Summary — the answer to the Final Question, first

> **The Final Question:** *What changes most increase the chance that 10 beginners finish Boss One, understand trading, get emotionally invested, tell a friend, and pay to continue?*

**The one-sentence answer:** ChartQuest is a beautifully-architected game that is chronically under-selling its own best moments — the architecture is ratified and right, and **almost every real leak is felt-experience or dead-time, not design.** The authored drama already exists in the file (the trade dip, Finn's computed worry, the first loss, the villain, the quest goal); it is *computed and then discarded* — thrown at the player as text, hidden behind SKIP, or left un-juiced — instead of being felt in the body. In a 4-day window that is a gift: the highest-leverage work is small in code and enormous in delight, because it is mostly "point the juice you already have at the moment that deserves it."

**Three findings decide the beta:**

1. **The funnel leaks BEFORE the trade, not at the boss.** Boss One is unloseable by design, so the question is not "can they beat it?" but "how many *reach* it?" — and the gate is the pre-trade traversal wall (floaty jumps, no forward compass, a near-empty "chart is the world") plus the cold-open black-screen risk. Honest estimate today: **~5–7 of 10 finish Boss One**, with every dropout lost upstream. Fix the pre-trade P0s and this goes to **8–9 of 10** — and they finish *smiling* instead of *relieved*.

2. **The party is quieter than the funeral.** Verified in source: a routine **loss shakes the screen** (`shakeT=0.5`, chart-quest.html:12000) while the **first win never shakes at all** (`celebrate()`, :4370, sets no `shakeT`). The single most-earned moment of the hour gets 12 particles and one sting. This is the cardinal game-feel sin and the single best ROI in the build — a one-line fix.

3. **The trade is fair but not FELT — and it has no witness.** The authored dip→hold→recover→run arc lives in `tradeDrivenCandle` (:2946) and is delivered as text `beat()` captions; meanwhile `shellEmotion='worried'` is computed every frame on the dip (:12824) and thrown away, because the official sprite face is baked into `run.png`. So the companion the player just bonded with stands calmly smiling while his own money nearly stops out. The founder's own verdict — "you just click buttons, no meaning" — is still true, and it is an emotional-staging problem, not a mechanics problem.

**The 4-day pre-beta punch-list (ranked by impact-per-effort — full table in §8):**

| # | Change | P | Effort | Why it's on the list |
|---|--------|---|--------|----------------------|
| 1 | **First-win juice pass** — add `shakeT` + shell-rain + giant Finn cheer to `celebrate()` | P0 | S | Best ROI in the build; the peak dopamine that drives "one more" is currently a golf-clap |
| 2 | **Traversal forward-pull** — breadcrumb + reward-to-the-right + arc-honest first-jump spacing | P0 | S–M | Closes the #1 pre-trade funnel leak; the trade can't sell if nobody reaches it |
| 3 | **Cold-open safety net** — guarantee an instant painted villain frame + fast auto-skip to the goal card | P0 | S–M | Turns the worst-case "30s of black" first impression into "a still villain + a clear quest" |
| 4 | **Dramatise the trade dip** — hang juice on the existing `beat()` hooks + connect `shellEmotion` to Finn | P0 | S–M | The felt-stakes fulcrum for WTP and addiction; machinery already computed |
| 5 | **Retrieval tap on reflection** — "Why did this win? [I waited] [I got lucky]" before the trophy | P1 | S | Highest-leverage learning change; makes "I know why I won" self-produced, not read |
| 6 | **Goal card on the happy path** — surface `#introSkipCard` at cinematic end, not only on SKIP | P1 | S | The clearest statement of the game's promise is currently shown only to players who quit |
| 7 | **Make the offer visible** — one honest "Play the first 3 Guardians free" line on the site + at Continue | P1 | S | Willingness-to-pay cannot form against an invisible offer (the still-live Growth headline) |
| 8 | **Share card at the two peaks** — First Win + "THE GAMBLER FALLS," Finn + villain + the player's own stat | P1 | M | The only zero-cost acquisition channel; the concept is inherently viral and has no vehicle |

Everything above reuses ratified systems. Nothing invents architecture. Items 1–4 are the launch-blocker class; 5–8 are the near-free multipliers. The decisive validation is **non-code**: sit beside each of the 10 friends and watch their face on the dip and on the first loss — that observation ×10 tells the founder whether the felt-stakes staging is the whole roadmap or already good enough.

---

## The Emotional Curve

The Golden Path is engineered to walk a beginner through a specific sequence of feelings. Here is the intended curve, the beat that is meant to deliver each emotion, and where today's build breaks it.

| Golden-Path beat | Intended emotion | Delivered today? | Where it breaks |
|---|---|---|---|
| Website → Hero | **Wonder** ("a turtle inside a chart?") | ✅ Mostly | Strong; but the transfer promise sits one scroll below the CTA the impatient tap first |
| Markets / Cold-open reveal | **Curiosity** ("what is this world?") | ⚠️ Fragile | ~30s of zero agency; can degrade to a black screen; goal hidden behind SKIP |
| First Candle Lesson | **Discovery** ("oh — green means the buyers won!") | ✅ The one reliable delight | Told-then-shown where the north star is show-then-deduce |
| Momentum + explore | **Understanding** ("a big candle keeps going") | ✅ Concept lands | The *world* around it is empty; the "aha" happens in a sparse corridor |
| First Trade setup | **Confidence** ("I can read this") | ⚠️ Flat | Three labels read to me like a EULA; no visible "why I'm entering" |
| The dip | **Nervousness** ("oh no — hold…") | ❌ Narrated, not felt | The scare is a text caption; Finn's computed worry is discarded |
| Waiting out the trade | **Uncertainty** ("will it come back?") | ❌ Muted | No held-breath beat; music/P&L don't react |
| Target hit | **Victory** ("YES!") | ⚠️ Under-juiced | The win shakes the screen *less* than the loss |
| Why-you-won + Boss | **Pride** ("I earned the title CANDLE READER") | ✅ At the boss / ⚠️ at the trade | Boss victory is well-juiced and is the model the first-win should copy; the pride card then gets buried by the Journal cinematic |
| Continue | **Momentum** ("what's next — the fake-out guy?") | ⚠️ Partial | No share artifact, no next-session pull; momentum bleeds out in the first dead zone |

**The pattern:** the curve is intact from *wonder → discovery → understanding* — the front half, owned by the website and the candle lesson, works. It **breaks at nervousness and stays broken through victory** — the entire emotional spine of trading (dip → uncertainty → relief → pride) is authored in the data and muted in delivery. That five-beat stretch is the fulcrum of the product, and it is exactly the stretch a felt-stakes staging pass repairs. The good news: the curve does not need to be redesigned, only *amplified* at the beats it already contains.

---

## The Golden Path, screen by screen

*The 19 Golden-Path steps are reviewed below in seven segments. Each screen carries: Current State · Problems · Player Psychology (See/Do/Think/Feel/Learn) · Educational Analysis · Recommended Improvements · Priority · Expected Impact · Difficulty · and the Business/Learning/Retention/Virality/Monetization read. Findings are grounded in the shipped `chart-quest.html` (build ~266) and `website/index.html` (RC1), not the design docs. Two structural facts reshape several segments and are called out where they land: (1) the clean 3-step goal card `#introSkipCard` is **SKIP-only** on the happy path (:16886); (2) `shellEmotion='worried'` is **computed and discarded** during the trade (:12824).*

---

### Segment A — Website → Hero → Site-to-Game Handoff

*Reviewed against `website/index.html` (RC1, 2059 lines), `website/play.html`, `website/assets/config.js`, and the seam into `game.html`/`chart-quest.html`. Several V5 defects the 07-10 Growth audit flagged are now FIXED in this build — marked explicitly so the founder does not re-spend the 4-day window on solved problems.*

**Scope note:** On the happy path the golden-path steps "Educational Onboarding" and "Market Introduction" are delivered first by the *website* (the Markets section) and then by the in-game cinematic. This segment owns the website + the seam; the in-game cinematic fragility is owned by Segment B and is only referenced here where it compounds a seam problem.

#### 1. Website (overall frame & funnel)

**Current State.** A dedicated marketing deploy, titled "ChartQuest — The World's First Trading RPG" (`website/index.html:6,43`). A clean single-scroll funnel: Hero → "The World Runs on Charts" (real markets) → "What is ChartQuest / Three ways to play" → an inline **Enter the Chart** game-mount → "Quests > courses" → "Meet Finn" → Roadmap → closing CTA, with animated bridge connectors (`1204,1278,1315`). The primary CTA "▶ Play Free" appears 5× (nav, hero, mid-page, sticky bar, closing), all → `play.html`. `prefers-reduced-motion` respected (8 refs); alt text present and descriptive throughout.

**Problems.**
- **The business promise is invisible.** No price, no "$25," no "play the first 3 Guardians free, then decide" anywhere (grep confirms zero matches). The Roadmap says "Open Beta · playable free" (`1395`) but a beginner cannot tell what is free, what is paid, or that there is a finish line worth paying for. This is the Growth-audit headline and it is **still live**.
- **No social proof of any kind** — no player count, testimonial, "as seen on," or beta quote. Flagged as the biggest trust gap for skeptical, crypto-adjacent paid traffic; still live.
- **834KB hero JPEG** (`assets/hero-key-art.jpg`, verified on disk) with `fetchpriority="high"` — an LCP risk on the cellular Meta traffic this launch targets. Still live.

**Player Psychology.** See a premium, confident games site. Do: scroll, tap Play Free. Think "this looks like a real game, not a course." Feel intrigued and safe (no sign-up). Learn: nothing is asked of me and it's free — but *nothing tells me why I'd ever pay*, so the monetization thought never forms.

**Educational Analysis.** The page's job is not to teach candles (correctly deferred to the in-game LessonChart) but to teach *why this game exists* and *that the skill is real and transferable*. It does the transfer job well (§3) and the "why a game beats a course" job well. It does **not** teach the reward loop — beat Guardians toward the Market Maker — as a concrete free-then-paid promise.

**Recommended Improvements.**
- Add one honest value-bridge line near the primary CTA and in the Roadmap: *"Play the first 3 Guardians free — no card, no sign-up."* Makes the free/paid line legible without a hard paywall and seeds willingness-to-pay. Copy only.
- Ship the hero image as WebP/AVIF at the same key art (the Visual Market Constitution governs in-game candles, not marketing art — free to change).
- Add one honest social-proof strip once beta data exists ("In open beta with our first explorers" is honest today; swap for a real count post-launch).

**Priority:** P1 · **Impact:** closes the two remaining Growth-audit trust/monetization gaps before paid traffic scales · **Difficulty:** S. *Business:* makes the funnel monetizable, not just playable. *Learning:* none. *Retention:* names a finish line worth returning to. *Virality:* social proof lowers share-hesitation. *Monetization:* the single biggest lever in this segment — WTP cannot form against an invisible offer.

#### 2. Hero Section

**Current State.** `<header class="hero-cine">` with static official key art (Finn facing the eleven Guardians on a rising chart, `1159`), eyebrow "The world's first trading RPG," h1 "THE CHART / IS THE **WORLD**," sub "Real market charts become a world you can explore. Finn teaches you to read them as you play," a single "▶ Play Free" button, trust line "Free · No download · No sign-up" (`1187-1193`). Atmospheric god-rays/embers/orbit particles (`1165-1183`).

**Problems.**
- **FIXED — do not re-audit:** the "Watch Trailer" defect (a button that scrolled to a live chart) is **gone**; the static key art now does the selling. Credit the team; move on.
- **The impatient beginner skips the education.** "Play Free" jumps straight to `play.html`, bypassing the Markets/transfer section (§3). The single most valuable "why this exists / this skill is real" framing sits *below* the primary CTA, so the exact person who taps the top button never sees it.
- "THE CHART IS THE WORLD" is evocative but abstract for cold paid traffic (Growth rated 7/10); the clearer *subhead* is visually secondary.

**Player Psychology.** See a cinematic hero and a turtle facing bosses. Do: tap Play Free (or scroll). Think "a turtle… inside a chart?" — curiosity high, comprehension medium. Feel adventure. Learn: this is a game about reading charts; nothing yet about *what a chart is for*.

**Recommended Improvements.**
- Fold one transfer word into the hero so it survives a CTA-skip: eyebrow → "…for stocks, crypto & gold," or sub → "…the same skill reads Bitcoin, Apple and Gold." One line; keeps the poster clean.
- Keep the single-CTA discipline (correct — `ui_canon` warns against stacking gates before first play).

**Priority:** P2 · **Impact:** the ~40% who tap the top CTA still absorb the transfer promise · **Difficulty:** S. *Business:* widens who "gets it" in 5s. *Learning:* plants transfer before the game. *Retention:* neutral. *Virality:* a shareable one-liner. *Monetization:* transfer = "this is worth money" seed.

#### 3. The Markets — "Learn one, read them all" (website's Educational Onboarding + Market Introduction)

**Current State.** Section "The World Runs on **Charts**" (`1212-1273`): a live chart stage with a market switcher — Bitcoin, Apple, Tesla, Gold, S&P 500, Ethereum (`1263-1268`) — plus copy "Millions of people are buying and selling right now. Every choice they make draws these charts" and the payoff "Same chart. Different market. **Learn to read one, and you can read them all.**" (`1217,1270`). Graceful fallback if the live charts don't load (`1256-1258`).

**Problems.**
- **This is the answer to the segment's core question and it's largely SOLVED** — a meaningful upgrade over the V5 the Growth audit reviewed. It teaches (a) what a market is, (b) why it matters, and (c) that the skill transfers across crypto, stocks and commodities. **Forex is the only asset class named in the brief missing from the chip rail.**
- It sits *after* the hero CTA, so its reach depends on scrolling (§2).
- "Why price *moves*" is stated only implicitly ("every choice they make draws these charts") — acceptable for a hook, correctly left for the in-game lesson.

**Player Psychology.** See familiar names (Apple, Gold, Bitcoin) as the same kind of chart. Do: tap between markets, watch Finn stand on real candles. Think "wait — Apple and Bitcoin are the *same puzzle*?" Feel the click of a big idea landing. Learn: **one skill unlocks every market** — the most persuasive, most shareable idea on the page.

**Recommended Improvements.**
- Add "Forex / EUR-USD" (or "Currencies") as a 7th chip to complete the asset-class set — one line, high payoff for the "reads any market" claim.
- Consider promoting "Learn one, read them all" to subtitle weight — it's the thesis and currently reads as a caption.

**Priority:** P2 · **Impact:** completes an already-strong transfer pitch · **Difficulty:** S. *Business:* the clearest "why buy." *Learning:* the strongest pre-game concept. *Virality:* "one skill, every market" is the meme.

#### 4. The Handoff — "Three Ways to Play" + inline "Enter the Chart" mount

**Current State.** "A turtle. A living chart. Three ways to play." — Explore / Trade / Battle pillars with real screenshots (`1286-1312`), each one beginner-worded sentence ("Every candle is solid ground"; "It's play money, so a wrong call costs you nothing"; "Beat it using the skill you just learned"). Then the seam centerpiece: **ENTER THE CHART**, "You already know more than you did a minute ago. That's enough to begin." (`1323-1342`) — a button that **mounts the real `play.html` in an iframe inline** (`1968-1987`), so the site literally *becomes* the game with no redirect, plus a 15s failure fallback and a "loaded" state.

**Problems.**
- **Two doors to the same game.** Hero/nav/sticky "Play Free" opens `play.html` full-page; the mid-page "Enter the Chart" opens the *same* `play.html` inline. Players who use different doors get different first frames, and a scroller may not realize they are one game.
- The Explore/Trade/Battle pillars promise **Guardians and exploration first**; the in-game happy path opens on the **Market Maker villain cinematic**, then movement. The promise and delivery are both good but slightly mis-ordered at the seam (villain before the heroes/skills the site advertised).

**Player Psychology.** See three crisp verbs and a glowing door with Finn. Do: press Enter the Chart. Think "the site turned into the game — no waiting room." Feel momentum and a little awe (the "that's enough to begin" line is a confidence gift). Learn: the loop is Explore → Trade → Battle, three things, not forty.

**Recommended Improvements.**
- Restate the quest spine at the seam so the site promise and the in-game goal card connect. The site advertises "11 Guardians" (`1395`) and a "Market Maker"; the game's cleanest statement of that spine — the `#introSkipCard` card — is **skip-only on the happy path** (verified `chart-quest.html:16886`). Surfacing that goal on the happy path (founder decision — flagged, not a change) would make the website→game promise continuous. **This is the single most important seam-continuity note in the segment.**
- Pick one primary door metaphor: keep the inline "Enter the Chart" as the hero-of-the-page moment and let "Play Free" buttons read as "the same door, from anywhere."

**Priority:** P1 · **Impact:** the site's advertised quest survives the crossing instead of being dropped at the seam · **Difficulty:** S on the website (copy); the goal-card decision is M and founder-gated. *Retention:* a named finish line is what people come back for. *Monetization:* the goal *is* the thing worth paying to finish.

#### 5. Entering The Game (play.html loader → auth → first-time branch)

**Current State.** `play.html` forwards the full query string into the game iframe (so `?fresh=1` / `?guest` reach the game — a real fix, `104-108`) and shows a branded loader "Diving into the Blockchain Ocean… Loading live charts & waking up Finn 🐢" with a lazy progress bar, a 5s "open in a new tab" escape, and a 9s hard hide (`74-81,109-112`). It hands off to `game.html`, whose `resolveAuth()` shows Play-as-Guest and, for a first-timer, launches the Market Maker cinematic (`chart-quest.html:1874,1915-1917`).

**Problems.**
- **Stacked waits before agency.** On a slow connection the beginner meets *two* loaders back-to-back: the `play.html` "Blockchain Ocean" loader (up to 9s), then the ~30s time-gated cinematic that can degrade to near-black if the 10MB clip stalls and `mm-poster.jpg` fails (the cold-open fragility, still live). Neither is broken alone; together they can be ~40s of near-passive screen before the first tap. The seam *amplifies* the cold-open risk Segment B owns.
- The `play.html` loader does not preload/prewarm the cinematic poster, so the game-side "instant static hero" net has no help from the loader stage.

**Player Psychology.** See a tasteful loading screen with Finn's name-check. Do: wait. Think "okay, a real game." Feel mild anticipation — but if the wait chains into a black cinematic, anticipation curdles into "is it broken?"

**Recommended Improvements.**
- Have `play.html` warm the cinematic poster (`website/mm-poster.jpg` exists on disk) during its own load window, so the game-side cold open has an instant painted frame the moment the iframe mounts — turning two stacked waits into one continuous, always-painted transition. (No game-code change; a preload hint on the loader page.)
- Keep the 5s/9s escapes — the right resilience instinct.

**Priority:** P1 (compounds the P0-class cold-open finding) · **Impact:** removes the "two waits then black" worst case for slow-connection friends · **Difficulty:** S. *Retention:* directly prevents threshold bounce. *Virality:* a smooth entry is screenshot-safe; a black screen is not.

**Seam scorecard (build 266).**

| Question the segment must answer | Verdict |
|---|---|
| Does the beginner learn what a market is? | **Yes** — Markets section, implicit but clear (§3) |
| …why price moves? | **Partial** — implied; explicit teaching correctly deferred in-game |
| …why this game exists? | **Yes** — "Quests > courses" + the fantasy; the *free-then-paid* promise is missing (§1) |
| …that the skill transfers to stocks/crypto/gold/forex? | **Yes for stocks/crypto/gold; forex missing** from the chip rail (§3) |
| Without overwhelming? | **Yes** — one CTA, one loop, teaching deferred |
| Does the player understand the world before entering? | **Mostly** — but the quest spine is dropped at the seam (§4) and the top-CTA path skips the transfer lesson (§2) |

---

### Segment B — The Cold Open (Educational Onboarding → Market Introduction → Entering The Game → Market Maker Intro)

*The first 60 seconds after "Play as Guest." They must convert a stranger who has never seen a chart from "what is this?" into "I need to escape this world." Arc: **wonder → curiosity → resolve**. Nothing here teaches trading yet — that is correctly deferred to the LessonChart engine (`openIntroLesson:19462`). This segment's only jobs: (1) don't strand the player on a black screen, (2) make them feel the stakes and the goal, (3) make the Market Maker a villain worth beating. Everything here is a **framing/safety** problem, not a teaching one.*

**A structural fact that reshapes this whole segment:** two of the "onboarding screens" `ui_canon` promises are dormant on the happy path. The Candle Academy greeting is force-disabled when the cinematic runs (`candleAcademy.active=false; // cinematic's title card replaces the greeting`, :1916; `total=1` so the rich `card===1` "WHAT IS A CANDLE?" teaching at :15606 never renders). And the clean 3-step goal card (`#introSkipCard`) is **only** shown to players who tap SKIP (`showSkipCard:16886`) — happy-path players get the goal only as 6 timed cinematic beats (`MM_LINES:16734`; `steps=[1.0,6.2,11.4,16.6,21.8,27.0]:17101`). This is really a review of **one cinematic doing four jobs**, with two designed-in fallbacks most players never see. That concentration is the risk and the opportunity.

#### Screen 1 — Educational Onboarding (the greeting that isn't there)

**Current State.** On the happy path there is *no* dedicated pre-game educational screen. Candle Academy's multi-card teaching is dormant (`total=1`, `active` forced `false` when the cinematic runs). Candle teaching is deferred to the in-run LessonChart lesson. This is deliberate, not a bug — the cinematic's title card replaces the greeting.

**Problems.**
- The player enters the cinematic with **zero orientation** — no "here is Finn, here is what a candle is." They meet a villain before they meet their guide. Wonder is possible, but so is confusion ("what am I looking at?").
- The dormant Academy cards are **orphaned content that duplicates the LessonChart lesson** — a maintenance smell (a future editor could revive the wrong path). No regression risk.
- There is **no warm-Finn beat before the menace.** Finn is the strongest emotional hook and meme vector, and he is absent from the most important 30 seconds of the game.

**Player Psychology.** See: nothing → straight into a dark villain cinematic. Do: nothing (passive). Think: "Where's the game? Who's talking to me?" Feel: intended wonder, risk of disorientation. Learn: nothing yet — but the *absence of Finn* means no trust is established before the threat.

**Educational Analysis.** No concept taught here (correct — verbs/stakes before vocabulary). The gap is **emotional onboarding**: the player should meet Finn (safety) *before* the Market Maker (threat), so the villain lands as "a thing Finn and I will beat together."

**Recommended Improvements.**
- **Do not revive the Academy cards.** Confirm to the founder they are intentional legacy; LessonChart owns candle teaching. Review confirmation, not a build.
- **Put Finn in the cinematic's first beat** using the existing expression system: before the Market Maker speaks, one warm Finn beat (a look-to-camera / determined pose from `FINN_EXPRESSION_LIBRARY`) so the player's guide is established as the point-of-view character *first*. Uses cinematic timing that already exists; adds one authored pose, not a system.

**Priority:** P2 · **Impact:** modest lift in "I have a companion" attachment; reduces cold-open disorientation for non-gamers · **Difficulty:** S. *Retention:* Finn-first builds the attachment that drives "one more." *Virality:* Finn on screen sooner = earlier screenshot bait.

#### Screen 2 — Market Introduction (the goal, delivered as 6 timed beats)

**Current State.** The premise is the cinematic's narration: six `MM_LINES` (:16734) establish trapped-in-the-Blockchain, 10 Guardians, the Market Maker, "Stop guessing. Start learning.", "Become a TRADER." The explicit 3-step quest card — `#introSkipCard` "ESCAPE THE MARKET / Learn to Trade · Defeat the 10 Guardians · Beat the Market Maker" — renders **only** as the SKIP fallback (`showSkipCard:16886`).

**Problems.**
- **The clearest statement of the game's promise is shown only to players who quit the intro.** Happy-path players must *assemble* the goal from 6 timed lines flying past over ~30s — which needs reading, retention and attention during a passive cinematic. A beginner may catch the vibe ("escape, villain, trade") but not the **structure** ("3 free bosses, then the finale") that the spine gives.
- The quest spine is cited across audits as the game's *best motivational asset*. Hiding it behind SKIP wastes the strongest artifact in the product.
- Jargon watch: "Blockchain," "Market Maker" are low-severity comprehension risks — and in a timed cinematic they cannot be re-read, compounding the problem.

**Player Psychology.** See: 6 lines of villain dialogue over a dark video. Do: nothing until the ENTER portal (t>29.5). Think: "So I'm… trapped? I have to beat 10 things? And a boss?" — assembled, not stated. Feel: intended resolve; risk of "I don't fully know what I'm signing up for." Learn: the *goal* (implicitly) — the one thing the segment must land, delivered in the least legible way.

**Educational Analysis.** The goal is "tested" the instant the player must decide to continue — so it should be maximally clear at this moment. Obvious-by-looking: **no** on the happy path (prose, not structure). The SKIP card *is* obvious-by-looking (3 icons, 3 steps) — which is exactly why it should be on-path.

**Recommended Improvements.**
- **Surface to the founder as a decision (the headline of this segment):** *Should the `#introSkipCard` goal card be on the happy path?* Recommendation: **yes** — show the 3-step spine as a brief, legible beat *at the end of the cinematic* (as the ENTER portal appears). The card already exists (`showSkipCard`); this is a placement/trigger decision, not new UI. **A founder call — surfacing only, per the review constraint.**
- Keep the 6 beats for *atmosphere*; add the card for *clarity*. Wonder from the video, structure from the card.
- Optionally reinforce the goal at the existing `teach('goal')` recap that already fires at `introComplete()` (:16174) so the spine bookends the intro.

**Priority:** P1 (highest-leverage framing fix in the segment, near-free because the asset exists — founder-gated because it changes the happy path) · **Impact:** higher intro-completion and stronger "I know what I'm playing for"; directly supports the Growth finding that the "3 free bosses → Boss 3" quest is invisible · **Difficulty:** S. *Retention:* a picturable finish line is the strongest pull to continue. *Monetization:* the quest spine *is* the value bridge to the $25 ask; players who never saw it can't be sold the finale.

#### Screen 3 — Entering The Game (auth → who sees the cinematic)

**Current State.** Auth screen with Play-as-Guest. `resolveAuth()` branches (:1874,1915-1917): a first-time player (no `cq_played`) launches `IntroCinematic` and disables the Candle Academy greeting; `?guest`/`?dev`/returning players skip straight in. Returning guest is no longer re-walled (build 266); the guest button is now honest. Deferred auth is a confirmed strength.

**Problems.**
- This screen is in good shape — a genuine strength.
- The **branch logic** is why Screens 1/2/4 behave as they do: `cq_played` gating means the cinematic (and its risks) only ever hits *first-time* players — i.e., **the exact 10 beta friends whose first impression decides everything.** The fragile path is the one every friend takes exactly once. That raises the stakes on Screen 4's safety net.
- Verify pre-launch: each Golden-Path quit-point emits telemetry (page_load fires pre-auth as of build 266; confirm `reached_first_trade`/`completed_first_trade`/`beat_guardian_1`). Re-verify `ALLOWED_ORIGINS` post-deploy (the Cloudflare move previously 403'd all telemetry).

**Player Psychology.** See: a clean auth screen with an honest "Play as Guest." Do: tap it (one low-friction decision). Think: "Good, I don't have to sign up." Feel: relief / readiness. Learn: nothing (correct).

**Recommended Improvements.**
- **Keep as-is.** The only actions are verification: (1) confirm telemetry quit-points emit on `site/rc1` before shipping to friends; (2) confirm `?fresh=1` beta links route first-timers into the cinematic so friends experience the real cold open.
- Because *only* first-timers hit the cinematic, treat Screen 4's safety net as effectively mandatory for the beta.

**Priority:** P2 (verification, not build) · **Impact:** ensures the beta produces measurable funnel data; prevents a silent "shipped and learned nothing" · **Difficulty:** S. *Retention:* deferred auth is why friction is near-zero at entry — protect it. *Monetization:* auth-at-pride (post-Boss-1) is the conversion instinct that later carries the $25 ask — do not disturb.

#### Screen 4 — Market Maker Intro (the cinematic — the segment's make-or-break)

**Current State.** `#mmTeaser` plays `Market-maker-cinematic.mp4` (32s, ~10MB, lazy-loaded on first play) as a full-screen backdrop with `mm-poster.jpg` as a CSS `background` fallback (:827). Six dialogue beats fire on a **fixed timer** independent of video paint (:17101); NAME reveal + audio impact on beat 5; gold ENTER portal at t>29.5; tap-to-descend; auto-descend at t>36 (`mmDescend→finish` drops Finn onto candle #1, :16774). SKIP shows the goal card. Build 262 added the poster preload + static background. This is the **most memorable element in the game** and frames the Market Maker as the looming finale villain — a confirmed strength.

**Problems.**
- **The stranded-on-black risk is softened but not eliminated (still live build 266).** The timer runs regardless of video load, and the poster covers the black-screen bounce — but if the 10MB clip stalls *and* `mm-poster.jpg` also fails to paint (CSS `background-image` on a cold cache, no `<img>` preload guarantee), the player watches ~30s of near-black, non-interactive screen with only SKIP. For a beta friend on cellular, this is a first-impression coin-flip. The mitigation is "a poster if it loads," not "a guaranteed instant hero frame."
- **~30s of zero agency at the emotional peak.** The reveal is passive; ENTER doesn't appear until t>29.5. Fine for a non-gamer (a movie); for the "excellent gamer" friend it reads as "why can't I do anything?" The auto-descend at t>36 is a good anti-softlock backstop, but the interactive payoff is back-loaded.
- **No fast auto-skip on an unpainted video.** If the clip hasn't painted a frame by ~2-3s, there is no logic to bail early to the SKIP goal card — the player rides the full timer against a static/black frame.
- Jargon ("Blockchain," "Market Maker") lands in beats the player cannot re-read.

**Player Psychology.** See: a dark, cinematic villain looming over a market world; a name reveal with an audio hit; a gold portal. Do: wait ~30s, then tap ENTER (or SKIP). Think: "That's the boss. I have to beat *that*." — exactly right *when the video plays*; if it's black: "Is it broken?" Feel: intended **menace → resolve** — the single biggest variable is *did the video paint*. Learn: the villain and the stakes (implicitly).

**Educational Analysis.** The *menace* is obvious when the video plays; **nothing is obvious when it doesn't** — which is why the fallback is a teaching-integrity issue, not just polish. If the cold open degrades, the player never receives the goal *or* the emotion, and every downstream lesson lands on someone who doesn't know why they're here.

**Recommended Improvements** (all use existing assets/systems; none redesign the cinematic).
- **P0 — Guarantee an instant static hero frame.** Preload `mm-poster.jpg` as an actual image and gate the beat timer's start on poster-paint (or a hard 300ms cap), so the worst case is a still frame of the villain with dialogue over it — never black. Closes the last gap in the Headline-#3 mitigation and is the single most important safety action in the segment. (Behavior recommendation — founder/eng to implement.)
- **P0 — Fast auto-skip on an unpainted video.** If no video frame has painted by ~2-3s, auto-route to the SKIP goal card (`showSkipCard`, which already exists) so the player gets the *legible* 3-step promise. Turns "30s of black" into "immediately, here's your quest." Reuses existing card; no new UI.
- **P1 — Bring one interactive/anticipatory beat forward.** Surface ENTER slightly earlier or add a "hold to charge the portal" micro-affordance so the gamer-type isn't fully passive for 30s. Keep it optional.
- **P1 — Pair the villain reveal with the goal card** (ties to Screen 2): as the ENTER portal appears, show the 3-step spine so *menace* and *mission* land together. Founder-gated.
- Keep everything that works: the timed beats independent of video, the NAME reveal + audio hit on beat 5, the auto-descend backstop, the double-play guard.

**Priority:** P0 (the safety net + fast-skip are the top launch-blocker-class items in this segment; villain framing itself is a strength to preserve) · **Impact:** converts the worst-case first impression from "looks broken / bounce" into "still frame of a villain + clear quest"; protects the *entire* downstream funnel · **Difficulty:** S–M. *Business:* a black cold-open is an unrecoverable first impression at the exact moment 10 evangelists form their opinion. *Monetization:* the Market Maker *is* the paid finale; a broken reveal deflates the value bridge before it's built.

**Segment synthesis.** The cold open is **structurally sound and emotionally strong when it works.** All three risks are **framing/safety**, not teaching, and all three fixes reuse existing assets: (1) **Safety (P0)** — instant painted hero frame + fast auto-skip; (2) **Legibility (P1, founder-gated)** — put the goal card on the happy path; (3) **Attachment (P2)** — a Finn-first beat. The one item that must go to the founder as a *decision* is whether the goal card belongs on the happy path — right now the clearest statement of the game's promise is shown only to players who quit.

---

### Segment C — Movement Tutorial → First Candle Lesson → First Jump → First Chart

*The learn-to-play spine, entirely BEFORE the first trade — so every leak here is a leak the trade never gets to fix. Two of the three headline audit leaks (traversal wall, thin world) live in this stretch. The candle lesson in the middle is the crown jewel and is largely right; the traversal around it is the risk.*

Player mental model entering this segment: they have just watched (or skipped) a cinematic that said they are "trapped in the Blockchain," must "escape," and should "become a TRADER." They do not yet know what a candle is, what price is, or what "up" and "down" mean. They know one thing: *this turtle is me, and I need to go somewhere.*

#### Screen 1 — Movement Tutorial

**Current State.** `mmDescend()→finish()` drops Finn onto candle #1 and hands control to the chart-as-platformer (`introFlow.phase='run'`). A contextual coach (`coach.hints`, :3598-3604) teaches verbs one at a time, each surfaced the instant the terrain demands it: **JUMP** → **BOOST** → **TUCK**, with desktop keyboard glyphs and touch gesture glyphs, auto-hiding after a dwell; `coachAdvance` fires the next hint only when a NEW control is earned (:3608). Pinned top-left is the one static L1 lesson line: `🟩▲ GREEN = UP · 🟥▼ RED = DOWN · STRONG CLOSE = MOMENTUM` (`PERSIST_LESSON[1]`, :15005). Input feel is pro-grade: coyote 90ms, jump-buffer 120ms, haptics (build 247).

**Problems.**
- **HEADLINE LEAK #2 in its purest form.** Input feel is fixed; the *level-design* half is not. Boost is floaty and lofts Finn far above a 2–3-candle world with no strong "go right" gradient. A non-gamer has no compass — nothing pulls them rightward, so they hover, drift, or stand still. They stall BEFORE the trade, so the game's best asset never loads.
- **Three verbs is one more than the moment needs.** JUMP is essential; BOOST and TUCK are taught pre-emptively. A non-gamer juggling three novel inputs plus three novel color-rules (the pinned line) is at working-memory capacity before making a single meaningful decision.
- **The persistent lesson line teaches trading concepts during a moment when the player's whole attention is on not-falling.** Divided attention means the single most important literacy rule is delivered when nobody is reading it. It is re-taught properly in the LessonChart lesson — so here it is decoration competing for eyes.

**Player Psychology.** See: a cartoon turtle on a glowing green/red bar-chart landscape; a floating "TAP to JUMP"; a fixed line of colored text. Do: jump; experiment; try to figure out which way is "forward." Think: *"Okay, I'm the turtle. I jump. …where am I going? Is this it?"* Feel: intended playful discovery; at-risk mild aimlessness. Learn: the *verbs* — learned well, by doing (textbook verbs-before-stakes; keep).

**Educational Analysis.** Motor control taught by discovery, each verb gated to its terrain. The failure is not pedagogy — it is *legibility of the goal*: the player learns HOW to move before being given a reason to move. The world must answer "go RIGHT, toward something."

**Recommended Improvements** (level-design + prompt only — movement physics is protected system #4, do NOT touch).
1. Add a directional pull using existing systems: a Finn breadcrumb / "this way →" floater (`floaters.push`, the same call used for EXPLORE THE CHART at :16124) a few candles right, and/or a visible reward (a shell cluster or the first discovery portal) always spawned to the right. Content placement, not architecture.
2. Sequence verbs to terrain honestly: surface BOOST only when a tall candle blocks the path, TUCK only when a real gap requires it. A data/gating tune within the existing `coach` step machine.
3. Let Finn *point* — the expression system supports directional reactions. A one-beat "Finn looks/leans right" idle is the warmest compass and is on-canon.
4. Consider demoting the trading lesson line to appear AFTER the candle lesson so the movement moment isn't split between motor- and literacy-learning.

**Priority:** P0 (the pre-trade funnel leak the whole beta hinges on) · **Impact:** fewer stalls at `first_movement`; more players reach `reached_first_setup` — the difference between a beta that measures the trade and one that measures a floaty platformer · **Difficulty:** S–M (breadcrumb/reward = S; verb-gating = M; both level-design, zero physics change). *Business:* protects the entire downstream funnel. *Virality:* a confident, moving-forward turtle is the shareable image; a stuck one is not.

#### Screen 2 — First Candle Lesson (the crown jewel)

**Current State.** `beginGreenRedLearn()` (:16089) fires `openIntroLesson('candle')` → the animated LessonChart mounts full-screen (`#cqLesson`, "📈 Lesson · Candles", "GOT IT →"), then `openConceptPractice('greenred')` gives one Trader-View practice rep capped by a first prediction-bet win (`triggerPredictionBet`). It pre-marks `cq_mgseen_candle='1'` so the Gambler doesn't re-teach the identical card (:16095), and splices out the redundant "GREEN vs RED" portal. This is LEARN→PRACTICE→APPLY working exactly as ratified. Every audit lands this screen well; colorblind-safe ▲/▼ glyphs already present.

**Problems.**
- Minor: the concept the player most needs — *green = the buyers won, red = the sellers won; the body shows the fight, the wick shows how far it reached* — is delivered as an animated card the player watches, not something they deduce by LOOKING at the candle they are literally standing on. The north star ("obvious by LOOKING first") is only half-met: the lesson tells-then-shows, rather than shows-then-confirms.
- The full-screen overlay HARD-interrupts the world the player just started exploring. Right after an aimless traversal moment, the abrupt modal can feel like the platformer was the "real game" and this is a pop-quiz.

**Player Psychology.** See: a clean animated candle forming — open, high, low, close — with plain labels and the GREEN/RED rule. Do: watch, tap "GOT IT →," make one practice call and win it. Think: *"Oh — green means it went up. The tall part is how far it moved. I get this."* Feel: the first "I understand" click of the whole game — competence. Learn: what a candlestick IS (the #1 success metric). Taught before ever tested. Lands.

**Educational Analysis.** Fully taught-before-tested (the `cq_mgseen_candle` pre-mark proves the intent: never test the untaught, never double-teach). Obvious-by-looking is *partially* achieved — the animation makes it visual, but the player is a passive viewer of an idealized candle rather than an active reader of the candle under their feet. The Visual Market Constitution guarantees the practice candle and the lesson candle share one width formula — a real strength worth protecting.

**Recommended Improvements** (use LessonChart + Finn; no new architecture).
1. Open with a "look down" beat: before the abstract card, spotlight the actual candle Finn is standing on and let Finn ask "Green or red — who won here?" using the existing prediction/practice call, THEN reveal the rule. Show → deduce → confirm, instead of tell → show. Reuses `openConceptPractice`/`triggerPredictionBet` in the opposite order.
2. Name the drama, not just the mechanic: "GREEN = the buyers WON this round · RED = the sellers won." Ten-year-old framing, and it plants the who-won stakes the trade later cashes in.
3. Finn reacts to the first correct call with his biggest genuine delight — the attachment/meme vector fires exactly when competence is felt.

**Priority:** P1 (it already works; the improvement is upside on the segment's best moment) · **Impact:** converts a good "I watched a lesson" into a stronger "I figured it out" — the difference between comprehension and confidence · **Difficulty:** S (copy + reordering existing calls; Finn reaction exists). *Virality:* "I taught my kid what a candlestick is in 90 seconds" is the sharable claim; this screen is where it's true.

#### Screen 3 — First Jump

**Current State.** Not a scripted beat — the *payoff* of the JUMP prompt: the player hops between candle tops as the first real traversal. Landing has a render-only squash (build 247); gait is body-rock with static legs (`finn/run.png`, build 250). Keyboard input is 0ms and gravity (2300) makes the tap-jump the best-feeling verb; the open gap is the *arc*: the tall-narrow trajectory (~132px up / ~39px forward) makes jumps "hop in place" and barely clear one candle.

**Problems.**
- The single jump doesn't visibly *advance* the player. A jump gaining ~39px forward, over candles spaced wider than that, reads as "I jumped and landed where I started." For a beginner, the core verb feels like it doesn't do the one thing verbs must do: make progress. This quietly teaches "moving forward is hard here" — the opposite of the momentum this segment needs.
- Because the world is sparse (Screen 4's problem bleeds in), there is often nothing meaningful to jump TO. A jump with no target is a jump with no reward — the loop that should hook ("jump → land on something good → jump again") never closes.

**Player Psychology.** See: Finn arcs up with a satisfying squash-landing; the chart barely scrolls. Do: jump once, maybe twice, then hesitate — "did that do anything?" Think: *"Am I supposed to be getting somewhere? This feels like I'm stuck."* Feel: intended "I can leap across the market!"; at-risk mild frustration right after the candle lesson made them feel smart. Learn: implicitly, "forward progress is effortful" — a false and demotivating lesson.

**Educational Analysis.** No trading concept; the "lesson" is emotional — *this world rewards action.* Right now that lesson is at risk of being negative. The arc rebalance is a MEDIUM level/tuning item — but jump physics is a protected system, so the fix must come from level design (spacing, targets, assists), not physics constants.

**Recommended Improvements** (level-design + assist only; do NOT retune jump physics — protected #4).
1. Space the first few candles so ONE clean jump lands squarely on the next top with room to spare — author the terrain to the arc that exists.
2. Put a reward on the landing: a shell (or the next breadcrumb) sits on the candle the first jump is designed to reach, so the very first jump closes the jump→reward→jump loop.
3. For the first traversal only, consider a gentle forward-carry assist framed as level scripting (the first jump auto-completes to the next platform if the player under-inputs) — a Nintendo "the first pit is un-missable" affordance. If any assist would touch physics, DROP it and rely on spacing + reward.
4. Let Finn celebrate the first successful landing (small, warm).

**Priority:** P0 (the mechanical heart of the traversal leak — a first jump that feels like it does nothing is where the non-gamer decides "isn't for me") · **Impact:** turns the core verb from "does this work?" into "that felt great — again"; lifts `first_movement → reached_first_setup` · **Difficulty:** S–M (spacing + reward = S; scripted assist = M and must avoid physics). *Virality:* a turtle leaping candle-to-candle is the hero GIF; it must look like progress.

#### Screen 4 — First Chart

**Current State.** After the candle lesson, `armExplore('momentum')` (:16124) opens free exploration: the "💎 EXPLORE THE CHART — Grab shells & spin the wicks!" floater invites roaming, then (after a 30-candle gap) discovery + MOMENTUM lesson via `beginConceptLesson → openIntroLesson('momentum') → practice`, as deliberate breathing room before `beginIntroFirstTrade → armFirstGuidedTrade`. The pacing intent (one practice per lesson, exploration between concepts) is exactly right and a genuine strength. BUT the world is thin: 2–3 candles on a big screen, which reads low-budget and makes "go right" ambiguous.

**Problems.**
- **Thin density undercuts the entire pitch.** The website promises "THE CHART IS THE WORLD"; the first chart the player explores is a near-empty screen. This is the moment the fantasy pays off or deflates. Right now it under-delivers the core brand promise at the first test.
- "Explore the chart" with almost nothing to explore is a contradiction the beginner feels as aimlessness — compounding Screens 1 and 3. The 30-candle gap before the momentum portal is dead, low-agency space (~40% of early minutes are low-agency traversal in ~50–70s dead zones).
- The shells collected here have no meaning yet (nothing to spend/risk/lose), so "grab shells" is a reward with no referent. A beginner doesn't know if shells matter, so the incentive to explore is weak.

**Player Psychology.** See: a wide, mostly-empty dark chart with a few candles and some floating shells; an "EXPLORE" prompt. Do: wander right, pick up shells, look for "the game." Think: *"Is this the whole world? It feels kind of empty. What am I collecting these for?"* Feel: intended "a big market to roam"; at-risk "low-budget / unfinished / aimless" — the exact word beta friends use. Learn: MOMENTUM (a big candle keeps going) — correctly gated; the concept lands, the *setting* doesn't.

**Educational Analysis.** Momentum, taught-before-tested and correctly spaced (a pacing win). The pedagogy is sound; the *environmental storytelling* is the gap. Density is a Visual Market Constitution matter (authored "market breathing" / consolidation candles are visual-only inside the driven-candle engine — a placement/authoring task, not a new system). The learning is fine; the *credibility* of the learning space is thin.

**Recommended Improvements** (Constitution density authoring + existing floaters/portals; no new architecture).
1. Author "market breathing" density: fill the explore stretch with consolidation/background candles (visual-only, Constitution's one-width formula) so the chart looks like a living market, not a sparse test level. The single highest-leverage fix for the "looks unfinished" impression.
2. Give the 30-candle gap a micro-decision: a "spin the wick" beat or a single collectible-with-a-reason every few candles keeps meaningful-decisions-per-minute up without adding systems.
3. Make one shell matter before the trade: a tiny "your shells = what you've earned reading the market" tally so the collection has a referent. Keep it light.
4. Reinforce the forward compass from Screen 1: the momentum discovery portal should be visibly "ahead to the right."

**Priority:** P1 (a credibility + pacing leak, not a hard stall — but the moment "the chart is the world" is proven or broken, and it compounds the P0 traversal leaks) · **Impact:** turns "this looks empty/unfinished" into "this is a real, living market"; tightens the dead 30-candle runway · **Difficulty:** M (density authoring is content within an existing engine; micro-decision + shell meaning are S each). *Monetization:* directly defends the "THE CHART IS THE WORLD" promise the $25 rests on.

**Segment synthesis.** A **strong lesson wrapped in a weak world.** The First Candle Lesson is the game's best educational moment — protect it, and push it from "told then shown" to "shown then deduced." The traversal around it (Screens 1, 3, 4) is HEADLINE LEAK #2 in three forms: no forward compass, a first jump that feels like it doesn't advance, and a chart too empty to honor the promise. All three fixes are level-design, placement, copy, and Finn-reaction — zero physics changes, zero new architecture — and all sit BEFORE the trade. The P0s (forward pull on Screen 1, arc-honest spacing + landing reward on Screen 3) are the cheapest, highest-leverage moves in the entire Golden Path: they decide whether a non-gamer friend ever reaches the trade the rest of the game is built to sell.

---

### Segment D — First Trade → First Win → First Loss handling

***The fulcrum of the entire game.*** *Everything upstream exists to deliver a beginner here intact; everything downstream (retention, WTP, virality) is decided by how this FEELS. The architecture is ratified — authored outcomes (fairness fixed), learning-before-dopamine gating, single-source trade lines, the safely-authored First Loss with recovery, world-class process verdicts. Not one needs redesign. The open question is entirely FEEL.* **This segment's three deep-dives (First Trade, First Loss, First Boss) are pulled out and emphasized in the next major section; the screen-by-screen review is here.**

#### Screen 1 — First Trade (the setup, the guide, the "watch it play out")

**Current State.** `armFirstGuidedTrade` (:16140) hard-pauses the world after the momentum lesson and shows `showFirstTradeReady` (:16066): *"This is the moment… Your first REAL Trade… I'M READY →"*. On ready it forces a setup almost immediately (`setupCountdown=2`, :16155). `drawFirstTradeGuide` (:14941) walks 3 tap-through cards that point at the REAL entry/stop/target lines by matching color (single source of truth — the guide no longer draws its own lines, :14961): *YOUR ENTRY* (yellow), *STOP LOSS* (red), *TAKE PROFIT* (green), ending *"👆 TAP TO WATCH IT PLAY OUT"*. The outcome is authored to WIN (`authoredTutorialOutcome → trade._l1Outcome`, :11098/11195), and for Guardians 1–3 price is driven to the decided line so the result is SEEN and fair (`tradeDrivenCandle`, :3088). Machinery for a thrilling arc exists: live P&L, a dip→hold→recover→run shape, ~30-candle duration with a min-duration gate (`_finnTP`/`_mayEnd`, :11883; MIN_TRADE_CANDLES, build 253).

**Problems.**
- **Under-dramatised — the #1 open leak.** The founder's own verdict — "you just click buttons, no meaning, no payoff" — is on the FEELING axis. The three guide cards read as *labels being read to me*, not *stakes I am choosing to accept*. A beginner taps through ENTRY/STOP/TARGET like a EULA.
- **No felt "why am I entering?"** The guide names the three lines but never lands the CAUSAL sentence a 10-year-old needs: *"Green candles keep pushing up (that's momentum you just learned) → so we buy here → if we're wrong the stop saves us → if we're right the target pays us."* The lesson taught momentum; the trade doesn't visibly *use* it.
- **No held-breath beat.** "TAP TO WATCH IT PLAY OUT" then the candles resolve. There is no moment where the screen holds still, the music thins, and the player's heartbeat is the loudest thing. The dip exists in the data but isn't *staged* as a scare.
- **Zero stake.** Shells have no early meaning and the first trade risks nothing the player owns, so "loss" is abstract. Nervousness has nothing to bite on.

**Player Psychology.** See: the world freezes; a big card; three colored lines with tap-cards; then live candles and a P&L number. Do: tap through 3 cards → tap "watch it play out" → passively watch. Think: *"Okay… entry, stop, target. Now I tap. …Is that it? What did I actually decide?"* Feel (today): mild curiosity, then flatness — the intended nervousness → uncertainty → suspense is latent in the data but not staged. Feel (target): *"Green's been pushing — I think this goes up. …oh no it dipped — hold — HOLD — YES it's running."* Learn: the three parts of a trade — taught-before-tested ✓. But NOT yet "I entered *because* of what I read," which is the whole thesis.

**Educational Analysis.** Taught-before-tested: YES (the authored LEARN→PRACTICE→APPLY sequence). Obvious-by-looking: PARTLY — the colored lines are visible and labeled, but the *causal link* from the just-taught momentum to *this entry* is not drawn on screen. The player sees WHAT the lines are; they cannot yet see WHY this is a good trade. That gap is the "click buttons, no meaning" complaint expressed educationally.

**Recommended Improvements** (all use ratified systems — no new architecture).
1. **Reframe the 3 guide cards from labels to a CAUSE→CHOICE→SAFETY→REWARD sentence, in Finn's voice.** Card 1: *"Green keeps pushing up — that's momentum. So we jump IN here."* Card 2: *"If we read it wrong, THIS line taps us out cheap. That's our safety net."* Card 3: *"If we're right, price runs to HERE and pays us."* Same tap-through, same single-source lines — copy only. Converts reading into reasoning. **S.**
2. **Stage the dip as a scripted scare** using existing systems: at the authored dip, thin the music, punch the live P&L red for ~0.5s, fire a single Finn "nervous/bracing" expression with one line — *"Hold… this is the wobble."* The dip is already in `tradeDrivenCandle`; this is presentation on existing data (the Visual Market Constitution governs the candle rendering; nothing new is drawn). **M.**
3. **A one-tap "conviction" micro-decision before "watch it play out."** Not a real branch — a single "Finn, I think this goes UP 👆" confirm that echoes the momentum read back, so the player has *committed a belief* before the reveal. Keeps the authored win; it's a felt-agency prop, not a fork. **S–M.**

**Priority:** P0. This is the make-or-break beta variable. Trading is protected system #9 — copy/presentation changes are the safe surface; items 1–3 touch no outcome/geometry. **Impact:** turns the segment's central moment from a flat tap-through into a staged nervousness→relief arc — the single highest-leverage change for whether beta friends say "I want another." **Difficulty:** S–M. *Monetization:* WTP is a direct function of felt-stakes; nobody pays $25 to tap through labels.

#### Screen 2 — First Win (the payoff + why-you-won card)

**Current State.** On a winning close the P&L pops big/centered, a green flash (0.65), a canonical shell burst. The once-ever milestone is deliberately sequenced so the *"why you won"* lesson card lands FIRST, and the big `celebrate({title:'🏆 FIRST WIN!', sub:'You waited for the dip, then joined the green.'})` fires only on `dismissLesson` (:11980–11991), with a 7s safety timer so the milestone can never be lost (`cq_firstwin_v1`, :4363). Fanfare is a dedicated brighter cue. Learning-before-dopamine is a HARD sequence — a genuine, confirmed strength.

**Problems.**
- **Rewards INFORMATION, not FEELING.** There is a flash + shell burst + fanfare, but **no screen-shake** (verified: `celebrate()` never sets `shakeT`, while a loss fires `shakeT=0.5` at :12000 — the party is quieter than the funeral), no shells raining across the whole screen, no Finn's-biggest-cheer, no rising sound swell. It reads as "you got a trophy," not "YOU JUST DID THE THING."
- **The peak is a card, not a moment.** The trophy title + subline is correct copy but arrives as a UI panel. The dopamine hit that drives "one more" and the screenshot instinct needs to be a *screen-wide event*.
- **No shareable artifact at the exact peak.** This is the highest-emotion second of the first 15 minutes and nothing capturable exists.

**Player Psychology.** See: why-you-won card → dismiss → green flash, shells, "🏆 FIRST WIN!", fanfare. Do: read, dismiss, watch. Think: *"I won. And I get why — I waited for the dip."* (Comprehension lands — the strength.) Feel (today): satisfied, informed. Should be: *elated, proud, "I want to do that AGAIN right now."* Learn: the causal lesson, reinforced at the ideal teachable second, before the dopamine. Protect this ordering.

**Educational Analysis.** The reflection is gated BEFORE the reward — the single best learning-design decision in this segment. Obvious-by-looking: YES (the card names the exact behavior in plain words). Do NOT touch the sequencing; only amplify the celebration that follows it.

**Recommended Improvements** (amplify the existing `celebrate()` beat; keep the learning-first gate untouched).
1. **A real juice pass on the FIRST-WIN branch only** (already isolated at :11980): add screen-shake (`shakeT`), a full-screen shell rain (not just a burst), a rising sound swell into the existing fanfare, and Finn's biggest canonical cheer (reserve the once-ever §8 #97 full-body wiggle here). Reuses ratified systems; changes presentation, not logic. **M.**
2. **Mint the shareable card here:** at the celebration peak, compose a Finn-on-the-podium "MY FIRST WIN — +X" frame the player can save/share. Finn is the meme vector and isn't on any card yet; this is his debut. **M.**
3. **Immediate "again" hook:** end the celebration with Finn pointing right — *"Feel that? Let's find another."* Copy + one expression. **S.**

**Priority:** P0 for the juice pass; P1 for the shareable card. **Impact:** converts a correct-but-quiet reward into the emotional peak of the first 15 minutes. **Difficulty:** M. *Virality:* births the first shareable artifact at the moment of peak pride. *Monetization:* peak-joy is the collateral the later Capstone/paywall borrows against.

#### Screen 3 — Replay (immediate "watch it play out" + level-end intermission)

**Current State.** Two layers. Immediate: the trade plays out live and a per-trade review captures the full JOURNEY — setup lead-in + every post-entry candle, entry index marked so "YOU ENTERED" and "TARGET/STOP HIT" land on the exact candles (build 215). Level-end: `drawIntermission`/`imRender` summarizes shells, session P&L, win%, a mastery-gate bar, trade log, Knowledge Progress rows; the first-review gate auto-satisfies so it can never soft-lock. A confirmed strength — "why did it end?" is always visible.

**Problems.**
- **Reinforces whatever the live moment was.** If the live trade is flat (Screen 1's open issue), the replay faithfully re-shows a flat moment. It can't rescue an un-dramatised trade, but it CAN double a dramatised one.
- **The dip lesson isn't re-pointed in replay.** The JOURNEY shows the candles but doesn't re-annotate "HERE is where it scared you, and HERE is where patience paid" — the exact teachable beat, left implicit.
- **Intermission is informational, not celebratory.** Reads like a report card; a missed chance to re-peak.

**Recommended Improvements.**
1. **Re-annotate the dip-and-hold** in the immediate replay (reuse the JOURNEY tag system): a "😰 the wobble" tag at the dip candle and a "✅ patience paid" tag at the recovery, so the replay actively re-teaches the exact behavior the win-card named. Copy + tags on an existing surface. **S–M.**
2. **Let intermission re-peak:** a small "LEVEL X — you can now read MOMENTUM" banner + tally fly-in so progression feels like an event. **M.**

**Priority:** P1. **Impact:** turns a passive re-watch into a second, cheaper teaching rep — and stops a flat trade from being reinforced twice. **Difficulty:** S–M.

#### Screen 4 — Reflection (why-you-won card + Knowledge Progress)

**Current State.** The "why you won" post-trade card IS the reflection beat, gated BEFORE the dopamine by design (`dismissLesson` fires the celebration, :11983–11991). The intermission adds Knowledge Progress rows and a mastery gate. No forced journaling on the happy path. Post-trade verdicts are the build's "secret weapon" — trader-accurate, process-over-outcome, and now HONEST because outcomes are authored, not decorating a coin flip.

**Problems.**
- **Reflection is told, not owned.** The card states the insight ("you waited for the dip"). A beginner internalizes deeper when they *claim* it. There's no lightweight "I did X" echo — the identity-language polish is recommended but unbuilt.
- **Process-verdict copy is excellent but generic-leaning at the first trade.** World-class for a trader; for a first-ever trade it could be more personal ("YOU waited," not "the process was sound").

**Player Psychology.** See: a clear "why you won" card, then progress rows. Do: read, dismiss. Think: *"I won because I was patient — got it."* Feel: understood, competent (target metric "I feel smarter than 15 minutes ago" ✓). Learn: the transferable rule (patience + confirmation) — the strongest single beat in the segment.

**Recommended Improvements.**
1. **Add one identity-language echo:** reframe the reflection line to second-person-active — *"YOU waited for the dip. YOU respected the plan. That's a trader."* Copy only. **S.**
2. **Optional one-tap "I waited 🐢" acknowledge** so the player *commits* the lesson (still no free-text, no soft-lock risk). **S.**

**Priority:** P1. **Impact:** converts correct comprehension into felt identity ("I'm becoming a trader") — the emotional root of retention and WTP. **Difficulty:** S. *Monetization:* "trader identity" is precisely what the $25 unlock is selling.

#### Screen 5 — Second Trade + First Loss handling (the prove rep, and the authored loss)

**Current State.** `beginIntroProve` sets `introFlow.phase='prove'` — a "spot the lie" broken-candle warm-up seconds before the Gambler tests the same read, then a second real setup (the APPLY/prove rep into the boss). The FIRST LOSS is deliberately NOT here — it is relocated to Level-2 trade #2, a telegraphed, stop-protected loss on a CORRECT read (`authoredTutorialOutcome`, :11095–11103; build 257 win→LOSS→win bracket), with an authored recovery win immediately after (`session._recoverNextWin`, :11100). On the loss, price is driven to the stop so it is SEEN and fair, and the verdict reads *"A solid setup that did not follow through — the stop did its job"* (:12181/12379), with the lesson-chart annotation *"STOP — loss capped"* / *"stop did its job"* (:19239). Called "the single best onboarding decision in the project."

**Problems.**
- **The loss is designed correctly but not FELT correctly.** The point of an authored First Loss is the arc *"oh no — wait, I'm okay — I get it — I'm braver now."* Today it is fair and explained, but there's no staged "sting → the stop catches you → relief → wisdom" beat. A loss that isn't *felt* teaches the rule but skips the courage-building.
- **Confidence-after-loss is asserted, not demonstrated.** The verdict says the stop did its job; the player doesn't get a Finn beat that turns the loss into pride.
- **The recovery win can read as "the game just gave it back."** Without framing, the authored recovery risks feeling like a consolation prize.
- **Prove-rep pacing risk.** Back-to-back-feeling reps can blur — needs a clear "this was practice / this was real" beat.

**Player Psychology.** See (loss): a correct-looking setup → price against → stop hit → "stop did its job" → next trade wins. Think: *"I did everything right and still lost?? …oh — but I only lost a little, because of the stop. That's the point."* Feel (target): brief sting → relief → *respect for the stop* → braver, not burned. Feel (today): informed the loss was fine, but the arc is muted. Learn: losses are normal, the stop caps them, a good process can still lose — the most important resilience lesson in trading, taught at zero real cost. Taught-before-tested ✓.

**Educational Analysis.** Taught-before-tested: YES — the stop was named and shown in the guided first trade before any loss occurs. Obvious-by-looking: YES — price visibly hits the red stop and the loss is capped on screen. The most pedagogically important beat in the segment, architecturally correct; the only gap is emotional staging.

**Recommended Improvements** (presentation + Finn only; outcome is protected and already validated — do not move the loss or change its logic without founder pre-flight).
1. **Stage the loss as a 3-beat felt arc:** (a) sting — brief red P&L punch + a Finn "worried" expression as price turns; (b) rescue — visible emphasis on the stop line catching it (*"the stop caught us — small loss"*); (c) pride — a Finn "steady/proud" beat: *"THAT is why we set a stop. You're still in the game."* Reuses Finn Expression Library + existing verdict card. **M.**
2. **Frame the recovery win as earned, not gifted:** one Finn line — *"Same read, better follow-through. See? You didn't do anything wrong."* Copy only. **S.**
3. **Add explicit "PRACTICE" vs "REAL" labels** to the prove-rep vs the live second trade. **S.**
4. **Raise confidence measurably after the loss:** surface a tiny "resilience +1 / first stop respected" tally at the recovery so the player *sees* they grew. **S–M.**

**Priority:** P0 for the felt-loss staging; P1 for #2–#4. **Impact:** converts the correctly-authored first loss from a fair-but-flat event into the confidence-building turn it was designed to be. **Difficulty:** M. *Retention:* a first loss that raises confidence is the anti-churn beat; a flat or scary one is where beginners quit.

**Segment synthesis.** The architecture is ratified and correct — **not one piece needs redesign.** Every open issue is the same shape: **fair and explained, but not FELT.** The first trade is a tap-through, the first win is a card, the first loss is a footnote — three moments engineered to produce nervousness → uncertainty → victory → resilience → "I want another," currently delivering the information but not the emotion. The entire high-value work for the 4-day beta is a **felt-stakes staging pass** (copy + Finn expressions + existing juice/replay/notebook surfaces) — and the decisive validation is non-code: **sit beside each friend and watch their face on the dip and on the loss.**

---

### Segment E — Replay → Notebook → Reflection → Second Trade (the learning loop)

*Metabolises the raw dopamine of the First Win into two durable things: **"I understand WHY that happened"** and **"I want to do that again, now."** Emotions: understanding → confidence → momentum. Every recommendation is a surfacing/framing/pacing change on an existing surface, not a redesign.*

#### Replay

**Current State.** As Segment D Screen 3: immediate live playback + captured JOURNEY snapshot (entry index marked, build 215); level-end `imRender`/`drawIntermission` recap (Trading Account, Performance tiles, Knowledge Progress, mastery-gate, trade log, :5808-5895). First-review gate auto-satisfies (:12024).

**Problems.**
- **The immediate replay is the same footage the player just watched**, re-shown with entry/exit markers but **no cause annotation** — it marks *where*, not *why*. If the live arc wasn't dramatised, the replay reinforces a flat moment.
- **The per-trade JOURNEY review isn't surfaced after the FIRST trade** — the *"📓 Trade saved — tap your Journal"* nudge is gated behind `bossesEverCount() >= 1` (:12028), so at the exact moment a beginner most needs a "here's what just happened" review, the review layer is invisible.
- **The intermission is heavy and mistimed** for this between-trades segment (level-end density with no level-end).

**Recommended Improvements** (ratified systems, no new architecture).
- Annotate the existing JOURNEY snapshot with **Finn callouts on the exact candles it already tags**: at the pre-entry low, *"The DIP. This is what we waited for."*; at entry, *"You joined here."*; at the first strong green, *"Confirmation — the move is real."*; at target, *"Take profit."* Uses the Finn system and the Constitution's frozen candle seam — labels only.
- **Surface the per-trade JOURNEY review immediately after the first trade** — drop the `bossesEverCount()>=1` gate for the first-ever trade (the Journal-habit nudge can still wait for the boss unlock).
- Make the immediate replay and the "why you won" card **one continuous beat** — same message in words and pictures.

**Priority:** P1. **Impact:** turns a redundant re-watch into the segment's primary teaching moment; attacks the "click buttons, no meaning" leak on the cheapest surface; produces a shareable annotated replay. **Difficulty:** M. *Learning:* converts "I saw it go up" into dual-coded (visual + verbal) retention.

#### Notebook

**Current State.** The Trader's Journal unlocks as a **Boss-1 reward**. `renderNotes` (:8810-8837) is a note **composer**: a textarea plus an optional link-to dropdown offering only **discovered** concepts (no future-term leaks). **Lost Wisdom** is a separate, well-crafted discovery layer: whispering-wick clues, hidden pages revealed only at the wick tip — *notice → investigate → discover*, spaced 65+ candles apart (:8382-8405).

**Problems.**
- **In this segment the notebook is essentially absent** — it unlocks *after* Boss 1, which is *after* the second trade. Across the first-trade→second-trade window the review it promises is invisible — the very window where consolidating the first win into a rule matters most.
- **The composer is homework, not discovery.** A blank textarea asking a novice to author a takeaway from nothing is the opposite of earned discovery. It will be skipped, and a skipped-empty notebook reads as an unfinished feature.
- **Two mental models collide under one icon** — delightful wordless "Lost Wisdom" vs blank-page "Journal composer."

**Recommended Improvements.**
- Make the notebook's **first appearance a discovery, never a blank page.** Auto-write the first entry from the trade just won — an **identity-language rule card**: *"Rule you used: I WAITED FOR THE DIP, then joined the green."* The player *receives* a rule they earned; the composer becomes an advanced tool they grow into.
- Keep the **free-text composer out of the golden-path first hour.**
- Lean the notebook's early identity on **Lost Wisdom + the auto-captured JOURNEY** (both zero-typing).

**Priority:** P1 (received rule / discovery), P2 (defer the composer). **Impact:** converts a skip-and-feel-unfinished surface into an earned-rule moment. **Difficulty:** M. *Monetization:* an earned-rule collection is a value-bridge the paywall can light up.

#### Reflection

**Current State.** The "why you won" card IS the reflection, gated **before** the dopamine (`dismissLesson → pendingCelebration`, :11983-11997), with a 7s safety timer. The trophy carries the WHY in its subtitle. The intermission adds macro reflection via Knowledge Progress rows and a mastery gate. No forced journaling.

**Problems.**
- **Reflection is passive.** The card *states* the answer; the player *reads* it. **Retrieval** beats re-reading for durable memory — and the game never asks the player to produce the reason.
- **The WHY can be missed in the rush to the trophy.** Because the celebration is chained to *dismissing* the card, a beginner eager for the trophy taps through the reason — undoing what "learning before dopamine" was designed to protect.
- **One line does a lot of work** — excellent copy, but it isn't reinforced by the *picture* (see Replay), so it lands as a slogan.

**Recommended Improvements.**
- Insert **one can't-fail retrieval tap** before the trophy: *"Why did this win?"* → *[I waited for the dip ✓] [I got lucky]* — either advances, the correct one gets Finn's proud nod, the "lucky" tap gets a gentle *"Nope — you WAITED. That's skill."* Retrieval practice with **zero failure state**. Existing lesson-card/Finn surfaces.
- **Tie the answer to the annotated replay** so the reason is shown *and* said in the same beat.
- Keep the celebration hard-sequenced after the reflection; the retrieval tap *is* the dismissal.

**Priority:** P1. **Impact:** turns the segment's best-designed moment from "read the answer" into "recall the answer" — the highest-leverage retention change in the loop, on an existing surface. **Difficulty:** S. *Learning:* retrieval > re-reading; the single biggest memory lever available.

#### Second Trade

**Current State.** After the win breathes, `beginIntroProve` sets `introFlow.phase='prove'` (:12309-12330). A **"spot the lie" broken-candle warm-up** now lives at the *start* of the prove phase (:16102-16106), then a short pure-gameplay stretch and a **second real setup**; `INTRO_TRADES_NEEDED = 3` real trades before the boss (:12323). The transition waits for confetti to clear (:12300-12310), with an 18s hard fallback.

**Problems.**
- **The pull into the second trade isn't immediate.** Between trade 1 and trade 2 the player passes celebration → free-play → a full-screen "spot the lie" → a setup. That's real connective tissue at the exact moment confidence is hottest. Momentum ("do it again, now") is blunted.
- **The warm-up can read as homework** unless framed as a dare from Finn.
- **The stakes don't visibly step up.** If the second trade feels like a re-run of the first, the confidence gained in reflection isn't *spent* on anything.
- **Same FEEL caveat** — if the first trade was under-dramatised, the second inherits it.

**Educational Analysis.** The APPLY stage of LEARN→PRACTICE→APPLY→TEST — the concept applied under slightly less hand-holding, immediately before the Gambler TESTs it. Taught-before-tested holds. The "spot the lie" anatomy is a genuine new micro-skill the Gambler's *error* round leans on — good pre-teach placement. The open question is *momentum*, not correctness.

**Recommended Improvements.**
- **Reframe the "spot the lie" warm-up as Finn's dare:** *"You just made real money. Bet you can spot a FAKE candle now."* Turns a homework beat into a confidence beat.
- **Shorten the reflection→second-setup gap** so the second trade arrives while confidence is hot (tune the free-play stretch, don't touch physics — protected #4).
- **Let the second trade step down the guidance** — trade 1 was fully guided; the second should nudge toward *"you call it"* so the player *spends* the confidence they earned.

**Priority:** P1. **Impact:** preserves momentum through the hand-off to Boss 1; converts a proud win into a "let me do it myself" second rep — the addiction seed. **Difficulty:** M. *Retention:* immediate second rep while confidence is hot is the "one more" mechanism (structurally the weakest dimension today, 2.3/5).

**Segment verdict.** The architecture is right and ratified — learning-before-dopamine, authored fair outcomes, taught-before-tested, honest-but-unloseable, JOURNEY capture. The through-line: this segment currently *tells* the player they understood and *shows* them a re-watch. Make it **ask** (one retrieval tap), **show why** (annotated replay), **hand them a rule they earned** (auto notebook card), and **pull them into a self-directed second rep while confidence is hot** — and the loop turns understanding into momentum, the fulcrum for both retention and WTP.

---

### Segment F — Boss One (The Gambler) → Boss Victory → Continue

*The graduation of the first hour — where the website promise ("Finn teaches you to read them as you play") is cashed in. Arc: anticipation → confidence → **pride** → motivation.* **Two corrections to the working brief, verified in source:** (1) Guardian 1 is a **5-round** exam, not 3 — `BOSSES[0].rounds = [candle, whowon, confirm, predict, error]` (:9654), 5 boss-HP crystals / 3 lives; (2) the O6 "boss tests 2 untaught micro-rules" finding is now **largely closed** — `confirm` is taught+practiced as trade-3's concept (:12243) and `error` is taught via the `brokencandle` rep opened seconds before the boss (:12334, 19366). The Capstone/paywall is NOT in this segment — V1.5 moved it to after Guardian 3 (:10826). So "Continue" here is a clean goal-recap + save-at-pride beat.

> **NOTE — a genuine ground-truth conflict to resolve before beta.** A parallel beginner-lens verification against the shipped `BOSSES[0]` reports the round playlist tests **DOJI and a 2-candle upper-wick REJECTION** — concepts the golden path does *not* teach before the boss (the `what_is_doji` lesson exists at :4633 but is off the golden path). If that read is correct, the "never test the untaught" violation the review reports as closed is **live**, and it lands on the graduation moment. **Action:** before shipping to 10 friends, open `BOSSES[0].rounds` and confirm every tested concept was taught on the happy path. If doji/wick-rejection are present, either add the one-line teach beats before `triggerIntroBoss`, or swap those rounds for taught concepts (candle · whowon · predict). This is the single most important pre-beta *correctness* check in the boss segment.

#### Screen 17 — Boss One: The Gambler

**Current State.** After the "prove" stretch, `triggerIntroBoss()` (:16162) opens the video-as-world Gambler encounter. A cinematic intro card (`bossIntroCardHTML`, :9988): realm "⟁ HALL OF RISKS," name **THE GAMBLER**, epithet "DEALER OF EASY MONEY," the line *"New drifter? Step right up. Red or green, double or nothing — the cards never lie… mostly."* (:9657), and "⚔ ENTER HALL OF RISKS →." A ~560ms portal warp (`bossPortal`, :10056) into round 1. The exam is **5 rounds** (:9654). Each round shows "ROUND n / 5" with "⚔ FIGHT →" (:10018), then the mini-game floats over the dimmed boss clip with a HUD of 💎 crystals (HP) + ❤ hearts (lives). Between rounds: "✓ HIT — boss damaged / Score n/100 / NEXT ROUND →" (:10084). A wrong read is now honestly **felt** — "✗ Wrong read — but the Gambler fumbles the deal. Take the round." (:10065) — while still advancing. Unloseable by design (`onRoundDone`, level 0 forces `passed=true`, `score≥60`; :10061–10068).

**Problems.**
- **The exam is longer than the confidence beat wants to be.** Five rounds × (intro → FIGHT → warp → mini-game → HIT card → NEXT) is ~5 mini-games and ~10 tap-throughs at the very end of a ~25-minute onboarding. Risks turning "graduation" into "another quiz," bumping the pacing leak right before the payoff. The hardest, most abstract read (`error`/spot-the-lie) closes the exam, so the last taste before victory is the shakiest.
- **Veteran mechanics can leak in.** `onRoundDone` fires a "⚡ WEAKNESS EXPLOITED — Structure ×2!" floater when mastery ≥70 (:10071–10076), and `masteryBump(...,90,0.30)` after each passed round (:10078) can push Structure past 70 mid-fight. A total beginner has no schema for "weakness exploited ×2." (Confirm whether it fires for a fresh account.)
- **"Fumble the deal" softens confidence for a misser.** Honest per-round, but for a beginner who misses 2–3 of 5, repeatedly "winning because the Gambler fumbled" reframes the graduation as *luck*, not skill.

**Player Psychology.** See: a slick villain card, crystals and hearts, 5 rounds counting up. Do: tap ENTER → FIGHT → answer → NEXT, five times. Think: *"A real boss fight. Do I actually know this?"* → ideally *"…yeah, I do."* Feel: anticipation → mounting confidence with each 💎; risk of fatigue by round 4–5 or "was that luck?" on a misser. Learn: consolidation — the concepts fire under mild pressure, where recall becomes durable.

**Educational Analysis.** Concepts: candle direction, buyers-vs-sellers, wait-for-close, simple continuation, candle integrity. **Taught-before-tested: YES per the review's verification** — but see the ground-truth conflict above; confirm the shipped playlist. Obvious-by-looking: mostly yes — the exam rewards *recognition*, the correct difficulty for a graduation.

**Recommended Improvements** (ratified systems only).
1. **P1 — Founder decision: trim Guardian 1 to 3 rounds for the beta** (candle · whowon · predict — the three most obvious-by-looking reads) and let `confirm`/`error` earn their slot at Guardian 2+. A protected-system #2 content-map change. Directly de-risks the end-of-hour pacing wall. Data-driven alternative: ship 5, watch `boss_encounter`→`boss_defeated` drop-off across the 10 friends, decide after. **(This trimming also resolves the untaught-concept risk if doji/wick-rejection are the shipped rounds.)**
2. **P2 — Gate the ×2 "weakness exploited" floater behind `bossesDone.size ≥ 2`** — keep the math, hide the veteran caption during the first boss.
3. **P2 — Split the "fumble" copy by miss-count.** First miss: keep the honest line. On a *clean* run, suppress it entirely so real readers never see "fumble."
4. **P0 (already done — protect):** the unloseable-but-honest design and taught-before-tested playlist are the spine.

**Priority:** P1 (round-count) · P2 (jargon/copy). **Impact:** removes the last pacing wall before the payoff and keeps "I earned it" true for missers. **Difficulty:** S. *Retention:* shorter, punchier boss = higher `boss_defeated` completion.

#### Screen 18 — Boss Victory: THE GAMBLER FALLS

**Current State.** On the 5th crystal, `bossWin` (:10183) fires a triple coin-burst + `shakeBig` + win sting (:10204–10206), then renders the dedicated Guardian-1 card (`vicG1`, :10224): a boss portrait stamped "✗ DEFEATED," headline **"THE GAMBLER FALLS,"** "First Guardian cleared · 1 / 10," the concession *"You can read candles now. Most traders never learn that."*, a **★ NEW TITLE UNLOCKED ★ CANDLE READER** block, a **LESSONS MASTERED** checklist, a once-ever **📖 TRADER'S JOURNAL UNLOCKED** note, rewards with *meaning* ("+25 shells — fuels your next trades / +80 XP — closer to your next rank"), a **NEXT GUARDIAN 🔒** teaser *"Some candles lie. Learn to spot the fake-out."*, and **CONTINUE TRAINING →**. 160ms later the ~4s `playJournalUnlock` cinematic overlays it (:10289+).

**This screen is a genuine highlight and mostly right** — identity language ("Candle Reader"), capability language, rewards-with-meaning, a spoiler-free hook. It is well-juiced, and is **the model the earlier first-trade win should copy** (the contrast — the boss victory shakes, the first-trade win doesn't — is instructive).

**Problems.**
- **The pride card gets covered before it can be read.** `vicG1` renders, then at +160ms the 4s Journal cinematic overlays it. The single most important pride artifact competes with a tool tutorial for the peak moment. The *identity* should land and breathe *before* the *tool*.
- **No shareable artifact — still open.** A defeated villain + a new title + a mascot + a 1/10 stamp is a *perfect* share object, and there is no way to capture it.
- **"CANDLE READER" is asserted, not shown.** It never ties back to a concrete thing the player just did.

**Player Psychology.** See: a villain defeated, MY new title, MY stats, a locked next villain teasing "some candles lie." Do: read, feel it, tap CONTINUE. Think: *"I'm a Candle Reader now. There are 9 more. What's the fake-out one?"* Feel: **pride** + curiosity — the strongest emotional second in the build. Learn: meta-cognition — the checklist tells them *what they now know* (success metric "I feel smarter than 15 minutes ago" hit).

**Recommended Improvements.**
1. **P1 — Add a "Share your win" affordance** (screenshot/card export of "I beat THE GAMBLER · I'm a CANDLE READER · 1/10" with Finn). The artifact already exists on screen — a capture/share button, not new architecture. Highest-leverage virality unlock in the segment.
2. **P2 — Let the pride card breathe before the Journal cinematic.** Hold `vicG1` ~1.5–2s (or gate the cinematic behind a tap) so identity registers before the tool overlay.
3. **P2 — Tie the title to the deed.** One line under "CANDLE READER": "You read 5 candles in a row. That's the skill most people skip." Pairs with the clean-vs-fumble copy split.

**Priority:** P1 (share) · P2 (sequencing, deed-tie). **Impact:** the share affordance is the single missing viral primitive at the game's most screenshot-worthy moment; sequencing protects the peak emotion. **Difficulty:** M (share) · S (sequencing, copy). *Virality:* this is *the* fix — the concept is inherently shareable and currently has no share button.

#### Screen 19 — Continue: goal recap + save-at-pride

**Current State.** CONTINUE TRAINING → `bossFinish()` (:10818): for level 0 it tears down the boss backdrop/music and calls `introComplete()` directly — **no Capstone, no paywall** (gated to Guardian 3, :10826). `introComplete` (:16174) sets `cq_played=1`, resets the Hour-1 counters and trade gate, shows a single goal recap via `teach('goal')`, then at +800ms calls `promptSaveProgress()` — inviting the guest to save "just after they've out-traded their first Guardian" (:16196). Hour 1 then begins on the live chart.

**Problems.**
- **Two overlays can stack at the handoff.** `teach('goal')` fires immediately and `promptSaveProgress` at +800ms (:16195–16197). If the goal recap is still on screen, the save prompt can land on top of it. Verify serialize (dismiss-then-prompt).
- **The "what do I do now?" gap meets the traversal leak.** After the save prompt, the player is dropped back onto the sparse chart with a goal recap but no strong forward pull toward Guardian 2 — the traversal-wall leak re-appears *after* the pride high. The momentum earned in Screens 17–18 can bleed out in the first 50–70s dead zone.
- **The save ask has to carry its own weight.** The *reason* to save should borrow the pride explicitly ("Save 'Candle Reader' so The Gambler stays beaten") rather than a generic "save your progress." (Verify the prompt copy references the earned identity.)

**Player Psychology.** See: the boss screen closes, a one-line goal reminder, then "save your progress?" Do: dismiss, choose save-or-later, resume. Think: *"I want to keep this. What's next — the fake-out guy?"* Feel: motivation + a small ownership tug; risk of "…okay, now what?" if the chart doesn't pull them onward. Learn: nothing new (correct — a transition).

**Recommended Improvements.**
1. **P1 — Make the save prompt borrow the pride.** Reframe `promptSaveProgress` copy at this call-site: "Keep your title — save so 'The Gambler' stays beaten and your Journal follows you." String change at :16195.
2. **P2 — Verify/serialize the `teach('goal')` → `promptSaveProgress` seam** so the two never co-occupy the screen.
3. **P2 — Reinforce the "some candles lie" pull on the chart:** a single Finn breadcrumb/floater on Hour-1 resume ("The Fake-Out Eel is out there — this way →") using the existing coach/floater system carries the curiosity gap across the handoff. Level-design/copy only.

**Priority:** P1 (save-copy) · P2 (seam, forward pull). **Impact:** the save-copy fix is a direct conversion lever at the highest-intent moment in the free experience. **Difficulty:** S. *Monetization:* an account saved at pride is the prerequisite for the eventual Guardian-3 Capstone/paywall to have anyone to convert.

*Cross-segment note for the founder (surfacing, not changing): the working brief and `ui_canon` describe a 3-round Guardian 1 and a post-Guardian-2 Capstone; the shipped code is a **5-round** Guardian 1 (:9654) with the Capstone/paywall at **Guardian 3** (:10826). Neither is a bug, but both change what a first-time beta friend experiences at "graduation," and both are worth a deliberate yes before the beta.*

---

### Segment G — Character Audit: Finn & The Market Maker

> **Scope:** every Golden-Path moment where Finn is on screen and every moment the Market Maker exists. READ-ONLY; all recommendations USE the ratified systems (Behavior Bible, Expression Library, Living Renderer V2, replay/notebook, `celebrate()`).
>
> **The one-line thesis:** *Finn is architected to be a living companion (the Behavior Bible is world-class), but on the Golden Path his richest reactive machinery is either disconnected from the sprite or never fires at the emotional peaks — so a beginner meets a calm, well-animated idle turtle, not the companion who reacts to their dip, their near-miss, their first win. And the Market Maker, the single most memorable asset, appears once for ~30s and then survives only as a scoreboard number. Both are under-performing their own canon, and closing that gap is nearly free because the systems already exist.*

**Finn 1 — Idle personality & the Living Renderer.** `FinnLife` (:13150+) composes real life on top of `run.png`: non-metronomic blink (14% double / 6% long, :13201), a weighted non-repeating Idle Scheduler (`read · glance · peek · shellcheck · settle`, :13186), gaze/head-tilt, breath, flame pulse, rare idle surprises. The strongest character asset in the build. **Problem:** the beats read as ambient noise with no narrative hook, and the **Shell-Check** — declared THE ONE SIGNATURE — fires only as one of seven random idle options (:13192), never *reactively* before a risky moment where it would mean "look before you leap." **Fix (P1, S):** fire the Shell-Check reactively at the authored uncertain moments the game already gates (the `armFirstGuidedTrade` pause, the setup countdown), and NAME it once early ("See how I tuck my shell before I jump? That means: check before you leap") so every future idle Shell-Check means something.

**Finn 2 — Movement, jumps & near-misses.** Input feel is fixed (build 247); landing has a render-only squash. **Problem:** no reaction to a near-miss and no anticipation before a jump — the Bible's "looks up before a boost" and "recover-and-lift" (§3 #25) are authored and unused, and the longest low-agency stretch is exactly where Finn is most silent. **Fix (P1, S–M, render-only):** near-miss → deeper `land` squash + one-frame settle; boost prompt → a 1-frame gaze-up; idle/hover >4s in traversal → bias toward the `peek` + look-to-player beat (Finn turning to *check on you* at the highest-churn moment).

**Finn 3 — The teaching presence.** Teaching runs through the LessonChart overlay; the Expression Library maps Teaching = hero/run + friendly smile + front-leg gesture (achievable now). **Problem:** the teaching soul is carried by *copy*, not by Finn's *presence* in the frame. **Fix (P1, S):** seat a small Finn beside the lesson chart using the "gentle point" (§3 #15) at the candle being explained (reuse `drawHeroFinn`, :4422); on a passed practice rep, one Finn line — *"You read that. Not me."*

**Finn 4 — Trade reactions: the dip, the near-stop, the run (the highest-value finding in this segment).** The engine computes `shellEmotion` from live R every frame (`r>0.5→'happy'`, `r<-0.3→'worried'`, :12824). **But `shellEmotion` only affects the *procedural fallback* shell — the real sprite face is baked into `run.png`.** So on the happy path Finn's face **does not change during the trade at all.** The dip→hold→recover→run arc plays out on the chart while Finn stands with the same calm smile through his own money nearly stopping out. This is the *character-side root* of Headline #1. The Bible authored this exact beat (§4 "Trade almost stops out → Shell-Check → steadying breath → Concerned"), and it is 100% dormant. **Fix (P0, S–M, render-only, founder pre-flight because it's the trade screen):** on `shellEmotion === 'worried'` during a trade, fire the existing `FinnLife` Shell-Check + a steadying-breath beat + level eyes; on the recovery, the satisfied nod. Reads already-computed state; changes zero trade logic. The safest possible felt-stakes intervention.

**Finn 5 — The first win celebration.** `celebrate()` fires the once-ever milestone (🏆, gold flash, 22-particle burst, fanfare, `finn:true`), gated after the "why you won" card. **Problem:** contained to a floater + a hero pose; the Bible authors a **rarer, once-only** full-body happy wiggle (§8 #97) "only after a big honest win" — and `drawHeroFinn` currently does a gentle bob, not the wiggle. **Fix (P0, S):** reserve the §8 #97 wiggle for this exact once-ever path; let shells rain past Finn (extend the existing burst); close with a companion-check (§3 #22 — Finn turns to look at *you*, "we did that"); coordinate with the screen-shake/swell juice pass so Finn's peak and the screen's peak land together.

**Finn 6 — Loss & recovery.** On an authored trade loss there is no dazed art (correct — that's fall-only) but also **no wired Recovering beat** (recoil → stillness → head-lift → resolute nod, §3 #25 / §4 "Player loses"). **Fix (P1, S):** wire the Recovering beat + a look-to-player before the lesson card on the authored loss, paired with the existing "your stop did its job" copy — empathy before instruction, so the reframe (a stop-out = protection) is *shown and told*.

**Finn 7 — Boss presence.** The boss-intro expression is mapped (grounded, calm-brave, feet plant, squares up — achievable now). **Fix (P2, S–M):** wire the courage beat (feet plant → Shell-Check → squares up) when the Gambler appears (models "courage = composure"); split Finn's victory read — on a *clean* read, the proud satisfied-nod + to-player look; on a *fumbled* round, the gentle "it paid, but let's see *why*" beat instead of a full cheer, so Finn never celebrates a wrong read as skill.

**Market Maker 1 — The cinematic reveal.** `#mmTeaser` plays the dark reveal; the writing is genuinely good (theme FREEDOM, one gold keyword per screen, NAME in purple). The most memorable asset in the game. **Problems:** cold-open fragility (still depends on a 30s clip; poster covers the bounce but the reveal can degrade to near-black), and the goal card is off the happy path. **Fix (P0/P1, S):** guarantee an instant static hero-still of the villain on frame 1; surface the goal card on the happy path; keep the writing and the NAME reveal exactly.

**Market Maker 2 — The throughline.** Every Guardian win reprints progress (`TOTAL_G = 10`, :10210), and the Capstone names the road ahead. **Problem:** the villain never *re-appears*, never *reacts* — power established once, then inert; "6 remain" is a number, not a stake. **Fix (P1, S):** one villain-presence beat at the first milestone after the Gambler ("One Guardian down. Nine stand between you and me.") using the existing MM voice + poster; put his face on the "X remain" progress UI so every counter glance re-shows him.

**Market Maker 3 — Memorability & the missing shareable.** The two most memorable, most *ownable* assets — Finn (meme vector) and the Market Maker (villain) — appear on **zero shareable surfaces.** **Fix (P1, M):** a single share card at FIRST WIN and THE GAMBLER FALLS, built from assets that already exist (`drawHeroFinn` hero pose + villain poster + the player's own stat), with both characters on it. The only zero-cost acquisition channel the product has.

**Segment summary — the pattern.** Two findings repeat: **(1) Finn's reactive canon is built but disconnected** — the highest-ROI work is not building new behavior but *connecting behavior that already exists* to the emotional peaks (almost all S-difficulty, render-only). **(2) The Market Maker is a 30-second asset doing a 1-hour job** — keeping him *present* (one call-out, his face on the progress UI, his still on a share card) is nearly free and feeds the want-to-defeat pull the whole free-to-paid funnel rides on.

---

## First Trade · First Loss · First Boss — the emotional spine (deep-dives)

*These three moments are pulled out because they are the beats the entire product turns on. Each is architecturally correct and emotionally under-delivered — the fix is staging, not redesign.*

### DEEP-DIVE 1 — The First Trade

**Why it is the spine.** Everything before it is setup; everything after it is consequence. WTP, addiction, and virality are all decided by whether this 30 seconds *feels* like something. The founder's own complaint — "you just click buttons, no meaning" — is the single most important open variable in the beta, and it is a **feeling** problem, not a fairness problem (fairness is fixed: L1–3 outcomes are authored via `authoredTutorialOutcome`; the coin-flip is gone).

**The authored drama already exists and is thrown away.** `tradeDrivenCandle` (:2946) contains a scripted dip→hold→recover→run arc; the engine's own comment calls the dip "the single most important emotional moment — felt on EVERY win." It is delivered as a text `beat()` caption ("😬 Oh no — price is pulling back…"). Meanwhile `shellEmotion='worried'` is computed every frame on the dip (:12824) and never reaches the sprite. **The drama is coded. The delivery is muted.**

**The three-part staging pass (P0, all reuse existing systems):**
1. **Reasoning, not labels** — the 3 guide cards become a CAUSE→CHOICE→SAFETY→REWARD sentence in Finn's voice, so the player enters *because they read the chart*. Copy only.
2. **A staged scare** — on the existing `beat()` dip hook: thin the music, red-pulse the live P&L, fire Finn's computed `'worried'` read through the existing Shell-Check/steadying-breath overlay, then slam a sting + screen-shake + green swell on `reached(target)`. Presentation on existing data; no outcome change.
3. **A committed belief** — a one-tap "I think this goes UP 👆" before the reveal, so the authored win feels *earned* and the dip feels *personal*.

**The Duolingo caveat (worth naming to the founder):** every pre-boss rep is authored to win, so the learner never commits a genuinely-judged read, is told they're wrong, and corrects — the core learn-from-error loop is absent. This is a *deliberate* fairness choice and should not be made losable. But the conviction tap (#3) is the cheapest way to restore *felt* commitment without adding a real failure state, and it is why #3 is load-bearing, not decoration.

### DEEP-DIVE 2 — The First Loss

**Why it is the spine.** This is the beat that separates ChartQuest from a punishing trading sim. The whole point of a *safely-authored* first loss is the emotional turn: *"I did everything right and still lost — but the stop caught it, and I'm braver now."* Deliver that and a beginner trusts the product enough to keep trading (and eventually to pay); deliver a flat or scary loss and this is exactly where beginners quit.

**The design is the single best onboarding decision in the project.** The loss is relocated to L2 trade #2 (build 257 win→LOSS→win bracket), on a *correct* read, stop-protected, with an authored recovery win immediately after (`session._recoverNextWin`, :11100). Price is driven to the stop so the cap is SEEN and fair. The verdict copy is trader-accurate ("A solid setup that did not follow through — the stop did its job").

**The gap is identical to the first trade: fair and explained, not FELT.** The resilience payload is carried entirely by a copy card. The Bible's exact recovery choreography (§4 "Player loses → look to chart → look to player → small settle → head lifts → point to lesson," §3 #25 recover-and-lift) is authored and dormant.

**The staging pass (P0, presentation + Finn only — loss placement/logic is validated and untouched):**
1. **Sting** — brief red P&L punch + Finn "worried" as price turns against.
2. **Rescue** — visible emphasis on the stop line catching it: *"the stop caught us — small loss."*
3. **Pride** — a Finn steady/proud beat: *"THAT is why we set a stop. You're still in the game."*
4. **Earned recovery** — frame the recovery win as applied resilience, not a handout: *"Same read, better follow-through. You didn't do anything wrong."*
5. **Measurable growth** — a tiny "resilience +1 / first stop respected" tally so the player *sees* they grew from the loss.

**A loss that builds courage is the anti-churn beat. A loss that is a footnote teaches the rule but skips the courage.**

### DEEP-DIVE 3 — The First Boss (The Gambler)

**Why it is the spine.** This is the pride peak of the first hour — "I earned it, not survived it" — and the moment word-of-mouth is born. It must convert a *win* into an *identity* (the "CANDLE READER" title).

**It is well-built and mostly right.** Unloseable-but-honest (a wrong read still advances but is *felt*, not silently passed). The victory card is a genuine highlight — identity language, a LESSONS MASTERED checklist (retrieval-summary, ideal consolidation), rewards-with-meaning, a spoiler-free "some candles lie" hook. It is well-juiced — and is the model the under-juiced first-*trade* win should copy.

**Three things stand between it and a clean graduation:**
1. **Length + order.** A 5-round, ~10-tap-through gauntlet at minute ~25 risks fatigue right before the payoff, and the shakiest read (`error`/spot-the-lie) closes it. **Founder decision:** trim to 3 obvious-by-looking rounds for the beta, or ship 5 and watch the drop-off telemetry.
2. **The untaught-concept risk (must-verify).** If the shipped `BOSSES[0]` rounds test doji / 2-candle wick-rejection (as one beginner-lens verification reports), the boss tests the untaught at the exact graduation moment — turning "I earned it" into "I guessed while the villain fumbled." **Confirm `BOSSES[0].rounds` against what the golden path teaches before beta.** Trimming to candle · whowon · predict resolves both this and #1.
3. **The pride card gets buried.** `vicG1` is overlaid by the 4s Journal cinematic at +160ms. Let identity breathe (~1.5–2s or a tap-gate) *before* the tool. And add the missing **share card** — the most screenshot-worthy second in the game has no outbound hook.

---

## Playtest Prediction — 10 real beginners

*Where the 10 friends will smile, laugh, confuse, bore, quit, get excited, and feel proud — with the pre-emptive fix for each failure. Assumes cellular connections and a mix of ~4 competent gamers and ~6 non-gamers, all on `?fresh=1`.*

| Moment | What ~10 beginners actually do | The failure (and who it hits) | Pre-emptive fix |
|---|---|---|---|
| **Cold-open cinematic** | Watch; the impatient reach for a tap that isn't there until t>29.5 | **1–2 quit** — cellular stall + cold-cache poster = near-black; the ~4 gamers get **bored** by 30s of zero agency | Instant painted villain frame + fast auto-skip to the goal card; surface ENTER early for readers |
| **Drop onto candle #1** | "Oh, I'm the turtle" — mild **smile** | Non-gamers **confuse**: no "go right" signal | Forward-pull breadcrumb + reward always spawned right |
| **First jump** | Tap, hop, tap again, hesitate | **Confuse/bore** (2–3 non-gamers) — "did that do anything? am I stuck?" | Arc-honest candle spacing so one jump visibly travels + a reward on the landing |
| **First candle lesson** | Read, tap GOT IT, make the practice call, win it | The **one reliable smile** — *"oh, I GET it!"* | Push from told→shown to shown→deduced to make it "I figured it out" |
| **Explore the sparse chart** | Wander right, grab a few shells | **Bore** — "is this the whole world? what are these shells for?" | Market-breathing density + one shell referent + a micro-decision in the gap |
| **First trade setup** | Tap through 3 cards, tap "watch it play out" | **Flat** where it should be **confident** — feels like a EULA | Reframe cards as Finn's causal sentence + conviction tap |
| **The dip** | Watch the number go red | **Confuse** ("is this bad?") instead of **nervous** | Stage the scare: music thins, P&L pulses red, Finn goes worried |
| **Target hit / first win** | Grin, tap continue | **Under-excited** — the win shakes *less* than a loss | Add `shakeT` + shell-rain + Finn's biggest cheer |
| **Why-you-won card** | Read (or tap through to the trophy) | **Passive** — comprehension without ownership | One can't-fail retrieval tap before the trophy |
| **First loss (L2)** | "I did everything right and lost??" then reads "stop did its job" | **Flat relief** instead of **earned courage**; recovery reads as a handout | 3-beat felt arc (sting→rescue→pride) + "you didn't do anything wrong" |
| **Boss One** | Tap through 5 rounds | **Fatigue** by round 4–5; a misser feels the win was **luck** ("fumbled"); a **laugh** at "the cards never lie… mostly" | Trim to 3 rounds; split clean-vs-fumble copy; verify no untaught concept |
| **THE GAMBLER FALLS** | Read the title, feel it | **Pride** — the strongest second in the build — then the card gets **buried** by the Journal cinematic, and there's **nothing to share** | Let the card breathe; add a share button |
| **Continue** | Dismiss recap, save-or-later, resume | Momentum **bleeds out** in the first dead zone; "…now what?" | Save-copy borrows the pride + a "Fake-Out Eel this way →" breadcrumb |

**Net prediction (current build):** ~5–7 of 10 finish Boss One; the ~3–5 losses are almost entirely pre-trade (cold-open bounce + traversal wall). Those who reach the trade almost all continue (authored win) and beat the boss (unloseable). But even the finishers get a muted peak, so *"finished Boss One"* and *"wants Boss Two / tells a friend"* are **different, lower numbers.** **After the P0 punch-list:** 8–9 of 10 finish, they finish *smiling*, and the beta actually measures where the remaining 1–2 fell.

---

## Executive Review — the six lenses

*Synthesis of the Nintendo, Duolingo, Supercell, Valve, investor, and beginner reads. Each is a distinct pair of eyes on the same build; where they agree, the finding is load-bearing.*

### 🎮 Nintendo Creative Director — first-glance delight & "no boring moment"
**Verdict:** a beautifully-architected game chronically under-selling its own best moments — the failure is FEEL and PACING, not design. Three sins would send it back: (1) the game **opens on ~30s of zero agency** — a beginner's first action is to WAIT, which no Nintendo game ships; (2) the **first win shakes the screen less than a routine loss** (the party quieter than the funeral); (3) the **pre-trade traversal is a boredom wall** with no forward compass and jumps that feel like they don't advance. Underneath: the authored drama is computed and discarded everywhere. Almost none of the fixes are new architecture. **Finish estimate:** 5–7/10, gated by the traversal wall, not the boss → 9–10/10 after the P0 traversal + cold-open + first-win work. **Weakness:** the smile is deferred to the candle lesson — move it earlier.

### 🦉 Duolingo Product Lead — learn-by-doing, never-confuse, understanding vs recognition
**Verdict:** warm, well-sequenced, never tests the untaught (mostly — see the boss verification) — but it teaches **RECOGNITION, not UNDERSTANDING**. Every pre-boss rep is authored to succeed, so the learner **never commits a read, is told they're wrong, and corrects** — the core Duolingo loop is absent. A player can earn "CANDLE READER" having received zero honest negative feedback on their own judgment. **The two best fixes are load-bearing pedagogy, not polish:** the retrieval tap on reflection and the conviction tap on the trade belong at **P0**. Reframe "GREEN=UP" to "the buyers WON" (an arrow vs a cause). Add an in-session **streak/combo meter** — the strongest retention primitive, currently missing. **Finish estimate:** 6–8/10 finish, but not because they learned — ask a finisher "green means buyers or sellers won?" and a meaningful fraction won't be sure.

### 🏰 Supercell Game Designer — hook, retention loop, shareability
**Verdict:** three structural holes the review under-rates in severity. (1) **Time-to-first-tap is ~30–40s** — would fail a soft-launch D1 gate; (2) **zero shareable artifact** at the two most screenshot-worthy seconds; (3) the **inverted reward curve** (loss shakes, win doesn't). The boss being unloseable means retention is a *front-of-funnel* (reach the trade) and *back-of-funnel* (why come back / tell a friend) problem, not a difficulty problem. **Missing:** a between-session hook — no streak, no next-boss dangle at Continue. **Finish estimate:** ~6/10, none lost *at* the boss. Get time-to-first-tap under ~8s + a forward-pull breadcrumb → 8–9/10. The deeper worry is what happens *after* the boss (no share card, no return hook) — which is easy to miss in a playtest that ends at "THE GAMBLER FALLS."

### 🔬 Valve UX Researcher — silent failure & what real players DO
**Verdict:** ~90% right review with one structural blind spot — it treats each leak as independent when in the real funnel they **compound multiplicatively** and cluster in one 3-minute pre-trade window. The single most important number is hidden: how many of 10 reach the trade at all (~cold-open 0.85 × traversal 0.65 ≈ *half*). **The beta-killer is silent failure:** the pre-trade quit-points are exactly where telemetry is least confirmed, so the beta can "succeed" (survivors report fun) while never seeing the 4–5 who died in the first 3 minutes. **Add/confirm a fired-and-received event at each silent quit-point** (`cinematic_unpainted_2s`, `first_movement`, `stall_4s_no_progress`, `reached_first_setup`, `completed_first_trade`, `beat_guardian_1`) and re-verify `ALLOWED_ORIGINS` — this is the highest-leverage *non-code* action and deserves its own P0. Also: the **bored gamer** quits faster and more silently than the confused non-gamer — don't optimize only for the non-gamer canary. **Finish estimate:** 4–6/10 today; 7–9/10 after the P0s *and* only if the funnel is instrumented.

### 💰 $10M Investor — finish, understand, invest, share, pay
**Verdict:** **the wedge is REAL** — the core pedagogy (candle lesson → authored-fair trade → taught-before-tested boss, learning gated before dopamine, an authored stop-protected first loss) is genuinely differentiated, not an edtech reskin. **But not yet fundable on current delivery,** because the four things that convert this into a business are the four weakest links and all four are cheap: (1) invisible offer, (2) under-dramatised trade, (3) zero virality, (4) pre-trade funnel leaks. None require new architecture. **Recommendation: fund contingent on** a felt-stakes staging pass + the invisible-offer fix + a share card, then re-judge on the beta's face-on-the-dip observation and `boss_encounter→boss_defeated` telemetry. The concept clears the bar; the current build's delivery does not yet — but the gap is a 4-day punch-list, not a rebuild.

### 🧒 Complete Beginner — moment-by-moment, an intelligent 10-year-old
**Verdict:** the review's thesis matches what I actually *feel* — the architecture is right; the leaks are felt-experience and dead time. My arc: mild curiosity (website) → **near-boredom in the empty traversal** (first quit-risk) → a genuine **"oh, I GET it!"** at the candle lesson (the one delight) → **flatness at the first trade**, which should be the peak → a **polite, under-juiced first win** → a boss that may quiz me on a word ("doji") I was never taught. The single moment I'd first get excited about trading — the dip that scares me and the recovery that rescues me — is authored in the data and muted in delivery. **That's the whole game, one felt-stakes staging pass away from working.** **Finish estimate:** 5–6 of 10 finish the first hour *intact* (reach the boss AND feel they earned it); "finished Boss One" and "wants Boss Two" are not the same number today.

### Where the lenses converge — weaknesses, missed opportunities, emotional flat spots

- **The three unanimous critical findings:** (1) the ~30s zero-agency cold open, (2) the first win quieter than the loss, (3) the pre-trade traversal wall. Every lens names all three.
- **The recurring pattern:** authored drama (the dip, Finn's worry, the loss, the villain, the goal) is **computed and discarded** — thrown at the player as text, hidden behind SKIP, or left un-juiced. The fix everywhere is "point the juice you already have."
- **Emotional flat spots:** the dip (narrated), the first win (informational), the first loss (footnote), the inter-setup dead zones (anticipation-free corridors), and level-ups (quiet toasts next to a well-juiced boss).
- **Missed opportunities:** no share card at any peak, the Market Maker vanishing into a counter, reflection told-not-retrieved, the notebook's blank-page cold open, the invisible offer, Finn's computed emotion never reaching his face.
- **The one correctness risk (not a flat spot):** the boss round playlist must be verified against what the golden path teaches — the "never test the untaught" law may be violated at the graduation moment.

---

## Success-Metrics check — true by Boss One today?

*For each success statement: is it true for a typical beginner by the time they beat the Gambler? If not, the change that makes it true.*

| Success statement | True by Boss One today? | The change that makes it true |
|---|---|---|
| **"I know what a candlestick is"** | ✅ **Yes** — the candle lesson is the reliable delight; taught-before-tested, colorblind-safe | Push shown→deduced to deepen it, but it already lands |
| **"I understand why prices move"** | ⚠️ **Partial** — implied on the site ("every choice draws these charts"), never taught by doing pre-boss | One Finn micro-line at the candle lesson: "every candle is a tug-of-war — buyers pull up, sellers pull down." Otherwise drop it from the Boss-One scorecard |
| **"I know why I entered my trade"** | ❌ **No** — the guide names entry/stop/target but not the causal "because momentum" | Reframe the 3 guide cards as Finn's cause→choice→safety→reward sentence + the conviction tap |
| **"I understand why I won"** | ⚠️ **Asserted, not owned** — the card tells; the eager player taps through it | The can't-fail retrieval tap ("Why did this win?") makes it self-produced and self-reported |
| **"I feel smarter than 15 minutes ago"** | ✅ **Yes** — the LESSONS MASTERED checklist + "CANDLE READER" title deliver this well | Protect it; let the pride card breathe before the Journal cinematic buries it |
| **"I want the next lesson"** | ✅ **Mostly** — the "some candles lie" teaser is a good curiosity gap | Reinforce it on the chart after Continue, not only on the victory card |
| **"I want to beat the next boss"** | ⚠️ **At risk** — depends on the graduation feeling *earned*, which the fumble-copy and untaught-round risk undermine | Split clean-vs-fumble copy + verify the round playlist + keep the villain present ("nine stand between you and me") |
| **"I would recommend this to a friend"** | ❌ **No vehicle** — the two most shareable seconds have no capture affordance | The share card at First Win / THE GAMBLER FALLS (Finn + villain + the player's stat) |

**Read:** 3 of 8 metrics are solidly true by Boss One (candlestick literacy, feeling smarter, wanting the next lesson). The other 5 are either asserted-not-owned or have no vehicle — and **every one of the 5 is fixed by an item already on the punch-list.** The metrics that gate the *business* (why I entered, why I won, recommend, beat the next boss) are precisely the ones the felt-stakes + retrieval + share-card + boss-verification work turns from "no/partial" to "yes."

---

## THE FINAL ANSWER — Top Changes (prioritized)

> **What changes most increase the chance 10 beginners finish Boss One, understand trading, get emotionally invested, tell a friend, and pay to continue?**

Ranked by **impact-per-effort.** Effort: S (hours) · M (a day) · L (multi-day). Every change uses a ratified system — none invent architecture. **The top 8 are the 4-day pre-beta punch-list.**

| # | Change | Priority | Effort | Impact | Ratified system it uses |
|---|--------|:---:|:---:|--------|-------------------------|
| **1** | **First-win juice pass** — add `shakeT` + full-screen shell-rain + rising swell + Finn's §8 #97 wiggle to the once-ever `celebrate()` branch (:11980), learning-gate untouched | **P0** | **S** | Retention + Virality — the peak dopamine that makes "one more" involuntary; the party finally louder than the funeral | `celebrate()` / Finn Animation |
| **2** | **Traversal forward-pull** — breadcrumb + reward-always-right + arc-honest first-jump spacing + landing reward; gate BOOST/TUCK to terrain | **P0** | **S–M** | Retention — closes the #1 pre-trade funnel leak; nothing downstream monetizes if non-gamers never reach the trade | Level design (physics untouched, #4) |
| **3** | **Cold-open safety net** — poster-paint-gated timer (instant static villain) + fast auto-skip to the goal card if unpainted by ~2.5s + preload the poster in `play.html` | **P0** | **S–M** | Retention — turns the worst-case black-screen first impression into "a villain still + a clear quest," at the moment 10 evangelists form their opinion | `#mmTeaser` / `showSkipCard` |
| **4** | **Dramatise the trade dip** — juice on the existing `beat()` hooks (music thin, P&L red-pulse, sting+shake on target) **+ connect the computed `shellEmotion='worried'` (:12824) to Finn's Shell-Check overlay** + causal guide cards + conviction tap | **P0** | **S–M** | Retention + Monetization + Learning — the felt-stakes fulcrum for WTP and addiction; the trade's arc finally has a witness | `tradeDrivenCandle` / Finn Expression (founder pre-flight, #9; no outcome change) |
| **5** | **Retrieval tap on reflection** — "Why did this win? [I waited ✓] [I got lucky]" before the trophy, tap = the dismissal | **P1** | **S** | Learning + Retention — converts "read the answer" into "recall the answer," the biggest memory lever; makes "I know why I won" self-produced | Curriculum Engine / Finn |
| **6** | **Stage the authored first loss** — 3-beat felt arc (sting→rescue→pride) + "you didn't do anything wrong" recovery framing + resilience tally | **P0** | **M** | Retention + Learning — turns a fair-but-flat footnote into earned courage; the anti-churn beat at the moment beginners quit | Finn Expression / verdict card (loss logic untouched, #9) |
| **7** | **Goal card on the happy path** — surface `#introSkipCard` (:16886) as a legible beat at cinematic end, not only on SKIP | **P1** | **S** | Retention + Monetization — every player receives the quest spine (the value bridge to $25), not just the quitters (founder-gated) | `showSkipCard` |
| **8** | **Make the offer visible + mint the share card** — one "Play the first 3 Guardians free" line on the site + at Continue; a save/share card at First Win + THE GAMBLER FALLS (Finn + villain + the player's stat) | **P1** | **S** (copy) / **M** (card) | Monetization + Virality — WTP can't form against an invisible offer; the only zero-cost acquisition channel at the two peak moments | Website copy / `drawHeroFinn` + villain poster |
| — | *— punch-list line (top 8 above) —* | | | | |
| 9 | **VERIFY the boss playlist** — confirm `BOSSES[0].rounds` tests only taught concepts; if doji/wick-rejection are present, trim to candle · whowon · predict or add the teach beats | **P0** (correctness) | S | Learning — protects "never test the untaught" at the graduation moment | Curriculum gate (#2, founder-gated content edit) |
| 10 | **Confirm the funnel telemetry** — a fired-and-received event at each pre-trade quit-point; re-verify `ALLOWED_ORIGINS` post-deploy | P0 (beta-integrity) | S | Turns the 10-friend beta from vibes into data; prevents "shipped and learned nothing" | Telemetry / edge-fn |
| 11 | **Let the pride card breathe** — hold `vicG1` ~1.5–2s (or tap-gate) before the Journal cinematic overlays it (:10289) | P2 | S | Retention — protects the strongest emotional second from a tool tutorial | `vicG1` sequencing |
| 12 | **Trim Guardian 1 to 3 rounds** for the beta (or ship 5 + watch drop-off) | P1 | S | Retention — removes the last pacing wall before the payoff | Boss content map (#2, founder call) |
| 13 | **Keep the Market Maker present** — one taunt after the Gambler + his face on the "X remain" progress node | P1 | S | Retention + Virality — sustains the want-to-defeat pull through the free bosses | MM voice + poster |
| 14 | **Annotate the replay** — Finn callouts on the existing JOURNEY tags (DIP → HELD → confirmation → target); surface the review after the FIRST trade | P1 | M | Learning + Virality — a free second teaching rep + a shareable annotated replay | Replay/JOURNEY / Finn |
| 15 | **Auto-write the notebook's first entry** — an earned identity-rule card, not a blank textarea; defer the composer out of hour 1 | P1 | M | Retention + Monetization — an earned-rule shelf the paywall can light up | Notebook data model |
| 16 | **Reframe the candle lesson to shown→deduced** + "the buyers WON" copy | P1 | S | Learning — active encoding on the game's best moment | LessonChart / prediction practice |
| 17 | **Save-copy borrows the pride** + forward-pull breadcrumb at Continue | P1 | S | Monetization + Retention — the highest-intent conversion beat + carries momentum across the handoff | `promptSaveProgress` / coach floater |
| 18 | **Density + shell referent + Forex chip** — market-breathing candles, one shell meaning, a 7th market chip | P1–P2 | M | Monetization + Learning — defends "THE CHART IS THE WORLD" and completes the transfer claim | Visual Market Constitution / website |
| 19 | **Level-up banner + level names** — "LEVEL 3 — you can now read STRUCTURE" + tally fly-in; gate veteran boss jargon behind `bossesDone≥2` | P2 | S | Retention + Learning — every progress beat feels proportional; keeps the first boss legible | `celebrate()` / floaters |
| 20 | **Finn-first cinematic beat** + reactive Shell-Check named early + boss courage beat | P2 | S | Retention + Virality — the companion (safety) precedes the villain (threat); the signature gesture becomes readable | Finn Expression / `FinnLife` |

### The 4-day reading of the punch-list

- **Items 1–4 are launch-blocker class** — the felt-stakes spine and the two funnel gates (cold-open, traversal). They are what move the finish rate from ~5–7/10 to 8–9/10 and the peak from "polite" to "involuntary one-more."
- **Items 5–8 are near-free multipliers** — retrieval, the authored-loss staging, the goal card, and the offer/share card. Each converts a "no/partial" success metric to "yes" for the cost of copy + one existing surface.
- **Items 9–10 are not features — they are the beta's insurance.** Verify the boss doesn't test the untaught, and verify the funnel actually reports. Without them the beta can ship, "succeed," and teach the founder nothing.
- **Everything below 10 is real upside that fits if the top 10 land early** — but if the window tightens, the top 10 are the whole roadmap.

**The single most important non-code action:** sit beside each of the 10 friends and *watch their face* on the dip and on the first loss. That observation ×10 is the decisive evidence for whether the felt-stakes staging (items 1, 4, 6) is the entire remaining roadmap or already good enough — and it is the one thing no amount of telemetry can replace.

---

*End of review. All findings grounded in `chart-quest.html` (build ~266, branch `site/rc1`) and `website/index.html` (RC1). No code, gameplay, or architecture was changed. Every recommendation uses a ratified system. The one item that must go to the founder as a decision, not a fix: whether the `#introSkipCard` goal card belongs on the happy path — because right now the clearest statement of the game's promise is shown only to players who quit.*
