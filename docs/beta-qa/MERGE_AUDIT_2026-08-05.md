# Merge audit — 2026-08-05

Three Claude sessions worked this repo concurrently today. This records what landed, what
overlaps, and the one conflict still outstanding.

## What happened to the merge

The Beta Test QA work (`a8f6133`) is **already on `main`** — it was not merged by a deliberate
merge commit. It was committed while `HEAD` was on `feat/beta-qa-dashboard`, the ops session kept
committing in the same working tree (all four of its commits landed on that branch), and `main`
was moved forward to the same commit. `feat/beta-qa-dashboard` was identical to `main` and has
been deleted; `HEAD` is back on `main`.

**The lesson, worth not repeating:** a feature branch in a *shared* working tree is not isolation.
Three sessions edited one checkout, so whoever branches silently redirects everyone else's next
commit. Isolation needs a `git worktree` (as `.claude/worktrees/*` already does), not a branch.

## Commits

| Commit | Session | Files |
|---|---|---|
| `a8f6133` | beta QA | beta-qa/**, beta-qa.html, docs/beta-qa/**, migration 0011, beta_pull.py, check_test_prefixes.py, founder_report.py, dashboard.html, .gitignore |
| `613c02d` `8f3bfca` `77e2a54` `0fc28da` | ops / tooling | cq.sh, check_syntax.js, verify.js, chart-quest.html, index.html, website/game.html, ops/**, docs/operations/** |
| `e26b5d4` | beta QA | verify.js (gate #3c scope) |

**File overlap between the two sessions' feature commits: none.** Disjoint sets.

## Overlap checks

| Check | Result |
|---|---|
| Full regression gate on main | **PASS** — 18 pass · 0 fail · 0 warn |
| Migration numbering | No collision — `0011` is the only new one |
| JS namespaces | No collision — `window.CQOPS` vs `window.BetaModel` / `BetaInsight` / `BetaCharts` |
| CQTrack inline-vs-source sync (gate #20's subject) | In sync — the beta work never touched `cq-track.js` |
| My files modified after my commit | None |
| Beta dashboard after the merge | All 9 tabs render, 3 engines load, 19 charts, 0 console errors |
| `check_test_prefixes.py` | PASS — 3 sources agree on 10 prefixes |
| `parity.js --self-test` | PASS — 26 checks |

## Gap found and closed

Gate **#3c** ("standalone JS parses") shipped covering `sw.js, website/, ops/, scripts/` — the
roots that "ship or that gate". It did **not** cover `beta-qa/`, so the four dashboard engine
files were unparsed by any gate. That is the same failure mode #3c was written for: `beta-qa.html`
loads them with `<script src>`, so a SyntaxError blanks a panel and logs to a console nobody has
open, exactly as `website/sw.js` shipped broken from build 332 to 335 with every gate green.

Fixed in `e26b5d4`; coverage 15 → 19 files. Verified the gate genuinely fails on a planted break.

## ⚠ Outstanding conflict — NOT mine to resolve

`claude/exciting-swanson-0f93e7` (worktree `.claude/worktrees/exciting-swanson-0f93e7`, commit
`e62bbe1`, "CQTrack drift is now a build invariant, verify #20") **will conflict with `main`** in
`scripts/verify.js`:

```
CONFLICT (content): Merge conflict in scripts/verify.js
```

- It is **pre-existing and between the other two sessions**, not caused by the beta work. That
  branch was cut from `fd7108e`, before gates **#19** and **#3c** existed; both sides then appended
  near the same place (line ~442).
- Confirmed unchanged by `e26b5d4` — those hunks sit at lines 120–144, the conflict at ~442.
- **There is no gate-number collision.** Their `#20` and main's `#19`/`#3c` are distinct, so the
  resolution is to keep both sides, not to choose one.
- **Do not resolve it with `--theirs`.** That branch's `verify.js` has gates 1–18 + 20 and is
  missing **#19 (CQOPS)** and **#3c (standalone JS)**; taking it wholesale silently deletes two
  gates while the run still reports PASS.
