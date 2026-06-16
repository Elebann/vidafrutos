import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/format"

const COLORS = ["#804F17", "#F2C57C", "#6b3f13", "#d1b089", "#b07a4a", "#8a5a36"]

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md text-sm">
      {label && <p className="font-medium text-neutral-900 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-neutral-700">
          {entry.name}: {entry.name.toLowerCase().includes("revenue") || entry.name.toLowerCase().includes("total")
            ? formatCurrency(entry.value)
            : entry.value.toLocaleString("es-CL")}
        </p>
      ))}
    </div>
  )
}

export function SalesLineChart({ data }: { data: { month: string; quantity: number; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece6e0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b6b6b" />
        <YAxis yAxisId="qty" orientation="left" tick={{ fontSize: 12 }} stroke="#6b6b6b" />
        <YAxis yAxisId="rev" orientation="right" tick={{ fontSize: 12 }} stroke="#6b6b6b" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Ingresos" stroke="#804F17" strokeWidth={2} dot={{ r: 4 }} />
        <Line yAxisId="qty" type="monotone" dataKey="quantity" name="Unidades" stroke="#F2C57C" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function HorizontalBarChart({ data }: { data: { name: string; quantity: number; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece6e0" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b6b6b" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6b6b6b" width={75} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="quantity" name="Unidades" fill="#804F17" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }: { data: { name: string; value: number; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const d = payload[0].payload as { name: string; value: number; revenue: number }
          return (
            <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md text-sm">
              <p className="font-medium text-neutral-900">{d.name}</p>
              <p className="text-neutral-700">Unidades: {d.value}</p>
              <p className="text-neutral-700">Ingresos: {formatCurrency(d.revenue)}</p>
            </div>
          )
        }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyRankingChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece6e0" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b6b6b" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis dataKey="month" type="category" tick={{ fontSize: 11 }} stroke="#6b6b6b" width={75} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="revenue" name="Ingresos" fill="#F2C57C" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PaymentPieChart({ data }: { data: { method: string; count: number; total: number }[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Sin datos para el período seleccionado.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="total"
          nameKey="method"
          paddingAngle={2}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const d = payload[0].payload as { method: string; count: number; total: number }
          return (
            <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md text-sm">
              <p className="font-medium text-neutral-900">{d.method}</p>
              <p className="text-neutral-700">Pedidos: {d.count}</p>
              <p className="text-neutral-700">Total: {formatCurrency(d.total)}</p>
            </div>
          )
        }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
