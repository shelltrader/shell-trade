-- Chart Quest — supporting objects for the ingest gateway + admin dashboard
-- Apply to project ymxppzhczvmiuoncuqqu. Additive & safe to apply immediately:
-- it creates infrastructure but changes NO existing access. The switchover that
-- actually locks things down is 0009 (apply only AFTER the new client + new
-- dashboard.html are deployed).
-- ============================================================================

-- 1. Per-IP rate-limit counter for the `ingest` Edge Function -----------------
create table if not exists public.ingest_throttle (
  ip           text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (ip, window_start)
);
alter table public.ingest_throttle enable row level security;
-- No policies → only the service role (Edge Function) can touch it.

-- Atomic increment: upsert the (ip, window) bucket, +1, return the new count.
create or replace function public.bump_ingest_throttle(p_ip text, p_window timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare c integer;
begin
  insert into public.ingest_throttle (ip, window_start, count)
  values (p_ip, p_window, 1)
  on conflict (ip, window_start)
  do update set count = public.ingest_throttle.count + 1
  returning count into c;
  return c;
end;
$$;
-- Ops-only: not callable via the public API.
revoke execute on function public.bump_ingest_throttle(text, timestamptz) from public;
grant  execute on function public.bump_ingest_throttle(text, timestamptz) to service_role;

-- 2. Admin allowlist for the dashboard ----------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Admins may read the allowlist (to self-check); no client writes.
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Seed the current sole account as admin. VERIFY this is the founder's account
-- (habitsimulator@gmail.com) before relying on it; add/remove rows as needed.
insert into public.admins (user_id)
values ('042d173b-badd-47c1-9816-63cab103e5e5')
on conflict (user_id) do nothing;

-- Helper used by the gated RPCs / policies in 0009.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
