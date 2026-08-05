-- 0015 — admin-gate the two legacy dashboard RPCs
-- ============================================================================================
-- THE EXPOSURE
-- `get_dashboard_stats()` and `get_recent_bug_reports(int)` are SECURITY DEFINER, carry NO
-- authorisation check of any kind, and are executable by `authenticated`. In Supabase
-- `authenticated` means ANY REGISTERED PLAYER, not an admin. get_recent_bug_reports was, in full:
--
--     select message, status, created_at from public.bug_reports order by created_at desc limit p_limit;
--
-- No filter, no guard. `message` is user-typed free text, so any player who signed up could read
-- every bug report anyone had ever submitted — the PII exposure docs/PRODUCTION_READINESS.md §3b
-- has always described, which survived the 0009 lockdown because that pass revoked `anon` and
-- stopped there. Revoking anon is not the fix when the dashboard's own users are authenticated.
--
-- WHY A GUARD AND NOT A REVOKE
-- Revoking EXECUTE from `authenticated` would lock out the admin too — admins are authenticated
-- users. The guard below is the pattern 0011 already established for the whole beta_* suite
-- (beta_model / beta_players / beta_player_detail / beta_search all do exactly this), so this
-- brings the two stragglers in line rather than inventing a second mechanism.
--
-- LANGUAGE CHANGE: both were `language sql`, which cannot RAISE. They become `plpgsql`. Signatures
-- and return types are unchanged, so every caller keeps working; CREATE OR REPLACE also preserves
-- existing grants, and the revoke/grant block at the end re-asserts them explicitly anyway (0011's
-- rule: state the grants in the same migration, with the EXACT argument types — a revoke naming
-- the wrong types silently does nothing).
--
-- ⚠️ THIS FAILS CLOSED, AND `public.admins` IS CURRENTLY EMPTY (verified 2026-08-05, 0 rows).
-- So after this migration these two functions are readable by NOBODY until an admin is seeded.
-- That is the correct direction for a security fix — but note the same is ALREADY true of the
-- four beta_* functions, which is why beta-qa.html's live mode cannot authenticate today and
-- silently falls back to its snapshot. Seeding an admin is a separate, deliberate decision:
--
--     insert into public.admins (user_id)
--     select id from auth.users where email = '<the founder email>'
--     on conflict do nothing;
--
-- ============================================================================================

create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'total_signups', (select count(*) from auth.users),
      'players_reached_end', (select count(*) from public.profiles where hours_cleared @> '[6]'::jsonb),
      'active_players_24h', (select count(*) from public.profiles where updated_at > now() - interval '24 hours'),
      'active_players_7d', (select count(*) from public.profiles where updated_at > now() - interval '7 days'),
      'total_visits', (select count(*) from public.site_visits),
      'avg_player_level', (select coalesce(round(avg(player_level),2),0) from public.profiles),
      'open_bug_reports', (select count(*) from public.bug_reports where status = 'open'),
      'total_bug_reports', (select count(*) from public.bug_reports)
    )
  );
end;
$function$;

create or replace function public.get_recent_bug_reports(p_limit integer default 50)
returns table(message text, status text, created_at timestamp with time zone)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  -- columns qualified: `message`/`status`/`created_at` are also OUT parameter names here
  return query
    select b.message, b.status, b.created_at
    from public.bug_reports b
    order by b.created_at desc
    limit p_limit;
end;
$function$;

-- Re-assert the grants explicitly, with exact argument types (0011's rule).
revoke execute on function public.get_dashboard_stats()             from public, anon;
revoke execute on function public.get_recent_bug_reports(integer)   from public, anon;
grant  execute on function public.get_dashboard_stats()             to authenticated;
grant  execute on function public.get_recent_bug_reports(integer)   to authenticated;
