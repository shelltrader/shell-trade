# ChartQuest — Phase 2: Mastery Gates, Journal Integration & Pacing (v98)

**Goal:** Guardians arrive after *mastery*, not a timer — stretching the free run toward 15–25 min. Approach (your call): **mastery gates**, not new content. **Live on v98.**

---

## What shipped

**1 · The Guardian door is now a mastery gate.** A Guardian no longer opens just because the level's candles ran out. The player must prove four things, all earned through normal play:

| Proof | How it's earned | L1–4 / L5+ |
|---|---|---|
| **Correct reads** | quick-reads + portal predictions (plentiful — never a wall) | 3 / 4 |
| **Trades taken** | real trades on the live chart | 3 / 5 |
| **Wins** | of those trades | 2 / 3 |
| **Journal review** | the guided first-review beat after the first trade | 1 / 1 |

The intermission and the gate-block message now show all four with live progress (e.g. `2/3 reads · 1/3 trades · review a trade`), so the player always knows exactly what's left.

**2 · Journal integration.** The moment the level's first trade closes, a review of that trade surfaces and a nudge points the player to the **📓 Notebook** ("tap your Notebook to replay & review it"). Opening *any* trade in the Notebook also counts. This teaches the journaling habit and satisfies the gate's review step — and because the review fires automatically after the first trade, it can **never soft-lock** a player at the intermission.

**3 · Longer levels.** `perHour` went **140 → 190** candles. Combined with the mastery gate, each gated Guardian now lands around **8–12 min** instead of ~5. The number is a single tunable value if you want it longer or shorter.

**4 · Portals.** The trade / "READ THE CHART" portals already require an UP/DOWN call (added in v93) and those correct reads now feed the gate. *Deferred:* the lesson portals still end in a read-and-acknowledge card rather than an active-recall question — I didn't want to author a comprehension check for every lesson blind. Flagged as a focused follow-up.

---

## Why this is soft-lock safe
Every gate requirement is satisfied through ordinary play *before* the intermission: reads come from the steady quick-read stream, trades/wins from the setups (biased ~78% win at L1), and the journal review auto-fires after the first trade. The gate raises the *floor* of mastery without ever trapping a player who is actually playing.

## New estimated time-to-paywall
Intro → Guardian 1 (~3–4 min, unchanged) + the Guardian-1→Guardian-2 stretch (now ~8–12 min with the gate + longer level) ≈ **~12–16 min**, up from ~5–7. Tunable upward via `perHour` and the gate numbers.

## Needs your eyes
The gate math is sound and parse-checked, but the *feel* (is 190 candles too long? do the four proofs read clearly on the intermission bar?) needs a real playthrough to Guardian 2. All four numbers are one-line tweaks.

---

*Live on v98. Deploy confirmed ("✅ Deploy successful"). Remaining Phase 2 follow-up: active-recall interactions inside the lesson portals.*
