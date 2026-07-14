-- Track one email notification per buddy-streak turn handoff.
-- The table is only used by the notify-streak-turn Edge Function through the service role.

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

alter table public.streak_turn_email_notifications enable row level security;

-- No client policies: reads/writes are intentionally limited to service-role code.
comment on table public.streak_turn_email_notifications is
  'Audit and deduplication for email notifications when a buddy streak ball changes owner.';
