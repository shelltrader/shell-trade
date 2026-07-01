# Chart Quest — Production Readiness & Launch Checklist

Status of the security + scaling hardening pass, and what remains before a real
public launch. Ordered by priority.

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
`https://chart-quest-game.netlify.app` and add it to **Redirect URLs**. (Founder
account was email-confirmed directly in the DB, so this didn't block admin login,
but it will break every real user's email link once SMTP is on.)

### 2. 🔴 Upgrade to Pro — CONFIRMED on Free plan
Verified 2026-07-01: the project is on the **Free plan**. This is the hard gate
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

### 3b. ✅ Built — Lock down the public admin dashboard (pending deploy + 0009)
`dashboard.html` is served publicly at `/dashboard.html` and has **no login**. It
uses the public anon key to call `get_dashboard_stats` and
`get_recent_bug_reports`, and to read `content_events` / `content_replays`.
**Anyone who loads that URL — or just calls the RPCs with the anon key baked into
the game's public source — can read your business analytics and every bug report**
(bug reports contain user-typed text + context = possible PII). This is why those
`SECURITY DEFINER` RPCs are anon-executable; the real problem is the dashboard
has no auth. Fix options (pick one):
- Put the dashboard behind Supabase Auth and an admin-role check; revoke anon
  EXECUTE on the two RPCs and anon SELECT on the content tables, then have the
  dashboard read with the signed-in admin's JWT (or a service-role Edge Function).
- Short-term stopgap (obscurity only, NOT a real fix): block `/dashboard.html` at
  the Netlify edge. The RPCs remain callable with the public anon key, so this
  alone is insufficient.

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

### 5. Review anon-executable SECURITY DEFINER RPCs
`get_dashboard_stats` and `get_recent_bug_reports` are callable by anyone via
`/rest/v1/rpc/*` and return data. Confirm that exposure is intended; otherwise
revoke EXECUTE from `anon`/`authenticated`.

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
