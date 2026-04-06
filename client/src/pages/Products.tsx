import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import React, { useRef, useEffect } from "react";
import { Plus, Package, Trash2, Edit, ShoppingCart, X, AlertTriangle } from "lucide-react";
import PriceTableExport from "@/components/PriceTableExport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Products() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isKitDialogOpen, setIsKitDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const PRODUCT_CATEGORIES = [
    "Eletrônicos",
    "Segurança",
    "Periféricos",
    "Fontes",
    "Gabinetes",
    "SSDS e HDs",
    "Kit Placa-Mãe + Processador",
    "Placa-mãe",
    "Processador",
    "Computadores Montados",
    "Notebooks Usados",
    "Notebooks",
    "Peças",
    "Memórias",
    "Placa de Vídeo",
  ];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    cost: "",
    salePrice: "",
    quantity: "0",
    minimumStock: "0",
  });

  // Query para produtos com estoque baixo
  const { data: lowStockProducts } = trpc.products.getLowStock.useQuery(
    undefined,
    { enabled: !!user }
  );

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.list.useQuery(
    { isActive: true },
    { enabled: !!user }
  );

  // Query para kits (usada na exportação de tabela de preços)
  const { data: allKits } = trpc.productKits.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar produto: " + error.message);
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      cost: "",
      salePrice: "",
      quantity: "0",
      minimumStock: "0",
    });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        ...formData,
        minimumStock: parseInt(formData.minimumStock) || 0,
      });
    } else {
      createMutation.mutate({
        ...formData,
        minimumStock: parseInt(formData.minimumStock) || 0,
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      cost: product.cost,
      salePrice: product.salePrice,
      quantity: product.quantity?.toString() || "0",
      minimumStock: product.minimumStock?.toString() || "0",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const calculateProfit = (cost: string, salePrice: string) => {
    return parseFloat(salePrice) - parseFloat(cost);
  };

  const calculateMargin = (cost: string, salePrice: string) => {
    const profit = parseFloat(salePrice) - parseFloat(cost);
    return (profit / parseFloat(salePrice)) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground mt-2">
              Tabela de preços e margens de lucro
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PriceTableExport products={products || []} kits={allKits || []} />
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
            <Button variant="outline" onClick={() => setIsKitDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Kit
            </Button>
          </div>
        </div>

        {/* Alerta de Estoque Baixo */}
        {lowStockProducts && lowStockProducts.length > 0 && (
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Alerta de Estoque Baixo ({lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-800 dark:text-amber-300">{p.name}</span>
                    <span className="text-amber-700 dark:text-amber-400">
                      Estoque: <strong>{p.quantity}</strong> / Mínimo: <strong>{p.minimumStock}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary tabular-nums">
              {products?.length || 0} produto(s) cadastrado(s)
            </div>
          </CardContent>
        </Card>

        {/* Seção de Kits */}
        <Card>
          <CardHeader>
            <CardTitle>Kits de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <KitsList />
          </CardContent>
        </Card>

        {/* Dialog de Produto */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : products && products.length > 0 ? (
              <div className="overflow-x-auto w-full">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Produto</TableHead>
                      <TableHead className="text-right w-[12%]">Custo</TableHead>
                      <TableHead className="text-right w-[13%]">Preço Venda</TableHead>
                      <TableHead className="text-right w-[8%]">Qtd</TableHead>
                      <TableHead className="text-right w-[12%]">Lucro</TableHead>
                      <TableHead className="text-right w-[10%]">Margem</TableHead>
                      <TableHead className="text-right w-[10%]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const profit = calculateProfit(product.cost, product.salePrice);
                      const margin = calculateMargin(product.cost, product.salePrice);

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div>
                              <span className="block truncate" title={product.name}>{product.name}</span>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate" title={product.description}>{product.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatCurrency(product.cost)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatCurrency(product.salePrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span
                              className={`font-semibold ${
                                product.minimumStock > 0 && product.quantity <= product.minimumStock
                                  ? "text-amber-600"
                                  : ""
                              }`}
                            >
                              {product.quantity || 0}
                              {product.minimumStock > 0 && product.quantity <= product.minimumStock && (
                                <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-green-600 text-sm">
                            {formatCurrency(profit)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-blue-600 text-sm">
                            {margin.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhum produto cadastrado ainda.
                  <br />
                  Clique em "Novo Produto" para começar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Atualize as informações do produto"
                  : "Adicione um novo produto à tabela de preços"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Computador Gamer"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalhes do produto..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Preço de Venda *</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.salePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, salePrice: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade em Estoque</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                    <Input
                      id="minimumStock"
                      type="number"
                      placeholder="0"
                      value={formData.minimumStock}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumStock: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">Alerta quando estoque ≤ este valor</p>
                  </div>
                </div>

                {formData.cost && formData.salePrice && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lucro:</span>
                      <span className="text-lg font-bold text-green-600 tabular-nums">
                        {formatCurrency(
                          parseFloat(formData.salePrice) - parseFloat(formData.cost)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Margem:</span>
                      <span className="text-lg font-bold text-blue-600 tabular-nums">
                        {calculateMargin(formData.cost, formData.salePrice).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProduct ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Novo Kit */}
        <Dialog open={isKitDialogOpen} onOpenChange={setIsKitDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Kit de Produtos</DialogTitle>
              <DialogDescription>
                Monte um kit agrupando vários produtos. Ao vender o kit, o estoque dos produtos será baixado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <KitForm onClose={() => setIsKitDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Componente de formulário de kit
function KitForm({ onClose }: { onClose: () => void }) {
  const [kitForm, setKitForm] = useState({
    name: "",
    description: "",
    salePrice: "",
  });
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: number; quantity: number; productName: string; cost: string }>>([]);

  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.products.list.useQuery({ isActive: true });

  const createKitMutation = trpc.productKits.create.useMutation({
    onSuccess: () => {
      utils.productKits.list.invalidate();
      toast.success("Kit criado com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao criar kit: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!kitForm.name || !kitForm.salePrice) {
      toast.error("Preencha nome e preço de venda");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Adicione pelo menos um produto ao kit");
      return;
    }

    createKitMutation.mutate({
      name: kitForm.name,
      description: kitForm.description,
      salePrice: kitForm.salePrice,
      items: selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  const addProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = selectedItems.find(item => item.productId === productId);
    if (existing) {
      toast.error("Produto já adicionado ao kit");
      return;
    }

    setSelectedItems([...selectedItems, {
      productId: product.id,
      quantity: 1,
      productName: product.name,
      cost: product.cost,
    }]);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeProduct = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const totalCost = selectedItems.reduce((sum, item) => 
    sum + (parseFloat(item.cost) * item.quantity), 0
  );

  const salePrice = parseFloat(kitForm.salePrice) || 0;
  const profit = salePrice - totalCost;
  const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="kit-name">Nome do Kit *</Label>
          <Input
            id="kit-name"
            value={kitForm.name}
            onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })}
            placeholder="Ex: Kit Computador Gamer"
            required
          />
        </div>

        <div>
          <Label htmlFor="kit-description">Descrição</Label>
          <Textarea
            id="kit-description"
            value={kitForm.description}
            onChange={(e) => setKitForm({ ...kitForm, description: e.target.value })}
            placeholder="Descrição do kit"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="kit-sale-price">Preço de Venda *</Label>
          <Input
            id="kit-sale-price"
            type="number"
            step="0.01"
            value={kitForm.salePrice}
            onChange={(e) => setKitForm({ ...kitForm, salePrice: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Seleção de produtos */}
      <div className="space-y-2">
        <Label>Produtos do Kit *</Label>
        <div className="flex gap-2">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => {
              if (e.target.value) {
                addProduct(parseInt(e.target.value));
                e.target.value = "";
              }
            }}
          >
            <option value="">Selecione um produto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - R$ {product.cost}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de produtos selecionados */}
      {selectedItems.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Produtos Selecionados:</h4>
          {selectedItems.map((item) => (
            <div key={item.productId} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{item.productName}</span>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground w-24">R$ {(parseFloat(item.cost) * item.quantity).toFixed(2)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeProduct(item.productId)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Resumo financeiro */}
      {selectedItems.length > 0 && kitForm.salePrice && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Custo Total:</span>
            <span className="tabular-nums">R$ {totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Preço de Venda:</span>
            <span className="tabular-nums">R$ {salePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium">Lucro:</span>
            <span className={`tabular-nums font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {profit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Margem:</span>
            <span className={`tabular-nums font-bold ${profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createKitMutation.isPending}>
          {createKitMutation.isPending ? "Criando..." : "Criar Kit"}
        </Button>
      </DialogFooter>
    </form>
  );
}


// Componente de listagem de kits
function KitsList() {
  const { data: kits, isLoading } = trpc.productKits.list.useQuery();
  const utils = trpc.useUtils();
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<any>(null);
  const [editingKit, setEditingKit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    salePrice: "",
  });
  // Estado dos componentes editáveis do kit
  const [editItems, setEditItems] = useState<{ productId: number; quantity: number; productName?: string }[]>([]);
  const [newItemProductId, setNewItemProductId] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [sellForm, setSellForm] = useState({
    quantity: 1,
    accountId: "",
    customerName: "",
    date: new Date().toISOString().split('T')[0],
  });
  
  const { data: accounts = [] } = trpc.bankAccounts.list.useQuery();
  const { data: allProducts = [] } = trpc.products.list.useQuery({});
  // Query para buscar itens do kit sendo editado
  const { data: kitItems = [] } = trpc.productKits.getItems.useQuery(
    { kitId: editingKit?.id ?? 0 },
    { enabled: !!editingKit?.id }
  );

  const sellKitMutation = trpc.productKits.sellKit.useMutation({
    onSuccess: () => {
      utils.productKits.list.invalidate();
      utils.products.list.invalidate();
      toast.success("Kit vendido! Estoque dos produtos baixado automaticamente.");
      setSellDialogOpen(false);
      setSelectedKit(null);
      setSellForm({ quantity: 1, accountId: "", customerName: "", date: new Date().toISOString().split('T')[0] });
    },
    onError: (error) => {
      toast.error(`Erro ao vender kit: ${error.message}`);
    },
  });

  const deleteKitMutation = trpc.productKits.delete.useMutation({
    onSuccess: () => {
      utils.productKits.list.invalidate();
      toast.success("Kit excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir kit: ${error.message}`);
    },
  });

  const updateKitMutation = trpc.productKits.update.useMutation({
    onSuccess: () => {
      utils.productKits.list.invalidate();
      toast.success("Kit atualizado com sucesso!");
      setEditDialogOpen(false);
      setEditingKit(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar kit: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este kit?")) {
      deleteKitMutation.mutate({ id });
    }
  };

  const handleEditClick = (kit: any) => {
    setEditingKit(kit);
    setEditForm({
      name: kit.name || "",
      description: kit.description || "",
      salePrice: kit.salePrice || "",
    });
    // editItems será populado pelo useEffect quando kitItems carregar
    setEditItems([]);
    setNewItemProductId("");
    setNewItemQty(1);
    setEditDialogOpen(true);
  };

  // Quando kitItems carregar, popular editItems
  const prevKitIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (editingKit?.id && kitItems.length > 0 && prevKitIdRef.current !== editingKit.id) {
      prevKitIdRef.current = editingKit.id;
      setEditItems(kitItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.productName || allProducts.find((p: any) => p.id === item.productId)?.name || `Produto #${item.productId}`,
      })));
    }
    if (!editingKit) {
      prevKitIdRef.current = null;
    }
  }, [kitItems, editingKit?.id]);

  const handleAddEditItem = () => {
    if (!newItemProductId) return;
    const pid = parseInt(newItemProductId);
    const product = allProducts.find((p: any) => p.id === pid);
    const existing = editItems.find(i => i.productId === pid);
    if (existing) {
      setEditItems(prev => prev.map(i => i.productId === pid ? { ...i, quantity: i.quantity + newItemQty } : i));
    } else {
      setEditItems(prev => [...prev, { productId: pid, quantity: newItemQty, productName: product?.name || `Produto #${pid}` }]);
    }
    setNewItemProductId("");
    setNewItemQty(1);
  };

  const handleRemoveEditItem = (productId: number) => {
    setEditItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleEditItemQtyChange = (productId: number, qty: number) => {
    if (qty < 1) return;
    setEditItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKit) return;
    updateKitMutation.mutate({
      id: editingKit.id,
      name: editForm.name,
      description: editForm.description,
      salePrice: editForm.salePrice,
      items: editItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  const handleSellClick = (kit: any) => {
    setSelectedKit(kit);
    setSellDialogOpen(true);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit) return;
    
    sellKitMutation.mutate({
      kitId: selectedKit.id,
      quantity: sellForm.quantity,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!kits || kits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum kit cadastrado ainda. Clique em "Novo Kit" para começar.
      </div>
    );
  }

  return (
    <>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kits.map((kit) => (
        <Card key={kit.id} className="relative">
          <CardHeader>
            <CardTitle className="text-lg">{kit.name}</CardTitle>
            {kit.description && (
              <p className="text-sm text-muted-foreground">{kit.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Custo Total:</span>
                <span className="font-semibold tabular-nums">R$ {kit.totalCost}</span>
              </div>
              <div className="flex justify-between">
                <span>Preço de Venda:</span>
                <span className="font-semibold tabular-nums">R$ {kit.salePrice}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Lucro:</span>
                <span className="font-bold text-green-600 tabular-nums">R$ {kit.profit}</span>
              </div>
              <div className="flex justify-between">
                <span>Margem:</span>
                <span className="font-bold text-blue-600 tabular-nums">{kit.profitMargin}%</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSellClick(kit)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Vender Kit
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(kit)}
                  title="Editar kit"
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(kit.id)}
                  title="Excluir kit"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <SellKitDialog 
      open={sellDialogOpen}
      onOpenChange={setSellDialogOpen}
      kit={selectedKit}
      onSubmit={(qty: number) => sellKitMutation.mutate({ kitId: selectedKit.id, quantity: qty })}
      isPending={sellKitMutation.isPending}
    />

    {/* Dialog de Editar Kit */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="!max-w-2xl !w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Kit: {editingKit?.name}</DialogTitle>
          <DialogDescription>
            Altere as informações e os produtos componentes do kit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="edit-kit-name">Nome do Kit *</Label>
              <Input
                id="edit-kit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-kit-price">Preço de Venda (R$) *</Label>
              <Input
                id="edit-kit-price"
                type="number"
                step="0.01"
                min="0"
                value={editForm.salePrice}
                onChange={(e) => setEditForm(prev => ({ ...prev, salePrice: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-end">
              <div className="w-full border rounded-lg p-2 bg-muted/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro:</span>
                  <span className="font-semibold text-green-600">
                    R$ {editForm.salePrice && editItems.length > 0
                      ? (() => {
                          const cost = editItems.reduce((sum, item) => {
                            const p = allProducts.find((pr: any) => pr.id === item.productId);
                            return sum + (p ? parseFloat(p.cost) * item.quantity : 0);
                          }, 0);
                          return (parseFloat(editForm.salePrice) - cost).toFixed(2);
                        })()
                      : editingKit?.profit || "0.00"}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-kit-description">Descrição</Label>
              <Textarea
                id="edit-kit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          {/* Seção de Componentes */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="font-semibold text-sm">Produtos Componentes</p>
            
            {/* Lista de componentes atuais */}
            {editItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum produto adicionado</p>
            ) : (
              <div className="space-y-2">
                {editItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 bg-muted/30 rounded p-2">
                    <span className="flex-1 text-sm font-medium truncate">{item.productName}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditItemQtyChange(item.productId, item.quantity - 1)}
                      >-</Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditItemQtyChange(item.productId, item.quantity + 1)}
                      >+</Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => handleRemoveEditItem(item.productId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar novo produto */}
            <div className="flex gap-2 items-end border-t pt-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Adicionar Produto</Label>
                <Select value={newItemProductId} onValueChange={setNewItemProductId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts
                      .filter((p: any) => !editItems.find(i => i.productId === p.id))
                      .map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-16">
                <Label className="text-xs text-muted-foreground">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={handleAddEditItem}
                disabled={!newItemProductId}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateKitMutation.isPending}>
              {updateKitMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Dialog de venda de kit (componente separado para evitar problemas de sintaxe)
function SellKitDialog({ open, onOpenChange, kit, onSubmit, isPending }: any) {
  const [quantity, setQuantity] = useState(1);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(quantity);
  };
  
  if (!kit) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Kit: {kit.name}</DialogTitle>
          <DialogDescription>
            Ao confirmar, o estoque dos produtos componentes será baixado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sell-quantity">Quantidade *</Label>
            <Input
              id="sell-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Preço Unitário:</span>
              <span className="tabular-nums">R$ {kit.salePrice}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total:</span>
              <span className="tabular-nums font-bold text-green-600">
                R$ {(parseFloat(kit.salePrice) * quantity).toFixed(2)}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Vendendo..." : "Confirmar Venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
