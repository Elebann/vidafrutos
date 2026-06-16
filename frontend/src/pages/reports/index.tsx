import { useState } from "react"
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Award } from "lucide-react"

import { PageShell, SectionCard } from "@/components/app/page-shell"
import { KpiCard } from "@/components/app/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { useReportData, type PeriodMonths } from "./useReportData"
import {
  SalesLineChart,
  HorizontalBarChart,
  CategoryPieChart,
  MonthlyRankingChart,
  PaymentPieChart,
} from "./charts"

const PERIOD_OPTIONS = [
  { value: "1", label: "Último mes" },
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
] as const

export function ReportsPage() {
  const [period, setPeriod] = useState<PeriodMonths>(3)
  const report = useReportData(period)

  return (
    <PageShell description="Indicadores para medir la toma de decisiones del negocio." icon={BarChart3} title="Reportes">
      <div className="flex justify-end">
        <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v) as PeriodMonths)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {report.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            detail="Facturación total del período."
            icon={DollarSign}
            label="Ingresos totales"
            tone="success"
            value={formatCurrency(report.kpis.totalRevenue)}
          />
          <KpiCard
            detail="Órdenes registradas en el período."
            icon={ShoppingCart}
            label="Total órdenes"
            value={String(report.kpis.totalOrders)}
          />
          <KpiCard
            detail="Facturación promedio por pedido."
            icon={TrendingUp}
            label="Ticket promedio"
            value={formatCurrency(report.kpis.avgTicket)}
          />
          <KpiCard
            detail="Producto con mayor volumen de unidades."
            icon={Award}
            label="Más vendido"
            tone="warning"
            value={report.kpis.topProductName}
          />
        </div>
      )}

      <SectionCard title="Tendencia de ventas mensuales">
        <SalesLineChart data={report.salesByMonth} />
      </SectionCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="Productos más vendidos">
          <HorizontalBarChart data={report.topProducts} />
        </SectionCard>
        <SectionCard title="Productos menos vendidos">
          <HorizontalBarChart data={report.bottomProducts} />
        </SectionCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="Distribución por categoría">
          <CategoryPieChart data={report.categoryDistribution} />
        </SectionCard>
        <SectionCard title="Meses más exitosos">
          <MonthlyRankingChart data={report.monthlyRanking} />
        </SectionCard>
      </div>

      <SectionCard title="Métodos de pago">
        <PaymentPieChart data={report.paymentBreakdown} />
      </SectionCard>
    </PageShell>
  )
}
