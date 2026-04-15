import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import stillLogo from "@/assets/still-logo.png";

export interface PrintDocumentItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  extra?: Record<string, string>;
}

export interface PrintDocumentProps {
  type: "service" | "sale";
  title: string;
  documentNumber?: string;
  date: string;
  customerName?: string;
  items: PrintDocumentItem[];
  totalAmount: number;
  extraColumns?: { key: string; label: string }[];
  notes?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function toBase64Url(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

export function PrintDocument({
  type,
  title,
  documentNumber,
  date,
  customerName,
  items,
  totalAmount,
  extraColumns = [],
  notes,
}: PrintDocumentProps) {

  const handlePrint = async () => {
    const logoBase64 = await toBase64Url(stillLogo);

    const typeLabel = type === "service" ? "Ordem de Serviço" : "Nota de Venda";
    const typeColor = type === "service" ? "#1a56db" : "#059669";

    const extraHeaders = extraColumns.map(c => `<th>${c.label}</th>`).join("");
    const rows = items.map((item, idx) => {
      const extraCells = extraColumns.map(c => `<td>${item.extra?.[c.key] || "-"}</td>`).join("");
      return `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${item.description}</td>
          ${item.quantity != null ? `<td class="center">${item.quantity}</td>` : ""}
          ${item.unitPrice != null ? `<td class="right">${formatCurrency(item.unitPrice)}</td>` : ""}
          ${extraCells}
          <td class="right">${formatCurrency(item.totalPrice)}</td>
        </tr>`;
    }).join("");

    const hasQty = items.some(i => i.quantity != null);
    const hasUnit = items.some(i => i.unitPrice != null);
    const colCount = 2 + (hasQty ? 1 : 0) + (hasUnit ? 1 : 0) + extraColumns.length + 1;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #1f2937; padding: 32px; background: #fff; }
    
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 3px solid ${typeColor}; margin-bottom: 24px; }
    .logo-area { display: flex; align-items: center; gap: 16px; }
    .logo-area img { height: 64px; width: auto; }
    .company-info { }
    .company-name { font-size: 22px; font-weight: 700; color: #1e3a5f; letter-spacing: 1.5px; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; letter-spacing: 0.5px; }
    
    .doc-info { text-align: right; }
    .doc-type { font-size: 13px; font-weight: 600; color: ${typeColor}; text-transform: uppercase; letter-spacing: 1px; }
    .doc-number { font-size: 22px; font-weight: 700; color: ${typeColor}; margin-top: 2px; }
    .doc-date { font-size: 11px; color: #6b7280; margin-top: 4px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .info-box.full { grid-column: 1 / -1; }
    .info-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: ${typeColor}; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }
    thead th:first-child { border-radius: 8px 0 0 0; }
    thead th:last-child { border-radius: 0 8px 0 0; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    tbody tr:hover td { background: #f1f5f9; }
    .center { text-align: center; }
    .right { text-align: right; }

    .total-row { background: ${typeColor}10; }
    .total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid ${typeColor}; padding: 14px 12px; }
    .total-value { color: ${typeColor}; font-size: 16px; }

    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .notes-title { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #92400e; margin-bottom: 4px; }
    .notes-text { font-size: 11px; color: #78350f; line-height: 1.5; }

    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 8px; }
    .sig-box { text-align: center; width: 40%; }
    .sig-line { border-top: 1px solid #374151; margin-top: 48px; padding-top: 6px; font-size: 11px; color: #6b7280; }

    .footer-info { text-align: center; margin-top: 20px; font-size: 9px; color: #9ca3af; border-top: 1px solid #f1f5f9; padding-top: 8px; }

    @media print { 
      body { padding: 16px; } 
      @page { margin: 1cm; size: A4; }
      .header { border-bottom-color: ${typeColor} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .total-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Still Informática" />` : ""}
      <div class="company-info">
        <div class="company-name">STILL INFORMÁTICA</div>
        <div class="company-sub">Soluções em Tecnologia</div>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-type">${typeLabel}</div>
      ${documentNumber ? `<div class="doc-number">Nº ${documentNumber}</div>` : ""}
      <div class="doc-date">Data: ${date}</div>
    </div>
  </div>

  <div class="info-grid">
    ${customerName ? `
    <div class="info-box full">
      <div class="info-label">Cliente</div>
      <div class="info-value">${customerName}</div>
    </div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Descrição</th>
        ${hasQty ? '<th style="width:60px" class="center">Qtd</th>' : ""}
        ${hasUnit ? '<th style="width:100px" class="right">Valor Unit.</th>' : ""}
        ${extraHeaders}
        <th style="width:110px" class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="${colCount - 1}" class="right">TOTAL</td>
        <td class="right total-value">${formatCurrency(totalAmount)}</td>
      </tr>
    </tbody>
  </table>

  ${notes ? `
  <div class="notes-box">
    <div class="notes-title">Observações</div>
    <div class="notes-text">${notes}</div>
  </div>` : ""}

  <div class="footer">
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line">Assinatura do Técnico / Vendedor</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Assinatura do Cliente</div>
      </div>
    </div>
    <div class="footer-info">
      STILL INFORMÁTICA — Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Permita pop-ups para imprimir.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 600);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handlePrint}
      title={`Imprimir ${type === "service" ? "OS" : "Venda"}`}
      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
}
