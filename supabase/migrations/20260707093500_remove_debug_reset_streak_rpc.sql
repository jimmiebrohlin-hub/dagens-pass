-- Cleanup after streak reset testing.
-- The real data reset has already been run, so the temporary app-triggered debug reset RPC is no longer needed.

drop function if exists public.debug_reset_all_shared_streaks();
