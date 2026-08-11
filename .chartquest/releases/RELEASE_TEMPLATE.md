# Production Release Manifest Template

Do not create a real manifest until a release candidate exists. This is release evidence, not a substitute for a Git commit: before the gate runs, the candidate source and all deployed artifacts must already be committed and clean. The active manifest may be the one permitted untracked file so it can name that already-existing candidate without creating a self-referential commit.

Create the manifest under `.chartquest/releases/`, fill the candidate-identity fields from `node scripts/release_control.js identity`, then use it to acquire the shared lock and run the gate. The release-control commands verify only; they never deploy or push.

| Field | Value |
|---|---|
| Release ID | [REQUIRED — stable unique ID] |
| BUILD | [REQUIRED — `build <number>`] |
| GIT COMMIT | [REQUIRED — full 40-character candidate SHA] |
| BRANCH | `main` |
| RELEASE OWNER | Release Manager |
| RELEASE START | [REQUIRED — ISO 8601 UTC] |
| SOURCE SHA256 | [REQUIRED — exact `chart-quest.html` hash] |
| MIRROR SHA256 | [REQUIRED — exact `index.html` hash] |
| WEBSITE GAME SHA256 | [REQUIRED — exact `website/game.html` hash] |
| WEBSITE TREE SHA256 | [REQUIRED — tracked `website/` path+content identity] |
| CQ-BUILD CONTENT | [REQUIRED — recorded metadata-stamp content] |
| CQ-BUILD BUILT-AT | [REQUIRED — recorded metadata-stamp timestamp] |
| BUILD ARTIFACT | [REQUIRED — human-readable identity/reference] |
| REVIEW / QA EVIDENCE | [REQUIRED before production action] |
| DEPLOYMENT ID | UNKNOWN before deployment; record the reason and final ID after deployment |
| DEPLOYMENT TIME | UNKNOWN before deployment; record the reason and final time after deployment |
| PRODUCTION FINGERPRINT | UNKNOWN before deployment; record served build, cq-build stamp, and exact served-content evidence after deployment |
| PRODUCTION URL | [REQUIRED] |
| FRESH-BROWSER VERIFICATION | PASS / FAIL / NOT TESTED / UNKNOWN, with evidence |
| FOUNDER VERIFICATION | APPROVED / HELD / UNKNOWN, with evidence |
| RELEASE DECISION | APPROVED / HELD / ROLLBACK / REJECTED |

## Candidate-gate procedure

```text
1. Build and commit the candidate. Do not use a dirty worktree as a candidate.
2. Create this manifest and record `release_control.js identity` output exactly.
3. node scripts/release_control.js acquire --manifest .chartquest/releases/<manifest>.md
4. node scripts/release_control.js gate --manifest .chartquest/releases/<manifest>.md
5. If the gate does not print PASS, HOLD. It did not deploy anything.
6. After an authorized deployment, run `scripts/cq.sh smoke --manifest .chartquest/releases/<manifest>.md`; it proves the served `/game` bytes and `cq-build` stamp match the approved candidate before founder verification.
```

The gate requires all of the following to agree: current branch `main`; active shared lock; release ID; full commit; build label; complete source/mirror/site equality; `cq-build` content and time; individual `website/game.html` SHA-256; tracked `website/` tree SHA-256; and the existing `scripts/verify.js` regression gate. It intentionally treats a `cq-build` stamp as provenance metadata, not proof of the final Git commit; the SHA-256 identities and full candidate commit provide that proof.

## Supporting evidence

- Release-lock record
- Review outcome
- QA and regression results
- Build/verification results
- Production verification evidence
- Known exceptions and rollback reference
