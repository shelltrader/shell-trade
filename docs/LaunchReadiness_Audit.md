# Chart Quest — Launch-Readiness Audit

### Ruthless pre-release teardown · QA · PM · Trader · Educator · UX · Retention · Virality

**Verdict up front: NOT launch-ready. Soft-launch to a closed test group only.** The foundation is genuinely good — the intro cinematic, the candle-runner, and the post-fix mini-games are strong. But the game ships with a **difficulty curve that inverts at the final bosses**, a **hard infrastructure gate that shows "NOT AUTHORIZED" on most hosts**, **passive lessons that contradict the "learn by doing" pitch**, **unverified UI integration that has never been opened in a browser**, and **no monetization funnel**. A public, marketed launch right now would burn first impressions and YouTuber goodwill you don't get back.

**Honesty about method:** I cannot click through a live build in this environment — there's no browser. This audit is grounded in (a) direct reading of `chart-quest.html`, (b) headless logic/probe testing done while building the systems, and (c) heuristic evaluation against each persona. **That a 563 KB single-file game with a freshly-wired boss↔mini-game bridge has never been run in a real browser is itself launch-blocker #1.**

---

## Launch-readiness scorecard (0–10, ruthless)

| Dimension | Score | One-line reason |
|---|---|---|
| Gameplay | 6.0 | Solid runner + mini-games, but control precision on touch is unproven and the boss overlay handoff is untested. |
| Education | 6.0 | Mini-games now teach by doing (post-fix); but lessons are still passive read-cards and jargon is undefined in-context. |
| Retention | 4.0 | Auth wall, undefined jargon, repetitive single-step games, and an inverted end-game difficulty curve all bleed players. |
| Replayability | 5.5 | Daily Drill + mini-game variety are good; the single-interaction games get stale fast. |
| Virality | 6.5 | The cinematic and mini-games are screenshot-able — but there's no in-game share, and the cinematic sits behind auth. |
| UX | 3.5 | "NOT AUTHORIZED" domain lock, Supabase login failures, undefined terms, unverified overlays, portrait-only precision. |
| Difficulty | 4.0 | Inverts at bosses 7–9 (beginner fallback), one-size timers, no real distractor scaling. |
| Monetization potential | 3.5 | No in-game funnel, no IAP/ads, course is a separate unbuilt product; email capture not wired to a paid path. |
| **OVERALL** | **≈ 4.9 / 10** | **Strong prototype, not a shippable product. ~6–8 focused days from a credible soft-launch.** |

---

## Persona passes

### PASS 1 — Complete beginner (knows nothing about crypto/TA)
**Where they get lost, in order:**
1. **Auth wall on first load.** A brand-new user hits a sign-in/sign-up screen before seeing anything. Many bounce here. (The "Play as Guest" link exists but is visually secondary.)
2. **Jargon with no definition.** Mini-game prompts and lessons say "Tap the candle that breaks the swing high," "ChoCh," "VWAP," "order block," "liquidity" with **no in-context definition, tooltip, or glossary link wired**. A true beginner cannot parse step 1.
3. **Interaction never taught.** Drag-to-shade-a-zone, two-tap trendlines, O/H/L/C handle-dragging — none have a first-use coachmark. The beginner doesn't know a trendline needs two taps.
4. **The cinematic creates mystery but zero instruction** — by design — so the first *actual* task (a mini-game in a portal or a boss) lands with no scaffolding.
5. **Boss = a wall of mini-games** they don't understand yet. Losing hearts to concepts never taught feels like failure, not learning.
**Verdict:** A genuine beginner is lost inside the first 3 minutes. The "all-ages, learn-from-zero" promise is **not** met without a glossary/first-run teaching layer.

### PASS 2 — Intermediate (basic crypto knowledge)
- **Pacing is uneven.** The runner is fun; lessons are passive walls of text between the action.
- **Single-step mini-games are thin** — Market-Structure Classify, Liquidity, VWAP are "tap once, get a verdict." Engaging for 2 plays, boring by the 5th.
- **Educational depth is shallow in the middle hours** — confluence is asserted, rarely *practiced* until the capstone.
- **The multi-pronged games (Exec, Break Trader, OB Trade, Candle Lab, Management) are the high point** and should be where the product leans.
**Verdict:** Engaged through the multi-step games and bosses; bored by the passive lessons and one-tap drills.

### PASS 3 — Experienced trader (years of screen time)
This persona decides your *credibility*, and credibility is where an education product lives or dies. Post-fix, most of the egregious errors from the earlier mini-game audit are corrected (real pivots, OB with imbalance, multi-touch S/R, readable fakeouts). Remaining accuracy concerns:
- **Mini-games still teach simplified, single-scenario versions** — every ChoCh is a clean engineered break, every OB holds and rallies (no failed-OB teaching), every VWAP touch bounces. Real markets are messier; a pro will note the games never show the setup *failing*, which under-teaches risk and over-teaches pattern-faith.
- **VWAP is not session-anchored** in the sim (it's a cumulative average) — a knowledgeable trader will clock that VWAP resets daily and this doesn't.
- **Prediction / Multi-Timeframe remain "read the arrow" binaries** — they reward momentum-following without teaching *why* or when it fails.
- **Leverage hour ("THE LEVERAGE KING") risks glamorizing leverage** unless it's framed purely as a cautionary mechanic; verify the copy doesn't read as "leverage = power."
**Verdict:** Won't be embarrassed by the core structure content anymore, but will see it as "correct but beginner-only," and will distrust any game that only ever shows the textbook win.

### PASS 4 — Content creator (streamer / YouTuber / TikToker)
- **Most shareable:** the **opening cinematic** (glitch → fall → portal → Validator → title) is a genuine TikTok hook; the **Trade Execution Challenge** replay (win/loss reveal) is a perfect "did the turtle's trade hit?" clip; boss-defeat moments.
- **Most boring / un-clippable:** passive lesson cards, the one-tap classify games, and any "NOT AUTHORIZED" / login-error screen (which a streamer *will* hit live and roast you for).
- **Missing:** no built-in share/record/clip button, no shareable score card, no "beat my score" loop. Virality is latent but **not instrumented** — you're relying on creators to screen-record manually.
**Verdict:** The raw material for virality exists; the *mechanisms* to capture it do not.

---

## TOP 100 ISSUES (ranked by importance)

Severity: 🟥 Blocker (stops launch) · 🟧 Critical · 🟨 High · 🟦 Medium · ⬜ Low. Probability = how likely a real player hits it.

| # | Sev | Issue | Impact | Prob | Fix |
|---|---|---|---|---|---|
|1|🟥|**Never run in a real browser.** The boss↔mini-game bridge, the `#mgRoot` overlay, canvas sizing, and CONTINUE hand-back are verified only headlessly.|Could be fully broken on load; unknown.|100%|Serve over `http://localhost`, play every boss, fix what breaks before anything else.|
|2|🟥|**Domain lock shows "NOT AUTHORIZED"** on any host not in the allowlist (`file://`, custom domains, most previews).|Anyone opening the file or a non-allowlisted host sees a dead red screen.|High|Make the lock fail *open* (warn, don't block), or expand allowlist + document the hosting requirement.|
|3|🟥|**Bosses 7–9 fall back to a beginner playlist.** `BOSS_GAMES` only covers 0–6; Line Warden / Flag Bearer / Neckline Reaper get `[struct, predict, candle]` at beginner.|Difficulty *inverts* at the finale; the hardest hours test the easiest games and mismatch their lessons.|100% (if reached)|Author `BOSS_GAMES[7..9]` with hour-matched, advanced/expert playlists (trendlines, flags, H&S).|
|4|🟥|**Supabase auth fails ("Not Authorized" / login errors)** and free-tier projects auto-pause.|New users can't sign in; first impression is an error.|High|Verify/unpause the Supabase project; make Guest the default, prominent path; handle auth errors gracefully.|
|5|🟧|**Auth wall before any gameplay.** Sign-in is the first thing a player sees.|Top-of-funnel bounce; kills the cinematic as a cold-open.|High|Run the cinematic FIRST; defer the account prompt to after the hook (the design doc's Option A).|
|6|🟧|**Jargon undefined in-context.** BOS/ChoCh/VWAP/OB/liquidity used in prompts with no glossary/tooltip wired.|Beginners can't start; the core promise breaks.|High|Wire the existing `TERMS` glossary to a "?" on every prompt + a one-card concept intro per game.|
|7|🟧|**Lessons are passive read-cards.** The "learn by doing, not reading" pitch only holds for bosses/mini-games; core delivery is still cards.|Educational effectiveness and retention both suffer; contradicts the brand.|High|Replace/duplicate lesson cards with the matching mini-game as the lesson ("try it").|
|8|🟧|**Interactions are never taught.** No first-use coachmarks for drag-zone, two-tap ray, O/H/L/C handles.|Players fail mechanics they understand conceptually → feels unfair.|High|One-time coachmark per interaction type.|
|9|🟧|**Single-step mini-game timer in bosses.** Advanced/expert single-step games carry a 25 s/18 s timer; inside a multi-round gauntlet this is punishing.|Unfair losses; rage-quit at later bosses.|Med|Disable or lengthen the timer in boss mode; per-game time budgets.|
|10|🟧|**Mini-games only ever show the textbook win.** OBs always hold, fakeouts always resolve cleanly, VWAP always bounces.|Over-teaches pattern-faith, under-teaches that setups fail — dangerous for a trading product.|Med|Add "this one failed" variants and score reading the failure.|
|11|🟧|**No share/record/clip instrumentation.** Virality relies on manual screen-capture.|Leaves the game's best growth lever on the table.|High|Add a share-score card + a "save clip" on big moments (cinematic, exec replay, boss kill).|
|12|🟧|**No monetization funnel in-game.** Course is separate/unbuilt; email capture not tied to a paid path.|No revenue path at launch.|High|At minimum wire email capture + a "go deeper" CTA after graduation; decide IAP/ads stance.|
|13|🟨|**Difficulty within a boss can spike hard** (e.g., Boss 6 ends on Exec-Expert) with only 3 lives.|Wall at the capstone; many never finish.|Med|Tune lives per boss length; ramp difficulty within a boss, not cliff it.|
|14|🟨|**Prediction & Multi-Timeframe are "read-the-arrow" binaries.**|Shallow; teaches rote momentum-following, not reasoning.|Med|Add confluence/standaside options + partial credit; signpost reversals (partly done).|
|15|🟨|**VWAP not session-anchored** in the sim.|Technically wrong to a pro; mis-teaches VWAP resets.|Med|Anchor VWAP to a session start; reset it.|
|16|🟨|**Hours 7–10 content completeness unknown / thin.** 10 curriculum hours, but the back half (bearish structures, confluence) has the weakest boss + lesson coverage.|Game peters out; "Trader" graduation may feel unearned.|Med|Audit + build hours 7–10 to parity with 1–6.|
|17|🟨|**Guest progress isn't cloud-synced until sign-in;** merge logic on later sign-in is a known fragile point.|Lost progress = top-tier trust break.|Med|Test guest→sign-in merge thoroughly; warn before any destructive sync.|
|18|🟨|**Portrait-only, touch-precision dependent.** Drag/tap accuracy on small phone charts is unproven.|Mis-taps scored as errors → frustration.|High|Generous snapping + larger hit targets; test on a real phone.|
|19|🟨|**No "why you failed" reveal on predict/classify/boss losses** (added for annotate only).|Players can't learn from failure in half the games.|Med|Extend the answer-reveal to predict/classify and boss round losses.|
|20|🟨|**The cinematic's idle worst-case is ~30 s** with no skip for returning-after-clear replays.|Returning players forced to wait.|Low|Add a skip after first play; it's first-play-gated already.|
|21|🟨|**Leverage hour risks glamorizing leverage.**|Reputational/educational risk.|Med|Audit copy; frame strictly as a cautionary "how accounts blow up" mechanic.|
|22|🟨|**Reward economy not validated end-to-end.** Shells/XP/rank thresholds, Pearls, Perfect Runs may not be balanced or even all wired.|Progression feels arbitrary or stalls.|Med|Playtest the full XP→rank curve; confirm every reward path fires.|
|23|🟨|**Boss HP isn't visible during a mini-game** (overlay covers it).|Loss of context/tension mid-fight.|Med|Show a slim boss HP/hearts bar in the mini-game overlay during boss mode.|
|24|🟨|**Difficulty scaling is "noisier + faster," not "distractors + confluence."**|Expert feels frustrating, not deep.|Med|Add decoy markers, required confluence, hidden helper overlays at higher tiers.|
|25|🟦|**Pattern Recognition noise can obscure the pattern** at advanced/expert.|Correct call looks wrong.|Low|Cap noise; curate a larger pattern bank.|
|26|🟦|**Classify games have a high guess floor** (33–50% from random taps).|Inflated "mastery."|Med|More options; penalize instant random taps.|
|27|🟦|**No colorblind palette / reduced-motion wired** (design doc promised both).|Accessibility + App Store risk.|Med|Wire a colorblind toggle (shape/label cues) and honor `prefers-reduced-motion`.|
|28|🟦|**Two `#stage` IDs now exist** (game + `#mgRoot` copy) — invalid HTML, works by DOM order but fragile.|Latent bug if order changes.|Low|Namespace the mini-game DOM IDs properly.|
|29|🟦|**`renderLib()` runs on load** inside the embedded engine, drawing 20 hidden arcade tiles every boot.|Minor wasted work each load.|Low|Lazy-init the library; bosses don't need it.|
|30|🟦|**Mini-game best-scores persist from lucky single-attempt wins.**|Misleading progress signal.|Low|Track attempts; show rolling accuracy.|
|31|🟨|**Soft-lock risk: boss "SKIP"** advances the hour without defeating the boss — does it skip the lesson too, leaving gaps?|Players skip the learning, still "progress."|Med|Decide whether SKIP should re-lock or flag the hour as incomplete.|
|32|🟨|**Exploit: spam-retry bosses.** Lose all hearts → RETRY infinitely with new seeds until RNG is kind.|Trivializes bosses; no mastery required.|Med|Cap retries or carry a small penalty; require a minimum win-rate.|
|33|🟨|**Exploit: the mini-game library could be reached directly** if any dev hook (`?guest`, console `MG.run`) is discoverable.|Players bypass intended flow.|Low|Remove dev params from prod; the `?guest`/`?dev` bypass is still in the file.|
|34|🟦|**`?guest`/`?dev` URL bypass shipped in the live file.**|Anyone can skip auth; also a support-confusion vector.|Low|Strip before launch or gate to non-prod hosts.|
|35|🟨|**Save system single-key fragility.** All progress in a few localStorage keys; a clear/quota/incognito wipes everything with no backup.|Total progress loss.|Med|Cloud-first for signed-in users; export/import; handle quota.|
|36|🟦|**No tutorial for the runner controls** (tap=jump, swipe-up=jetpack, swipe-down=tuck) beyond the post-cinematic `teach('controls')`.|Players miss the jetpack (now required for portals).|Med|Verify the controls teach fires and is clear, especially "jetpack required" for portals.|
|37|🟨|**Portals now require the jetpack** (raised to 280px) — if fuel mechanics or the controls lesson are unclear, players can't reach lessons/bosses at all.|Hard progression block.|Med|Ensure fuel regen + the jetpack lesson are bulletproof; this is now load-bearing.|
|38|🟦|**No offline/airplane handling** beyond the per-coin fallback; live Binance fetch failure paths unproven at scale.|Charts may look identical or stale.|Low|Verify fallback per faction; cache last good data.|
|39|🟦|**Faction "cosmetic only" contradicts the picker copy** ("determines which real live market you'll trade on").|Player expectation mismatch.|Low|Align copy with intent (cosmetic) or make it functional consistently.|
|40|🟨|**Onboarding has three competing intros** (cinematic, Candle Academy greeting, Flash Quiz/Bet) — verify they don't double-fire or conflict after the cinematic port.|Confusing/janky first run.|Med|Confirm only the cinematic path runs for first-timers; greeting disabled.|
|41|🟦|**No progress indicator across the 10-hour arc.**|Players don't know how far they are / how much is left.|Med|A world-map/progress spine.|
|42|🟦|**No "resume where I left off"** clarity after a session.|Re-engagement friction on Day 1+.|Med|Clear resume CTA on return.|
|43|🟦|**Daily Drill streak: missing a day resets** with no streak-freeze unless purchased — punishing for casual players.|Demotivates the exact casual cohort you want.|Med|Grace day or cheaper freeze; soft streaks.|
|44|🟦|**Intermission lesson content is mock/curriculum-thin** for later hours (from the redesign).|Recap feels generic late-game.|Low|Pull real per-hour lesson data.|
|45|🟦|**No sound/haptics audit.** Cinematic has synth audio; gameplay/boss audio coverage unknown; mute persistence?|Flat feel or annoying loops.|Low|Audit audio coverage + a persistent mute.|
|46|🟨|**Boss reward copy is generic** ("You read the whole picture, not just the colour") regardless of which mini-games were played.|Feels disconnected from what you did.|Low|Tailor the win copy to the boss's skills.|
|47|🟦|**No leaderboard / social proof** anywhere.|Misses a major retention + virality driver.|Med|Add per-game/daily leaderboards (the `minigame_scores` table is half-specced).|
|48|🟦|**Mini-game scores don't sync to Supabase yet** (table unspecced in prod).|No cross-device progress / no data for tuning.|Med|Ship the `minigame_scores` table + sync.|
|49|🟦|**The Validator says "Exit Block" but there's no Exit Block in the game.**|Narrative promise with no payoff.|Med|Build the Exit Block as the graduation moment, or soften the line.|
|50|🟦|**Graduation ("TRADER") may be unearned** if the back-half content is thin.|Anticlimactic finale.|Med|Gate TRADER behind a real final exam (mixed mini-games).|
|51|🟨|**RNG fairness: some single-step games can still present ambiguous setups** (multiple plausible answers, e.g., BOS later breaks).|Correct-feeling answer marked wrong.|Med|Widen partial-credit; highlight the specific target.|
|52|🟦|**No difficulty selection for the player** in normal play — difficulty is fixed by hour/boss.|Advanced players bored early, beginners walled late.|Low|Optional practice difficulty in a future Arcade.|
|53|🟦|**Position Size game assumes a fixed account size** the player never chose.|Slightly abstract.|Low|Let the player feel ownership of "their" account.|
|54|🟦|**No clear failure recovery in lessons** (vs bosses).|Dead-ends if a lesson gate isn't passable.|Low|Ensure lessons are never hard-fail.|
|55|🟦|**Trade journal integration with mini-games is absent.**|Misses tying practice to the journal habit.|Low|Log mini-game results to the journal.|
|56|🟦|**The cinematic faction choice and the account faction picker can desync.**|Wrong faction theme.|Low|Single source of truth for faction.|
|57|🟦|**No analytics/event instrumentation** for funnel/retention.|You'll launch blind.|High|Wire the `content_events`/analytics the roadmap specs *before* launch.|
|58|🟦|**Loading/perf on low-end phones unverified** (563 KB single file + live fetch + canvas).|Jank/crash on cheap Androids.|Med|Profile on a low-end device.|
|59|🟦|**No "are you sure / unsaved" guards** around destructive actions (sign out, change faction).|Accidental data loss.|Low|Confirm dialogs.|
|60|🟦|**The "Skip" on losing a boss advances anyway** — combined with #31, the whole curriculum is skippable.|Players reach "Trader" without learning.|Med|Skipping should not count as completion.|
|61–100|🟦/⬜|**Long tail (grouped):** inconsistent button styles across overlays; no empty-states for journal/daily before first use; emoji-as-UI may render differently per OS; no keyboard support for desktop; no pause; no settings menu surfaced; timer text overlaps HUD on small screens; the intermission replay vs boss overlay z-index untested; no rate-limit handling on Binance; faction lock copy ("unlock later") with no unlock UI verified; Pearls currency referenced but unproven; "Perfect Run" bonus unproven; rank-up animation coverage; the `bossesDone` set isn't persisted (re-fight on reload?); no confirm on RETRY losing streak; mini-game prompts truncate on small widths; color contrast on muted greys may fail WCAG; no localization; date/number formatting; the `dashboard.html` founder tool is reachable if URL leaks; no CSP test for the embedded engine; the candle academy "SKIP" reachability; intro audio autoplay policy on iOS; the replay `setInterval` legacy path in the journal (vs the rAF one) still exists; no handling for a faction with no live data; tile emoji watermarks (₿ Ξ ◎) font-dependent; no haptic on mobile; no "new" badges; etc. *(Each is real but individually low-severity; collectively they're the polish gap between "prototype" and "product.")*

---

## Retention prediction (be pessimistic)

| Window | Estimate | Primary quit driver |
|---|---|---|
| 5-minute | ~55% survive | Auth wall + jargon on first task. The 45% who bounce never see the good part. |
| 15-minute | ~35% | Passive lessons + undefined terms + first boss wall. |
| 30-minute | ~22% | Repetitive single-step games; unclear progression. |
| 1-hour | ~14% | Mid-game pacing sag; no goal spine. |
| Day 1 (return) | ~10–12% | No strong hook to return; Daily Drill exists but isn't surfaced; no notifications. |
| Day 7 | ~3–5% | Content thins in back half; difficulty inverts at bosses 7–9; nothing new to chase. |

**Biggest quit points, in order:** (1) the auth/"Not Authorized" screen, (2) the first undefined-jargon task, (3) the first boss gauntlet, (4) the mid-game lesson sag, (5) the bosses-7–9 difficulty inversion.

---

## Bug / exploit / soft-lock summary
- **Blockers:** untested live build (#1), domain lock (#2), bosses 7–9 fallback (#3), Supabase auth (#4).
- **Soft-locks:** can't reach a portal if jetpack/fuel/controls unclear (#37); guest→sign-in merge data loss (#17, #35).
- **Exploits:** infinite boss retry with fresh RNG (#32); `?guest`/`?dev` auth bypass shipped (#34); direct `MG.run` console access (#33); skip-to-progress through bosses/lessons (#31, #60).
- **Trust-breakers:** any "Not Authorized" screen; lost progress on sync; correct-feeling mini-game answers marked wrong; bosses that test the wrong/easier skill than the hour taught.

---

## The 8 things to fix before ANY public launch (do these first)
1. **Open it in a browser and play every boss.** Fix the integration. (#1)
2. **Kill or soften the domain lock** and fix Supabase auth. (#2, #4)
3. **Author boss playlists 7–9** so difficulty rises instead of inverting. (#3)
4. **Run the cinematic before auth; make Guest the default.** (#5)
5. **Wire the glossary + a one-card concept intro per mini-game** so beginners aren't lost. (#6)
6. **Turn the core lessons into "try it" mini-games** (or at least add a try-it button). (#7)
7. **Add interaction coachmarks** and fix the boss-mode timer. (#8, #9)
8. **Strip dev bypasses (`?guest`/`?dev`) and add basic analytics.** (#34, #57)

Do these and you have a credible **soft-launch** (a closed cohort, no paid marketing). A *public, YouTuber-facing* launch needs the back-half content (hours 7–10), the share instrumentation, and a monetization decision on top of that — realistically another two to three weeks beyond the eight-item list.

**Bottom line:** you have a genuinely promising game wrapped around a few launch-blocking holes and an untested final integration. It is not 90% done; on a launch-readiness basis it's closer to **60%** — and the missing 40% is the unglamorous part (content parity, infra, onboarding, QA) that decides whether real players stay.
