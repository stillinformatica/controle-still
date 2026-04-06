import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import BankAccounts from "./pages/BankAccounts";
import Investments from "./pages/Investments";
import Sales from "./pages/Sales";
import Services from "./pages/Services";
import Expenses from "./pages/Expenses";
import Debtors from "./pages/Debtors";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Purchases from "./pages/Purchases";
import Suppliers from "./pages/Suppliers";
import Collaborators from "./pages/Collaborators";
import AcceptInvite from "./pages/AcceptInvite";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/contas"} component={BankAccounts} />
      <Route path={"/investimentos"} component={Investments} />
      <Route path={"/vendas"} component={Sales} />
      <Route path={"/servicos"} component={Services} />
      <Route path={"/despesas"} component={Expenses} />
      <Route path={"/devedores"} component={Debtors} />
      <Route path={"/produtos"} component={Products} />
      <Route path={"/compras"} component={Purchases} />
      <Route path={"/fornecedores"} component={Suppliers} />
      <Route path={"/relatorios"} component={Reports} />
      <Route path={"/colaboradores"} component={Collaborators} />
      <Route path={"/aceitar-convite"} component={AcceptInvite} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
