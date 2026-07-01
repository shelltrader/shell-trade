# Chart Quest — Load Testing

A [k6](https://k6.io) script that simulates 100 simultaneous players against a
**staging** Supabase branch, modelling the real per-user call pattern in the game.

## Why a staging branch (not production)

The game's `content_events` and `player_mastery` tables accept **unauthenticated
writes**. A load test therefore writes real rows — against production that means
permanent junk data and possible Auth rate-limit flags. `k6-chartquest.js` will
**refuse to run** if `SUPA_URL` points at the production ref unless you pass
`ALLOW_PROD=1`. Don't.

Create a branch database in the Supabase dashboard (Branches), apply migrations
`0001`–`0006` to it, and use its URL + anon key below.

## Install k6

```
brew install k6            # macOS
# or see https://k6.io/docs/get-started/installation/
```

## Run

```
k6 run \
  -e SUPA_URL=https://<staging-ref>.supabase.co \
  -e SUPA_ANON=<staging-anon-key> \
  -e VUS=100 -e DURATION=2m \
  load-test/k6-chartquest.js
```

Knobs: `VUS` (default 100), `DURATION` (hold time at peak, default `2m`).

## What it exercises

| Step | Real-game equivalent | Endpoint |
|------|----------------------|----------|
| Visit counter | page load | `rpc/record_site_visit` |
| Gameplay events | content pipeline | `POST /content_events` (batched) |
| Mastery sync | debounced ~4s upsert | `POST /player_mastery` |

**Not** covered (test separately):
- **Signup email throughput** — the true bottleneck. Validate with a production
  SMTP provider configured in Supabase Auth; the built-in dev mailer caps at a
  few emails/hour and will fail under concurrent signups.
- **Binance klines** — fetched per-client from the user's own IP (distributed),
  so it doesn't share a rate limit; not meaningful to simulate from one host.
  Note `api.binance.com` returns HTTP 451 in the US and some regions.

## Reading the results

Thresholds baked into the script (a run "fails" if breached):
- `cq_rest_errors` &lt; 1%
- `cq_rest_latency` p95 &lt; 800 ms
- `http_req_duration` p99 &lt; 2 s

If errors spike or latency climbs as VUs ramp, check the Supabase dashboard →
Database → Roles/Load and the project's compute tier. 100 VUs of this profile
(~a few writes/sec aggregate) should sit comfortably within a Pro instance.

## Cleaning up

After a run, delete synthetic rows from the staging branch (or just discard the
branch). If you ever ran against prod (`ALLOW_PROD=1`), remove them:

```sql
delete from content_events where event_type = 'load_test';
delete from player_mastery  where player_id like 'loadtest-%';
```
