import { useEffect, useMemo, useState } from "react"
import { fetchOrders, fetchInvoices, fetchCategories } from "@/lib/apiClients"
import { ensureProducts, getProduct } from "@/lib/dataCache"
import type { Order, Invoice, Product, Category } from "@/types/domain"

export type PeriodMonths = 1 | 3 | 6

export interface ReportData {
  loading: boolean
  kpis: {
    totalRevenue: number
    totalOrders: number
    avgTicket: number
    topProductName: string
  }
  salesByMonth: { month: string; quantity: number; revenue: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  bottomProducts: { name: string; quantity: number; revenue: number }[]
  categoryDistribution: { name: string; value: number; revenue: number }[]
  monthlyRanking: { month: string; revenue: number }[]
  paymentBreakdown: { method: string; count: number; total: number }[]
}

const EMPTY_DATA: ReportData = {
  loading: true,
  kpis: { totalRevenue: 0, totalOrders: 0, avgTicket: 0, topProductName: "-" },
  salesByMonth: [],
  topProducts: [],
  bottomProducts: [],
  categoryDistribution: [],
  monthlyRanking: [],
  paymentBreakdown: [],
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-")
  const date = new Date(Number(y), Number(m) - 1)
  return date.toLocaleDateString("es-CL", { month: "short", year: "2-digit" })
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
}

export function useReportData(period: PeriodMonths) {
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await ensureProducts()
      const [o, inv, cats] = await Promise.all([fetchOrders(), fetchInvoices(), fetchCategories()])
      if (!cancelled) {
        setOrders(o)
        setInvoices(inv)
        setCategories(cats)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const data = useMemo<ReportData>(() => {
    if (loading) return EMPTY_DATA

    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - period, 1)

    const filtered = orders.filter((o) => {
      const d = new Date(o.date)
      return d >= cutoff && d <= now
    })

    const filteredInvoices = invoices.filter((inv) => {
      const d = new Date(inv.date)
      return d >= cutoff && d <= now
    })

    let totalRevenue = 0
    let totalQuantity = 0
    const productAgg = new Map<number, { name: string; quantity: number; revenue: number }>()
    const categoryAgg = new Map<number, { name: string; value: number; revenue: number }>()
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const monthAgg = new Map<string, { quantity: number; revenue: number }>()
    const paymentAgg = new Map<string, { count: number; total: number }>()

    for (const order of filtered) {
      const monthKey = getMonthKey(order.date)
      const monthData = monthAgg.get(monthKey) ?? { quantity: 0, revenue: 0 }

      for (const detail of order.details) {
        const product = getProduct(detail.productId)
        const unitPrice = product?.price ?? (detail.price ? detail.price / detail.quantity : 0)
        const lineRevenue = detail.price ?? unitPrice * detail.quantity
        const lineQty = detail.quantity

        totalRevenue += lineRevenue
        totalQuantity += lineQty

        monthData.quantity += lineQty
        monthData.revenue += lineRevenue

        const existing = productAgg.get(detail.productId) ?? {
          name: product?.name ?? `Producto #${detail.productId}`,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += lineQty
        existing.revenue += lineRevenue
        productAgg.set(detail.productId, existing)

        if (product) {
          const catId = product.categoryId
          const cat = categoryAgg.get(catId) ?? { name: categoryMap.get(catId) ?? `Categoría ${catId}`, value: 0, revenue: 0 }
          cat.value += lineQty
          cat.revenue += lineRevenue
          categoryAgg.set(catId, cat)
        }
      }

      monthAgg.set(monthKey, monthData)
    }

    for (const inv of filteredInvoices) {
      const method = PAYMENT_LABELS[inv.paymentMethod] ?? inv.paymentMethod
      const existing = paymentAgg.get(method) ?? { count: 0, total: 0 }
      existing.count += 1
      existing.total += inv.total
      paymentAgg.set(method, existing)
    }

    const productsSorted = Array.from(productAgg.values()).sort((a, b) => b.quantity - a.quantity)
    const topProducts = productsSorted.slice(0, 5)
    const bottomProducts = productsSorted.slice(-5).reverse()

    const salesByMonth = Array.from(monthAgg.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ month: getMonthLabel(key), ...val }))

    const monthlyRanking = [...salesByMonth]
      .sort((a, b) => b.revenue - a.revenue)

    const categoryDistribution = Array.from(categoryAgg.values())
      .sort((a, b) => b.value - a.value)

    const paymentBreakdown = Array.from(paymentAgg.entries())
      .map(([method, val]) => ({ method, ...val }))
      .sort((a, b) => b.total - a.total)

    const topProductName = topProducts.length > 0 ? topProducts[0].name : "-"
    const totalOrderCount = filtered.length
    const avgTicket = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0

    return {
      loading: false,
      kpis: { totalRevenue, totalOrders: totalOrderCount, avgTicket, topProductName },
      salesByMonth,
      topProducts,
      bottomProducts,
      categoryDistribution,
      monthlyRanking,
      paymentBreakdown,
    }
  }, [orders, invoices, categories, loading, period])

  return data
}
