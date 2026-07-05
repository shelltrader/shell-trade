# Development Guardrails — the mandatory workflow

**Status:** PERMANENT. Every future ChartQuest change follows this, no exceptions. It exists to stop the failure modes that motivated this pass: reintroduced old systems, reused deprecated assets, unrelated files modified, feature requests causing regressions.

---

## Before writing ANY code

1. **Read canon.** Open the canon doc(s) for the area you're touching (Finn → [finn_canon.md](finn_canon.md), movement → [gameplay_canon.md](gameplay_canon.md), etc.) and the [system_inventory.md](system_inventory.md) entry for it.
2. **Read [protected_systems.md](protected_systems.md).** If the change touches a frozen system, stop and get explicit approval first.
3. **Classify the CHANGE BUDGET** — Small / Medium / Large (definitions in [CLAUDE_RULES.md](CLAUDE_RULES.md#change-budget)). This sets how much you must do before coding. If the work crosses a threshold mid-task, stop and re-classify.
4. **Complete the PRE-FLIGHT CHECK and post the PRE-FLIGHT block** — the mandatory response format in [CLAUDE_RULES.md](CLAUDE_RULES.md#pre-flight-check) (Scope · Files · Non-Scope Files · Protected Systems YES/NO · 0–10 regression risk per system + Overall · Rollback Plan). **Await approval** if the change is Large or `Protected Systems Affected: YES`.
5. **Modify only approved files.** Do not "drive-by" fix unrelated things. Do not edit `index.html`, `chart-quest.min.html`, `dashboard.html`, `website/`, or `ChartQuestQA/` unless the task is explicitly about them.

## While coding
- **One system per change.** A movement task edits `CFG` + `drawFinnSprite`; it does not touch lessons, bosses, art, or economy.
- **Never gate rendering on "is a deprecated asset loaded."** (This is exactly how the deprecated Finn rig kept coming back — assets load ≠ approved.) Gate on an explicit canon flag/state, not asset presence.
- **Match the surrounding code** (comment density, naming, idiom). This file is heavily commented with build-history rationale — keep that.
- **Bump `BUILD_TAG`** so a playtest can confirm which build loaded.

## After coding — before commit
1. **Run `scripts/cq.sh ship`** — mirrors `index.html`, runs the regression gate (`scripts/verify.js`: syntax/boot, mirror, Finn canon, lessons/bosses/save, `BUILD_TAG`, large-file, protected-diff), and prints the tag. It **STOPS on FAIL**. Fix the FAIL, don't skip it. For an approved protected change: `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship`.
2. Run the **[regression_checklist.md](regression_checklist.md)** as the human backstop for what the gate can't judge (assets/bosses/UI/lessons/progression unchanged unless requested; visuals; difficulty).
3. **Verify in the browser** if the change is observable (movement/art/UI): beginner mode `?fresh=1`, on-device via QR when it's feel/touch/art.
4. **Commit only what the task touched.** Never `git add -A`. Do not sweep in `deploy.zip`, unrelated Swift, or `sw.js` changes.

## Red flags that mean "stop and confirm"
- The diff touches a **protected system**.
- You're about to **re-enable** or **fall back to** anything marked ⛔ Deprecated in [system_inventory.md](system_inventory.md).
- The change would make Finn **easier** (responsiveness ≠ difficulty).
- You're editing **more than one system** for a single request.
- You can't name the exact files before starting.

## Commit hygiene (repo has 137 MB `deploy.zip`, a Swift app, a website in the same tree)
- Stage **explicitly by path**: `git add chart-quest.html index.html [the docs you wrote]`.
- Never commit: `deploy.zip`, `*_old_*.zip`, `.netlify-token`, `chart-quest.min.html` (unless a build task), `ChartQuestQA/` or `website/` (unless the task is theirs).
