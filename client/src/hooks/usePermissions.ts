import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

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

/**
 * Hook que retorna as permissões do usuário atual.
 * - Se o usuário for o dono (não é colaborador), tem acesso total.
 * - Se for colaborador, retorna as permissões configuradas pelo dono.
 */
export function usePermissions() {
  const { user } = useAuth();

  const { data: collabInfo, isLoading } = trpc.collaborators.myCollaboratorInfo.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });

  const isCollaborator = !!collabInfo;

  /**
   * Retorna as permissões para uma seção específica.
   * Se não for colaborador (é o dono), retorna acesso total.
   */
  const getPermission = (section: Section): SectionPermission => {
    // Dono tem acesso total
    if (!isCollaborator) {
      return { canView: true, canCreate: true, canEdit: true, canDelete: true };
    }

    // Colaborador: buscar permissão da seção
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

  /**
   * Verifica se o usuário pode acessar uma seção (canView).
   */
  const canAccess = (section: Section): boolean => {
    if (!isCollaborator) return true;
    return getPermission(section).canView;
  };

  return {
    isLoading,
    isCollaborator,
    getPermission,
    canAccess,
  };
}
