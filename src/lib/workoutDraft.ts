export type WorkoutCoachPhase = "exercise" | "rest";
export type WorkoutPendingAction = "next-set" | "next-exercise";

export interface WorkoutDraft {
  exerciseIndex: number;
  setNumberIndex: number;
  done: boolean[];
  phase: WorkoutCoachPhase;
  restSeconds: number;
  pendingAction: WorkoutPendingAction | null;
}

interface WorkoutDraftKeyInput {
  date: string;
  mode: string;
  focus: string;
  intensity: string;
  exerciseIds: string[];
}

const STORAGE_PREFIX = "vardagsstyrka-workout-draft-v1";

export function createWorkoutDraftKey(input: WorkoutDraftKeyInput): string {
  return [input.date, input.mode, input.focus, input.intensity, input.exerciseIds.join(".")].join(
    ":",
  );
}

export function loadWorkoutDraft(key: string, exerciseCount: number): WorkoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    return normalizeDraft(JSON.parse(raw), exerciseCount);
  } catch {
    return null;
  }
}

export function saveWorkoutDraft(key: string, draft: WorkoutDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(draft));
  } catch {
    // Träningen ska fortsätta även om webbläsaren blockerar sessionslagring.
  }
}

export function clearWorkoutDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(key));
  } catch {
    // Inget utkast finns att rensa när sessionslagring är blockerad.
  }
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}:${key}`;
}

function normalizeDraft(value: unknown, exerciseCount: number): WorkoutDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<WorkoutDraft>;
  const exerciseIndex = boundedInteger(draft.exerciseIndex, 0, exerciseCount);
  const setNumberIndex = boundedInteger(draft.setNumberIndex, 0, 20);
  const restSeconds = boundedInteger(draft.restSeconds, 0, 90);
  const pendingAction =
    draft.pendingAction === "next-set" || draft.pendingAction === "next-exercise"
      ? draft.pendingAction
      : null;
  const phase = draft.phase === "rest" && pendingAction ? "rest" : "exercise";
  const storedDone = Array.isArray(draft.done) ? draft.done : [];
  const done = Array.from({ length: exerciseCount }, (_, index) => storedDone[index] === true);

  return { exerciseIndex, setNumberIndex, done, phase, restSeconds, pendingAction };
}

function boundedInteger(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return min;
  return Math.max(min, Math.min(max, value));
}
