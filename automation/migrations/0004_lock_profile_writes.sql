-- Chart Quest — Lock profile writes to the validated Edge Function
-- Apply to project ymxppzhczvmiuoncuqqu. Additive, non-destructive, idempotent.
--
-- THE PROBLEM THIS CLOSES
-- `profiles` holds the player's authoritative progress: shells, player_level, xp.
-- The game updates these by calling the `update-progress` Edge Function, which
-- runs with the service role and enforces real anti-cheat rules:
--   • absolute ranges (shells 0..10M, level 1..10, xp 0..1M)
--   • per-call deltas (shell gain <= max(1000, 10%), level +1 max, xp +500 max)
--   • a 2-second rate limit.
--
-- BUT until now `profiles` also had a client-facing UPDATE policy
-- ("Users can update own profile", auth.uid() = id). That let ANY signed-in
-- player skip the Edge Function entirely and PATCH /rest/v1/profiles directly
-- with the public anon key + their own JWT — setting shells straight to the
-- CHECK-constraint ceiling (10,000,000) and level to 10 in one request. The
-- careful delta/rate validation was therefore optional and trivially bypassed.
--
-- THE FIX
-- Remove the client INSERT and UPDATE policies on `profiles`. After this:
--   • Row creation  → handled by the `handle_new_user` trigger on auth.users,
--                     which is SECURITY DEFINER and bypasses RLS (unaffected).
--   • Progress writes → ONLY the service-role `update-progress` Edge Function,
--                       which bypasses RLS and enforces the rules above.
--   • Clients keep SELECT on their own row (needed by pullCloudData()).
-- No legitimate client code path writes `profiles` directly, so nothing breaks.
--
-- Supersedes the profiles write policies re-created in 0003_user_data_rls.sql.
-- ============================================================================

-- Redundant: profile rows are created by the handle_new_user trigger (SECURITY
-- DEFINER), never by the client. Drop the client-facing insert path.
drop policy if exists "Users can insert own profile" on public.profiles;

-- The bypass: this let clients write shells/level/xp directly, skipping the
-- Edge Function. Drop it so the service-role function is the ONLY writer.
drop policy if exists "Users can update own profile" on public.profiles;

-- Keep read access to one's own profile (client reads shells/level/xp on load).
-- Re-assert idempotently in case an earlier migration hasn't run.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- NOTE ON THE OTHER USER TABLES (intentionally left client-writable):
--   daily_streak — client upserts directly; capped by CHECK (streak <= 3660).
--   journal_trades / journal_notes — the player's own private notebook, size-
--   capped by CHECK. These are self-only, low-stakes values with no leaderboard
--   / integrity impact, so a direct write path is acceptable. If shells, level,
--   streak, or anything else ever feeds a shared leaderboard or a paid unlock,
--   route its writes through a service-role Edge Function too and drop the
--   corresponding client UPDATE/INSERT policy, exactly as done for profiles here.
