import { supabase } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable/index";
import { authApi } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function mapSupabaseUserToFallbackProfile(user: SupabaseUser) {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    loginMethod: user.app_metadata?.provider ?? "google",
    role: "user",
  };
}

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

  const resolvedUser = profile ?? (supabaseUser ? mapSupabaseUserToFallbackProfile(supabaseUser) : null);
  const loading = authLoading || (!!supabaseUser && isProfileLoading);

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
    user: resolvedUser,
    supabaseUser,
    loading,
    logout,
    signInWithGoogle,
  };
}
