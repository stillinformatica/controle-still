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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, TrendingUp, Trash2, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function Investments() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "fii" as "fii" | "stock" | "fund" | "fixed_income",
    administrator: "",
    shares: "",
    purchasePrice: "",
    currentPrice: "",
    purchaseDate: "",
    dyPercent: "",
  });

  const utils = trpc.useUtils();
  const { data: investments, isLoading } = trpc.investments.list.useQuery(
    { isActive: true },
    { enabled: !!user }
  );

  const createMutation = trpc.investments.create.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Investimento criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar investimento: " + error.message);
    },
  });

  const updateMutation = trpc.investments.update.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Investimento atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar investimento: " + error.message);
    },
  });

  const deleteMutation = trpc.investments.delete.useMutation({
    onSuccess: () => {
      utils.investments.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Investimento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir investimento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      type: "fii",
      administrator: "",
      shares: "",
      purchasePrice: "",
      currentPrice: "",
      purchaseDate: "",
      dyPercent: "",
    });
    setEditingInvestment(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingInvestment) {
      updateMutation.mutate({
        id: editingInvestment.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (investment: any) => {
    setEditingInvestment(investment);
    setFormData({
      code: investment.code,
      name: investment.name || "",
      type: investment.type,
      administrator: investment.administrator || "",
      shares: investment.shares,
      purchasePrice: investment.purchasePrice,
      currentPrice: investment.currentPrice || "",
      purchaseDate: investment.purchaseDate,
      dyPercent: investment.dyPercent || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este investimento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const typeLabels = {
    fii: "FII",
    stock: "Ação",
    fund: "Fundo",
    fixed_income: "Renda Fixa",
  };

  const calculateTotal = () => {
    return investments?.reduce((sum, inv) => {
      const shares = parseFloat(inv.shares);
      const price = inv.currentPrice
        ? parseFloat(inv.currentPrice)
        : parseFloat(inv.purchasePrice);
      return sum + shares * price;
    }, 0) || 0;
  };

  const calculateProfit = (investment: any) => {
    const shares = parseFloat(investment.shares);
    const purchasePrice = parseFloat(investment.purchasePrice);
    const currentPrice = investment.currentPrice
      ? parseFloat(investment.currentPrice)
      : purchasePrice;
    const profit = (currentPrice - purchasePrice) * shares;
    const profitPercent = ((currentPrice - purchasePrice) / purchasePrice) * 100;
    return { profit, profitPercent };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Investimentos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus FIIs, ações e fundos de investimento
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Investimento
          </Button>
        </div>

        {/* Total */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Valor Total Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 tabular-nums">
              {formatCurrency(calculateTotal())}
            </div>
            <p className="text-sm text-green-700 mt-1">
              {investments?.length || 0} investimento(s) ativo(s)
            </p>
          </CardContent>
        </Card>

        {/* Lista de Investimentos */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : investments && investments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {investments.map((investment) => {
              const { profit, profitPercent } = calculateProfit(investment);
              const isProfit = profit >= 0;
              
              return (
                <Card key={investment.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {investment.code}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {typeLabels[investment.type as keyof typeof typeLabels]}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(investment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(investment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {investment.name && (
                      <p className="text-sm text-muted-foreground">
                        {investment.name}
                      </p>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cotas:</span>
                        <span className="font-medium tabular-nums">
                          {parseFloat(investment.shares).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Preço Médio:</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(investment.purchasePrice)}
                        </span>
                      </div>
                      {investment.currentPrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Preço Atual:</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(investment.currentPrice)}
                          </span>
                        </div>
                      )}
                      {investment.dyPercent && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">DY:</span>
                          <span className="font-medium tabular-nums text-green-600">
                            {parseFloat(investment.dyPercent).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Lucro/Prejuízo:
                        </span>
                        <div className="text-right">
                          <div
                            className={`font-semibold tabular-nums ${
                              isProfit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(profit)}
                          </div>
                          <div
                            className={`text-xs tabular-nums ${
                              isProfit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {profitPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum investimento cadastrado ainda.
                <br />
                Clique em "Novo Investimento" para começar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvestment ? "Editar Investimento" : "Novo Investimento"}
              </DialogTitle>
              <DialogDescription>
                {editingInvestment
                  ? "Atualize as informações do investimento"
                  : "Adicione um novo investimento ao portfólio"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: HGLG11"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fii">FII</SelectItem>
                        <SelectItem value="stock">Ação</SelectItem>
                        <SelectItem value="fund">Fundo</SelectItem>
                        <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Ex: CSHG Logística"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="administrator">Administrador</Label>
                  <Input
                    id="administrator"
                    placeholder="Ex: BTG Pactual"
                    value={formData.administrator}
                    onChange={(e) =>
                      setFormData({ ...formData, administrator: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shares">Quantidade de Cotas *</Label>
                    <Input
                      id="shares"
                      type="number"
                      step="0.0001"
                      placeholder="0"
                      value={formData.shares}
                      onChange={(e) =>
                        setFormData({ ...formData, shares: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Data de Compra *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Preço de Compra *</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPrice">Preço Atual</Label>
                    <Input
                      id="currentPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.currentPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPrice: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dyPercent">Dividend Yield (%)</Label>
                  <Input
                    id="dyPercent"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.dyPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, dyPercent: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingInvestment ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
