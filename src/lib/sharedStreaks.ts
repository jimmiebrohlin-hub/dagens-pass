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

export async function loadMySharedStreak(): Promise<SharedStreak | null> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const { data: memberships, error: memberError } = await supabase
    .from("shared_streak_members")
    .select("streak_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (memberError) throw memberError;
  const streakId = memberships?.[0]?.streak_id;
  if (!streakId) return null;

  const { data: streak, error: streakError } = await supabase
    .from("shared_streaks")
    .select("id,name,status,current_turn_user_id,streak_count,invite_code,created_by,last_completed_at")
    .eq("id", streakId)
    .maybeSingle();

  if (streakError) throw streakError;
  if (!streak) return null;

  const { data: members, error: membersError } = await supabase
    .from("shared_streak_members")
    .select("user_id,display_name,member_order,role,status")
    .eq("streak_id", streakId)
    .order("member_order", { ascending: true });

  if (membersError) throw membersError;

  return {
    ...streak,
    members: (members ?? []) as SharedStreakMember[],
  } as SharedStreak;
}

export async function createSharedStreak(name = "Vår streak"): Promise<SharedStreak> {
  if (!supabase) throw new Error("Supabase är inte konfigurerat.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const { error } = await supabase.rpc("create_shared_streak", { p_name: name });
  if (error) throw error;

  const loaded = await loadMySharedStreak();
  if (!loaded) throw new Error("Streak skapades men kunde inte laddas.");
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
    if (error.message.includes("invite_not_found")) throw new Error("Koden hittades inte.");
    throw error;
  }

  const loaded = await loadMySharedStreak();
  if (!loaded) throw new Error("Du gick med, men streaken kunde inte laddas.");
  return loaded;
}

export function isMyTurn(streak: SharedStreak, userId: string) {
  return streak.current_turn_user_id === userId;
}

export function currentTurnLabel(streak: SharedStreak, userId: string) {
  if (isMyTurn(streak, userId)) return "Bollen är hos dig";
  const member = streak.members.find((m) => m.user_id === streak.current_turn_user_id);
  return member?.display_name ? `Bollen är hos ${member.display_name}` : "Bollen är hos din kompis";
}
