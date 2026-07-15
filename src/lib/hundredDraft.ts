import type { ChallengeAttempt } from "./hundredChallenge";

export type HundredDraftPhase = "do" | "rest" | "rate";

export interface HundredDraft {
  activeId: string;
  phase: HundredDraftPhase;
  setIndex: number;
  restSeconds: number;
  attempt: ChallengeAttempt;
}

const STORAGE_KEY = "vardagsstyrka-hundred-draft-v1";

export function loadHundredDraft(): HundredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveHundredDraft(draft: HundredDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Träningen ska fortsätta även om webbläsaren blockerar sessionslagring.
  }
}

export function clearHundredDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Inget utkast finns att rensa när sessionslagring är blockerad.
  }
}

function normalizeDraft(value: unknown): HundredDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<HundredDraft>;
  if (typeof draft.activeId !== "string" || !draft.attempt) return null;
  if (draft.phase !== "do" && draft.phase !== "rest" && draft.phase !== "rate") return null;
  const plan = draft.attempt.plan;
  if (!Array.isArray(plan) || plan.length !== 3 || plan.some((reps) => typeof reps !== "number"))
    return null;
  const baseReps = draft.attempt.baseReps;
  const total = draft.attempt.total;
  if (typeof baseReps !== "number" || typeof total !== "number") return null;

  return {
    activeId: draft.activeId,
    phase: draft.phase,
    setIndex: boundedInteger(draft.setIndex, 0, 2),
    restSeconds: boundedInteger(draft.restSeconds, 0, 90),
    attempt: { baseReps, plan: [plan[0], plan[1], plan[2]], total },
  };
}

function boundedInteger(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return min;
  return Math.max(min, Math.min(max, value));
}
