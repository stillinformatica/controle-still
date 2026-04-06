import { supabase } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable/index";
import { authApi } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: authApi.getProfile,
    enabled: !!supabaseUser,
    staleTime: 30_000,
    retry: false,
  });

  const loading = authLoading || (!!supabaseUser && !profile && isProfileLoading);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    window.location.reload();
  }, [queryClient]);

  const signInWithGoogle = useCallback(async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: {
        prompt: "select_account",
      },
    });
  }, []);

  return {
    user: profile ?? null,
    supabaseUser,
    loading,
    logout,
    signInWithGoogle,
  };
}
