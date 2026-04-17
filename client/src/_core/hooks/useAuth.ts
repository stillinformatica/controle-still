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
  const [isSessionReady, setIsSessionReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSupabaseUser(session?.user ?? null);
        setIsSessionReady(true);
      }
    );

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setSupabaseUser(session?.user ?? null);
      } catch (error) {
        console.error("[Auth] Failed to restore session:", error);

        if (!isMounted) return;
        setSupabaseUser(null);
      } finally {
        if (isMounted) {
          setIsSessionReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", supabaseUser?.id],
    queryFn: authApi.getProfile,
    enabled: isSessionReady && !!supabaseUser,
    staleTime: 30_000,
    retry: false,
  });

  const resolvedUser = profile ?? (supabaseUser ? mapSupabaseUserToFallbackProfile(supabaseUser) : null);
  const user = isSessionReady ? resolvedUser : null;
  const loading = !isSessionReady;

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
    user,
    supabaseUser,
    loading,
    isSessionReady,
    logout,
    signInWithGoogle,
  };
}
