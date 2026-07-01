# Chart Quest — Trading Mini-Game Library

### Architecture & design system (Phases 1–10)

**Companion prototype:** `preview-minigame-library.html` — a playable build of the library hub, the shared engine, and representative games proving the framework. Play it alongside this doc.

The thesis of this document: **games are data, not code.** We build a tiny number of interaction *frameworks* once, then every "mini game" is a small declarative config that feeds one of them. That is what makes the library scalable, reusable across lessons/levels/bosses, and cheap to expand forever.

---

## Phase 1 — Current game audit (what we leverage vs build)

| Capability | Exists in `chart-quest.html`? | Reuse for the library |
|---|---|---|
| Candle/chart rendering | ✅ Canvas (main game) + SVG (`tradeChartSVGFull`, `tradeReplaySVG`) + `candleTop()` geometry | The shared **ChartCanvas** substrate is a refactor of this, not new |
| Animated replay | ✅ (the rAF replay we just built for the intermission) | Powers the **Predict/Replay** framework directly |
| Market-structure truth | ✅ `setupZone`, order-block detection, BOS/ChoCh generation (`CFG.bosShare`, `chochChance`) | Generates *correct answers* for Annotate games for free |
| Quiz/boss engine | ✅ data-driven `BOSSES{}`, `QUIZ_QUESTIONS`, `bfState`, HP/hearts/rounds | **Classify** framework + boss orchestration reuse this |
| Educational content | ✅ `LESSONS`, `CURRICULUM`, `TERMS`, `getCurriculum()` | Objectives, tips, glossary links per game — no new copy needed |
| DOM-overlay UI pattern | ✅ Journal, Account, Faction picker, Intermission | The Library is one more overlay in the same idiom |
| Persistence | ✅ localStorage (`shellTradeJournal_v1` …) + Supabase cloud sync | Add one table + one localStorage key |
| Pointer/drag input | ⚠️ pointer handling exists, but **no place/draw/drag drill mechanic** | This is the real new work — the **Interaction** layer |
| Player "dashboard" hub | ❌ `dashboard.html` is a private founder/analytics page, not the player's screen | We add a Library hub reachable from the in-game HUD |

**Conclusion:** ~70% of what the library needs already exists (rendering, truth-data, content, persistence, UI shell). The net-new work is the **interaction frameworks** (place/draw/drag, calculator) and the **library shell**. Do not rebuild charts, content, or the boss engine.

---

## Phase 4 (stated first — it drives everything) — System consolidation

The brief lists 20 games and suggests 4 frameworks. We can do better. Underneath, the 20 games are **four interaction verbs** sitting on **one shared chart substrate**:

```
                         ┌─────────────────────────────────────────┐
                         │   ChartCanvas (shared substrate)         │
                         │   render candles · levels · zones ·      │
                         │   markers · timer · score · feedback ·   │
                         │   difficulty knobs · seeded generators   │
                         └───────────────┬─────────────────────────┘
            ┌───────────────┬────────────┼─────────────┬───────────────┐
            ▼               ▼            ▼              ▼               ▼
      ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ ANNOTATE │   │ PREDICT  │  │ CALCULATE│  │ CLASSIFY │
      │ place a  │   │ reveal & │  │ sliders +│  │ tap the  │
      │ point /  │   │ decide   │  │ live math│  │ correct  │
      │ line /   │   │ over time│  │          │  │ label    │
      │ zone     │   │          │  │          │  │          │
      └──────────┘   └──────────┘  └──────────┘  └──────────┘
```

**One substrate + four verbs.** Every game is a config that names a verb and supplies a seeded generator + a validator. The 20 games map cleanly:

| Framework | Games it powers | Count |
|---|---|---|
| **ANNOTATE** (place point / draw ray / draw zone / drag handles) | BOS Placement, ChoCh Placement, VWAP Placement¹, Support Zone, Resistance Zone, Trendline, Liquidity ID, Order Block ID, Stop-Loss Placement, Candle Builder, Chart Surgery | 11 |
| **PREDICT** (reveal candles → decide at a checkpoint) | Trade Replay Prediction, Fakeout Detection, Trade Management Simulator, Multi-Timeframe Analysis | 4 |
| **CALCULATE** (inputs → live R:R / risk / liquidation) | Position Size, Risk-Reward Builder | 2 |
| **CLASSIFY** (chart → pick the category) | Market Structure Classification, Pattern Recognition | 2 |

¹ VWAP "placement" is really *read the VWAP and place an entry on the bounce* — an Annotate-point game with a VWAP overlay.

**That is 4 frameworks, not 20 systems** — and ANNOTATE alone retires 11 games because "place a marker," "draw a line," and "shade a zone" are the *same* validation engine differing only by element type and tolerance. Build ANNOTATE and PREDICT first and you've covered 15 of 20 games.

### The registry pattern (the heart of the system)

```js
// A game is DATA. The engine runs any game from its config.
GAME_REGISTRY['bos-placement'] = {
  id: 'bos-placement',
  title: 'Break of Structure',
  category: 'Structure',
  framework: 'annotate',            // which verb
  element: 'marker',                // point | ray | zone | handles
  skill: 'Spot the exact candle that breaks structure',
  objective: 'Tap the candle whose close breaks the prior swing high/low.',
  terms: ['BOS', 'swing high'],     // links into the glossary
  generate(seed, diff) { /* returns { candles, answer, decoys, prompt } */ },
  validate(answer, response, diff) { /* returns { score, correct, why } */ },
  difficulty: { /* per-tier knobs, see Phase 6 */ },
};
```

Adding a 21st game = adding one object. Lessons, levels, and bosses reference games by `id` + difficulty. Nothing is hard-coded twice.

---

## Phase 2 — The Mini-Game Library (the hub)

A new full-screen overlay reached from the HUD ("🎮 Practice"). It is a **professional learning catalog**:

- **Search** by name, skill, or term ("vwap", "risk", "structure").
- **Category tabs:** Structure · Levels & Zones · Risk · Patterns · Execution · (All).
- **Cards** (rendered from the registry) showing: a live mini chart thumbnail (ChartCanvas at preview scale), title, category chip, **difficulty pips**, **best score**, completion ✓, and a **▶ Play / Replay** button.
- **Scalable & future-proof:** the grid is generated from `GAME_REGISTRY`; new games appear automatically. "Coming soon" cards for unbuilt configs.
- **Practice mode:** any game replayable infinitely with a difficulty selector; scores tracked but never gate progress.

---

## Phase 3 + 5 — The 20 games (design + educational spec)

Compact spec per game. *Framework* shows the consolidation; *Mistakes* drives the feedback copy; *Scoring* is normalized 0–100 so the library can compare and the boss engine can threshold.

| # | Game | Framework | Learning objective / real skill | Common mistakes (→ feedback) | Scoring | Replayability |
|---|---|---|---|---|---|---|
| 1 | **BOS Placement** | Annotate·marker | Identify the candle that breaks structure | Picking the wick, not the close; marking the swing instead of the break | distance-to-correct candle, tolerance ±1 | seeded charts, infinite |
| 2 | **ChoCh Placement** | Annotate·marker | Spot the first counter-trend break | Confusing a pullback with a ChoCh | same | high |
| 3 | **VWAP Placement** | Annotate·marker (+VWAP overlay) | Enter on the VWAP reaction | Entering mid-air, not at VWAP | proximity to VWAP touch | high |
| 4 | **Support Zone** | Annotate·zone | Shade where demand sits | Drawing a line not a zone; too wide | overlap-IoU with truth zone | high |
| 5 | **Resistance Zone** | Annotate·zone | Shade where supply sits | same as #4 (mirror) | IoU | high |
| 6 | **Trendline** | Annotate·ray | Draw a line respecting ≥2–3 touches | 2-point lines through bodies not wicks | angle+touch error | high |
| 7 | **Multi-Timeframe** | Predict | Align LTF entry with HTF bias | Trading against HTF | correct alignment call | medium |
| 8 | **Trade Replay Prediction** | Predict | Read context, predict next move | Guessing direction with no thesis | up/down + confidence | very high |
| 9 | **Stop-Loss Placement** | Annotate·line | Place a logical invalidation level | Stop too tight / inside noise | "would it survive?" + logic | high |
| 10 | **Position Size** | Calculate | Size so risk = 1% | Risking too much; ignoring stop distance | error vs correct size | medium |
| 11 | **Risk-Reward Builder** | Calculate | Build ≥2R setups | Taking <1R trades | R achieved, ≥2R bonus | medium |
| 12 | **Liquidity ID** | Annotate·marker | Tap resting liquidity (equal highs/lows) | Missing equal highs | hits vs misses | high |
| 13 | **Market-Structure Classify** | Classify | Label uptrend/down/range | Calling a range a trend | correct label | high |
| 14 | **Pattern Recognition** | Classify | Name the pattern under a clock | Forcing a pattern that isn't there | correct + speed | very high |
| 15 | **Trade Management** | Predict | Hold/trim/exit as it plays | Cutting winners, holding losers | end equity vs optimal | very high |
| 16 | **Fakeout Detection** | Predict | Real break vs trap | Chasing the fake | real/fake call | very high |
| 17 | **Candle Builder (Bull/Bear)** | Annotate·handles | Construct OHLC from a description | Wrong open/close order | handle accuracy | medium |
| 18 | *(merged into 17)* | — | — | — | — | — |
| 19 | **Order Block ID** | Annotate·zone | Mark the last opposing candle before BOS | Picking any red candle | IoU to OB | high |
| 20 | **Chart Surgery** → **Spot the Error** | Classify/Annotate | Find the impossible/illogical candle | Missing the bad data | hit on the error | medium |

**Difficulty levels** for all (Phase 6 details below): Beginner · Intermediate · Advanced · Expert.

---

## Phase 6 — Difficulty progression (one generator, four presets)

Difficulty is **parameters on the seeded generator**, never a separate implementation. Each game's `difficulty` block tunes shared knobs:

| Knob | Beginner | Intermediate | Advanced | Expert |
|---|---|---|---|---|
| Chart complexity (candles / noise) | 12 / low | 24 / med | 40 / high | 60 / high |
| Time limit | none | generous | tight | tight + shrinking |
| Distractors (decoy markers/levels) | 0 | 1 | 2–3 | many |
| Confirmations required | 1 | 1 | 2 | 2–3 (confluence) |
| Obviousness of setup | textbook | clean | subtle | ambiguous/messy |
| Tolerance (Annotate) | wide | normal | tight | tight |

The engine reads these; the same `generate()`/`validate()` covers all four tiers. This is the single most important anti-bloat rule.

---

## Phase 7 — Boss integration (bosses = sequences of mini-games)

A boss becomes an **ordered playlist of game rounds** pulled from the registry, wrapped in the existing `bfState` HP/hearts shell. Boss config:

```js
BOSSES[3] = {
  name: 'THE STRUCTURE SHARK', hp: 6, hearts: 3,
  rounds: [
    { game: 'bos-placement',   diff: 'intermediate' },
    { game: 'choch-placement', diff: 'intermediate' },
    { game: 'order-block-id',  diff: 'advanced' },
    { game: 'trade-prediction',diff: 'intermediate' },
  ],
};
```

A correct round = damage to boss; a miss = lose a heart. This makes bosses *infinitely* authorable and guarantees they test the exact skills the world taught. Suggested progression across the 10 worlds (each boss = that world's skills, escalating difficulty):

| World / Boss | Mini-games in the fight | Tier |
|---|---|---|
| 1 · The Fakeout | Candle Builder · Pattern Recognition · Fakeout (intro) | Beginner |
| 2 · Liquidity Hunter | Market-Structure Classify · Liquidity ID · Fakeout | Beg→Int |
| 3 · Structure Shark | BOS · ChoCh · Order Block · Trade Prediction | Intermediate |
| 4 · Pattern boss | Pattern Recognition · Trendline · Support/Resistance Zone | Intermediate |
| 5 · Market Maker | Liquidity ID · Order Block · Fakeout · Trade Prediction | Int→Adv |
| 6 · The Liquidator | Stop-Loss · Position Size · Risk-Reward · Trade Management | Advanced |
| 7 · Mixed Signals | Multi-Timeframe · VWAP · Classify (confluence) | Advanced |
| 8 · The Market (final) | Trade Management · Multi-TF · Fakeout · Risk (full plan) | Expert |
| 9 · Prestige Rush | random advanced playlist | Expert |
| 10 · Final Exam | one round of every framework | Expert |

---

## Phase 8 — Dashboard / Library UI spec

Library cards and detail follow a **learning-platform** aesthetic (matching the polished intermission):

- **Card:** live chart thumbnail · title · category chip · 4 difficulty pips (filled = unlocked/cleared) · best score · ✓ completion · ▶ Play.
- **Detail sheet (on tap):** objective, real skill, "common mistakes" coaching, glossary term links, difficulty selector, best-score-per-tier, and **▶ Play / Replay**.
- **Header stats:** games completed, total stars, current streak — a progress spine that makes the library feel like a course.
- **Empty/coming-soon** cards for registry entries not yet built, so the catalog always looks complete and roadmapped.

---

## Phase 9 — Implementation (architecture, files, data, order)

**This game is one self-contained `chart-quest.html`.** The library ships as a namespaced module block inside it (exactly how we shipped the cinematic), plus a few wiring points — no build system, no new dependencies.

### Logical file/module structure (within the single file, clearly fenced)
```
/* ===== MINIGAME LIBRARY ===== */
  MG.ChartCanvas      // shared render+geometry+difficulty+scoring harness
  MG.frameworks = {
    annotate(cfg,diff,host)   // place marker/ray/zone, drag handles, validate
    predict(cfg,diff,host)    // reuse rAF replay; checkpoint decisions
    calculate(cfg,diff,host)  // slider inputs + live math readout
    classify(cfg,diff,host)   // chart + tap-the-label (reuses quiz UI)
  }
  MG.REGISTRY = { 'bos-placement': {...}, ... }   // 20 game configs (data)
  MG.run(gameId, diff, onDone)   // generic runner: picks framework, plays, scores
  MG.Library                     // the hub overlay (search/category/cards)
  MG.progress                    // localStorage + Supabase mirror
/* ===== END MINIGAME LIBRARY ===== */
```
If the file ever gets split for maintainability, this becomes `/minigames/` with one file per framework + `registry.js`, but **single-file is correct for now** given the hosting model.

### Database changes (Supabase)
```sql
create table minigame_scores (
  user_id     uuid references auth.users on delete cascade,
  game_id     text not null,
  difficulty  text not null,            -- beginner|intermediate|advanced|expert
  best_score  int  not null default 0,  -- 0..100
  stars       int  not null default 0,  -- 0..3 derived from best_score
  attempts    int  not null default 0,
  completed   bool not null default false,
  updated_at  timestamptz default now(),
  primary key (user_id, game_id, difficulty)
);
alter table minigame_scores enable row level security;
create policy "own scores" on minigame_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
Guests persist to `localStorage['cq_minigames_v1']`; on sign-in we merge (max score wins), mirroring the existing journal sync.

### UI changes
1. HUD: add a **🎮 Practice** button (next to Journal) → opens `MG.Library`.
2. New overlay `#mgLibrary` (search bar, category tabs, card grid) + `#mgPlay` (the active game host).
3. Intermission "Lessons Completed" rows deep-link to the matching practice game ("Try it →").

### Implementation order (each step shippable)
1. **MG.ChartCanvas** substrate (render + seeded generator + scoring/feedback harness + difficulty knobs).
2. **Annotate** framework + 3 games (BOS, Stop-Loss line, Trendline) — proves point/line/zone.
3. **MG.Library** hub (registry-driven cards, search, categories) + progress persistence.
4. **Predict** framework (reuse rAF replay) + Fakeout + Trade Prediction.
5. **Calculate** + **Classify** frameworks + their games.
6. Backfill remaining Annotate games (configs only).
7. **Boss refactor** to `rounds[]` pulling from the registry.
8. Supabase table + sync.

Steps 1–3 deliver a live, valuable library with real games. The rest is mostly **config**, not engineering.

---

## Phase 10 — Prioritization

Scored 1–5 (5 best). "Build-first" favors high educational value × retention × virality, weighted down by complexity, **and** clustered so we finish a framework before moving on.

| Game | Educ. | Replay | Retention | Virality | Complexity (lower=better) | Verdict |
|---|---|---|---|---|---|---|
| Fakeout Detection | 5 | 5 | 5 | 5 | 3 | **Build First** |
| Trade Replay Prediction | 5 | 5 | 5 | 4 | 3 | **Build First** |
| BOS Placement | 5 | 4 | 4 | 3 | 2 | **Build First** |
| Order Block ID | 5 | 4 | 4 | 3 | 2 | **Build First** |
| Stop-Loss Placement | 5 | 4 | 5 | 3 | 2 | **Build First** |
| Trade Management Sim | 5 | 5 | 5 | 5 | 4 | **Build Second** |
| Risk-Reward Builder | 5 | 3 | 4 | 3 | 2 | **Build Second** |
| Pattern Recognition | 4 | 5 | 4 | 4 | 3 | **Build Second** |
| Trendline | 4 | 4 | 3 | 3 | 3 | **Build Second** |
| ChoCh Placement | 4 | 4 | 3 | 3 | 2 | **Build Second** |
| Liquidity ID | 4 | 4 | 4 | 4 | 3 | **Build Second** |
| Support / Resistance Zone | 4 | 4 | 3 | 3 | 3 | **Build Later** |
| Market-Structure Classify | 4 | 3 | 3 | 3 | 2 | **Build Later** |
| Multi-Timeframe | 5 | 3 | 3 | 2 | 5 | **Build Later** |
| VWAP Placement | 3 | 3 | 3 | 2 | 3 | **Build Later** |
| Candle Builder | 3 | 2 | 2 | 2 | 2 | **Build Later** |
| Position Size | 4 | 2 | 3 | 1 | 2 | **Build Later** (reframe) |
| Chart Surgery / Spot Error | 3 | 3 | 3 | 4 | 3 | **Build Later** |

**Build-First rationale:** Fakeout + Trade Prediction are the most *shareable* ("can you read this chart?" is a perfect TikTok hook), the most replayable, and reuse the rAF replay we already have. BOS / Order Block / Stop-Loss anchor the Annotate framework with the highest-skill-transfer drills. Those five give a complete, marketable library across two frameworks.

---

## Final requirement — Challenging the list

Where the 20 are weak, redundant, or boring — and what to do instead:

1. **Bullish vs Bearish Candle Builder are the same game.** Merge into one **Candle Builder** with a long/short prompt. (Done above — #18 folded into #17.) Net: 19 games, not 20.
2. **Support Zone Drawing ≈ Resistance Zone Drawing** — identical mechanic, mirrored side. Ship as one **Zone Drawing** game that randomly asks for support or resistance. Saves an implementation; keeps both skills.
3. **Position Size Calculator is a calculator, not a game** — passively boring and zero virality. **Reframe** as *"Size the trade so risk = 1% before the timer"* with a live risk meter, or fold it into Risk-Reward Builder as one "Risk Lab." Don't ship a bare calculator.
4. **Chart Surgery Puzzle is undefined and risks being a confusing meta-puzzle.** Re-spec as **"Spot the Error"** — one candle in the series is impossible (close outside its own high/low) or one structure label is wrong; tap it. Clear, fast, teaches data literacy. If that's still thin, cut it.
5. **Multi-Timeframe is the highest-value, highest-cost game.** It's a Predict game with two synced charts. Worth building, but **last** — don't let it block the library launch.
6. **VWAP "Placement" is mislabeled** — you don't place VWAP, you *react* to it. Implement as an Annotate-entry game on a VWAP overlay, or as a Predict ("will it bounce or break VWAP?"). The latter is more fun.
7. **Stop-Loss Placement spans two frameworks.** Keep *placement* in Annotate (drag the line to a logical level, scored on "would it survive the noise?"); send *sizing* to Calculate. Don't conflate them in one game.
8. **Market-Structure Classify and Pattern Recognition are both Classify** — fine to keep both, but they must share one engine (a chart + tappable labels), which is ~30 lines on top of the existing quiz UI.

**The real design risk isn't the game list — it's input precision on touch.** Annotate games live or die on tolerance design: snapping markers to candles, snapping lines to wick/body anchors, and zones scored by overlap (IoU) rather than pixel-perfect edges. The prototype demonstrates the snapping + tolerance model so this is settled before scaling to all 19.

**Bottom line:** build **1 substrate + 4 frameworks**, ship **5 Build-First games** across Annotate + Predict, and the remaining ~14 become configuration. That is how a 20-game library gets built without building 20 systems — and how it keeps growing for years.
