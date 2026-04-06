import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bankAccountsApi, transactionsApi, bankTransfersApi } from "@/lib/api";
import { Plus, Wallet, Trash2, Edit, User } from "lucide-react";
import { toast } from "sonner";

export default function BankAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isPersonalTxDialogOpen, setIsPersonalTxDialogOpen] = useState(false);
  const [personalTxData, setPersonalTxData] = useState({ accountId: "", date: new Date().toISOString().split('T')[0], description: "", amount: "", type: "income" as "income" | "expense" });
  const [transferData, setTransferData] = useState({ fromAccountId: "", toAccountId: "", amount: "", description: "" });
  const [formData, setFormData] = useState({ name: "", balance: "", accountType: "checking" as "checking" | "savings" | "investment" | "cash" });

  const { data: accounts, isLoading } = useQuery({ queryKey: ["bankAccounts"], queryFn: bankAccountsApi.list, enabled: !!user });
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions", selectedAccountId],
    queryFn: () => transactionsApi.list({ accountId: selectedAccountId! }),
    enabled: !!selectedAccountId,
  });

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); };

  const createMutation = useMutation({ mutationFn: bankAccountsApi.create, onSuccess: () => { invalidate(); toast.success("Conta criada com sucesso!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMutation = useMutation({ mutationFn: bankAccountsApi.update, onSuccess: () => { invalidate(); toast.success("Conta atualizada!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const deleteMutation = useMutation({ mutationFn: bankAccountsApi.delete, onSuccess: () => { invalidate(); toast.success("Conta excluída!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const transferMutation = useMutation({ mutationFn: bankTransfersApi.transfer, onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Transferência realizada!"); resetTransferForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const createPersonalTxMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Lançamento pessoal registrado!"); setPersonalTxData({ accountId: "", date: new Date().toISOString().split('T')[0], description: "", amount: "", type: "income" }); setIsPersonalTxDialogOpen(false); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const resetForm = () => { setFormData({ name: "", balance: "", accountType: "checking" }); setEditingAccount(null); setIsDialogOpen(false); };
  const resetTransferForm = () => { setTransferData({ fromAccountId: "", toAccountId: "", amount: "", description: "" }); setIsTransferDialogOpen(false); };

  const handlePersonalTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalTxData.accountId || !personalTxData.amount || !personalTxData.description) { toast.error("Preencha todos os campos obrigatórios"); return; }
    createPersonalTxMutation.mutate({ accountId: parseInt(personalTxData.accountId), date: personalTxData.date, description: personalTxData.description, amount: personalTxData.amount, type: personalTxData.type, category: "personal", isPersonal: true });
  };
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) { toast.error("Preencha todos os campos"); return; }
    if (transferData.fromAccountId === transferData.toAccountId) { toast.error("Selecione contas diferentes"); return; }
    transferMutation.mutate({ fromAccountId: parseInt(transferData.fromAccountId), toAccountId: parseInt(transferData.toAccountId), amount: transferData.amount, description: transferData.description || "Transferência entre contas" });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) updateMutation.mutate({ id: editingAccount.id, ...formData });
    else createMutation.mutate(formData);
  };
  const handleEdit = (account: any) => { setEditingAccount(account); setFormData({ name: account.name, balance: account.balance, accountType: account.accountType }); setIsDialogOpen(true); };
  const handleDelete = (id: number) => { if (confirm("Tem certeza que deseja excluir esta conta?")) deleteMutation.mutate({ id }); };

  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(typeof value === 'string' ? parseFloat(value) : value);
  const accountTypeLabels: any = { checking: "Conta Corrente", savings: "Poupança", investment: "Investimento", cash: "Dinheiro" };
  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Contas Bancárias</h1><p className="text-muted-foreground mt-2">Gerencie suas contas e saldos</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPersonalTxDialogOpen(true)}><User className="mr-2 h-4 w-4" />Lançamento Pessoal</Button>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(true)}>Transferir</Button>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Conta</Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader><CardTitle className="text-blue-900">Saldo Total</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-900 tabular-nums">{formatCurrency(totalBalance)}</div><p className="text-sm text-blue-700 mt-1">{accounts?.length || 0} conta(s) ativa(s)</p></CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account: any) => (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2"><Wallet className="h-5 w-5 text-primary" /><CardTitle className="text-base font-semibold">{account.name}</CardTitle></div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedAccountId(account.id); setIsHistoryDialogOpen(true); }} title="Ver Histórico">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold tabular-nums">{formatCurrency(account.balance)}</div><p className="text-xs text-muted-foreground mt-1">{accountTypeLabels[account.accountType]}</p></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="flex flex-col items-center justify-center py-12"><Wallet className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhuma conta cadastrada ainda.<br />Clique em "Nova Conta" para começar.</p></CardContent></Card>
        )}

        {/* Dialog Criar/Editar Conta */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta"}</DialogTitle><DialogDescription>{editingAccount ? "Atualize as informações da conta bancária" : "Adicione uma nova conta bancária ao sistema"}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label htmlFor="name">Nome da Conta</Label><Input id="name" placeholder="Ex: Banco Inter PJ" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="balance">Saldo Atual</Label><Input id="balance" type="number" step="0.01" placeholder="0.00" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="accountType">Tipo de Conta</Label><Select value={formData.accountType} onValueChange={(value: any) => setFormData({ ...formData, accountType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="checking">Conta Corrente</SelectItem><SelectItem value="savings">Poupança</SelectItem><SelectItem value="investment">Investimento</SelectItem><SelectItem value="cash">Dinheiro</SelectItem></SelectContent></Select></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingAccount ? "Atualizar" : "Criar"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Histórico de Transações</DialogTitle><DialogDescription>{selectedAccountId && accounts?.find((a: any) => a.id === selectedAccountId)?.name}</DialogDescription></DialogHeader>
            <div className="space-y-4">
              {isLoadingTransactions ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              : transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1"><p className="font-medium">{t.description}</p><p className="text-sm text-muted-foreground">{(() => { const [y,m,d] = (typeof t.date === 'string' ? t.date : '').split('-'); return `${d}/${m}/${y}`; })()} - {t.type === 'income' ? 'Entrada' : 'Saída'}</p></div>
                      <div className={`text-lg font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada.</p>}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Lançamento Pessoal */}
        <Dialog open={isPersonalTxDialogOpen} onOpenChange={setIsPersonalTxDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Lançamento Pessoal</DialogTitle><DialogDescription>Registre uma entrada ou saída pessoal</DialogDescription></DialogHeader>
            <form onSubmit={handlePersonalTxSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Conta Bancária</Label><Select value={personalTxData.accountId} onValueChange={(v) => setPersonalTxData({...personalTxData, accountId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={personalTxData.date} onChange={(e) => setPersonalTxData({...personalTxData, date: e.target.value})} /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={personalTxData.type} onValueChange={(v: any) => setPersonalTxData({...personalTxData, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saída</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={personalTxData.description} onChange={(e) => setPersonalTxData({...personalTxData, description: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={personalTxData.amount} onChange={(e) => setPersonalTxData({...personalTxData, amount: e.target.value})} required /></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsPersonalTxDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={createPersonalTxMutation.isPending}>Registrar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Transferência */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Transferência entre Contas</DialogTitle><DialogDescription>Mover saldo de uma conta para outra</DialogDescription></DialogHeader>
            <form onSubmit={handleTransfer}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Conta de Origem</Label><Select value={transferData.fromAccountId} onValueChange={(v) => setTransferData({...transferData, fromAccountId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name} - {formatCurrency(a.balance)}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Conta de Destino</Label><Select value={transferData.toAccountId} onValueChange={(v) => setTransferData({...transferData, toAccountId: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={transferData.amount} onChange={(e) => setTransferData({...transferData, amount: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input value={transferData.description} onChange={(e) => setTransferData({...transferData, description: e.target.value})} placeholder="Transferência entre contas" /></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={resetTransferForm}>Cancelar</Button><Button type="submit" disabled={transferMutation.isPending}>Transferir</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
