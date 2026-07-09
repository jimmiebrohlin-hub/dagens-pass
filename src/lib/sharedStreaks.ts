import { getCurrentUser, supabase } from "./supabaseClient";

export const BUDDY_STREAK_RETURN_WINDOW_HOURS = 36;
export const BUDDY_STREAK_RETURN_WINDOW_MS = BUDDY_STREAK_RETURN_WINDOW_HOURS * 60 * 60 * 1000;

export interface SharedStreakMember {
  user_id: string;
  display_name: string | null;
  member_order: number;
  role: "owner" | "member";
  status: "active" | "left";
}

export type SharedStreakKind = "personal" | "buddy";

export interface SharedStreak {
  id: string;
  name: string;
  streak_kind?: SharedStreakKind;
  status: "active" | "paused" | "ended";
  current_turn_user_id: string | null;
  streak_count: number;
  invite_code: string;
  created_by: string;
  last_completed_at: string | null;
  members: SharedStreakMember[];
}

export interface SharedDaily3CompletionResult {
  updated: Array<{
    streak_id: string;
    streak_count_after: number;
    to_user_id: string | null;
    streak_kind?: SharedStreakKind;
    reset_by_timeout?: boolean;
  }>;
  updated_count: number;
  skipped_today: number;
  skipped_not_turn: number;
  reset_count?: number;
  buddy_window_hours?: number;
}

interface RemoteErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

function formatRemoteError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  const remoteError = error as RemoteErrorLike;
  const parts = [
    remoteError?.message ?? String(error),
    remoteError?.code ? `code: ${remoteError.code}` : null,
    remoteError?.details ? `details: ${remoteError.details}` : null,
    remoteError?.hint ? `hint: ${remoteError.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function rpcError(prefix: string, error: unknown) {
  const details = formatRemoteError(error);
  if (details.includes("get_my_shared_streaks") || details.includes("ensure_my_personal_streak") || details.includes("complete_shared_daily3_turns") || details.includes("PGRST202")) {
    return new Error(`${prefix}: ${details}. Trolig orsak: senaste Supabase-migrationen är inte körd ännu.`);
  }
  return new Error(`${prefix}: ${details}`);
}

function normalizeSharedStreak(value: unknown): SharedStreak | null {
  if (!value || typeof value !== "object") return null;
  const streak = value as SharedStreak;
  const inferredKind: SharedStreakKind =
    streak.streak_kind === "personal" || streak.name === "Min streak" || streak.name === "Personlig streak" || streak.name === "Egen streak"
      ? "personal"
      : "buddy";

  return {
    ...streak,
    streak_kind: inferredKind,
    name: inferredKind === "personal" ? "Min streak" : streak.name,
    members: Array.isArray(streak.members) ? streak.members : [],
  } as SharedStreak;
}

function normalizeSharedStreaks(value: unknown): SharedStreak[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeSharedStreak).filter((item): item is SharedStreak => Boolean(item));
}

export function isPersonalStreak(streak: SharedStreak) {
  return streak.streak_kind === "personal" || streak.name === "Min streak" || streak.name === "Personlig streak" || streak.name === "Egen streak";
}

export function isBuddyStreak(streak: SharedStreak) {
  return !isPersonalStreak(streak);
}

export function activeMembers(streak: SharedStreak) {
  return streak.members.filter((member) => member.status === "active").sort((a, b) => a.member_order - b.member_order);
}

export function isLegacyGroupStreak(streak: SharedStreak) {
  return isBuddyStreak(streak) && activeMembers(streak).length > 2;
}

export function isFullBuddyStreak(streak: SharedStreak) {
  return isBuddyStreak(streak) && activeMembers(streak).length === 2;
}

export function isOpenBuddyStreak(streak: SharedStreak) {
  return isBuddyStreak(streak) && activeMembers(streak).length < 2;
}

export function buddyStreakTimedOut(streak: SharedStreak, now = Date.now()) {
  if (!isFullBuddyStreak(streak) || !streak.last_completed_at) return false;
  const lastCompleted = new Date(streak.last_completed_at).getTime();
  if (!Number.isFinite(lastCompleted)) return false;
  return now - lastCompleted > BUDDY_STREAK_RETURN_WINDOW_MS;
}

async function ensurePersonalStreak() {
  const { error } = await supabase.rpc("ensure_my_personal_streak");
  if (error) {
    console.error("[shared-streak] ensure_my_personal_streak failed", error);
    throw rpcError("Kunde inte skapa/ladda Min streak", error);
  }
}

export async function loadMySharedStreaks(): Promise<SharedStreak[]> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  await ensurePersonalStreak();

  const { data, error } = await supabase.rpc("get_my_shared_streaks");
  if (error) {
    console.error("[shared-streak] get_my_shared_streaks failed", error);
    throw rpcError("Kunde inte ladda streaks via RPC", error);
  }

  return normalizeSharedStreaks(data);
}

export async function loadMySharedStreak(): Promise<SharedStreak | null> {
  const streaks = await loadMySharedStreaks();
  return streaks[0] ?? null;
}

export async function createSharedStreak(name = "Streak med någon"): Promise<SharedStreak> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const { data, error } = await supabase.rpc("create_shared_streak", { p_name: name });
  if (error) {
    console.error("[shared-streak] create_shared_streak failed", error);
    throw rpcError("Kunde inte skapa streak via RPC", error);
  }

  const createdId = typeof data === "string" ? data : null;
  const loaded = await loadMySharedStreaks();
  const created = loaded.find((streak) => streak.id === createdId) ?? loaded.find(isOpenBuddyStreak);
  if (!created) throw new Error("Streak skapades men kunde inte laddas.");
  return created;
}

export async function joinSharedStreak(inviteCode: string): Promise<SharedStreak> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const code = inviteCode.trim().toUpperCase();
  if (code.length < 4) throw new Error("Skriv in en giltig kod.");

  const { error } = await supabase.rpc("join_shared_streak_by_code", { p_invite_code: code });
  if (error) {
    console.error("[shared-streak] join_shared_streak_by_code failed", error);
    if (error.message.includes("invite_not_found")) throw new Error("Koden hittades inte.");
    if (error.message.includes("streak_full")) throw new Error("Den här streaken har redan två medlemmar.");
    if (error.message.includes("personal_streak_cannot_be_joined")) throw new Error("Min streak kan inte delas. Skapa en streak med någon i stället.");
    throw rpcError("Kunde inte gå med via RPC", error);
  }

  const loaded = await loadMySharedStreaks();
  const matching = loaded.find((streak) => streak.invite_code === code);
  const fallback = loaded.find((streak) => isFullBuddyStreak(streak) || isOpenBuddyStreak(streak));
  const resolved = matching ?? fallback;
  if (!resolved) throw new Error("Du gick med, men streaken kunde inte laddas.");
  return resolved;
}

export async function completeSharedDaily3Turns(): Promise<SharedDaily3CompletionResult | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("complete_shared_daily3_turns");
  if (error) {
    console.error("[shared-streak] complete_shared_daily3_turns failed", error);
    throw rpcError("Kunde inte uppdatera gemensamma streaks", error);
  }

  const result = data as unknown as SharedDaily3CompletionResult;
  return {
    updated: Array.isArray(result?.updated) ? result.updated : [],
    updated_count: Number(result?.updated_count ?? 0),
    skipped_today: Number(result?.skipped_today ?? 0),
    skipped_not_turn: Number(result?.skipped_not_turn ?? 0),
    reset_count: Number(result?.reset_count ?? 0),
    buddy_window_hours: Number(result?.buddy_window_hours ?? BUDDY_STREAK_RETURN_WINDOW_HOURS),
  };
}

export function isMyTurn(streak: SharedStreak, userId: string) {
  return isPersonalStreak(streak) || streak.current_turn_user_id === userId;
}

export function currentTurnLabel(streak: SharedStreak, userId: string) {
  if (isPersonalStreak(streak)) return "Min streak uppdateras när du gör Dagens 3";
  if (isMyTurn(streak, userId)) return "Bollen är hos dig";
  const member = streak.members.find((m) => m.user_id === streak.current_turn_user_id);
  return member?.display_name ? `Bollen är hos ${member.display_name}` : "Bollen är hos din kompis";
}

export function buddyPartnerName(streak: SharedStreak, userId: string) {
  const partner = activeMembers(streak).find((member) => member.user_id !== userId);
  return partner?.display_name?.trim() || "någon";
}
