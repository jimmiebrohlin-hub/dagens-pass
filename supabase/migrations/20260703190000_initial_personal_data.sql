-- Vardagsstyrka personal data schema
-- Run this in Supabase before enabling cloud sync.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  intensity text not null default 'normal',
  rest_seconds integer not null default 45,
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  reminder_enabled boolean not null default false,
  reminder_time text not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_ids text[] not null default '{}',
  blocked_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  base_reps integer not null default 8,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text,
  workout_date date not null,
  completed_at timestamptz not null,
  mode text not null,
  exercises jsonb not null default '[]'::jsonb,
  feedback text,
  total_reps integer,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_completed_idx on public.workout_sessions(user_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.exercise_preferences enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.workout_sessions enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "preferences_select_own" on public.exercise_preferences for select using (auth.uid() = user_id);
create policy "preferences_insert_own" on public.exercise_preferences for insert with check (auth.uid() = user_id);
create policy "preferences_update_own" on public.exercise_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "challenge_select_own" on public.challenge_progress for select using (auth.uid() = user_id);
create policy "challenge_insert_own" on public.challenge_progress for insert with check (auth.uid() = user_id);
create policy "challenge_update_own" on public.challenge_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_select_own" on public.workout_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.workout_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.workout_sessions for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.exercise_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
