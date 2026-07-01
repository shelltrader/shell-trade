# ChartQuest — Knowledge Journal Redesign · Progression Report

**Deployed:** live as v72 · **Core rule enforced:** a player never sees a concept before they've learned it.

---

## What changed

The Journal is now a **discovery system**, not a glossary. The old "Terms" tab — which dumped all 24 trading terms at once (BOS, ChoCh, VWAP, Order Block…) regardless of progress — is gone, along with the "Lessons" tab that leaked locked future lesson titles behind 🔒 icons.

**New tab structure (5):** Knowledge · Trades · Guardians · You · Notes.

Every tab reads from the **same gating the charts and lessons already use** (the player's furthest level vs each concept's unlock level), so the Journal can never reveal something the rest of the game is hiding.

---

## Knowledge tab — the discovery collection

- Shows **only concepts the player has discovered**, each as a card: term + one-line definition + ✓.
- Undiscovered concepts are **never named** — they appear as unnamed `? ? ?` locked slots, with a footer counter: *"18 more concepts await discovery…"*
- A progress header tracks the journey: **Knowledge Discovered — X / 24**.

The 24-concept catalog is mapped to curriculum levels (mirroring the game's existing concept-unlock hours):

| Level | Concepts that become discoverable |
|---|---|
| 1 | Candle · Wick · Candle Close · Doji · Long · Short |
| 2 | Trend · Support · Resistance |
| 3 | Break of Structure · Change of Character |
| 4 | Order Block · Liquidity Sweep |
| 5 | Stop Loss · Take Profit · Risk : Reward |
| 6 | VWAP |
| 7 | Leverage |
| 8 | Higher Time Frame |
| 9 | Trend Line · Bull Flag · Bear Flag · Head & Shoulders |
| 10 | Confluence |

---

## Discovery moments

When a concept's lesson is learned **in play**, a celebration fires:

> ✦ **NEW KNOWLEDGE DISCOVERED** — *[TERM]* · Added to Journal

It fires once per concept (persisted). Lessons are now also recorded as learned during normal gameplay — previously that only happened via the (now-removed) Lessons tab, so this also keeps mastery tracking and the all-lessons bonus working.

---

## Gating applied everywhere (not just Knowledge)

- **Trades:** a trade's reasons now hide any concept the player hasn't learned. An early-game trade no longer lists *"missing: Order Block, VWAP, Higher-TF"* — those simply don't appear until learned.
- **You / profile:** skill-mastery bars only show for skills the player has reached. No "Order Blocks" or "Multi-Timeframe" bar at Level 1.
- **Notes:** the link dropdown only offers concepts the player has discovered.
- **Guardians:** defeated Guardians show their portrait, realm, and what they taught; undefeated ones are locked silhouettes — no name leak.

---

## Validation — fresh save, live (v72)

Run against the **actual live render functions** at each level:

| Journal opened at | Concepts visible | Future-concept leaks |
|---|---|---|
| **Level 1** | 6 (Candle → Short) | **0** |
| **Level 2** | 9 (+ Trend, Support, Resistance) | **0** |
| **After Boss 2 / Level 3** | 11 (+ Break of Structure, Change of Character) | **0** |
| **Level 4** | 13 (+ Order Block, Liquidity Sweep) | **0** |

At every level checked, **no future concept name or acronym appears anywhere** in the Journal — not in Knowledge, not in trade reasons, not in the skill bars.

---

## Success criterion

> *"A complete beginner can open the Journal without seeing a single unexplained trading term."*

**Met.** At Level 1 the Knowledge tab shows only the six candle basics. BOS, ChoCh, VWAP, Order Block, Liquidity Sweep, Higher Time Frame, and Confluence are all hidden behind `? ? ?` slots until the player learns them — and each arrives with its own discovery celebration.
