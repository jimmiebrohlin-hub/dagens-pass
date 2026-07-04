import { supabase as sharedSupabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

// Lovable Cloud is always configured for this project — env vars are injected
// automatically. Kept for backwards compatibility with existing UI checks.
export function isSupabaseConfigured() {
  return true;
}

export const supabase = sharedSupabase;

export async function signInWithGoogle() {
  if (typeof window === "undefined") {
    return { error: new Error("Google-login kräver en webbläsare.") };
  }
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: {
      prompt: "select_account",
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
