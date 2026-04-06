import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener BEFORE getting session (per Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the backend user (MySQL) once we have a Supabase session
  const { data: backendUser } = trpc.auth.me.useQuery(undefined, {
    enabled: !!supabaseUser,
    staleTime: 30_000,
    retry: false,
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.reload();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }, []);

  return {
    user: backendUser ?? null,
    supabaseUser,
    loading,
    logout,
    signInWithGoogle,
  };
}
