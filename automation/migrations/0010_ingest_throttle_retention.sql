-- Chart Quest — prune the ingest rate-limit counter table
-- Apply to project ymxppzhczvmiuoncuqqu. Additive & safe: creates a prune
-- function; deletes nothing until called / scheduled.
--
-- The `ingest` Edge Function writes one row per (ip, 1-minute window) to
-- public.ingest_throttle for rate limiting. Those rows are useless the moment
-- their window passes, but nothing cleaned them up → unbounded growth at scale
-- (≈ one row per active IP per minute; at 1000 users that's ~60k rows/hour).
-- This prune keeps only the recent windows the limiter still consults.
-- ============================================================================

create or replace function public.prune_ingest_throttle(keep_minutes integer default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare removed integer;
begin
  delete from public.ingest_throttle
  where window_start < (now() - make_interval(mins => keep_minutes));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.prune_ingest_throttle(integer) from public;
grant  execute on function public.prune_ingest_throttle(integer) to service_role;

-- OPTIONAL: schedule alongside the other retention jobs (see 0006).
--   select cron.schedule('prune-ingest-throttle', '*/15 * * * *',
--                        $$ select public.prune_ingest_throttle(10); $$);
