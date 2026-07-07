-- Reset all existing shared/personal streak data so the app starts fresh with the new model.
-- This removes old group streaks, old invites, ball state and streak activity.
-- Workout/session history is not touched.
-- A new personal "Min streak" is created automatically by ensure_my_personal_streak()
-- the next time each signed-in user opens streak/home or completes Dagens 3.

truncate table public.shared_streak_activity restart identity cascade;
truncate table public.shared_streak_members restart identity cascade;
truncate table public.shared_streaks restart identity cascade;
