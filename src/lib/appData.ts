import { useEffect, useState } from "react";
import {
  addSession as storageAddSession,
  clearSavedState,
  defaultState,
  loadState,
  saveState,
  toggleBlocked as storageToggleBlocked,
  toggleFavorite as storageToggleFavorite,
  updateIntensity as storageUpdateIntensity,
  updateReminder as storageUpdateReminder,
  updateRestSeconds as storageUpdateRestSeconds,
  updateSound as storageUpdateSound,
  type AppState,
  type ReminderSettings,
  type SoundSettings,
  type WorkoutIntensity,
  type WorkoutSession,
} from "./storage";

export type { AppState, ReminderSettings, SoundSettings, WorkoutIntensity, WorkoutSession } from "./storage";

export type DataSyncMode = "local" | "cloud";

const STATE_EVENT = "vardagsstyrka:state";
const LEGACY_STATE_EVENT = "trean:state";

export interface AppDataService {
  mode: DataSyncMode;
  load(): AppState;
  save(state: AppState): void;
  clear(): AppState;
  addWorkoutSession(state: AppState, session: Omit<WorkoutSession, "id" | "date" | "completedAt">): AppState;
  updateReminder(state: AppState, reminder: Partial<ReminderSettings>): AppState;
  updateIntensity(state: AppState, intensity: WorkoutIntensity): AppState;
  updateSound(state: AppState, sound: Partial<SoundSettings>): AppState;
  updateRestSeconds(state: AppState, restSeconds: number): AppState;
  toggleFavorite(state: AppState, exerciseId: string): AppState;
  toggleBlocked(state: AppState, exerciseId: string): AppState;
}

export const localAppDataService: AppDataService = {
  mode: "local",
  load: loadState,
  save: saveState,
  clear: clearSavedState,
  addWorkoutSession: storageAddSession,
  updateReminder: storageUpdateReminder,
  updateIntensity: storageUpdateIntensity,
  updateSound: storageUpdateSound,
  updateRestSeconds: storageUpdateRestSeconds,
  toggleFavorite: storageToggleFavorite,
  toggleBlocked: storageToggleBlocked,
};

let activeService: AppDataService = localAppDataService;

export function getAppDataService(): AppDataService {
  return activeService;
}

export function setAppDataService(service: AppDataService) {
  activeService = service;
}

export function resetAppDataService() {
  activeService = localAppDataService;
}

export function createEmptyAppData(): AppState {
  return defaultState();
}

export function loadAppData(): AppState {
  return activeService.load();
}

export function saveAppData(state: AppState) {
  activeService.save(state);
}

export function clearAppData(): AppState {
  return activeService.clear();
}

export function addWorkoutSession(state: AppState, session: Omit<WorkoutSession, "id" | "date" | "completedAt">): AppState {
  return activeService.addWorkoutSession(state, session);
}

export function updateReminder(state: AppState, reminder: Partial<ReminderSettings>): AppState {
  return activeService.updateReminder(state, reminder);
}

export function updateIntensity(state: AppState, intensity: WorkoutIntensity): AppState {
  return activeService.updateIntensity(state, intensity);
}

export function updateSound(state: AppState, sound: Partial<SoundSettings>): AppState {
  return activeService.updateSound(state, sound);
}

export function updateRestSeconds(state: AppState, restSeconds: number): AppState {
  return activeService.updateRestSeconds(state, restSeconds);
}

export function toggleFavorite(state: AppState, exerciseId: string): AppState {
  return activeService.toggleFavorite(state, exerciseId);
}

export function toggleBlocked(state: AppState, exerciseId: string): AppState {
  return activeService.toggleBlocked(state, exerciseId);
}

export function useAppDataState(): [AppState, (updater: (state: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(createEmptyAppData());

  useEffect(() => {
    setState(loadAppData());
    const handleChange = () => setState(loadAppData());
    window.addEventListener(STATE_EVENT, handleChange);
    window.addEventListener(LEGACY_STATE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(STATE_EVENT, handleChange);
      window.removeEventListener(LEGACY_STATE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return [
    state,
    (updater) => {
      const next = updater(loadAppData());
      saveAppData(next);
      setState(next);
    },
  ];
}
