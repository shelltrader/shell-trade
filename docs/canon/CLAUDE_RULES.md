# CLAUDE_RULES.md — Rules of Engagement for ChartQuest

**READ THIS FIRST, EVERY TASK. These are hard rules, not guidelines.**
If a task conflicts with a rule below, **stop and ask the founder before writing any code.** Approval for one change never implies approval for another.

Deeper detail lives in the rest of `docs/canon/`; this page is the law.

---

## 🚫 NEVER (without an explicit request for that specific change)

1. **Never modify character assets** — no adding, removing, swapping, or restyling anything in `finn/` or `bosses/`.
2. **Never replace Finn.** Finn walks as **`finn/run.png`** (static legs, `drawFinnSprite`). Never re-enable the `body.png`+`leg.png` leg rig or the `walk-sheet.png` old art. Never fall back to procedural `drawTurtle` except as the automatic load-failure fallback.
3. **Never gate Finn's rendering on "is a deprecated asset loaded."** Loading ≠ approved. (This is exactly how the deprecated rig kept coming back.)
4. **Never redesign UI without approval** — no reordering the auth → cinematic → academy → play flow, no HUD relayout, no changing the portal colors (purple = lesson, blue = trade, gold = boss).
5. **Never change lesson order without approval** — do not reorder `LESSONS`, alter `conceptTier` gates, or test a concept before it's taught (LEARN → PRACTICE → APPLY → TEST).
6. **Never change monetization without approval** — the paywall/checkout is a deliberate stub; do not wire real money.
7. **Never change the boss roster, order, difficulty, or gating** — and never read the deprecated boss object at line ~9206.
8. **Never make Finn easier as a side effect** — responsiveness ≠ difficulty (founder mandate).
9. **Never change save-key semantics** — no renaming/removing `cq_*` keys; new state uses a versioned `cq_*_v` key.
10. **Never hand-edit `index.html`** — it is a mirror of `chart-quest.html` (the source of truth). Never ship the stale `chart-quest.min.html` without a build task.
11. **Never re-enable or extend anything marked ⛔ Deprecated** in `system_inventory.md`.
12. **Never `git add -A`.** Stage by explicit path. Never commit `deploy.zip`, `_old_*.zip`, `.netlify-token`, `ChartQuestQA/`, or `website/` unless the task is explicitly about them.

## ✅ ALWAYS

13. **Only modify files listed in the task scope.** Name the exact file(s) and line region before starting. For the game that is almost always **`chart-quest.html` only** — no drive-by edits to unrelated files.
14. **Read canon before coding** — `development_guardrails.md` → `protected_systems.md` → the relevant `*_canon.md`.
15. **Confirm scope in one sentence** — *"This edits X to do Y and touches nothing else."* If you can't, split the task.
16. **Bump `BUILD_TAG`**, then **mirror** (`cp chart-quest.html index.html`), then **syntax-check** the inline script.
17. **Run `regression_checklist.md`** before every commit.
18. **Verify in the browser** when the change is observable (art/UI/movement) — `?fresh=1`, on-device via QR for feel/touch/art.

## 🛑 When a task requires touching a protected system
Do not proceed silently. Say exactly:
> *"This needs a change to [protected system], which is frozen by `protected_systems.md`. Do you want me to make that change?"*
Then act only on an explicit **yes**, and only to the extent granted.

---

## CHANGE BUDGET

**Before any implementation, classify the task into one of three budgets.** The budget sets how much you must do *before* writing code. Purpose: stop scope creep, unrelated edits, and large accidental refactors.

### SMALL CHANGE
**Requirements (ALL must hold):**
- One file.
- Fewer than **50 lines** modified.
- No protected systems touched.

**Examples:** button text · a single bug fix · a small movement tweak (one `CFG` value).

**Process:** may proceed **immediately after scope confirmation** (a brief PRE-FLIGHT — see below).

### MEDIUM CHANGE
**Requirements:**
- Up to **3 files**.
- Fewer than **200 lines** modified.
- No protected systems touched.

**Examples:** a new UI element · gameplay tuning · animation improvements.

**Process — must provide before coding:**
- Scope summary
- Files affected
- Risk score

### LARGE CHANGE
**Any ONE of these makes it Large:**
- More than **200 lines** modified.
- More than **3 files**.
- Any architecture change.
- **Any** protected-system involvement.

**Examples:** character-system changes · save-system changes · monetization changes · major gameplay redesigns.

**Process — must provide before coding:**
1. Implementation Plan
2. Files To Modify
3. Files Explicitly **Not** Modified
4. Risk Assessment
5. Rollback Plan

**Large changes require explicit founder approval before any code is written.**

> If a task starts as Small/Medium but crosses a threshold mid-work, **stop, re-classify, and re-run the process for the higher budget.** Never let a Small change quietly grow into a Large one.

---

## PRE-FLIGHT CHECK

**Before writing code, answer every question below.** Scale the depth to the CHANGE BUDGET (Small = brief; Large = full + await approval).

**Scope** — What exactly is changing?

**Files** — Which files will be modified? *List exact files.*

**Non-Scope Files** — Which files will explicitly **NOT** be modified?

**Protected Systems** — Will any protected system (`protected_systems.md`) be affected? **YES / NO.**
→ If **YES: STOP and request approval** before continuing.

**Regression Risk** — score each 0–10 (0 = untouched, 10 = high chance of breaking it):
- Character: 0–10
- Movement: 0–10
- UI: 0–10
- Progression: 0–10
- Lessons: 0–10
- Save System: 0–10
- **Overall Risk: LOW / MEDIUM / HIGH**

**Rollback Plan** — How can this change be reversed? (e.g., "revert this one hunk / this commit"; for Large, name the safe restore point.)

---

## MANDATORY TASK RESPONSE FORMAT

**Before every implementation task, respond in this exact block first** (fill briefly for Small, fully for Medium/Large):

```
PRE-FLIGHT

Task:
[summary]

Files Changing:
[exact file list]

Files Protected:
[files/systems being left untouched]

Protected Systems Affected:
YES / NO

Risk Score:
Character _/10 · Movement _/10 · UI _/10 · Progression _/10 · Lessons _/10 · Save _/10 → Overall LOW/MEDIUM/HIGH

Rollback Plan:
[plan]
```

Then: **Await approval if required** (Large changes, or any `Protected Systems Affected: YES`). Small/Medium with `NO` protected systems and LOW/MEDIUM risk may proceed straight after the block.

---

**One-line summary:** Classify the change budget → post the PRE-FLIGHT block → get approval if required → change only the approved files → never touch Finn/art/bosses/lessons/UI/monetization/saves without an explicit ask → verify → mirror → commit by path.
