-- Load the current user's shared streak through an RPC to avoid fragile multi-step RLS reads.

create or replace function public.get_my_shared_streak()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak_id uuid;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select m.streak_id
    into v_streak_id
  from public.shared_streak_members m
  where m.user_id = v_user_id
    and m.status = 'active'
  order by m.joined_at desc
  limit 1;

  if v_streak_id is null then
    return null;
  end if;

  select jsonb_build_object(
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
  )
    into v_result
  from public.shared_streaks s
  where s.id = v_streak_id
    and s.status = 'active';

  return v_result;
end;
$$;

grant execute on function public.get_my_shared_streak() to authenticated;
