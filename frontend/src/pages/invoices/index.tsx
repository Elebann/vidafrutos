import { Receipt } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge } from "@/components/app/status-badge"
import { KpiCard } from "@/components/app/kpi-card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Invoice } from "@/types/domain"
import { InvoiceFormPage } from "./InvoiceFormPage"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

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
      <td className="px-4 py-3">{formatDate(invoice.date)}</td>
      <td className="px-4 py-3">{invoice.paymentMethod}</td>
      <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total)}</td>
    </>
  )
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    apiClients.fetchInvoices().then(setInvoices).catch(() => {})
  }, [isSheetOpen])

  const filteredInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.date)
    return invDate.getMonth() === selectedMonth
  })

  return (
    <PageShell
      action={{ icon: Receipt, label: "Registrar pago", onClick: () => setIsSheetOpen(true) }}
      description="Resumen y confirmación de pagos."
      icon={Receipt}
      title="Registro de Pagos"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filtrar por mes:</span>
        <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={MONTHS[selectedMonth]} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MONTHS.map((name, idx) => (
                <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {["Efectivo", "Transferencia", "Debito/Credito"].map((method) => (
          <KpiCard detail="Resumen simulado del periodo." icon={Receipt} key={method} label={method} value={formatCurrency(method === "Transferencia" ? 153200 : 45800)} />
        ))}
      </div>
      <ResponsiveList
        columns={["Factura", "Pedido", "Fecha", "Metodo", "Total"]}
        items={filteredInvoices}
        keyExtractor={(invoice) => invoice.id}
        renderCard={(invoice) => <InvoiceCard invoice={invoice} />}
        renderRow={(invoice) => <InvoiceRow invoice={invoice} />}
      />

      <InvoiceFormPage
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={() => {
          apiClients.fetchInvoices().then(setInvoices).catch(() => {})
        }}
      />
    </PageShell>
  )
}
