-- Backend for the client dashboard and coach workspace.
-- Project: Mindfullfoodfitness (hlpftwnhxblcofiynduo).
--
-- Model: one coach (profiles.role = 'personal_trainer') and many clients.
-- Clients only ever see their own rows; the coach sees everything.
-- Every table has RLS on and explicit grants; anon has no access to any of it.

-- ---------------------------------------------------------------- helpers
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'personal_trainer'
  );
$$;
revoke execute on function public.is_coach() from public, anon;
grant execute on function public.is_coach() to authenticated, service_role;

-- Coach can read every profile (clients already read their own).
drop policy if exists "Coach reads all profiles" on public.profiles;
create policy "Coach reads all profiles"
  on public.profiles for select
  using ((select public.is_coach()));

-- ---------------------------------------------------------- client_details
create table if not exists public.client_details (
  client_id uuid primary key references public.profiles (id) on delete cascade,
  client_type text not null default 'online' check (client_type in ('online', 'in_person')),
  phase text not null default 'Foundations',
  status text not null default 'active' check (status in ('active', 'paused', 'pending')),
  start_date date not null default current_date,
  kcal_target int check (kcal_target between 0 and 10000),
  protein_target int check (protein_target between 0 and 1000),
  carbs_target int check (carbs_target between 0 and 1500),
  fat_target int check (fat_target between 0 and 600),
  weight_goal_kg numeric(5, 1),
  notes text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- workouts
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_on date not null,
  name text not null,
  notes text,
  duration_min int,
  exercises jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists workouts_client_day on public.workouts (client_id, scheduled_on);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  logged_on date not null default current_date,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists workout_logs_client_day on public.workout_logs (client_id, logged_on desc);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_min int,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- nutrition
create table if not exists public.nutrition_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  kcal int,
  protein_g int,
  carbs_g int,
  fat_g int,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  slot text not null default 'Meal',
  description text,
  kcal int not null default 0 check (kcal between 0 and 10000),
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fat_g int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists meals_client_day on public.meals (client_id, day desc);

create table if not exists public.client_foods (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  note text,
  kind text not null default 'recommended' check (kind in ('recommended', 'limit')),
  created_at timestamptz not null default now()
);
create index if not exists client_foods_client on public.client_foods (client_id);

-- ------------------------------------------------------- check-ins, habits
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  weight_kg numeric(5, 1) check (weight_kg between 20 and 400),
  steps int check (steps between 0 and 200000),
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, day)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists habits_client on public.habits (client_id);

create table if not exists public.habit_logs (
  habit_id uuid not null references public.habits (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  primary key (habit_id, day)
);
create index if not exists habit_logs_client_day on public.habit_logs (client_id, day desc);

-- ---------------------------------------------------------------- progress
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  waist_cm numeric(5, 1),
  chest_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  arm_cm numeric(5, 1),
  thigh_cm numeric(5, 1),
  created_at timestamptz not null default now(),
  unique (client_id, day)
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  view text not null check (view in ('front', 'side', 'back')),
  path text not null,
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_client on public.progress_photos (client_id, day desc);

-- ---------------------------------------------------------------- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade, -- the thread
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_thread on public.messages (client_id, created_at);

-- ---------------------------------------------------------------- sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null default '1-to-1 session',
  client_id uuid references public.profiles (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'requested', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists sessions_start on public.sessions (starts_at);
create index if not exists sessions_client on public.sessions (client_id);

-- ----------------------------------------------------------------- invites
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index if not exists invites_email on public.invites (lower(email));

-- ------------------------------------------------- new-user hook (extended)
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

  insert into public.client_details (client_id) values (new.id) on conflict do nothing;

  insert into public.habits (client_id, label, sort)
  select new.id, h.label, h.sort
  from (values ('Drink 3L water', 1), ('8,000 steps', 2), ('7+ hours sleep', 3)) as h (label, sort);

  update public.invites
  set status = 'accepted', accepted_at = now()
  where lower(email) = lower(new.email) and status = 'pending';

  return new;
end;
$$;

-- Backfill for users that already exist (the coach gets rows too; harmless).
insert into public.client_details (client_id)
select id from public.profiles where role = 'client'
on conflict do nothing;

insert into public.habits (client_id, label, sort)
select p.id, h.label, h.sort
from public.profiles p
cross join (values ('Drink 3L water', 1), ('8,000 steps', 2), ('7+ hours sleep', 3)) as h (label, sort)
where p.role = 'client'
  and not exists (select 1 from public.habits x where x.client_id = p.id);

-- ------------------------------------------------------------- RPC helpers
-- A client claims an open slot. Done server-side so they never need UPDATE on sessions.
create or replace function public.request_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in'; end if;
  update public.sessions
  set client_id = (select auth.uid()), status = 'requested'
  where id = p_id and status = 'open' and client_id is null and starts_at > now();
  if not found then raise exception 'That slot is no longer available'; end if;
end;
$$;

create or replace function public.cancel_session(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in'; end if;
  update public.sessions
  set client_id = null, status = 'open'
  where id = p_id and client_id = (select auth.uid()) and status in ('requested', 'confirmed') and starts_at > now();
  if not found then raise exception 'Session cannot be cancelled'; end if;
end;
$$;

revoke execute on function public.request_session(uuid), public.cancel_session(uuid) from public, anon;
grant execute on function public.request_session(uuid), public.cancel_session(uuid) to authenticated;

-- ---------------------------------------------------------------- RLS + grants
do $$
declare t text;
begin
  foreach t in array array[
    'client_details', 'workouts', 'workout_logs', 'workout_templates', 'nutrition_templates',
    'meals', 'client_foods', 'checkins', 'habits', 'habit_logs', 'measurements',
    'progress_photos', 'messages', 'sessions', 'invites'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Coach-only tables.
grant select, insert, update, delete on public.workout_templates, public.nutrition_templates, public.invites to authenticated;
create policy "Coach manages workout templates" on public.workout_templates for all
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "Coach manages nutrition templates" on public.nutrition_templates for all
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "Coach manages invites" on public.invites for all
  using ((select public.is_coach())) with check ((select public.is_coach()));

-- Coach writes, client reads own.
grant select, insert, update, delete on public.client_details, public.client_foods to authenticated;
create policy "Client reads own details" on public.client_details for select using ((select auth.uid()) = client_id);
create policy "Coach manages details" on public.client_details for all
  using ((select public.is_coach())) with check ((select public.is_coach()));
create policy "Client reads own foods" on public.client_foods for select using ((select auth.uid()) = client_id);
create policy "Coach manages foods" on public.client_foods for all
  using ((select public.is_coach())) with check ((select public.is_coach()));

-- Workouts: coach plans them, client reads them and may only mark one complete.
grant select, insert, update, delete on public.workouts to authenticated;

create policy "Client reads own workouts" on public.workouts for select using ((select auth.uid()) = client_id);
create policy "Client completes own workouts" on public.workouts for update
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach manages workouts" on public.workouts for all
  using ((select public.is_coach())) with check ((select public.is_coach()));

create or replace function public.limit_client_workout_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_coach()) then
    if (new.client_id, new.scheduled_on, new.name, new.notes, new.duration_min, new.exercises)
       is distinct from (old.client_id, old.scheduled_on, old.name, old.notes, old.duration_min, old.exercises) then
      raise exception 'Clients can only mark a workout complete';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_client_workout_update() from public, anon, authenticated;
drop trigger if exists limit_client_workout_update on public.workouts;
create trigger limit_client_workout_update before update on public.workouts
  for each row execute function public.limit_client_workout_update();

-- Client-owned data; coach can read it.
grant select, insert, update, delete on
  public.meals, public.checkins, public.habits, public.habit_logs, public.measurements, public.progress_photos
  to authenticated;
grant select, insert on public.workout_logs to authenticated;

create policy "Client manages own meals" on public.meals for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach reads meals" on public.meals for select using ((select public.is_coach()));

create policy "Client manages own checkins" on public.checkins for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach reads checkins" on public.checkins for select using ((select public.is_coach()));

create policy "Client manages own habits" on public.habits for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach manages habits" on public.habits for all
  using ((select public.is_coach())) with check ((select public.is_coach()));

create policy "Client manages own habit logs" on public.habit_logs for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach reads habit logs" on public.habit_logs for select using ((select public.is_coach()));

create policy "Client manages own measurements" on public.measurements for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach reads measurements" on public.measurements for select using ((select public.is_coach()));

create policy "Client manages own photos" on public.progress_photos for all
  using ((select auth.uid()) = client_id) with check ((select auth.uid()) = client_id);
create policy "Coach reads photos" on public.progress_photos for select using ((select public.is_coach()));

create policy "Client reads own logs" on public.workout_logs for select using ((select auth.uid()) = client_id);
create policy "Client adds own logs" on public.workout_logs for insert with check ((select auth.uid()) = client_id);
create policy "Coach reads logs" on public.workout_logs for select using ((select public.is_coach()));

-- Messages: a thread per client. sender_id is never client-supplied (column grant + default).
grant select on public.messages to authenticated;
grant insert (client_id, body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
create policy "Read own thread" on public.messages for select
  using ((select auth.uid()) = client_id or (select public.is_coach()));
create policy "Post to own thread" on public.messages for insert
  with check (sender_id = (select auth.uid()) and ((select auth.uid()) = client_id or (select public.is_coach())));
create policy "Mark received messages read" on public.messages for update
  using (sender_id <> (select auth.uid()) and ((select auth.uid()) = client_id or (select public.is_coach())))
  with check (sender_id <> (select auth.uid()));

-- Sessions: clients see open slots and their own bookings; changes go through RPCs.
grant select on public.sessions to authenticated;
grant insert, update, delete on public.sessions to authenticated;
create policy "Client reads open slots and own sessions" on public.sessions for select
  using ((status = 'open' and starts_at > now()) or (select auth.uid()) = client_id);
create policy "Coach manages sessions" on public.sessions for all
  using ((select public.is_coach())) with check ((select public.is_coach()));

-- ------------------------------------------------------------------ storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Client manages own progress photo files" on storage.objects for all to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Coach reads progress photo files" on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (select public.is_coach()));

-- ----------------------------------------------------------------- realtime
alter publication supabase_realtime add table public.messages;
