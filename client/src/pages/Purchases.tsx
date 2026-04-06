import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, ShoppingCart, Trash2, Edit, Check } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Purchases() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(String(currentDate.getFullYear()));
  const [formData, setFormData] = useState({
    date: getCurrentDateString(),
    supplier: "",
    description: "",
    amount: "",
    accountId: "",
    status: "pending" as "pending" | "paid",
    dueDate: "",
    paidDate: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: purchases, isLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: accounts } = trpc.bankAccounts.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.purchases.create.useMutation({
    onSuccess: () => {
      utils.purchases.list.invalidate();
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Compra registrada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao registrar compra: " + error.message);
    },
  });

  const updateMutation = trpc.purchases.update.useMutation({
    onSuccess: () => {
      utils.purchases.list.invalidate();
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Compra atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar compra: " + error.message);
    },
  });

  const deleteMutation = trpc.purchases.delete.useMutation({
    onSuccess: () => {
      utils.purchases.list.invalidate();
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Compra excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir compra: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      date: getCurrentDateString(),
      supplier: "",
      description: "",
      amount: "",
      accountId: "",
      status: "pending",
      dueDate: "",
      paidDate: "",
      notes: "",
    });
    setEditingPurchase(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      date: formData.date,
      supplier: formData.supplier,
      description: formData.description,
      amount: formData.amount,
      status: formData.status,
    };

    if (formData.accountId) submitData.accountId = parseInt(formData.accountId);
    if (formData.dueDate) submitData.dueDate = formData.dueDate;
    if (formData.paidDate) submitData.paidDate = formData.paidDate;
    if (formData.notes) submitData.notes = formData.notes;
    
    if (editingPurchase) {
      updateMutation.mutate({
        id: editingPurchase.id,
        ...submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (purchase: any) => {
    setEditingPurchase(purchase);
    setFormData({
      date: purchase.date,
      supplier: purchase.supplier,
      description: purchase.description,
      amount: purchase.amount,
      accountId: purchase.accountId?.toString() || "",
      status: purchase.status,
      dueDate: purchase.dueDate || "",
      paidDate: purchase.paidDate || "",
      notes: purchase.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta compra?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleMarkAsPaid = (purchase: any) => {
    if (!purchase.accountId) {
      toast.error("Selecione uma conta para marcar como pago");
      return;
    }
    updateMutation.mutate({
      id: purchase.id,
      status: "paid",
      paidDate: getCurrentDateString(),
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatDate = (date: string | Date) => {
    // Parsing manual da string de data para evitar problemas de timezone
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    // Se for Date object, converte para string ISO e faz parsing
    const isoString = date.toISOString().split('T')[0];
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtrar compras pelo mês/ano selecionado
  const filteredPurchases = purchases?.filter(p => {
    const dateStr = typeof p.date === 'string' ? p.date : new Date(p.date).toISOString().split('T')[0];
    const [year, month] = dateStr.split('-');
    return month === filterMonth && year === filterYear;
  }) || [];

  const totalPending = filteredPurchases.filter(p => p.status === "pending")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  
  const totalPaid = filteredPurchases.filter(p => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  // Gerar lista de anos disponíveis (últimos 5 anos + próximo)
  const years = Array.from({ length: 6 }, (_, i) => String(currentDate.getFullYear() - 4 + i));
  const months = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compras</h1>
            <p className="text-muted-foreground">
              Gerencie compras de fornecedores e contas a pagar
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Mês */}
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[90px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Compra
            </Button>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pagamento
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredPurchases.filter(p => p.status === "pending").length} compra(s) pendente(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredPurchases.filter(p => p.status === "paid").length} compra(s) paga(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalPending + totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredPurchases.length} compra(s) registrada(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Compras */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Compras — {months.find(m => m.value === filterMonth)?.label} {filterYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPurchases.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[90px]">Data</TableHead>
                    <TableHead className="min-w-[120px]">Fornecedor</TableHead>
                    <TableHead className="min-w-[150px]">Descrição</TableHead>
                    <TableHead className="min-w-[100px]">Valor</TableHead>
                    <TableHead className="min-w-[90px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Vencimento</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(purchase.date)}</TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">{purchase.supplier}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={purchase.description}>{purchase.description}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(purchase.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          purchase.status === "paid" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {purchase.status === "paid" ? "Paga" : "Pendente"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {purchase.dueDate ? formatDate(purchase.dueDate) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {purchase.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsPaid(purchase)}
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(purchase)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(purchase.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma compra em {months.find(m => m.value === filterMonth)?.label} de {filterYear}.
                  <br />
                  Altere o filtro de mês ou clique em "Nova Compra".
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          // Não fechar ao clicar fora — só via botão Cancelar ou Salvar
          if (open) setIsDialogOpen(true);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPurchase ? "Editar Compra" : "Nova Compra"}
              </DialogTitle>
              <DialogDescription>
                {editingPurchase
                  ? "Atualize as informações da compra"
                  : "Registre uma nova compra de fornecedor"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data da Compra</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Paga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    placeholder="Nome do fornecedor"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição da compra"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountId">
                      Conta {formData.status === "paid" ? "que Pagou" : "(Opcional)"}
                    </Label>
                    <Select
                      value={formData.accountId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, accountId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                  {formData.status === "paid" && (
                    <div className="space-y-2">
                      <Label htmlFor="paidDate">Data de Pagamento</Label>
                      <Input
                        id="paidDate"
                        type="date"
                        value={formData.paidDate}
                        onChange={(e) =>
                          setFormData({ ...formData, paidDate: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações adicionais"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPurchase ? "Atualizar" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Novo Pagamento */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
          // Não fechar ao clicar fora — só via botão Cancelar ou Salvar
          if (open) setIsPaymentDialogOpen(true);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Pagamento de Compra</DialogTitle>
              <DialogDescription>
                Registre um pagamento parcial ou total de uma compra
              </DialogDescription>
            </DialogHeader>
            <PaymentForm onClose={() => setIsPaymentDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Componente de formulário de pagamento
function PaymentForm({ onClose }: { onClose: () => void }) {
  const [paymentForm, setPaymentForm] = useState({
    purchaseId: "",
    amount: "",
    accountId: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: purchases = [] } = trpc.purchases.list.useQuery();
  const { data: bankAccounts = [] } = trpc.bankAccounts.list.useQuery();

  const createPaymentMutation = trpc.suppliers.createPayment.useMutation({
    onSuccess: () => {
      utils.purchases.list.invalidate();
      utils.bankAccounts.list.invalidate();
      toast.success("Pagamento registrado com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.purchaseId || !paymentForm.amount || !paymentForm.accountId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const purchase = purchases.find(p => p.id === parseInt(paymentForm.purchaseId));
    if (!purchase) {
      toast.error("Compra não encontrada");
      return;
    }

    createPaymentMutation.mutate({
      supplierName: purchase.supplier,
      amount: paymentForm.amount,
      accountId: parseInt(paymentForm.accountId),
      date: getCurrentDateString() as any,
      notes: paymentForm.notes,
    });
  };

  // Filtrar apenas compras pendentes
  const pendingPurchases = purchases.filter(p => p.status === "pending");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="purchase">Compra *</Label>
        <Select
          value={paymentForm.purchaseId}
          onValueChange={(value) => setPaymentForm({ ...paymentForm, purchaseId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a compra" />
          </SelectTrigger>
          <SelectContent>
            {pendingPurchases.map((purchase) => (
              <SelectItem key={purchase.id} value={purchase.id.toString()}>
                {purchase.supplier} - {purchase.description} - R$ {purchase.amount}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="payment-amount">Valor *</Label>
        <Input
          id="payment-amount"
          type="number"
          step="0.01"
          value={paymentForm.amount}
          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <Label htmlFor="payment-account">Banco *</Label>
        <Select
          value={paymentForm.accountId}
          onValueChange={(value) => setPaymentForm({ ...paymentForm, accountId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o banco" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id.toString()}>
                {account.name} - R$ {account.balance}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="payment-notes">Observações</Label>
        <Textarea
          id="payment-notes"
          value={paymentForm.notes}
          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          placeholder="Informações adicionais"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createPaymentMutation.isPending}>
          {createPaymentMutation.isPending ? "Registrando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
