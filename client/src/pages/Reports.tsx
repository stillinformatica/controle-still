import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { salesApi, servicesApi, expensesApi, investmentsApi, reportsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, TrendingUp, TrendingDown, ShoppingCart, Package, BarChart2, Trophy, X, Calendar, DollarSign, Hash,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(dateStr: string) { const p = dateStr.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}` : dateStr; }

type ReportTab = "vendas" | "financeiro";

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>("vendas");
  const [reportType, setReportType] = useState<"geral" | "casa">("geral");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));

  const { startDate, endDate } = useMemo(() => {
    const m = parseInt(selectedMonth), y = parseInt(selectedYear);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate: start, endDate: end };
  }, [selectedMonth, selectedYear]);

  const { data: topProducts, isLoading: loadingTop } = useQuery({ queryKey: ["reports", "topProducts", startDate, endDate], queryFn: () => reportsApi.topSellingProducts({ startDate, endDate }), enabled: !!user && activeTab === "vendas" });
  const { data: salesByDay, isLoading: loadingByDay } = useQuery({ queryKey: ["reports", "salesByDay", startDate, endDate], queryFn: () => reportsApi.salesByDay({ startDate, endDate }), enabled: !!user && activeTab === "vendas" });
  const { data: salesSummary, isLoading: loadingSummary } = useQuery({ queryKey: ["reports", "salesSummary", startDate, endDate], queryFn: () => reportsApi.salesSummary({ startDate, endDate }), enabled: !!user && activeTab === "vendas" });

  const { data: sales } = useQuery({ queryKey: ["sales"], queryFn: () => salesApi.list(), enabled: !!user && activeTab === "financeiro" });
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: () => servicesApi.list(), enabled: !!user && activeTab === "financeiro" });
  const { data: expenses } = useQuery({ queryKey: ["expenses"], queryFn: () => expensesApi.list(), enabled: !!user && activeTab === "financeiro" });
  const { data: investments } = useQuery({ queryKey: ["investments"], queryFn: () => investmentsApi.list(), enabled: !!user && activeTab === "financeiro" });

  const filteredExpenses = reportType === "casa" ? expenses?.filter((e: any) => e.category === "casa") : expenses;
  const totalSales = sales?.reduce((s: number, sale: any) => s + parseFloat(sale.amount), 0) || 0;
  const totalServices = services?.reduce((s: number, svc: any) => s + parseFloat(svc.amount || "0"), 0) || 0;
  const totalRevenue = totalSales + totalServices;
  const totalExpenses = filteredExpenses?.reduce((s: number, e: any) => s + parseFloat(e.amount), 0) || 0;
  const totalInvestments = investments?.reduce((s: number, inv: any) => { const shares = parseFloat(inv.shares); const cp = inv.currentPrice ? parseFloat(inv.currentPrice) : parseFloat(inv.purchasePrice); return s + shares * cp; }, 0) || 0;
  const netProfit = totalRevenue - totalExpenses;

  const salesByDayData = useMemo(() => salesByDay?.map((d: any) => ({ date: formatDate(d.date), Receita: d.totalRevenue, Lucro: d.totalProfit, Vendas: d.salesCount })) || [], [salesByDay]);
  const topByQuantity = useMemo(() => topProducts ? [...topProducts].sort((a: any, b: any) => b.totalQuantity - a.totalQuantity).slice(0, 10) : [], [topProducts]);
  const topByProfit = useMemo(() => topProducts ? [...topProducts].sort((a: any, b: any) => b.totalProfit - a.totalProfit).slice(0, 10) : [], [topProducts]);

  const periodLabel = `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}`;
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
  const { data: productDetail, isLoading: loadingProductDetail } = useQuery({ queryKey: ["reports", "productDetail", selectedProduct?.id], queryFn: () => reportsApi.productDetail({ productId: selectedProduct?.id ?? 0 }), enabled: !!selectedProduct });
  const productDailyData = useMemo(() => productDetail?.dailySales?.map((d: any) => ({ date: formatDate(d.date), Quantidade: d.totalQuantity, Receita: d.totalRevenue, Lucro: d.totalProfit })) || [], [productDetail]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h1 className="text-3xl font-bold">Relatórios</h1><p className="text-muted-foreground mt-1">Análise detalhada de vendas e finanças</p></div>
          <div className="flex gap-2 bg-muted rounded-lg p-1">
            <button onClick={() => setActiveTab("vendas")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "vendas" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><BarChart2 className="inline h-4 w-4 mr-1" />Vendas</button>
            <button onClick={() => setActiveTab("financeiro")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "financeiro" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><FileText className="inline h-4 w-4 mr-1" />Financeiro</button>
          </div>
        </div>

        {activeTab === "vendas" && (
          <>
            <Card><CardContent className="pt-4 pb-4"><div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mês</Label><Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Ano</Label><Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div>
              <p className="text-sm text-muted-foreground pb-2">Exibindo dados de <strong>{periodLabel}</strong></p>
            </div></CardContent></Card>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-blue-500" /><span className="text-2xl font-bold tabular-nums">{loadingSummary ? "..." : salesSummary?.totalSales ?? 0}</span></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /><span className="text-xl font-bold text-green-600 tabular-nums">{loadingSummary ? "..." : formatCurrency(salesSummary?.totalRevenue ?? 0)}</span></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" /><span className="text-xl font-bold text-emerald-600 tabular-nums">{loadingSummary ? "..." : formatCurrency(salesSummary?.totalProfit ?? 0)}</span></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Package className="h-5 w-5 text-purple-500" /><span className="text-xl font-bold text-purple-600 tabular-nums">{loadingSummary ? "..." : formatCurrency(salesSummary?.avgTicket ?? 0)}</span></div></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-blue-500" />Vendas por Dia — {periodLabel}</CardTitle></CardHeader>
              <CardContent>
                {loadingByDay ? <div className="h-64 flex items-center justify-center text-muted-foreground">Carregando...</div>
                : salesByDayData.length === 0 ? <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma venda neste período</div>
                : <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={salesByDayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact", currency: "BRL", style: "currency" }).format(v)} tick={{ fontSize: 11 }} width={70} />
                      <Tooltip formatter={(value: number, name: string) => [name === "Vendas" ? value : formatCurrency(value), name]} /><Legend />
                      <Line type="monotone" dataKey="Receita" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Lucro" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Produtos Mais Vendidos</CardTitle></CardHeader>
                <CardContent>
                  {loadingTop ? <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                  : topByQuantity.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum produto vendido</div>
                  : <>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topByQuantity.slice(0, 7).map((p: any) => ({ name: p.productName.length > 14 ? p.productName.slice(0, 14) + "…" : p.productName, Qtd: p.totalQuantity }))} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="Qtd" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-1">
                        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground border-b pb-1"><span className="col-span-1">#</span><span className="col-span-5">Produto</span><span className="col-span-2 text-right">Qtd</span><span className="col-span-4 text-right">Receita</span></div>
                        {topByQuantity.map((p: any, i: number) => (
                          <div key={p.productId || i} className="grid grid-cols-12 text-sm py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded cursor-pointer" onClick={() => setSelectedProduct({ id: p.productId!, name: p.productName })}>
                            <span className="col-span-1 text-muted-foreground">{i + 1}</span><span className="col-span-5 truncate font-medium">{p.productName}</span><span className="col-span-2 text-right font-semibold tabular-nums">{p.totalQuantity}</span><span className="col-span-4 text-right text-green-600 tabular-nums">{formatCurrency(p.totalRevenue)}</span>
                          </div>
                        ))}
                      </div>
                    </>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />Produtos Mais Lucrativos</CardTitle></CardHeader>
                <CardContent>
                  {loadingTop ? <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                  : topByProfit.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum produto vendido</div>
                  : <>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topByProfit.slice(0, 7).map((p: any) => ({ name: p.productName.length > 14 ? p.productName.slice(0, 14) + "…" : p.productName, Lucro: p.totalProfit }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact", currency: "BRL", style: "currency" }).format(v)} tick={{ fontSize: 10 }} width={60} /><Tooltip formatter={(v: number) => formatCurrency(v)} /><Bar dataKey="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-1">
                        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground border-b pb-1"><span className="col-span-1">#</span><span className="col-span-5">Produto</span><span className="col-span-2 text-right">Qtd</span><span className="col-span-4 text-right">Lucro</span></div>
                        {topByProfit.map((p: any, i: number) => (
                          <div key={p.productId || i} className="grid grid-cols-12 text-sm py-1 hover:bg-muted/50 rounded"><span className="col-span-1 text-muted-foreground">{i + 1}</span><span className="col-span-5 truncate">{p.productName}</span><span className="col-span-2 text-right tabular-nums text-muted-foreground">{p.totalQuantity}</span><span className="col-span-4 text-right text-emerald-600 font-semibold tabular-nums">{formatCurrency(p.totalProfit)}</span></div>
                        ))}
                      </div>
                    </>}
                </CardContent>
              </Card>
            </div>

            {selectedProduct && (
              <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Relatório: {selectedProduct.name}</DialogTitle></DialogHeader>
                  {loadingProductDetail ? <div className="py-8 text-center text-muted-foreground">Carregando...</div> : productDetail && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Qtd Vendida</p><p className="text-xl font-bold tabular-nums">{productDetail.totalQuantity}</p></div>
                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Receita</p><p className="text-xl font-bold text-green-600 tabular-nums">{formatCurrency(productDetail.totalRevenue)}</p></div>
                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Custo</p><p className="text-xl font-bold text-orange-600 tabular-nums">{formatCurrency(productDetail.totalCost)}</p></div>
                        <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Lucro</p><p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(productDetail.totalProfit)}</p></div>
                      </div>
                      {productDailyData.length > 0 && (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={productDailyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="Quantidade" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </>
        )}

        {activeTab === "financeiro" && (
          <>
            <Card><CardHeader><CardTitle>Filtros</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Tipo de Relatório</Label><Select value={reportType} onValueChange={(v: any) => setReportType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="geral">Geral (Todos)</SelectItem><SelectItem value="casa">Casa (Separado)</SelectItem></SelectContent></Select></div></div></CardContent></Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader><CardTitle className="text-sm font-medium">Receitas Totais</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(totalRevenue)}</div><TrendingUp className="h-5 w-5 text-green-600" /></div><p className="text-xs text-muted-foreground mt-2">Vendas + Serviços</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Despesas {reportType === "casa" ? "(Casa)" : "Totais"}</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(totalExpenses)}</div><TrendingDown className="h-5 w-5 text-red-600" /></div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold tabular-nums" style={{ color: netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(netProfit)}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium">Investimentos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(totalInvestments)}</div></CardContent></Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle>Receitas por Origem</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between"><span className="text-sm">Vendas</span><span className="font-semibold tabular-nums">{formatCurrency(totalSales)}</span></div><div className="flex justify-between"><span className="text-sm">Serviços</span><span className="font-semibold tabular-nums">{formatCurrency(totalServices)}</span></div><div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-green-600 tabular-nums">{formatCurrency(totalRevenue)}</span></div></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader><CardContent><div className="space-y-3">
                {reportType === "geral" ? ["casa","still","fixas","mercado","superfluos"].map(cat => {
                  const total = expenses?.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + parseFloat(e.amount), 0) || 0;
                  return <div key={cat} className="flex justify-between"><span className="text-sm capitalize">{cat}</span><span className="font-semibold tabular-nums">{formatCurrency(total)}</span></div>;
                }) : <div className="flex justify-between"><span className="text-sm">Casa</span><span className="font-semibold tabular-nums">{formatCurrency(totalExpenses)}</span></div>}
                <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-red-600 tabular-nums">{formatCurrency(totalExpenses)}</span></div>
              </div></CardContent></Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
