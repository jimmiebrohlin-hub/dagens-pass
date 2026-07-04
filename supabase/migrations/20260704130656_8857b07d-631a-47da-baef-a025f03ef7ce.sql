create or replace function public.create_shared_streak(p_name text default 'Vår streak')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_id uuid := gen_random_uuid();
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    into v_display_name
  from auth.users
  where id = v_user_id;

  insert into public.shared_streaks (
    id, name, current_turn_user_id, streak_count, created_by
  ) values (
    v_streak_id,
    coalesce(nullif(trim(p_name), ''), 'Vår streak'),
    v_user_id,
    0,
    v_user_id
  );

  insert into public.shared_streak_members (
    streak_id, user_id, display_name, member_order, role, status
  ) values (
    v_streak_id, v_user_id, v_display_name, 0, 'owner', 'active'
  );

  insert into public.shared_streak_activity (
    streak_id, user_id, activity_type, to_user_id, streak_count_after
  ) values (
    v_streak_id, v_user_id, 'created', v_user_id, 0
  );

  return v_streak_id;
end;
$$;

grant execute on function public.create_shared_streak(text) to authenticated;