import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ServiceItem {
  id: number;
  date: any;
  description: string;
  serialNumber?: string | null;
  storageLocation?: string | null;
  serviceType?: string | null;
  amount?: string | null;
  status: string;
  osNumber?: string | null;
  customerName?: string | null;
}

interface PrintOSProps {
  customerName: string;
  osNumber: string;
  items: ServiceItem[];
  totalAmount: number;
}

const serviceTypeLabels: Record<string, string> = {
  no_repair: "Sem Conserto",
  repaired: "Consertado",
  test: "Teste",
  pending: "Pendente",
};

export function PrintOS({ customerName, osNumber, items, totalAmount }: PrintOSProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: any) => {
    const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Permita pop-ups para imprimir a OS.");
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>OS ${osNumber} - ${customerName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #111;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .company-sub {
      font-size: 11px;
      color: #555;
      margin-top: 2px;
    }
    .os-info {
      text-align: right;
    }
    .os-number {
      font-size: 18px;
      font-weight: bold;
      color: #1a56db;
    }
    .os-date {
      font-size: 11px;
      color: #555;
      margin-top: 2px;
    }
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .customer-name {
      font-size: 16px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    th {
      background: #f3f4f6;
      font-size: 11px;
      font-weight: bold;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #ddd;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-repaired { background: #d1fae5; color: #065f46; }
    .badge-test { background: #dbeafe; color: #1e40af; }
    .badge-no_repair { background: #fee2e2; color: #991b1b; }
    .badge-open { background: #fef3c7; color: #92400e; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .total-row {
      background: #f9fafb;
      font-weight: bold;
    }
    .total-value {
      text-align: right;
      font-size: 14px;
      font-weight: bold;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #ddd;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid #111;
      margin-top: 40px;
      padding-top: 4px;
      font-size: 11px;
      color: #555;
    }
    @media print {
      body { padding: 10px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">STILL INFORMÁTICA</div>
      <div class="company-sub">Ordem de Serviço</div>
    </div>
    <div class="os-info">
      <div class="os-number">OS Nº ${osNumber}</div>
      <div class="os-date">Data: ${items.length > 0 ? formatDate(items[0].date) : "-"}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="customer-name">${customerName}</div>
  </div>

  <div class="section">
    <div class="section-title">Itens da Ordem de Serviço</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Descrição</th>
          <th>Nº Série</th>
          <th>Armazenamento</th>
          <th>Tipo de Serviço</th>
          <th>Status</th>
          <th style="text-align:right">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.description}</td>
            <td style="font-family:monospace">${item.serialNumber || "-"}</td>
            <td>${item.storageLocation || "-"}</td>
            <td>
              <span class="badge badge-${item.serviceType || 'pending'}">
                ${serviceTypeLabels[item.serviceType || "pending"]}
              </span>
            </td>
            <td>
              <span class="badge badge-${item.status}">
                ${item.status === "open" ? "Em Aberto" : "Concluído"}
              </span>
            </td>
            <td style="text-align:right">${formatCurrency(parseFloat(String(item.amount || "0")))}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td colspan="6" style="text-align:right; font-weight:bold;">TOTAL</td>
          <td class="total-value">${formatCurrency(totalAmount)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="signature-box">
      <div class="signature-line">Assinatura do Técnico</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Assinatura do Cliente</div>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handlePrint}
        title="Imprimir / Exportar OS como PDF"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Printer className="h-4 w-4" />
      </Button>
      {/* Div oculta de referência (não usada diretamente, mas mantida para extensão futura) */}
      <div ref={printRef} className="hidden" />
    </>
  );
}
