# ChartQuest — Beta Test QA dashboard

**Date:** 2026-08-05 · **Status:** built, applied, verified · **Data at time of writing:** 236 events · 2 surveys · 35 testers

The founder's beta command centre. One page that answers what testers loved, where they quit,
what confuses them and what to build next — without anyone opening Supabase.

---

## How to open it

```bash
python3 scripts/serve_nocache.py 8798
```

Then <http://localhost:8798/beta-qa.html>. It **must be served over http** — the three engines
load as `<script src>` and the snapshot is `fetch`ed, both of which `file://` blocks.

It also appears as a **🧪 Beta Test QA** tab inside `dashboard.html`, lazy-loaded in an iframe on
first click.

> ⚠ `dashboard.html` gates its *entire page* behind admin sign-in, and `auth.users` is currently
> **empty** — so that gate cannot be passed by anyone today. Until the admin account exists, use
> the standalone `beta-qa.html`, which needs no auth at all.

---

## What was built

| Piece | Path | Notes |
|---|---|---|
| The dashboard | `beta-qa.html` | 2,904 lines, 9 sections, self-contained |
| Model engine (snapshot) | `beta-qa/beta-model.js` | pure JS, also `require()`-able in node |
| Insight engine | `beta-qa/beta-insight.js` | alerts, recommendations, survey clustering |
| Chart primitives | `beta-qa/beta-charts.js` | dependency-free SVG, themed only via `--cq-*` |
| Model engine (live) | `automation/migrations/0011_beta_analytics_rpcs.sql` | 4 admin-gated RPCs — **applied** |
| Snapshot puller | `scripts/beta_pull.py` | stdlib only, keyset pagination |
| The contract | `docs/beta-qa/BETA_MODEL_CONTRACT.md` | binding spec for both engines |
| Instrumentation gaps | `docs/beta-qa/INSTRUMENTATION_GAPS.md` | ready-to-apply patch for the 2 blind stages |
| Ground truth | `beta-qa/GROUND_TRUTH.md` | hand-computed, used to check the engines |
| Parity harness | `beta-qa/parity.js` | diffs SQL vs JS; `--self-test` passes 26 checks |
| Prefix consistency gate | `scripts/check_test_prefixes.py` | asserts the 3 exclusion lists agree |

### Two engines, one contract

The UI renders a **model object** and computes nothing itself. Two independent engines produce
that object — SQL for live mode (aggregates server-side, scales to thousands of testers) and JS
for snapshot mode (works offline, works today with no account). If the page did its own
arithmetic anywhere, the two sources would drift and the founder would get different answers
depending on whether they were signed in.

**Data source resolution:** admin JWT → live RPCs; else `beta-qa/beta-data.json` → `BetaModel.build()`;
else an empty state that says exactly how to get data. A dead or non-admin token falls back to
the snapshot rather than throwing up a sign-in wall over data that is still readable.

---

## What the data says right now

Three real leaks, ranked by testers lost — the funnel is the arbiter, the quotes explain why.

| # | Leak | Lost |
|---|---|---:|
| 1 | Landing page → Tutorial started | **−13 of 30 (43%)** |
| 2 | Tutorial started → Intro chain completed | **−11 of 17 (65%)** |
| 3 | Survey started → Survey submitted | **−3 of 4 (75%)** |

Leaks 1 and 2 are entirely **pre-gameplay**. Nothing else in the dataset costs more testers.

**Two corrections to numbers you have been reading:**

1. **Average rating is 7.0 (n=1), not 8.0 (n=2).** `GATE-B-003` is a test row carrying a 9/10, and
   `founder_report.py`'s exclusion list did not catch `GATE-` or `VERIFY-`. **Fixed 2026-08-05** —
   see "Test-prefix fix" below. The report now reads 35 testers / 7.0 (n=1), matching the
   dashboard exactly; before the fix it read 37 / 8.0 (n=2) with no exclusion line at all.

2. **Two testers hit `Array.prototype.at is not a function`** — unsupported on iOS Safari below
   15.4, and **44% of events are mobile**. This is a real compatibility bug, not noise.

---

## Verification performed

The four adversarial review agents died on a session limit, so these were run directly instead.

| Check | Result |
|---|---|
| Model engine vs hand-computed ground truth | **0 mismatches** across 13 funnel stages + 16 KPIs |
| XSS — payloads in survey text, crash message/`where`, build, referrer, player_id | **0 fires** across all 9 tabs, the player drawer and search; renders as inert text |
| `anon` can call the new RPCs? | **No** — `has_function_privilege('anon', …) = false` on all four |
| In-body `is_admin()` guard | Fires — `42501 Forbidden` even for the privileged caller |
| Admin JWT handling | Never logged, never in a URL, one `Authorization` header, Supabase origin only |
| Monotonic funnel under out-of-order milestones | Holds — no stage >100% kept |
| Empty dataset / one player / test-players-only | No throw, `health = null` (not a fake 0), no `NaN`/`Infinity` |
| Uninstrumented stages | Hatched grey + "not instrumented" badge — unmistakable from a real 0% |
| Mobile (375px) | 0 page-level horizontal overflow; wide tables scroll in their own container |
| Supabase security advisors | 2 ERROR-level lints I introduced, found and fixed (`security_invoker`) |
| Parity harness self-test | **PASS — 26 checks** (`node beta-qa/parity.js --self-test`) |
| Test-prefix consistency | **PASS — 3 sources agree on 10 prefixes** (`python3 scripts/check_test_prefixes.py`) |

### Three bugs caught and fixed during the build

1. **The SQL migration was truncated** — missing 3 of 4 functions **and every `REVOKE`**. Shipping
   that would have left admin-only analytics functions callable by anyone holding the publishable
   key that ships inside the game. This project has had that exact near-miss before with
   `prune_beta_events(0)`.

2. **The funnel stage order was wrong** (my error, in the contract). `beta_completed` fires
   *before* `survey_submitted` — the completion ceremony hands off to the survey. Ordering
   completion last made the monotonic pass credit both survey stages to everyone who finished,
   reporting the survey stage as **4 players / 100% kept** when the truth is 4 started and 1
   submitted. It did not merely misreport a stage: it **exactly concealed leak #3**.

3. **Every KPI rendered a green ↑ against an empty prior window.** The beta opened 2026-08-03, so
   on day two every previous window predates the beta. `prev` is now `null` when the prior window
   holds no non-test rows, and the tile says "no previous window" instead of drawing an arrow.

---

## Known gaps — deliberately not hidden

- **`play_click` and `movement` are not instrumented.** Rendered greyed with a badge, excluded
  from drop-off maths. `play_click` cannot be derived: `cq-track.js` mints one session per *visit*
  shared across index → play → game iframe → survey, so clicking Play fires nothing at all. The
  exact patch for both is in `docs/beta-qa/INSTRUMENTATION_GAPS.md`, unapplied because it touches
  `cq-track.js` and the deployed edge function.
- **SQL↔JS parity is unproven END-TO-END**, though the harness for it exists and passes.
  `beta-qa/parity.js` **was** delivered (`node beta-qa/parity.js --self-test` → PASS, 26 checks:
  it verifies the JS engine against independent ground truth and proves the differ catches every
  planted difference, including seeded reproducible fixtures covering all 13 stages, all ten test
  prefixes and out-of-order arrivals). What is missing is one real `beta_model()` capture to diff
  against — the live RPCs cannot be called until an admin account exists. The moment one does:
  `node beta-qa/parity.js --data beta-qa/beta-data.json --sql-result <capture.json>`.
- **Country and language are not collected** — by design, no cookies/IP/third parties. The
  dashboard says so rather than showing an empty column.
- **The adversarial review pass did not run.** Four verifier agents hit the session limit. The
  checks in the table above were run by hand instead; they are narrower than four dedicated
  skeptics would have been.
- **The repo copy of `supabase/functions/beta-ingest/index.ts` is stale** vs the deployed v4 —
  deployed has `journal_discovery_skipped` and exact-match origin checking; the repo copy has
  neither and still uses the `startsWith()` prefix match that was fixed for a real vulnerability.
  Not touched here. Patch from the deployed source, never from the file.

---

## To turn on live mode

1. Create one Supabase account (Authentication → Users → Add user) — I cannot create accounts or
   handle passwords.
2. Tell me the email; I add it to `public.admins`.
3. Both dashboards go live. They share the `cq_admin_tok` sessionStorage key, so signing in to
   either signs in to both.

Migration 0011 is already applied and verified, so nothing else is needed.

---

## Test-prefix fix (2026-08-05, after the initial build)

`scripts/founder_report.py` was excluding only `CERT-TEST, e2e-, selftest, browsertest, QA-, DEV-`.
Two more prefixes exist in the live data and were being counted as real testers.

**Two defects, not one.** The second was found while fixing the first:

1. **Missing prefixes.** `VERIFY-` and `GATE-` were absent. `GATE-B-003` carries a 9/10 survey, so
   every report ever generated showed **8.0 (n=2)** against a true **7.0 (n=1)** — a full point of
   phantom approval on the headline number, from a row the team wrote itself.
2. **The two engines disagreed on case.** `beta-model.js` matched case-sensitively
   (`indexOf(prefix) === 0`); the SQL lowercases first (`lower(player_id) like 'gate-%'`). So
   `Gate-B-003` was excluded live and counted in snapshot mode — the same data giving two
   different averages depending only on whether the founder was signed in. Its own comment
   asserted it "behaves identically to SQL", which was false.

**Fixed in all three implementations**, now case-insensitive with the full 10-prefix list, and
guarded so it cannot drift again:

```bash
python3 scripts/check_test_prefixes.py     # PASS — all 3 sources agree on 10 prefixes
```

The checker was verified to actually fail: reintroducing the original bug makes it exit 1 and name
the missing prefixes. It also catches drift *between the repeated copies inside the migration*, so
a fix applied to `beta_model` but forgotten in `beta_players` is caught too.

| | testers | rating | excluded |
|---|---:|---:|---|
| Report, before | 37 | 8.0 (n=2) | _no line printed_ |
| Report, after | **35** | **7.0 (n=1)** | 2 players / 17 events |
| Dashboard | **35** | **7.0 (n=1)** | 2 players / 17 events |
