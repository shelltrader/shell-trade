# Beta Testing Checklist

**Status:** Readiness gate + tester script for the first external beta. Goal: testers experience a stable game and can report issues, without hitting half-built systems or privacy problems.

---

## 1. Release-to-beta gate (all must be TRUE before inviting testers)
These are **operational**, mostly tracked in [`../PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md):
- [ ] **Production SMTP configured** (Supabase built-in mailer is dev-only; concurrent signups silently fail). *#1 blocker.*
- [ ] **Auth Site URL / Redirect URLs** point at the real beta domain (not `localhost:3000`).
- [ ] **`dashboard.html` is not publicly readable** without auth (put behind auth + apply migration `0009`), or blocked at the edge as a stopgap.
- [ ] **Supabase plan** appropriate for expected tester count (Free pauses on inactivity + strict limits; upgrade to Pro before real load).
- [ ] **Leaked-password protection** on; min password length reviewed.
- [ ] [ReleaseChecklist.md](ReleaseChecklist.md) passed on the exact build testers will get.
- [ ] Rollback path confirmed ([RollbackProcedure.md](RollbackProcedure.md)) — you can revert in one step if beta surfaces a showstopper.

## 2. What to tell testers up front (set expectations)
- **It's a beta** — progress may reset between builds.
- **Payments are not live.** The "unlock/BUY" flow is a placeholder; nothing will charge them. (Prevents confused "checkout is broken" reports.)
- **How to report bugs** — the in-game bug-report captures context; also give a direct channel (form/email).
- **Not financial advice** — the Terms include this disclaimer; the game teaches concepts, it is not trading advice.

## 3. Tester coverage matrix
Ask the beta group to collectively cover:
| Dimension | Cover at least |
|---|---|
| Device | 1 iPhone (Safari), 1 Android (Chrome), 1 desktop |
| Orientation | portrait + landscape on phone |
| Network | good wifi + a flaky/again-load (service-worker cache) |
| Account | brand-new signup (email confirm flow) + returning login |
| Mode | fresh beginner (`?fresh=1`) — the true new-player path |

## 4. Core experience testers should verify (plain-language)
- [ ] Game opens and the intro doesn't strand them on a black screen.
- [ ] Finn looks right and moves smoothly; touch controls work on phone.
- [ ] The first few lessons make sense to a beginner (10-year-old wording target) and never quiz something not yet taught.
- [ ] The first Guardian/boss can be reached and completed.
- [ ] Closing and reopening keeps their progress.
- [ ] Signing up and back in works; the confirmation email arrives (needs SMTP — see gate).
- [ ] Sound/music toggle works; nothing is jarring.
- [ ] No crashes/freezes; report the build number (shown as `BUILD_TAG`) with any bug.

## 5. Feedback loop
- Triage reports against [`../canon/protected_systems.md`](../canon/protected_systems.md): a "make Finn easier" request is a design decision, not a bug.
- Reproduce on `?fresh=1` before changing anything; fix on a `feature/*`/`hotfix/*` branch; ship via [ReleaseChecklist.md](ReleaseChecklist.md).
- Never respond to beta pressure by editing production directly or by touching a protected system without approval.

## 6. Exit criteria (beta → wider release)
- No open crash/softlock reports on the new-player path.
- Auth + email + save reliable under the observed tester load.
- Dashboard/analytics locked down; retention jobs scheduled.
- Load test run on a staging branch at the target user count (needs Supabase Pro).
