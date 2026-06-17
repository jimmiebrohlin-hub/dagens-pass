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

export interface AppState {
  completedDates: string[];
  sessions: WorkoutSession[];
  hundred: Record<string, { reps: number }>;
  reminder: ReminderSettings;
}

const KEY = "vardagsstyrka-app-state-v1";
const LEGACY_KEY = "trean-app-state-v1";
const STATE_EVENT = "vardagsstyrka:state";
const LEGACY_STATE_EVENT = "trean:state";

const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: "08:00" };
const DEFAULT: AppState = {
  completedDates: [],
  sessions: [],
  hundred: {},
  reminder: DEFAULT_REMINDER,
};

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      hundred: parsed.hundred ?? {},
      reminder: { ...DEFAULT_REMINDER, ...(parsed.reminder ?? {}) },
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
