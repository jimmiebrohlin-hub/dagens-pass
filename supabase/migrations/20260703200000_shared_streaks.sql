-- Shared streak / turn-based buddy challenge schema.
-- MVP idea: one active shared streak, one user has the ball, completing Dagens 3 sends the ball to the next member.

create table if not exists public.shared_streaks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'daily3_turns' check (type in ('daily3_turns')),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  current_turn_user_id uuid references auth.users(id) on delete set null,
  streak_count integer not null default 0,
  last_completed_at timestamptz,
  invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_streak_members (
  streak_id uuid not null references public.shared_streaks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  member_order integer not null default 0,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'left')),
  joined_at timestamptz not null default now(),
  primary key (streak_id, user_id)
);

create table if not exists public.shared_streak_activity (
  id uuid primary key default gen_random_uuid(),
  streak_id uuid not null references public.shared_streaks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null default 'daily3_done' check (activity_type in ('daily3_done', 'turn_passed', 'joined', 'created')),
  workout_session_id uuid references public.workout_sessions(id) on delete set null,
  from_user_id uuid references auth.users(id) on delete set null,
  to_user_id uuid references auth.users(id) on delete set null,
  streak_count_after integer,
  created_at timestamptz not null default now()
);

create index if not exists shared_streak_members_user_idx on public.shared_streak_members(user_id, status);
create index if not exists shared_streak_activity_streak_idx on public.shared_streak_activity(streak_id, created_at desc);

alter table public.shared_streaks enable row level security;
alter table public.shared_streak_members enable row level security;
alter table public.shared_streak_activity enable row level security;

create policy "shared_streaks_select_member" on public.shared_streaks
for select using (
  exists (
    select 1 from public.shared_streak_members m
    where m.streak_id = id and m.user_id = auth.uid() and m.status = 'active'
  )
);

create policy "shared_streaks_insert_creator" on public.shared_streaks
for insert with check (auth.uid() = created_by);

create policy "shared_streaks_update_member" on public.shared_streaks
for update using (
  exists (
    select 1 from public.shared_streak_members m
    where m.streak_id = id and m.user_id = auth.uid() and m.status = 'active'
  )
) with check (
  exists (
    select 1 from public.shared_streak_members m
    where m.streak_id = id and m.user_id = auth.uid() and m.status = 'active'
  )
);

create policy "shared_members_select_self_streaks" on public.shared_streak_members
for select using (
  exists (
    select 1 from public.shared_streak_members own
    where own.streak_id = streak_id and own.user_id = auth.uid() and own.status = 'active'
  )
);

create policy "shared_members_insert_self" on public.shared_streak_members
for insert with check (auth.uid() = user_id);

create policy "shared_members_update_self" on public.shared_streak_members
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "shared_activity_select_member" on public.shared_streak_activity
for select using (
  exists (
    select 1 from public.shared_streak_members m
    where m.streak_id = shared_streak_activity.streak_id and m.user_id = auth.uid() and m.status = 'active'
  )
);

create policy "shared_activity_insert_member" on public.shared_streak_activity
for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.shared_streak_members m
    where m.streak_id = shared_streak_activity.streak_id and m.user_id = auth.uid() and m.status = 'active'
  )
);
