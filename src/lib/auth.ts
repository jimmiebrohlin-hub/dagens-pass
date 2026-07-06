import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, isSupabaseConfigured, signInAnonymously, signInWithGoogle, signOut, supabase } from "./supabaseClient";

export interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const current = await getCurrentUser();
      if (!mounted) return;
      setUser(current);
      setLoading(false);
    }

    void loadUser();

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return {
    configured: isSupabaseConfigured(),
    loading,
    user,
  };
}

export { signInWithGoogle, signOut, signInAnonymously };
