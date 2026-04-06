import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  AlertTriangle,
  Package
} from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: allExpenses } = trpc.expenses.list.useQuery(
    {},
    { enabled: !!user }
  );

  // Produtos com estoque baixo
  const { data: lowStockProducts } = trpc.products.getLowStock.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Filtrar e ordenar despesas pendentes por urgência
  const upcomingExpenses = allExpenses
    ?.filter(expense => !expense.isPaid)
    .sort((a, b) => {
      const dateA = a.dueDate ? (() => {
        const dateStr = typeof a.dueDate === 'string' ? a.dueDate : a.dueDate.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      })() : Infinity;
      const dateB = b.dueDate ? (() => {
        const dateStr = typeof b.dueDate === 'string' ? b.dueDate : b.dueDate.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      })() : Infinity;
      return dateA - dateB;
    });

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const cards = [
    {
      title: "Saldo Total em Contas",
      value: stats?.totalBalance || 0,
      icon: Wallet,
      description: "Soma de todas as contas bancárias",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Investimentos",
      value: stats?.totalInvestments || 0,
      icon: TrendingUp,
      description: "Valor total investido",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "A Receber (Devedores)",
      value: stats?.totalDebtors || 0,
      icon: Users,
      description: "Total pendente de recebimento",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Patrimônio Líquido",
      value: stats?.netWorth || 0,
      icon: DollarSign,
      description: "Contas + Investimentos + A Receber",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const monthlyCards = [
    {
      title: "Receitas do Mês",
      value: stats?.monthIncome || 0,
      icon: ArrowUpRight,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Despesa Still",
      value: stats?.expensesStill || 0,
      icon: ArrowDownRight,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Despesa Edgar",
      value: stats?.expensesEdgar || 0,
      icon: ArrowDownRight,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Lucro do Mês",
      value: stats?.monthProfit || 0,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
            {upcomingExpenses && upcomingExpenses.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                <AlertCircle className="h-4 w-4 mr-1" />
                {upcomingExpenses.length} despesa(s) pendente(s)
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            Visão geral completa das suas finanças
          </p>
        </div>

        {/* Cards de Patrimônio */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tabular-nums ${card.color}`}>
                    {formatCurrency(card.value)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cards Mensais */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumo do Mês Atual</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {monthlyCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold tabular-nums ${card.color}`}>
                      {formatCurrency(card.value)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Alertas de Despesas */}
        {upcomingExpenses && upcomingExpenses.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5" />
                Despesas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExpenses.slice(0, 5).map((expense) => {
                  const dueDate = expense.dueDate ? (() => {
                    const dateStr = typeof expense.dueDate === 'string' ? expense.dueDate : expense.dueDate.toISOString().split('T')[0];
                    const [year, month, day] = dateStr.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : null;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  let daysUntilDue = 999;
                  let status = "pending";
                  
                  if (dueDate) {
                    daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntilDue < 0) status = "overdue";
                    else if (daysUntilDue <= 7) status = "soon";
                  }

                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        status === "overdue"
                          ? "bg-red-100 border border-red-300"
                          : status === "soon"
                          ? "bg-yellow-100 border border-yellow-300"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {dueDate ? (
                              status === "overdue" ? (
                                <span className="text-red-700 font-semibold">
                                  Vencida há {Math.abs(daysUntilDue)} dia(s)
                                </span>
                              ) : status === "soon" ? (
                                <span className="text-yellow-700 font-semibold">
                                  Vence em {daysUntilDue} dia(s)
                                </span>
                              ) : (
                                `Vence em ${daysUntilDue} dias`
                              )
                            ) : (
                              "Sem data de vencimento"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm tabular-nums">
                          {formatCurrency(parseFloat(expense.amount))}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {upcomingExpenses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {upcomingExpenses.length - 5} despesa(s) pendente(s)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerta de Estoque Baixo */}
        {lowStockProducts && lowStockProducts.length > 0 && (
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-base">
                <AlertTriangle className="h-5 w-5" />
                Estoque Baixo — {lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's' : ''} abaixo do mínimo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-amber-800 dark:text-amber-300">{p.name}</span>
                    </div>
                    <span className="text-amber-700 dark:text-amber-400">
                      Atual: <strong className="text-red-600">{p.quantity}</strong> / Mínimo: <strong>{p.minimumStock}</strong>
                    </span>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-xs text-amber-600 text-center pt-1">
                    + {lowStockProducts.length - 5} produto(s) com estoque baixo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avisos e Ações Rápidas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Use o menu lateral para acessar:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Registrar novas transações bancárias</li>
                <li>Adicionar vendas e serviços</li>
                <li>Gerenciar investimentos e rendimentos</li>
                <li>Controlar despesas e contas a pagar</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Para começar a usar o sistema:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Configure suas contas bancárias</li>
                <li>Importe seus investimentos atuais</li>
                <li>Cadastre produtos na tabela de preços</li>
                <li>Registre devedores e valores pendentes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
