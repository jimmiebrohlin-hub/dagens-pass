-- Clarify streak model:
-- 1) Every user has one personal "Min streak".
-- 2) Shared/buddy streaks are between exactly two active members.
-- 3) Completing Dagens 3 updates the personal streak and every buddy streak where the user has the ball.

alter table public.shared_streaks
  add column if not exists streak_kind text not null default 'buddy';

alter table public.shared_streaks
  drop constraint if exists shared_streaks_streak_kind_check;

alter table public.shared_streaks
  add constraint shared_streaks_streak_kind_check check (streak_kind in ('personal', 'buddy'));

-- Earlier test-created personal streaks should become the user's automatic personal streak.
update public.shared_streaks
   set streak_kind = 'personal',
       name = 'Min streak',
       current_turn_user_id = created_by,
       updated_at = now()
 where lower(name) in ('personlig streak', 'egen streak', 'min streak')
   and status = 'active';

create or replace function public.ensure_my_personal_streak()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_id uuid;
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select s.id
    into v_streak_id
  from public.shared_streaks s
  join public.shared_streak_members m on m.streak_id = s.id
  where s.streak_kind = 'personal'
    and s.status = 'active'
    and m.user_id = v_user_id
    and m.status = 'active'
  order by s.created_at asc
  limit 1;

  if v_streak_id is not null then
    update public.shared_streaks
       set name = 'Min streak',
           current_turn_user_id = v_user_id,
           updated_at = now()
     where id = v_streak_id
       and (name <> 'Min streak' or current_turn_user_id is distinct from v_user_id);

    return v_streak_id;
  end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    into v_display_name
  from auth.users
  where id = v_user_id;

  v_streak_id := gen_random_uuid();

  insert into public.shared_streaks (
    id,
    name,
    streak_kind,
    current_turn_user_id,
    streak_count,
    created_by
  ) values (
    v_streak_id,
    'Min streak',
    'personal',
    v_user_id,
    0,
    v_user_id
  );

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
    0,
    'owner',
    'active'
  );

  insert into public.shared_streak_activity (
    streak_id,
    user_id,
    activity_type,
    to_user_id,
    streak_count_after
  ) values (
    v_streak_id,
    v_user_id,
    'created',
    v_user_id,
    0
  );

  return v_streak_id;
end;
$$;

grant execute on function public.ensure_my_personal_streak() to authenticated;

create or replace function public.create_shared_streak(p_name text default 'Streak med någon')
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

  perform public.ensure_my_personal_streak();

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
    into v_display_name
  from auth.users
  where id = v_user_id;

  insert into public.shared_streaks (
    id,
    name,
    streak_kind,
    current_turn_user_id,
    streak_count,
    created_by
  ) values (
    v_streak_id,
    coalesce(nullif(trim(p_name), ''), 'Streak med någon'),
    'buddy',
    v_user_id,
    0,
    v_user_id
  );

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
    0,
    'owner',
    'active'
  );

  insert into public.shared_streak_activity (
    streak_id,
    user_id,
    activity_type,
    to_user_id,
    streak_count_after
  ) values (
    v_streak_id,
    v_user_id,
    'created',
    v_user_id,
    0
  );

  return v_streak_id;
end;
$$;

grant execute on function public.create_shared_streak(text) to authenticated;

create or replace function public.join_shared_streak_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_id uuid;
  v_streak_kind text;
  v_member_count integer;
  v_display_name text;
  v_next_order integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  perform public.ensure_my_personal_streak();

  select id, streak_kind
    into v_streak_id, v_streak_kind
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

  if v_streak_kind = 'personal' then
    raise exception 'personal_streak_cannot_be_joined';
  end if;

  select count(*)
    into v_member_count
  from public.shared_streak_members
  where streak_id = v_streak_id
    and status = 'active';

  if v_member_count >= 2 then
    raise exception 'streak_full';
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

create or replace function public.get_my_shared_streaks()
returns jsonb
language plpgsql
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

  perform public.ensure_my_personal_streak();

  select coalesce(jsonb_agg(streak_json order by sort_kind asc, joined_at desc), '[]'::jsonb)
    into v_result
  from (
    select
      m.joined_at,
      case when s.streak_kind = 'personal' then 0 else 1 end as sort_kind,
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'streak_kind', s.streak_kind,
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
    if v_streak.streak_kind <> 'personal' and v_streak.current_turn_user_id is distinct from v_user_id then
      v_skipped_not_turn := v_skipped_not_turn + 1;
      continue;
    end if;

    if v_streak.streak_kind = 'personal' then
      v_next_user_id := v_user_id;
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
      'to_user_id', v_next_user_id,
      'streak_kind', v_streak.streak_kind
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
