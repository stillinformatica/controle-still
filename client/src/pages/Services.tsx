import { useMemo, useState, useEffect } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { servicesApi, bankAccountsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench, Trash2, Edit, ChevronDown, ChevronRight, User, Search } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

const serviceTypeLabels: Record<string, string> = {
  no_repair: "Sem Reparo", repaired: "Reparado", test: "Teste", pending: "Pendente",
};

interface ServiceItem {
  description: string;
  serialNumber: string;
  amount: string;
  cost: string;
  serviceType: string;
  storageLocation: string;
}

const emptyItem = (): ServiceItem => ({
  description: "", serialNumber: "", amount: "", cost: "", serviceType: "pending", storageLocation: "",
});

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
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "completed" | "all">("open");

  // Form state for new services (multi-item)
  const [formDate, setFormDate] = useState(getCurrentDateString());
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formOsNumber, setFormOsNumber] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formItems, setFormItems] = useState<ServiceItem[]>([emptyItem()]);

  // Single-edit form state
  const [editFormData, setEditFormData] = useState({
    date: "", description: "", serialNumber: "", amount: "", cost: "",
    customerName: "", osNumber: "", serviceType: "pending", accountId: "", storageLocation: "",
  });

  const { data: allServices, isLoading } = useQuery({ queryKey: ["services"], queryFn: () => servicesApi.list(), enabled: !!user });
  const { data: accounts } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list(), enabled: !!user });

  // Auto-fetch next OS number when opening new dialog
  const fetchNextOS = async () => {
    try {
      const next = await servicesApi.getNextOSNumber();
      setFormOsNumber(next);
    } catch { setFormOsNumber(""); }
  };

  const services = useMemo(() => {
    if (!allServices) return allServices;
    let filtered = allServices;
    if (!showAllPeriods) {
      filtered = filtered.filter((s: any) => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === selectedMonth;
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((s: any) => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s: any) =>
        (s.customerName || "").toLowerCase().includes(q) ||
        (s.osNumber || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.serialNumber || "").toLowerCase().includes(q) ||
        (s.storageLocation || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allServices, selectedMonth, showAllPeriods, statusFilter, searchQuery]);

  const groupedByCustomer = useMemo(() => {
    if (!services) return [];
    const groups: Record<string, any[]> = {};
    services.forEach((s: any) => {
      const key = s.customerName || "Sem cliente";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return Object.entries(groups)
      .map(([name, items]) => ({
        name, items,
        totalAmount: items.reduce((a, s) => a + parseFloat(s.amount || "0"), 0),
        totalCost: items.reduce((a, s) => a + parseFloat(s.cost || "0"), 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
  const updateMutation = useMutation({
    mutationFn: servicesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      toast.success("Serviço atualizado!");
      resetForm();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      toast.success("Serviço excluído!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const resetForm = () => {
    setFormDate(getCurrentDateString());
    setFormCustomerName("");
    setFormOsNumber("");
    setFormAccountId("");
    setFormItems([emptyItem()]);
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const handleOpenNew = () => {
    setEditingService(null);
    setFormDate(getCurrentDateString());
    setFormCustomerName("");
    setFormAccountId("");
    setFormItems([emptyItem()]);
    fetchNextOS();
    setIsDialogOpen(true);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formItems.filter(i => i.description.trim());
    if (validItems.length === 0) { toast.error("Adicione pelo menos um item"); return; }

    try {
      for (const item of validItems) {
        await createMutation.mutateAsync({
          date: formDate,
          description: item.description,
          serialNumber: item.serialNumber || undefined,
          amount: item.amount || undefined,
          cost: item.cost || undefined,
          customerName: formCustomerName || undefined,
          osNumber: formOsNumber || undefined,
          serviceType: item.serviceType || "pending",
          accountId: formAccountId ? parseInt(formAccountId) : undefined,
          storageLocation: item.storageLocation || undefined,
        });
      }
      toast.success(`${validItems.length} serviço(s) registrado(s)!`);
      resetForm();
    } catch { /* error handled by mutation */ }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = { id: editingService.id, date: editFormData.date, description: editFormData.description, serviceType: editFormData.serviceType };
    if (editFormData.serialNumber) submitData.serialNumber = editFormData.serialNumber;
    if (editFormData.amount) submitData.amount = editFormData.amount;
    if (editFormData.cost) submitData.cost = editFormData.cost;
    if (editFormData.customerName) submitData.customerName = editFormData.customerName;
    if (editFormData.osNumber) submitData.osNumber = editFormData.osNumber;
    if (editFormData.accountId) submitData.accountId = parseInt(editFormData.accountId);
    if (editFormData.storageLocation) submitData.storageLocation = editFormData.storageLocation;
    updateMutation.mutate(submitData);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setEditFormData({
      date: service.date, description: service.description, serialNumber: service.serialNumber || "",
      amount: service.amount || "", cost: service.cost || "", customerName: service.customerName || "",
      osNumber: service.osNumber || "", serviceType: service.serviceType || "pending",
      accountId: service.accountId?.toString() || "", storageLocation: service.storageLocation || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => { if (confirm("Excluir este serviço?")) deleteMutation.mutate({ id }); };

  const toggleCustomer = (name: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const updateItem = (index: number, field: keyof ServiceItem, value: string) => {
    setFormItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const addItem = () => setFormItems(prev => [...prev, emptyItem()]);
  const removeItem = (index: number) => { if (formItems.length > 1) setFormItems(prev => prev.filter((_, i) => i !== index)); };

  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const formatDate = (ds: string | Date) => { const s = typeof ds === "string" ? ds : ds.toISOString().split("T")[0]; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };

  const totals = services?.reduce((a: any, s: any) => ({ amount: a.amount + parseFloat(s.amount || "0"), cost: a.cost + parseFloat(s.cost || "0") }), { amount: 0, cost: 0 }) || { amount: 0, cost: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div><h1 className="text-2xl md:text-3xl font-bold">Serviços</h1><p className="text-muted-foreground text-sm mt-1">Registre serviços prestados com OS automática</p></div>
          <div className="flex gap-2 items-center flex-wrap">
            <Label htmlFor="month-filter" className="text-sm whitespace-nowrap">Período:</Label>
            <Input id="month-filter" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-36" disabled={showAllPeriods} />
            <Button variant={showAllPeriods ? "default" : "outline"} size="sm" onClick={() => setShowAllPeriods(!showAllPeriods)}>{showAllPeriods ? "Filtrar" : "Todos"}</Button>
            <Button size="sm" onClick={handleOpenNew}><Plus className="mr-1 h-4 w-4" />Novo Serviço</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total Cobrado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(totals.amount)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total Custo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600 tabular-nums">{formatCurrency(totals.cost)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Serviços {services ? <span className="text-sm font-normal text-muted-foreground">({services.length} itens / {groupedByCustomer.length} clientes)</span> : null}</CardTitle>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Em Aberto</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente, OS, descrição, nº série ou armazenamento..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            : groupedByCustomer.length > 0 ? (
              <div className="space-y-2">
                {groupedByCustomer.map((group) => (
                  <Collapsible key={group.name} open={expandedCustomers.has(group.name)} onOpenChange={() => toggleCustomer(group.name)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {expandedCustomers.has(group.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.items.length} OS</span>
                        </div>
                        <span className="font-semibold tabular-nums text-blue-600">{formatCurrency(group.totalAmount)}</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-2 md:ml-4 mt-1 border-l-2 border-muted pl-2 md:pl-4">
                        {/* Mobile: card layout */}
                        <div className="md:hidden space-y-2">
                          {group.items.map((service: any) => (
                            <div key={service.id} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{service.description}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>OS: {service.osNumber || "-"}</span>
                                    <span>•</span>
                                    <span>{formatDate(service.date)}</span>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${service.serviceType === "repaired" ? "bg-green-100 text-green-800" : service.serviceType === "pending" ? "bg-yellow-100 text-yellow-800" : service.serviceType === "no_repair" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                                  {serviceTypeLabels[service.serviceType || "pending"]}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                {service.serialNumber && <span>Nº Série: {service.serialNumber}</span>}
                                {service.storageLocation && <span>Local: {service.storageLocation}</span>}
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t">
                                <span className="font-semibold tabular-nums text-blue-600">{formatCurrency(service.amount || "0")}</span>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(service)}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Desktop: table layout */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>OS</TableHead><TableHead>Descrição</TableHead><TableHead>Nº Série</TableHead><TableHead>Armazenamento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {group.items.map((service: any) => (
                                <TableRow key={service.id}>
                                  <TableCell className="whitespace-nowrap">{formatDate(service.date)}</TableCell>
                                  <TableCell>{service.osNumber || "-"}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">{service.description}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{service.serialNumber || "-"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{service.storageLocation || "-"}</TableCell>
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
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12"><Wrench className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum serviço registrado.</p></div>
            )}
          </CardContent>
        </Card>

        {/* Dialog for NEW service (multi-item) */}
        <Dialog open={isDialogOpen && !editingService} onOpenChange={(open) => { if (!open) resetForm(); else if (!editingService) handleOpenNew(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Serviço</DialogTitle><DialogDescription>Preencha os dados e adicione itens</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmitNew}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Nº OS (auto)</Label><Input value={formOsNumber} onChange={(e) => setFormOsNumber(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Conta</Label>
                    <Select value={formAccountId} onValueChange={setFormAccountId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{accounts?.map((acc: any) => (<SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Cliente</Label><Input value={formCustomerName} onChange={(e) => setFormCustomerName(e.target.value)} /></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Itens ({formItems.length})</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Adicionar Item</Button>
                  </div>
                  {formItems.map((item, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-xs">Descrição *</Label><Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} required placeholder="Descrição do serviço" /></div>
                            <div className="space-y-1"><Label className="text-xs">Nº Série</Label><Input value={item.serialNumber} onChange={(e) => updateItem(idx, "serialNumber", e.target.value)} /></div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1"><Label className="text-xs">Valor</Label><Input type="number" step="0.01" value={item.amount} onChange={(e) => updateItem(idx, "amount", e.target.value)} /></div>
                            <div className="space-y-1"><Label className="text-xs">Custo</Label><Input type="number" step="0.01" value={item.cost} onChange={(e) => updateItem(idx, "cost", e.target.value)} /></div>
                            <div className="space-y-1"><Label className="text-xs">Status</Label>
                              <Select value={item.serviceType} onValueChange={(v) => updateItem(idx, "serviceType", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="repaired">Reparado</SelectItem><SelectItem value="no_repair">Sem Reparo</SelectItem><SelectItem value="test">Teste</SelectItem></SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Armazenamento</Label><Input value={item.storageLocation} onChange={(e) => updateItem(idx, "storageLocation", e.target.value)} /></div>
                          </div>
                        </div>
                        {formItems.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="mt-5 shrink-0" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>Registrar {formItems.filter(i => i.description.trim()).length} item(ns)</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for EDIT service (single) */}
        <Dialog open={isDialogOpen && !!editingService} onOpenChange={(open) => { if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Serviço</DialogTitle><DialogDescription>Atualize as informações do serviço</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Nº OS</Label><Input value={editFormData.osNumber} onChange={(e) => setEditFormData({ ...editFormData, osNumber: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Cliente</Label><Input value={editFormData.customerName} onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descrição *</Label><Input value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Nº Série</Label><Input value={editFormData.serialNumber} onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" step="0.01" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Custo</Label><Input type="number" step="0.01" value={editFormData.cost} onChange={(e) => setEditFormData({ ...editFormData, cost: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={editFormData.serviceType} onValueChange={(v) => setEditFormData({ ...editFormData, serviceType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="repaired">Reparado</SelectItem><SelectItem value="no_repair">Sem Reparo</SelectItem><SelectItem value="test">Teste</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Conta</Label>
                    <Select value={editFormData.accountId} onValueChange={(v) => setEditFormData({ ...editFormData, accountId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{accounts?.map((acc: any) => (<SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Local de Armazenamento</Label><Input value={editFormData.storageLocation} onChange={(e) => setEditFormData({ ...editFormData, storageLocation: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
