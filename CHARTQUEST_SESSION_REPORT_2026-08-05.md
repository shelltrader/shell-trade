# ChartQuest — Session Report

**Date:** 2026-08-05 · **Prepared for:** hand-off / assistant briefing
**Status:** ✅ All work shipped, deployed and verified in production.
**Production right now:** build **343** · CSP + 5 other security headers enforcing · smoke test **46/46**

---

## 1. In one paragraph

The brief was to build an *operational foundation* for ChartQuest — the plumbing that makes
problems visible instead of silent. That got built and shipped. While proving it worked against
the live site, it turned up **four real problems that had been live and invisible**, the largest
being that the site's security policy had never actually been applied for the entire closed beta.
All four are now fixed, deployed and verified. One mistake was made along the way (documented in
§5) — it was caught within two minutes and repaired before it could affect any data.

---

## 2. What was built

**`window.CQOPS` — the operational foundation.** One place that answers the questions nobody could
answer before:

| Piece | What it does |
|---|---|
| `env` | Knows whether it's running on a laptop, a test phone, or the live site — and configures itself accordingly |
| `build` | Reports exactly which version is running and which source it was built from |
| `log` | One logging system, so future features don't each invent their own |
| `err` | Handles failures gracefully — retries, saves data that failed to send, shows friendly messages |
| `flags` | Turn features on/off without changing game code |
| `health` | Counts what's going wrong: crashes, missing files, failed network calls |

**Three things are now watched automatically**, with no extra work needed from any feature:
runtime errors, **missing files**, and **failed network requests**. The missing-files watcher is
the one that matters most historically — it's the exact failure that hid broken boss cinematics
from ~20 releases.

**Important:** this phase deliberately **changed nothing players see**. It builds the road; it
doesn't move traffic onto it. Adoption happens gradually, documented in the Integration Guide.

---

## 3. What was found — four live problems

### 3.1 The security policy had never been applied *(most serious)*

The site was sending **no Content-Security-Policy, no HSTS, no clickjacking protection** for the
whole closed beta.

Not because nobody wrote one — a complete, carefully-commented policy existed in the repository.
It was simply **in the wrong folder**. Cloudflare reads that file from the folder it publishes,
which is `website/`, and the file sat at the top level. So Cloudflare never read it, and everyone
who checked the repository believed it was live.

Fixing it revealed **four faults in the policy itself** — an unused policy can never be proven
wrong. Two would have broken the site:

| Fault | What it would have done |
|---|---|
| `X-Frame-Options: DENY` | **Broken the Play button for every player** (the game runs in a frame) |
| `font-src 'self'` | **Blocked every web font** |
| Missing Cloudflare analytics | Blocked Cloudflare's own tracking script |
| Missing `unsafe-eval` | **Silently disabled the event-pacing system in production** |

The last two were *undiscoverable by reading the code* — one is injected by Cloudflare at the edge
and appears in no file at all. They were found by shipping the policy in **"report-only" mode**
first, watching the live site, fixing what it reported, and only then switching it on. That method
is now written into the file for anyone changing the policy in future.

### 3.2 A release that would never have reached players

Build 341 was committed with the source updated but **the file production actually serves left at
the previous version**. The repository said 341, every check passed, and players would have kept
getting 340 indefinitely. Fixed, and the cause explained in the commit.

### 3.3 Two backend functions the repository would have broken on deploy

The stored copies of both Supabase functions were badly out of date versus what's actually running.
Deploying either from the repository would have caused real damage:

- **`beta-ingest`** — would have reintroduced a **patched security hole** that allowed any
  malicious website to write fake rows into the beta dataset.
- **`ingest`** — was the *pre-Cloudflare* version and **didn't even list the live domain**;
  deploying it would have switched off analytics entirely.

Both stored copies now match production exactly. **Nothing was deployed** — production was already
correct; the repository was the liability.

### 3.4 A tester surface that was silently losing data

`chartquest.pages.dev` serves the real game, but the beta analytics function didn't recognise it.
Anyone testing on that address **vanished from the funnel** — no error, no warning, just missing.
This was invisible to normal command-line checks. Fixed and verified live.

---

## 4. Guardrails added

Three automated checks now run before every release, so none of the above can recur silently.
Each was **deliberately tested by breaking it** to prove it actually catches problems:

| Check | Guards against | Mutations caught |
|---|---|---|
| #19 | The operational foundation being deleted, bypassed, or drifting | 8 / 8 |
| #20 | The analytics client silently diverging into two versions | 6 / 6 |
| #21 | The security policy going missing or losing a required source | 13 / 13 |

Check #20 caught a real problem within an hour of being added.

---

## 5. A mistake made and corrected — stated plainly

While fixing §3.4, a new version of the analytics function was built from a copy read a few minutes
earlier. In that gap, another workstream deployed a change adding two new tracking events. The new
version **overwrote it and dropped those two events**.

It was caught by arithmetic — the version number jumped by two instead of one — re-checked, and a
merged version containing **both** changes was deployed roughly two minutes later, then verified.

**No data was lost:** the client that sends those two events wasn't live yet.

The lesson is now written into the file itself: *this function is edited by more than one
workstream — always re-read what's deployed immediately before deploying.*

---

## 6. Everything shipped (11 commits)

| Commit | What |
|---|---|
| `77e2a54` | Operational foundation — `window.CQOPS` (build 340) |
| `bd46156` | Ship the security policy, in report-only mode |
| `041d57a` | Policy round 2 — the two sources only the live site revealed |
| `0a3e021` | Policy switched to enforcing after a clean round |
| `4cd0cce` | Written record of the security finding |
| `6779c99` | Merge — resolved a collision between two workstreams' checks |
| `a370c58` | Check #21 + two files that misdescribed themselves |
| `8c97bcc` | Fix the release that would never have reached players |
| `9690909` | HSTS strengthened, after verifying it was safe to do so |
| `f5a6436` | The `www` redirect that doesn't exist + both stale backend copies |
| `cf82995` | The pages.dev data loss, and the mistake in §5 |

---

## 7. Open items — nothing urgent, three need a decision

| Item | Detail | Who decides |
|---|---|---|
| **`www` doesn't exist** | `www.playchartquest.com` has no DNS record. Anyone typing `www.` gets an error page, not the site. Either add the record or accept it. | Founder |
| **`unsafe-eval` in the policy** | A small security compromise, required by how the event-pacing system works. Removable only if that code is rewritten. | Engineering, later |
| **Feature flags not yet connected** | Five flags exist but aren't wired to anything yet, and honestly report themselves as "not wired". Phase 2 work. | Planned |

Also noted, not urgent: one release stamp reports a slightly older source commit than it should
(self-corrects on the next release), and the top-level `sw.js` file looks important but isn't
served — now labelled as such.

---

## 8. How to check any of this independently

```bash
node scripts/verify.js          # all 23 checks — currently 20 pass, 0 fail, 3 not-applicable
node scripts/smoke_deploy.js    # checks the LIVE site — currently 46/46
node ops/cq-ops.test.js         # 70 behavioural tests of the new foundation
curl -sI https://playchartquest.com/game | grep -i "content-security-policy\|strict-transport"
```

Reference documents, if more depth is wanted:

- `docs/operations/OperationalArchitecture.md` — how the new foundation works
- `docs/operations/IntegrationGuide.md` — how future work adopts it
- `CHARTQUEST_SECURITY_HEADERS_2026-08-05.md` — the security finding in full
- `CHARTQUEST_OPERATIONAL_FOUNDATION_PHASE1_2026-08-05.md` — the build report
