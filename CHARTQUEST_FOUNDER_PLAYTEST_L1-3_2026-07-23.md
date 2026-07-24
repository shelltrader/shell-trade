# ChartQuest — Founder Blind Playtest · Levels 1–3
## "What would bother me?" — 2026-07-23

*Method: a founder blind playtest of the first hour. Every few seconds: "what would bother me?" — log every stop-the-playtest moment, no fixes until the log is complete (per the prompt). This session combines a **real first-person play** of the opening beats (actual browser, muted, `?fresh=1`) with a code-grounded reading of the deeper beats.*

> **Scope honesty.** The opening beats were played first-person in the real build (screenshots). The full-arc, six-persona automated playtest (cold-open → candle lesson → first trade → scare/win → Guardian 1 → First-Loss/progression) was authored and launched but **every persona hit the Anthropic session/quota limit** (resets 7:30am Asia/Bangkok) and returned nothing. The workflow is saved and re-runnable (`founder-playtest-l1-3-wf_6ae2afc6-971.js`); it should be re-run on quota reset to complete the deeper-arc log. What follows is the **verified** subset — real observations + friction confirmed by reading the actual flow code. Nothing below is a bug invented by a broken test harness.

---

## Friction log (verified)

### 🔴 F-1 · "LIOSLANT" — a nonsense word in the very first frame *(art asset · founder call)*
- **What I see (real play):** the opening cinematic's emotion-ring reads `FEAR · SPREAD · LIOSLANT · MANIPULATION · GREED`. "LIOSLANT" is not a word.
- **What bothers me:** it's the *first thing a new player reads.* A garbled word in frame one silently says "this was made carelessly" — corrosive to trust before the game has earned any.
- **Grounding:** the ring words are **not code strings** (grep for `MANIPULATION`/`GREED`/`LIOSLANT` finds none in `chart-quest.html`) — they are **baked into the cold-open cinematic image**, drawn by `IntroCinematic` (:17779). Previously flagged as the "LIOSTANT" typo at build 283, still open.
- **Fixability:** `art-asset`. Requires regenerating the cold-open image with corrected ring text (likely intended: a real market-emotion word such as **LIQUIDATION** or **ILLUSION**). Cannot be fixed in code and I will not fabricate an AI-art asset — **routed to the founder.**

### 🟡 F-2 · The cold-open is 2+ full-screen lore beats before any interaction *(design call)*
- **What I see (real play):** beat 1 "You wanted financial FREEDOM… trapped inside the Blockchain," beat 2 "Defeat them all. Then face me. THE MARKET MAKER," each a tap-to-advance full-screen text card, *then* the game.
- **What bothers me:** for an impatient beginner or a child, that's ~15–25s of passive reading before they touch anything — the exact "wall before the fun" the beta onboarding audit flagged as funnel-leak #1. A non-gamer parent testing this may bounce before the (excellent) first interactive beat.
- **Grounding:** `IntroCinematic` (:17779), gated by `cineActive`; there **is** a `SKIP ▸` button (good — returning players and the impatient can escape).
- **Fixability:** `design-call`. The cinematic is Campaign-Bible canon (the Governing Image), and SKIP already mitigates. **Not a unilateral change** — flagged for a founder decision on whether the cold-open should hand control over sooner on first play. (No change made.)

### 🟢 P-1 · The first interactive beat is genuinely strong *(no action — bank it)*
- **What I see (real play):** L1/Guardian 1 loads with a clean HUD, a persistent `CURRENT LESSON: ▲ GREEN = UP / ▼ RED = DOWN` card, a `THIS WAY ▸▸▸` forward compass (directly attacks the "which way do I go" funnel leak), a `SPACE to JUMP — hop across the candle tops` prompt, a full control legend (`A/D MOVE · SPACE JUMP · W BOOST`), a readable candle staircase, a spin-pole wick, and the shell count. A beginner is told exactly what to do.
- This is the model the rest of the onboarding should live up to.

---

## Not-a-finding (rejected to avoid a false report)
- **"A/D movement is locked at the first beat."** My automated driver (synthetic key events + manual `update()` pumping) could not move Finn — but that is a **test-harness artifact**: the game's rAF is throttled when the pane isn't foreground, and the physics integrate through the real `frame()` loop (`turtle.x += walkSpeed·dt·dir`, gated only by `!turtle.halt`/daze, :13177). There is no intro movement-lock in the code. A real player pressing `D` moves. **Not reported as a bug** (build-283 discipline: never report a defect a broken harness couldn't actually reproduce).

---

## Disposition
- **F-1 (LIOSLANT):** founder — regenerate the cold-open art. Carried into the Founder Acceptance Test (Prompt 8).
- **F-2 (cold-open pacing):** founder design call; SKIP mitigates. No code change.
- **Deeper arc (candle lesson → first trade → scare/win → Guardian 1 → First-Loss/progression):** **quota-deferred.** Re-run the saved persona-playtest workflow on reset to complete the log before the next real playtest.
