create or replace function public.is_shared_streak_member(p_streak_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shared_streak_members m
    where m.streak_id = p_streak_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

revoke execute on function public.is_shared_streak_member(uuid) from public;
revoke execute on function public.is_shared_streak_member(uuid) from anon;
grant execute on function public.is_shared_streak_member(uuid) to authenticated;

drop policy if exists "shared_streaks_select_member" on public.shared_streaks;
drop policy if exists "shared_streaks_update_member" on public.shared_streaks;
drop policy if exists "shared_members_select_self_streaks" on public.shared_streak_members;
drop policy if exists "shared_activity_select_member" on public.shared_streak_activity;
drop policy if exists "shared_activity_insert_member" on public.shared_streak_activity;

create policy "shared_streaks_select_member" on public.shared_streaks
for select using (public.is_shared_streak_member(id));

create policy "shared_streaks_update_member" on public.shared_streaks
for update using (public.is_shared_streak_member(id))
with check (public.is_shared_streak_member(id));

create policy "shared_members_select_self_streaks" on public.shared_streak_members
for select using (public.is_shared_streak_member(shared_streak_members.streak_id));

create policy "shared_activity_select_member" on public.shared_streak_activity
for select using (public.is_shared_streak_member(shared_streak_activity.streak_id));

create policy "shared_activity_insert_member" on public.shared_streak_activity
for insert with check (
  auth.uid() = user_id
  and public.is_shared_streak_member(shared_streak_activity.streak_id)
);