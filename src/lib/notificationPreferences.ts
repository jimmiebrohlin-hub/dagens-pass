import { getCurrentUser, supabase } from "./supabaseClient";

export interface NotificationPreferences {
  streakEmailEnabled: boolean;
  available: boolean;
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || Boolean(error.message?.includes("user_notification_preferences"));
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const client = supabase as any;
  const { data, error } = await client
    .from("user_notification_preferences")
    .select("streak_email_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return { streakEmailEnabled: true, available: false };
    throw error;
  }

  return {
    streakEmailEnabled: data?.streak_email_enabled ?? true,
    available: true,
  };
}

export async function saveStreakEmailEnabled(enabled: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Du behöver vara inloggad först.");

  const client = supabase as any;
  const { error } = await client.from("user_notification_preferences").upsert({
    user_id: user.id,
    streak_email_enabled: enabled,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (isMissingTableError(error)) throw new Error("Inställningen aktiveras när nästa Supabase-migration har körts.");
    throw error;
  }
}
