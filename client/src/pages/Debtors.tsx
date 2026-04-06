import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Users2, Trash2, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Debtors() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    accountId: "",
    notes: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    totalAmount: "",
    paidAmount: "",
    description: "",
  });

  const utils = trpc.useUtils();
  const { data: allDebtors, isLoading } = trpc.debtors.list.useQuery(
    { status: "pending" },
    { enabled: !!user }
  );
  
  // Filtrar devedores por busca
  const debtors = useMemo(() => {
    if (!allDebtors || !searchQuery.trim()) return allDebtors;
    const query = searchQuery.toLowerCase();
    return allDebtors.filter(debtor => 
      debtor.name.toLowerCase().includes(query)
    );
  }, [allDebtors, searchQuery]);

  const createMutation = trpc.debtors.create.useMutation({
    onSuccess: () => {
      utils.debtors.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Devedor registrado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao registrar devedor: " + error.message);
    },
  });

  const updateMutation = trpc.debtors.update.useMutation({
    onSuccess: () => {
      utils.debtors.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Devedor atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar devedor: " + error.message);
    },
  });

  const deleteMutation = trpc.debtors.delete.useMutation({
    onSuccess: () => {
      utils.debtors.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Devedor excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir devedor: " + error.message);
    },
  });

  const paymentMutation = trpc.debtorPayments.create.useMutation({
    onSuccess: () => {
      utils.debtors.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.bankAccounts.list.invalidate();
      toast.success("Pagamento registrado com sucesso!");
      resetPaymentForm();
    },
    onError: (error) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
    },
  });

  // Buscar contas bancárias para seleção
  const { data: bankAccounts } = trpc.bankAccounts.list.useQuery(undefined, { enabled: !!user });

  const resetForm = () => {
    setFormData({
      name: "",
      totalAmount: "",
      paidAmount: "",
      description: "",
    });
    setEditingDebtor(null);
    setIsDialogOpen(false);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: "",
      accountId: "",
      notes: "",
    });
    setSelectedDebtor(null);
    setIsPaymentDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDebtor) {
      updateMutation.mutate({
        id: editingDebtor.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (debtor: any) => {
    setEditingDebtor(debtor);
    setFormData({
      name: debtor.name,
      totalAmount: debtor.totalAmount,
      paidAmount: debtor.paidAmount,
      description: debtor.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este devedor?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleOpenPayment = (debtor: any) => {
    setSelectedDebtor(debtor);
    setIsPaymentDialogOpen(true);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (!paymentData.accountId) {
      toast.error("Selecione a conta bancária que recebeu o pagamento");
      return;
    }

    const remaining = calculateRemaining(selectedDebtor.totalAmount, selectedDebtor.paidAmount);
    if (parseFloat(paymentData.amount) > remaining) {
      toast.error(`Valor maior que o restante (${formatCurrency(remaining)})`);
      return;
    }

    paymentMutation.mutate({
      debtorId: selectedDebtor.id,
      date: getCurrentDateString(),
      amount: paymentData.amount,
      accountId: parseInt(paymentData.accountId),
      notes: paymentData.notes || undefined,
    });
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const calculateRemaining = (total: string, paid: string) => {
    return parseFloat(total) - parseFloat(paid);
  };

  const calculateProgress = (total: string, paid: string) => {
    return (parseFloat(paid) / parseFloat(total)) * 100;
  };

  const totalToReceive = debtors?.reduce(
    (sum, debtor) => sum + calculateRemaining(debtor.totalAmount, debtor.paidAmount),
    0
  ) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Devedores</h1>
            <p className="text-muted-foreground mt-2">
              Controle valores a receber de clientes
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Devedor
          </Button>
        </div>

        {/* Total */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200" style={{height: '136px'}}>
          <CardHeader>
            <CardTitle className="text-orange-900">Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 tabular-nums">
              {formatCurrency(totalToReceive)}
            </div>
            <p className="text-sm text-orange-700 mt-1">
              {debtors?.length || 0} devedor(es) ativo(s)
            </p>
          </CardContent>
        </Card>
        
        {/* Campo de Busca */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Buscar devedor por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Lista de Devedores */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : debtors && debtors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {debtors.map((debtor) => {
              const remaining = calculateRemaining(debtor.totalAmount, debtor.paidAmount);
              const progress = calculateProgress(debtor.totalAmount, debtor.paidAmount);

              return (
                <Card key={debtor.id} style={{height: '280px'}}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{height: '23px'}}>
                    <div className="flex items-center space-x-2">
                      <Users2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-semibold">
                        {debtor.name}
                      </CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(debtor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(debtor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {debtor.description && (
                      <p className="text-sm text-muted-foreground">
                        {debtor.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(debtor.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Já Pago:</span>
                        <span className="font-medium tabular-nums text-green-600">
                          {formatCurrency(debtor.paidAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Restante:</span>
                        <span className="tabular-nums text-orange-600">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Botão Registrar Pagamento */}
                    {remaining > 0 && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleOpenPayment(debtor)}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Registrar Pagamento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum devedor cadastrado ainda.
                <br />
                Clique em "Novo Devedor" para começar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDebtor ? "Editar Devedor" : "Novo Devedor"}
              </DialogTitle>
              <DialogDescription>
                {editingDebtor
                  ? "Atualize as informações do devedor"
                  : "Registre um novo valor a receber"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Valor Total *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, totalAmount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Já Pago *</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.paidAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, paidAmount: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalhes sobre a dívida..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {formData.totalAmount && formData.paidAmount && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">A Receber:</span>
                      <span className="text-lg font-bold text-orange-600 tabular-nums">
                        {formatCurrency(
                          parseFloat(formData.totalAmount) - parseFloat(formData.paidAmount)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingDebtor ? "Atualizar" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Pagamento */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
          if (!open) resetPaymentForm();
          setIsPaymentDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                {selectedDebtor && `Registrar pagamento de ${selectedDebtor.name}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment}>
              <div className="space-y-4 py-4">
                {selectedDebtor && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(selectedDebtor.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Já Pago:</span>
                      <span className="font-medium tabular-nums text-green-600">
                        {formatCurrency(selectedDebtor.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Restante:</span>
                      <span className="tabular-nums text-orange-600">
                        {formatCurrency(calculateRemaining(selectedDebtor.totalAmount, selectedDebtor.paidAmount))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Valor do Pagamento *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Conta que Recebeu *</Label>
                  <Select
                    value={paymentData.accountId}
                    onValueChange={(value) =>
                      setPaymentData({ ...paymentData, accountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta bancária" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {formatCurrency(account.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNotes">Observações (Opcional)</Label>
                  <Textarea
                    id="paymentNotes"
                    placeholder="Notas sobre o pagamento..."
                    value={paymentData.notes}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetPaymentForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={paymentMutation.isPending}>
                  Registrar Pagamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
