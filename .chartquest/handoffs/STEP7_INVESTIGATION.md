# Step 7 Investigation — Three-Artifact Parity Gate

## TASK

Prove the first autonomous engineering chain on one bounded, objective release-confidence defect.

## OBJECTIVE

Make regression gate #8 verify byte identity across all three canonical local game artifacts:

```text
chart-quest.html == index.html == website/game.html
```

This ticket is tooling-only. It must not synchronize, rewrite, or otherwise modify the real game artifacts.

## ROOT CAUSE

`scripts/verify.js` defines only the source and root mirror and gate #8 compares only their SHA-256 values. `scripts/cq.sh site` copies the source into `website/game.html`, but its local guard checks only the extracted build label. Therefore ordinary `scripts/cq.sh verify` can miss a byte-level drift in the actual Cloudflare game artifact when its build/stamp text still matches. Step 6B's formal release gate now checks all three, but routine regression verification retains this earlier blind spot.

## EVIDENCE

- `.chartquest/qa/KNOWN_ISSUES.md` records the gap as P0.
- `scripts/verify.js` gate #8 hashes only `chart-quest.html` and `index.html`.
- `scripts/cq.sh site` checks only the source/site build-label equality after copying.
- `CHARTQUEST_RC_BASELINE_2026-08-10.md` independently records the missing `website/game.html` byte comparison.
- `.chartquest/INVARIANTS.md` marks complete artifact verification as partial.
- `scripts/release_control.js` demonstrates the accepted three-artifact equality rule for a formal release.
- Current main checkout: source is already modified to build 360 while `index.html` and `website/game.html` remain build 359. This inherited state is not a valid candidate and must remain untouched by Step 7.

## AFFECTED FILES

- `scripts/verify.js`
- One small tooling module and/or disposable fixture test under `scripts/`
- Lifecycle records under `.chartquest/` after review/QA

## RECOMMENDED FIX

Add one reusable, fail-closed artifact-parity checker for the three exact paths. Gate #8 should call it and report missing or mismatched paths precisely. Add a network-free test that creates only temporary fixtures and proves positive, root-mirror mismatch, site mismatch with unchanged metadata text, and missing-file behavior.

## ACCEPTANCE CRITERIA

1. Identical source, root mirror, and site artifact pass.
2. A changed `index.html` fails and names that path.
3. A changed `website/game.html` fails even when source/index match and build/stamp text remains identical.
4. A missing root mirror or site artifact fails cleanly with a useful path-specific message.
5. The checker exits nonzero for every mismatch.
6. Existing regression checks remain behaviorally unchanged.
7. Full verification records the inherited build-360 drift honestly; no mirroring, build bump, push, merge, or deployment is part of this ticket.
8. Reviewer reruns positive and negative fixtures; QA records expected versus actual results and the invariant outcome.

## RISKS

- Primary risk: a test accidentally modifies the dirty real artifacts. Mitigation: fixtures must live in a disposable temporary directory.
- Secondary risk: a broad refactor of `scripts/verify.js`. Mitigation: one narrow helper and one gate-call change only.
- Current Step 6B controls are untracked in the main checkout and are not present in the isolated Step 7 branch; do not conflate Step 7 implementation with release-control bootstrap.

## TEST PLAN

- Run the dedicated artifact-parity fixture test.
- Run JavaScript syntax checks for changed/new tooling.
- Run the full regression gate in the isolated clean worktree: expected PASS except the optional headless-boot skip.
- Run the full regression gate in the dirty main checkout: expected inherited artifact-parity FAIL, now naming both out-of-sync artifacts as applicable.
- Inspect the diff to prove no gameplay, generated artifact, deployment, provider, or credential file changed.

## CURRENT STATE

- Step 6B: **PASS WITH ACTION**; Step 7 authorized; production frozen.
- Implementation branch: `codex/step7-artifact-parity`.
- Worktree: `/Users/owl/Claude/Projects/Shell Trade/.codex/worktrees/step7-artifact-parity`.
- Base commit: `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78`.

## WORK COMPLETED

Investigation and issue selection complete. No implementation change made.

## FILES TOUCHED

- `.chartquest/handoffs/STEP7_INVESTIGATION.md` (PM/CTO durable transcription of the delegated Investigator report)

## TESTS

No implementation tests yet. Repository evidence and current verifier behavior were inspected read-only.

## NEXT ACTION

Implement the minimum tooling change in the isolated worktree, then hand it to an independent Reviewer.

## DO NOT TOUCH

- `chart-quest.html`
- `index.html`
- `website/game.html`
- Production, Cloudflare, Netlify, Supabase, secrets, `main`, or existing unrelated worktrees
