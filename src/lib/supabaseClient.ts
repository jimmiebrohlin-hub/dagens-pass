import { supabase as sharedSupabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

// Lovable Cloud is always configured for this project — env vars are injected
// automatically. Kept for backwards compatibility with existing UI checks.
export function isSupabaseConfigured() {
  return true;
}

export const supabase = sharedSupabase;

interface GoogleLoginOptions {
  redirectPath?: string;
}

function buildRedirectUri(redirectPath?: string): string {
  if (!redirectPath) return window.location.origin;
  const path = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  return `${window.location.origin}${path}`;
}

export async function signInWithGoogle(options: GoogleLoginOptions = {}) {
  if (typeof window === "undefined") {
    return { error: new Error("Google-login kräver en webbläsare.") };
  }
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: buildRedirectUri(options.redirectPath),
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

export async function signInAnonymously() {
  return supabase.auth.signInAnonymously();
}
