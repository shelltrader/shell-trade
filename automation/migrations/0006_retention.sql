-- Chart Quest — Retention & growth control for append-only tables
-- Apply to project ymxppzhczvmiuoncuqqu. Non-destructive on apply: this only
-- CREATES a rollup table + maintenance functions. It deletes NO data until you
-- actually call the functions (or schedule them via pg_cron — see bottom).
--
-- WHY
-- Three tables grow with every play and never shrink:
--   • site_visits    — +1 row per page load (a raw hit log; already 1000s)
--   • content_events — batched gameplay events (fast-growing content pipeline)
--   • player_mastery — bounded per player, but unauthenticated writes = abuse risk
-- At 100 users this is fine for months. This migration gives you the tools to
-- keep it fine at 10x–100x without a fire drill later.
--
-- NOTE ON "UNUSED" INDEXES: the linter marks idx_journal_notes_user_id and
-- idx_daily_streak_user_id as unused. They are NOT dead — they read unused only
-- because those tables are empty today. They are exactly the indexes RLS needs
-- once real users exist, so this migration deliberately KEEPS them.
-- ============================================================================

-- 1. Daily rollup of raw site visits -----------------------------------------
create table if not exists public.site_visits_daily (
  day    date primary key,
  visits integer not null default 0
);
alter table public.site_visits_daily enable row level security;
-- Read-only aggregate; expose SELECT to the dashboard, writes via function only.
drop policy if exists site_visits_daily_read on public.site_visits_daily;
create policy site_visits_daily_read on public.site_visits_daily
  for select to anon, authenticated using (true);

-- Roll raw hits into daily buckets, then drop raw rows older than `keep_days`.
-- Recent raw rows are retained so a same-day rollup stays accurate.
create or replace function public.rollup_site_visits(keep_days integer default 7)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare moved integer;
begin
  insert into public.site_visits_daily (day, visits)
  select (created_at at time zone 'UTC')::date as day, count(*)
  from public.site_visits
  group by 1
  on conflict (day) do update set visits = excluded.visits;

  delete from public.site_visits
  where created_at < (now() - make_interval(days => keep_days));
  get diagnostics moved = row_count;
  return moved;
end;
$$;

-- 2. Prune old, already-processed content events ------------------------------
-- Only removes events that are DONE ('published' or 'rejected') and older than
-- `keep_days`. New / in-production events are never touched.
create or replace function public.prune_content_events(keep_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare removed integer;
begin
  delete from public.content_events
  where created_at < (now() - make_interval(days => keep_days))
    and processed_status in ('published', 'rejected');
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- 3. Lock the maintenance functions to the service role -----------------------
-- These are ops jobs, not public API. Revoke the default PUBLIC execute grant
-- so anon / authenticated cannot call them via /rest/v1/rpc.
revoke execute on function public.rollup_site_visits(integer)  from public;
revoke execute on function public.prune_content_events(integer) from public;
grant  execute on function public.rollup_site_visits(integer)  to service_role;
grant  execute on function public.prune_content_events(integer) to service_role;

-- ---------------------------------------------------------------------------
-- OPTIONAL: schedule daily via pg_cron (run these manually once you decide to).
-- Deletes are intentionally NOT auto-enabled by this migration.
--
--   create extension if not exists pg_cron;
--   select cron.schedule('rollup-site-visits', '15 3 * * *',
--                        $$ select public.rollup_site_visits(7);  $$);
--   select cron.schedule('prune-content-events', '30 3 * * *',
--                        $$ select public.prune_content_events(90); $$);
-- ---------------------------------------------------------------------------
