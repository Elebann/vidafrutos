/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import api from "@/lib/api"
import type { Category, Customer, Invoice, Order, PackagedStock, Product, RawStock, Role, StockMovement, User, Forecast } from "@/types/domain"

// Backend -> Frontend mappers to keep the frontend shape unchanged
function mapProduct(p: any): Product {
  return {
    id: p.id,
    categoryId: p.category, // backend uses `category`
    name: p.name,
    price: p.price,
    grams: p.grams,
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
    total_grams: parseFloat(r.quantity_kilogram ?? r.quantity ?? 0),
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
  }
  catch (e) {
    // Don't fallback to in-memory mock data anymore; return empty list
    return []
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await api.get('/api/products/categories/')
    return res.data.map(mapCategory)
  } catch (e) {
    return []
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const res = await api.get('/api/clients/')
    return res.data.map(mapCustomer)
  } catch (e) {
    return []
  }
}

export async function createCustomer(payload: { rut: string; name: string; address: string }): Promise<Customer | null> {
  try {
    const res = await api.post('/api/clients/', payload)
    return mapCustomer(res.data)
  } catch (e) {
    return null
  }
}

export async function fetchPackagedStock(): Promise<PackagedStock[]> {
  try {
    const res = await api.get('/api/products/')
    // backend returns packaged_stock nested; flatten to match frontend mock
    return res.data.map((p: any) => ({ productId: p.id, availableStock: p.packaged_stock?.available_stock ?? 0, allocatedStock: p.packaged_stock?.allocated_stock ?? 0, minimumStock: p.packaged_stock?.minimum_stock ?? 0 }))
  } catch (e) {
    return []
  }
}

export async function fetchRawStock(): Promise<RawStock[]> {
  try {
    const res = await api.get('/api/products/')
    return res.data.map((p: any) => ({ productId: p.id, quantityKilogram: parseFloat(p.raw_stock?.quantity_kilogram ?? 0) }))
  } catch (e) {
    return []
  }
}

export async function fetchRoles(): Promise<Role[]> {
  try {
    const res = await api.get('/api/accounts/roles/')
    return res.data.map(mapRole)
  } catch (e) {
    return []
  }
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await api.get('/api/accounts/users/')
    return res.data.map(mapUser)
  } catch (e) {
    return []
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await api.get('/api/orders/')
    // map minimal fields to frontend order shape
    return res.data.map((o: any) => ({
      id: o.id,
      customerId: o.customer?.id ?? o.customer,
      state: o.state?.state ?? o.state,
      date: o.date,
      requestedDate: o.requested_date ?? undefined,
      // If the list endpoint includes details, map them; otherwise leave empty array
      details: (o.details ?? []).map((d: any) => ({ productId: d.product?.id ?? d.product, quantity: d.quantity, price: d.price ?? d.unit_price ?? undefined })),
      history: (o.history ?? []).map((h: any) => ({ date: h.change_date ?? h.date, user: h.user?.username ?? h.user, field: h.affected_field ?? h.field, previousValue: h.prev_value ?? h.previousValue, newValue: h.new_value ?? h.newValue })),
    }))
  } catch (e) {
    return []
  }
}

export async function fetchOrderDetails(orderId: number): Promise<Order> {
  try {
    const res = await api.get(`/api/orders/${orderId}/details/`)
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
    // Return a minimal placeholder order when backend fails;
    return {
      id: orderId,
      customerId: (null as any),
      state: 'Registrado',
      date: new Date().toISOString().slice(0, 10),
      requestedDate: "N/D",
      details: [] as any[],
      history: [] as any[],
    }
  }
}

export async function fetchOrderStates(): Promise<{ id: number; state: string }[]> {
  try {
    const res = await api.get('/api/orders/states/')
    return res.data
  } catch (e) {
    return []
  }
}

export async function updateOrderState(orderId: number, stateId: number, observation?: string): Promise<any> {
  try {
    const body: any = { state: stateId }
    if (observation) body.observation = observation
    const res = await api.patch(`/api/orders/${orderId}/`, body)
    return res.data
  } catch (e) {
    throw e
  }
}

export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await api.get('/api/billing/invoices/')
    return res.data.map((i: any) => ({ id: i.id, orderId: i.order?.id ?? i.order, userId: i.user?.id ?? i.user, date: i.date, total: parseFloat(i.total ?? 0), paymentMethod: i.payment_method }))
  } catch (e) {
    return []
  }
}

export async function fetchMovements(): Promise<StockMovement[]> {
  try {
    const res = await api.get('/api/inventory/movements/')
    return res.data.map((m: any) => ({ id: m.id, productId: m.product?.id ?? m.product, userId: m.user?.id ?? m.user, movementType: m.movement_type, quantity: parseFloat(m.quantity as any), date: m.date, description: m.description }))
  } catch (e) {
    return []
  }
}

export async function createOrder(payload: { customerId: number | null; date?: string; items?: { productId: number | null; quantity: number }[] }): Promise<Order> {
  try {
    // Create the order resource first. Backend expects ISO date with timezone.
    const orderDate = payload.date ? `${payload.date}T00:00:00Z` : undefined
    const createBody = { customer: payload.customerId, date: orderDate, state: 1 }
    const orderRes = await api.post('/api/orders/', createBody)
    const orderId = orderRes.data?.id ?? orderRes.data?.order?.id ?? orderRes.data?.orderId

    if (!orderId) return orderRes.data

    // Attach details: the backend exposes a nested endpoint POST /api/orders/{id}/details/
    const items = payload.items || []
    if (items.length > 0) {
      for (const it of items) {
        const detailBody = { product: it.productId, quantity: it.quantity }
        // Best-effort: try nested create for each detail. If one fails, continue with others and return what we can.
        try {
          await api.post(`/api/orders/${orderId}/details/`, detailBody)
        } catch (err) {
          // swallow: individual detail creation failure should not block returning the created order
        }
      }
    }

    try {
      const full = await api.get(`/api/orders/${orderId}/details/`)
      return full.data as Order
    } catch (err) {
      return orderRes.data as Order
    }
  } catch (e) {
    // Return a lightweight created object so UI can continue; don't mutate in-memory mocks
    const nextId = Date.now()
    return {
      id: nextId,
      customerId: payload.customerId,
      state: 'Registrado',
      date: new Date().toISOString().slice(0, 10),
      requestedDate: payload.date,
      details: (payload.items || []).map((it: any) => ({ productId: it.productId, quantity: it.quantity })),
      history: [],
    }
  }
}

// export async function fetchForecasts(): Promise<Forecast[]> {
//   try {
//     const res = await api.get('/api/forecasts/')
//     return res.data
//   } catch (e) {
//     return []
//   }
// }

export default {
  fetchProducts,
  fetchCategories,
  fetchCustomers,
  fetchPackagedStock,
  fetchRawStock,
  fetchRoles,
  fetchUsers,
  fetchOrders,
  fetchOrderStates,
  updateOrderState,
  fetchOrderDetails,
  fetchInvoices,
  fetchMovements,
  createOrder,
  fetchForecasts,
  createCustomer,
  mapPackagedStock,
  mapRawStock,
}
