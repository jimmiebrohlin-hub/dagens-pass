-- Join a shared streak by invite code without exposing all streak rows.
-- Needed because shared_streaks RLS only lets existing members read streaks.

create or replace function public.join_shared_streak_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_id uuid;
  v_display_name text;
  v_next_order integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select id into v_streak_id
  from public.shared_streaks
  where invite_code = upper(trim(p_invite_code))
    and status = 'active'
  limit 1;

  if v_streak_id is null then
    raise exception 'invite_not_found';
  end if;

  if exists (
    select 1 from public.shared_streak_members
    where streak_id = v_streak_id and user_id = v_user_id and status = 'active'
  ) then
    return v_streak_id;
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    into v_display_name
  from auth.users
  where id = v_user_id;

  select coalesce(max(member_order), -1) + 1 into v_next_order
  from public.shared_streak_members
  where streak_id = v_streak_id;

  insert into public.shared_streak_members (
    streak_id,
    user_id,
    display_name,
    member_order,
    role,
    status
  ) values (
    v_streak_id,
    v_user_id,
    v_display_name,
    v_next_order,
    'member',
    'active'
  );

  insert into public.shared_streak_activity (
    streak_id,
    user_id,
    activity_type,
    to_user_id
  ) values (
    v_streak_id,
    v_user_id,
    'joined',
    v_user_id
  );

  return v_streak_id;
end;
$$;

grant execute on function public.join_shared_streak_by_code(text) to authenticated;
