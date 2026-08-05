# Chart Quest — Production Readiness & Launch Checklist

Status of the security + scaling hardening pass, and what remains before a real
public launch. Ordered by priority.

> **Re-verified against the live project 2026-08-05.** Items below marked ✅ RESOLVED or
> ⚠️ CHANGED were checked directly — Postgres grants and function bodies via SQL, HTTP surfaces
> via `curl`, plan via the management API — not inferred from this document's own history. Two
> entries had drifted far enough to be misleading; both are corrected in place with the evidence.
> **Anything not marked was NOT re-verified** (Auth settings are dashboard-only and unreadable
> from a session).

---

## ✅ Done (applied to production `ymxppzhczvmiuoncuqqu`)

- **Per-user data is private.** RLS on `profiles`, `journal_trades`,
  `journal_notes`, `daily_streak` is scoped to `auth.uid()`. Codified in
  `automation/migrations/0003_user_data_rls.sql`.
- **Progress can't be forged client-side.** `profiles` is now SELECT-only for
  clients; shells/level/xp are writable **only** through the `update-progress`
  Edge Function, which enforces range + delta + rate checks.
  (`0004_lock_profile_writes.sql`)
- **RLS performance.** Policies evaluate `auth.uid()` once per query, not per
  row. (`0005_rls_perf_initplan.sql`)
- **Growth control tooling.** `site_visits_daily` rollup + `rollup_site_visits()`
  and `prune_content_events()` maintenance functions (service-role only, not yet
  scheduled). (`0006_retention.sql`)
- **Privacy Policy + Terms** pages (`privacy.html`, `terms.html`) with a required
  consent checkbox on signup. Terms include a "not financial advice" disclaimer.

---

## ⚠️ DEPLOY SEQUENCE for the ingest + dashboard-auth lockdown

Built and ready, but **order matters** — applying the DB switchover before the
new HTML is live will break the game's content sync and the dashboard.

1. **Applied already (safe, additive):** Edge Function `ingest` (deployed),
   migration `0008` (admins table seeded with founder uid + `ingest_throttle`).
2. **Deploy the updated static files** (`index.html`, `chart-quest.html`,
   `dashboard.html`) to Netlify.
3. **Smoke-test the live game**: play briefly, confirm content/mastery still
   sync (now via `/functions/v1/ingest`) — check the dashboard's content tab or
   the `content_events` table for fresh rows.
4. **Then apply `0009_lockdown_switchover.sql`** (admin-gates the RPCs, restricts
   content reads to admins, drops the anon write policies).
5. **Sign into the dashboard** with the founder account to confirm admin access;
   confirm a signed-out/anon request to `get_dashboard_stats` now returns 403.

Verify the admins allowlist first: `select * from public.admins;` should hold
the founder's `auth.users.id`.

## 🔴 Must do before public launch

### 1. Production email (the #1 scaling blocker)
Supabase's built-in mailer is dev-only (a few emails/hour). Concurrent signups
will silently fail to send confirmation emails.
- Configure a real SMTP provider (Resend / SendGrid / SES) in
  **Auth → Settings → SMTP**.
- Raise Auth rate limits accordingly.
- Decide whether email confirmation is even required for this audience — turning
  it off removes the bottleneck (trade-off: unverified emails).

### 1b. Fix the Auth Site URL / Redirect URLs
Currently set to `localhost:3000`, so confirmation & password-reset links point
at a dead local address. In **Auth → URL Configuration**, set **Site URL** to
`https://playchartquest.com` and add it to **Redirect URLs**.
**CORRECTED 2026-08-05:** this line used to say `https://chart-quest-game.netlify.app`. That is
the pre-Cloudflare host; following it would have replaced one dead link with another. (Founder
account was email-confirmed directly in the DB, so this didn't block admin login,
but it will break every real user's email link once SMTP is on.)

### 2. 🔴 Upgrade to Pro — STILL ON FREE (re-verified 2026-08-05)
Verified 2026-07-01 and again 2026-08-05 via the management API — organization `Shell Trade`
reports `"plan": "free"`. The project is on the **Free plan**. This is the hard gate
for scaling and for load testing:
- Free pauses on inactivity, shares compute, and has strict Auth/email limits.
- **Branching (needed to load-test safely) requires Pro** — confirmed by a
  `PaymentRequiredException` when attempting to create a `loadtest` branch.
- 1,000 users needs **Pro + a compute add-on**; 10,000 needs a **larger compute
  instance** + distributed/k6-Cloud load generation (one machine can't emit 10k).
Action: upgrade to Pro, then create a branch and run `load-test/k6-chartquest.js`
graduated to 1k, and via k6 Cloud for 10k. Until then, real scale is untested and
capped at Free-tier capacity.

### 3. Turn on leaked-password protection
**Auth → Settings** → enable HaveIBeenPwned check. Consider raising the min
password length from 6 to 8 (client check in `doAuth`). *(Auth settings are
dashboard-only — cannot be scripted via the DB.)*

### 3b. ⚠️ CHANGED — the exposure is real but is NOT what this section used to say

**Re-verified 2026-08-05. Two of the three claims here were out of date; the third is worse than
it looks, because it survived a lockdown that was assumed to have covered it.**

✅ **RESOLVED — the dashboard is not reachable.** `dashboard.html` is not deployed. Cloudflare
publishes `website/`, and these files sit at the repo root. Verified by body hash, because with no
404 page a missing path answers **HTTP 200** and a status code proves nothing:

```
/dashboard.html          200   body-sha 864339dc4d
/beta-qa.html            200   body-sha 864339dc4d
/definitely-not-real-xyz 200   body-sha 864339dc4d   ← identical: all three are the landing page
```

✅ **RESOLVED — `anon` can no longer execute the dashboard RPCs.** Confirmed against Postgres
privileges directly (`has_function_privilege`), not by an HTTP probe — a `401` from
`/rest/v1/rpc/*` is NOT evidence of a revoke, since that key is rejected at the REST API anyway.

✅ **RESOLVED 2026-08-05 by `0015_admin_gate_legacy_dashboard_rpcs.sql`** — was: `authenticated`
reads every bug report.
`get_dashboard_stats` and `get_recent_bug_reports` are `SECURITY DEFINER`, carry **no admin check
of any kind**, and are executable by `authenticated`. In Supabase `authenticated` means **any
registered player**, not an admin. `get_recent_bug_reports` is, in full:

```sql
select message, status, created_at from public.bug_reports order by created_at desc limit p_limit;
```

No filter, no guard. `message` is user-typed free text — the PII risk this section always meant.

**The beta-QA suite is NOT affected.** `beta_model`, `beta_players`, `beta_player_detail` and
`beta_search` are also `authenticated`-executable, but every one of them carries an `is_admin`
guard and raises. They are fine. Do not "fix" them.

**What was done:** both functions gained the same `is_admin()` guard the beta suite uses, and were
converted from `language sql` to `plpgsql` (a SQL function cannot `raise`). Signatures and return
types are unchanged, so callers are unaffected. Verified by impersonating a signed-in non-admin:

```
set local role authenticated; select … from public.get_recent_bug_reports(5);
  → VERDICT >> PASS — non-admin refused: Forbidden
```

A revoke from `authenticated` was deliberately NOT used: admins are authenticated users, so that
would have locked out the dashboard as well as the players.

Note the advisor lint `authenticated_security_definer_function_executable` still flags all six
functions, because it inspects the GRANT and cannot see an in-body guard. All six are now correct.

---

## 🟠 Should do soon

### 4. ✅ Built — Close the open anon write tables (pending deploy + 0009)
`content_events`, `content_replays`, `content_briefs`, `content_exports`,
`content_generated`, `player_mastery` were writable by anyone with the anon key.
Now routed through the `ingest` Edge Function (service-role, whitelists columns,
clamps values, forces `processed_status='new'`, per-IP rate limit). The anon
write policies are dropped in `0009`. Still open: `content_assets`,
`published_posts`, `performance_snapshots` retain their `0001` anon policies —
confirm no anon-key automation writes them, then lock the same way.

### 4b. 🔴 NEW — `public.admins` is EMPTY, so every admin-gated RPC is closed to everyone

Found 2026-08-05 while applying `0015`, and the cause is one level deeper than it first appeared:

```
auth.users 0 · auth.identities 0 · public.profiles 0 · public.admins 0
```

**There are no user accounts at all.** Not "the admin row is missing" — the project has zero
registered users, so there is no uid for an admin row to reference. The deploy-sequence section
above claims `0008` seeded `admins` with the founder's uid, and §1b claims the founder account was
"email-confirmed directly in the DB". Neither can be true today. Whatever account existed is gone.

This also means `get_dashboard_stats()` honestly reports `total_signups: 0`.

Consequence, and it is live today: `is_admin()` returns false for **everybody**, so all six
admin-gated functions refuse all callers. That is fail-closed and safe, but it means

- **`beta-qa.html` live mode cannot authenticate.** It signs in, then proves admin status against
  a `beta_*` RPC and throws *"That account is not an admin."* — so the founder's Beta QA dashboard
  silently falls back to its snapshot rather than reading live data. This was already true before
  `0015`; `0015` did not cause it.
- `dashboard.html` would be equally blind, though it is not deployed.

**The account has to exist first, and the obvious route is a trap.** Signing up inside the game
fires a confirmation email that (a) may not send — the built-in mailer is dev-only, blocker 1 — and
(b) links to `localhost:3000`, blocker 1b. So an in-game signup can strand itself.

Create it in the dashboard instead, which bypasses email entirely:

> **Authentication → Users → Add user** → enter the email and a password → tick
> **Auto Confirm User** → Create.

Then, and only then, the admin row:

```sql
insert into public.admins (user_id)
select id from auth.users where email = '<founder email>'
on conflict do nothing;
```

Confirm with `select public.is_admin();` while signed in as that account — and note the insert
above silently inserts NOTHING if the email does not match an existing user, which is one way this
table can end up empty without anyone noticing.

---

### 5. ⚠️ CHANGED — review anon-executable SECURITY DEFINER RPCs
The two named here are no longer anon-executable (see 3b). Re-verified 2026-08-05, the functions
**`anon` can still execute** are:

| Function | Verdict |
|---|---|
| `submit_bug_report(text, jsonb)` | **Intended** — players must be able to report bugs without an account |
| `record_site_visit()` | **Intended** — anonymous visit counter |
| `is_admin()` | **Review.** Returns a boolean about the caller, so it leaks little, but there is no reason for it to be anon-callable |

`bump_ingest_throttle` and `prune_beta_events` are correctly closed to both `anon` and
`authenticated` (the latter matters — see the Supabase-grants trap: Postgres grants EXECUTE to
PUBLIC by default, so every new SECURITY DEFINER function is anon-callable until revoked).

### 6. Schedule the retention jobs
Once comfortable, enable the pg_cron schedules documented at the bottom of
`0006_retention.sql` so `site_visits` and `content_events` don't grow unbounded.

### 7. Binance data availability
`api.binance.com` returns HTTP 451 in the US and some regions → those users fall
back to simulated data. If the US is a target market, add a region-appropriate
source (e.g. `api.binance.us`) or a cached server-side snapshot. Do **not** proxy
all users through one server — that collapses the distributed per-client IPs into
one shared rate limit.

---

## 🟢 Later / nice to have

- ~~**Add `idx_bug_reports_user_id`**~~ ✅ done (`0007_bug_reports_index.sql`).
- **Keep** `idx_journal_notes_user_id` / `idx_daily_streak_user_id` — they read as
  "unused" only because the tables are empty; RLS needs them once users exist.
- **First-load size**: `index.html` is 1.2 MB (378 KB gzip), service-worker
  cached after first load. Fine at 100 users; revisit for large-scale mobile.
- **IP protection is legal, not technical.** The game ships as readable source;
  obfuscation (`build.js`) is a speed bump, not security. Rely on the Terms +
  copyright, and keep any secret-sauce logic server-side.

---

## Load testing

See `load-test/README.md`. Run the k6 script against a **staging branch**, never
production (the script guards against the prod ref). Signup-email throughput is
not covered by k6 — validate it separately once SMTP is configured.

## Verifying the DB state anytime

```sql
-- Per-user tables should show auth.uid()-scoped policies; profiles = SELECT only
select tablename, policyname, cmd, roles::text
from pg_policies where schemaname = 'public'
  and tablename in ('profiles','journal_trades','journal_notes','daily_streak')
order by tablename, cmd;
```
