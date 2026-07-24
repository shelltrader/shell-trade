# ChartQuest RC1.1 — Telemetry & Cloud-Save Unblock (build 266)

**Date:** 2026-07-15 · **Tag:** `v0.1.2-rc1.1` · **Prod commit:** `f916736` · **Rollback anchor:** `rollback-pre-rc1` = `19c4085` (build 262)
**Status:** ✅ Deployed to production (`playchartquest.com`) and verified end-to-end.

This patch went out while the founder was **locked out of the Supabase web dashboard** (password-reset email failing). None of it needed the dashboard — the management API works independently.

---

## The headline find: the beta was about to measure nothing

The **2026-07-09 Netlify→Cloudflare migration silently broke two backends.** Both Edge Functions
(`ingest`, `update-progress`) still allow-listed only the old Netlify/GitHub-Pages origins, so from
`playchartquest.com`:

- **Every telemetry event was rejected `403 Forbidden origin`** — then queued on the player's device and
  retried forever, never arriving.
- **Every signed-in cloud save was rejected** the same way.

**It hid because `site_visits` uses a different path with no origin check** — the visit counter kept
climbing (2,086), so everything *looked* alive. The proof was in the write tables:

| Table | Last write (before fix) | |
|---|---|---|
| `site_visits` | today | ✅ (misleading — no origin gate) |
| `content_events` | **2026-07-09** | ❌ dead since the migration |
| `profiles` | **2026-07-01** | ❌ cloud saves dead 2 weeks |

Had we run the beta on build 262, **ten friends would have played and produced zero data.**

---

## What shipped

### Backend — Edge Functions redeployed (verify_jwt preserved)
- `ingest` **v2 → v3**, `update-progress` **v4 → v5**.
- Added `playchartquest.com`, `www.playchartquest.com`, and `*.chartquest.pages.dev` (previews) to the allowlist.
- Replaced the `startsWith()` prefix match with **exact-origin matching** — the old check would also have
  accepted `https://playchartquest.com.evil.com`.
- **Verified live:** preflight echoes the real origin; spoofed/absent origin → 403; a guest `session_start`
  from `playchartquest.com` → `200 {written:1}`, row confirmed in `content_events`, then removed.

### Game — build 266
- **`page_load`** now fires for *every* visitor at boot (before the auth/cinematic wall). `session_start`
  only fired *after* the wall, so cold-open bounces were invisible and the reach-first-trade rate was
  flattered. Now the funnel has an honest denominator: `page_load → session_start → reached_first_trade → trade_win/loss`.
- **`?fresh` now confirms before wiping a real save.** The house rule bakes `?fresh=1` into test URLs; one
  reaching a chat thread would silently nuke a friend's progress on every re-tap. Clean devices and `?qa`
  still wipe silently. (Only *earned* progress — level>1 or xp>0 — triggers the prompt.)
- **`/play` forwards query params.** `/play?fresh=1` was inert through the iframe wrapper, so "BEGINNER MODE
  VERIFIED" runs were never actually fresh.
- **QA `postMessage` bridge** now requires `?qa=1` **and** same-origin (it exposed `resetProgress` to any
  embedder). The admin Dashboard drives it same-origin with `?qa=1` — unaffected.
- **F2 · Returning guest no longer re-walled** *(approved protected-flow change, canon #7)*. The guest
  button read "Play as Guest (progress won't save)" — but RC1 made it save. And a returning guest hit the
  Sign In overlay again on Day 2, whose only escape was that same lying button. Now: button reads **"Play as
  Guest — saves on this device"**, and a returning visitor with local progress **drops straight into the
  game**; Sign In stays one tap away on the 👤 button. *Verified with a screenshot: returning guest lands in
  "NOW PLAYING", no wall.*

**Anything queued on a friend's device before this fix is NOT lost** — it drains to Supabase the next time
they open the game. Do **not** tell testers to clear cache/storage.

Release gate: **11 pass / 0 fail**; `[10] Protected systems (Finn/CFG/save-keys/lessons/bosses) unchanged`.

---

## The Supabase lockout — what it actually costs (nothing, for the beta)

Verified there is **no back door** to the dashboard: the Management API needs a Personal Access Token, PATs
are only mintable *from the dashboard*, the CLI has the same dependency, and GoTrue config isn't SQL-writable.

**Recovery, in order:** (1) `supabase.com/dashboard` → **"Continue with GitHub"** (most likely — if the
account was OAuth-created there is no password to reset, which is why the email keeps failing);
(2) check spam in `chartquestgame@gmail.com`; (3) wait 15 min, retry once (auth emails are rate-limited);
(4) `supabase.com/support`, quote project ref `ymxppzhczvmiuoncuqqu`.

**What the lockout blocks:** only the email-signup toggle (Confirm-email is ON, Site URL still
`localhost:3000`). **Guests bypass all of it** and now save locally — so the beta is unaffected. Read auth
config any time, dashboard-free, at `https://ymxppzhczvmiuoncuqqu.supabase.co/auth/v1/settings`.

**Do NOT create a new account or project** — all data, keys, and functions live in the existing one.

---

## Founder action list (unchanged from RC1, minus the ones now handled)

1. **Recover the dashboard** (GitHub sign-in). Only needed to fix *account* signup — not the beta.
2. **The 30-min real-device pass** (one iPhone + one Android) — the one thing that still needs a human with a
   phone. Watch a **non-gamer reach the first trade.** Cold open, guest-reopen, install, fullscreen.
3. **Migration 0009** (dashboard/anon lockdown) — **leave it until you're back in the dashboard.** It gates
   telemetry reads behind an admin sign-in; applying a lockdown while locked out is the wrong time, and it
   doesn't affect the friends' experience.
4. **Send the plain link** `https://playchartquest.com/play` — never one carrying `?fresh=1`.

---

## Post-beta: read your own data (no dashboard needed — just ask the AI to run these)

```sql
-- Who showed up, on what, guest or account
select payload->>'build' as build, count(*) filter (where event_type='page_load')     as loads,
       count(*) filter (where event_type='session_start')                              as sessions,
       count(*) filter (where event_type='reached_first_trade')                        as first_trades
from content_events where created_at > '2026-07-15' group by 1;

-- The traversal-wall pass rate (validates or kills K3)
select round(100.0 * count(*) filter (where event_type='reached_first_trade')
                   / nullif(count(distinct session_id) filter (where event_type='session_start'),0), 1) as pct_reached_trade
from content_events where created_at > '2026-07-15';

-- Where each friend stopped (the single most actionable output)
select session_id, max(created_at) - min(created_at) as session_len,
       (array_agg(event_type order by created_at desc))[1] as last_event
from content_events where created_at > '2026-07-15' group by 1 order by 2 desc;
```

## Rollback
Cloudflare → `chartquest` → Deployments → **Rollback** (atomic), or `git push origin rollback-pre-rc1:main
--force-with-lease`. Edge Functions revert by redeploying the prior version (ingest v2 / update-progress v4).
