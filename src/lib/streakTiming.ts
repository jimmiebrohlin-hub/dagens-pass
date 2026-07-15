import {
  BUDDY_STREAK_RETURN_WINDOW_MS,
  isFullBuddyStreak,
  type SharedStreak,
} from "./sharedStreaks";

export type BuddyTurnUrgency = "normal" | "warning" | "urgent" | "expired";

export interface BuddyTurnTimeStatus {
  deadline: Date;
  remainingMs: number;
  remainingLabel: string;
  deadlineLabel: string;
  urgency: BuddyTurnUrgency;
}

function remainingLabel(remainingMs: number) {
  if (remainingMs <= 0) return "Tiden gick ut";

  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  if (totalMinutes < 60) return `${totalMinutes} min kvar`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 6 && minutes > 0) return `${hours} h ${minutes} min kvar`;
  return `${hours} h kvar`;
}

function urgencyFor(remainingMs: number): BuddyTurnUrgency {
  if (remainingMs <= 0) return "expired";
  if (remainingMs <= 3 * 60 * 60 * 1000) return "urgent";
  if (remainingMs <= 12 * 60 * 60 * 1000) return "warning";
  return "normal";
}

export function getBuddyTurnTimeStatus(streak: SharedStreak, now = Date.now()): BuddyTurnTimeStatus | null {
  if (!isFullBuddyStreak(streak) || !streak.last_completed_at) return null;

  const completedAt = new Date(streak.last_completed_at).getTime();
  if (!Number.isFinite(completedAt)) return null;

  const deadline = new Date(completedAt + BUDDY_STREAK_RETURN_WINDOW_MS);
  const remainingMs = deadline.getTime() - now;
  const deadlineLabel = new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(deadline);

  return {
    deadline,
    remainingMs,
    remainingLabel: remainingLabel(remainingMs),
    deadlineLabel: `före ${deadlineLabel}`,
    urgency: urgencyFor(remainingMs),
  };
}

export function buddyTimeToneClass(urgency: BuddyTurnUrgency) {
  if (urgency === "expired") return "bg-destructive/10 text-destructive";
  if (urgency === "urgent") return "bg-destructive/10 text-destructive";
  if (urgency === "warning") return "bg-amber-500/15 text-amber-800";
  return "bg-primary/15 text-primary";
}
