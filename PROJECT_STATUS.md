# ChartQuest — Project Status

*As of 2026-07-15. Entry point for the architecture: [`docs/architecture-ratified/ARCHITECTURE_README.md`](docs/architecture-ratified/ARCHITECTURE_README.md).*

## Frozen (Do Not Touch)

The **ratified architecture** — v1.0, closed to direct edits. Changes require an ADR via the [Architecture Change Policy](docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md).

- **Governance layer** — `docs/architecture-ratified/` (Manifest, Constitution, Change Policy, README, Index).
- **Visual Market Constitution** — `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (all candle/chart visuals, chart types A/B/C, `V-*`).
- **Curriculum Engine** — `docs/curriculum-engine/` (one Lesson schema, frozen decisions D1–D8, the sole `VR-*` registry).
- **Pattern Operating System** — `docs/pattern-library/` (one Pattern schema, decisions P1–P8, the Concept Catalogue, the sole `PR-*` registry, five gold-standard patterns).
- **Trading canon / Experience System** — `docs/canon/trading_canon.md`, `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` (trade truth).

## Active Development

The game itself — where effort now goes. None of this requires new architecture.

- **Level 1 & the first hour** — onboarding, the LEARN→PRACTICE→APPLY→TEST loop, beginner-mode (`?fresh=1`) verification.
- **Finn** — the canonical character/animation system, sprites, movement feel.
- **First boss** — Guardian 0/1 (The Gambler), the mini-game knowledge-exam loop.
- **Notebook** — the Lost Wisdom system (whispering-wick clues, hidden pages).
- **Beta launch prep** — telemetry + cloud saves, the honest guest funnel, the landing/marketing site (`site/rc1`).
- **Trade feel** — making the first trades feel felt (the retention fulcrum from the beta audits).

## Future Roadmap

Intentionally deferred until after the beta.

- **Content: Levels 2–10 + Market Maker finale** — authored as lessons + patterns against the frozen schemas (Phase 2B is content, not architecture).
- **Rendering engine migration** — implement the canonical `window.CQ` candle engine per `docs/implementation/VISUAL_MARKET_PHASE1_AUDIT.md`, gameplay-last and parity-gated; stand up the verification substrate first.
- **Pattern & lesson libraries at scale** — author the full pattern set and the Guardians 2–10 curriculum by analogy to the five reference patterns.
- **Trading V2** — the authored-scenario trade pipeline (validate-first, per the decision gate) once the beta proves the core loop.
- **Guardians 2–10 identity, bosses, and higher-timeframe concepts** — after the first-boss loop is proven.
