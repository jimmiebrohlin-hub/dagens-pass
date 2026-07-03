import {
  addSession,
  clearSavedState,
  defaultState,
  loadState,
  saveState,
  toggleBlocked,
  toggleFavorite,
  updateIntensity,
  updateReminder,
  updateRestSeconds,
  updateSound,
  type AppState,
  type ReminderSettings,
  type SoundSettings,
  type WorkoutIntensity,
  type WorkoutSession,
} from "./storage";

export type DataSyncMode = "local" | "cloud";

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
  addWorkoutSession: addSession,
  updateReminder,
  updateIntensity,
  updateSound,
  updateRestSeconds,
  toggleFavorite,
  toggleBlocked,
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
