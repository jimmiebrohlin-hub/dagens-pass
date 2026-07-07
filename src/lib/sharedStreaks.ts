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

export interface SharedStreakResetResult {
  reset: boolean;
  deleted_streaks: number;
  deleted_members: number;
  deleted_activity: number;
  personal_streak_id: string | null;
  fallback?: boolean;
}

interface RemoteErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

function formatRemoteError(error: unknown) {
  const remoteError = error as RemoteErrorLike;
  const message = remoteError?.message ?? String(error);
  const parts = [
    message,
    remoteError?.code ? `code: ${remoteError.code}` : null,
    remoteError?.details ? `details: ${remoteError.details}` : null,
    remoteError?.hint ? `hint: ${remoteError.hint}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function missingRpc(error: unknown, rpcName: string) {
  const details = formatRemoteError(error);
  return details.includes(rpcName) || details.includes("PGRST202");
}

function rpcError(prefix: string, error: unknown) {
  const details = formatRemoteError(error);
  if (details.includes("get_my_shared_streak") || details.includes("get_my_shared_streaks") || details.includes("ensure_my_personal_streak") || details.includes("complete_shared_daily3_turns") || details.includes("debug_reset_all_shared_streaks") || details.includes("PGRST202")) {
    return new Error(`${prefix}: ${details}. Trolig orsak: senaste Supabase-migrationen är inte körd ännu.`);
  }
  return new Error(`${prefix}: ${details}`);
}

function displayNameFromUser(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return null;
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  return fullName || name || user.email || null;
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

function nextUserId(streak: SharedStreak, userId: string) {
  if (isPersonalStreak(streak)) return userId;
  const members = activeMembers(streak);
  if (members.length === 0) return userId;
  const currentIndex = members.findIndex((member) => member.user_id === userId);
  if (currentIndex < 0) return members[0]?.user_id ?? userId;
  return members[(currentIndex + 1) % members.length]?.user_id ?? userId;
}

async function ensurePersonalStreakIfAvailable() {
  try {
    const { error } = await supabase.rpc("ensure_my_personal_streak");
    if (error) {
      if (missingRpc(error, "ensure_my_personal_streak")) return;
      console.warn("[shared-streak] ensure_my_personal_streak failed", error);
    }
  } catch (error) {
    console.warn("[shared-streak] ensure_my_personal_streak unavailable", error);
  }
}

async function leaveLegacyGroupStreaksForCurrentUser(userId: string, streaks: SharedStreak[]) {
  const legacyIds = streaks.filter(isLegacyGroupStreak).map((streak) => streak.id);
  if (legacyIds.length === 0) return;

  const { error } = await supabase
    .from("shared_streak_members")
    .update({ status: "left" })
    .eq("user_id", userId)
    .in("streak_id", legacyIds);

  if (error) {
    console.warn("[shared-streak] could not hide legacy group streaks for current user", error);
  } else {
    console.info("[shared-streak] hid legacy group streaks for current user", { count: legacyIds.length });
  }
}

async function loadSingleSharedStreakFallback(): Promise<SharedStreak[]> {
  const { data, error } = await supabase.rpc("get_my_shared_streak");
  if (error) {
    console.error("[shared-streak] get_my_shared_streak fallback failed", error);
    throw rpcError("Kunde inte ladda streak via RPC", error);
  }
  const streak = normalizeSharedStreak(data);
  return streak ? [streak] : [];
}

export async function loadMySharedStreaks(): Promise<SharedStreak[]> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  await ensurePersonalStreakIfAvailable();

  const { data, error } = await supabase.rpc("get_my_shared_streaks");
  if (error) {
    console.error("[shared-streak] get_my_shared_streaks failed", error);
    if (missingRpc(error, "get_my_shared_streaks")) {
      const fallback = await loadSingleSharedStreakFallback();
      await leaveLegacyGroupStreaksForCurrentUser(user.id, fallback);
      return fallback.filter((streak) => !isLegacyGroupStreak(streak));
    }
    throw rpcError("Kunde inte ladda streaks via RPC", error);
  }

  const streaks = normalizeSharedStreaks(data);
  await leaveLegacyGroupStreaksForCurrentUser(user.id, streaks);
  const visibleStreaks = streaks.filter((streak) => !isLegacyGroupStreak(streak));
  console.info("[shared-streak] get_my_shared_streaks result", {
    streakCount: visibleStreaks.length,
    hiddenLegacyGroupCount: streaks.length - visibleStreaks.length,
    streakIds: visibleStreaks.map((streak) => streak.id),
  });
  return visibleStreaks;
}

export async function loadMySharedStreak(): Promise<SharedStreak | null> {
  const streaks = await loadMySharedStreaks();
  return streaks[0] ?? null;
}

async function createPersonalStreakClientFallback(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  const personalId = crypto.randomUUID();
  const displayName = displayNameFromUser(user);

  const { error: streakError } = await supabase.from("shared_streaks").insert({
    id: personalId,
    name: "Min streak",
    current_turn_user_id: user.id,
    streak_count: 0,
    created_by: user.id,
  });

  if (streakError) throw streakError;

  const { error: memberError } = await supabase.from("shared_streak_members").insert({
    streak_id: personalId,
    user_id: user.id,
    display_name: displayName,
    member_order: 0,
    role: "owner",
    status: "active",
  });

  if (memberError) throw memberError;

  const { error: activityError } = await supabase.from("shared_streak_activity").insert({
    streak_id: personalId,
    user_id: user.id,
    activity_type: "created",
    to_user_id: user.id,
    streak_count_after: 0,
  });

  if (activityError) console.warn("[shared-streak] client fallback personal activity insert failed", activityError);
  return personalId;
}

async function resetSharedStreaksClientFallback(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>): Promise<SharedStreakResetResult> {
  const { data: activeMemberships } = await supabase
    .from("shared_streak_members")
    .select("streak_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const uniqueStreakIds = new Set((activeMemberships ?? []).map((row: { streak_id: string }) => row.streak_id));

  const { error: leaveError } = await supabase
    .from("shared_streak_members")
    .update({ status: "left" })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (leaveError) throw leaveError;

  const personalId = await createPersonalStreakClientFallback(user);
  return {
    reset: true,
    deleted_streaks: uniqueStreakIds.size,
    deleted_members: activeMemberships?.length ?? 0,
    deleted_activity: 0,
    personal_streak_id: personalId,
    fallback: true,
  };
}

export async function resetAllSharedStreaksForTest(): Promise<SharedStreakResetResult> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const { data, error } = await supabase.rpc("debug_reset_all_shared_streaks");
  if (error) {
    console.error("[shared-streak] debug_reset_all_shared_streaks failed", error);
    if (missingRpc(error, "debug_reset_all_shared_streaks")) {
      return resetSharedStreaksClientFallback(user);
    }
    throw rpcError("Kunde inte rensa streaks via testknappen", error);
  }

  return data as SharedStreakResetResult;
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
  const created = loaded.find((streak) => streak.id === createdId) ?? loaded.find((streak) => isOpenBuddyStreak(streak));
  if (!created) throw new Error("Streak skapades men kunde inte laddas. Tekniskt: get_my_shared_streaks returnerade ingen ny delad streak.");
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
  if (!matching && !fallback) throw new Error("Du gick med, men streaken kunde inte laddas. Tekniskt: get_my_shared_streaks returnerade ingen delad streak efter join_shared_streak_by_code.");
  return matching ?? fallback;
}

async function completeSharedDaily3TurnsClientFallback(userId: string, before: SharedStreak[]): Promise<SharedDaily3CompletionResult> {
  const candidates = before.filter((streak) => isPersonalStreak(streak) || (isMyTurn(streak, userId) && isFullBuddyStreak(streak)));
  const updated: SharedDaily3CompletionResult["updated"] = [];
  const skippedNotTurn = before.filter((streak) => isBuddyStreak(streak) && (!isMyTurn(streak, userId) || !isFullBuddyStreak(streak))).length;
  let resetCount = 0;

  for (const streak of candidates) {
    const toUserId = nextUserId(streak, userId);
    const resetByTimeout = buddyStreakTimedOut(streak);
    const nextCount = resetByTimeout ? 1 : streak.streak_count + 1;
    if (resetByTimeout) resetCount += 1;

    let query = supabase
      .from("shared_streaks")
      .update({
        streak_count: nextCount,
        last_completed_at: new Date().toISOString(),
        current_turn_user_id: toUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", streak.id);

    if (isBuddyStreak(streak)) query = query.eq("current_turn_user_id", userId);

    const { error: updateError } = await query;

    if (updateError) {
      console.error("[shared-streak] client fallback update failed", { streakId: streak.id, updateError });
      continue;
    }

    const { error: activityError } = await supabase.from("shared_streak_activity").insert({
      streak_id: streak.id,
      user_id: userId,
      activity_type: "daily3_done",
      from_user_id: userId,
      to_user_id: toUserId,
      streak_count_after: nextCount,
    });

    if (activityError) {
      console.warn("[shared-streak] client fallback activity insert failed", { streakId: streak.id, activityError });
    }

    updated.push({
      streak_id: streak.id,
      streak_count_after: nextCount,
      to_user_id: toUserId,
      streak_kind: isPersonalStreak(streak) ? "personal" : "buddy",
      reset_by_timeout: resetByTimeout,
    });
  }

  return {
    updated,
    updated_count: updated.length,
    skipped_today: 0,
    skipped_not_turn: skippedNotTurn,
    reset_count: resetCount,
    buddy_window_hours: BUDDY_STREAK_RETURN_WINDOW_HOURS,
  };
}

export async function completeSharedDaily3Turns(): Promise<SharedDaily3CompletionResult | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const before = await loadMySharedStreaks();
  const hasOnlyCleanStreaks = before.every((streak) => isPersonalStreak(streak) || isFullBuddyStreak(streak) || isOpenBuddyStreak(streak));
  const hadEligible = before.some((streak) => isPersonalStreak(streak) || (isMyTurn(streak, user.id) && isFullBuddyStreak(streak)));
  if (!hadEligible) {
    return {
      updated: [],
      updated_count: 0,
      skipped_today: 0,
      skipped_not_turn: before.filter(isBuddyStreak).length,
      reset_count: 0,
      buddy_window_hours: BUDDY_STREAK_RETURN_WINDOW_HOURS,
    };
  }

  if (!hasOnlyCleanStreaks) {
    return completeSharedDaily3TurnsClientFallback(user.id, before);
  }

  const { data, error } = await supabase.rpc("complete_shared_daily3_turns");
  if (error) {
    console.error("[shared-streak] complete_shared_daily3_turns failed", error);
    if (missingRpc(error, "complete_shared_daily3_turns")) {
      return completeSharedDaily3TurnsClientFallback(user.id, before);
    }
    throw rpcError("Kunde inte uppdatera gemensamma streaks", error);
  }

  const result = data as SharedDaily3CompletionResult;
  const normalized = {
    updated: Array.isArray(result?.updated) ? result.updated : [],
    updated_count: Number(result?.updated_count ?? 0),
    skipped_today: Number(result?.skipped_today ?? 0),
    skipped_not_turn: Number(result?.skipped_not_turn ?? 0),
    reset_count: Number(result?.reset_count ?? 0),
    buddy_window_hours: Number(result?.buddy_window_hours ?? BUDDY_STREAK_RETURN_WINDOW_HOURS),
  };

  if (normalized.updated_count === 0 && hadEligible) {
    console.warn("[shared-streak] RPC updated 0 streaks despite eligible streaks. Running client fallback.", normalized);
    return completeSharedDaily3TurnsClientFallback(user.id, before);
  }

  return normalized;
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
