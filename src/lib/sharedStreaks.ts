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

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function displayNameFromUser(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return null;
  const metaName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
  return user.email ?? null;
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

  const id = crypto.randomUUID();
  const inviteCode = makeInviteCode();
  const displayName = displayNameFromUser(user);

  const { error: streakError } = await supabase.from("shared_streaks").insert({
    id,
    name,
    current_turn_user_id: user.id,
    streak_count: 0,
    invite_code: inviteCode,
    created_by: user.id,
  });
  if (streakError) throw streakError;

  const { error: memberError } = await supabase.from("shared_streak_members").insert({
    streak_id: id,
    user_id: user.id,
    display_name: displayName,
    member_order: 0,
    role: "owner",
    status: "active",
  });
  if (memberError) throw memberError;

  const { error: activityError } = await supabase.from("shared_streak_activity").insert({
    streak_id: id,
    user_id: user.id,
    activity_type: "created",
    to_user_id: user.id,
    streak_count_after: 0,
  });
  if (activityError) throw activityError;

  const loaded = await loadMySharedStreak();
  if (!loaded) throw new Error("Streak skapades men kunde inte laddas.");
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
