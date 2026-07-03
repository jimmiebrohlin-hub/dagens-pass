import { defaultState, loadState, saveState, type AppState, type WorkoutSession } from "./storage";
import { getCurrentUser, supabase } from "./supabaseClient";

function challengePlan(baseReps: number): [number, number, number] {
  return [baseReps, Math.min(34, baseReps + 4), Math.max(4, baseReps - 2)];
}

function sessionToRow(userId: string, session: WorkoutSession) {
  return {
    user_id: userId,
    local_id: session.id,
    workout_date: session.date,
    completed_at: session.completedAt,
    mode: session.mode,
    exercises: session.exercises,
    feedback: session.feedback ?? null,
    total_reps: session.totalReps ?? null,
  };
}

function rowToSession(row: any): WorkoutSession {
  return {
    id: row.local_id ?? row.id,
    date: row.workout_date,
    completedAt: row.completed_at,
    mode: row.mode,
    exercises: Array.isArray(row.exercises) ? row.exercises : [],
    feedback: row.feedback ?? undefined,
    totalReps: row.total_reps ?? undefined,
  };
}

export async function uploadLocalDataToCloud() {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const state = loadState();

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    intensity: state.intensity,
    rest_seconds: state.restSeconds,
    sound_enabled: state.sound.enabled,
    vibration_enabled: state.sound.vibration,
    reminder_enabled: state.reminder.enabled,
    reminder_time: state.reminder.time,
    updated_at: new Date().toISOString(),
  });
  if (settingsError) throw settingsError;

  const { error: preferencesError } = await supabase.from("exercise_preferences").upsert({
    user_id: user.id,
    favorite_ids: state.preferences.favoriteIds,
    blocked_ids: state.preferences.blockedIds,
    updated_at: new Date().toISOString(),
  });
  if (preferencesError) throw preferencesError;

  const challengeRows = Object.entries(state.hundred).map(([exerciseId, value]) => ({
    user_id: user.id,
    exercise_id: exerciseId,
    base_reps: value.reps,
    updated_at: new Date().toISOString(),
  }));
  if (challengeRows.length > 0) {
    const { error } = await supabase.from("challenge_progress").upsert(challengeRows);
    if (error) throw error;
  }

  const { error: deleteSessionsError } = await supabase.from("workout_sessions").delete().eq("user_id", user.id);
  if (deleteSessionsError) throw deleteSessionsError;

  if (state.sessions.length > 0) {
    const { error } = await supabase
      .from("workout_sessions")
      .insert(state.sessions.map((session) => sessionToRow(user.id, session)) as any);
    if (error) throw error;
  }

  return {
    sessions: state.sessions.length,
    challenges: challengeRows.length,
  };
}

export async function downloadCloudDataToLocal(): Promise<AppState> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const [settingsResult, preferencesResult, challengeResult, sessionsResult] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("exercise_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("challenge_progress").select("*").eq("user_id", user.id),
    supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("completed_at", { ascending: true }),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (preferencesResult.error) throw preferencesResult.error;
  if (challengeResult.error) throw challengeResult.error;
  if (sessionsResult.error) throw sessionsResult.error;

  const base = defaultState();
  const settings = settingsResult.data;
  const preferences = preferencesResult.data;
  const sessions = (sessionsResult.data ?? []).map(rowToSession);
  const hundred = Object.fromEntries((challengeResult.data ?? []).map((row: any) => [row.exercise_id, { reps: row.base_reps }])) as AppState["hundred"];
  const completedDates = Array.from(new Set(sessions.map((session) => session.date))).sort();

  const next: AppState = {
    ...base,
    completedDates,
    sessions,
    hundred,
    reminder: {
      enabled: settings?.reminder_enabled ?? base.reminder.enabled,
      time: settings?.reminder_time ?? base.reminder.time,
    },
    preferences: {
      favoriteIds: preferences?.favorite_ids ?? base.preferences.favoriteIds,
      blockedIds: preferences?.blocked_ids ?? base.preferences.blockedIds,
    },
    intensity: (settings?.intensity as typeof base.intensity) ?? base.intensity,
    sound: {
      enabled: settings?.sound_enabled ?? base.sound.enabled,
      vibration: settings?.vibration_enabled ?? base.sound.vibration,
    },
    restSeconds: settings?.rest_seconds ?? base.restSeconds,
  };

  saveState(next);
  return next;
}

export function previewChallengeTotal(baseReps: number) {
  return challengePlan(baseReps).reduce((sum, reps) => sum + reps, 0);
}
