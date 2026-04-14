import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { expensesApi, bankAccountsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Expenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [formData, setFormData] = useState({
    date: getCurrentDateString(), description: "", amount: "",
    category: "outras" as any, accountId: "", dueDate: "", isPaid: true, isRecurring: false,
  });

  const { data: allExpenses, isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => expensesApi.list(), enabled: !!user });
  const expenses = useMemo(() => {
    if (!allExpenses || showAllPeriods) return allExpenses;
    return allExpenses.filter((expense: any) => {
      const d = new Date(expense.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
    });
  }, [allExpenses, selectedMonth, showAllPeriods]);
  const { data: accounts } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list(), enabled: !!user });

  const createMutation = useMutation({ mutationFn: expensesApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Despesa registrada!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMutation = useMutation({ mutationFn: expensesApi.update, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Despesa atualizada!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const deleteMutation = useMutation({ mutationFn: expensesApi.delete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["expenses"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); queryClient.invalidateQueries({ queryKey: ["bankAccounts"] }); queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Despesa excluída!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const resetForm = () => { setFormData({ date: getCurrentDateString(), description: "", amount: "", category: "outras", accountId: "", dueDate: "", isPaid: true, isRecurring: false }); setEditingExpense(null); setIsDialogOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { date: formData.date, description: formData.description, amount: formData.amount, category: formData.category, isPaid: formData.isPaid, isRecurring: formData.isRecurring };
    if (formData.accountId) submitData.accountId = parseInt(formData.accountId);
    if (formData.dueDate) submitData.dueDate = formData.dueDate;
    if (editingExpense) updateMutation.mutate({ id: editingExpense.id, ...submitData });
    else createMutation.mutate(submitData);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({ date: expense.date, description: expense.description, amount: expense.amount, category: expense.category, accountId: expense.accountId?.toString() || "", dueDate: expense.dueDate || "", isPaid: expense.isPaid, isRecurring: expense.isRecurring });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => { if (confirm("Excluir esta despesa?")) deleteMutation.mutate({ id }); };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (ds: string | Date | null) => {
    if (!ds) return "-";
    if (typeof ds === 'string') { const [y, m, d] = ds.split('-'); return `${d}/${m}/${y}`; }
    const iso = ds.toISOString().split('T')[0]; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`;
  };

  const categoryLabels: Record<string, string> = { casa: "Casa", still: "Still", fixas: "Fixas", mercado: "Mercado", superfluos: "Supérfluos", outras: "Outras" };
  const totalExpenses = expenses?.reduce((s: number, e: any) => s + parseFloat(e.amount), 0) || 0;
  const expensesByCategory = expenses?.reduce((acc: Record<string, number>, e: any) => { acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount); return acc; }, {}) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Despesas</h1><p className="text-muted-foreground mt-2">Controle suas despesas e contas a pagar</p></div>
          <div className="flex gap-2 items-center">
            <Label htmlFor="month-filter" className="text-sm whitespace-nowrap">Período:</Label>
            <Input id="month-filter" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" disabled={showAllPeriods} />
            <Button variant={showAllPeriods ? "default" : "outline"} size="sm" onClick={() => setShowAllPeriods(!showAllPeriods)}>{showAllPeriods ? "Filtrar" : "Todos"}</Button>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-full md:col-span-1"><CardHeader><CardTitle className="text-sm font-medium">Total de Despesas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(totalExpenses)}</div></CardContent></Card>
          {Object.entries(categoryLabels).slice(0, 3).map(([key, label]) => (
            <Card key={key}><CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold tabular-nums">{formatCurrency(expensesByCategory[key] || 0)}</div></CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Histórico de Despesas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            : expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expenses.map((expense: any) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{categoryLabels[expense.category] || expense.category}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-red-600">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{formatDate(expense.dueDate)}</TableCell>
                        <TableCell><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expense.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{expense.isPaid ? "Pago" : "Pendente"}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12"><Receipt className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhuma despesa registrada.</p></div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle><DialogDescription>{editingExpense ? "Atualize as informações" : "Registre uma nova despesa"}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Descrição *</Label><Input placeholder="Ex: Conta de luz" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor *</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Categoria *</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="casa">Casa</SelectItem><SelectItem value="still">Still</SelectItem><SelectItem value="fixas">Fixas</SelectItem><SelectItem value="mercado">Mercado</SelectItem><SelectItem value="superfluos">Supérfluos</SelectItem><SelectItem value="outras">Outras</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data *</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Conta que Pagou</Label>
                  <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
                    <SelectContent>{accounts?.map((a: any) => (<SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2"><Checkbox id="isPaid" checked={formData.isPaid} onCheckedChange={(c) => setFormData({ ...formData, isPaid: c as boolean })} /><Label htmlFor="isPaid" className="cursor-pointer">Já foi paga</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="isRecurring" checked={formData.isRecurring} onCheckedChange={(c) => setFormData({ ...formData, isRecurring: c as boolean })} /><Label htmlFor="isRecurring" className="cursor-pointer">Despesa recorrente</Label></div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingExpense ? "Atualizar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
