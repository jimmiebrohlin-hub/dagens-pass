import { createSharedStreak, type SharedStreak } from "./sharedStreaks";

const HIDDEN_STREAK_IDS_KEY = "vardagsstyrka.hiddenSharedStreakIds.v1";

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readHiddenIds() {
  if (!storageAvailable()) return new Set<string>();
  try {
    const raw = window.localStorage.getItem(HIDDEN_STREAK_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeHiddenIds(ids: Set<string>) {
  if (!storageAvailable()) return;
  window.localStorage.setItem(HIDDEN_STREAK_IDS_KEY, JSON.stringify([...ids]));
}

export function hideStreakIdsLocally(ids: string[]) {
  const hidden = readHiddenIds();
  ids.forEach((id) => hidden.add(id));
  writeHiddenIds(hidden);
}

export function filterHiddenStreaks(streaks: SharedStreak[]) {
  const hidden = readHiddenIds();
  return streaks.filter((streak) => !hidden.has(streak.id));
}

export async function softResetStreaksFromVisibleList(streaks: SharedStreak[]) {
  const idsToHide = streaks.map((streak) => streak.id);
  hideStreakIdsLocally(idsToHide);
  const personal = await createSharedStreak("Min streak");
  return {
    reset: true,
    deleted_streaks: idsToHide.length,
    deleted_members: 0,
    deleted_activity: 0,
    personal_streak_id: personal.id,
    fallback: true,
    personal,
  };
}
