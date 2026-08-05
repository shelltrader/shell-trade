# ChartQuest — Beta Test QA dashboard

**Date:** 2026-08-05 · **Status:** built, applied, verified · **Data at time of writing:** 236 events · 2 surveys · 35 testers

The founder's beta command centre. One page that answers what testers loved, where they quit,
what confuses them and what to build next — without anyone opening Supabase.

---

## How to open it

**Double-click `ChartQuest Beta QA` on the Desktop.** It starts the local server if it is not
already running, then opens the dashboard. Safe to double-click twice — it will not spawn a
second server.

Rebuild or relocate it with:

```bash
python3 scripts/make_beta_qa_app.py
```

Re-run that if the repo ever moves: an app on the Desktop has no relative route back to the
project, so the path is baked in at build time.

Manually, without the icon:

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

### This dashboard is NOT deployed — do not "harden" it

`beta-qa.html`, `beta-qa/**` and `dashboard.html` sit at the repo root and are **local-only
tools**. Cloudflare Pages builds from `website/`, so nothing at the repo root reaches
playchartquest.com. Verified against the live site:

```
/game                              HTTP 200  1991464B  sha=2c9a93685e   ← real page
/                                  HTTP 200   148215B  sha=fe2cc3bbe0
/definitely-not-a-real-path-xyz    HTTP 200   148215B  sha=fe2cc3bbe0   ← SPA fallback
/beta-qa.html                      HTTP 200   148215B  sha=fe2cc3bbe0   ← does not exist
/dashboard.html                    HTTP 200   148215B  sha=fe2cc3bbe0   ← does not exist
```

There is no 404 page, so **a missing path returns the landing page at HTTP 200** — a bare status
code proves nothing here. Compare the body hash against a deliberately nonsense path.

Two traps this closes:

1. **`netlify.toml` says `publish = "."`, and it is stale.** Reading it and concluding the repo
   root is served is wrong, and it is exactly the mistake made while writing this document. The
   authority on what ships is `website/_headers`, which documents the whole thing.
2. **The root `_headers` is never read by Cloudflare.** Adding `X-Robots-Tag` rules there for
   these tools would be dead config, and would deepen a trap that has already cost this project
   three separate bugs (the unshipped CSP, the untracked `website/` assets, the boss cinematics
   that 404'd for ~20 builds).

If these tools ever *do* need to ship, the rule goes in `website/_headers` — and they would need
real access control, not a robots hint.

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

2. ~~Two testers hit `Array.prototype.at is not a function` — an iOS Safari incompatibility.~~
   **RETRACTED 2026-08-05 — this was wrong in every particular**, and it is the reason crash
   attribution now exists. The full rows say `os=Windows`, `browser=Chrome`, and
   `where=https://static.cloudflareinsights.com/beacon.min.js` — **Cloudflare's analytics
   beacon**, not ChartQuest. It was **one** player (`p-gyuchomsze`), not two, firing twice one
   second apart; that visitor loaded the landing page, threw both errors and left. There are
   **zero** iOS or Safari crashes in the entire dataset, and **nothing in this repo calls
   `.at()`**.

   The claim was built from a minified stack trace in code we do not ship. That is precisely the
   failure the dashboard now prevents: see "Crash attribution" below.

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

---

## Crash attribution (build 341, 2026-08-05)

`window.onerror` fires for **every** script on the page, including ones ChartQuest does not
ship, and the crash cap did not care whose error it was. Two consequences, both now fixed.

**1 · Misattribution.** Two rows thrown inside Cloudflare's analytics beacon were
indistinguishable from a game bug and were written up as an iOS Safari incompatibility in
ChartQuest's own code (see the retraction above). Every crash now carries `origin`
(`self` | `third_party`) and `source_host`. Third-party crashes render grey, not red, are held
out of "Repeated bugs" entirely, sort below ours however many testers they hit, and carry the
sentence *"Nothing here can fix it — do not read the stack trace as a game bug."*

**2 · Starvation.** One shared cap of `3` meant those two foreign errors ate two thirds of the
session budget. A third-party script throwing in a loop — exactly what a broken beacon does —
would have silently discarded every real ChartQuest crash for that visit, and the gap would look
like a clean session. The cap is now per-origin: `CAP_SELF=3`, `CAP_THIRD=2`.

A crash with no http(s) filename — inline code, or a CORS-sanitized `Script error.` — counts as
**ours**. Over-owning is the safe direction: a false "ours" costs a wasted look; a false "theirs"
files a real bug under someone else's name and it never gets fixed.

Retroactive: rows collected before build 341 have no `origin`, so both engines derive it from
`props.where`. The two `.at()` rows already in the database reclassify correctly without a
backfill.

| Where | What changed |
|---|---|
| `website/assets/cq-track.js` | per-origin caps + `origin`/`source_host` on every crash |
| `chart-quest.html` / `index.html` | re-synced via `scripts/sync_track.py`, build 341 |
| `beta-qa/beta-model.js` | `crashSourceHost()`, retroactive derivation, ours-first sort |
| `automation/migrations/0012_*.sql` | same logic in `beta_model()` — **applied**, parity preserved |
| `beta-qa.html` | grey card, "not our code" badge, separate section, corrected cap note |
| `docs/beta-qa/BETA_MODEL_CONTRACT.md` | §0.10 + `crashes[]` shape |

Verified: a simulated 10-error third-party flood is capped at 2 and **all three** first-party
crashes still get through afterwards — the starvation bug, demonstrated fixed. SQL and JS
classify the live rows identically.

### Still open

A **localhost crash from a concurrent dev session is sitting in the beta dataset**
(`http://localhost:8802/chart-quest.html…:3773`, a build-tag syntax error) and is counted as a
real tester crash. `localhost` is correctly "ours" for *whose code*, but it is not *real beta
play*. The exclusion list matches player-id prefixes only, so dev noise has no filter. A third
`origin` value (`local`) would close it — not done here, because it changes the model shape again
and would need another coordinated SQL+JS+contract change.
