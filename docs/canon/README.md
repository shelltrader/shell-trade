# ChartQuest — Canon & Operating Manual

**Status:** PERMANENT · This folder is the source of authority for how ChartQuest is built.
**Created:** 2026-07-04 (Architecture & Stabilization pass)
**Scope:** Documentation only. Nothing in this folder changes code, art, mechanics, or assets.

> **Why this exists.** ChartQuest is a ~20,600-line single-file game (`chart-quest.html`, 810 functions). At this size, changes were causing regressions: deprecated Finn assets got reused, old systems got reintroduced, unrelated files got modified. This folder is the permanent guardrail against that.

---

## Read order for ANY future task (do this first, every time)

0. **[CLAUDE_RULES.md](CLAUDE_RULES.md)** — the hard rules **+ Change Budget + Pre-Flight response format**. Read first, always; post the PRE-FLIGHT block before any implementation.
1. **[development_guardrails.md](development_guardrails.md)** — the mandatory pre-change workflow.
2. **[protected_systems.md](protected_systems.md)** — what you may NOT touch without an explicit request.
3. The canon doc(s) for the area you're changing (see below).
4. **[regression_checklist.md](regression_checklist.md)** — run before every commit.

If a task would violate a canon or protected-systems rule, **stop and confirm with the founder** before writing code.

---

## The documents

| Doc | Purpose |
|---|---|
| [CLAUDE_RULES.md](CLAUDE_RULES.md) | **The hard rules + Change Budget (Small/Medium/Large) + mandatory Pre-Flight response format — read first, every task** |
| [system_inventory.md](system_inventory.md) | Phase 1 — every system, marked Active / Legacy / Deprecated / Duplicate / Unknown |
| [duplicate_report.md](duplicate_report.md) | Phase 2 — every duplicate, ranked Critical→Low |
| [finn_canon.md](finn_canon.md) | Phase 4 — the ONE official Finn. Overrides all other Finn versions |
| [character_canon.md](character_canon.md) | Phase 3 — character identity (Finn + boss roster) |
| [animation_canon.md](animation_canon.md) | Phase 3 — approved animation systems & states |
| [gameplay_canon.md](gameplay_canon.md) | Phase 3 — movement + core loop |
| [trading_canon.md](trading_canon.md) | **The permanent trading doctrine — every trade L1→finale (Constitution, Entry, Stop, TP, Quality, Portal, Review). Read before any trading change** |
| [ui_canon.md](ui_canon.md) | Phase 3 — screens, overlays, HUD |
| [boss_canon.md](boss_canon.md) | Phase 3 — the boss/Guardian systems |
| [progression_canon.md](progression_canon.md) | Phase 3 — levels, gating, save |
| [protected_systems.md](protected_systems.md) | Phase 5 — do-not-touch list |
| [development_guardrails.md](development_guardrails.md) | Phase 6 — the pre-change workflow |
| [dev_workflow.md](dev_workflow.md) | Tooling: `scripts/cq.sh` helper + preview gotchas (frame-pump, overlay-canvas, LAN QR) |
| [architecture_map.md](architecture_map.md) | Phase 7 — systems, dependencies, risk zones |
| [regression_checklist.md](regression_checklist.md) | Phase 8 — pre-commit verification |
| [development_health_report.md](development_health_report.md) | Phase 9 — risks + maintainability score |

## Relationship to existing docs
- `docs/finn-canon/` (01-Character-Bible, 02-Animation-Bible, …) is the **design-intent** source for Finn's proportions/palette/rules. [finn_canon.md](finn_canon.md) reconciles it with the shipping code and flags where they drift.
- The many `docs/*_AUDIT_*.md` files are **point-in-time reports**, not canon. When an audit conflicts with a canon doc, canon wins.

## Definitions used throughout
- **Official / Current / Approved** — the one version future work must use. (Usually the same; where they differ it's called out.)
- **Legacy** — old but still referenced; safe to leave, do not extend.
- **Deprecated** — superseded; must not be reused; slated for eventual removal (not in this pass).
- **Duplicate** — two implementations of the same job; one is canonical, the other is legacy/deprecated.
- **Unknown** — present but ownership/status unverified; treat as read-only until classified.
