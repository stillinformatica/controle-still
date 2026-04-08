import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";
import { Plus, Truck, Trash2, Edit, History } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", contact: "", phone: "", email: "", notes: "" });
  const [historySupplier, setHistorySupplier] = useState<any>(null);

  const { data: suppliers, isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list, enabled: !!user });
  const createMutation = useMutation({ mutationFn: suppliersApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor cadastrado!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMutation = useMutation({ mutationFn: suppliersApi.update, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor atualizado!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const deleteMutation = useMutation({ mutationFn: suppliersApi.delete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor excluído!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const { data: purchases } = useQuery({
    queryKey: ["supplier-purchases", historySupplier?.name],
    queryFn: () => suppliersApi.getPurchases(historySupplier.name),
    enabled: !!historySupplier,
  });
  const { data: payments } = useQuery({
    queryKey: ["supplier-payments", historySupplier?.name],
    queryFn: () => suppliersApi.getPayments(historySupplier.name),
    enabled: !!historySupplier,
  });

  const resetForm = () => { setFormData({ name: "", contact: "", phone: "", email: "", notes: "" }); setEditingSupplier(null); setIsDialogOpen(false); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, ...formData }); else createMutation.mutate(formData); };
  const handleEdit = (s: any) => { setEditingSupplier(s); setFormData({ name: s.name, contact: "", phone: s.phone || "", email: s.email || "", notes: s.notes || "" }); setIsDialogOpen(true); };
  const handleDelete = (id: number) => { if (confirm("Excluir este fornecedor?")) deleteMutation.mutate({ id }); };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (ds: string) => { const [y, m, d] = ds.split("-"); return `${d}/${m}/${y}`; };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Fornecedores</h1><p className="text-muted-foreground mt-2">Gerencie seus fornecedores</p></div><Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Fornecedor</Button></div>
        <Card><CardHeader><CardTitle>Lista de Fornecedores</CardTitle></CardHeader><CardContent>
          {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
          : suppliers && suppliers.length > 0 ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
              {[...suppliers].sort((a: any, b: any) => a.name.localeCompare(b.name, 'pt-BR')).map((s: any) => (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.phone || "-"}</TableCell><TableCell>{s.email || "-"}</TableCell><TableCell className="text-right"><div className="flex justify-end space-x-1"><Button variant="ghost" size="icon" onClick={() => setHistorySupplier(s)} title="Histórico"><History className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>))}
            </TableBody></Table></div>
          ) : <div className="flex flex-col items-center justify-center py-12"><Truck className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum fornecedor cadastrado.</p></div>}
        </CardContent></Card>

        {/* Dialog de formulário */}
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if (o) setIsDialogOpen(true); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingSupplier ? "Editar" : "Novo"} Fornecedor</DialogTitle><DialogDescription>Preencha as informações do fornecedor</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit}><div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div></div><div className="space-y-2"><Label>Observações</Label><Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingSupplier ? "Salvar" : "Cadastrar"}</Button></DialogFooter></form>
        </DialogContent></Dialog>

        {/* Dialog de histórico */}
        <Dialog open={!!historySupplier} onOpenChange={(o) => { if (!o) setHistorySupplier(null); }}>
          <DialogContent className="!max-w-none w-screen h-screen max-h-screen overflow-y-auto rounded-none p-6">
            <DialogHeader>
              <DialogTitle>Histórico - {historySupplier?.name}</DialogTitle>
              <DialogDescription>Compras e pagamentos deste fornecedor</DialogDescription>
            </DialogHeader>
            {(() => {
              const totalPurchases = (purchases || []).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
              const totalPayments = (payments || []).reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
              const balance = totalPurchases - totalPayments;
              
              // Build combined timeline sorted by date, then creation time, ensuring carry-over entries come first
              const allEntries = [
                ...(purchases || []).map((p: any) => ({
                  ...p,
                  type: 'purchase' as const,
                  sortDate: p.date,
                  sortCreatedAt: p.createdAt || '',
                  sortPriority: String(p.description || '').trim().toUpperCase() === 'ANTERIOR' ? 0 : 1,
                })),
                ...(payments || []).map((p: any) => ({
                  ...p,
                  type: 'payment' as const,
                  sortDate: p.date,
                  sortCreatedAt: p.createdAt || '',
                  sortPriority: 2,
                })),
              ].sort((a, b) => {
                const byDate = a.sortDate.localeCompare(b.sortDate);
                if (byDate !== 0) return byDate;
                const byPriority = a.sortPriority - b.sortPriority;
                if (byPriority !== 0) return byPriority;
                const byCreatedAt = a.sortCreatedAt.localeCompare(b.sortCreatedAt);
                if (byCreatedAt !== 0) return byCreatedAt;
                return a.id - b.id;
              });
              
              let runningBalance = 0;
              const entriesWithBalance = allEntries.map((e) => {
                if (e.type === 'purchase') runningBalance += parseFloat(e.amount);
                else runningBalance -= parseFloat(e.amount);
                return { ...e, balance: runningBalance };
              }).reverse();

              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-xs text-muted-foreground">Total Compras</p><p className="text-lg font-bold text-destructive">{formatCurrency(totalPurchases)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-xs text-muted-foreground">Total Pagamentos</p><p className="text-lg font-bold text-green-600">{formatCurrency(totalPayments)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-xs text-muted-foreground">Saldo Devedor</p><p className={`text-lg font-bold ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(balance)}</p></CardContent></Card>
                  </div>
                  <Tabs defaultValue="timeline">
                    <TabsList className="w-full">
                      <TabsTrigger value="timeline" className="flex-1">Extrato ({entriesWithBalance.length})</TabsTrigger>
                      <TabsTrigger value="purchases" className="flex-1">Compras ({purchases?.length || 0})</TabsTrigger>
                      <TabsTrigger value="payments" className="flex-1">Pagamentos ({payments?.length || 0})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="timeline">
                      {entriesWithBalance.length > 0 ? (
                        <Table className="table-fixed w-full">
                          <TableHeader><TableRow><TableHead className="w-24">Data</TableHead><TableHead className="w-24">Tipo</TableHead><TableHead>Descrição</TableHead><TableHead className="w-28 text-right">Valor</TableHead><TableHead className="w-28 text-right">Saldo</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {entriesWithBalance.map((e: any, i: number) => (
                              <TableRow key={`${e.type}-${e.id}-${i}`}>
                                <TableCell className="whitespace-nowrap">{formatDate(e.sortDate)}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${e.type === 'purchase' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {e.type === 'purchase' ? 'Compra' : 'Pagamento'}
                                  </span>
                                </TableCell>
                                <TableCell className="break-words">{e.description || e.notes || '-'}</TableCell>
                                <TableCell className={`text-right tabular-nums ${e.type === 'purchase' ? 'text-destructive' : 'text-green-600'}`}>{e.type === 'purchase' ? '+' : '-'}{formatCurrency(e.amount)}</TableCell>
                                <TableCell className={`text-right tabular-nums font-medium ${e.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(e.balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>}
                    </TabsContent>
                    <TabsContent value="purchases">
                      {purchases && purchases.length > 0 ? (
                        <Table>
                          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {purchases.map((p: any) => (
                              <TableRow key={p.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                                <TableCell>{p.description}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                    {p.status === "paid" ? "Pago" : "Pendente"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(p.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-center text-muted-foreground py-8">Nenhuma compra registrada.</p>}
                    </TabsContent>
                    <TabsContent value="payments">
                      {payments && payments.length > 0 ? (
                        <Table>
                          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Observações</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {payments.map((p: any) => (
                              <TableRow key={p.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(p.date)}</TableCell>
                                <TableCell>{p.notes || "-"}</TableCell>
                                <TableCell className="text-right tabular-nums">{formatCurrency(p.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-center text-muted-foreground py-8">Nenhum pagamento registrado.</p>}
                    </TabsContent>
                  </Tabs>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
