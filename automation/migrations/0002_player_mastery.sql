-- Chart Quest — Confluence System Phase 2: player mastery (cloud sync, local-first)
-- Apply to project ymxppzhczvmiuoncuqqu. Additive, non-destructive.
create table if not exists public.player_mastery (
  player_id  text not null,
  category   text not null,
  score      int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, category)
);
create index if not exists player_mastery_player_idx on public.player_mastery (player_id);
alter table public.player_mastery enable row level security;
do $$
begin
  drop policy if exists player_mastery_anon_upsert on public.player_mastery;
  drop policy if exists player_mastery_anon_update on public.player_mastery;
  drop policy if exists player_mastery_anon_select on public.player_mastery;
  create policy player_mastery_anon_upsert on public.player_mastery for insert to anon, authenticated with check (true);
  create policy player_mastery_anon_update on public.player_mastery for update to anon, authenticated using (true) with check (true);
  create policy player_mastery_anon_select on public.player_mastery for select to anon, authenticated using (true);
end $$;
