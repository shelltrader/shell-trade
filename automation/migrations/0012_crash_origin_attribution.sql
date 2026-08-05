-- Chart Quest — crash origin attribution (BetaModel contract §2, crashes[])
-- APPLIED to ymxppzhczvmiuoncuqqu on 2026-08-05. Verified after applying:
--   anon_can_call = false · is_admin() guard intact · origin/source_host present
-- ============================================================================
-- WHY
-- window.onerror fires for EVERY script on the page, including ones ChartQuest does not ship.
-- On 2026-08-04 one visitor produced two crash rows a second apart — `t.entries.at is not a
-- function` and `this.i.at is not a function` — both thrown inside Cloudflare's analytics
-- beacon (static.cloudflareinsights.com), on Windows/Chrome. In the Founder Report they were
-- indistinguishable from a ChartQuest bug and were reported as an iOS Safari incompatibility
-- in our own code, on the strength of a minified stack we do not own. Nothing in this repo
-- calls .at(). A row you cannot fix must never look like one you can.
--
-- cq-track.js stamps props.origin + props.source_host from build 341. Rows collected before
-- that carry only props.where, so origin is DERIVED here — which is what makes the fix
-- retroactive over the data already collected.
--
-- HOW
-- Patched in place: pg_get_functiondef() + a CHECKED string replacement, rather than
-- re-sending the whole 400-line body. Keeps the diff auditable, cannot silently reformat the
-- rest of the function, and raises if the anchor is missing so a drifted function fails loudly
-- instead of leaving the SQL and JS engines quietly disagreeing.
--
-- ⚠ create-or-replace RESETS a function's grants to the default (EXECUTE to PUBLIC). The
-- re-assert at the bottom is not optional — it is the same trap that once made
-- prune_beta_events(0) anon-callable.
-- ============================================================================
do $mig$
declare
  src     text;
  patched text;
  old_blk text := $old$  crashes_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'message',    cg.message,
      'kind',       cg.kind,
      'where',      cg.crash_where,
      'build',      cg.bld,
      'count',      cg.n,
      'players',    cg.players,
      'first_seen', cg.first_seen,
      'last_seen',  cg.last_seen
    ) order by cg.players desc, cg.n desc, cg.last_seen desc, cg.message), '[]'::jsonb) as j
    from (select * from crash_grp order by players desc, n desc, last_seen desc, message limit 100) cg
  ),$old$;
  new_blk text := $new$  -- Mirrors crashSourceHost() in beta-qa/beta-model.js: a foreign host, or null when
  -- it is ours. A row with no http(s) filename at all -- inline code, or a CORS-sanitized
  -- "Script error." -- counts as OURS. Over-owning a crash is the safe direction: a false
  -- "ours" costs a wasted look, a false "theirs" files a real bug under someone else's name
  -- and it never gets fixed.
  crash_host as (
    select cg.*,
           case when cg.crash_where ~ '^https?://'
                     and nullif(split_part(split_part(cg.crash_where, '://', 2), '/', 1), '') is not null
                     and split_part(split_part(cg.crash_where, '://', 2), '/', 1) !~
                         '(^|\.)playchartquest\.com$|(^|\.)chartquest\.pages\.dev$|^localhost(:[0-9]+)?$|^127\.0\.0\.1(:[0-9]+)?$|^\[::1\](:[0-9]+)?$|(^|\.)chart-quest-game\.netlify\.app$|(^|\.)shelltrader\.github\.io$'
                then split_part(split_part(cg.crash_where, '://', 2), '/', 1) end as src_host
    from crash_grp cg
  ),
  crashes_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'message',     cg.message,
      'kind',        cg.kind,
      'where',       cg.crash_where,
      'build',       cg.bld,
      'count',       cg.n,
      'players',     cg.players,
      'first_seen',  cg.first_seen,
      'last_seen',   cg.last_seen,
      'origin',      case when cg.src_host is not null then 'third_party' else 'self' end,
      'source_host', cg.src_host
    -- OURS always outranks third-party, however many people a foreign script hit. A bug in
    -- someone else's beacon is not the top of the founder's backlog, and letting it sort to
    -- the top is how a week goes on a stack trace nobody here can change.
    ) order by (cg.src_host is not null), cg.players desc, cg.n desc, cg.last_seen desc, cg.message), '[]'::jsonb) as j
    from (select * from crash_host
          order by (src_host is not null), players desc, n desc, last_seen desc, message
          limit 100) cg
  ),$new$;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'beta_model';

  if src is null then
    raise exception 'public.beta_model() not found — apply migration 0011 first';
  end if;

  patched := replace(src, old_blk, new_blk);
  if patched = src then
    raise exception 'crashes_json anchor not found in beta_model() — the function has drifted; patch it by hand rather than leaving the SQL and JS engines disagreeing';
  end if;

  execute patched;
end
$mig$;

revoke execute on function public.beta_model(int, text) from public;
revoke execute on function public.beta_model(int, text) from anon;
grant  execute on function public.beta_model(int, text) to authenticated;

-- Verify after applying (expect anon_can_call=false, both flags true):
--   select has_function_privilege('anon', p.oid, 'execute') as anon_can_call,
--          pg_get_functiondef(p.oid) like '%is_admin()%'   as has_admin_guard,
--          pg_get_functiondef(p.oid) like '%source_host%'  as has_attribution
--   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and p.proname='beta_model';
