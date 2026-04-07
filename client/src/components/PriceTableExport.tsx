import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown, Printer, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  salePrice: string;
  cost: string;
  quantity: number;
  isTesting?: boolean;
}

interface Kit {
  id: number;
  name: string;
  description?: string | null;
  salePrice: string;
  totalCost: string;
}

interface PriceTableExportProps {
  products: Product[];
  kits: Kit[];
}

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    typeof value === "string" ? parseFloat(value) : value
  );

export default function PriceTableExport({ products, kits }: PriceTableExportProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Tabela de Preços");
  const [showCost, setShowCost] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeKits, setIncludeKits] = useState(true);

  // Seleção individual de produtos
  const [selectAllProducts, setSelectAllProducts] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());

  // Seleção individual de kits
  const [selectAllKits, setSelectAllKits] = useState(true);
  const [selectedKitIds, setSelectedKitIds] = useState<Set<number>>(new Set());

  const activeProducts = includeProducts
    ? selectAllProducts
      ? products
      : products.filter((p) => selectedProductIds.has(p.id))
    : [];

  const activeKits = includeKits
    ? selectAllKits
      ? kits
      : kits.filter((k) => selectedKitIds.has(k.id))
    : [];

  const toggleProduct = (id: number) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedProductIds(next);
    setSelectAllProducts(false);
  };

  const toggleKit = (id: number) => {
    const next = new Set(selectedKitIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedKitIds(next);
    setSelectAllKits(false);
  };

  const totalItems = activeProducts.length + activeKits.length;

  // ─── Gerar linhas HTML ───────────────────────────────────────────────────────
  const buildRows = () => {
    const colCount = 1 + (showCost ? 2 : 0) + (showStock ? 1 : 0);
    let html = "";

    if (activeProducts.length > 0) {
      html += `<tr><td colspan="${colCount + 1}" style="padding:6px 12px;background:#e8f0fe;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#1e3a8a;text-transform:uppercase;">Produtos</td></tr>`;
      activeProducts.forEach((p, i) => {
        const margin = ((parseFloat(p.salePrice) - parseFloat(p.cost)) / parseFloat(p.salePrice)) * 100;
        html += `
        <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${p.name}${showDescription && p.description ? `<br><small style="color:#6b7280">${p.description}</small>` : ""}</td>
          ${showCost ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(p.cost)}</td>` : ""}
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(p.salePrice)}</td>
          ${showCost ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#16a34a;">${margin.toFixed(1)}%</td>` : ""}
          ${showStock ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.quantity}</td>` : ""}
        </tr>`;
      });
    }

    if (activeKits.length > 0) {
      html += `<tr><td colspan="${colCount + 1}" style="padding:6px 12px;background:#fef3c7;font-size:11px;font-weight:700;letter-spacing:0.08em;color:#92400e;text-transform:uppercase;">Kits / Configurações</td></tr>`;
      activeKits.forEach((k, i) => {
        const margin = parseFloat(k.totalCost) > 0
          ? ((parseFloat(k.salePrice) - parseFloat(k.totalCost)) / parseFloat(k.salePrice)) * 100
          : 0;
        html += `
        <tr style="background:${i % 2 === 0 ? "#fffbeb" : "#ffffff"}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${k.name}${showDescription && k.description ? `<br><small style="color:#6b7280">${k.description}</small>` : ""}</td>
          ${showCost ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(k.totalCost)}</td>` : ""}
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(k.salePrice)}</td>
          ${showCost ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#16a34a;">${margin.toFixed(1)}%</td>` : ""}
          ${showStock ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">-</td>` : ""}
        </tr>`;
      });
    }

    return html;
  };

  // ─── PDF via impressão ───────────────────────────────────────────────────────
  const handlePrint = () => {
    if (totalItems === 0) { toast.error("Selecione ao menos um item."); return; }

    const colCount = 1 + (showCost ? 2 : 0) + (showStock ? 1 : 0);
    const html = `
      <!DOCTYPE html><html lang="pt-BR">
      <head><meta charset="UTF-8"/><title>${title}</title>
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:Arial,sans-serif; font-size:13px; color:#111827; padding:32px; }
        h1 { font-size:22px; font-weight:700; margin-bottom:4px; }
        .subtitle { color:#6b7280; font-size:12px; margin-bottom:24px; }
        table { width:100%; border-collapse:collapse; }
        thead tr { background:#1e3a5f; color:white; }
        thead th { padding:10px 12px; text-align:left; font-size:12px; font-weight:600; letter-spacing:0.05em; }
        thead th.right { text-align:right; } thead th.center { text-align:center; }
        tfoot td { padding:10px 12px; font-size:12px; color:#6b7280; border-top:2px solid #e5e7eb; }
        @media print { body { padding:16px; } @page { margin:1.5cm; } }
      </style></head>
      <body>
        <h1>${title}</h1>
        <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} · ${activeProducts.length} produto(s) · ${activeKits.length} kit(s)</p>
        <table>
          <thead><tr>
            <th>Item</th>
            ${showCost ? "<th class='right'>Custo</th>" : ""}
            <th class="right">Preço de Venda</th>
            ${showCost ? "<th class='right'>Margem</th>" : ""}
            ${showStock ? "<th class='center'>Estoque</th>" : ""}
          </tr></thead>
          <tbody>${buildRows()}</tbody>
          <tfoot><tr><td colspan="${colCount + 1}">Still Informática · Tabela gerada pelo sistema ControlEStill</td></tr></tfoot>
        </table>
      </body></html>`;

    const win = window.open("", "_blank");
    if (!win) { toast.error("Permita pop-ups para gerar o PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  // ─── CSV / Excel ─────────────────────────────────────────────────────────────
  const handleCSV = () => {
    if (totalItems === 0) { toast.error("Selecione ao menos um item."); return; }

    const headers = ["Tipo", "Item", showDescription ? "Descrição" : null, showCost ? "Custo (R$)" : null, "Preço de Venda (R$)", showCost ? "Margem (%)" : null, showStock ? "Estoque" : null].filter(Boolean).join(";");

    const productRows = activeProducts.map((p) => {
      const margin = ((parseFloat(p.salePrice) - parseFloat(p.cost)) / parseFloat(p.salePrice)) * 100;
      return ["Produto", `"${p.name}"`, showDescription ? `"${p.description || ""}"` : null, showCost ? parseFloat(p.cost).toFixed(2).replace(".", ",") : null, parseFloat(p.salePrice).toFixed(2).replace(".", ","), showCost ? margin.toFixed(1).replace(".", ",") : null, showStock ? p.quantity : null].filter((v) => v !== null).join(";");
    });

    const kitRows = activeKits.map((k) => {
      const margin = parseFloat(k.totalCost) > 0 ? ((parseFloat(k.salePrice) - parseFloat(k.totalCost)) / parseFloat(k.salePrice)) * 100 : 0;
      return ["Kit", `"${k.name}"`, showDescription ? `"${k.description || ""}"` : null, showCost ? parseFloat(k.totalCost).toFixed(2).replace(".", ",") : null, parseFloat(k.salePrice).toFixed(2).replace(".", ","), showCost ? margin.toFixed(1).replace(".", ",") : null, showStock ? "-" : null].filter((v) => v !== null).join(";");
    });

    const csv = "\uFEFF" + [headers, ...productRows, ...kitRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabela-precos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileDown className="mr-2 h-4 w-4" />
        Exportar Tabela de Preços
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Exportar Tabela de Preços
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Título */}
            <div className="space-y-2">
              <Label>Título da tabela</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Tabela de Preços – Março 2026" />
            </div>

            {/* Colunas visíveis */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Colunas a exibir</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="col-desc" checked={showDescription} onCheckedChange={(v) => setShowDescription(!!v)} />
                  <Label htmlFor="col-desc" className="font-normal cursor-pointer">Descrição</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="col-cost" checked={showCost} onCheckedChange={(v) => setShowCost(!!v)} />
                  <Label htmlFor="col-cost" className="font-normal cursor-pointer">Custo + Margem</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="col-stock" checked={showStock} onCheckedChange={(v) => setShowStock(!!v)} />
                  <Label htmlFor="col-stock" className="font-normal cursor-pointer">Estoque</Label>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="inc-products" checked={includeProducts} onCheckedChange={(v) => setIncludeProducts(!!v)} />
                  <Label htmlFor="inc-products" className="font-semibold cursor-pointer">Produtos ({products.length})</Label>
                </div>
                {includeProducts && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox id="all-products" checked={selectAllProducts} onCheckedChange={(v) => { setSelectAllProducts(!!v); if (v) setSelectedProductIds(new Set()); }} />
                    <Label htmlFor="all-products" className="font-normal cursor-pointer">Todos</Label>
                  </div>
                )}
              </div>
              {includeProducts && !selectAllProducts && (
                <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox id={`p-${p.id}`} checked={selectedProductIds.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                      <Label htmlFor={`p-${p.id}`} className="font-normal cursor-pointer truncate">{p.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kits */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="inc-kits" checked={includeKits} onCheckedChange={(v) => setIncludeKits(!!v)} />
                  <Label htmlFor="inc-kits" className="font-semibold cursor-pointer">Kits / Configurações ({kits.length})</Label>
                </div>
                {includeKits && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox id="all-kits" checked={selectAllKits} onCheckedChange={(v) => { setSelectAllKits(!!v); if (v) setSelectedKitIds(new Set()); }} />
                    <Label htmlFor="all-kits" className="font-normal cursor-pointer">Todos</Label>
                  </div>
                )}
              </div>
              {includeKits && !selectAllKits && (
                <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1">
                  {kits.map((k) => (
                    <div key={k.id} className="flex items-center gap-2">
                      <Checkbox id={`k-${k.id}`} checked={selectedKitIds.has(k.id)} onCheckedChange={() => toggleKit(k.id)} />
                      <Label htmlFor={`k-${k.id}`} className="font-normal cursor-pointer truncate">{k.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{totalItems} item(s) selecionado(s) no total</p>

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir / PDF
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar CSV/Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
