import { Receipt } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { KpiCard } from "@/components/app/kpi-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { SortableResponsiveList } from "@/components/app/sortable-responsive-list"
import { StatusBadge } from "@/components/app/status-badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import apiClients from "@/lib/apiClients"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Invoice } from "@/types/domain"

import { InvoiceFormPage } from "./InvoiceFormPage"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

type PaymentFilter = "all" | "Efectivo" | "Transferencia" | "Débito" | "Crédito"

const PAYMENT_METHOD_MAP: Record<Exclude<PaymentFilter, "all">, string> = {
  "Efectivo": "CASH",
  "Transferencia": "TRANSFER",
  "Débito": "DEBIT_CARD",
  "Crédito": "CREDIT_CARD",
}

const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PAYMENT_METHOD_MAP).map(([label, value]) => [value, label]),
)
type SortKey = "date" | "total" | "paymentMethod"

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-semibold">Factura #{invoice.id}</p><p className="text-sm text-muted-foreground">Pedido #{invoice.orderId}</p></div>
        <StatusBadge tone="green">{PAYMENT_METHOD_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod}</StatusBadge>
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
      <td className="px-4 py-3">{PAYMENT_METHOD_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod}</td>
      <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total)}</td>
    </>
  )
}

function percentageDetail(value: number, monthTotal: number): string {
  if (monthTotal <= 0) return "Sin pagos en el mes"
  return `${Math.round((value / monthTotal) * 100)}% del total del mes`
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all")

  const [sortBy, setSortBy] = useState<SortKey | null>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    apiClients.fetchInvoices().then(setInvoices).catch(() => {})
  }, [isSheetOpen])

  const monthFiltered = useMemo(
    () =>
      invoices.filter((inv) => {
        const invDate = new Date(inv.date)
        return invDate.getMonth() === selectedMonth
      }),
    [invoices, selectedMonth],
  )

  const kpiSummary = useMemo(() => {
    const sum = (method: string) =>
      monthFiltered
        .filter((inv) => inv.paymentMethod === method)
        .reduce((acc, inv) => acc + inv.total, 0)
    return {
      efectivo: sum("CASH"),
      transferencia: sum("TRANSFER"),
      debitoCredito: sum("DEBIT_CARD") + sum("CREDIT_CARD"),
    }
  }, [monthFiltered])

  const monthTotal = kpiSummary.efectivo + kpiSummary.transferencia + kpiSummary.debitoCredito

  const tableRows = useMemo(() => {
    return monthFiltered.filter((inv) => {
      if (paymentFilter === "all") return true
      return inv.paymentMethod === PAYMENT_METHOD_MAP[paymentFilter]
    })
  }, [monthFiltered, paymentFilter])

  const sortedRows = useMemo(() => {
    if (!sortBy) return tableRows
    const list = [...tableRows]
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === "total") {
        cmp = a.total - b.total
      } else if (sortBy === "paymentMethod") {
        cmp = a.paymentMethod.localeCompare(b.paymentMethod, "es")
      }
      if (cmp === 0) cmp = a.id - b.id
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [tableRows, sortBy, sortDir])

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(key as SortKey)
      setSortDir(key === "paymentMethod" ? "asc" : "desc")
    }
  }

  const kpiBuckets = [
    { label: "Efectivo", value: kpiSummary.efectivo },
    { label: "Transferencia", value: kpiSummary.transferencia },
    { label: "Debito/Credito", value: kpiSummary.debitoCredito },
  ]

  return (
    <PageShell
      action={{
        icon: Receipt,
        label: "Registrar pago",
        onClick: () => setIsSheetOpen(true),
      }}
      description="Resumen y confirmación de pagos."
      icon={Receipt}
      title="Registro de Pagos"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Filtrar por mes:
        </span>
        <Select
          value={MONTHS[selectedMonth]}
          onValueChange={(v) => setSelectedMonth(MONTHS.indexOf(v))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Selecciona un mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MONTHS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <SectionCard title="Resumen de pagos del mes">
        <div className="grid gap-3 sm:grid-cols-3">
          {kpiBuckets.map((bucket) => (
            <KpiCard
              detail={percentageDetail(bucket.value, monthTotal)}
              icon={Receipt}
              key={bucket.label}
              label={bucket.label}
              value={formatCurrency(bucket.value)}
            />
          ))}
        </div>
      </SectionCard>

      <div className="mb-4 flex flex-col gap-1 sm:w-56">
        <Label className="text-xs text-muted-foreground" htmlFor="payment-filter">
          Método de pago
        </Label>
        <Select
          value={paymentFilter}
          onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}
        >
          <SelectTrigger id="payment-filter" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Efectivo">Efectivo</SelectItem>
              <SelectItem value="Transferencia">Transferencia</SelectItem>
              <SelectItem value="Débito">Débito</SelectItem>
              <SelectItem value="Crédito">Crédito</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <SortableResponsiveList
        columns={[
          { key: "id", label: "Factura" },
          { key: "orderId", label: "Pedido" },
          { key: "date", label: "Fecha", sortable: true },
          { key: "paymentMethod", label: "Metodo", sortable: true },
          { key: "total", label: "Total", sortable: true },
        ]}
        items={sortedRows}
        keyExtractor={(invoice) => invoice.id}
        onSort={handleSort}
        renderCard={(invoice) => <InvoiceCard invoice={invoice} />}
        renderRow={(invoice) => <InvoiceRow invoice={invoice} />}
        sortBy={sortBy}
        sortDir={sortDir}
      />
      <InvoiceFormPage
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={() => {
          apiClients
            .fetchInvoices()
            .then(setInvoices)
            .catch(() => {})
        }}
      />

    </PageShell>
  )
}
