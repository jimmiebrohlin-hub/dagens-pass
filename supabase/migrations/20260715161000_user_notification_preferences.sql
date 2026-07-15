-- Per-user notification preferences for Vardagsstyrka.
-- Defaults to enabled so existing users keep receiving streak handoff emails.

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_preferences enable row level security;

drop policy if exists user_notification_preferences_select_self on public.user_notification_preferences;
create policy user_notification_preferences_select_self
  on public.user_notification_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_notification_preferences_insert_self on public.user_notification_preferences;
create policy user_notification_preferences_insert_self
  on public.user_notification_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_notification_preferences_update_self on public.user_notification_preferences;
create policy user_notification_preferences_update_self
  on public.user_notification_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
