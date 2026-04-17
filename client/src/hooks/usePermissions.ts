import { useAuth } from "@/_core/hooks/useAuth";
import { collaboratorsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type Section =
  | "dashboard"
  | "bankAccounts"
  | "sales"
  | "services"
  | "purchases"
  | "suppliers"
  | "expenses"
  | "debtors"
  | "products"
  | "reports"
  | "investments";

export interface SectionPermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function usePermissions() {
  const { user, isSessionReady } = useAuth();

  const { data: collabInfo, isLoading } = useQuery({
    queryKey: ["myCollaboratorInfo", user?.id],
    queryFn: collaboratorsApi.myCollaboratorInfo,
    enabled: isSessionReady && !!user,
    staleTime: 30_000,
  });

  const isCollaborator = !!collabInfo;

  const getPermission = (section: Section): SectionPermission => {
    if (!isCollaborator) {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }
    const perm = collabInfo?.permissions?.find((p: any) => p.section === section);
    if (!perm) {
      return { canView: false, canCreate: false, canEdit: false, canDelete: false };
    }
    return {
      canView: perm.canView,
      canCreate: perm.canCreate,
      canEdit: perm.canEdit,
      canDelete: perm.canDelete,
    };
  };

  const canAccess = (section: Section): boolean => {
    if (!isCollaborator) return true;
    return getPermission(section).canView;
  };

  return {
    isLoading: !isSessionReady || isLoading,
    isCollaborator,
    getPermission,
    canAccess,
  };
}
