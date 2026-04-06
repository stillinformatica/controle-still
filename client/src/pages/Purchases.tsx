import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { purchasesApi, bankAccountsApi, supplierPaymentsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart, Trash2, Edit, Check } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Purchases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(String(currentDate.getFullYear()));
  const [formData, setFormData] = useState({
    date: getCurrentDateString(), supplier: "", description: "", amount: "",
    accountId: "", status: "pending" as "pending" | "paid", dueDate: "", paidDate: "", notes: "",
  });

  const inv = () => { queryClient.invalidateQueries({ queryKey: ["purchases"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); };

  const { data: purchases, isLoading } = useQuery({ queryKey: ["purchases"], queryFn: () => purchasesApi.list(), enabled: !!user });
  const { data: accounts } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list(), enabled: !!user });

  const createMutation = useMutation({ mutationFn: purchasesApi.create, onSuccess: () => { inv(); toast.success("Compra registrada!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const updateMutation = useMutation({ mutationFn: purchasesApi.update, onSuccess: () => { inv(); toast.success("Compra atualizada!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMutation = useMutation({ mutationFn: purchasesApi.delete, onSuccess: () => { inv(); toast.success("Compra excluída!"); }, onError: (e: any) => toast.error(e.message) });

  const resetForm = () => { setFormData({ date: getCurrentDateString(), supplier: "", description: "", amount: "", accountId: "", status: "pending", dueDate: "", paidDate: "", notes: "" }); setEditingPurchase(null); setIsDialogOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { date: formData.date, supplier: formData.supplier, description: formData.description, amount: formData.amount, status: formData.status };
    if (formData.accountId) submitData.accountId = parseInt(formData.accountId);
    if (formData.dueDate) submitData.dueDate = formData.dueDate;
    if (formData.paidDate) submitData.paidDate = formData.paidDate;
    if (formData.notes) submitData.notes = formData.notes;
    if (editingPurchase) updateMutation.mutate({ id: editingPurchase.id, ...submitData });
    else createMutation.mutate(submitData);
  };

  const handleEdit = (p: any) => { setEditingPurchase(p); setFormData({ date: p.date, supplier: p.supplier, description: p.description, amount: p.amount, accountId: p.accountId?.toString() || "", status: p.status, dueDate: p.dueDate || "", paidDate: p.paidDate || "", notes: p.notes || "" }); setIsDialogOpen(true); };
  const handleDelete = (id: number) => { if (confirm("Excluir?")) deleteMutation.mutate({ id }); };
  const handleMarkAsPaid = (p: any) => { if (!p.accountId) { toast.error("Selecione uma conta"); return; } updateMutation.mutate({ id: p.id, status: "paid", paidDate: getCurrentDateString() }); };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (d: string | Date) => { if (typeof d === "string") { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; } const iso = d.toISOString().split("T")[0]; const [y, m, day] = iso.split("-"); return `${day}/${m}/${y}`; };

  const filteredPurchases = purchases?.filter((p: any) => { const ds = typeof p.date === "string" ? p.date : new Date(p.date).toISOString().split("T")[0]; const [y, m] = ds.split("-"); return m === filterMonth && y === filterYear; }) || [];
  const totalPending = filteredPurchases.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
  const totalPaid = filteredPurchases.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.amount), 0);

  const years = Array.from({ length: 6 }, (_, i) => String(currentDate.getFullYear() - 4 + i));
  const months = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-foreground">Compras</h1><p className="text-muted-foreground">Gerencie compras de fornecedores</p></div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterMonth} onValueChange={setFilterMonth}><SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
            <Select value={filterYear} onValueChange={setFilterYear}><SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Compra</Button>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Pagamento</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">A Pagar</CardTitle><ShoppingCart className="h-4 w-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div><p className="text-xs text-muted-foreground mt-1">{filteredPurchases.filter((p: any) => p.status === "pending").length} pendente(s)</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pagas</CardTitle><Check className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalPending + totalPaid)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Compras — {months.find(m => m.value === filterMonth)?.label} {filterYear}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            : filteredPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Fornecedor</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredPurchases.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">{p.supplier}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{p.description}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                        <TableCell><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === "paid" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>{p.status === "paid" ? "Paga" : "Pendente"}</span></TableCell>
                        <TableCell>{p.dueDate ? formatDate(p.dueDate) : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {p.status === "pending" && <Button variant="ghost" size="icon" onClick={() => handleMarkAsPaid(p)} title="Marcar como pago"><Check className="h-4 w-4 text-green-600" /></Button>}
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12"><ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhuma compra neste período.</p></div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open) setIsDialogOpen(true); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPurchase ? "Editar Compra" : "Nova Compra"}</DialogTitle><DialogDescription>{editingPurchase ? "Atualize as informações" : "Registre uma nova compra"}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="paid">Paga</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Fornecedor</Label><Input placeholder="Nome do fornecedor" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição da compra" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Conta</Label><Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
                  {formData.status === "paid" && <div className="space-y-2"><Label>Data Pagamento</Label><Input type="date" value={formData.paidDate} onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })} /></div>}
                </div>
                <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingPurchase ? "Atualizar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { if (open) setIsPaymentDialogOpen(true); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Pagamento de Compra</DialogTitle><DialogDescription>Registre um pagamento</DialogDescription></DialogHeader>
            <PaymentForm accounts={accounts} purchases={purchases} onClose={() => setIsPaymentDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function PaymentForm({ accounts, purchases, onClose }: { accounts: any; purchases: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [paymentForm, setPaymentForm] = useState({ purchaseId: "", amount: "", accountId: "", notes: "" });

  const createPaymentMutation = useMutation({
    mutationFn: supplierPaymentsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["purchases"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); toast.success("Pagamento registrado!"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.purchaseId || !paymentForm.amount || !paymentForm.accountId) { toast.error("Preencha todos os campos"); return; }
    const purchase = purchases?.find((p: any) => p.id === parseInt(paymentForm.purchaseId));
    if (!purchase) return;
    createPaymentMutation.mutate({ supplierName: purchase.supplier, amount: paymentForm.amount, accountId: parseInt(paymentForm.accountId), date: getCurrentDateString(), notes: paymentForm.notes });
  };

  const pendingPurchases = purchases?.filter((p: any) => p.status === "pending") || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Compra *</Label><Select value={paymentForm.purchaseId} onValueChange={(v) => setPaymentForm({ ...paymentForm, purchaseId: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{pendingPurchases.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.supplier} - {p.description} - R$ {p.amount}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Valor *</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
      <div><Label>Banco *</Label><Select value={paymentForm.accountId} onValueChange={(v) => setPaymentForm({ ...paymentForm, accountId: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{accounts?.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Observações</Label><Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={createPaymentMutation.isPending}>{createPaymentMutation.isPending ? "Registrando..." : "Registrar"}</Button>
      </div>
    </form>
  );
}
