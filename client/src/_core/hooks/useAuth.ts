import { supabase } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable";
import { useCallback, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
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
