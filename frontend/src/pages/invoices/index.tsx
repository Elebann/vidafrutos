import { Receipt } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge } from "@/components/app/status-badge"
import { KpiCard } from "@/components/app/kpi-card"
import { formatCurrency } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Invoice } from "@/types/domain"

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-semibold">Factura #{invoice.id}</p><p className="text-sm text-muted-foreground">Pedido #{invoice.orderId}</p></div>
        <StatusBadge tone="green">{invoice.paymentMethod}</StatusBadge>
      </div>
      <p className="mt-3 text-lg font-semibold">{formatCurrency(invoice.total)}</p>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <>
      <td className="px-4 py-3 font-medium">#{invoice.id}</td>
      <td className="px-4 py-3">#{invoice.orderId}</td>
      <td className="px-4 py-3">{invoice.date}</td>
      <td className="px-4 py-3">{invoice.paymentMethod}</td>
      <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total)}</td>
    </>
  )
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    apiClients.fetchInvoices().then(setInvoices).catch(() => {})
  }, [])

  return (
    <PageShell action={{ icon: Receipt, label: "Generar factura", to: "/facturas/generar" }} description="Facturas emitidas y resumen de pagos." icon={Receipt} title="Facturacion">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Efectivo", "Transferencia", "Debito/Credito"].map((method) => <KpiCard detail="Resumen simulado del periodo." icon={Receipt} key={method} label={method} value={formatCurrency(method === "Transferencia" ? 153200 : 45800)} />)}
      </div>
      <ResponsiveList
        columns={["Factura", "Pedido", "Fecha", "Metodo", "Total"]}
        items={invoices}
        keyExtractor={(invoice) => invoice.id}
        renderCard={(invoice) => <InvoiceCard invoice={invoice} />}
        renderRow={(invoice) => <InvoiceRow invoice={invoice} />}
      />
    </PageShell>
  )
}
