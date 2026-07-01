import { useEffect, useState } from "react";
import { DEFAULT_INTENSITY, normalizeIntensity, type WorkoutIntensity } from "./intensity";
import { DEFAULT_SOUND, type SoundSettings } from "./sound";

export type { WorkoutIntensity } from "./intensity";
export type { SoundSettings } from "./sound";
export type WorkoutMode = "dagens3" | "halvt" | "hundred";
export type ExerciseStatus = "done" | "skipped";
export type HundredFeedback = "latt" | "medel" | "svart" | "misslyckat";

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
  intensity: WorkoutIntensity;
  sound: SoundSettings;
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
  intensity: DEFAULT_INTENSITY,
  sound: DEFAULT_SOUND,
};

function unique(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function normalizeSound(value: unknown): SoundSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_SOUND };
  const sound = value as Partial<SoundSettings>;
  return {
    enabled: typeof sound.enabled === "boolean" ? sound.enabled : DEFAULT_SOUND.enabled,
    vibration: typeof sound.vibration === "boolean" ? sound.vibration : DEFAULT_SOUND.vibration,
  };
}

export function defaultState(): AppState {
  return {
    completedDates: [],
    sessions: [],
    hundred: {},
    reminder: { ...DEFAULT_REMINDER },
    preferences: { ...DEFAULT_PREFERENCES, favoriteIds: [], blockedIds: [] },
    intensity: DEFAULT_INTENSITY,
    sound: { ...DEFAULT_SOUND },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return defaultState();
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
      intensity: normalizeIntensity(parsed.intensity),
      sound: normalizeSound(parsed.sound),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(STATE_EVENT));
}

export function clearSavedState(): AppState {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new CustomEvent(STATE_EVENT));
  }
  return defaultState();
}

export function createSampleState(): AppState {
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(now.getDate() - days);
    return d;
  };
  const toDate = (d: Date) => todayISO(d);
  const toTime = (d: Date) => d.toISOString();
  const dates = [0, 1, 3, 5].map((days) => toDate(daysAgo(days))).sort();

  return {
    completedDates: dates,
    reminder: { enabled: true, time: "08:00" },
    preferences: { favoriteIds: ["knaboj", "hoftlyft"], blockedIds: [] },
    intensity: DEFAULT_INTENSITY,
    sound: { ...DEFAULT_SOUND },
    hundred: {
      knaboj: { reps: 14 },
      armhavningar: { reps: 9 },
      situps: { reps: 12 },
    },
    sessions: [
      {
        id: `${toDate(daysAgo(5))}-dagens3-sample`,
        date: toDate(daysAgo(5)),
        completedAt: toTime(daysAgo(5)),
        mode: "dagens3",
        exercises: [
          { id: "knaboj", name: "Knäböj", status: "done" },
          { id: "armhavningar", name: "Armhävningar", status: "done" },
          { id: "planka", name: "Planka", status: "done" },
        ],
      },
      {
        id: `${toDate(daysAgo(3))}-hundred-sample`,
        date: toDate(daysAgo(3)),
        completedAt: toTime(daysAgo(3)),
        mode: "hundred",
        exercises: [{ id: "knaboj", name: "Knäböj", status: "done" }],
        feedback: "medel",
        totalReps: 36,
      },
      {
        id: `${toDate(daysAgo(1))}-halvt-sample`,
        date: toDate(daysAgo(1)),
        completedAt: toTime(daysAgo(1)),
        mode: "halvt",
        exercises: [
          { id: "utfall", name: "Utfall", status: "done" },
          { id: "bankdips", name: "Bänkdips", status: "done" },
          { id: "rygglyft", name: "Rygglyft", status: "done" },
          { id: "hoftlyft", name: "Höftlyft", status: "skipped" },
          { id: "benlyft", name: "Benlyft", status: "done" },
        ],
      },
      {
        id: `${toDate(daysAgo(0))}-dagens3-sample`,
        date: toDate(daysAgo(0)),
        completedAt: toTime(daysAgo(0)),
        mode: "dagens3",
        exercises: [
          { id: "hoftlyft", name: "Höftlyft", status: "done" },
          { id: "bankdips", name: "Bänkdips", status: "done" },
          { id: "situps", name: "Sit-ups", status: "done" },
        ],
      },
    ],
  };
}

export function useAppState(): [AppState, (updater: (s: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(defaultState());
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

export function updateIntensity(s: AppState, intensity: WorkoutIntensity): AppState {
  return {
    ...s,
    intensity,
  };
}

export function updateSound(s: AppState, sound: Partial<SoundSettings>): AppState {
  return {
    ...s,
    sound: { ...s.sound, ...sound },
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
