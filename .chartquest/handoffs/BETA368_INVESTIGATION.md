# Build 368 Cloudflare Beta Analytics Investigation

## Founder objective

The Founder wants beta funnel and survey reporting to stop depending on a Supabase dashboard login,
to use as few logins as possible, and to have one private place that shows all beta data. Existing
players have already begun testing, so the game, accounts, local saves, cloud saves, and historical
rows must not be damaged while the new reporting plane is introduced.

## Verified current boundary

- Cloudflare Pages serves the website, but Build 367 beta events and surveys are still written to
  Supabase. Cloudflare hosting and Supabase data storage are separate services.
- Guest progress, shells, XP, Journal state, streak, and mastery are local-first and do not require
  Supabase to keep playing on the same device.
- Signed-in authentication, cloud progress, Journal trades/notes, and streak synchronization still
  use Supabase. Removing that provider now would be a materially different identity/data migration.
- Historical beta events and surveys remain in Supabase. They cannot be safely imported or deleted
  without authenticated export access.
- Existing milestone latches on tester devices do not re-emit completed milestones into a fresh
  database. Therefore a new Cloudflare dataset is an honest post-cutover baseline until history is
  imported later.

## Root causes and risks

1. The tracker and early crash fallbacks owned a hard-coded Supabase ingest URL; no Cloudflare
   Worker/Pages Function, D1 schema, binding, or protected read API existed in the repository.
2. The durable pending queue acknowledged only the first 40 rows but could clear the full queue,
   silently losing the remaining rows.
3. Treating any HTTP 2xx as a confirmed write was unsafe because an unconfigured Pages route can
   return the marketing HTML shell with status 200.
4. The service worker cache-first path could persist authenticated founder responses, Supabase
   account reads, or market responses despite `no-store`.
5. A founder dashboard must fail closed behind Cloudflare Access and must never publish a static
   beta-data snapshot or show false zeroes during denial/outage.
6. Provider configuration is external state: a Git push alone cannot create/migrate D1, bind it,
   set secrets, or create the Access policy.

## Bounded decision

Build 368 moves **new beta events and surveys only** to a fresh Cloudflare D1 dataset, with the
existing Supabase ingest retained as a confirmed-write fallback during the transition. It adds
fail-closed Access-verifying dashboard code for the Founder; the external Access application and
policy remain pending. Supabase remains untouched for accounts, cloud saves, and historical beta
rows until a later authenticated export/import migration.

This is additive and reversible. It is not a claim that Supabase has been fully removed.

## Acceptance boundary

- Fresh D1 schema with idempotent event writes and safe survey upserts.
- Exact confirmed-write receipts before queue deletion or survey success.
- No change to player/save keys or account/cloud-save behavior.
- Private dashboard with overview, funnel, players, surveys, builds, devices, crashes, raw data,
  search, timelines, and complete JSON/CSV exports.
- Access denial, data outage, malformed writes, retries, service-worker upgrades, and exports fail
  closed without exposing private rows or inventing zero statistics.
- Exact game regression matrix stays green.
- Production remains on Build 367 until D1, bindings, secrets, Access, and live write/read smoke are
  complete under a separately authorized release operation.
