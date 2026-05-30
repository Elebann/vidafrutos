import api from "@/lib/api"
import type { Category, Customer, Invoice, Order, PackagedStock, Product, RawStock, Role, StockMovement, User } from "@/types/domain"
import { categories as mockCategories, products as mockProducts, customers as mockCustomers, packagedStock as mockPackagedStock, rawStock as mockRawStock, roles as mockRoles, users as mockUsers, orders as mockOrders, invoices as mockInvoices, movements as mockMovements } from "@/data/mock-data"

// Backend -> Frontend mappers to keep the frontend shape unchanged
function mapProduct(p: any): Product {
  return {
    id: p.id,
    categoryId: p.category, // backend uses `category`
    name: p.name,
    price: p.price,
    active: p.active,
  }
}

function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
  }
}

function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    rut: c.rut,
    name: c.name,
    address: c.address,
    // frontend mock has extra fields; keep undefined when not provided by backend
    lastOrderDate: (c.last_order_date as any) ?? undefined,
    balance: (c.balance as any) ?? 0,
  }
}

function mapPackagedStock(p: any): PackagedStock {
  return {
    productId: p.product,
    availableStock: p.available_stock,
    allocatedStock: p.allocated_stock,
    minimumStock: p.minimum_stock,
  }
}

function mapRawStock(r: any): RawStock {
  return {
    productId: r.product,
    quantityKilogram: parseFloat(r.quantity_kilogram ?? r.quantity ?? 0),
  }
}

function mapRole(r: any): Role {
  return { id: r.id, name: r.name, permissions: (r.permissions as string[]) ?? [] }
}

function mapUser(u: any): User {
  return { id: u.id, rut: u.rut ?? "", username: u.username ?? "", name: u.username ?? "", roleId: u.rol?.id ?? (u.roleId as any) ?? null, active: true }
}

// Wrap calls with fallback to mock data when backend fails
export async function fetchProducts(params?: Record<string, any>): Promise<Product[]> {
  try {
    const res = await api.get('/api/products/', { params })
    return res.data.map(mapProduct)
  } catch (e) {
    return mockProducts.map((p) => ({ id: p.id, categoryId: p.categoryId, name: p.name, price: p.price, active: p.active }))
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await api.get('/api/products/categories/')
    return res.data.map(mapCategory)
  } catch (e) {
    return mockCategories
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const res = await api.get('/api/clients/')
    return res.data.map(mapCustomer)
  } catch (e) {
    return mockCustomers
  }
}

export async function fetchPackagedStock(): Promise<PackagedStock[]> {
  try {
    const res = await api.get('/api/products/')
    // backend returns packaged_stock nested; flatten to match frontend mock
    return res.data.map((p: any) => ({ productId: p.id, availableStock: p.packaged_stock?.available_stock ?? 0, allocatedStock: p.packaged_stock?.allocated_stock ?? 0, minimumStock: p.packaged_stock?.minimum_stock ?? 0 }))
  } catch (e) {
    return mockPackagedStock
  }
}

export async function fetchRawStock(): Promise<RawStock[]> {
  try {
    const res = await api.get('/api/products/')
    return res.data.map((p: any) => ({ productId: p.id, quantityKilogram: parseFloat(p.raw_stock?.quantity_kilogram ?? 0) }))
  } catch (e) {
    return mockRawStock
  }
}

export async function fetchRoles(): Promise<Role[]> {
  try {
    const res = await api.get('/api/accounts/roles/')
    return res.data.map(mapRole)
  } catch (e) {
    return mockRoles
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await api.get('/api/accounts/users/')
    return res.data.map(mapUser)
  } catch (e) {
    return mockUsers
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await api.get('/api/orders/')
    // map minimal fields to frontend order shape
    return res.data.map((o: any) => ({ id: o.id, customerId: o.customer?.id ?? o.customer, state: o.state?.state ?? (o.state as any), date: o.date, requestedDate: o.requested_date ?? undefined, details: [] as any[], history: [] as any[] }))
  } catch (e) {
    return mockOrders
  }
}

export async function fetchOrderDetails(orderId: number): Promise<Order> {
  try {
    const res = await api.get(`/api/orders/${orderId}/details/`)
    // res.data contains order with details and nested serializers
    const o = res.data
    return {
      id: o.id,
      customerId: o.customer?.id ?? o.customer,
      state: o.state?.state ?? o.state,
      date: o.date,
      requestedDate: o.requested_date ?? undefined,
      details: (o.details ?? []).map((d: any) => ({ productId: d.product?.id ?? d.product, quantity: d.quantity })),
      history: (o.history ?? []).map((h: any) => ({ date: h.change_date ?? h.date, user: h.user?.username ?? h.user, field: h.affected_field ?? h.field, previousValue: h.prev_value ?? h.previousValue, newValue: h.new_value ?? h.newValue })),
    }
  } catch (e) {
    // fallback to mock
    const order = (await import("@/data/mock-data")).orders.find((o) => o.id === orderId)
    return order
  }
}

export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await api.get('/api/billing/invoices/')
    return res.data.map((i: any) => ({ id: i.id, orderId: i.order?.id ?? i.order, userId: i.user?.id ?? i.user, date: i.date, total: parseFloat(i.total ?? 0), paymentMethod: i.payment_method }))
  } catch (e) {
    return mockInvoices
  }
}

export async function fetchMovements(): Promise<StockMovement[]> {
  try {
    const res = await api.get('/api/inventory/movements/')
    return res.data.map((m: any) => ({ id: m.id, productId: m.product?.id ?? m.product, userId: m.user?.id ?? m.user, movementType: m.movement_type, quantity: parseFloat(m.quantity as any), date: m.date, description: m.description }))
  } catch (e) {
    return mockMovements
  }
}

export default {
  fetchProducts,
  fetchCategories,
  fetchCustomers,
  fetchPackagedStock,
  fetchRawStock,
  fetchRoles,
  fetchUsers,
  fetchOrders,
  fetchInvoices,
  fetchMovements,
}
