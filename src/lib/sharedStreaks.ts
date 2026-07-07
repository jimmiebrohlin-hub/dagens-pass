import { getCurrentUser, supabase } from "./supabaseClient";

export interface SharedStreakMember {
  user_id: string;
  display_name: string | null;
  member_order: number;
  role: "owner" | "member";
  status: "active" | "left";
}

export interface SharedStreak {
  id: string;
  name: string;
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
  }>;
  updated_count: number;
  skipped_today: number;
  skipped_not_turn: number;
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
  if (details.includes("get_my_shared_streak") || details.includes("get_my_shared_streaks") || details.includes("complete_shared_daily3_turns") || details.includes("PGRST202")) {
    return new Error(`${prefix}: ${details}. Trolig orsak: senaste Supabase-migrationen är inte körd ännu.`);
  }
  return new Error(`${prefix}: ${details}`);
}

function normalizeSharedStreak(value: unknown): SharedStreak | null {
  if (!value || typeof value !== "object") return null;
  const streak = value as SharedStreak;
  return {
    ...streak,
    members: Array.isArray(streak.members) ? streak.members : [],
  } as SharedStreak;
}

function normalizeSharedStreaks(value: unknown): SharedStreak[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeSharedStreak).filter((item): item is SharedStreak => Boolean(item));
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

  const { data, error } = await supabase.rpc("get_my_shared_streaks");
  if (error) {
    console.error("[shared-streak] get_my_shared_streaks failed", error);
    if (missingRpc(error, "get_my_shared_streaks")) {
      return loadSingleSharedStreakFallback();
    }
    throw rpcError("Kunde inte ladda streaks via RPC", error);
  }

  const streaks = normalizeSharedStreaks(data);
  console.info("[shared-streak] get_my_shared_streaks result", {
    streakCount: streaks.length,
    streakIds: streaks.map((streak) => streak.id),
  });
  return streaks;
}

export async function loadMySharedStreak(): Promise<SharedStreak | null> {
  const streaks = await loadMySharedStreaks();
  return streaks[0] ?? null;
}

export async function createSharedStreak(name = "Vår streak"): Promise<SharedStreak> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const { error } = await supabase.rpc("create_shared_streak", { p_name: name });
  if (error) {
    console.error("[shared-streak] create_shared_streak failed", error);
    throw rpcError("Kunde inte skapa streak via RPC", error);
  }

  const loaded = await loadMySharedStreak();
  if (!loaded) throw new Error("Streak skapades men kunde inte laddas. Tekniskt: get_my_shared_streaks returnerade tomt efter create_shared_streak.");
  return loaded;
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
    throw rpcError("Kunde inte gå med via RPC", error);
  }

  const loaded = await loadMySharedStreaks();
  const matching = loaded.find((streak) => streak.invite_code === code);
  const fallback = loaded[0];
  if (!matching && !fallback) throw new Error("Du gick med, men streaken kunde inte laddas. Tekniskt: get_my_shared_streaks returnerade tomt efter join_shared_streak_by_code.");
  return matching ?? fallback;
}

export async function completeSharedDaily3Turns(): Promise<SharedDaily3CompletionResult | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("complete_shared_daily3_turns");
  if (error) {
    console.error("[shared-streak] complete_shared_daily3_turns failed", error);
    if (missingRpc(error, "complete_shared_daily3_turns")) return null;
    throw rpcError("Kunde inte uppdatera gemensamma streaks", error);
  }

  const result = data as SharedDaily3CompletionResult;
  return {
    updated: Array.isArray(result?.updated) ? result.updated : [],
    updated_count: Number(result?.updated_count ?? 0),
    skipped_today: Number(result?.skipped_today ?? 0),
    skipped_not_turn: Number(result?.skipped_not_turn ?? 0),
  };
}

export function isMyTurn(streak: SharedStreak, userId: string) {
  return streak.current_turn_user_id === userId;
}

export function currentTurnLabel(streak: SharedStreak, userId: string) {
  if (isMyTurn(streak, userId)) return "Bollen är hos dig";
  const member = streak.members.find((m) => m.user_id === streak.current_turn_user_id);
  return member?.display_name ? `Bollen är hos ${member.display_name}` : "Bollen är hos din kompis";
}
