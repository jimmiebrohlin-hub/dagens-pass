import { useEffect, useState } from "react";

export interface AppState {
  completedDates: string[]; // ISO date strings yyyy-mm-dd
  hundred: Record<string, { reps: number }>; // per exercise current reps per set
}

const KEY = "trean-app-state-v1";

const DEFAULT: AppState = { completedDates: [], hundred: {} };

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function saveState(s: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("trean:state"));
}

export function useAppState(): [AppState, (updater: (s: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(DEFAULT);
  useEffect(() => {
    setState(loadState());
    const h = () => setState(loadState());
    window.addEventListener("trean:state", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("trean:state", h);
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

export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  // If today not done, streak starts from yesterday if done
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
  const day = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return dates.filter((d) => new Date(d) >= monday).length;
}