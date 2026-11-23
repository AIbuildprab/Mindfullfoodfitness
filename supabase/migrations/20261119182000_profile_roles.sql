-- Two roles: 'client' (default) and 'personal_trainer'.
-- Applied on project Mindfullfoodfitness (hlpftwnhxblcofiynduo).
--
-- Clients can read their own role but never change it: authenticated users only
-- have UPDATE on first_name / last_name (see lock_down_profile_plan), and
-- handle_new_user() never copies a role from sign-up metadata.

alter table public.profiles
  add column if not exists role text not null default 'client';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('client', 'personal_trainer'));

grant select (role) on table public.profiles to authenticated;

-- To make someone the personal trainer (run as an admin, never from the app):
--   update public.profiles set role = 'personal_trainer'
--   where id = (select id from auth.users where email = 'paul@mindfullfoodfitness.com');
