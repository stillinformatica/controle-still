import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { servicesApi, bankAccountsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

const serviceTypeLabels: Record<string, string> = {
  no_repair: "Sem Reparo", repaired: "Reparado", test: "Teste", pending: "Pendente",
};

export default function Services() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const [formData, setFormData] = useState({
    date: getCurrentDateString(), description: "", serialNumber: "", amount: "", cost: "",
    customerName: "", osNumber: "", serviceType: "pending" as any, accountId: "", storageLocation: "",
  });

  const { data: allServices, isLoading } = useQuery({ queryKey: ["services"], queryFn: () => servicesApi.list(), enabled: !!user });
  const { data: accounts } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list(), enabled: !!user });

  const services = useMemo(() => {
    if (!allServices || showAllPeriods) return allServices;
    return allServices.filter((s: any) => {
      const d = new Date(s.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === selectedMonth;
    });
  }, [allServices, selectedMonth, showAllPeriods]);

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Serviço registrado!"); resetForm(); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
  const updateMutation = useMutation({
    mutationFn: servicesApi.update,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Serviço atualizado!"); resetForm(); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); queryClient.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Serviço excluído!"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const resetForm = () => {
    setFormData({ date: getCurrentDateString(), description: "", serialNumber: "", amount: "", cost: "", customerName: "", osNumber: "", serviceType: "pending", accountId: "", storageLocation: "" });
    setEditingService(null); setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { date: formData.date, description: formData.description, serviceType: formData.serviceType };
    if (formData.serialNumber) submitData.serialNumber = formData.serialNumber;
    if (formData.amount) submitData.amount = formData.amount;
    if (formData.cost) submitData.cost = formData.cost;
    if (formData.customerName) submitData.customerName = formData.customerName;
    if (formData.osNumber) submitData.osNumber = formData.osNumber;
    if (formData.accountId) submitData.accountId = parseInt(formData.accountId);
    if (formData.storageLocation) submitData.storageLocation = formData.storageLocation;
    if (editingService) updateMutation.mutate({ id: editingService.id, ...submitData });
    else createMutation.mutate(submitData);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      date: service.date, description: service.description, serialNumber: service.serialNumber || "",
      amount: service.amount || "", cost: service.cost || "", customerName: service.customerName || "",
      osNumber: service.osNumber || "", serviceType: service.serviceType || "pending",
      accountId: service.accountId?.toString() || "", storageLocation: service.storageLocation || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => { if (confirm("Excluir este serviço?")) deleteMutation.mutate({ id }); };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (ds: string | Date) => { const s = typeof ds === "string" ? ds : ds.toISOString().split("T")[0]; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

  const totals = services?.reduce((a: any, s: any) => ({ amount: a.amount + parseFloat(s.amount || "0"), cost: a.cost + parseFloat(s.cost || "0") }), { amount: 0, cost: 0 }) || { amount: 0, cost: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Serviços</h1><p className="text-muted-foreground mt-2">Gerencie ordens de serviço</p></div>
          <div className="flex gap-2 items-center">
            <Label htmlFor="month-filter" className="text-sm whitespace-nowrap">Período:</Label>
            <Input id="month-filter" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" disabled={showAllPeriods} />
            <Button variant={showAllPeriods ? "default" : "outline"} size="sm" onClick={() => setShowAllPeriods(!showAllPeriods)}>{showAllPeriods ? "Filtrar" : "Todos"}</Button>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Serviço</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total Cobrado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(totals.amount)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total Custo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600 tabular-nums">{formatCurrency(totals.cost)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Lista de Serviços</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            : services && services.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>OS</TableHead><TableHead>Cliente</TableHead><TableHead>Descrição</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {services.map((service: any) => (
                      <TableRow key={service.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(service.date)}</TableCell>
                        <TableCell>{service.osNumber || "-"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{service.customerName || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{service.description}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.serviceType === "repaired" ? "bg-green-100 text-green-800" : service.serviceType === "pending" ? "bg-yellow-100 text-yellow-800" : service.serviceType === "no_repair" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                            {serviceTypeLabels[service.serviceType || "pending"]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(service.amount || "0")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12"><Wrench className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum serviço registrado.</p></div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open) setIsDialogOpen(true); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle><DialogDescription>Preencha as informações do serviço</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Nº OS</Label><Input value={formData.osNumber} onChange={(e) => setFormData({ ...formData, osNumber: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Cliente</Label><Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descrição *</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Nº Série</Label><Input value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Custo</Label><Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={formData.serviceType} onValueChange={(v: any) => setFormData({ ...formData, serviceType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="repaired">Reparado</SelectItem><SelectItem value="no_repair">Sem Reparo</SelectItem><SelectItem value="test">Teste</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Conta</Label>
                    <Select value={formData.accountId} onValueChange={(v) => setFormData({ ...formData, accountId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{accounts?.map((acc: any) => (<SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Local de Armazenamento</Label><Input value={formData.storageLocation} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingService ? "Salvar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
