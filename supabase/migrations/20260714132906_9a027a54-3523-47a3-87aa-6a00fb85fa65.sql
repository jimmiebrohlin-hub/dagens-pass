create table if not exists public.streak_turn_email_notifications (
  id uuid primary key default gen_random_uuid(),
  streak_id uuid not null references public.shared_streaks(id) on delete cascade,
  streak_count_after integer not null,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint streak_turn_email_notifications_unique unique (streak_id, streak_count_after, to_user_id)
);

grant all on public.streak_turn_email_notifications to service_role;

alter table public.streak_turn_email_notifications enable row level security;

comment on table public.streak_turn_email_notifications is
  'Audit and deduplication for email notifications when a buddy streak ball changes owner.';