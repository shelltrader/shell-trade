# Release Checklist

**Run this before EVERY deployment.** It is deliberately short — a few minutes — so it's never skipped. It complements (does not replace) the per-commit [`../canon/regression_checklist.md`](../canon/regression_checklist.md).

---

## A. Build & gate (repo side)
- [ ] `BUILD_TAG` in `chart-quest.html` is bumped for this release.
- [ ] `scripts/cq.sh ship` **passes** — this mirrors `index.html`, runs the `verify.js` gate (syntax/boot, mirror-identical, Finn canon, lessons/bosses/save load, `BUILD_TAG`, large-file, protected-diff), and refreshes the marketing embed. **It STOPS on FAIL.**
- [ ] `git status` is clean of unintended files; staged **by explicit path** (never `git add -A`).
- [ ] Release is **tagged** (`git tag -a vYYYY.MM.DD-build<NNN>`), the rollback anchor. See [GitWorkflow.md](GitWorkflow.md).

## B. Asset manifest (the deploy that ships)
- [ ] Output includes **`finn/`** (or the game ships the old turtle), **`bosses/`**, top-level media, `sw.js`, `manifest.json`, icons.
- [ ] Service-worker cache version bumped (so users don't get a stale build).

## C. 9-point smoke test — run on `?fresh=1` (beginner mode), then again on the LIVE URL after deploy
1. [ ] **Game launch** — page loads to the intro/academy with no black screen; opening cinematic plays or is skippable.
2. [ ] **Player movement** — Finn runs/jumps; controls (keyboard + touch) respond; **Finn's sprite renders, not the fallback turtle**.
3. [ ] **First lesson** — the first concept teaches (LEARN→PRACTICE→APPLY→TEST) and gates correctly; nothing tests an untaught concept.
4. [ ] **First boss** — the first Guardian exam opens, a round can be answered, and it resolves (win/again) without softlock.
5. [ ] **Save system** — progress persists across reload (`cq_*` keys); a versioned key isn't reset.
6. [ ] **Authentication** — sign-up (with the consent checkbox) and sign-in work; offline stub degrades gracefully if Supabase is unreachable.
7. [ ] **Monetization stub** — after Guardian 3 the paywall/capstone shows; the BUY button opens the placeholder (or `window.CQ_CHECKOUT_URL` if set). **No real payment is processed — this is a stub, not a live Stripe flow.** Confirm nothing charges or errors.
8. [ ] **Responsive layout** — portrait phone, landscape phone, and desktop all render the HUD without clipped/overlapping controls.
9. [ ] **Console errors** — DevTools console is clean of uncaught errors on boot, first trade, and first boss (a throw in `frame()`/`update()` freezes the game).

## D. Post-deploy verification (on the real production URL)
- [ ] Live URL serves the **new** `BUILD_TAG` (hard-refresh; SW second load too).
- [ ] Security headers present (CSP/HSTS/X-Frame-Options).
- [ ] Auth + save work against the live Supabase config from the production domain.
- [ ] A rollback target exists (host deploy history entry and/or the tag/`_old_*.zip`). See [RollbackProcedure.md](RollbackProcedure.md).

## E. If anything in C or D fails
Do **not** leave a broken build live. **Restore the previous deploy** (RollbackProcedure §1A), fix on a branch, and re-run this checklist. Never hot-patch production.

---
*Time budget: A+B ≈ 3 min, C ≈ 5 min, D ≈ 2 min. If it's taking longer, something regressed — stop and investigate.*
