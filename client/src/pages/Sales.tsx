import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/useMobile";
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
import { salesApi, bankAccountsApi, productsApi, productKitsApi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart, Trash2, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getCurrentDateString } from "@/../../shared/timezone";

export default function Sales() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const [saleFormData, setSaleFormData] = useState({
    date: getCurrentDateString(),
    customerName: "",
    accountId: "",
  });

  const [items, setItems] = useState<Array<{
    productId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    isKit?: boolean;
  }>>([]);

  const [newItem, setNewItem] = useState({
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: "",
    unitCost: "",
    isKit: false,
  });

  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    cost: "",
    salePrice: "",
    quantity: "0",
  });

  const { data: allSales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => salesApi.list(),
    enabled: !!user,
  });
  const sales = useMemo(() => {
    if (!allSales || showAllPeriods) return allSales;
    return allSales.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      return saleMonth === selectedMonth;
    });
  }, [allSales, selectedMonth, showAllPeriods]);

  const { data: accounts } = useQuery({
    queryKey: ["bankAccounts"],
    queryFn: () => bankAccountsApi.list(),
    enabled: !!user,
  });
  const { data: products } = useQuery({
    queryKey: ["products", { isActive: true }],
    queryFn: () => productsApi.list({ isActive: true }),
    enabled: !!user,
  });
  const { data: kits } = useQuery({
    queryKey: ["productKits"],
    queryFn: () => productKitsApi.list(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Venda registrada com sucesso!");
      resetForm();
    },
    onError: (error: any) => toast.error("Erro ao registrar venda: " + error.message),
  });

  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: (newProduct: any) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      setNewItem({
        ...newItem,
        productId: newProduct.id.toString(),
        description: newProduct.name,
        unitPrice: String(newProduct.salePrice),
        unitCost: String(newProduct.cost),
      });
      setIsCreatingNewProduct(false);
      setNewProductData({ name: "", cost: "", salePrice: "", quantity: "0" });
    },
    onError: (error: any) => toast.error("Erro ao criar produto: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: salesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error: any) => toast.error("Erro ao excluir venda: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: salesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
      toast.success("Venda atualizada com sucesso!");
      resetForm();
    },
    onError: (error: any) => toast.error("Erro ao atualizar venda: " + error.message),
  });

  const resetForm = () => {
    setSaleFormData({ date: getCurrentDateString(), customerName: "", accountId: "" });
    setItems([]);
    setNewItem({ productId: "", description: "", quantity: 1, unitPrice: "", unitCost: "", isKit: false });
    setIsDialogOpen(false);
    setEditingSaleId(null);
    setIsCreatingNewProduct(false);
  };

  const handleEdit = async (sale: any) => {
    setEditingSaleId(sale.id);
    setSaleFormData({
      date: typeof sale.date === 'string' ? sale.date : sale.date.toISOString().split('T')[0],
      customerName: sale.customerName || "",
      accountId: sale.source === "debtor" ? "DEVEDOR" : (sale.accountId?.toString() || ""),
    });
    // Load sale items
    const { data: saleItems } = await supabase.from("sale_items").select("*").eq("sale_id", sale.id);
    if (saleItems) {
      setItems(saleItems.map((si: any) => ({
        productId: si.product_id || undefined,
        description: si.description,
        quantity: si.quantity,
        unitPrice: parseFloat(si.unit_price),
        unitCost: parseFloat(si.unit_cost),
      })));
    }
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.unitPrice) {
      toast.error("Preencha descrição e preço do item");
      return;
    }
    setItems([...items, {
      productId: newItem.productId ? parseInt(newItem.productId) : undefined,
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: parseFloat(newItem.unitPrice),
      unitCost: newItem.unitCost ? parseFloat(newItem.unitCost) : 0,
      isKit: newItem.isKit,
    }]);
    setNewItem({ productId: "", description: "", quantity: 1, unitPrice: "", unitCost: "", isKit: false });
    toast.success("Item adicionado!");
  };

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleProductSelect = (value: string) => {
    if (value.startsWith('kit-')) {
      const kitId = value.replace('kit-', '');
      const kit = kits?.find((k: any) => k.id.toString() === kitId);
      if (kit) {
        setNewItem({ ...newItem, productId: kitId, description: `[KIT] ${kit.name}`, unitPrice: kit.salePrice, unitCost: kit.totalCost, isKit: true });
      }
    } else if (value.startsWith('product-')) {
      const productId = value.replace('product-', '');
      const product = products?.find((p: any) => p.id.toString() === productId);
      if (product) {
        setNewItem({ ...newItem, productId, description: product.name, unitPrice: product.salePrice, unitCost: product.cost, isKit: false });
      }
    }
  };

  const handleCreateNewProduct = () => {
    if (!newProductData.name || !newProductData.cost || !newProductData.salePrice) {
      toast.error("Preencha todos os campos do produto");
      return;
    }
    createProductMutation.mutate({
      name: newProductData.name,
      cost: newProductData.cost,
      salePrice: newProductData.salePrice,
      quantity: newProductData.quantity,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Adicione pelo menos um item à venda"); return; }
    if (!saleFormData.accountId) { toast.error("Selecione a conta bancária ou devedor"); return; }

    let source: "shopee" | "mp_edgar" | "mp_emerson" | "direct" | "debtor" | "other" = "direct";
    let accountId: number | undefined = undefined;

    if (saleFormData.accountId === "DEVEDOR") {
      source = "debtor";
    } else {
      accountId = parseInt(saleFormData.accountId);
      const account = accounts?.find((acc: any) => acc.id === accountId);
      if (account) {
        const n = account.name.toUpperCase();
        if (n.includes("SHOPEE")) source = "shopee";
        else if (n.includes("EDGAR")) source = "mp_edgar";
        else if (n.includes("EMERSON")) source = "mp_emerson";
        else source = "direct";
      }
    }

    const payload = {
      date: saleFormData.date,
      description: `Venda ${items.length > 1 ? 'com múltiplos itens' : items[0].description}`,
      source,
      customerName: saleFormData.customerName || undefined,
      accountId,
      items,
    };

    if (editingSaleId) {
      updateMutation.mutate({ ...payload, id: editingSaleId });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) deleteMutation.mutate({ id });
  };

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      typeof value === "string" ? parseFloat(value) : value
    );

  const formatDate = (dateString: string | Date) => {
    if (typeof dateString === 'string') {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    const isoString = dateString.toISOString().split('T')[0];
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  const sourceLabels: Record<string, string> = {
    shopee: "Shopee", mp_edgar: "MP (Edgar)", mp_emerson: "MP (Emerson)",
    direct: "Venda Direta", debtor: "Devedor", other: "Outro",
  };

  const totals = sales?.reduce(
    (acc: any, sale: any) => ({
      amount: acc.amount + parseFloat(sale.amount),
      cost: acc.cost + parseFloat(sale.cost),
      profit: acc.profit + parseFloat(sale.profit),
    }),
    { amount: 0, cost: 0, profit: 0 }
  ) || { amount: 0, cost: 0, profit: 0 };

  const itemsTotals = items.reduce(
    (acc, item) => ({
      amount: acc.amount + (item.unitPrice * item.quantity),
      cost: acc.cost + (item.unitCost * item.quantity),
      profit: acc.profit + ((item.unitPrice - item.unitCost) * item.quantity),
    }),
    { amount: 0, cost: 0, profit: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vendas</h1>
            <p className="text-muted-foreground text-sm mt-1">Registre e acompanhe suas vendas</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Label htmlFor="month-filter" className="text-sm whitespace-nowrap">Período:</Label>
            <Input id="month-filter" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-36" disabled={showAllPeriods} />
            <Button variant={showAllPeriods ? "default" : "outline"} size="sm" onClick={() => setShowAllPeriods(!showAllPeriods)}>
              {showAllPeriods ? "Filtrar" : "Todos"}
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />Nova Venda
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm font-medium">Total de Vendas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(totals.amount)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Custo Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600 tabular-nums">{formatCurrency(totals.cost)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm font-medium">Lucro Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(totals.profit)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Histórico de Vendas</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : sales && sales.length > 0 ? (
              <div>
                {/* Mobile: card layout */}
                <div className="md:hidden space-y-3">
                  {sales.map((sale: any) => (
                    <div key={sale.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{sale.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDate(sale.date)}</span>
                            {sale.customerName && <><span>•</span><span className="truncate">{sale.customerName}</span></>}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(sale)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(sale.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{sourceLabels[sale.source] || sale.source}</span>
                        <div className="flex gap-3 tabular-nums">
                          <span className="text-blue-600 font-semibold">{formatCurrency(sale.amount)}</span>
                          <span className="text-green-600 font-semibold">{formatCurrency(sale.profit)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table layout */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[90px]">Data</TableHead>
                        <TableHead className="min-w-[120px]">Cliente</TableHead>
                        <TableHead className="min-w-[150px]">Descrição</TableHead>
                        <TableHead className="min-w-[90px]">Origem</TableHead>
                        <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                        <TableHead className="text-right min-w-[100px]">Custo</TableHead>
                        <TableHead className="text-right min-w-[100px]">Lucro</TableHead>
                        <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{sale.customerName || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={sale.description}>{sale.description}</TableCell>
                          <TableCell>{sourceLabels[sale.source] || sale.source}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(sale.amount)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(sale.cost)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-green-600">{formatCurrency(sale.profit)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Nenhuma venda registrada ainda.<br />Clique em "Nova Venda" para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open) setIsDialogOpen(true); }}>
          <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingSaleId ? "Editar Venda" : "Nova Venda"}</DialogTitle>
              <DialogDescription>{editingSaleId ? "Edite os dados da venda" : "Adicione múltiplos itens à venda"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-6 py-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input id="date" type="date" value={saleFormData.date} onChange={(e) => setSaleFormData({ ...saleFormData, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="customerName">Nome do Cliente (Opcional)</Label>
                    <Input id="customerName" placeholder="Ex: João Silva" value={saleFormData.customerName} onChange={(e) => setSaleFormData({ ...saleFormData, customerName: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="accountId">Conta que Recebeu *</Label>
                    <Select value={saleFormData.accountId} onValueChange={(value) => setSaleFormData({ ...saleFormData, accountId: value })}>
                      <SelectTrigger><SelectValue placeholder="Selecione a conta ou devedor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEVEDOR">DEVEDOR (A Receber)</SelectItem>
                        {accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">Adicionar Item</h3>
                  {!isCreatingNewProduct ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="productId">Produto (Opcional)</Label>
                        <Select value={newItem.productId} onValueChange={handleProductSelect}>
                          <SelectTrigger><SelectValue placeholder="Selecione um produto existente" /></SelectTrigger>
                          <SelectContent>
                            {products?.map((product: any) => (
                              <SelectItem key={`product-${product.id}`} value={`product-${product.id}`}>
                                {product.name} - Estoque: {product.quantity || 0}
                              </SelectItem>
                            ))}
                            {kits?.map((kit: any) => (
                              <SelectItem key={`kit-${kit.id}`} value={`kit-${kit.id}`}>
                                [KIT] {kit.name} - R$ {kit.salePrice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição/Nome do Produto *</Label>
                        <Input id="description" placeholder="Ex: Gabinete Gamer" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Quantidade *</Label><Input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} /></div>
                        <div className="space-y-2"><Label>Preço Unit. *</Label><Input type="number" step="0.01" placeholder="0.00" value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Custo Unit. *</Label><Input type="number" step="0.01" placeholder="0.00" value={newItem.unitCost} onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })} /></div>
                      </div>
                      <Button type="button" onClick={handleAddItem} className="w-full"><Plus className="mr-2 h-4 w-4" />Adicionar Item</Button>
                    </>
                  ) : (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Criar Novo Produto</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setIsCreatingNewProduct(false); setNewProductData({ name: "", cost: "", salePrice: "", quantity: "0" }); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2"><Label>Nome do Produto *</Label><Input placeholder="Ex: Gabinete Gamer RGB" value={newProductData.name} onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Custo *</Label><Input type="number" step="0.01" value={newProductData.cost} onChange={(e) => setNewProductData({ ...newProductData, cost: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Preço de Venda *</Label><Input type="number" step="0.01" value={newProductData.salePrice} onChange={(e) => setNewProductData({ ...newProductData, salePrice: e.target.value })} /></div>
                      </div>
                      <div className="space-y-2"><Label>Quantidade em Estoque</Label><Input type="number" min="0" value={newProductData.quantity} onChange={(e) => setNewProductData({ ...newProductData, quantity: e.target.value })} /></div>
                      <Button type="button" onClick={handleCreateNewProduct} disabled={createProductMutation.isPending} className="w-full">Criar e Usar Produto</Button>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Itens da Venda ({items.length})</h3>
                    <Table>
                      <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-center">Qtd</TableHead><TableHead className="text-right">Preço Unit.</TableHead><TableHead className="text-right">Custo Unit.</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatCurrency(item.unitCost)}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                            <TableCell className="text-right"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between"><span className="text-sm font-medium">Total da Venda:</span><span className="text-lg font-bold text-blue-600 tabular-nums">{formatCurrency(itemsTotals.amount)}</span></div>
                      <div className="flex justify-between"><span className="text-sm font-medium">Custo Total:</span><span className="text-lg font-bold text-orange-600 tabular-nums">{formatCurrency(itemsTotals.cost)}</span></div>
                      <div className="flex justify-between"><span className="text-sm font-medium">Lucro Total:</span><span className="text-lg font-bold text-green-600 tabular-nums">{formatCurrency(itemsTotals.profit)}</span></div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={(createMutation.isPending || updateMutation.isPending) || items.length === 0}>
                  {editingSaleId ? "Salvar Alterações" : "Registrar Venda"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
