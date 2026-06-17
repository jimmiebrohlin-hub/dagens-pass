import { useEffect, useState } from "react";

export type WorkoutMode = "dagens3" | "halvt" | "hundred";
export type ExerciseStatus = "done" | "skipped";
export type HundredFeedback = "latt" | "medel" | "svart";

export interface WorkoutExerciseLog {
  id: string;
  name: string;
  status: ExerciseStatus;
}

export interface WorkoutSession {
  id: string;
  date: string;
  completedAt: string;
  mode: WorkoutMode;
  exercises: WorkoutExerciseLog[];
  feedback?: HundredFeedback;
  totalReps?: number;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string;
}

export interface ExercisePreferences {
  favoriteIds: string[];
  blockedIds: string[];
}

export interface AppState {
  completedDates: string[];
  sessions: WorkoutSession[];
  hundred: Record<string, { reps: number }>;
  reminder: ReminderSettings;
  preferences: ExercisePreferences;
}

const KEY = "vardagsstyrka-app-state-v1";
const LEGACY_KEY = "trean-app-state-v1";
const STATE_EVENT = "vardagsstyrka:state";
const LEGACY_STATE_EVENT = "trean:state";

const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: "08:00" };
const DEFAULT_PREFERENCES: ExercisePreferences = { favoriteIds: [], blockedIds: [] };
const DEFAULT: AppState = {
  completedDates: [],
  sessions: [],
  hundred: {},
  reminder: DEFAULT_REMINDER,
  preferences: DEFAULT_PREFERENCES,
};

function unique(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    const prefs = parsed.preferences ?? {};
    return {
      ...DEFAULT,
      ...parsed,
      completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      hundred: parsed.hundred ?? {},
      reminder: { ...DEFAULT_REMINDER, ...(parsed.reminder ?? {}) },
      preferences: {
        favoriteIds: Array.isArray(prefs.favoriteIds) ? unique(prefs.favoriteIds) : [],
        blockedIds: Array.isArray(prefs.blockedIds) ? unique(prefs.blockedIds) : [],
      },
    };
  } catch {
    return DEFAULT;
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(STATE_EVENT));
}

export function useAppState(): [AppState, (updater: (s: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(DEFAULT);
  useEffect(() => {
    setState(loadState());
    const h = () => setState(loadState());
    window.addEventListener(STATE_EVENT, h);
    window.addEventListener(LEGACY_STATE_EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(STATE_EVENT, h);
      window.removeEventListener(LEGACY_STATE_EVENT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [
    state,
    (updater) => {
      const next = updater(loadState());
      saveState(next);
      setState(next);
    },
  ];
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function markCompleted(s: AppState, date = todayISO()): AppState {
  if (s.completedDates.includes(date)) return s;
  return { ...s, completedDates: [...s.completedDates, date].sort() };
}

export function updateReminder(s: AppState, reminder: Partial<ReminderSettings>): AppState {
  return {
    ...s,
    reminder: { ...s.reminder, ...reminder },
  };
}

export function toggleFavorite(s: AppState, exerciseId: string): AppState {
  const favoriteIds = s.preferences.favoriteIds.includes(exerciseId)
    ? s.preferences.favoriteIds.filter((id) => id !== exerciseId)
    : unique([...s.preferences.favoriteIds, exerciseId]);
  return {
    ...s,
    preferences: {
      favoriteIds,
      blockedIds: s.preferences.blockedIds.filter((id) => id !== exerciseId),
    },
  };
}

export function toggleBlocked(s: AppState, exerciseId: string): AppState {
  const blockedIds = s.preferences.blockedIds.includes(exerciseId)
    ? s.preferences.blockedIds.filter((id) => id !== exerciseId)
    : unique([...s.preferences.blockedIds, exerciseId]);
  return {
    ...s,
    preferences: {
      favoriteIds: s.preferences.favoriteIds.filter((id) => id !== exerciseId),
      blockedIds,
    },
  };
}

export function clearExercisePreference(s: AppState, exerciseId: string): AppState {
  return {
    ...s,
    preferences: {
      favoriteIds: s.preferences.favoriteIds.filter((id) => id !== exerciseId),
      blockedIds: s.preferences.blockedIds.filter((id) => id !== exerciseId),
    },
  };
}

export function addSession(s: AppState, session: Omit<WorkoutSession, "id" | "date" | "completedAt">): AppState {
  const now = new Date();
  const date = todayISO(now);
  const completedAt = now.toISOString();
  const id = `${date}-${session.mode}-${completedAt}`;
  const next = markCompleted(s, date);
  return {
    ...next,
    sessions: [
      ...next.sessions,
      {
        id,
        date,
        completedAt,
        ...session,
      },
    ],
  };
}

export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  if (!set.has(todayISO(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (set.has(todayISO(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function weekCount(dates: string[]): number {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return dates.filter((d) => new Date(d) >= monday).length;
}
