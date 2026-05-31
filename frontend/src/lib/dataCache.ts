import apiClients from "@/lib/apiClients"
import type { Product, Customer, PackagedStock, Order } from "@/types/domain"

const productCache: Map<number, Product> = new Map()
const customerCache: Map<number, Customer> = new Map()
let packagedStockCache: PackagedStock[] | null = null

export async function ensureProducts(): Promise<void> {
  if (productCache.size > 0) return
  const products = await apiClients.fetchProducts()
  products.forEach((p) => productCache.set(p.id, p))
}

export async function ensureCustomers(): Promise<void> {
  if (customerCache.size > 0) return
  const customers = await apiClients.fetchCustomers()
  customers.forEach((c) => customerCache.set(c.id, c))
}

export async function ensurePackagedStock(): Promise<void> {
  if (packagedStockCache) return
  packagedStockCache = await apiClients.fetchPackagedStock()
}

export function getProduct(productId: number): Product | undefined {
  return productCache.get(productId)
}

export function getCustomer(customerId: number): Customer | undefined {
  return customerCache.get(customerId)
}

export function getPackagedStock(productId: number): PackagedStock | undefined {
  return packagedStockCache?.find((s) => s.productId === productId)
}

export function getOrderTotal(order: Order): number {
  return order.details.reduce((total, detail) => {
    // Prefer price provided on the detail (some backends include it), otherwise
    // fall back to the product master price from cache. This covers cases where
    // product cache isn't populated or price changed since order creation.
    const detailPrice = (detail as any).price as number | undefined
    if (typeof detailPrice === 'number') return total + detailPrice * detail.quantity
    const product = getProduct(detail.productId)
    return total + (product?.price ?? 0) * detail.quantity
  }, 0)
}

export function getMissingUnits(productId: number, requested: number): number {
  const stock = getPackagedStock(productId)
  const available = stock?.availableStock ?? 0
  return Math.max(requested - available, 0)
}
