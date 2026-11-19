-- Profiles for the marketing site dashboard.
-- Applied on project Mindfullfoodfitness (hlpftwnhxblcofiynduo).
-- Existing columns phone / goal / updated_at are kept; plan is staff-only.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  plan text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Copy name from sign-up metadata. Never copy plan — that is staff-managed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, goal)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'goal', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.plan is distinct from old.plan then
    if coalesce(auth.role(), '') in ('authenticated', 'anon') then
      raise exception 'Clients cannot change plan';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_plan on public.profiles;
create trigger protect_profile_plan
  before update on public.profiles
  for each row execute function public.protect_profile_plan();

-- Authenticated users may only change their name fields.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name) on table public.profiles to authenticated;

-- Trigger helpers must not be callable via PostgREST RPC.
revoke execute on function public.protect_profile_plan() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.protect_profile_plan() to postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role, supabase_auth_admin;

insert into public.profiles (id, first_name, last_name, phone, goal)
select
  id,
  nullif(raw_user_meta_data ->> 'first_name', ''),
  nullif(raw_user_meta_data ->> 'last_name', ''),
  nullif(raw_user_meta_data ->> 'phone', ''),
  nullif(raw_user_meta_data ->> 'goal', '')
from auth.users
on conflict (id) do nothing;
