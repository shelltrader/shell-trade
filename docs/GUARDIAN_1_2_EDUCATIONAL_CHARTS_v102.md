# ChartQuest — Guardian 1 & 2 Educational Chart Rebuild (v102)

**New rule:** for Guardians 1–2 the charts are **educational, not realistic.** The correct answer must be identifiable by a complete beginner in **one second**. Lesson first, chart second. **Live on v102.**

---

## 1. Rebuilt Guardian 1 chart library
Guardian 1 (The Gambler) rounds: **Predict → Who Won? → Build**. Teaches only green=buyers / red=sellers / strong = strong. Generators rebuilt:

- **Predict (momentum).** *Before:* a subtle trend (trend ≈ noise) — candles all similar size, the "next move" was a coin-flip read. *After (beginner):* a few tiny lead candles → **ONE dominant candle ≈3× the others** → obvious follow-through. The big green/red close *is* the lesson; the next move is unmistakable.
- **Who Won? (recognition).** *Before:* trend 1.3–1.9 against noise ≈1.1 — individual candles fought the trend, so "buyers or sellers?" was arguable. *After:* a **clean one-directional run — every candle closes the same way**, big bodies, tiny wicks. All-green or all-red. Zero ambiguity.
- **Build.** Unchanged — already a construct-a-strong-green/red exercise (restricted to bull/bear at beginner).

## 2. Rebuilt Guardian 2 chart library
Guardian 2 (The False-Breakout Eel) taught **momentum + confirmation**. *Before:* `fake` (mark resistance → judge break → choose a play — 3 ambiguous steps) + `error` (spot the impossible candle — **off-curriculum**) + `fake` at **intermediate** (too hard). All three failed the one-second test.

*After:* **Predict → Read the Close → Who Won?** — three distinct, obvious, on-curriculum exercises:
- **Predict** — momentum continuation (the educational generator above).
- **Read the Close (NEW)** — one dominant candle **spikes the wrong way on a long wick, then CLOSES the other way.** "Who really won?" The close — not the spike — is the truth. This *is* confirmation, taught visually and obviously.
- **Who Won?** — clean directional read.

## 3. Educational chart design rules (now in code)
1. **Dominant teaching candle** — the candle that carries the lesson is 2.5–3× any neighbour.
2. **Trend ≫ noise** — at beginner, directional moves dwarf the random jitter, so a run reads as one color.
3. **Tiny context wicks** — wicks only appear when they *are* the lesson (Read the Close); otherwise minimal.
4. **One concept per chart** — no structure, support, OB, liquidity, or context in G1/G2.
5. **Premium future-tech look** — candles now render with stronger contrast, clean rounded bodies, a subtle color glow, and a bright top edge (not cartoon, not a raw terminal). Educational-software feel.
6. Realistic generation is **preserved for intermediate+** (Guardian 3 onward) — only `beginner` charts became educational.

## 4. One-second readability audit
| Exercise | Lesson | Correct answer is… | Beginner-instant? | Ambiguity? | Pro would disagree? |
|---|---|---|---|---|---|
| Flash Quiz | green = up | the big green body | ✅ (now with OPEN/CLOSE arrows) | none | no |
| Prediction (intro) | predict next | continues the strong close | ✅ | none | no |
| Gambler · Predict | momentum | follow the 3× candle | ✅ | none | no |
| Gambler · Who Won | buyers/sellers | the all-one-color run | ✅ | none | no |
| Gambler · Build | construct a strong candle | build green/red | ✅ (construction, self-evident) | none | no |
| Eel · Predict | momentum | follow the big candle | ✅ | none | no |
| Eel · Read the Close | confirmation | the close color (not the wick) | ✅ (exaggerated wick vs body) | none | no |
| Eel · Who Won | recognition | the all-one-color run | ✅ | none | no |

**Removed for failing the test:** `error` (off-curriculum), `fake`@intermediate (multi-step + ambiguous).

## 5. Before vs after
- **Predict, before:** `▮▮▮▮▮▮` six near-equal candles drifting up — *which way next? …maybe up?*
- **Predict, after:** `▪ ▪ ▪ █████ → ?` tiny candles, then a towering green close — *obviously up.*
- **Who Won, before:** `🟩🟥🟩🟩🟥🟩` mostly-green-but-mixed — *buyers? I think?*
- **Who Won, after:** `🟩🟩🟩🟩🟩🟩` a clean green staircase — *buyers, instantly.*
- **Read the Close, after:** a green body with a long lower wick — *sellers stabbed down, buyers slammed it back and closed up → buyers won.*

## 6. Expected beginner success rates
| | Target | Estimate after rebuild |
|---|---|---|
| **Guardian 1** | 80–90% | **~88–92%** — every read is one-color or one dominant candle; the only misses are mis-taps. |
| **Guardian 2** | 70–80% | **~78–85%** — Read-the-Close adds one genuine "think" (wick vs close) but it's exaggerated, so still high. |

**Success metric:** a beginner can now *explain* their answer ("it's all green, so buyers won"; "the big candle closed up, so it keeps going"; "the wick faked down but it closed up") rather than guess it. The player feels smart before they become skilled.

---

*Live on v102. Includes the prior staged v101 (lesson-portal recall + transformation QA). Visual feel of the new candle style + the Read-the-Close wick proportions want a device playthrough — both are one-line tunes.*
