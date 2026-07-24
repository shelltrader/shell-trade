# TES — Launch-Readiness Critique (Senior Design Review)

**Subject:** [CHARTQUEST_TRADING_EXPERIENCE_SYSTEM.md](CHARTQUEST_TRADING_EXPERIENCE_SYSTEM.md)
**Date:** 2026-07-07 · **Reviewer stance:** senior game-design team, pre-launch, ruthless.
**Constraint honored:** every recommendation preserves the TES philosophy (confidence-first, education > realism). Nothing here softens the doctrine — it hardens it.

**Verdict:** the philosophy is genuinely strong and the emotional spine is sound. But as written it is **not yet ratifiable as a constitution** — it contradicts the shipping boss roster, it launches its first lesson on a signal ~8% of male players can't perceive, and it never designs the single most important beat in trading education: the first loss. Fix the 3 Blockers and the document is production-grade.

**Severity legend:** 🔴 Blocker (cannot ratify) · 🟠 High · 🟡 Medium · ⚪ Low.

---

## A. Contradictions

**A1 🔴 — The boss numbering contradicts the game and the protected boss canon.**
The TES repeatedly names *"Boss 0 (the Gambler)."* The shipping code says the opposite: *"the Notebook is the REWARD for beating **Boss 1** (the Gambler)"* (chart-quest.html:284). The boss roster/order is **protected system #2** — a constitution that misnames a protected entity is dead on arrival, and worse, it will silently authorize a reorder. **Fix (philosophy-safe):** decide and state one mapping — either "Boss 0" is a distinct *tutorial* boss that precedes the numbered Guardians, or the first Guardian *is* the Gambler and the psychology table renumbers to match. Reconcile against `docs/canon/boss_canon.md` and cite it. The emotional curve is unchanged; only the labels are.

**A2 🟠 — "Every loss must teach" vs. "Level 1 is all authored wins."**
The philosophy mandates that *every loss teaches* — yet the design authors **zero** losses in the entire confidence phase, so the **first loss is never designed, never dated, and never specified.** An all-win Level 1 quietly teaches *"I always win,"* which makes the eventual first loss a larger shock — the exact opposite of confidence-building. You cannot honor "every loss must teach" while refusing to design a loss. **Fix:** author **"The First Loss"** as a keystone beat (recommend: early Level 2, after competence is established), with the full Part-4 template — a telegraphed, stop-protected, richly-reframed loss whose lesson is *"even a good read loses sometimes, and your stop kept it small."* This is the missing centerpiece of the whole document.

**A3 🟡 — "Confidence must never crash" vs. a failable Boss with retries.**
Part 3 promises confidence dips "recover within the same session beat," but a retry implies a failure state, and the doc only accounts for the 80% who clear in ≤2 attempts. The bottom ~20% experience an unrecovered crash — precisely the outcome the doctrine forbids. **Fix:** define the **boss-failure recovery** explicitly: assist ramps up on each retry (more time, a highlighted read, a hint), the boss is *guaranteed clearable* within N attempts, and the framing is always *"read it again,"* never *"you failed."*

**A4 🟡 — "Education > Realism" (L1–3) vs. "make reads genuinely predictive" (Part 12, L7+).**
The document mandates authored, made-to-agree outcomes early, then recommends genuine read-predicts-outcome later — but never defines the **handoff.** If realism (and genuine losing) arrives as a switch, it ambushes the confidence the whole system spent six levels building. **Fix:** specify the transition as a **designed ramp** (edge and variance introduced gradually L4→L7, always with the process/outcome reframe), not a version flip.

**A5 ⚪ — Duration bands vs. the single enforced floor.**
Part 6 specifies per-tier bands (L1 24–30, L2 20–26, L3 18–24) but the enforced mechanic and the Part-11 gate are a single floor (`MIN_TRADE_CANDLES ≥ 24`). The *maximum* and the per-tier *shape* are aspirational, not enforced. **Fix:** either enforce the bands (per-level min/max) or state plainly that only the floor is guaranteed and the bands are authoring guidance.

---

## B. Missing Systems

**B1 🔴 — Accessibility (color is the entire Level-1 signal).**
Level 1 teaches *green = up, red = down.* The codebase has **no colorblind support** (only `prefers-reduced-motion`). ~8% of male players — a large slice of the target audience — cannot reliably distinguish the two, so the **first lesson is unlearnable for them,** which lands them straight in "this game is unfair." A teaching product cannot ship its foundational signal as color-only. **Fix (first-class TES requirement):** direction must carry **redundant, non-color encoding** — candle shape/fill, an up/down arrow or +/– glyph, and position — so red/green is a reinforcement, never the sole channel. Add to Forbidden Patterns: *"Never encode a required signal in color alone."*

**B2 🟠 — The inattentive / confused / disengaged player.**
The entire doctrine optimizes for the *"attentive player"* and even the final-question test hedges on it. There is no system for the player who doesn't tap, misreads repeatedly, or drifts. Retention is decided by the *marginal* player, not the ideal one. **Fix:** define a **gentle-nudge / idle-assist** protocol (after N seconds of non-engagement: a pointer, a re-explanation, an auto-advance offer) — assistance only, never a penalty.

**B3 🟠 — No adaptive layer.**
The path is one-size-fits-all. A struggling beginner and a sharp adult get identical pacing — boring one, overwhelming the other. **Fix:** a light **adaptive-assist** rule consistent with the philosophy — *assistance scales up on struggle, difficulty never scales up.* Optionally, an opt-in "I've traded before" accelerate that still passes the curriculum gates.

**B4 🟠 — "Confidence" is unmeasurable as written.**
The whole psychology model hinges on a 0–10 confidence number that is never operationalized — no observable proxy, no telemetry, despite `ContentLog`/Supabase already shipping. You cannot defend, tune, or regression-protect a curve you can't measure. **Fix:** operationalize confidence with **behavioral proxies** — session-continuation rate, retries per boss, time-on-decision, quit-point distribution, first-session return rate — and wire them to `ContentLog`. Part 9's playtest criteria become *live* metrics, not one-off observations.

**B5 🟡 — Monetization boundary undefined.**
The TES claims authority over *"every progression rule"* but is silent on where the paywall sits relative to the confidence curve — a notable omission given the known "3 free bosses → paywall" funnel. **Fix:** add the law *"Monetization never interrupts the confidence build; no paywall, upsell, or friction may appear before the player reaches 'I can learn this.'"*

**B6 🟡 — No spaced repetition / return-player re-teaching.**
The Journal records concepts but nothing *refreshes* them for a player returning after days. Forgotten fundamentals → a confident-looking player who now fails → unfair feeling. **Fix:** a lightweight **concept-refresh** on return (a one-line "last time you learned…" + the Journal surfaced), and a re-teach if a concept's recent success rate drops.

---

## C. Edge Cases (under-specified)

| # | Edge case | Risk | Fix |
|---|---|---|---|
| C1 ⚪ | Player taps the wrong direction repeatedly in Trade 1.3 | Infinite "Quick Read" correction loop → frustration | Cap corrections; after N, escalate to a guided re-teach, then gift the correct read |
| C2 🟡 | Returning player mid-curriculum (left after Trade 1.2) | Resume-vs-restart ambiguity; lost context | Define resume behavior + a one-line recap on re-entry |
| C3 🟡 | Fast adult beginner finds 3 forced wins patronizing | Boredom churn (the opposite failure mode from anxiety) | The opt-in accelerate (B3); tighter copy that respects intelligence |
| C4 🟠 | Shell economy inflation from a higher L1 win rate | Later stakes trivialized → progression/tension collapse | Tie confidence-phase win rate to bet-sizing/`RESERVE` guardrails; cap early compounding |
| C5 🟡 | The ~20% who fail Boss 0 twice | Unrecovered confidence crash (see A3) | Guaranteed-clearable assist ramp |
| C6 ⚪ | Player mutes music / plays silent | Part-3 "focus music" emotional beat is absent | Ensure the emotional arc survives without audio (visual/haptic redundancy) |

---

## D. Opportunities to Simplify (without losing rigor)

**D1 🟡 — Parts 7 (Forbidden) and 8 (Checklist) are ~80% redundant.** The checklist is largely the inverse of the forbidden list, so they will drift out of sync over time. **Simplify:** make the checklist the *single* operational gate and have it *reference* the Forbidden list ("passes all Part-7 prohibitions") rather than restating them.

**D2 🟡 — 24 gates per trade is unsustainable for a small team.** The 12-field authoring template (Part 4) + 12-point checklist (Part 8) is heavy process for every trade, including trivial reinforcement ones. **Simplify:** tier it — **full template + checklist for a new-concept trade**; a **lightweight 4-field record for a reinforcement trade** (objective, duration, journal, prep-next). Same rigor where it matters, no ceremony where it doesn't.

**D3 🟡 — The 0–10 confidence scale is decorative.** It reads precise but measures nothing. **Simplify + strengthen:** replace the number with an **observable proxy** (continues-to-next Y/N + one emotion tag), folding directly into B4's telemetry. Fewer fake numbers, more real signal.

**D4 ⚪ — Part 12's self-assessed scores are unfalsifiable.** Nine 0–10 scores the author grades themselves invite complacency. **Simplify:** either bind each score to a Part-9 measurable criterion (so it's earned) or demote them to "hypotheses to validate," not results.

---

## E. Prioritized fix list (before ratification)

**Must fix to ratify (Blockers):**
1. **A1** — reconcile boss numbering with the roster + `boss_canon.md`.
2. **B1** — mandate non-color-redundant direction encoding; add the Forbidden rule.
3. **A2** — author "The First Loss" as a keystone beat.

**Fix before launch (High):**
4. **A3 / C5** — boss-failure recovery (guaranteed-clearable assist ramp).
5. **B2** — inattentive-player nudge/assist.
6. **B4 / D3** — operationalize confidence with telemetry proxies.
7. **B3** — adaptive-assist layer (assist up, never difficulty up).

**Strengthen (Medium):**
8. **A4** — define the realism-transition ramp (L4→L7).
9. **B5** — monetization-never-before-confidence law.
10. **C4** — economy guardrail vs. inflated win rate.
11. **B6** — return-player concept refresh.
12. **D1 / D2** — merge Forbidden↔Checklist; tier the authoring process.

**Polish (Low):** A5 (enforce bands or mark aspirational), C1/C2/C3/C6, D4.

---

## Closing assessment

The document's philosophy needs no defense — it is the right philosophy, clearly argued. What it lacks is the **unglamorous production layer**: the entity names have to be *right*, the first lesson has to be *perceivable by everyone*, the first *loss* has to be as lovingly authored as the first win, and "confidence" has to become a number you can actually *watch move*. None of these change the doctrine; they make it *true in production*. Fix the three Blockers and this is a constitution worth setting in stone.
