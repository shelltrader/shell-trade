# Chart Quest — First 15 Minutes Implementation · Post-Implementation Report

All six approved improvements are implemented, plus the cinematic SKIP and Guardian-fantasy
seeding. The game parses clean (4/4 scripts), `index.html` is byte-identical to
`chart-quest.html`, and the service worker is bumped **v33 → v34**.

**Nothing on the DO-NOT-CHANGE list was touched.** Guardian roster, names, order, artwork,
realms, lore, curriculum, concept-unlock sequence, boss ladder, economy, XP, shells, ranks,
trade-setup logic and concept gating are all unchanged. Every reward I added uses the
*existing* `player.shells += …` / `addXP(…)` economy; no new economy rules were created.

---

## 1. Every file modified

| File | What changed |
|---|---|
| `chart-quest.html` | All onboarding/first-15-min logic (controls coach, goal HUD, first-win reward, first real trade, deferred auth, Gambler reframe, cinematic SKIP). |
| `index.html` | Re-synced — byte-identical to `chart-quest.html`. |
| `sw.js` | Cache bumped **v33 → v34** so clients pick up the new build. |

No other files were changed. `dashboard.html` and the progression data are untouched.

---

## 2. Every onboarding change

- **Controls taught contextually, from the first seconds.** New `coach` system shows one
  hint at a time — *TAP to JUMP → SWIPE UP to BOOST → SWIPE DOWN to TUCK* — each dismissed the
  moment the player performs that action (hooked into `jump()`, `fireJetpack()`, `shellTuck()`)
  or auto-advanced after 7s so it never nags. The old controls card that used to appear
  *after* the first boss is removed.
- **Goal clarity in the first seconds.** New `drawIntroRunOverlay()` paints a fading mission
  line (*"Grow 🐚 · Out-trade 11 Guardians · Escape the market"*) and a persistent
  **GUARDIAN 1 / 11** chip — answering why/what/progress through UI, not a text wall.
- **Intro flow re-sequenced** to: Flash Quiz → Prediction Bet (first win) → first REAL trade →
  The Gambler. The legacy candle-count "bet portal / boss portal" spawns were removed in favor
  of explicit chaining, so nothing double-fires.
- **The hour timer no longer collides with the intro.** Hour-fail and hour-end are now
  suppressed while the intro runs (they previously could fire the intermission mid-intro);
  `introComplete()` starts Hour 1 cleanly.
- **Cinematic SKIP** added (top-right, all phases except the final title) — memorable opening
  preserved, but never a wall.

---

## 3. First-win implementation details

- The **Prediction Bet** is the first-win vehicle (its first card is already telegraphed — a
  green, rising forming-candle — so a sensible read wins).
- New `awardIntroBet(correct)` fires **once**, the instant the candle resolves: on a correct
  call it pays **+40 🐚 and +15 XP** (constant `INTRO_BET_REWARD`, so the number shown always
  matches the number awarded), plays the coin SFX, and writes a **journal entry** ("Your first
  win — you called the close before it printed").
- The reward is drawn **inside** the bet card (`+40 🐚 +15 XP`), because the bet overlay covers
  the canvas where floaters would be hidden.
- Framing reads as a decision, not a handout: *"✅ YOU CALLED IT!"* → reward. The journal entry
  is tagged `setupType:'prediction'` so it records the milestone **without** touching the
  `stats.trades` trade counter.

---

## 4. First-trade implementation details

- After the first win, `beginIntroFirstTrade()` resumes live play and opens a **single guided
  window** (`introFlow.awaitingTrade`) in which the normal setup system surfaces one real
  **OPPORTUNITY**. `setupCountdown` and `market.eventIn` are nudged so it appears within a few
  candles.
- The player takes it through the **real trade flow** (banner → trade panel → direction →
  confirm → resolve over candles). It is a genuine opportunity, trade and outcome.
- **Beginner-safe wording only.** During this window `showBanner` forces a generic label, so
  no `BOS / ChoCh / OB / VWAP / Confluence` appears (the panel title is the static
  "TRADE SETUP", the portal reads "OPPORTUNITY", chart labels stay cue-only because
  `conceptTier` is 0 for a new player). The jargon-heavy grade card is replaced with a simple
  *"✅ FIRST TRADE — WIN!"* recap during the intro.
- When the trade resolves, the boss is cued ~2.6s later (`triggerIntroBoss`), which first
  clears any open lesson card so it never collides with the reveal.
- **Fallback:** if the player keeps skipping, the boss triggers after 30 free-roam candles, so
  the intro can never stall.

---

## 5. Authentication flow changes

- **The auth wall no longer appears before gameplay.** On first play, the cinematic now hands
  the player **straight into the game as a guest** (boot callback calls `resolveAuth()` with
  the chosen chain instead of showing the overlay). A "👤 SIGN IN" button remains available.
- **"Save your progress?" is shown after The Gambler.** New `window.promptSaveProgress()` is
  called from `introComplete()` (~0.8s after the win). It reuses the existing auth overlay,
  defaulting to **Sign Up**, titled *"⚔ You beat The Gambler — save your progress?"*, with the
  guest button relabeled *"Maybe later — keep playing."*
- **Guest mode preserved, and the running game is protected.** A `_savePromptMode` guard makes
  both the guest dismissal and a successful in-game sign-in/up simply close the overlay
  (and push the guest's local shells/rank/journal to the new account) **without** re-initialising
  the world. Already-signed-in players are never prompted.

---

## 6. Gambler presentation changes (no rounds/rewards touched)

- Encounter tag for Boss 0 changed from *"🎓 INTRO BOSS"* to **"🎲 FIRST GUARDIAN — OUT-TRADE
  HIM."**
- Win screen for Boss 0 now names the lesson — **"🎯 Skill beats gambling — you read the
  chart, you didn't guess."** — and seeds the ladder fantasy: **"⚔ 10 more Guardians stand
  between you and the Exit Block. Who's next?"**
- His **rounds (candle / predict / error), rewards (200 🐚 / 80 XP), art, dialogue and lore are
  unchanged.** Only framing and feedback were altered, exactly as specified.

---

## 7. Risks introduced

- **First-trade reliability (low–medium).** The guided trade depends on the live setup system
  producing an opportunity in the window. It's nudged to appear within a few candles and has a
  30-candle fallback to the boss, but on a rare cold streak a player could reach The Gambler
  having taken the prediction win but skipped/abandoned the live setup. They still get a real
  trade the vast majority of the time; the fallback guarantees no stall.
- **Prediction win in the journal (low).** The first win adds one journal entry, so the
  journal-derived win-rate view includes it (favorably). It does **not** affect the separate
  `stats.trades` counter.
- **Auth-prompt timing (low).** If a player ignores the post-Gambler save prompt and reloads as
  a guest later, they'll see the normal auth screen on next launch (existing returning-visitor
  behavior, guest still works). No data loss for guests beyond the existing guest model.
- **QA harness note (not a player risk).** As before, the automated QA loop freezes the
  auto-walk, so the new intro flow is best verified in real play; all logic was syntax- and
  reference-checked, and the chain (`quiz → bet → trade → boss → introComplete`) is intact.

No locked system is at risk — the changes are sequencing, presentation and additive UI.

---

## 8. New estimated timeline for the first 15 minutes

| Time | Moment |
|---|---|
| 0:00–0:50 | Cinematic hook (now **skippable**) → pick a chain → drop **straight into the game as a guest** (no auth wall). |
| 0:00–0:30 | **Controls learned by doing** — TAP/BOOST/TUCK coach hints, one at a time. Mission line + **Guardian 1/11** chip make the goal clear immediately. |
| ~1:00–2:00 | Jump the candle tops, collect shells, reach the **Flash Quiz** (read the candle). |
| **~2:00–3:00** | **Prediction Bet → FIRST WIN** — call the close, earn **+40 🐚 +15 XP**, first journal entry. "I got that right." |
| **~3:00–4:30** | **First REAL trade** — a live OPPORTUNITY taken through the real trade flow, first profit, beginner-safe wording. |
| **~4:30–6:30** | **The Gambler** — cinematic reveal, "out-trade him," win → *skill beats gambling* + "10 Guardians remain." |
| ~6:30–7:00 | **"Save your progress?"** at the moment of pride (guest may decline and keep playing). |
| ~7:00–15:00 | **Hour 1 proper** — recurring opportunities, the core loop, optional lesson portals, building toward **Guardian 2 (the False-Breakout Eel)**. |

**Net effect:** controls understood in ~30 seconds (was ~5 min), first win by ~3 min, first
real trade by ~4–5 min, first Guardian beaten by ~6 min, and the signup ask moved from
"before the fun" to "right after the first victory" — with *"this is a trading game"*
reinforced at every beat.

*Implementation complete. Synced to `index.html`; service worker at v34. Ready to deploy.*
