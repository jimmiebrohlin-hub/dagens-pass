revoke execute on function public.create_shared_streak(text) from public;
revoke execute on function public.create_shared_streak(text) from anon;
revoke execute on function public.join_shared_streak_by_code(text) from public;
revoke execute on function public.join_shared_streak_by_code(text) from anon;
grant execute on function public.create_shared_streak(text) to authenticated;
grant execute on function public.join_shared_streak_by_code(text) to authenticated;