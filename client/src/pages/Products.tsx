import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsApi, productKitsApi, bankAccountsApi, productImagesApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Plus, Package, Trash2, Edit, ShoppingCart, X, AlertTriangle, Camera, Megaphone, Loader2 } from "lucide-react";
import PriceTableExport from "@/components/PriceTableExport";
import { toast } from "sonner";

const PRODUCT_CATEGORIES = [
  "Eletrônicos", "Segurança", "Periféricos", "Fontes", "Gabinetes", "SSDS e HDs",
  "Kit Placa-Mãe + Processador", "Placa-mãe", "Processador", "Computadores Montados",
  "Notebooks Usados", "Notebooks", "Peças", "Memórias", "Placa de Vídeo",
];

export default function Products() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", category: "", cost: "", salePrice: "", quantity: "0", minimumStock: "0" });

  const { data: products, isLoading } = useQuery({ queryKey: ["products", { isActive: true }], queryFn: () => productsApi.list({ isActive: true }), enabled: !!user });
  const { data: lowStockProducts } = useQuery({ queryKey: ["products", "lowStock"], queryFn: () => productsApi.getLowStock(), enabled: !!user });
  const { data: allKits } = useQuery({ queryKey: ["productKits"], queryFn: () => productKitsApi.list(), enabled: !!user });

  const createMutation = useMutation({ mutationFn: productsApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto criado!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const updateMutation = useMutation({ mutationFn: productsApi.update, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto atualizado!"); resetForm(); }, onError: (e: any) => toast.error(e.message) });
  const deleteMutation = useMutation({ mutationFn: productsApi.delete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success("Produto excluído!"); }, onError: (e: any) => toast.error(e.message) });

  const resetForm = () => { setFormData({ name: "", description: "", category: "", cost: "", salePrice: "", quantity: "0", minimumStock: "0" }); setEditingProduct(null); setIsDialogOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) updateMutation.mutate({ id: editingProduct.id, ...formData, minimumStock: parseInt(formData.minimumStock) || 0 });
    else createMutation.mutate({ ...formData, minimumStock: parseInt(formData.minimumStock) || 0 });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description || "", category: product.category || "", cost: product.cost, salePrice: product.salePrice, quantity: product.quantity?.toString() || "0", minimumStock: product.minimumStock?.toString() || "0" });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => { if (confirm("Excluir este produto?")) deleteMutation.mutate({ id }); };
  const formatCurrency = (v: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(typeof v === "string" ? parseFloat(v) : v);
  const calculateProfit = (c: string, s: string) => parseFloat(s) - parseFloat(c);
  const calculateMargin = (c: string, s: string) => { const p = parseFloat(s) - parseFloat(c); return (p / parseFloat(s)) * 100; };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold">Produtos</h1><p className="text-muted-foreground mt-2">Tabela de preços e margens de lucro</p></div>
          <div className="flex gap-2 flex-wrap">
            <PriceTableExport products={products || []} kits={allKits || []} />
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Produto</Button>
            <Button variant="outline" onClick={() => setIsKitDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Kit</Button>
          </div>
        </div>

        {lowStockProducts && lowStockProducts.length > 0 && (
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-5 w-5" />Alerta de Estoque Baixo ({lowStockProducts.length})</CardTitle></CardHeader>
            <CardContent><div className="space-y-2">{lowStockProducts.map((p: any) => (<div key={p.id} className="flex items-center justify-between text-sm"><span className="font-medium text-amber-800 dark:text-amber-300">{p.name}</span><span className="text-amber-700 dark:text-amber-400">Estoque: <strong>{p.quantity}</strong> / Mínimo: <strong>{p.minimumStock}</strong></span></div>))}</div></CardContent>
          </Card>
        )}

        <Card><CardHeader><CardTitle>Resumo</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary tabular-nums">{products?.length || 0} produto(s)</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Kits de Produtos</CardTitle></CardHeader><CardContent><KitsList /></CardContent></Card>

        <Card>
          <CardHeader><CardTitle>Lista de Produtos</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            : products && products.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <Table className="w-full table-fixed">
                  <TableHeader><TableRow>
                    <TableHead className="w-[35%]">Produto</TableHead><TableHead className="text-right w-[12%]">Custo</TableHead><TableHead className="text-right w-[13%]">Preço Venda</TableHead>
                    <TableHead className="text-right w-[8%]">Qtd</TableHead><TableHead className="text-right w-[12%]">Lucro</TableHead><TableHead className="text-right w-[10%]">Margem</TableHead><TableHead className="text-right w-[10%]">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {products.map((product: any) => {
                      const profit = calculateProfit(product.cost, product.salePrice);
                      const margin = calculateMargin(product.cost, product.salePrice);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium"><div><span className="block truncate" title={product.name}>{product.name}</span>{product.category && <span className="text-xs text-primary font-medium">{product.category}</span>}{product.description && <p className="text-xs text-muted-foreground truncate">{product.description}</p>}</div></TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatCurrency(product.cost)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatCurrency(product.salePrice)}</TableCell>
                          <TableCell className="text-right tabular-nums"><span className={`font-semibold ${product.minimumStock > 0 && product.quantity <= product.minimumStock ? "text-amber-600" : ""}`}>{product.quantity || 0}{product.minimumStock > 0 && product.quantity <= product.minimumStock && <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />}</span></TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-green-600 text-sm">{formatCurrency(profit)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-blue-600 text-sm">{margin.toFixed(1)}%</TableCell>
                          <TableCell className="text-right"><div className="flex justify-end space-x-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12"><Package className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground text-center">Nenhum produto cadastrado.</p></div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle><DialogDescription>{editingProduct ? "Atualize as informações" : "Adicione um novo produto"}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nome do Produto *</Label><Input placeholder="Ex: Computador Gamer" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                <div className="space-y-2"><Label>Categoria *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>{PRODUCT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Custo *</Label><Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Preço de Venda *</Label><Input type="number" step="0.01" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Quantidade em Estoque</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} /><p className="text-xs text-muted-foreground">Alerta quando estoque ≤ este valor</p></div>
                </div>
                {formData.cost && formData.salePrice && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between"><span className="text-sm font-medium">Lucro:</span><span className="text-lg font-bold text-green-600 tabular-nums">{formatCurrency(parseFloat(formData.salePrice) - parseFloat(formData.cost))}</span></div>
                    <div className="flex justify-between"><span className="text-sm font-medium">Margem:</span><span className="text-lg font-bold text-blue-600 tabular-nums">{calculateMargin(formData.cost, formData.salePrice).toFixed(1)}%</span></div>
                  </div>
                )}
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingProduct ? "Atualizar" : "Criar"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Kit de Produtos</DialogTitle><DialogDescription>Monte um kit agrupando vários produtos.</DialogDescription></DialogHeader>
            <KitForm onClose={() => setIsKitDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function KitForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [kitForm, setKitForm] = useState({ name: "", description: "", salePrice: "" });
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: number; quantity: number; productName: string; cost: string }>>([]);

  const { data: products = [] } = useQuery({ queryKey: ["products", { isActive: true }], queryFn: () => productsApi.list({ isActive: true }) });

  const createKitMutation = useMutation({
    mutationFn: productKitsApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productKits"] }); toast.success("Kit criado!"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitForm.name || !kitForm.salePrice) { toast.error("Preencha nome e preço"); return; }
    if (selectedItems.length === 0) { toast.error("Adicione ao menos um produto"); return; }
    createKitMutation.mutate({ name: kitForm.name, description: kitForm.description, salePrice: kitForm.salePrice, items: selectedItems.map(i => ({ productId: i.productId, quantity: i.quantity })) });
  };

  const addProduct = (pid: number) => {
    const product = products.find((p: any) => p.id === pid);
    if (!product || selectedItems.find(i => i.productId === pid)) return;
    setSelectedItems([...selectedItems, { productId: product.id, quantity: 1, productName: product.name, cost: product.cost }]);
  };

  const totalCost = selectedItems.reduce((s, i) => s + parseFloat(i.cost) * i.quantity, 0);
  const salePrice = parseFloat(kitForm.salePrice) || 0;
  const profit = salePrice - totalCost;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div><Label>Nome do Kit *</Label><Input value={kitForm.name} onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })} required /></div>
        <div><Label>Descrição</Label><Textarea value={kitForm.description} onChange={(e) => setKitForm({ ...kitForm, description: e.target.value })} rows={2} /></div>
        <div><Label>Preço de Venda *</Label><Input type="number" step="0.01" value={kitForm.salePrice} onChange={(e) => setKitForm({ ...kitForm, salePrice: e.target.value })} required /></div>
      </div>
      <div className="space-y-2">
        <Label>Produtos do Kit *</Label>
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={(e) => { if (e.target.value) { addProduct(parseInt(e.target.value)); e.target.value = ""; } }}>
          <option value="">Selecione um produto</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} - R$ {p.cost}</option>)}
        </select>
      </div>
      {selectedItems.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Produtos Selecionados:</h4>
          {selectedItems.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{item.productName}</span>
              <Input type="number" min="1" value={item.quantity} onChange={(e) => setSelectedItems(selectedItems.map(i => i.productId === item.productId ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))} className="w-20" />
              <span className="text-sm text-muted-foreground w-24">R$ {(parseFloat(item.cost) * item.quantity).toFixed(2)}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedItems(selectedItems.filter(i => i.productId !== item.productId))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
      {selectedItems.length > 0 && kitForm.salePrice && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
          <div className="flex justify-between"><span>Custo Total:</span><span className="tabular-nums">R$ {totalCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Preço de Venda:</span><span className="tabular-nums">R$ {salePrice.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2"><span>Lucro:</span><span className={`tabular-nums font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {profit.toFixed(2)}</span></div>
        </div>
      )}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={createKitMutation.isPending}>{createKitMutation.isPending ? "Criando..." : "Criar Kit"}</Button></DialogFooter>
    </form>
  );
}

function KitsList() {
  const queryClient = useQueryClient();
  const { data: kits, isLoading } = useQuery({ queryKey: ["productKits"], queryFn: () => productKitsApi.list() });
  const { data: allProducts = [] } = useQuery({ queryKey: ["products", { isActive: true }], queryFn: () => productsApi.list({ isActive: true }) });
  const { data: accounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: () => bankAccountsApi.list() });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", salePrice: "" });
  const [editItems, setEditItems] = useState<{ productId: number; quantity: number; productName?: string }[]>([]);
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);

  const { data: kitItems = [] } = useQuery({ queryKey: ["kitItems", editingKit?.id], queryFn: () => productKitsApi.getItems({ kitId: editingKit?.id }), enabled: !!editingKit?.id });

  const prevKitIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (editingKit?.id && kitItems.length > 0 && prevKitIdRef.current !== editingKit.id) {
      prevKitIdRef.current = editingKit.id;
      setEditItems(kitItems.map((item: any) => ({ productId: item.productId, quantity: item.quantity, productName: item.productName || allProducts.find((p: any) => p.id === item.productId)?.name })));
    }
    if (!editingKit) prevKitIdRef.current = null;
  }, [kitItems, editingKit?.id]);

  const sellKitMutation = useMutation({ mutationFn: productKitsApi.sellKit, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productKits"] }); queryClient.invalidateQueries({ queryKey: ["products"] }); toast.success("Kit vendido!"); }, onError: (e: any) => toast.error(e.message) });
  const deleteKitMutation = useMutation({ mutationFn: productKitsApi.delete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productKits"] }); toast.success("Kit excluído!"); }, onError: (e: any) => toast.error(e.message) });
  const updateKitMutation = useMutation({ mutationFn: productKitsApi.update, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productKits"] }); toast.success("Kit atualizado!"); setEditDialogOpen(false); setEditingKit(null); }, onError: (e: any) => toast.error(e.message) });

  const handleEditClick = (kit: any) => { setEditingKit(kit); setEditForm({ name: kit.name, description: kit.description || "", salePrice: kit.salePrice }); setEditItems([]); setEditDialogOpen(true); };
  const handleEditSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!editingKit) return; updateKitMutation.mutate({ id: editingKit.id, name: editForm.name, description: editForm.description, salePrice: editForm.salePrice, items: editItems.map(i => ({ productId: i.productId, quantity: i.quantity })) }); };

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!kits || kits.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhum kit cadastrado.</div>;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kits.map((kit: any) => (
          <Card key={kit.id} className="relative">
            <CardHeader><CardTitle className="text-lg">{kit.name}</CardTitle>{kit.description && <p className="text-sm text-muted-foreground">{kit.description}</p>}</CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Custo:</span><span className="font-semibold tabular-nums">R$ {kit.totalCost}</span></div>
                <div className="flex justify-between"><span>Preço:</span><span className="font-semibold tabular-nums">R$ {kit.salePrice}</span></div>
                <div className="flex justify-between border-t pt-2"><span>Lucro:</span><span className="font-bold text-green-600 tabular-nums">R$ {kit.profit}</span></div>
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button variant="default" size="sm" onClick={() => sellKitMutation.mutate({ kitId: kit.id, quantity: 1 })}><ShoppingCart className="h-4 w-4 mr-2" />Vender</Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(kit)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { if (confirm("Excluir?")) deleteKitMutation.mutate({ id: kit.id }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingKit(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Kit</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div><Label>Nome *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
            <div><Label>Descrição</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} /></div>
            <div><Label>Preço de Venda *</Label><Input type="number" step="0.01" value={editForm.salePrice} onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Produtos</Label>
              <div className="flex gap-2">
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItemProductId} onChange={(e) => setNewItemProductId(e.target.value)}>
                  <option value="">Selecione</option>
                  {allProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <Input type="number" min="1" value={newItemQty} onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)} className="w-20" />
                <Button type="button" onClick={() => { if (!newItemProductId) return; const pid = parseInt(newItemProductId); const product = allProducts.find((p: any) => p.id === pid); const existing = editItems.find(i => i.productId === pid); if (existing) setEditItems(editItems.map(i => i.productId === pid ? { ...i, quantity: i.quantity + newItemQty } : i)); else setEditItems([...editItems, { productId: pid, quantity: newItemQty, productName: product?.name }]); setNewItemProductId(""); setNewItemQty(1); }}>Adicionar</Button>
              </div>
            </div>
            {editItems.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                {editItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1">{item.productName || `Produto #${item.productId}`}</span>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => setEditItems(editItems.map(i => i.productId === item.productId ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))} className="w-20" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditItems(editItems.filter(i => i.productId !== item.productId))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setEditingKit(null); }}>Cancelar</Button><Button type="submit" disabled={updateKitMutation.isPending}>Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
