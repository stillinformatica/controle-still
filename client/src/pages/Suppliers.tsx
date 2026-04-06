import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/lib/api";
import { Plus, Truck, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", contact: "", phone: "", email: "", notes: "" });

  const { data: suppliers, isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list, enabled: !!user });
  const createMutation = useMutation({ mutationFn: suppliersApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor cadastrado!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMutation = useMutation({ mutationFn: suppliersApi.update, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor atualizado!"); resetForm(); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const deleteMutation = useMutation({ mutationFn: suppliersApi.delete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor excluído!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const resetForm = () => { setFormData({ name: "", contact: "", phone: "", email: "", notes: "" }); setEditingSupplier(null); setIsDialogOpen(false); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, ...formData }); else createMutation.mutate(formData); };
  const handleEdit = (s: any) => { setEditingSupplier(s); setFormData({ name: s.name, contact: "", phone: s.phone || "", email: s.email || "", notes: s.notes || "" }); setIsDialogOpen(true); };
  const handleDelete = (id: number) => { if (confirm("Excluir este fornecedor?")) deleteMutation.mutate({ id }); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Fornecedores</h1><p className="text-muted-foreground mt-2">Gerencie seus fornecedores</p></div><Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Fornecedor</Button></div>
        <Card><CardHeader><CardTitle>Lista de Fornecedores</CardTitle></CardHeader><CardContent>
          {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
          : suppliers && suppliers.length > 0 ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
              {suppliers.map((s: any) => (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.phone || "-"}</TableCell><TableCell>{s.email || "-"}</TableCell><TableCell className="text-right"><div className="flex justify-end space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>))}
            </TableBody></Table></div>
          ) : <div className="flex flex-col items-center justify-center py-12"><Truck className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum fornecedor cadastrado.</p></div>}
        </CardContent></Card>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { if (o) setIsDialogOpen(true); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingSupplier ? "Editar" : "Novo"} Fornecedor</DialogTitle><DialogDescription>Preencha as informações do fornecedor</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit}><div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div></div><div className="space-y-2"><Label>Observações</Label><Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingSupplier ? "Salvar" : "Cadastrar"}</Button></DialogFooter></form>
        </DialogContent></Dialog>
      </div>
    </DashboardLayout>
  );
}
