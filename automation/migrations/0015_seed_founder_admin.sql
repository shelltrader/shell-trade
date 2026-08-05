-- Chart Quest — seed the founder as an admin, so live mode works.
-- ============================================================================
-- Run this AFTER the Supabase account exists. It is idempotent and safe to re-run.
--
-- WHY A MIGRATION AND NOT A ONE-LINER
-- public.admins.user_id is a FK to auth.users(id), so the row cannot exist before the account
-- does. Hard-coding a uuid is how migration 0008 seeded 042d173b-…, and that account is now
-- gone — the row went with it and left is_admin() returning false for everybody, which is
-- exactly the state this fixes. Looking the id up BY EMAIL means the seed cannot rot the same
-- way: re-running it after any account change re-points at whoever holds that address.
--
-- WHAT IT UNLOCKS
-- is_admin() currently returns false for every caller, so:
--   • the four beta_* RPCs raise 42501 Forbidden for everyone (live mode is dead)
--   • dashboard.html's sign-in gate cannot be passed at all
-- Both start working the moment this row exists. Nothing else is needed.
-- ============================================================================
do $seed$
declare
  v_email text := 'habitsimulator@gmail.com';   -- change if the founder used another address
  v_id    uuid;
  v_n     int;
begin
  select id into v_id from auth.users where lower(email) = lower(v_email);

  if v_id is null then
    select count(*) into v_n from auth.users;
    if v_n = 0 then
      raise exception
        'No Supabase account exists yet. Create one first: Dashboard -> Authentication -> Users -> Add user (tick "Auto Confirm User"), then re-run this.';
    else
      raise exception
        'No account with email %. Existing addresses: %. Edit v_email above and re-run.',
        v_email, (select string_agg(email, ', ') from auth.users);
    end if;
  end if;

  insert into public.admins (user_id) values (v_id)
  on conflict (user_id) do nothing;

  raise notice 'admin seeded: % (%)', v_email, v_id;
end
$seed$;

-- Verify (expect one row, and is_admin() true once signed in AS that user):
--   select u.email, a.added_at
--   from public.admins a join auth.users u on u.id = a.user_id;
