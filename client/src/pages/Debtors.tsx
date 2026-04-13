import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { debtorsApi, bankAccountsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users2, Trash2, Edit, DollarSign, History } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Debtors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyDebtor, setHistoryDebtor] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ amount: "", accountId: "", notes: "" });
  const [formData, setFormData] = useState({ name: "", totalAmount: "", paidAmount: "", description: "" });

  const { data: allDebtors, isLoading } = useQuery({ queryKey: ["debtors"], queryFn: () => debtorsApi.list(), enabled: !!user });
  const debtors = useMemo(() => {
    if (!allDebtors) return allDebtors;
    // Group debtors by name (case-insensitive)
    const grouped = new Map<string, any>();
    for (const d of allDebtors) {
      const key = d.name.trim().toUpperCase();
      if (grouped.has(key)) {
        const existing = grouped.get(key);
        existing.totalAmount = (parseFloat(existing.totalAmount) + parseFloat(d.totalAmount)).toString();
        existing.paidAmount = (parseFloat(existing.paidAmount) + parseFloat(d.paidAmount)).toString();
        existing.remainingAmount = (parseFloat(existing.remainingAmount) + parseFloat(d.remainingAmount)).toString();
        existing._ids.push(d.id);
        if (d.description && !existing.description?.includes(d.description)) {
          existing.description = existing.description ? `${existing.description}; ${d.description}` : d.description;
        }
      } else {
        grouped.set(key, { ...d, _ids: [d.id] });
      }
    }
    let filtered = Array.from(grouped.values()).filter((d: any) => parseFloat(d.remainingAmount) > 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((d: any) => d.name.toLowerCase().includes(q));
    }
    return filtered.sort((a: any, b: any) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [allDebtors, searchQuery]);
  const { data: bankAccounts } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list(), enabled: !!user });

  const { data: debtorPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["debtorPayments", historyDebtor?._ids],
    queryFn: () => debtorsApi.listPaymentsByIds({ debtorIds: historyDebtor._ids }),
    enabled: !!historyDebtor?._ids?.length,
  });

  const { data: debtorSales, isLoading: isLoadingSales } = useQuery({
    queryKey: ["debtorSales", historyDebtor?.name],
    queryFn: () => debtorsApi.listSalesByCustomer({ customerName: historyDebtor.name }),
    enabled: !!historyDebtor?.name,
  });

  const inv = () => { queryClient.invalidateQueries({ queryKey: ["debtors"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); };
  const createMutation = useMutation({ mutationFn: debtorsApi.create, onSuccess: () => { inv(); toast.success("Devedor registrado!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const updateMutation = useMutation({ mutationFn: debtorsApi.update, onSuccess: () => { inv(); toast.success("Devedor atualizado!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMutation = useMutation({ mutationFn: debtorsApi.delete, onSuccess: () => { inv(); toast.success("Devedor excluído!"); }, onError: (e: any) => toast.error(e.message) });
  const paymentMutation = useMutation({ mutationFn: debtorsApi.createPayment, onSuccess: () => { inv(); queryClient.invalidateQueries({ queryKey: ["debtorPayments"] }); toast.success("Pagamento registrado!"); resetPaymentForm(); }, onError: (e: any) => toast.error(e.message) });

  const resetForm = () => { setFormData({ name: "", totalAmount: "", paidAmount: "", description: "" }); setEditingDebtor(null); setIsDialogOpen(false); };
  const resetPaymentForm = () => { setPaymentData({ amount: "", accountId: "", notes: "" }); setSelectedDebtor(null); setIsPaymentDialogOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDebtor) updateMutation.mutate({ id: editingDebtor.id, ...formData });
    else createMutation.mutate(formData);
  };

  const handleEdit = (debtor: any) => { setEditingDebtor(debtor); setFormData({ name: debtor.name, totalAmount: debtor.totalAmount, paidAmount: debtor.paidAmount, description: debtor.description || "" }); setIsDialogOpen(true); };
  const handleDelete = (debtor: any) => {
    if (confirm("Excluir?")) {
      // Delete all grouped debtor records
      for (const id of (debtor._ids || [debtor.id])) {
        deleteMutation.mutate({ id });
      }
    }
  };
  const handleOpenPayment = (debtor: any) => { setSelectedDebtor(debtor); setIsPaymentDialogOpen(true); };
  const handleOpenHistory = (debtor: any) => { setHistoryDebtor(debtor); setIsHistoryDialogOpen(true); };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) { toast.error("Informe um valor válido"); return; }
    if (!paymentData.accountId) { toast.error("Selecione a conta bancária"); return; }
    const remaining = parseFloat(selectedDebtor.totalAmount) - parseFloat(selectedDebtor.paidAmount);
    if (parseFloat(paymentData.amount) > remaining) { toast.error(`Valor maior que o restante`); return; }
    paymentMutation.mutate({ debtorId: selectedDebtor.id, date: getCurrentDateString(), amount: paymentData.amount, accountId: parseInt(paymentData.accountId), notes: paymentData.notes || undefined });
  };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (dateString: string) => { const [y, m, d] = dateString.split('-'); return `${d}/${m}/${y}`; };
  const calcRemaining = (t: string, p: string) => parseFloat(t) - parseFloat(p);
  const calcProgress = (t: string, p: string) => (parseFloat(p) / parseFloat(t)) * 100;
  const totalToReceive = debtors?.reduce((s: number, d: any) => s + calcRemaining(d.totalAmount, d.paidAmount), 0) || 0;

  const historyItems = useMemo(() => {
    const items: Array<{ date: string; type: 'sale' | 'payment'; description: string; amount: number; notes?: string }> = [];
    if (debtorSales) {
      for (const sale of debtorSales) {
        items.push({ date: sale.date, type: 'sale', description: sale.description, amount: parseFloat(sale.amount) });
      }
    }
    if (debtorPayments) {
      for (const payment of debtorPayments) {
        items.push({ date: payment.date, type: 'payment', description: payment.notes || 'Pagamento', amount: parseFloat(payment.amount) });
      }
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debtorSales, debtorPayments]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Devedores</h1><p className="text-muted-foreground mt-2">Controle valores a receber</p></div>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Devedor</Button>
        </div>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200" style={{height: '136px'}}>
          <CardHeader><CardTitle className="text-orange-900">Total a Receber</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 tabular-nums">{formatCurrency(totalToReceive)}</div>
            <p className="text-sm text-orange-700 mt-1">{debtors?.length || 0} devedor(es)</p>
          </CardContent>
        </Card>

        <Input type="text" placeholder="Buscar devedor por nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />

        {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        : debtors && debtors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {debtors.map((debtor: any) => {
              const remaining = calcRemaining(debtor.totalAmount, debtor.paidAmount);
              const progress = calcProgress(debtor.totalAmount, debtor.paidAmount);
              return (
                <Card key={debtor.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2"><Users2 className="h-5 w-5 text-primary" /><CardTitle className="text-base font-semibold">{debtor.name}</CardTitle></div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(debtor)} title="Histórico"><History className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(debtor)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(debtor)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {debtor.description && <p className="text-sm text-muted-foreground">{debtor.description}</p>}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Valor Total:</span><span className="font-medium tabular-nums">{formatCurrency(debtor.totalAmount)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Já Pago:</span><span className="font-medium tabular-nums text-green-600">{formatCurrency(debtor.paidAmount)}</span></div>
                      <div className="flex justify-between text-sm font-semibold"><span>Restante:</span><span className="tabular-nums text-orange-600">{formatCurrency(remaining)}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span>{progress.toFixed(0)}%</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                    </div>
                    {remaining > 0 && <Button className="w-full" variant="outline" onClick={() => handleOpenPayment(debtor)}><DollarSign className="mr-2 h-4 w-4" />Registrar Pagamento</Button>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="flex flex-col items-center justify-center py-12"><Users2 className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum devedor cadastrado.</p></CardContent></Card>
        )}

        {/* Dialog Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingDebtor ? "Editar Devedor" : "Novo Devedor"}</DialogTitle><DialogDescription>{editingDebtor ? "Atualize as informações" : "Registre um novo valor a receber"}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nome *</Label><Input placeholder="Ex: João Silva" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor Total *</Label><Input type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Já Pago *</Label><Input type="number" step="0.01" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })} required /></div>
                </div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                {formData.totalAmount && formData.paidAmount && (
                  <div className="p-4 bg-muted rounded-lg"><div className="flex justify-between"><span className="text-sm font-medium">A Receber:</span><span className="text-lg font-bold text-orange-600 tabular-nums">{formatCurrency(parseFloat(formData.totalAmount) - parseFloat(formData.paidAmount))}</span></div></div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingDebtor ? "Atualizar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Pagamento */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { if (!open) resetPaymentForm(); setIsPaymentDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle><DialogDescription>{selectedDebtor && `Pagamento de ${selectedDebtor.name}`}</DialogDescription></DialogHeader>
            <form onSubmit={handlePayment}>
              <div className="space-y-4 py-4">
                {selectedDebtor && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm"><span>Valor Total:</span><span className="font-medium tabular-nums">{formatCurrency(selectedDebtor.totalAmount)}</span></div>
                    <div className="flex justify-between text-sm"><span>Já Pago:</span><span className="text-green-600 tabular-nums">{formatCurrency(selectedDebtor.paidAmount)}</span></div>
                    <div className="flex justify-between text-sm font-semibold"><span>Restante:</span><span className="text-orange-600 tabular-nums">{formatCurrency(calcRemaining(selectedDebtor.totalAmount, selectedDebtor.paidAmount))}</span></div>
                  </div>
                )}
                <div className="space-y-2"><Label>Valor do Pagamento *</Label><Input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Conta que Recebeu *</Label>
                  <Select value={paymentData.accountId} onValueChange={(v) => setPaymentData({ ...paymentData, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{bankAccounts?.map((a: any) => (<SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Observações</Label><Textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} rows={2} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetPaymentForm}>Cancelar</Button>
                <Button type="submit" disabled={paymentMutation.isPending}>Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => { if (!open) { setHistoryDebtor(null); } setIsHistoryDialogOpen(open); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico - {historyDebtor?.name}</DialogTitle>
              <DialogDescription>Compras e pagamentos do cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(isLoadingPayments || isLoadingSales) ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : historyItems.length > 0 ? (
                <div className="space-y-2">
                  {historyItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {item.type === 'sale' ? 'Compra' : 'Pagamento'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                        </div>
                        <p className="text-sm mt-1 truncate">{item.description}</p>
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ml-3 ${item.type === 'sale' ? 'text-blue-600' : 'text-green-600'}`}>
                        {item.type === 'payment' ? '+' : ''}{formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}