-- ============================================================================
-- Chart Quest — Content Production Pipeline schema (Supabase / Postgres)
-- Project ref: ymxppzhczvmiuoncuqqu
-- Implements the database described in automation/architecture.md +
-- content-events/schema.md. Apply with the Supabase SQL editor or the MCP
-- apply_migration tool. Additive and non-destructive (CREATE IF NOT EXISTS).
--
-- Security note: the game/dashboard write & read with the public ANON key, so
-- these policies allow anon INSERT + SELECT. Events contain NO PII (only
-- pseudonymous player_id + gameplay facts), so this is acceptable for an
-- internal content tool. For a stricter posture, route writes through an Edge
-- Function using the service role and drop the anon INSERT policies below.
-- ============================================================================

-- 1. content_events — one row per emitted event (the data contract top of pipe)
create table if not exists public.content_events (
  id                bigint generated always as identity primary key,
  event_id          text unique not null,
  event_type        text not null,
  ts                timestamptz not null default now(),
  player_id         text,
  session_id        text,
  faction           text,
  player_level      int,
  player_rank       text,
  payload           jsonb not null default '{}'::jsonb,
  educational_metadata jsonb not null default '{}'::jsonb,
  content_flags     jsonb not null default '{}'::jsonb,
  significance_score int default 0,
  processed_status  text not null default 'new',  -- new|triaged|rejected|in_production|published
  created_at        timestamptz not null default now()
);
create index if not exists content_events_type_idx        on public.content_events (event_type);
create index if not exists content_events_ts_idx          on public.content_events (ts desc);
create index if not exists content_events_significance_idx on public.content_events (significance_score desc);
create index if not exists content_events_status_idx      on public.content_events (processed_status);
create index if not exists content_events_flags_gin       on public.content_events using gin (content_flags);

-- 2. content_replays — seed/film replay descriptors (reproducible, storage-light)
create table if not exists public.content_replays (
  id          bigint generated always as identity primary key,
  replay_id   text unique not null,
  event_id    text references public.content_events(event_id) on delete set null,
  kind        text,                       -- trade|boss|mini_game|session
  meta        jsonb not null default '{}'::jsonb,
  data        jsonb not null default '{}'::jsonb,   -- candle film / action timeline
  created_at  timestamptz not null default now()
);
create index if not exists content_replays_event_idx on public.content_replays (event_id);
create index if not exists content_replays_kind_idx  on public.content_replays (kind);

-- 3. content_briefs — Content Director output (triage decision per event)
create table if not exists public.content_briefs (
  id          bigint generated always as identity primary key,
  event_id    text references public.content_events(event_id) on delete cascade,
  pillar      text,
  platforms   text[],
  urgency     text,                        -- immediate|this-week|evergreen
  angle       text,
  format      text,
  priority    int default 0,
  status      text not null default 'proposed',
  created_at  timestamptz not null default now()
);
create index if not exists content_briefs_event_idx    on public.content_briefs (event_id);
create index if not exists content_briefs_priority_idx  on public.content_briefs (priority desc);

-- 4. content_assets — pointers to generated media (clips/screenshots/voiceover/render)
create table if not exists public.content_assets (
  id            bigint generated always as identity primary key,
  brief_id      bigint references public.content_briefs(id) on delete set null,
  event_id      text,
  asset_type    text,                      -- clip|screenshot|voiceover|render|metadata
  storage_path  text,
  platform_variant text,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- 5. content_generated — finished drafts / generated content (script/copy/captions)
create table if not exists public.content_generated (
  id          bigint generated always as identity primary key,
  brief_id    bigint references public.content_briefs(id) on delete set null,
  platform    text,
  body        text,
  meta        jsonb not null default '{}'::jsonb,
  status      text not null default 'draft',
  created_at  timestamptz not null default now()
);

-- 6. content_exports — export history (who pulled what package, for which platform)
create table if not exists public.content_exports (
  id          bigint generated always as identity primary key,
  platform    text,
  event_count int,
  filter      jsonb not null default '{}'::jsonb,
  exported_at timestamptz not null default now()
);

-- 7. published_posts — one row per live post
create table if not exists public.published_posts (
  id           bigint generated always as identity primary key,
  asset_id     bigint references public.content_assets(id) on delete set null,
  platform     text,
  post_url     text,
  published_at timestamptz not null default now()
);

-- 8. performance_snapshots — Analytics Agent input/output
create table if not exists public.performance_snapshots (
  id          bigint generated always as identity primary key,
  post_id     bigint references public.published_posts(id) on delete cascade,
  captured_at timestamptz not null default now(),
  metrics     jsonb not null default '{}'::jsonb
);

-- Convenience view: content-worthy special moments
create or replace view public.content_special_events as
  select * from public.content_events
  where (content_flags->>'special')::boolean is true
  order by significance_score desc, ts desc;

-- ---------------------------------------------------------------------------
-- RLS — enable on all tables; allow anon insert + select (no PII in events).
-- ---------------------------------------------------------------------------
alter table public.content_events        enable row level security;
alter table public.content_replays       enable row level security;
alter table public.content_briefs        enable row level security;
alter table public.content_assets        enable row level security;
alter table public.content_generated     enable row level security;
alter table public.content_exports       enable row level security;
alter table public.published_posts       enable row level security;
alter table public.performance_snapshots enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'content_events','content_replays','content_briefs','content_assets',
    'content_generated','content_exports','published_posts','performance_snapshots'
  ] loop
    execute format('drop policy if exists %I_anon_insert on public.%I;', t, t);
    execute format('drop policy if exists %I_anon_select on public.%I;', t, t);
    execute format('create policy %I_anon_insert on public.%I for insert to anon, authenticated with check (true);', t, t);
    execute format('create policy %I_anon_select on public.%I for select to anon, authenticated using (true);', t, t);
  end loop;
end $$;
