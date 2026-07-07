-- Support multiple active streaks per user and one-shot Dagens 3 completion across all streaks where the user has the ball.

create or replace function public.get_my_shared_streaks()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select coalesce(jsonb_agg(streak_json order by joined_at desc), '[]'::jsonb)
    into v_result
  from (
    select
      m.joined_at,
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'status', s.status,
        'current_turn_user_id', s.current_turn_user_id,
        'streak_count', s.streak_count,
        'invite_code', s.invite_code,
        'created_by', s.created_by,
        'last_completed_at', s.last_completed_at,
        'members', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'user_id', sm.user_id,
                'display_name', sm.display_name,
                'member_order', sm.member_order,
                'role', sm.role,
                'status', sm.status
              ) order by sm.member_order asc
            )
            from public.shared_streak_members sm
            where sm.streak_id = s.id
          ),
          '[]'::jsonb
        )
      ) as streak_json
    from public.shared_streak_members m
    join public.shared_streaks s on s.id = m.streak_id
    where m.user_id = v_user_id
      and m.status = 'active'
      and s.status = 'active'
  ) q;

  return v_result;
end;
$$;

grant execute on function public.get_my_shared_streaks() to authenticated;

create or replace function public.get_my_shared_streak()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select item
    into v_result
  from jsonb_array_elements(public.get_my_shared_streaks()) with ordinality as items(item, ord)
  order by ord asc
  limit 1;

  return v_result;
end;
$$;

grant execute on function public.get_my_shared_streak() to authenticated;

create or replace function public.complete_shared_daily3_turns()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak record;
  v_next_user_id uuid;
  v_new_count integer;
  v_updated jsonb := '[]'::jsonb;
  v_skipped_today integer := 0;
  v_skipped_not_turn integer := 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  for v_streak in
    select s.*
    from public.shared_streaks s
    join public.shared_streak_members m on m.streak_id = s.id
    where m.user_id = v_user_id
      and m.status = 'active'
      and s.status = 'active'
    order by s.created_at asc
    for update of s
  loop
    if v_streak.current_turn_user_id is distinct from v_user_id then
      v_skipped_not_turn := v_skipped_not_turn + 1;
      continue;
    end if;

    if v_streak.last_completed_at is not null and v_streak.last_completed_at::date = now()::date then
      v_skipped_today := v_skipped_today + 1;
      continue;
    end if;

    select sm.user_id
      into v_next_user_id
    from public.shared_streak_members sm
    where sm.streak_id = v_streak.id
      and sm.status = 'active'
      and sm.member_order > coalesce((
        select current_member.member_order
        from public.shared_streak_members current_member
        where current_member.streak_id = v_streak.id
          and current_member.user_id = v_user_id
        limit 1
      ), -1)
    order by sm.member_order asc
    limit 1;

    if v_next_user_id is null then
      select sm.user_id
        into v_next_user_id
      from public.shared_streak_members sm
      where sm.streak_id = v_streak.id
        and sm.status = 'active'
      order by sm.member_order asc
      limit 1;
    end if;

    v_new_count := v_streak.streak_count + 1;

    update public.shared_streaks
       set streak_count = v_new_count,
           last_completed_at = now(),
           current_turn_user_id = v_next_user_id,
           updated_at = now()
     where id = v_streak.id;

    insert into public.shared_streak_activity (
      streak_id,
      user_id,
      activity_type,
      from_user_id,
      to_user_id,
      streak_count_after
    ) values (
      v_streak.id,
      v_user_id,
      'daily3_done',
      v_user_id,
      v_next_user_id,
      v_new_count
    );

    v_updated := v_updated || jsonb_build_array(jsonb_build_object(
      'streak_id', v_streak.id,
      'streak_count_after', v_new_count,
      'to_user_id', v_next_user_id
    ));
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'updated_count', jsonb_array_length(v_updated),
    'skipped_today', v_skipped_today,
    'skipped_not_turn', v_skipped_not_turn
  );
end;
$$;

grant execute on function public.complete_shared_daily3_turns() to authenticated;
