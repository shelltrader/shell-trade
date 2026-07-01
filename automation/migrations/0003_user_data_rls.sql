-- Chart Quest — Per-user data RLS (profiles, journal, streak)
-- Apply to project ymxppzhczvmiuoncuqqu. Additive, non-destructive, idempotent.
--
-- WHY THIS FILE EXISTS
-- These four tables hold a signed-in player's PRIVATE data. Their Row Level
-- Security policies were created directly in the Supabase dashboard and were
-- never committed to the repo — so a code review could not verify that one
-- user cannot read another user's journal. This migration captures the exact
-- policies that are live in production so they are:
--   1. auditable in version control,
--   2. reproducible on a fresh project / branch database,
--   3. protected against silent drift (a re-apply reconciles to this state).
--
-- SECURITY MODEL
-- The game talks to Supabase with the PUBLIC anon key. The ONLY thing that
-- keeps user A from reading user B's rows is RLS. Every policy below is gated
-- on `auth.uid()` — the id baked into the caller's signed JWT, which the client
-- cannot forge. Anonymous callers (auth.uid() IS NULL) match nothing here.
--
-- Ownership columns: profiles.id, daily_streak.id, journal_*.user_id — each is
-- a FK to auth.users(id).
-- ============================================================================

-- Belt-and-suspenders: RLS must be ON. (Already enabled in prod; harmless to repeat.)
alter table public.profiles       enable row level security;
alter table public.journal_trades enable row level security;
alter table public.journal_notes  enable row level security;
alter table public.daily_streak   enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── journal_trades ───────────────────────────────────────────────────────────
-- Single ALL policy: USING gates read/update/delete, WITH CHECK gates the row a
-- write produces. Both pinned to the owner so a user can neither read nor plant
-- rows under another user_id.
drop policy if exists "Users can manage own trades" on public.journal_trades;
create policy "Users can manage own trades"
  on public.journal_trades for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── journal_notes ────────────────────────────────────────────────────────────
drop policy if exists "Users can manage own notes" on public.journal_notes;
create policy "Users can manage own notes"
  on public.journal_notes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── daily_streak ─────────────────────────────────────────────────────────────
drop policy if exists "Users can view own streak"   on public.daily_streak;
drop policy if exists "Users can insert own streak" on public.daily_streak;
drop policy if exists "Users can update own streak" on public.daily_streak;

create policy "Users can view own streak"
  on public.daily_streak for select to authenticated
  using (auth.uid() = id);
create policy "Users can insert own streak"
  on public.daily_streak for insert to authenticated
  with check (auth.uid() = id);
create policy "Users can update own streak"
  on public.daily_streak for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- NOTE: no DELETE policy on any table above → deletes are denied by default for
-- API callers (only the service role can delete). This is intentional.
