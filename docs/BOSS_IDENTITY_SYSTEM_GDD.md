# Chart Quest — Boss Identity System
## Narrative / Art / Encounter Design Document (for approval — no code yet)

> Goal: turn 11 educational checkpoints into **memorable, marketable characters** of the Blockchain Ocean — without touching boss mechanics, educational content, lessons, concepts, or game length. This is a **re-skin + narrative + lightweight visual** layer over the existing `#bossFight` system.

---

## 0. Hard constraints (what does NOT change)

Each boss already tests a fixed set of concepts (its `BOSS_GAMES` round playlist) and has a fixed `BOSS_WEAKNESS` and arena (`BOSS_THEME`). **All of that stays.** Identity work only adds: name, portrait, personality, dialogue, lore, and polished intro/defeat/reward screens. No round, concept, weakness, reward value, or difficulty changes.

---

## 1. Reconciling your proposed ladder with the locked content

Your proposed 10-boss ladder is excellent, but the concepts each *existing* slot teaches are fixed, so I matched your creature names to the slots whose concept they actually represent (rather than forcing a re-order that would change the teaching sequence). Result: **9 of your 10 names map cleanly**, plus two slots that need original identities (the intro boss and the leverage boss), and three name-overlap flags.

**REVISED (per design direction): the ladder is now ordered by the LEARNING RAMP, not the original slot order.** The Trend Crab moves early — "reading the trend" is a foundational skill (the **CRAB rank** itself means "reads the trend"), so it belongs right after candles, *before* deep structure. Each creature keeps its best-fit arena; the arena + round playlist simply travel with the creature to its new boss number.

| Boss | Identity | Primary concept (teaching order) | Arena (travels w/ creature) | Was slot |
|---|---|---|---|---|
| Intro | **The Sprat Dealer** | candle basics | The Casino Floor | 0 |
| 1 | **The Reversal Eel** | read candles / don't get faked | Hall of Mirrors | 1 |
| **2** | **The Trend Crab** ⬅ moved earlier | **read the trend & its levels** | The Grid | was 7 |
| 3 | **The Structure Serpent** | BOS / CHOCH / order blocks | The Deep | 3 |
| 4 | **The VWAP Oracle** | VWAP / fair value | The Haunt | 4 |
| 5 | **The Risk Hydra** | survival: stop-loss, R:R, sizing | The Liquidation Pit | was 2 |
| 6 | **The Timeframe Titan** | multi-timeframe | The Tides | 5 |
| 7 | **The Margin King** | leverage discipline | The Throne Room | 6 |
| 8 | **The Order-Block Golem** | order blocks & patterns | The Citadel | 8 |
| 9 | **The Confluence Kraken** | reversals + confluence | The Crypt | 9 |
| 10 (final) | **The Market Maker** | confluence capstone | The Abyss | was 0 (intro) |

**Why this ramp is stronger (and why the Crab moving early *helps* learning):**
- **Read before manage.** New order is: candles → **trend** → structure → fair value (VWAP) → **risk** → timeframe → leverage → smart-money/patterns → confluence → market. You learn to *read a chart* (trend, structure, VWAP) before you're tested on *protecting* a trade (Risk Hydra at 5) — you can't risk-manage a setup you can't yet read. Risk *lessons* still appear early (stop-loss is taught up front); only the boss that **tests** risk waits until you have setups to apply it to.
- **Trend is the natural second skill.** After candles, direction/trend is the next thing every trader reads — putting the Crab at Boss 2 matches how the concept is actually introduced (trend/levels appear in the early-Hour intermissions) and pays off the **CRAB rank** ("reads the trend") right when you earn it.
- **The Crab keeps The Grid arena** (neon trendlines it scuttles along) — the visual still fits perfectly; it just shows up earlier in the climb.

*Implementation note:* this re-orders the `BOSS_THEME` (arena) and `BOSS_GAMES` (round playlist) assignments so each boss-number gets the matching creature's arena + concept set. No new concepts/arenas are created — existing ones are re-sequenced. Curriculum lesson text is unchanged (trend is already introduced early via intermission focus).

**Flags & recommended resolutions (need your call):**
1. **"The Market Maker" is currently the intro boss (slot 0).** Your ladder (rightly) wants it as the *final* boss. Recommendation: **move the Market Maker identity to slot 10** (the Abyss climax) and give slot 0 a humble new identity (**The Sprat Dealer**). Strong narrative payoff — the dealer who greeted you turns out to be a pawn of the Market Maker you face at the end.
2. **"Liquidity Leviathan" has no liquidity-primary slot** (liquidity is taught *inside* the Serpent and the Kraken, never as a boss's main concept). Options: (a) drop it, (b) re-skin the **Structure Serpent → Liquidity Leviathan** (slot 3 does test liquidity). Recommendation: keep Structure Serpent (its slot is structure-primary) and let liquidity be the **Kraken's** signature — but I'll build whichever you prefer.
3. **Rank-name overlaps:** your names *Crab*, *Leviathan*, *Kraken* echo existing **RANKS** (Crab=Lvl4, Leviathan=Lvl10). Recommendation: keep them (a boss and a rank sharing an animal reinforces the theme — "you became a Crab by beating the Trend Crab"), or rename the bosses to *Trendline Strider / Confluence Kraken* etc. I lean **keep** — it's good brand cohesion.

---

## 1.5 Re-evaluation: do the identities match the educational progression?

> The analysis below is what **drove the revised ramp in §1** — moving the Trend Crab early, relocating Risk to Boss 5, and giving the Market Maker a real capstone. The original-order mismatches it documents are all resolved by the new order.

I compared each boss against the curriculum **Hour it follows** (`openBoss(session.level)` fires at each Hour's end) — i.e., what the player has actually been *taught* by then vs. what the boss *tests*.

| Hour | Taught that Hour | Boss tests (rounds) | Identity | Verdict |
|---|---|---|---|---|
| 1 | candles, long/short | candle, error, **struct** | Reversal Eel | ⚠ `struct` not taught until H3 |
| 2 | **stop-loss, wait-for-close** | sl, **rr, possize** | Risk Hydra | ❌ R:R & sizing not taught until **H6** |
| 3 | BOS, OB, CHOCH | bos, choch, ob, liquidity | Structure Serpent | ✓ aligned |
| 4 | VWAP | vwap, support, resistance, trend | VWAP Oracle | ✓ aligned |
| 5 | higher timeframes | mtf, struct, **pattern**, predict | Timeframe Titan | ⚠ `pattern` not taught until H8 |
| 6 | leverage, R:R | rr, possize, fake, exec | Margin King | ✓ aligned (R:R belongs **here**) |
| 7 | trendlines | trend, vwap, levels, exec | Trend Crab | ✓ aligned |
| 8 | bullish patterns | pattern, bos, ob, trend, exec | Order-Block Golem | ✓ aligned |
| 9 | bearish patterns, H&S | pattern, choch, fake, mtf, exec | Confluence Kraken | ✓ aligned |
| 10 | **confluence (capstone)** | *(none defined → fallback: struct/predict/candle, all beginner)* | The Market Maker | ❌ **final boss is the easiest fight in the game** |

**Verdict on identities:** the **identity order is already pedagogically correct** — each creature represents the concept introduced around its Hour (candles → survival → structure → VWAP → timeframe → leverage → trendlines → patterns → reversals/confluence → market). **The names do not need reordering.** Forcing them elsewhere would *hurt* the ramp, not help it.

**The real problem is the round sequencing, not the identities.** Three fixes (now in scope, since they're what "hurts learning"):

1. **Define a real Hour-10 gauntlet for the Market Maker** *(critical).* Replace the beginner fallback with a hard confluence test, e.g. `lives:2, rounds:[exec/expert, mtf/expert, struct/expert, pattern/expert, fake/expert, exec/expert]`. This fixes a difficulty regression *and* makes the capstone actually about confluence — which is the whole point of the final boss.
2. **Move R:R + position sizing off Boss 2 to Boss 6** *(high).* Boss 2 (Risk Hydra) should test only what Hour 2 taught — **survival**: `rounds:[sl/beginner, candle/beginner, sl/intermediate]`. R:R and sizing already live on Boss 6 (Margin King), exactly where Hour 6 teaches them. This also sharpens the characters: Hydra = "don't die," Margin King = "size & leverage with math."
3. **Swap the two premature rounds** *(low).* Boss 1 `struct → predict` (keep it candle-reading, matching Hour 1). Boss 5 `pattern → bos` (keep it structure/MTF, since patterns aren't taught until Hour 8).

These are ~4 small edits to the `BOSS_GAMES` data only — no new concepts, no new lessons, no length change. They make every boss test *only what the player has learned*, so the identities land on a ramp that's correct end-to-end. (Weakness tags stay valid; I'd re-confirm Boss 1's after the swap.)

**Net:** keep the identity mapping in §1 as-is; pair it with the 4 `BOSS_GAMES` corrections above so the *content* matches the *characters* matches the *curriculum*.

---

## 2. Lore framework — "Guardians of the Blockchain Ocean"

**Premise (existing, extended):** Shell the turtle is trapped in the Blockchain Ocean. The only way out is to ascend from **Drifter** to **Trader**. Each layer of the ocean is sealed by a **Guardian** — a creature born from one trading truth. A Guardian cannot be beaten by force, only by *understanding the truth it embodies*. Defeat one and that truth becomes yours; the water clears one layer deeper.

**The arc (surface → abyss):**
- **The Shallows (Casino Floor):** The Sprat Dealer runs a rigged game teaching you candles are not random — they're a record of who won.
- **Descent (Mirrors → Pit → Deep → Haunt):** You learn to *not be fooled* (Eel), to *survive* (Hydra), to *read the market's skeleton* (Serpent), to *find fair value* (Oracle).
- **The Mid-Waters (Tides → Throne → Grid → Citadel):** You learn *perspective* (Titan), *restraint with power* (Margin King), *the lines that hold* (Crab), *where giants entered* (Golem).
- **The Abyss (Crypt → Abyss):** Everything converges (Kraken), and finally the architect of the whole ocean — **The Market Maker** — who reveals the ocean was never a prison but a *school*. Beating it = rank **TRADER**: you can now read the market yourself, so the ocean has nothing left to teach.

This gives a **single emotional throughline** (trapped → understanding → freedom) and a villain reveal that recontextualizes the intro boss.

---

## 3. Boss identity sheets (all 11)

Format per boss: **Concept (locked) · Weakness (locked) · Arena (locked) · Reward (locked)** then identity fields.

### Slot 0 — THE SPRAT DEALER 🎰→🐟
- **Concept:** candle basics · **Weakness:** Structure, Trend · **Arena:** Casino Floor · **Reward:** 200🐚/80xp
- **Visual:** a twitchy little sprat in a too-big dealer's visor, flicking glowing candle-cards across a felt table of light.
- **Personality:** fast-talking carnival barker; harmless but sly.
- **Concept represented:** a candle is a *story of a fight*, not a coin flip.
- **Intro:** "New drifter? Step right up. Red or green, double or nothing — the cards never lie… mostly."
- **Victory (boss wins):** "House always wins, kid. Come back when you can read the table."
- **Defeat:** "…you actually read them. Huh. The Deep's gonna eat you alive — but go on."
- **Rank reward:** **PLANKTON** — "You can read a candle."
- **Lore entry:** *"The Dealer guards the surface, where the water is brightest and the lies are cheapest. He works for someone deeper."*
- **Educational purpose:** candle direction, wicks, doji (intro confidence).

### Slot 1 — THE REVERSAL EEL 🎭→🐍⚡
- **Concept:** candle reading, spot-the-error · **Weakness:** Structure, Liquidity · **Arena:** Hall of Mirrors · **Reward:** 300/120
- **Visual:** a sleek electric eel weaving through mirror-shards, each mirror showing a *false* candle; the real eel is never where its reflection is.
- **Personality:** taunting illusionist; loves a fake-out.
- **Concept represented:** price lies — read the *whole* candle, not the bait.
- **Intro:** "Which one's real, little shell? The breakout… or the trap I set inside it?"
- **Victory:** "You chased the reflection. They always chase the reflection."
- **Defeat:** "You saw through me. Impossible. …Pass."
- **Rank reward:** **MINNOW** — "Sees structure & levels."
- **Lore:** *"The Eel feeds on the impatient — those who buy the wick and sell the fear."*
- **Educational purpose:** rejection wicks, fakeouts, reading the close.

### Slot 2 — THE RISK HYDRA 💀→🐉🐉🐉
- **Concept:** stop-loss, R:R, position sizing · **Weakness:** Risk, Trade Mgmt · **Arena:** The Liquidation Pit · **Reward:** 350/140
- **Visual:** a three-headed serpent over a pit of liquidated wrecks; each head a way to die — **No-Stop**, **Oversize**, **Over-Leverage**. Cut one (set a stop) and it recoils.
- **Personality:** seductive, patient, whispers "just this once, go bigger."
- **Concept represented:** survival first — the trade you don't blow up on is the one that compounds.
- **Intro:** "No stop-loss? Bold. Size it up. What's the worst that could happen?" *(all three heads grin)*
- **Victory:** "And… liquidated. The Pit thanks you for your deposit."
- **Defeat:** "You cut me down to size. Risk respects only the disciplined."
- **Rank reward:** **CRAB** — "Reads the trend." *(plus the title 'Disciplined')*
- **Lore:** *"The Hydra has drowned more drifters than the Abyss itself. It never tires; you must simply refuse to feed it."*
- **Educational purpose:** stop placement, 1–2% risk, R:R, leverage danger.

### Slot 3 — THE STRUCTURE SERPENT 🦈→🐍🦴
- **Concept:** BOS, CHOCH, order blocks, liquidity · **Weakness:** Structure, Order Blocks · **Arena:** The Deep · **Reward:** 400/160
- **Visual:** a colossal sea-serpent whose body *is* market structure — its spine a chain of higher-highs and higher-lows; break its spine (spot the BOS) to wound it.
- **Personality:** ancient, cold, speaks in absolutes.
- **Concept represented:** the market has a skeleton; trade with its breaks, not against them.
- **Intro:** "Every wave has a spine, hatchling. Find where it breaks — or be crushed by it."
- **Victory:** "You traded against the structure. The Deep does not forgive that."
- **Defeat:** "You found the break. You see the skeleton now. Descend."
- **Rank reward:** **PUFFERFISH** — "Spots setups & order blocks."
- **Lore:** *"The Serpent is the current itself — the truest map of the ocean, for those who can read a spine."*
- **Educational purpose:** BOS/CHOCH, order blocks, liquidity.

### Slot 4 — THE VWAP ORACLE 👻→🔮
- **Concept:** VWAP, support, resistance, trend · **Weakness:** Trend, Multi-TF · **Arena:** The Haunt · **Reward:** 450/180
- **Visual:** a translucent jellyfish-seer trailing a single luminous thread (the VWAP line) that price is forever pulled back toward.
- **Personality:** serene, cryptic, speaks in mean-reversion riddles.
- **Concept represented:** there is a *fair price* the ocean always returns to.
- **Intro:** "Price wanders, little one. But it always comes home to me. Do you know where home is?"
- **Victory:** "You traded far from fair value. The current always collects its due."
- **Defeat:** "You found the line. You traded the return. The Haunt clears for you."
- **Rank reward:** **OCTOPUS** — "Understands liquidity & VWAP."
- **Lore:** *"The Oracle does not predict — she remembers the average of every trade ever made, and price cannot forget her."*
- **Educational purpose:** VWAP reaction, S/R, trend alignment.

### Slot 5 — THE TIMEFRAME TITAN 🌊
- **Concept:** multi-TF, structure, patterns · **Weakness:** Multi-TF, Structure · **Arena:** The Tides · **Reward:** 500/200
- **Visual:** a tidal giant made of nested waves — zoom out and the small chop you feared is one ripple on a vast swell.
- **Personality:** booming, impatient with the short-sighted.
- **Concept represented:** the higher timeframe rules; align or be swept.
- **Intro:** "You stare at one wave. I AM THE TIDE. Step back — or drown in the detail."
- **Victory:** "You traded the ripple against the tide. Predictable. Gone."
- **Defeat:** "You zoomed out. You saw the whole sea at last. Rise."
- **Rank reward:** **DOLPHIN** — "Manages risk like a pro."
- **Lore:** *"The Titan is patience given form — every trap below makes sense once you see the tide above."*
- **Educational purpose:** multi-timeframe alignment.

### Slot 6 — THE MARGIN KING 👑
- **Concept:** R:R, sizing, fakeouts, execution · **Weakness:** Risk, Trade Mgmt · **Arena:** The Throne Room · **Reward:** 600/250
- **Visual:** a hermit-crab emperor in a gilded shell-throne, drunk on leverage, crown slipping; offers you a borrowed crown (leverage) that's secretly a noose.
- **Personality:** grandiose, generous-seeming, ruinous.
- **Concept represented:** leverage is borrowed power — it multiplies *both* directions.
- **Intro:** "Take the crown, champion! 10×, 20× — why earn slowly when you can rule today?"
- **Victory:** "Ah, the crown was heavier than it looked. They all kneel eventually."
- **Defeat:** "You wore power lightly. Only the disciplined keep the throne."
- **Rank reward:** **SHARK** — "Stacks confluence across timeframes."
- **Lore:** *"The King was the greatest trader in the ocean — until he believed size was skill. Now he gifts his curse to the greedy."*
- **Educational purpose:** leverage discipline, R:R under size, execution.

### Slot 7 — THE TREND CRAB 🧭→🦀📈
- **Concept:** trend, VWAP, levels, execution · **Weakness:** Trend, Multi-TF · **Arena:** The Grid · **Reward:** 650/260
- **Visual:** an armored crab that scuttles *only* along the trendlines of a neon grid; attack against the line and its shell deflects you; trade with it and it yields.
- **Personality:** stubborn, literal, "the trend is the trend."
- **Concept represented:** the trend is your ally until it breaks — draw the line, respect the line.
- **Intro:** "Sideways, schmideways. Pick the line, hatchling. WITH me, or under my claw."
- **Victory:** "You fought the trend. The trend, as always, won."
- **Defeat:** "You walked my lines. Clean. The Grid opens."
- **Rank reward:** **WHALE** — "Trades a full plan."
- **Lore:** *"The Crab never predicts; it simply follows the line beneath its feet, and the line is rarely wrong."* *(Note: shares a name with the CRAB rank — intentional thematic echo.)*
- **Educational purpose:** trendlines, levels, trend-aligned execution.

### Slot 8 — THE ORDER-BLOCK GOLEM 🚩→🧱
- **Concept:** patterns, BOS, order blocks, trend · **Weakness:** Structure, Order Blocks · **Arena:** The Citadel · **Reward:** 750/300
- **Visual:** a fortress-golem built of stacked order blocks; each correct OB you mark crumbles one brick of its wall.
- **Personality:** slow, immovable, speaks like masonry.
- **Concept represented:** institutions leave footprints (order blocks) — find where giants stepped.
- **Intro:** "These walls were laid by hands far larger than yours. Find the stone that holds them — or break upon it."
- **Victory:** "The wall holds. You are dust against the Citadel."
- **Defeat:** "You found the founding stone. The Citadel kneels."
- **Rank reward:** **LEVIATHAN** — "Ancient force of the deep. One boss from mastery."
- **Lore:** *"The Golem guards the marks of the whales — the blocks where the ocean's giants chose to enter."*
- **Educational purpose:** order blocks, BOS, continuation patterns.

### Slot 9 — THE CONFLUENCE KRAKEN 💀→🦑
- **Concept:** patterns, CHOCH, fakeouts, MTF, execution · **Weakness:** Structure, Liquidity, Multi-TF · **Arena:** The Crypt · **Reward:** 850/340
- **Visual:** a vast kraken whose **eight arms are eight concepts** (trend, structure, OB, VWAP, liquidity, R:R, MTF, management); it only takes real damage when *several* arms are answered together — confluence made monstrous.
- **Personality:** intelligent, final-exam energy, almost respectful.
- **Concept represented:** mastery is **stacking** — one reason is bait, five reasons is an edge.
- **Intro:** "One signal, little Trader? I have eight arms. Bring me *reasons*, or be pulled under."
- **Victory:** "One reason was never enough. The Crypt keeps you."
- **Defeat:** "Five reasons. Six. You stack confluence like a master. Only one remains beyond me…"
- **Rank reward:** (pre-final) — "On the edge of TRADER."
- **Lore:** *"The Kraken is the sum of every Guardian before it — beat it and only the architect remains."*
- **Educational purpose:** confluence — combining all prior concepts.

### Slot 10 — THE MARKET MAKER 🦑→🎩👁
- **Concept:** the full gauntlet · **Weakness:** Risk, Trade Mgmt, Multi-TF · **Arena:** The Abyss · **Reward:** 1100/420
- **Visual:** not a beast — a calm, suited silhouette of liquid shadow at the ocean floor, candles orbiting like planets. The puppeteer behind every prior Guardian (the Dealer's boss).
- **Personality:** quiet, knowing, almost kind — the final teacher in villain's clothing.
- **Concept represented:** the market itself — every concept at once, no single trick.
- **Intro:** "I made the Dealer. The Eel. All of them — lessons, wearing monsters' faces. You learned each one. Now: trade against *me*."
- **Victory:** "Close. But the market is patient, and so am I. Again."
- **Defeat:** "There's nothing left to teach you. The ocean was never a cage — it was a classroom. Go. **Trade.**"
- **Rank reward:** **TRADER** 👑 — "Graduated. The market is yours to read."
- **Lore:** *"The Market Maker is not your enemy. It is the ocean's final truth: master yourself, and the market sets you free."*
- **Educational purpose:** capstone — applying everything.

---

## 4. Lightweight visual implementation (max impact, near-zero asset cost)

**Principle:** no external art pipeline, no AAA fights. Everything is **procedural canvas/SVG + emoji glyphs + the arena themes you already have** (`BOSS_THEME` colors/bg/fx). This keeps it single-file, mobile-fast, and instantly themed per boss.

| Element | Approach (reuse-first) | Effort |
|---|---|---|
| **Boss Portrait** | A `bossPortrait(level)` canvas/SVG: themed radial-glow disc in the boss's accent color + the boss's large emoji glyph as the "face" + the arena `fx` (embers/rain/void/grid) behind it. Optional 1–2 accent shapes (claws/tentacle/crown) drawn with primitives. Zero image files. | **Low** |
| **Boss Intro Card** | Extend the existing `bossRound()` intro panel: portrait + animated name + one-line title + intro dialogue + "FIGHT →". Reuse `#bossFight` + `#bfBody`. | **Low** |
| **Boss Name Animation** | CSS keyframes only: letter-by-letter fade/slide + accent-color glow pulse (reuse the `bfShake`/glow patterns already in CSS). | **Very low** |
| **Boss Dialogue Window** | A reusable `#bossDialogue` strip (portrait thumb + typewriter text) shown on intro / on defeat / on the win screen. Pull text from a new `BOSS_LORE` data object. | **Low** |
| **Health-bar styling** | Already themed (the `--bacc` segments from Phase 1/3). Add a tiny boss-emoji head at the bar's left end + a subtle "crack" flash on a weakness ×2 hit (reuse `bossHitFX`). | **Very low** |
| **Defeat Screen** | Restyle existing `bossWin()` result: portrait dimmed/shattered + defeat dialogue + the boss's lore entry "unlocked" stamp. | **Low** |
| **Reward Screen** | Restyle existing claim screen: rank-up reveal (reuse `RANKS` emoji/color) + shells/xp + "Lore Entry added to Journal." | **Low** |

**One new data object only:** `BOSS_LORE[level] = { id, portraitEmoji, accentShape, intro, victory, defeat, rankReward, lore, title }`. Everything else extends existing functions. No new mechanics, no new screens beyond restyling `#bossFight`'s three states (intro / defeat / reward).

**Optional upgrade path (later, not required):** swap `bossPortrait` to load a commissioned PNG per boss if you ever want bespoke art — the data object already has the slot for it.

---

## 5. Content / marketing fit

Each boss is built to be **screenshot- and Short-recognizable**: a single bold emoji-creature on a uniquely colored arena, a punchy name, and a one-line villain quote. That yields ready-made content units — "Can a turtle out-trade **The Risk Hydra**?", a 15-sec defeat-dialogue sting, a "meet the 10 Guardians" carousel. The Confluence Engine already emits `boss_defeated` events with `clean_win`/`personal_best` flags (Content Engine), so these moments auto-flag as clip candidates.

---

## 6. Development roadmap (highest impact ÷ lowest cost first)

1. **`BOSS_LORE` data object + dialogue on intro/defeat/reward** *(S effort, huge impact)* — names, personalities, and dialogue are 80% of "memorable" and are pure data + text injection into the three existing `#bossFight` states. **Do first.**
2. **Boss Portrait (`bossPortrait`) + Intro Card** *(S–M)* — the single most screenshot-defining element; procedural emoji+accent+fx. 
3. **Name animation + Dialogue window styling** *(S)* — CSS-only polish that makes intros feel like encounters.
4. **Defeat & Reward screen restyle + Lore-entry-to-Journal** *(S–M)* — emotional payoff + ties bosses into the existing journal as collectible lore.
5. **Health-bar boss-head + weakness-hit flair** *(XS)* — tiny touch, reuses Phase 3 FX.

Files touched: `chart-quest.html` only — extend `BOSSES`/`BOSS_THEME` (add lore/portrait fields or a parallel `BOSS_LORE`), and the existing `bossRound()`, `bossWin()`, `bossLose()`, claim screen, and `renderBossHUD()`. No new files; `index.html` re-synced after.

---

## 7. Decisions needed before build
1. Approve the **slot→identity mapping** in §1 (esp. Market Maker → final boss, Sprat Dealer as intro).
2. **Liquidity Leviathan:** drop it, or re-skin the Structure Serpent as it? (I recommend drop / fold into Kraken.)
3. **Rank-name overlaps** (Crab/Leviathan/Kraken): keep as thematic echoes, or rename bosses?
4. Portrait style: **procedural emoji + accent shapes** now (recommended), or hold a slot for commissioned art later?
5. Tone check on dialogue: current voice is *mythic-but-playful*. Want it more menacing, more comedic, or as-is?

*No code written. On approval I'll start with step 1 (the `BOSS_LORE` data + dialogue injection) — pure additive text/data over the existing boss screens.*
