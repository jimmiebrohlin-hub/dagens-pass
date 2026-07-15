import type { HundredFeedback } from "./storage";

export const HUNDRED_GOAL = 100;
export const HUNDRED_START_REPS = 8;

const MIN_REPS = 4;
const MAX_REPS = 34;

export type ChallengePlan = [number, number, number];

export interface ChallengeAttempt {
  baseReps: number;
  plan: ChallengePlan;
  total: number;
}

export interface ChallengeResult {
  attempt: ChallengeAttempt;
  feedback: HundredFeedback;
  nextBaseReps: number;
  nextPlan: ChallengePlan;
}

export function challengePlan(baseReps: number): ChallengePlan {
  return [baseReps, Math.min(MAX_REPS, baseReps + 4), Math.max(MIN_REPS, baseReps - 2)];
}

export function planTotal(plan: readonly number[]): number {
  return plan.reduce((sum, reps) => sum + reps, 0);
}

export function createChallengeAttempt(baseReps: number): ChallengeAttempt {
  const plan = challengePlan(baseReps);
  return { baseReps, plan, total: planTotal(plan) };
}

export function createChallengeResult(
  attempt: ChallengeAttempt,
  feedback: HundredFeedback,
): ChallengeResult {
  const nextBaseReps = nextBaseForFeedback(attempt.baseReps, feedback);
  return {
    attempt,
    feedback,
    nextBaseReps,
    nextPlan: challengePlan(nextBaseReps),
  };
}

export function feedbackHint(level: HundredFeedback): string {
  if (level === "latt") return "Nästa gång ökar appen med 2 reps i basnivå.";
  if (level === "medel") return "Nästa gång ökar appen med 1 rep i basnivå.";
  if (level === "svart") return "Nästa gång behåller appen samma nivå.";
  return "Nästa gång sänker appen basnivån med 2 reps.";
}

export function feedbackLabel(level: HundredFeedback): string {
  if (level === "latt") return "Lätt";
  if (level === "medel") return "Medel";
  if (level === "svart") return "Svårt";
  return "Klarade inte";
}

function nextBaseForFeedback(current: number, level: HundredFeedback): number {
  if (level === "latt") return Math.min(MAX_REPS, current + 2);
  if (level === "medel") return Math.min(MAX_REPS, current + 1);
  if (level === "misslyckat") return Math.max(MIN_REPS, current - 2);
  return current;
}
