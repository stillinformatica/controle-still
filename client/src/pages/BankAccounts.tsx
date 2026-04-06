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
import { trpc } from "@/lib/trpc";
import { Plus, Wallet, Trash2, Edit, User } from "lucide-react";
import { toast } from "sonner";

export default function BankAccounts() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isPersonalTxDialogOpen, setIsPersonalTxDialogOpen] = useState(false);
  const [personalTxData, setPersonalTxData] = useState({
    accountId: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    type: "income" as "income" | "expense",
  });
  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    accountType: "checking" as "checking" | "savings" | "investment" | "cash",
  });

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.bankAccounts.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: transactions, isLoading: isLoadingTransactions } = trpc.transactions.list.useQuery(
    { accountId: selectedAccountId! },
    { enabled: !!selectedAccountId }
  );

  const createMutation = trpc.bankAccounts.create.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Conta criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar conta: " + error.message);
    },
  });

  const updateMutation = trpc.bankAccounts.update.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Conta atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar conta: " + error.message);
    },
  });

  const deleteMutation = trpc.bankAccounts.delete.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Conta excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir conta: " + error.message);
    },
  });

  const transferMutation = trpc.bankTransfers.transfer.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      utils.transactions.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Transferência realizada com sucesso!");
      resetTransferForm();
    },
    onError: (error) => {
      toast.error("Erro ao realizar transferência: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", balance: "", accountType: "checking" });
    setEditingAccount(null);
    setIsDialogOpen(false);
  };

  const createPersonalTxMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.bankAccounts.list.invalidate();
      utils.transactions.list.invalidate();
      toast.success("Lançamento pessoal registrado!");
      setPersonalTxData({ accountId: "", date: new Date().toISOString().split('T')[0], description: "", amount: "", type: "income" });
      setIsPersonalTxDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao registrar lançamento: " + error.message);
    },
  });

  const handlePersonalTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalTxData.accountId || !personalTxData.amount || !personalTxData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createPersonalTxMutation.mutate({
      accountId: parseInt(personalTxData.accountId),
      date: personalTxData.date,
      description: personalTxData.description,
      amount: personalTxData.amount,
      type: personalTxData.type,
      category: "personal",
      isPersonal: true,
    });
  };

  const resetTransferForm = () => {
    setTransferData({
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      description: "",
    });
    setIsTransferDialogOpen(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (transferData.fromAccountId === transferData.toAccountId) {
      toast.error("Selecione contas diferentes para transferência");
      return;
    }
    
    transferMutation.mutate({
      fromAccountId: parseInt(transferData.fromAccountId),
      toAccountId: parseInt(transferData.toAccountId),
      amount: transferData.amount,
      description: transferData.description || "Transferência entre contas",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      updateMutation.mutate({
        id: editingAccount.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance,
      accountType: account.accountType,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const accountTypeLabels = {
    checking: "Conta Corrente",
    savings: "Poupança",
    investment: "Investimento",
    cash: "Dinheiro",
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas Bancárias</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas contas e saldos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPersonalTxDialogOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Lançamento Pessoal
            </Button>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Transferir
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Total */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 tabular-nums">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {accounts?.length || 0} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        {/* Lista de Contas */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      {account.name}
                    </CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsHistoryDialogOpen(true);
                      }}
                      title="Ver Histórico"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                    {formatCurrency(account.balance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accountTypeLabels[account.accountType as keyof typeof accountTypeLabels]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma conta cadastrada ainda.
                <br />
                Clique em "Nova Conta" para começar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
              <DialogDescription>
                {editingAccount
                  ? "Atualize as informações da conta bancária"
                  : "Adicione uma nova conta bancária ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Banco Inter PJ"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Atual</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de Conta</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAccount ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Transações</DialogTitle>
              <DialogDescription>
                {selectedAccountId && accounts?.find(a => a.id === selectedAccountId)?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const dateStr = typeof transaction.date === 'string' ? transaction.date : transaction.date.toISOString().split('T')[0];
                            const [year, month, day] = dateStr.split('-');
                            return `${day}/${month}/${year}`;
                          })()} - {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                        </p>
                      </div>
                      <div className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação encontrada para esta conta.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Lançamento Pessoal */}
        <Dialog open={isPersonalTxDialogOpen} onOpenChange={setIsPersonalTxDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lançamento Pessoal</DialogTitle>
              <DialogDescription>
                Registre uma entrada ou saída pessoal que não interfere no lucro da empresa (ex: aluguel recebido, retirada pessoal)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePersonalTxSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select value={personalTxData.accountId} onValueChange={(v) => setPersonalTxData({ ...personalTxData, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={personalTxData.type} onValueChange={(v: any) => setPersonalTxData({ ...personalTxData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Entrada (ex: aluguel recebido)</SelectItem>
                      <SelectItem value="expense">Saída (ex: retirada pessoal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Ex: Aluguel recebido" value={personalTxData.description} onChange={(e) => setPersonalTxData({ ...personalTxData, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={personalTxData.amount} onChange={(e) => setPersonalTxData({ ...personalTxData, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={personalTxData.date} onChange={(e) => setPersonalTxData({ ...personalTxData, date: e.target.value })} required />
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Este lançamento <strong>não será contabilizado no lucro</strong> da empresa. Será marcado como pessoal no histórico.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPersonalTxDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createPersonalTxMutation.isPending}>Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Transferência */}
        <Dialog open={isTransferDialogOpen} onOpenChange={(open) => {
          if (!open) resetTransferForm();
          setIsTransferDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferência entre Contas</DialogTitle>
              <DialogDescription>
                Transfira valores entre suas contas bancárias
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransfer}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fromAccount">De (Conta de Origem)</Label>
                  <Select
                    value={transferData.fromAccountId}
                    onValueChange={(value) =>
                      setTransferData({ ...transferData, fromAccountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta de origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {formatCurrency(account.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toAccount">Para (Conta de Destino)</Label>
                  <Select
                    value={transferData.toAccountId}
                    onValueChange={(value) =>
                      setTransferData({ ...transferData, toAccountId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {formatCurrency(account.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferData.amount}
                    onChange={(e) =>
                      setTransferData({ ...transferData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Motivo da transferência"
                    value={transferData.description}
                    onChange={(e) =>
                      setTransferData({ ...transferData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetTransferForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={transferMutation.isPending}>
                  Transferir
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
