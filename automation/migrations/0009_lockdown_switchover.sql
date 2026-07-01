-- Chart Quest — LOCKDOWN SWITCHOVER  ⚠️ DO NOT APPLY UNTIL DEPLOYED ⚠️
-- ============================================================================
-- This migration removes the direct anon write path to the content/mastery
-- tables and puts the admin dashboard behind auth. It BREAKS the currently
-- deployed game + dashboard, which still write/read with the anon key.
--
-- APPLY ONLY AFTER you have deployed:
--   • the updated index.html  (content + mastery writes now go via /functions/v1/ingest)
--   • the updated dashboard.html (signs in as admin; reads with the user JWT)
-- Prereq: migration 0008 (admins table + is_admin()) is already applied. ✅
--
-- Verify the deploy is live first, e.g. load the game and confirm content still
-- syncs (Edge Function writes), then run this.
-- ============================================================================

-- 1. Admin-gate the dashboard RPCs -------------------------------------------
create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  return (select json_build_object(
    'total_signups', (select count(*) from auth.users),
    'players_reached_end', (select count(*) from public.profiles where hours_cleared @> '[6]'::jsonb),
    'active_players_24h', (select count(*) from public.profiles where updated_at > now() - interval '24 hours'),
    'active_players_7d', (select count(*) from public.profiles where updated_at > now() - interval '7 days'),
    'total_visits', (select count(*) from public.site_visits),
    'avg_player_level', (select coalesce(round(avg(player_level),2),0) from public.profiles),
    'open_bug_reports', (select count(*) from public.bug_reports where status = 'open'),
    'total_bug_reports', (select count(*) from public.bug_reports)
  ));
end;
$$;

create or replace function public.get_recent_bug_reports(p_limit integer default 50)
returns table(message text, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  return query
    select b.message, b.status, b.created_at
    from public.bug_reports b
    order by b.created_at desc
    limit p_limit;
end;
$$;

-- Only signed-in users may even attempt these; the is_admin() guard does the rest.
revoke execute on function public.get_dashboard_stats()               from anon;
revoke execute on function public.get_recent_bug_reports(integer)     from anon;
grant  execute on function public.get_dashboard_stats()               to authenticated;
grant  execute on function public.get_recent_bug_reports(integer)     to authenticated;

-- 2. Restrict reads of the content tables the dashboard shows to admins -------
drop policy if exists content_events_anon_select  on public.content_events;
create policy content_events_admin_select on public.content_events
  for select to authenticated using (public.is_admin());

drop policy if exists content_replays_anon_select on public.content_replays;
create policy content_replays_admin_select on public.content_replays
  for select to authenticated using (public.is_admin());

-- 3. Remove the direct anon WRITE path (now handled by the ingest Edge Fn) -----
drop policy if exists content_events_anon_insert    on public.content_events;
drop policy if exists content_replays_anon_insert   on public.content_replays;
drop policy if exists content_briefs_anon_insert    on public.content_briefs;
drop policy if exists content_exports_anon_insert   on public.content_exports;
drop policy if exists content_generated_anon_insert on public.content_generated;
drop policy if exists player_mastery_anon_upsert    on public.player_mastery;
drop policy if exists player_mastery_anon_update    on public.player_mastery;

-- NOTE: content_assets / published_posts / performance_snapshots still have
-- their 0001 anon policies. The game never wrote them; if any server-side
-- automation writes them with the anon key, confirm that before locking them
-- the same way. player_mastery keeps its anon SELECT (scores only, no PII).
