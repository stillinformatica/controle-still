import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading: loading } = trpc.auth.me.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    window.location.reload();
  }, [logoutMutation]);

  return {
    user: user ?? null,
    loading,
    logout,
  };
}
