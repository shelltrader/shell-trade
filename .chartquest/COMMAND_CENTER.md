# ChartQuest Command Center

## Purpose

This directory is the control plane for ChartQuest engineering work. It records verified state, planned work, quality evidence, release decisions, and handoffs without replacing the project's gameplay canon or release documentation.

This Work thread is the persistent ChartQuest PM/CTO command center. It reads and adjudicates this control plane after every worker handoff; the Founder is not responsible for relaying prompts, reports, or routine technical decisions between agents.

It does not grant deployment authority or change the game.

## Current project phase

The repository is in closed-beta / release-candidate stabilization. Engineering work may continue on isolated branches, but production is frozen and the served build identity remains unverified; see [CURRENT_STATE.md](CURRENT_STATE.md).

## How tasks move through the system

1. **Intake** — record the request, affected system, constraints, and unknowns.
2. **Investigation** — establish repository and production facts before proposing a change.
3. **Planning** — identify scope, acceptance criteria, required approvals, and regression invariants.
4. **Implementation** — make the smallest scoped change; record touched files and evidence.
5. **Review** — inspect the change against protected systems, architecture, and task scope.
6. **QA** — run applicable regression checks and record results in `qa/`.
7. **Build** — establish a reproducible candidate and its build identity.
8. **Deployment** — deploy only an approved candidate through the documented release path.
9. **Production verification** — confirm the served artifact and critical player flow.
10. **Founder verification and release decision** — record approval, hold, or rollback decision in a release manifest.
11. **Handoff / close-out** — leave an evidence-based handoff for the next task.

## Roles

### Founder role

Sets product priorities, approves material scope and release decisions, and verifies that a production candidate satisfies the intended player experience. No individual is assigned to this role here.

### Product-management role

Keeps the roadmap, sprint state, decision log, scope boundaries, and founder decisions current. It converts requests into verifiable acceptance criteria without inventing product facts.

### Engineering role

Investigates, implements scoped work, preserves documented invariants, and produces an evidence-based handoff. It does not treat a local build or a branch name as proof of production state.

### QA role

Maintains regression evidence, records reproducible issues and beta findings, and distinguishes tested behavior from untested behavior. A green static check is evidence, not a substitute for relevant live verification.

### Release-management role

Controls release evidence: candidate build, commit, artifact identity, deployment record, production verification, founder verification, and final release decision.

## Agent communication model

Work is communicated through task records, QA evidence, release manifests, and handoffs in this directory. Statements about state must identify whether they are verified, documented-but-unverified, or unknown. Durable role responsibilities live under `.chartquest/agents/`; this command center assigns each task to a role without requiring the Founder to relay prompts or reports.

### Persistent orchestration rule

- The PM/CTO scopes and sequences work in this thread, then records the resulting decision in `.chartquest/`.
- Every delegated role writes its evidence and handoff in `.chartquest/` before the next role begins.
- The PM/CTO reads that durable evidence, accepts it, rejects it, or sends it back for correction; conversational claims alone do not advance a task.
- Founder involvement is reserved for product direction, subjective acceptance, material spend, irreversible account actions, and final release acceptance. Routine triage, QA coordination, and engineering choices remain inside the command center.

## Definition of Done

A task is done when its requested scope is complete, affected invariants have been checked, test evidence and known limitations are recorded, and the next action is clear. A production release additionally requires a uniquely identified candidate, production verification, founder verification, and an explicit release decision.

## Production safety philosophy

Production is a distinct environment, not an assumption derived from a local checkout. Releases must be traceable to a specific build and commit, use the documented deployment path, and be verified after propagation. Worktrees still share repository credentials, but Step 6B's local gates and active no-bypass GitHub production freeze now prevent ordinary agents from updating `main`; a future release requires deliberate Founder/Release-Manager authorization and full release evidence.
