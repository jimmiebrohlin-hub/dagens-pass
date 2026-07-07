-- Buddy streak SLA: the current holder has 26 hours to send the ball back.
-- Personal streak is not affected by this window.
-- Test mode still allows several handoffs in the same day as long as each holder acts while it is their turn.

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
  v_active_member_count integer;
  v_updated jsonb := '[]'::jsonb;
  v_skipped_today integer := 0;
  v_skipped_not_turn integer := 0;
  v_reset_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  perform public.ensure_my_personal_streak();

  for v_streak in
    select s.*
    from public.shared_streaks s
    join public.shared_streak_members m on m.streak_id = s.id
    where m.user_id = v_user_id
      and m.status = 'active'
      and s.status = 'active'
    order by case when s.streak_kind = 'personal' then 0 else 1 end, s.created_at asc
    for update of s
  loop
    select count(*)
      into v_active_member_count
    from public.shared_streak_members sm
    where sm.streak_id = v_streak.id
      and sm.status = 'active';

    if v_streak.streak_kind <> 'personal' and v_active_member_count < 2 then
      v_skipped_not_turn := v_skipped_not_turn + 1;
      continue;
    end if;

    if v_streak.streak_kind <> 'personal' and v_streak.current_turn_user_id is distinct from v_user_id then
      v_skipped_not_turn := v_skipped_not_turn + 1;
      continue;
    end if;

    if v_streak.streak_kind = 'personal' then
      v_next_user_id := v_user_id;
      v_new_count := v_streak.streak_count + 1;
    else
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

      if v_streak.last_completed_at is not null and now() > v_streak.last_completed_at + interval '26 hours' then
        v_new_count := 1;
        v_reset_count := v_reset_count + 1;
      else
        v_new_count := v_streak.streak_count + 1;
      end if;
    end if;

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
      'to_user_id', v_next_user_id,
      'streak_kind', v_streak.streak_kind,
      'reset_by_timeout', v_streak.streak_kind <> 'personal' and v_streak.last_completed_at is not null and now() > v_streak.last_completed_at + interval '26 hours'
    ));
  end loop;

  return jsonb_build_object(
    'updated', v_updated,
    'updated_count', jsonb_array_length(v_updated),
    'skipped_today', v_skipped_today,
    'skipped_not_turn', v_skipped_not_turn,
    'reset_count', v_reset_count,
    'buddy_window_hours', 26
  );
end;
$$;

grant execute on function public.complete_shared_daily3_turns() to authenticated;
