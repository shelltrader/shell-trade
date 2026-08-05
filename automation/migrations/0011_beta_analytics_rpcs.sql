-- Chart Quest — BETA TEST QA dashboard: the live (SQL) half of the BetaModel contract
-- ============================================================================
-- Implements docs/beta-qa/BETA_MODEL_CONTRACT.md §6. Four admin-only RPCs return the
-- ENTIRE dashboard shape as one JSON document each, so the UI never reads a raw
-- beta_events row and swapping the data source (live SQL ↔ snapshot JS) cannot change
-- a number. A parity harness diffs this against website/assets/beta-model.js; every
-- rounding rule and tie-break below is therefore load-bearing, not taste.
--
--   beta_model(p_days, p_build)                              → the whole dashboard
--   beta_players(p_days, p_build, limit, offset, search, stage) → { rows, total }
--   beta_player_detail(p_player_id)                          → one player's timeline
--   beta_search(p_q, p_limit)                                → { players, surveys, crashes }
--
-- ── THE REVOKE TRAP (read this before adding a fifth function) ───────────────
-- Postgres grants EXECUTE to PUBLIC by default. A `security definer` function is
-- therefore anon-callable with the publishable key SHIPPED IN THE GAME from the moment
-- it is created — the is_admin() guard inside the body is the only thing standing
-- between a stranger and the whole beta dataset, and one forgotten guard is total.
-- This project has already had the near-miss: prune_beta_events(0) was briefly
-- anon-callable and would have deleted every row. Every function below is revoked from
-- public AND anon and granted only to authenticated, IN THIS SAME MIGRATION, with the
-- EXACT argument types (a revoke naming the wrong types silently does nothing).
--
-- ── WHAT THIS DELIBERATELY DOES NOT DO ──────────────────────────────────────
-- • No sentiment analysis. The free text is returned verbatim; reading it is a human's
--   job (see scripts/founder_report.py's docstring for why a keyword counter dressed up
--   as sentiment is worse than nothing on a ten-person beta).
-- • No alerts (§4) or recommendations (§5). Those are derived from this model in the UI
--   layer, so both engines produce them from identical inputs and cannot disagree.
-- • No country/language. Not collected, by design — no cookies, no IP storage, no third
--   parties. The dashboard says so rather than rendering an empty column.
-- • No writes, ever. Nothing here can mutate or delete beta data.
--
-- ── TIME BASIS (the JS engine must match this exactly) ───────────────────────
-- beta_events carries two clocks and they are NOT interchangeable:
--   created_at — when the row reached the server.
--   ts         — when it happened on the player's device.
-- Windowing and day-bucketing use created_at (server truth, matches the
-- `created_at=gte.` filter founder_report.py fetches with, immune to a phone with a
-- wrong clock). Elapsed-time maths and per-player ordering use ts, because cq-track.js
-- keeps a durable retry queue: an event that happened on Monday can be INSERTED on
-- Thursday when the tester next opens the game, and a created_at delta would report a
-- three-day "time to boss". Every function sets timezone = 'UTC' so timestamps render
-- as stable ISO-8601 regardless of the caller's session.
--
-- ── ROUNDING & TIE-BREAKS (parity-critical) ──────────────────────────────────
-- • percentages → 1 decimal;  seconds → whole numbers;  ratings/health → 1 decimal.
-- • median = percentile_cont (the textbook median: mean of the two middle values for an
--   even count). NOT percentile_disc — a naive JS sort-and-take-the-middle matches
--   percentile_cont, and silent disagreement on n=2 is exactly the kind of drift the
--   parity harness exists to catch.
-- • trend compares the ROUNDED values, so a 0.004s change cannot flip an arrow, and is
--   forced to "flat" whenever n < 5 or there is no previous window. "up" means the
--   number went up — for crash_players that is bad news; colour is the UI's problem.
--
-- Idempotent: create-or-replace throughout, create index if not exists (NOT
-- CONCURRENTLY — that cannot run inside a migration transaction).
-- ============================================================================

-- APPLIED to ymxppzhczvmiuoncuqqu on 2026-08-05, in four parts (indexes+views,
-- beta_model, players+detail, search+revokes) plus the security_invoker fix below.
-- Verified after applying: anon_can_call = false on all four functions, and each
-- raises 42501 Forbidden for a non-admin caller.

-- ── 1 · Indexes the queries above need ──────────────────────────────────────
-- beta_events already has (created_at desc), (name), (player_id), (session_id) and a
-- unique (event_id). What it lacks is anything on ts, and any composite: the per-player
-- milestone rollups scan one player's whole history and then filter by name, which on a
-- single-column (player_id) index means a heap visit per row.
create index if not exists beta_events_player_name_ts_idx
  on public.beta_events (player_id, name, ts);

-- Elapsed-time maths and the drill-down timeline both order by ts. There was no index
-- on ts at all — every timeline was a sort of the whole table.
create index if not exists beta_events_ts_idx
  on public.beta_events (ts desc);

-- The window scan: created_at bound first, then group by player.
create index if not exists beta_events_created_at_player_idx
  on public.beta_events (created_at desc, player_id);

-- Stage counts read one event name across a window.
create index if not exists beta_events_name_created_at_idx
  on public.beta_events (name, created_at desc);

-- Build attribution and the per-build cohort rollups. Partial, because most rows before
-- build 332 carry no build at all and indexing their NULLs buys nothing.
-- (`props ->> 'build' is not null` rather than `props ? 'build'`: the ? operator is a
-- parameter placeholder to several client drivers and turns this file into a landmine.)
create index if not exists beta_events_build_idx
  on public.beta_events ((props ->> 'build'))
  where (props ->> 'build') is not null;

create index if not exists beta_surveys_created_at_idx on public.beta_surveys (created_at desc);
create index if not exists beta_surveys_player_id_idx  on public.beta_surveys (player_id);


-- ── 2 · The funnel, as data ─────────────────────────────────────────────────
-- Contract §1, verbatim. A VIEW rather than a VALUES list copy-pasted into four
-- function bodies, because four copies of a thirteen-row table is four chances to
-- renumber one of them and produce a funnel that disagrees with itself.
--
-- play_click and movement are instrumented = false and carry no event:
--   • Clicking Play fires NOTHING. cq-track.js mints one session per VISIT, shared
--     across index → play → the game iframe → survey via sessionStorage, and only the
--     document that mints it fires session_start. page='play' on a session_start means
--     the tester arrived directly at play.html.
--   • The movement tutorial was never instrumented at all.
-- They exist in the array so the founder sees the real journey, and are SKIPPED in every
-- drop-off calculation so they can never manufacture a 100% loss.
--
-- tutorial_completed is wired to introComplete(), which the game calls from bossFinish()
-- when level == 1 — i.e. AFTER Guardian 1. The label says so. "0% tutorial" and "0% boss"
-- are very different problems and the wrong label sends a week at the wrong one.
drop view if exists public.beta_funnel_stages;
create view public.beta_funnel_stages as
select * from (values
  (1,  'landing'::text,        'Landing page'::text,                            'session_start'::text,          true),
  (2,  'play_click',           'Play clicked',                                  null,                           false),
  (3,  'tutorial',             'Tutorial started',                              'tutorial_started',             true),
  (4,  'movement',             'Movement tutorial',                             null,                           false),
  (5,  'intro_done',           'Intro chain completed (ends after Guardian 1)',  'tutorial_completed',           true),
  (6,  'trade',                'First trade',                                   'first_trade_started',          true),
  (7,  'boss',                 'Boss started',                                  'boss_started',                 true),
  (8,  'boss_won',             'Boss defeated',                                 'boss_defeated',                true),
  (9,  'journal_unlock',       'Journal unlocked',                              'journal_unlocked',             true),
  (10, 'journal',              'Journal Discovery completed',                   'journal_discovery_completed',  true),
  -- ORDER IS LOAD-BEARING — do NOT move 'completed' to the end of this list. The completion
  -- ceremony stamps beta_completed and THEN hands off to the survey; verified in the live data
  -- (the one player with both fired beta_completed at 15:28:59, survey_submitted at 15:32:53).
  -- Because the monotonic pass credits every stage BEFORE a player's furthest one, putting
  -- 'completed' last credited survey_started AND survey_submitted to all four players who
  -- merely finished the beta — reporting the survey stage as 4 players / 100% kept when the
  -- truth is 4 started and 1 submitted. That did not just misreport a stage: it exactly
  -- concealed a 75% drop-off at the survey handoff, the third-largest leak in the funnel.
  (11, 'completed',            'Beta completed',                                'beta_completed',               true),
  (12, 'survey_start',         'Survey started',                                'survey_started',               true),
  (13, 'survey',               'Survey submitted',                              'survey_submitted',             true)
) as t(idx, stage_key, stage_label, ev_name, instrumented);

comment on view public.beta_funnel_stages is
  'BetaModel contract §1. The single source of the funnel order used by beta_model(), '
  'beta_players() and beta_search(). Mirrored in website/assets/beta-model.js — change both.';

revoke select on public.beta_funnel_stages from anon;
grant  select on public.beta_funnel_stages to authenticated;

-- Human labels for the drill-down timeline. Same reasoning: one copy.
drop view if exists public.beta_event_labels;
create view public.beta_event_labels as
select * from (values
  ('session_start'::text,               'Website opened'::text,                        'session'::text),
  ('session_end',                       'Session ended',                                'session'),
  ('return_visit',                      'Came back',                                    'session'),
  ('tutorial_started',                  'Tutorial started',                             'milestone'),
  ('tutorial_completed',                'Intro chain completed (ends after Guardian 1)','milestone'),
  ('first_trade_started',               'First trade placed',                           'milestone'),
  ('first_trade_won',                   'First trade won',                              'milestone'),
  ('first_trade_lost',                  'First trade lost',                             'milestone'),
  ('boss_started',                      'Boss fight started',                           'milestone'),
  ('boss_defeated',                     'Boss defeated',                                'milestone'),
  ('journal_unlocked',                  'Journal unlocked',                             'milestone'),
  ('journal_discovery_started',         'Journal Discovery started',                    'milestone'),
  ('journal_discovery_completed',       'Journal Discovery completed',                  'milestone'),
  -- Accepted by beta-ingest. An earlier version of this comment said the repo copy of that
  -- function was STALE and must be patched from the deployed source — that was wrong, and it
  -- was wrong in the dangerous direction: it would have sent the next engineer hand-editing a
  -- deployed function, creating the drift it warned about. `diff` of the repo file against
  -- get_edge_function is empty. Patch the repo file and deploy it. No row carries this name
  -- yet; it is listed so the first one renders correctly.
  ('journal_discovery_skipped',         'Journal Discovery skipped',                    'milestone'),
  ('beta_completed',                    'Beta completed',                               'milestone'),
  ('survey_started',                    'Survey started',                               'milestone'),
  ('survey_submitted',                  'Survey submitted',                             'milestone'),
  ('crash',                             'Crash',                                        'crash')
) as t(ev_name, ev_label, ev_kind);

revoke select on public.beta_event_labels from anon;
grant  select on public.beta_event_labels to authenticated;

-- Postgres views default to security_invoker = false — they run with the DEFINER's
-- permissions and bypass the querying user's RLS, which Supabase's linter flags as an
-- ERROR. Both views above hold nothing but a static VALUES list, so there is no table
-- access to bypass and nothing to leak; but an ERROR-level lint that is "fine, actually"
-- trains people to ignore the linter, and the next definer view will be a real one.
alter view public.beta_funnel_stages set (security_invoker = true);
alter view public.beta_event_labels  set (security_invoker = true);


-- ── 3 · beta_model(p_days, p_build) ─────────────────────────────────────────
-- The whole dashboard in one round trip: meta + kpis + funnel + timeseries + surveys
-- + builds + crashes + tech.
--
-- p_days = 0 means ALL TIME (and therefore no previous window, so every KPI's prev is
-- null rather than a fabricated zero).
-- p_build filters to an ENTRY COHORT — the players whose first build-carrying event in
-- the window was that build — not to the individual rows carrying it. Filtering rows
-- would shred the funnel: a player whose session_start predates the build would vanish
-- from Landing while still counting at First trade, and the funnel would read >100%.
create or replace function public.beta_model(p_days int default 7, p_build text default null)
returns json
language plpgsql
stable
security definer
set search_path = public
set timezone = 'UTC'
as $fn$
declare
  v_now       timestamptz := now();
  v_days      int         := greatest(coalesce(p_days, 7), 0);
  v_build     text        := nullif(btrim(coalesce(p_build, '')), '');
  v_cur_from  timestamptz;
  v_prev_from timestamptz;
  v_has_prev  boolean;
  v_out       jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if v_days = 0 then
    v_cur_from := '-infinity'::timestamptz;          -- all time
  else
    v_cur_from := v_now - make_interval(days => v_days);
  end if;

  -- A previous window is only meaningful for a bounded window with no build filter.
  -- Under a build filter the "previous window" is the same cohort BEFORE their build
  -- existed, which is near-zero by construction and would render every trend as a green
  -- arrow off nothing. Say null instead of implying a comparison we cannot make.
  v_has_prev := (v_days > 0 and v_build is null);
  if v_has_prev then
    v_prev_from := v_now - make_interval(days => v_days * 2);
  else
    v_prev_from := v_cur_from;
  end if;

  -- AN EMPTY PREVIOUS WINDOW IS NOT A ZERO — IT IS "NO COMPARISON".
  -- The beta opened on 2026-08-03, so on day two every previous window predates the beta
  -- itself. Treating that absence as prev = 0 made every KPI render a green ↑ off nothing:
  -- "players ↑, sessions ↑, completions ↑" on a dashboard whose whole job is to say what
  -- actually changed — and directional noise that reads as success means the one week
  -- something genuinely regressed would look identical. Excludes test players, so a prior
  -- window holding only VERIFY-/GATE- rows still counts as no comparison, matching
  -- beta-model.js exactly (the parity harness diffs every prev and trend field).
  if v_has_prev then
    select exists (
      select 1 from public.beta_events e
      where e.created_at >= v_prev_from and e.created_at < v_cur_from
        and not (lower(coalesce(e.player_id,'')) like any (array[
              'cert-test%','e2e-%','selftest%','browsertest%','qa-%','dev-%',
              'verify-%','gate-%','smoke-%','test-%']::text[]))
    ) or exists (
      select 1 from public.beta_surveys s
      where s.created_at >= v_prev_from and s.created_at < v_cur_from
        and not (lower(coalesce(s.player_id,'')) like any (array[
              'cert-test%','e2e-%','selftest%','browsertest%','qa-%','dev-%',
              'verify-%','gate-%','smoke-%','test-%']::text[]))
    ) into v_has_prev;
  end if;

  with
  -- Team testing, not beta testers. Case-insensitive PREFIX match. The live data holds
  -- VERIFY-* and GATE-* ids that founder_report.py's list misses and which are currently
  -- being counted as real players; the canonical list (contract §0) adds them.
  -- Exclusions are counted and REPORTED in meta — a suspiciously small cohort must never
  -- be a silent mystery.
  cfg as (
    select array['cert-test%','e2e-%','selftest%','browsertest%','qa-%','dev-%',
                 'verify-%','gate-%','smoke-%','test-%']::text[] as test_prefixes
  ),
  stages as (select * from public.beta_funnel_stages),

  -- Both windows in one pass, with every jsonb prop dug out ONCE and type-guarded.
  -- jsonb_typeof before the ::numeric cast: props is free-form jsonb, and a single row
  -- with seconds:"abc" would otherwise 500 the entire dashboard.
  raw as (
    select e.id, e.player_id, e.session_id, e.name, e.ts, e.created_at, e.props,
           nullif(btrim(e.device),   '') as device,
           nullif(btrim(e.browser),  '') as browser,
           nullif(btrim(e.os),       '') as os,
           nullif(btrim(e.screen),   '') as screen,
           nullif(btrim(e.viewport), '') as viewport,
           (e.created_at >= v_cur_from)  as is_cur,
           (lower(coalesce(e.player_id, '')) like any (c.test_prefixes)) as is_test,
           nullif(btrim(e.props ->> 'build'), '') as bld,
           e.props ->> 'page' as pr_page,
           case when jsonb_typeof(e.props -> 'seconds') = 'number'
                then (e.props ->> 'seconds')::numeric end as pr_seconds,
           case when jsonb_typeof(e.props -> 'completion_seconds') = 'number'
                then (e.props ->> 'completion_seconds')::numeric end as pr_completion
    from public.beta_events e cross join cfg c
    where e.created_at >= v_prev_from
  ),
  excl as (
    select count(*) as ev_n, count(distinct player_id) as pl_n
    from raw where is_cur and is_test
  ),
  ev0 as (select * from raw where not is_test),

  -- Build attribution: a player belongs to the build of their FIRST build-carrying event
  -- in the window. An entry cohort keeps completion_pct a real per-cohort rate instead of
  -- double-counting a tester who spanned two builds.
  attr as (
    select distinct on (player_id) player_id, bld
    from ev0
    where is_cur and player_id is not null and bld is not null
    order by player_id, ts asc, id asc
  ),
  cohort as (
    select p.player_id, coalesce(a.bld, '(unknown)') as bld
    from (select distinct player_id from ev0 where is_cur and player_id is not null) p
    left join attr a on a.player_id = p.player_id
  ),
  ev as (
    select e.* from ev0 e
    where v_build is null
       or e.player_id in (select player_id from cohort where bld = v_build)
  ),
  sv as (
    select s.id, s.player_id, s.q1_rating, s.q2_hook, s.q3_improvement, s.q4_continue,
           s.q5_anything, s.seconds_taken, s.created_at,
           (s.created_at >= v_cur_from) as is_cur
    from public.beta_surveys s cross join cfg c
    where s.created_at >= v_prev_from
      and not (lower(coalesce(s.player_id, '')) like any (c.test_prefixes))
      and (v_build is null or s.player_id in (select player_id from cohort where bld = v_build))
  ),
  sv_cur as (select * from sv where is_cur),

  -- ONE ROW PER PLAYER PER WINDOW. Every per-player fact is folded here exactly once,
  -- which is how "milestones are once-per-player, forever" stops being a rule someone has
  -- to remember and becomes the shape of the data. bool_or, never count(*).
  pl as (
    select e.player_id, e.is_cur,
           min(e.created_at) as first_seen,
           max(e.created_at) as last_seen,
           count(*) filter (where e.name = 'crash')                    as crashes,
           bool_or(e.name = 'return_visit')                            as has_return,
           bool_or(e.name = 'boss_defeated')                           as has_boss_won,
           bool_or(e.name = 'journal_discovery_completed')             as has_j_done,
           bool_or(e.name = 'beta_completed')                          as has_completed,
           bool_or(e.name = 'survey_submitted')                        as has_survey,
           min(e.ts) filter (where e.name = 'session_start')           as t_start,
           min(e.ts) filter (where e.name = 'boss_started')            as t_boss
    from ev e
    where e.player_id is not null
    group by e.player_id, e.is_cur
  ),

  -- completion_seconds is RECOMPUTED AND RE-SENT on every later session_end. Counting
  -- rows let one finisher who kept playing dominate the median. One value per player.
  pl_comp as (
    select distinct on (player_id, is_cur) player_id, is_cur, pr_completion as completion_seconds
    from ev
    where player_id is not null and pr_completion is not null and pr_completion > 0
    order by player_id, is_cur, ts asc, id asc
  ),

  -- Device/browser/os per PLAYER, not per event: the contract's tech split sums to the
  -- player count. Most recent non-empty value wins (a tester who moved to their phone
  -- reads as mobile), resolved deterministically rather than by mode(), whose tie-break
  -- is implementation-defined and would drift against the JS engine.
  pl_env as (
    select player_id,
      (array_agg(device   order by ts desc, id desc) filter (where device   is not null))[1] as device,
      (array_agg(browser  order by ts desc, id desc) filter (where browser  is not null))[1] as browser,
      (array_agg(os       order by ts desc, id desc) filter (where os       is not null))[1] as os,
      (array_agg(viewport order by ts desc, id desc) filter (where viewport is not null))[1] as viewport
    from ev where is_cur and player_id is not null group by player_id
  ),

  -- Session length: GAME PAGES ONLY. Pooling a 6-second landing-page view with a
  -- 15-minute play session made the median read 0.2 min against a real 44s+.
  sess as (
    select is_cur,
      count(distinct session_id) as sessions,
      count(*) filter (where name = 'session_end'
                         and coalesce(pr_page,'') in ('game','chart-quest','play')
                         and pr_seconds is not null) as sec_n,
      avg(pr_seconds) filter (where name = 'session_end'
                                and coalesce(pr_page,'') in ('game','chart-quest','play')) as avg_sec,
      percentile_cont(0.5) within group (order by (
        case when name = 'session_end' and coalesce(pr_page,'') in ('game','chart-quest','play')
             then pr_seconds end)::double precision) as med_sec
    from ev group by is_cur
  ),

  -- THE MONOTONIC PASS. Eleven independently-collected sets will report "kept from
  -- previous > 100%" the first time an event is lost or arrives out of order — and they
  -- do arrive out of order: beta_completed is stamped by the completion ceremony and in
  -- the live data fires BEFORE survey_submitted for some players. Take each player's
  -- FURTHEST stage and credit every stage before it. Done once here, reused everywhere.
  furthest as (
    select e.player_id, e.is_cur, max(s.idx) as idx
    from ev e join stages s on s.ev_name = e.name
    where e.player_id is not null
    group by e.player_id, e.is_cur
  ),
  stage_counts as (
    select s.idx, f.is_cur, count(distinct f.player_id) as players
    from furthest f join stages s on s.idx <= f.idx and s.instrumented
    group by s.idx, f.is_cur
  ),
  stage_pivot as (
    select is_cur,
      max(players) filter (where idx = 1)  as s_landing,
      max(players) filter (where idx = 5)  as s_intro,
      max(players) filter (where idx = 6)  as s_trade,
      max(players) filter (where idx = 8)  as s_boss_won,
      max(players) filter (where idx = 10) as s_journal,
      max(players) filter (where idx = 13) as s_completed
    from stage_counts group by is_cur
  ),

  -- Stage TIMING is measured, not credited: a player counted at a stage by the monotonic
  -- pass has no timestamp for it. ts, not created_at — see the TIME BASIS note.
  t_zero as (
    select player_id, min(ts) as t0
    from ev where is_cur and name = 'session_start' and player_id is not null
    group by player_id
  ),
  stage_first as (
    select e.player_id, s.idx, min(e.ts) as t_hit
    from ev e join stages s on s.ev_name = e.name
    where e.is_cur and e.player_id is not null
    group by e.player_id, s.idx
  ),
  stage_median as (
    select sf.idx,
           percentile_cont(0.5) within group (
             order by extract(epoch from (sf.t_hit - z.t0))::double precision) as med
    from stage_first sf join t_zero z on z.player_id = sf.player_id
    where sf.t_hit >= z.t0     -- a milestone from an earlier visit is not a duration
    group by sf.idx
  ),

  funnel_base as (
    select s.idx, s.stage_key, s.stage_label, s.instrumented,
           case when s.instrumented then coalesce(sc.players, 0) end as players,
           sm.med
    from stages s
    left join stage_counts sc on sc.idx = s.idx and sc.is_cur
    left join stage_median sm on sm.idx = s.idx
  ),
  -- partition by instrumented: lag() then walks the INSTRUMENTED stages only, so
  -- play_click and movement are skipped for drop-off purposes and the stage after
  -- Landing is Tutorial. Two uninstrumented stages in a row cannot invent a 100% loss.
  funnel_calc as (
    select fb.*,
           (select players from funnel_base where idx = 1) as top_players,
           lag(fb.players) over (partition by fb.instrumented order by fb.idx) as prev_players
    from funnel_base fb
  ),
  funnel_out as (
    select fc.idx, fc.stage_key, fc.stage_label, fc.instrumented, fc.players, fc.med,
           fc.prev_players,
           case when fc.instrumented and coalesce(fc.top_players, 0) > 0
                then round(100.0 * fc.players / fc.top_players, 1) end as pct_of_top,
           case when fc.instrumented and coalesce(fc.prev_players, 0) > 0
                then round(100.0 * fc.players / fc.prev_players, 1) end as kept_pct,
           case when fc.instrumented and fc.prev_players is not null
                     then greatest(fc.prev_players - fc.players, 0)
                when fc.instrumented then 0 end as drop_players,
           case when fc.instrumented and coalesce(fc.prev_players, 0) > 0
                     then round(100.0 * greatest(fc.prev_players - fc.players, 0) / fc.prev_players, 1)
                when fc.instrumented and fc.prev_players is null then 0 end as drop_pct
    from funnel_calc fc
  ),
  -- Ranked by ABSOLUTE players lost, gated at n>=5. Sorting by rate let a 1-of-1 loss
  -- outrank a 7-of-13 loss — the exact mistake that would send week one at the wrong
  -- problem. Ties go to the earlier stage: fix the leak nearest the top first.
  bottleneck as (
    select idx from funnel_out
    where instrumented and coalesce(prev_players, 0) >= 5 and coalesce(drop_players, 0) > 0
    order by drop_players desc, idx asc limit 1
  ),
  funnel_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'key',                       fo.stage_key,
      'label',                     fo.stage_label,
      'instrumented',              fo.instrumented,
      'players',                   fo.players,
      'pct_of_top',                fo.pct_of_top,
      'kept_from_prev_pct',        fo.kept_pct,
      'drop_players',              fo.drop_players,
      'drop_pct',                  fo.drop_pct,
      'median_seconds_from_start', case when fo.instrumented then round(fo.med::numeric) end,
      'is_bottleneck',             coalesce(fo.idx = (select idx from bottleneck), false)
    ) order by fo.idx), '[]'::jsonb) as j
    from funnel_out fo
  ),

  -- ── timeseries ────────────────────────────────────────────────────────────
  -- "New" here is FIRST EVER SEEN, computed against the whole table rather than the
  -- window, so a tester whose first visit was three weeks ago is not re-christened new
  -- on a 7-day view. (The players_new KPI uses the return_visit flag instead, per
  -- founder_report.py; the two can disagree by exactly that player. Both are labelled.)
  first_ever as (
    select e.player_id, (min(e.created_at) at time zone 'UTC')::date as first_day
    from public.beta_events e
    where e.player_id is not null
      and e.player_id in (select distinct player_id from ev where is_cur and player_id is not null)
    group by e.player_id
  ),
  day_lo as (
    select coalesce(
      case when v_cur_from > '-infinity'::timestamptz
           then (v_cur_from at time zone 'UTC')::date end,
      (select (min(created_at) at time zone 'UTC')::date from ev where is_cur)
    ) as d
  ),
  -- Gap-filled: a chart with holes in it lies about continuity.
  days as (
    select g::date as day
    from day_lo dl,
         generate_series(dl.d::timestamp, (v_now at time zone 'UTC')::date::timestamp, interval '1 day') g
    where dl.d is not null
  ),
  day_ev as (
    select (e.created_at at time zone 'UTC')::date as day, e.*
    from ev e where e.is_cur
  ),
  ts_ev as (
    select d.day,
      count(distinct d.player_id)                                          as players,
      count(distinct d.session_id)                                         as sessions,
      count(distinct d.player_id) filter (where fe.first_day = d.day)      as new_players,
      count(distinct d.player_id) filter (where d.name = 'beta_completed') as completions,
      count(*) filter (where d.name = 'crash')                             as crashes,
      count(distinct d.player_id) filter (where d.name = 'first_trade_started') as reached_trade,
      count(distinct d.player_id) filter (where d.name = 'boss_started')       as reached_boss,
      avg(d.pr_seconds) filter (where d.name = 'session_end'
                                  and coalesce(d.pr_page,'') in ('game','chart-quest','play')) as avg_sec
    from day_ev d left join first_ever fe on fe.player_id = d.player_id
    group by d.day
  ),
  ts_sv as (
    select (created_at at time zone 'UTC')::date as day,
           count(*) as surveys, avg(q1_rating::numeric) as avg_rating
    from sv_cur group by 1
  ),
  timeseries_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'day',                 to_char(dd.day, 'YYYY-MM-DD'),
      'players',             coalesce(te.players, 0),
      'new_players',         coalesce(te.new_players, 0),
      'sessions',            coalesce(te.sessions, 0),
      'completions',         coalesce(te.completions, 0),
      'surveys',             coalesce(tv.surveys, 0),
      'avg_rating',          round(tv.avg_rating, 1),
      'crashes',             coalesce(te.crashes, 0),
      'avg_session_seconds', round(te.avg_sec),
      'reached_trade',       coalesce(te.reached_trade, 0),
      'reached_boss',        coalesce(te.reached_boss, 0)
    ) order by dd.day), '[]'::jsonb) as j
    from days dd
    left join ts_ev te on te.day = dd.day
    left join ts_sv tv on tv.day = dd.day
  ),

  -- ── surveys ───────────────────────────────────────────────────────────────
  -- Both distributions are dense: every rating 1-10 and all three continue options are
  -- present with a zero. A missing key reads as "no data" when it means "nobody said 2".
  rating_dist as (
    select jsonb_object_agg(g::text, coalesce(c.n, 0)) as j
    from generate_series(1, 10) g
    left join (select q1_rating as r, count(*) as n from sv_cur where q1_rating is not null group by 1) c
      on c.r = g
  ),
  continue_dist as (
    select jsonb_object_agg(t.k, coalesce(c.n, 0)) as j
    from (values ('immediately'),('later'),('not_interested')) t(k)
    left join (select q4_continue as q, count(*) as n from sv_cur where q4_continue is not null group by 1) c
      on c.q = t.k
  ),
  -- Only days that actually have ratings: a trend line drawn through days when nobody
  -- answered is noise shaped like a signal.
  rating_trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'day', to_char(t.day, 'YYYY-MM-DD'), 'avg', round(t.a, 1), 'n', t.n
    ) order by t.day), '[]'::jsonb) as j
    from (
      select (created_at at time zone 'UTC')::date as day, avg(q1_rating::numeric) as a, count(*) as n
      from sv_cur where q1_rating is not null group by 1
    ) t
  ),
  survey_resp as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'player_id',      r.player_id,
      'created_at',     r.created_at,
      'q1_rating',      r.q1_rating,
      'q2_hook',        r.q2_hook,
      'q3_improvement', r.q3_improvement,
      'q4_continue',    r.q4_continue,
      'q5_anything',    r.q5_anything,
      'seconds_taken',  r.seconds_taken
    ) order by r.created_at desc, r.id desc), '[]'::jsonb) as j
    from (select * from sv_cur order by created_at desc, id desc limit 500) r
  ),
  surveys_json as (
    select jsonb_build_object(
      'n',             (select count(*) from sv_cur),
      'avg_rating',    (select round(avg(q1_rating::numeric), 1) from sv_cur where q1_rating is not null),
      'rating_dist',   (select j from rating_dist),
      'continue_dist', (select j from continue_dist),
      'rating_trend',  (select j from rating_trend),
      'responses',     (select j from survey_resp)
    ) as j
  ),

  -- ── builds (entry cohorts) ────────────────────────────────────────────────
  build_pl as (
    select c.bld,
      count(*)                                as players,
      min(p.first_seen)                       as first_seen,
      max(p.last_seen)                        as last_seen,
      count(*) filter (where p.has_completed) as n_completed,
      count(*) filter (where p.has_boss_won)  as n_boss,
      count(*) filter (where p.has_j_done)    as n_journal,
      count(*) filter (where p.has_survey)    as n_survey
    from pl p join cohort c on c.player_id = p.player_id
    where p.is_cur group by c.bld
  ),
  -- Counted distinctly, not summed per player: ?fresh=1 wipes cq_pid while the tab keeps
  -- its sessionStorage id, so one session_id really can span two player ids.
  build_sess as (
    select c.bld, count(distinct e.session_id) as sessions
    from ev e join cohort c on c.player_id = e.player_id
    where e.is_cur group by c.bld
  ),
  build_crash as (
    select c.bld, count(*) as crashes, count(distinct e.player_id) as crash_players
    from ev e join cohort c on c.player_id = e.player_id
    where e.is_cur and e.name = 'crash' group by c.bld
  ),
  build_rate as (
    select c.bld, avg(s.q1_rating::numeric) as avg_rating
    from sv_cur s join cohort c on c.player_id = s.player_id group by c.bld
  ),
  build_comp as (
    select c.bld,
           percentile_cont(0.5) within group (order by pc.completion_seconds::double precision) as med
    from pl_comp pc join cohort c on c.player_id = pc.player_id
    where pc.is_cur group by c.bld
  ),
  builds_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'build',                     bp.bld,
      'players',                   bp.players,
      'sessions',                  coalesce(bs.sessions, 0),
      'first_seen',                bp.first_seen,
      'last_seen',                 bp.last_seen,
      'completion_pct',            round(100.0 * bp.n_completed / bp.players, 1),
      'avg_rating',                round(br.avg_rating, 1),
      'boss_pct',                  round(100.0 * bp.n_boss    / bp.players, 1),
      'journal_pct',               round(100.0 * bp.n_journal / bp.players, 1),
      'survey_pct',                round(100.0 * bp.n_survey  / bp.players, 1),
      'median_completion_seconds', round(bc.med::numeric),
      'crashes',                   coalesce(bcr.crashes, 0),
      'crash_players',             coalesce(bcr.crash_players, 0)
    ) order by bp.last_seen desc, bp.bld asc), '[]'::jsonb) as j
    from build_pl bp
    left join build_sess  bs  on bs.bld  = bp.bld
    left join build_crash bcr on bcr.bld = bp.bld
    left join build_rate  br  on br.bld  = bp.bld
    left join build_comp  bc  on bc.bld  = bp.bld
  ),

  -- ── crashes ───────────────────────────────────────────────────────────────
  -- Grouped by message AND build, so the same message appearing on a new build reads as
  -- a regression instead of hiding inside last week's count. Message truncated to 160
  -- like founder_report.py, so the two group identically.
  crash_grp as (
    select left(coalesce(e.props ->> 'message', ''), 160) as message,
           e.props ->> 'kind'  as kind,
           e.props ->> 'where' as crash_where,
           e.bld               as bld,
           count(*)                    as n,
           count(distinct e.player_id) as players,
           min(e.created_at)           as first_seen,
           max(e.created_at)           as last_seen
    from ev e where e.is_cur and e.name = 'crash'
    group by 1, 2, 3, 4
  ),
  crashes_json as (
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
  ),

  tech_json as (
    select jsonb_build_object(
      'device',   coalesce((select jsonb_object_agg(device,   n) from (select device,   count(*) n from pl_env where device   is not null group by 1) t), '{}'::jsonb),
      'browser',  coalesce((select jsonb_object_agg(browser,  n) from (select browser,  count(*) n from pl_env where browser  is not null group by 1) t), '{}'::jsonb),
      'os',       coalesce((select jsonb_object_agg(os,       n) from (select os,       count(*) n from pl_env where os       is not null group by 1) t), '{}'::jsonb),
      'viewport', coalesce((select jsonb_object_agg(viewport, n) from (select viewport, count(*) n from pl_env where viewport is not null group by 1) t), '{}'::jsonb)
    ) as j
  ),

  -- ── KPIs, current window vs the one before it ─────────────────────────────
  kagg as (
    select is_cur,
      count(*)                                     as players_total,
      count(*) filter (where not has_return)       as players_new,
      count(*) filter (where has_return)           as players_returning,
      count(*) filter (where has_completed)        as completed_runs,
      count(*) filter (where has_survey)           as survey_players,
      count(*) filter (where crashes > 0)          as crash_players,
      avg(extract(epoch from (t_boss - t_start))::numeric)
        filter (where t_boss is not null and t_start is not null and t_boss >= t_start) as avg_boss,
      count(*) filter (where t_boss is not null and t_start is not null and t_boss >= t_start) as boss_n
    from pl group by is_cur
  ),
  svagg as (
    select is_cur,
      avg(q1_rating::numeric) filter (where q1_rating is not null) as avg_rating,
      count(*) filter (where q1_rating is not null)                as rating_n,
      count(*) filter (where q4_continue in ('immediately','later')) as cont_yes,
      count(*) filter (where q4_continue is not null)              as cont_n
    from sv group by is_cur
  ),
  compagg as (
    select is_cur,
      percentile_cont(0.5) within group (order by completion_seconds::double precision) as med_completion,
      count(*) as comp_n
    from pl_comp group by is_cur
  ),
  -- Driver rows so an EMPTY previous window still produces zeros for counts and nulls
  -- for averages, rather than dropping out of the join and reading as "no change".
  wins(is_cur) as (values (true), (false)),
  win as (
    select w.is_cur,
      coalesce(k.players_total, 0)     as players_total,
      coalesce(k.players_new, 0)       as players_new,
      coalesce(k.players_returning, 0) as players_returning,
      coalesce(k.completed_runs, 0)    as completed_runs,
      coalesce(k.survey_players, 0)    as survey_players,
      coalesce(k.crash_players, 0)     as crash_players,
      k.avg_boss, coalesce(k.boss_n, 0) as boss_n,
      coalesce(se.sessions, 0) as sessions, se.avg_sec, se.med_sec, coalesce(se.sec_n, 0) as sec_n,
      sr.avg_rating, coalesce(sr.rating_n, 0) as rating_n,
      coalesce(sr.cont_yes, 0) as cont_yes, coalesce(sr.cont_n, 0) as cont_n,
      sp.s_landing, sp.s_intro, sp.s_trade, sp.s_boss_won, sp.s_journal, sp.s_completed,
      cm.med_completion, coalesce(cm.comp_n, 0) as comp_n
    from wins w
    left join kagg        k  on k.is_cur  = w.is_cur
    left join sess        se on se.is_cur = w.is_cur
    left join svagg       sr on sr.is_cur = w.is_cur
    left join stage_pivot sp on sp.is_cur = w.is_cur
    left join compagg     cm on cm.is_cur = w.is_cur
  ),
  -- The denominator for every "% of players who reached X": the funnel top, falling back
  -- to the raw player count when no session_start survived (founder_report.py's
  -- `len(stage['landing']) or len(players)`). Null when there is nobody at all, so the
  -- percentages come back null instead of dividing by zero.
  win2 as (
    select w.*, coalesce(nullif(w.s_landing, 0), nullif(w.players_total, 0)) as base
    from win w
  ),

  -- ── health score (contract §3) ────────────────────────────────────────────
  -- Components with n < 3 are DROPPED and the remaining weights renormalised, and the
  -- breakdown ships with the score. A health score driven by one survey response is
  -- worse than no score, and a composite nobody can decompose is a number nobody trusts.
  health_parts as (
    select w.is_cur, h.*
    from win2 w cross join lateral (values
      ('funnel_throughput'::text, 'Funnel throughput — reached First trade'::text, 30::numeric,
        case when w.base > 0 then coalesce(w.s_trade, 0)::numeric / w.base end,
        0.40::numeric, coalesce(w.base, 0)::numeric),
      ('completion', 'Completion — reached Beta completed', 25::numeric,
        case when w.base > 0 then coalesce(w.s_completed, 0)::numeric / w.base end,
        0.25::numeric, coalesce(w.base, 0)::numeric),
      ('enjoyment', 'Enjoyment — mean survey rating', 20::numeric,
        w.avg_rating, 8.5::numeric, w.rating_n::numeric),
      ('retention_intent', 'Retention intent — would play World 2', 15::numeric,
        case when w.cont_n > 0 then w.cont_yes::numeric / w.cont_n end,
        0.85::numeric, w.cont_n::numeric),
      ('stability', 'Stability — players with no crash', 10::numeric,
        case when w.players_total > 0 then 1 - (w.crash_players::numeric / w.players_total) end,
        1::numeric, w.players_total::numeric)
    ) h(hkey, hlabel, weight, actual, full_marks, hn)
  ),
  health_calc as (
    select is_cur, hkey, hlabel, weight, actual, full_marks, hn,
           (hn >= 3 and actual is not null) as included,
           case when hn >= 3 and actual is not null
                then least(1.0, greatest(0.0, actual / full_marks)) end as ratio
    from health_parts
  ),
  health_tot as (
    select is_cur,
           sum(weight) filter (where included)          as w_used,
           sum(ratio * weight) filter (where included)  as earned
    from health_calc group by is_cur
  ),
  health_val as (
    select is_cur,
           case when coalesce(w_used, 0) > 0 then round(100 * earned / w_used, 1) end as score
    from health_tot
  ),
  health_comp_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'key',         hc.hkey,
      'label',       hc.hlabel,
      'weight',      hc.weight,
      'weight_used', case when hc.included and ht.w_used > 0 then round(100 * hc.weight / ht.w_used, 1) end,
      'actual',      round(hc.actual, 4),
      'full_marks',  hc.full_marks,
      'ratio',       round(hc.ratio, 4),
      'points',      case when hc.included and ht.w_used > 0
                          then round(100 * hc.ratio * hc.weight / ht.w_used, 1) end,
      'n',           hc.hn::int,
      'included',    hc.included,
      'reason',      case when hc.included then null
                          when hc.actual is null then 'no data'
                          else 'n<3' end
    ) order by hc.weight desc, hc.hkey), '[]'::jsonb) as j
    from health_calc hc join health_tot ht on ht.is_cur = hc.is_cur
    where hc.is_cur
  ),
  health_dropped as (
    select coalesce(jsonb_agg(to_jsonb(hkey) order by hkey), '[]'::jsonb) as j
    from health_calc where is_cur and not included
  ),

  -- One VALUES list instead of sixteen hand-written json_build_objects: every KPI is
  -- then guaranteed to have the same seven keys and the same trend rule.
  kpi_long as (
    select w.is_cur, v.kkey, v.kval, v.kn, v.kunit, v.kround, v.knote
    from win2 w
    left join health_val hv on hv.is_cur = w.is_cur
    cross join lateral (values
      ('players_total'::text, w.players_total::numeric, w.players_total::numeric, 'players'::text, 0, null::text),
      ('players_new', w.players_new::numeric, w.players_total::numeric, 'players', 0,
       'New = no return_visit event in the window. The daily chart uses first-ever-seen instead, so the two can differ for a tester whose first visit predates the window.'),
      ('players_returning', w.players_returning::numeric, w.players_total::numeric, 'players', 0, null),
      ('sessions', w.sessions::numeric, w.sessions::numeric, 'sessions', 0,
       'One session per VISIT, not per page: index, play, the game iframe and the survey share one id.'),
      ('completed_runs', w.completed_runs::numeric, w.players_total::numeric, 'players', 0,
       'Distinct players with beta_completed — a once-per-player milestone, never a row count.'),
      ('avg_session_seconds', w.avg_sec, w.sec_n::numeric, 'seconds', 0,
       'Game pages only (game / chart-quest / play). Pooling landing-page views made this read 0.2 min against a real 44s.'),
      ('median_session_seconds', w.med_sec::numeric, w.sec_n::numeric, 'seconds', 0,
       'Game pages only (game / chart-quest / play).'),
      ('avg_rating', w.avg_rating, w.rating_n::numeric, 'rating', 1, null),
      ('survey_completion_pct',
       case when w.completed_runs > 0 then 100.0 * w.survey_players / w.completed_runs end,
       w.completed_runs::numeric, 'pct', 1,
       'survey_submitted ÷ beta_completed, each counted once per player. Raw milestones, NOT the monotonic funnel — monotonic crediting would pin this at 100%.'),
      ('intro_completion_pct',
       case when w.base > 0 then 100.0 * coalesce(w.s_intro, 0) / w.base end,
       coalesce(w.base, 0)::numeric, 'pct', 1,
       'tutorial_completed is fired by introComplete(), which the game calls from bossFinish() when level == 1 — this is the intro CHAIN, which ends after Guardian 1, not the tutorial.'),
      ('boss_completion_pct',
       case when w.base > 0 then 100.0 * coalesce(w.s_boss_won, 0) / w.base end,
       coalesce(w.base, 0)::numeric, 'pct', 1, null),
      ('journal_completion_pct',
       case when w.base > 0 then 100.0 * coalesce(w.s_journal, 0) / w.base end,
       coalesce(w.base, 0)::numeric, 'pct', 1, null),
      ('avg_time_to_boss_seconds', w.avg_boss, w.boss_n::numeric, 'seconds', 0,
       'Measured on the device clock (ts), not on server arrival — the offline retry queue can deliver an event days late.'),
      ('median_time_to_completion_seconds', w.med_completion::numeric, w.comp_n::numeric, 'seconds', 0,
       'One value per player (their first non-null): completion_seconds is re-sent on every later session_end.'),
      ('crash_players', w.crash_players::numeric, w.players_total::numeric, 'players', 0,
       'Players who hit at least one crash. "up" means the number rose — that is bad news here.'),
      ('health_score', hv.score, coalesce(w.base, 0)::numeric, 'score', 1,
       '0-100 composite. See components for the breakdown and dropped for anything with n < 3.')
    ) v(kkey, kval, kn, kunit, kround, knote)
  ),
  kpi_pair as (
    select c.kkey, c.kval, p.kval as pval, c.kn, c.kunit, c.kround, c.knote
    from (select * from kpi_long where is_cur) c
    left join (select * from kpi_long where not is_cur) p on p.kkey = c.kkey
  ),
  kpi_json as (
    select jsonb_object_agg(kkey, jsonb_build_object(
      'value', round(kval, kround),
      'prev',  case when v_has_prev then round(pval, kround) end,
      'delta_pct', case when v_has_prev and kval is not null and pval is not null and pval <> 0
                        then round(100 * (kval - pval) / pval, 1) end,
      -- Flat unless there is a previous window AND at least 5 samples behind the number.
      -- Never render a 100% swing off one player. Compared post-rounding so a 0.004
      -- change cannot flip an arrow.
      'trend', case when not v_has_prev then 'flat'
                    when kval is null or pval is null then 'flat'
                    when coalesce(kn, 0) < 5 then 'flat'
                    when round(kval, kround) > round(pval, kround) then 'up'
                    when round(kval, kround) < round(pval, kround) then 'down'
                    else 'flat' end,
      'n',    coalesce(kn, 0)::int,
      'unit', kunit,
      'note', knote
    )) as j
    from kpi_pair
  ),
  kpis_final as (
    select jsonb_set(
             jsonb_set(k.j, '{health_score,components}', hc.j, true),
             '{health_score,dropped}', hd.j, true) as j
    from kpi_json k, health_comp_json hc, health_dropped hd
  ),

  meta_json as (
    select jsonb_build_object(
      'generated_at',     v_now,
      'source',           'live',
      'window_days',      v_days,
      -- null, not a date, when p_days = 0: there is no lower bound and inventing one
      -- would let the UI print a window that was never applied.
      'window_from',      case when v_cur_from > '-infinity'::timestamptz then to_jsonb(v_cur_from) end,
      'build_filter',     v_build,
      'excluded_players', (select pl_n from excl),
      'excluded_events',  (select ev_n from excl),
      'event_count',      (select count(*) from ev where is_cur),
      'survey_count',     (select count(*) from sv_cur)
    ) as j
  )

  select jsonb_build_object(
    'meta',       (select j from meta_json),
    'kpis',       (select j from kpis_final),
    'funnel',     (select j from funnel_json),
    'timeseries', (select j from timeseries_json),
    'surveys',    (select j from surveys_json),
    'builds',     (select j from builds_json),
    'crashes',    (select j from crashes_json),
    'tech',       (select j from tech_json)
  )
  into v_out;

  return v_out::json;
end;
$fn$;


-- ── 4 · beta_players(...) — the roster behind the numbers ───────────────────
-- Paginated server-side so this scales to thousands of testers without shipping a row
-- per event to the browser. `total` is the filtered size BEFORE pagination, so the UI
-- can say "showing 50 of 312" honestly.
--
-- Test players are excluded here exactly as they are from beta_model: this list is the
-- drill-down behind the KPIs, and a roster that disagrees with the headline count is a
-- bug report waiting to happen. beta_search() is where you go to find a QA id on purpose.
create or replace function public.beta_players(
  p_days   int  default 7,
  p_build  text default null,
  p_limit  int  default 50,
  p_offset int  default 0,
  p_search text default null,
  p_stage  text default null
) returns json
language plpgsql
stable
security definer
set search_path = public
set timezone = 'UTC'
as $fn$
declare
  v_now    timestamptz := now();
  v_days   int         := greatest(coalesce(p_days, 7), 0);
  v_build  text        := nullif(btrim(coalesce(p_build, '')), '');
  v_from   timestamptz;
  v_limit  int         := least(greatest(coalesce(p_limit, 50), 1), 500);
  v_offset int         := greatest(coalesce(p_offset, 0), 0);
  v_search text        := nullif(btrim(coalesce(p_search, '')), '');
  v_stage  text        := nullif(btrim(lower(coalesce(p_stage, ''))), '');
  v_out    jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  v_from := case when v_days = 0 then '-infinity'::timestamptz
                 else v_now - make_interval(days => v_days) end;
  if v_stage = 'all' then v_stage := null; end if;

  with
  cfg as (
    select array['cert-test%','e2e-%','selftest%','browsertest%','qa-%','dev-%',
                 'verify-%','gate-%','smoke-%','test-%']::text[] as test_prefixes
  ),
  stages as (select * from public.beta_funnel_stages),
  raw as (
    select e.id, e.player_id, e.session_id, e.name, e.ts, e.created_at,
           nullif(btrim(e.device),   '') as device,
           nullif(btrim(e.browser),  '') as browser,
           nullif(btrim(e.os),       '') as os,
           nullif(btrim(e.screen),   '') as screen,
           nullif(btrim(e.viewport), '') as viewport,
           (lower(coalesce(e.player_id, '')) like any (c.test_prefixes)) as is_test,
           nullif(btrim(e.props ->> 'build'), '') as bld,
           e.props ->> 'page'       as pr_page,
           e.props ->> 'exit_stage' as pr_exit_stage,
           case when jsonb_typeof(e.props -> 'seconds') = 'number'
                then (e.props ->> 'seconds')::numeric end as pr_seconds,
           case when jsonb_typeof(e.props -> 'completion_seconds') = 'number'
                then (e.props ->> 'completion_seconds')::numeric end as pr_completion,
           case when jsonb_typeof(e.props -> 'visit') = 'number'
                then (e.props ->> 'visit')::numeric end as pr_visit
    from public.beta_events e cross join cfg c
    where e.created_at >= v_from and e.player_id is not null
  ),
  ev0 as (select * from raw where not is_test),
  attr as (
    select distinct on (player_id) player_id, bld
    from ev0 where bld is not null
    order by player_id, ts asc, id asc
  ),
  cohort as (
    select p.player_id, coalesce(a.bld, '(unknown)') as bld
    from (select distinct player_id from ev0) p
    left join attr a on a.player_id = p.player_id
  ),
  ev as (
    select e.* from ev0 e
    where v_build is null
       or e.player_id in (select player_id from cohort where bld = v_build)
  ),
  pl as (
    select e.player_id,
      min(e.created_at) as first_seen,
      max(e.created_at) as last_seen,
      count(distinct e.session_id) as sessions,
      count(*) filter (where e.name = 'crash') as crashes,
      -- Game pages only, same filter as the session-length KPI, so a player's row adds
      -- up to the headline average instead of quietly including landing-page seconds.
      sum(e.pr_seconds) filter (where e.name = 'session_end'
                                  and coalesce(e.pr_page,'') in ('game','chart-quest','play')) as total_seconds,
      -- The client's own visit counter is the truest "visits": it survives across
      -- documents and across the four page loads that make up one visit.
      max(e.pr_visit) as visits,
      -- Exit point as the GAME computed it, off the once-per-player flags in
      -- localStorage. Its vocabulary is cq-track.js's STAGES, not the funnel keys.
      (array_agg(e.pr_exit_stage order by e.ts desc, e.id desc)
         filter (where e.name = 'session_end' and e.pr_exit_stage is not null))[1] as exit_stage,
      bool_or(e.name = 'first_trade_started')         as has_trade,
      bool_or(e.name = 'first_trade_won')             as has_trade_won,
      bool_or(e.name = 'first_trade_lost')            as has_trade_lost,
      bool_or(e.name = 'boss_started')                as has_boss,
      bool_or(e.name = 'boss_defeated')               as has_boss_won,
      bool_or(e.name = 'journal_unlocked')            as has_j_unlocked,
      bool_or(e.name = 'journal_discovery_started')   as has_j_started,
      bool_or(e.name = 'journal_discovery_completed') as has_j_done,
      bool_or(e.name = 'journal_discovery_skipped')   as has_j_skipped
    from ev e group by e.player_id
  ),
  pl_comp as (
    select distinct on (player_id) player_id, pr_completion as completion_seconds
    from ev where pr_completion is not null and pr_completion > 0
    order by player_id, ts asc, id asc
  ),
  pl_env as (
    select player_id,
      (array_agg(device   order by ts desc, id desc) filter (where device   is not null))[1] as device,
      (array_agg(browser  order by ts desc, id desc) filter (where browser  is not null))[1] as browser,
      (array_agg(os       order by ts desc, id desc) filter (where os       is not null))[1] as os,
      (array_agg(screen   order by ts desc, id desc) filter (where screen   is not null))[1] as screen,
      (array_agg(viewport order by ts desc, id desc) filter (where viewport is not null))[1] as viewport
    from ev group by player_id
  ),
  -- Every build this player was SEEN on, which is not the same as the single build they
  -- were attributed to for cohort maths — a tester who spanned a release shows both.
  pb as (
    select player_id,
           coalesce(array_agg(distinct bld order by bld) filter (where bld is not null), '{}'::text[]) as builds
    from ev group by player_id
  ),
  sr as (
    select distinct on (s.player_id) s.player_id, s.q1_rating, s.q4_continue
    from public.beta_surveys s cross join cfg c
    where s.created_at >= v_from
      and s.player_id is not null
      and not (lower(s.player_id) like any (c.test_prefixes))
    order by s.player_id, s.created_at desc, s.id desc
  ),
  furthest as (
    select e.player_id, max(s.idx) as idx
    from ev e join stages s on s.ev_name = e.name
    group by e.player_id
  ),
  roster as (
    select p.player_id, p.first_seen, p.last_seen, p.sessions, p.total_seconds, p.visits,
           p.crashes, p.exit_stage,
           pe.device, pe.browser, pe.os, pe.screen, pe.viewport,
           coalesce(pb.builds, '{}'::text[]) as builds,
           -- Floor of 'landing': a player with events but no session_start (the mint was
           -- lost, or their session began before the window) still demonstrably loaded
           -- the page. The funnel itself counts landing strictly from session_start.
           st.stage_key, st.stage_label,
           case when p.has_trade_won then 'won'
                when p.has_trade_lost then 'lost'
                when p.has_trade then 'started' end as trade_result,
           case when p.has_boss_won then 'defeated'
                when p.has_boss then 'started' end as boss_result,
           -- Strongest outcome wins: a player who started and then skipped is a SKIP.
           case when p.has_j_done then 'completed'
                when p.has_j_skipped then 'skipped'
                when p.has_j_started then 'started'
                when p.has_j_unlocked then 'unlocked' end as journal_result,
           sr.q1_rating as survey_rating, sr.q4_continue as survey_continue,
           pc.completion_seconds
    from pl p
    left join pl_env   pe on pe.player_id = p.player_id
    left join pb          on pb.player_id = p.player_id
    left join pl_comp  pc on pc.player_id = p.player_id
    left join sr          on sr.player_id = p.player_id
    left join furthest f  on f.player_id  = p.player_id
    left join stages   st on st.idx = coalesce(f.idx, 1)
  ),
  -- position(), not ILIKE: a founder searching for "100%" or "_" should get a substring
  -- match, not a wildcard, and indexOf is what the JS engine will do.
  filtered as (
    select r.* from roster r
    where (v_stage is null or r.stage_key = v_stage)
      and (v_search is null
           or position(lower(v_search) in lower(r.player_id)) > 0
           or position(lower(v_search) in lower(coalesce(r.device, ''))) > 0
           or position(lower(v_search) in lower(coalesce(r.browser, ''))) > 0
           or position(lower(v_search) in lower(coalesce(r.os, ''))) > 0
           or position(lower(v_search) in lower(coalesce(r.exit_stage, ''))) > 0
           or exists (select 1 from unnest(r.builds) b
                      where position(lower(v_search) in lower(b)) > 0))
  ),
  paged as (
    select * from filtered
    order by last_seen desc, player_id asc     -- player_id breaks ties deterministically
    limit v_limit offset v_offset
  )
  select jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id',          f.player_id,
        'first_seen',         f.first_seen,
        'last_seen',          f.last_seen,
        'sessions',           f.sessions,
        'total_seconds',      round(f.total_seconds),
        'visits',             f.visits::int,
        'device',             f.device,
        'browser',            f.browser,
        'os',                 f.os,
        'screen',             f.screen,
        'viewport',           f.viewport,
        'builds',             to_jsonb(f.builds),
        'furthest_stage',     f.stage_key,
        'furthest_label',     f.stage_label,
        'exit_stage',         f.exit_stage,
        'trade_result',       f.trade_result,
        'boss_result',        f.boss_result,
        'journal_result',     f.journal_result,
        'survey_rating',      f.survey_rating,
        'survey_continue',    f.survey_continue,
        'completion_seconds', round(f.completion_seconds),
        'crashes',            f.crashes,
        'is_test',            false
      ) order by f.last_seen desc, f.player_id asc)
      from paged f), '[]'::jsonb),
    'total', (select count(*) from filtered)
  )
  into v_out;

  return v_out::json;
end;
$fn$;


-- ── 5 · beta_player_detail(p_player_id) — one tester's whole story ──────────
-- Deliberately NOT windowed and NOT exclusion-filtered. This is a drill-down, not a
-- metric: truncating a timeline at the 7-day boundary would hide the visit that explains
-- the exit, and refusing to show a QA id would just look like the pipe was broken.
--
-- Ordered and offset by ts, never created_at. cq-track.js persists unconfirmed rows to
-- localStorage and drains them on the next boot, so ordering by arrival time interleaves
-- last Tuesday's crash into today's session and the story stops making sense.
create or replace function public.beta_player_detail(p_player_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
set timezone = 'UTC'
as $fn$
declare
  v_pid text := nullif(btrim(coalesce(p_player_id, '')), '');
  v_out jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  with
  -- Capped: one broken frame can fire onerror in a loop. cq-track.js caps crashes at 3
  -- per session, but the cap is client-side and a client is exactly what we do not trust.
  evs as (
    select e.id, e.ts, e.name, e.props
    from public.beta_events e
    where e.player_id = v_pid
    order by e.ts asc, e.id asc
    limit 2000
  ),
  z as (select min(ts) as t0 from evs)
  select jsonb_build_object(
    'player_id', v_pid,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'ts',             e.ts,
        'offset_seconds', round(extract(epoch from (e.ts - z.t0))::numeric),
        'name',           e.name,
        'label',          coalesce(l.ev_label, e.name),
        'props',          e.props,
        'kind',           coalesce(l.ev_kind, 'milestone')
      ) order by e.ts asc, e.id asc)
      from evs e cross join z
      left join public.beta_event_labels l on l.ev_name = e.name), '[]'::jsonb),
    'survey', (select to_jsonb(s) from public.beta_surveys s
               where s.player_id = v_pid
               order by s.created_at desc, s.id desc limit 1)
  )
  into v_out;

  return v_out::json;
end;
$fn$;


-- ── 6 · beta_search(p_q, p_limit) ───────────────────────────────────────────
-- A lookup tool, not a metric: all time, and test ids are RETURNED (flagged is_test) so
-- the founder searching their own CERT-TEST run finds it instead of concluding the
-- pipeline is down. Nothing here feeds a number.
create or replace function public.beta_search(p_q text, p_limit int default 20)
returns json
language plpgsql
stable
security definer
set search_path = public
set timezone = 'UTC'
as $fn$
declare
  v_q     text := nullif(btrim(coalesce(p_q, '')), '');
  v_limit int  := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_out   jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  -- An empty query means "no query", never "return the whole table".
  if v_q is null then
    return jsonb_build_object('players', '[]'::jsonb,
                              'surveys', '[]'::jsonb,
                              'crashes', '[]'::jsonb)::json;
  end if;

  with
  cfg as (
    select array['cert-test%','e2e-%','selftest%','browsertest%','qa-%','dev-%',
                 'verify-%','gate-%','smoke-%','test-%']::text[] as test_prefixes
  ),
  stages as (select * from public.beta_funnel_stages),
  pm as (
    select e.player_id,
           min(e.created_at) as first_seen,
           max(e.created_at) as last_seen,
           count(*)          as events,
           max(s.idx)        as far_idx
    from public.beta_events e
    left join stages s on s.ev_name = e.name
    where e.player_id is not null
      and position(lower(v_q) in lower(e.player_id)) > 0
    group by e.player_id
    order by max(e.created_at) desc
    limit v_limit
  ),
  sm as (
    select s.* from public.beta_surveys s
    where position(lower(v_q) in lower(coalesce(s.player_id, ''))) > 0
       or position(lower(v_q) in lower(coalesce(s.q2_hook, ''))) > 0
       or position(lower(v_q) in lower(coalesce(s.q3_improvement, ''))) > 0
       or position(lower(v_q) in lower(coalesce(s.q5_anything, ''))) > 0
    order by s.created_at desc, s.id desc
    limit v_limit
  ),
  -- Same grouping key as beta_model's crash roll-up (message truncated to 160, split by
  -- build) so a row found here matches a row seen there.
  cm as (
    select left(coalesce(e.props ->> 'message', ''), 160) as message,
           e.props ->> 'kind'  as kind,
           e.props ->> 'where' as crash_where,
           nullif(btrim(e.props ->> 'build'), '') as bld,
           count(*)                    as n,
           count(distinct e.player_id) as players,
           min(e.created_at)           as first_seen,
           max(e.created_at)           as last_seen
    from public.beta_events e
    where e.name = 'crash'
      and (position(lower(v_q) in lower(coalesce(e.props ->> 'message', ''))) > 0
        or position(lower(v_q) in lower(coalesce(e.props ->> 'where', ''))) > 0
        or position(lower(v_q) in lower(coalesce(e.player_id, ''))) > 0)
    group by 1, 2, 3, 4
    order by players desc, n desc, last_seen desc
    limit v_limit
  )
  select jsonb_build_object(
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id',      pm.player_id,
        'first_seen',     pm.first_seen,
        'last_seen',      pm.last_seen,
        'events',         pm.events,
        'furthest_stage', coalesce(st.stage_key, 'landing'),
        'furthest_label', coalesce(st.stage_label, 'Landing page'),
        'is_test',        (lower(pm.player_id) like any (c.test_prefixes))
      ) order by pm.last_seen desc, pm.player_id asc)
      from pm cross join cfg c
      left join stages st on st.idx = pm.far_idx), '[]'::jsonb),
    'surveys', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id',      sm.player_id,
        'created_at',     sm.created_at,
        'q1_rating',      sm.q1_rating,
        'q2_hook',        sm.q2_hook,
        'q3_improvement', sm.q3_improvement,
        'q4_continue',    sm.q4_continue,
        'q5_anything',    sm.q5_anything,
        'seconds_taken',  sm.seconds_taken
      ) order by sm.created_at desc, sm.id desc)
      from sm), '[]'::jsonb),
    'crashes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'message',    cm.message,
        'kind',       cm.kind,
        'where',      cm.crash_where,
        'build',      cm.bld,
        'count',      cm.n,
        'players',    cm.players,
        'first_seen', cm.first_seen,
        'last_seen',  cm.last_seen
      ) order by cm.players desc, cm.n desc, cm.last_seen desc, cm.message)
      from cm), '[]'::jsonb)
  )
  into v_out;

  return v_out::json;
end;
$fn$;


-- ── 7 · THE REVOKES. Not optional, same migration as the CREATE. ────────────
-- Every function above is `security definer` and therefore bypasses RLS on beta_events,
-- whose only SELECT policy is is_admin(). Postgres grants EXECUTE to PUBLIC by default,
-- so from the instant each CREATE ran, all four were callable by anyone holding the
-- publishable key that ships inside the game. The argument types below must match the
-- signatures EXACTLY — a REVOKE naming the wrong types raises no error and does nothing,
-- which is the failure mode that leaves a door open while the migration reads as clean.
revoke execute on function public.beta_model(int, text)                          from public;
revoke execute on function public.beta_model(int, text)                          from anon;
grant  execute on function public.beta_model(int, text)                          to authenticated;

revoke execute on function public.beta_players(int, text, int, int, text, text)  from public;
revoke execute on function public.beta_players(int, text, int, int, text, text)  from anon;
grant  execute on function public.beta_players(int, text, int, int, text, text)  to authenticated;

revoke execute on function public.beta_player_detail(text)                       from public;
revoke execute on function public.beta_player_detail(text)                       from anon;
grant  execute on function public.beta_player_detail(text)                       to authenticated;

revoke execute on function public.beta_search(text, int)                         from public;
revoke execute on function public.beta_search(text, int)                         from anon;
grant  execute on function public.beta_search(text, int)                         to authenticated;

comment on function public.beta_model(int, text) is
  'BetaModel contract §6. Admin-only. p_days=0 is all time; p_build filters to an entry cohort.';
comment on function public.beta_players(int, text, int, int, text, text) is
  'BetaModel contract §6. Admin-only. Server-paginated roster: { rows, total }.';
comment on function public.beta_player_detail(text) is
  'BetaModel contract §6. Admin-only. One player''s full timeline, all time, ordered by device clock (ts).';
comment on function public.beta_search(text, int) is
  'BetaModel contract §6. Admin-only. Lookup across players, survey free text and crash messages; returns test ids flagged.';

-- ── Verify after applying (should be 4 rows, all "false") ───────────────────
--   select p.proname,
--          has_function_privilege('anon', p.oid, 'execute') as anon_can_call
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname like 'beta\_%'
--   order by p.proname;
