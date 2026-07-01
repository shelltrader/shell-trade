-- Chart Quest — RLS performance: evaluate auth.uid() once per query, not per row
-- Apply to project ymxppzhczvmiuoncuqqu. Idempotent, behaviour-preserving.
--
-- WHY
-- Supabase's performance linter (0003_auth_rls_initplan) flags every per-user
-- policy: a bare `auth.uid()` inside a policy is re-evaluated for EACH row the
-- query touches. Wrapping it as `(select auth.uid())` lets Postgres treat it as
-- a constant and evaluate it ONCE per statement. Same access rules, much less
-- per-row overhead as the journal / streak tables grow. See:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- This only rewrites the policy expressions; who-can-do-what is unchanged.
-- Reflects the post-0004 state: profiles is SELECT-only for clients.
-- ============================================================================

-- ── profiles (SELECT only; writes go through the update-progress Edge Fn) ─────
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- ── journal_trades ────────────────────────────────────────────────────────────
drop policy if exists "Users can manage own trades" on public.journal_trades;
create policy "Users can manage own trades"
  on public.journal_trades for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── journal_notes ─────────────────────────────────────────────────────────────
drop policy if exists "Users can manage own notes" on public.journal_notes;
create policy "Users can manage own notes"
  on public.journal_notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── daily_streak ──────────────────────────────────────────────────────────────
drop policy if exists "Users can view own streak"   on public.daily_streak;
drop policy if exists "Users can insert own streak" on public.daily_streak;
drop policy if exists "Users can update own streak" on public.daily_streak;

create policy "Users can view own streak"
  on public.daily_streak for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can insert own streak"
  on public.daily_streak for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update own streak"
  on public.daily_streak for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
