-- Temporary test helper: let a signed-in user trigger a full shared-streak reset from the app.
-- This only touches streak tables. It does not touch workout history, local/cloud sessions,
-- account data, settings or 100 challenge data.
-- Remove this helper when streak testing is done.

create or replace function public.debug_reset_all_shared_streaks()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_count integer;
  v_member_count integer;
  v_activity_count integer;
  v_personal_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select count(*) into v_streak_count from public.shared_streaks;
  select count(*) into v_member_count from public.shared_streak_members;
  select count(*) into v_activity_count from public.shared_streak_activity;

  truncate table public.shared_streak_activity restart identity cascade;
  truncate table public.shared_streak_members restart identity cascade;
  truncate table public.shared_streaks restart identity cascade;

  v_personal_id := public.ensure_my_personal_streak();

  return jsonb_build_object(
    'reset', true,
    'deleted_streaks', v_streak_count,
    'deleted_members', v_member_count,
    'deleted_activity', v_activity_count,
    'personal_streak_id', v_personal_id
  );
end;
$$;

grant execute on function public.debug_reset_all_shared_streaks() to authenticated;
