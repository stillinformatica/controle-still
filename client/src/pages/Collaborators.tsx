import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  Settings,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  PenLine,
  PlusCircle,
  MinusCircle,
} from "lucide-react";

// Seções do sistema com labels amigáveis
const SECTIONS = [
  { key: "dashboard",     label: "Dashboard",          description: "Visão geral e resumo financeiro" },
  { key: "bankAccounts",  label: "Contas Bancárias",   description: "Saldos e histórico de transações" },
  { key: "sales",         label: "Vendas",             description: "Registro e histórico de vendas" },
  { key: "services",      label: "Serviços / OS",      description: "Ordens de serviço e clientes" },
  { key: "purchases",     label: "Compras",            description: "Compras de produtos e fornecedores" },
  { key: "suppliers",     label: "Fornecedores",       description: "Cadastro de fornecedores" },
  { key: "expenses",      label: "Despesas",           description: "Controle de despesas" },
  { key: "debtors",       label: "Devedores",          description: "Clientes devedores e cobranças" },
  { key: "products",      label: "Produtos",           description: "Estoque e preços de produtos" },
  { key: "reports",       label: "Relatórios",         description: "Relatórios de vendas e financeiro" },
  { key: "investments",   label: "Investimentos",      description: "Carteira de investimentos" },
];

type PermissionMap = Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;

function defaultPermissions(): PermissionMap {
  return Object.fromEntries(
    SECTIONS.map(s => [s.key, { canView: false, canCreate: false, canEdit: false, canDelete: false }])
  );
}

export default function Collaborators() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [permMap, setPermMap] = useState<PermissionMap>(defaultPermissions());

  const { data: collaborators = [], isLoading } = trpc.collaborators.list.useQuery(undefined, { enabled: !!user });

  const { data: collabPerms } = trpc.collaborators.getPermissions.useQuery(
    { collaboratorId: selectedCollab?.id ?? 0 },
    { enabled: !!selectedCollab }
  );

  // Sincronizar permissões ao abrir o modal
  useMemo(() => {
    if (collabPerms && selectedCollab) {
      const map = defaultPermissions();
      for (const p of collabPerms) {
        map[p.section] = {
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        };
      }
      setPermMap(map);
    }
  }, [collabPerms, selectedCollab?.id]);

  const inviteMutation = trpc.collaborators.invite.useMutation({
    onSuccess: (data) => {
      utils.collaborators.list.invalidate();
      setInviteToken(data.inviteToken);
      setInviteEmail("");
      setInviteName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePermMutation = trpc.collaborators.updatePermissions.useMutation({
    onSuccess: () => {
      utils.collaborators.list.invalidate();
      toast.success("Permissões atualizadas!");
      setPermOpen(false);
      setSelectedCollab(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.collaborators.updateStatus.useMutation({
    onSuccess: () => {
      utils.collaborators.list.invalidate();
      toast.success("Status atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.collaborators.delete.useMutation({
    onSuccess: () => {
      utils.collaborators.list.invalidate();
      toast.success("Colaborador removido!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, name: inviteName || undefined });
  };

  const handleOpenPerms = (collab: any) => {
    setSelectedCollab(collab);
    setPermMap(defaultPermissions());
    setPermOpen(true);
  };

  const handleSavePerms = () => {
    if (!selectedCollab) return;
    const permissions = Object.entries(permMap).map(([section, perms]) => ({
      section,
      ...perms,
    }));
    updatePermMutation.mutate({ collaboratorId: selectedCollab.id, permissions });
  };

  const togglePerm = (section: string, field: "canView" | "canCreate" | "canEdit" | "canDelete") => {
    setPermMap(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: !prev[section][field] },
    }));
  };

  const setAllView = (value: boolean) => {
    setPermMap(prev => {
      const next = { ...prev };
      for (const s of SECTIONS) {
        next[s.key] = { ...next[s.key], canView: value };
      }
      return next;
    });
  };

  const copyInviteLink = () => {
    if (!inviteToken) return;
    const link = `${window.location.origin}/aceitar-convite?token=${inviteToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 border-gray-300"><XCircle className="h-3 w-3 mr-1" />Inativo</Badge>;
  };

  // Contar permissões ativas de um colaborador
  const countActivePerms = (collabId: number) => {
    // Simplificado - mostramos apenas o número de seções com acesso
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Colaboradores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie quem pode acessar o sistema e o que cada um pode ver
            </p>
          </div>
          <Button onClick={() => { setInviteToken(null); setInviteOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Convidar Colaborador
          </Button>
        </div>

        {/* Como funciona */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Como funciona:</strong> Convide um colaborador pelo email Google. Ele receberá um link de convite,
              fará login com a conta Google e terá acesso apenas às seções que você liberar. Você pode ajustar as
              permissões a qualquer momento ou desativar o acesso.
            </p>
          </CardContent>
        </Card>

        {/* Lista de colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores ({collaborators.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum colaborador cadastrado ainda.</p>
                <p className="text-sm mt-1">Clique em "Convidar Colaborador" para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {(collab.name || collab.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{collab.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{collab.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(collab.status)}

                      {/* Toggle ativo/inativo */}
                      {collab.status !== "pending" && (
                        <Switch
                          checked={collab.status === "active"}
                          onCheckedChange={(checked) =>
                            updateStatusMutation.mutate({
                              collaboratorId: collab.id,
                              status: checked ? "active" : "inactive",
                            })
                          }
                          title={collab.status === "active" ? "Desativar acesso" : "Ativar acesso"}
                        />
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPerms(collab)}
                        title="Gerenciar permissões"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Permissões
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover ${collab.name || collab.email}?`)) {
                            deleteMutation.mutate({ collaboratorId: collab.id });
                          }
                        }}
                        title="Remover colaborador"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Convite */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) { setInviteOpen(false); setInviteToken(null); } }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Colaborador</DialogTitle>
            <DialogDescription>
              O colaborador receberá um link para acessar o sistema com a conta Google dele.
            </DialogDescription>
          </DialogHeader>

          {inviteToken ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Convite criado! Copie o link abaixo e envie ao colaborador.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Link de Convite</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/aceitar-convite?token=${inviteToken}`}
                    className="text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={copyInviteLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O colaborador deve abrir este link, fazer login com o Google e aceitar o convite.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setInviteOpen(false); setInviteToken(null); }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Google *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colaborador@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Deve ser o email que o colaborador usa para fazer login com Google.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome (opcional)</Label>
                <Input
                  id="invite-name"
                  placeholder="Nome do colaborador"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? "Enviando..." : "Criar Convite"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Permissões */}
      <Dialog open={permOpen} onOpenChange={(open) => { if (!open) { setPermOpen(false); setSelectedCollab(null); } }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissões — {selectedCollab?.name || selectedCollab?.email}
            </DialogTitle>
            <DialogDescription>
              Defina quais seções este colaborador pode acessar e o que pode fazer em cada uma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Ações rápidas */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setAllView(true)}>
                <Eye className="h-3 w-3 mr-1" />
                Liberar visualização de tudo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAllView(false)}>
                <XCircle className="h-3 w-3 mr-1" />
                Revogar tudo
              </Button>
            </div>

            {/* Tabela de permissões */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground bg-muted px-4 py-2">
                <span className="col-span-5">Seção</span>
                <span className="col-span-2 text-center">Ver</span>
                <span className="col-span-2 text-center">Criar</span>
                <span className="col-span-2 text-center">Editar</span>
                <span className="col-span-1 text-center">Del.</span>
              </div>
              {SECTIONS.map((section, i) => (
                <div
                  key={section.key}
                  className={`grid grid-cols-12 items-center px-4 py-3 ${i % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                >
                  <div className="col-span-5">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={permMap[section.key]?.canView ?? false}
                      onCheckedChange={() => togglePerm(section.key, "canView")}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={permMap[section.key]?.canCreate ?? false}
                      onCheckedChange={() => togglePerm(section.key, "canCreate")}
                      disabled={!permMap[section.key]?.canView}
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Switch
                      checked={permMap[section.key]?.canEdit ?? false}
                      onCheckedChange={() => togglePerm(section.key, "canEdit")}
                      disabled={!permMap[section.key]?.canView}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Switch
                      checked={permMap[section.key]?.canDelete ?? false}
                      onCheckedChange={() => togglePerm(section.key, "canDelete")}
                      disabled={!permMap[section.key]?.canView}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPermOpen(false); setSelectedCollab(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSavePerms} disabled={updatePermMutation.isPending}>
              {updatePermMutation.isPending ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
