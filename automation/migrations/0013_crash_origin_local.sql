-- Chart Quest — crash origin `local` (BetaModel contract §0.10, crashes[].origin)
-- APPLIED to ymxppzhczvmiuoncuqqu on 2026-08-05. Verified after applying:
--   anon_can_call = false · is_admin() guard intact · is_local present
--   live rows classify: 2 local · 1 self · 2 third_party — identical to beta-qa/beta-model.js
-- ============================================================================
-- WHY
-- Migration 0012 split crashes into self vs third_party. It missed a third case that was
-- already polluting the beta tables: a DEVELOPER MACHINE. A localhost build-tag syntax error
-- from a concurrent coding session sat in beta_events counted as a real tester crash, and the
-- test-player exclusion list structurally cannot catch it — that matches player-id PREFIXES,
-- and a dev browser mints an ordinary `p-` id like anyone else.
--
-- Precedence is local > third_party > self, matching cq-track.js: on a dev machine nothing in
-- the session is beta data, so which script threw is a detail (source_host still records it).
--
-- HOW / TWO DELIBERATE CHOICES
-- 1. The anchors contain NO backslashes. The host allowlist in this function is a regex whose
--    escaping round-trips ambiguously through pg_get_functiondef; a replacement keyed on it
--    could match nothing and silently no-op, leaving the engines disagreeing. Every anchor is
--    asserted, so a drifted function raises instead.
-- 2. The locality test uses LIKE, not regex, for the same escaping reason — and it is still
--    ANCHORED: it equals the bare host or the host followed by a port, so `localhost.evil.com`
--    cannot read as a dev machine. That is the lesson the beta-ingest origin allowlist learned
--    when a prefix match accepted look-alike domains.
--
-- RETROACTIVE LIMIT, stated rather than hidden: `local` can only be recovered from a crash
-- whose `where` carries a localhost URL. A dev crash thrown by INLINE code reports no filename,
-- so it stays `self`. From build 342 the client decides from the PAGE host and has no such gap.
--
-- ⚠ create-or-replace RESETS grants to EXECUTE-to-PUBLIC. The re-assert at the bottom is not
-- optional — same trap that once made prune_beta_events(0) anon-callable.
-- ============================================================================
do $mig$
declare
  src text; cur text;
  a1_old text := $x$                then split_part(split_part(cg.crash_where, '://', 2), '/', 1) end as src_host
    from crash_grp cg
  ),$x$;
  a1_new text := $x$                then split_part(split_part(cg.crash_where, '://', 2), '/', 1) end as src_host,
           -- Anchored on purpose: equals the bare host, or the host followed by a port.
           (split_part(split_part(cg.crash_where, '://', 2), '/', 1) in ('localhost','127.0.0.1','[::1]')
            or split_part(split_part(cg.crash_where, '://', 2), '/', 1) like 'localhost:%'
            or split_part(split_part(cg.crash_where, '://', 2), '/', 1) like '127.0.0.1:%'
            or split_part(split_part(cg.crash_where, '://', 2), '/', 1) like '[::1]:%') as is_local
    from crash_grp cg
  ),$x$;
  a2_old text := $x$      'origin',      case when cg.src_host is not null then 'third_party' else 'self' end,$x$;
  a2_new text := $x$      'origin',      case when cg.is_local then 'local'
                          when cg.src_host is not null then 'third_party' else 'self' end,$x$;
  a3_old text := $x$    ) order by (cg.src_host is not null), cg.players desc, cg.n desc, cg.last_seen desc, cg.message), '[]'::jsonb) as j$x$;
  a3_new text := $x$    ) order by (case when cg.is_local then 2 when cg.src_host is not null then 1 else 0 end),
               cg.players desc, cg.n desc, cg.last_seen desc, cg.message), '[]'::jsonb) as j$x$;
  a4_old text := $x$          order by (src_host is not null), players desc, n desc, last_seen desc, message$x$;
  a4_new text := $x$          order by (case when is_local then 2 when src_host is not null then 1 else 0 end),
                   players desc, n desc, last_seen desc, message$x$;
begin
  select pg_get_functiondef(p.oid) into src
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'beta_model';
  if src is null then raise exception 'public.beta_model() not found'; end if;

  cur := src;
  cur := replace(cur, a1_old, a1_new); if cur = src then raise exception 'anchor 1 (crash_host) not found — beta_model has drifted'; end if;
  src := cur; cur := replace(cur, a2_old, a2_new); if cur = src then raise exception 'anchor 2 (origin case) not found'; end if;
  src := cur; cur := replace(cur, a3_old, a3_new); if cur = src then raise exception 'anchor 3 (jsonb_agg order by) not found'; end if;
  src := cur; cur := replace(cur, a4_old, a4_new); if cur = src then raise exception 'anchor 4 (inner order by) not found'; end if;

  execute cur;
end
$mig$;

revoke execute on function public.beta_model(int, text) from public;
revoke execute on function public.beta_model(int, text) from anon;
grant  execute on function public.beta_model(int, text) to authenticated;
