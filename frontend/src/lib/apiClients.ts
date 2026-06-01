import api from "@/lib/api"
import {
  mapCategory,
  mapCustomer,
  mapInvoice,
  mapOrder,
  mapPackagedStock,
  mapProduct,
  mapRawStock,
  mapRole,
  mapStockMovement,
  mapUser,
} from "@/lib/apiMappers"
import type {
  Category,
  Customer,
  Invoice,
  Order,
  PackagedStock,
  Product,
  RawStock,
  Role,
  StockMovement,
  User,
} from "@/types/domain"
import type {
  ApiCategory,
  ApiCustomer,
  ApiInvoice,
  ApiOrder,
  ApiProduct,
  ApiRole,
  ApiStockMovement,
  ApiUser,
  CreateInventoryMovementPayload,
  CreateOrderPayload,
} from "@/lib/apiTypes"

async function getList<TResponse, TResult>(
  url: string,
  mapper: (item: TResponse) => TResult,
  params?: Record<string, unknown>
): Promise<TResult[]> {
  try {
    const response = await api.get<TResponse[]>(url, { params })
    return response.data.map(mapper)
  } catch (error) {
    console.error(`Error loading ${url}`, error)
    return []
  }
}

export function fetchProducts(params?: Record<string, unknown>): Promise<Product[]> {
  return getList<ApiProduct, Product>("/api/products/", mapProduct, params)
}

export function fetchCategories(): Promise<Category[]> {
  return getList<ApiCategory, Category>("/api/products/categories/", mapCategory)
}

export function fetchCustomers(): Promise<Customer[]> {
  return getList<ApiCustomer, Customer>("/api/clients/", mapCustomer)
}

export async function createCustomer(payload: { rut: string; name: string; address: string }): Promise<Customer | null> {
  try {
    const response = await api.post<ApiCustomer>("/api/clients/", payload)
    return mapCustomer(response.data)
  } catch (error) {
    console.error("Error creating customer", error)
    return null
  }
}

export async function fetchBackendProducts(): Promise<ApiProduct[]> {
  try {
    const response = await api.get<ApiProduct[]>("/api/products/")
    return response.data
  } catch (error) {
    console.error("Error loading backend products", error)
    return []
  }
}

export async function fetchPackagedStock(): Promise<PackagedStock[]> {
  const products = await fetchBackendProducts()
  return products.map(mapPackagedStock)
}

export async function fetchRawStock(): Promise<RawStock[]> {
  const products = await fetchBackendProducts()
  return products.map(mapRawStock)
}

export function fetchRoles(): Promise<Role[]> {
  return getList<ApiRole, Role>("/api/accounts/roles/", mapRole)
}

export function fetchUsers(): Promise<User[]> {
  return getList<ApiUser, User>("/api/accounts/users/", mapUser)
}

export function fetchOrders(): Promise<Order[]> {
  return getList<ApiOrder, Order>("/api/orders/", mapOrder)
}

export async function fetchOrderDetails(orderId: number): Promise<Order> {
  try {
    const response = await api.get<ApiOrder>(`/api/orders/${orderId}/details/`)
    return mapOrder(response.data)
  } catch (error) {
    console.error(`Error loading order ${orderId}`, error)
    return {
      id: orderId,
      customerId: 0,
      state: "Registrado",
      date: new Date().toISOString().slice(0, 10),
      requestedDate: undefined,
      details: [],
      history: [],
    }
  }
}

export async function fetchOrderStates(): Promise<{ id: number; state: string }[]> {
  try {
    const response = await api.get<{ id: number; state: string }[]>("/api/orders/states/")
    return response.data
  } catch (error) {
    console.error("Error loading order states", error)
    return []
  }
}

export async function updateOrderState(orderId: number, stateId: number, observation?: string): Promise<unknown> {
  const body = observation ? { state: stateId, observation } : { state: stateId }
  const response = await api.patch(`/api/orders/${orderId}/`, body)
  return response.data
}

export function fetchInvoices(): Promise<Invoice[]> {
  return getList<ApiInvoice, Invoice>("/api/billing/invoices/", mapInvoice)
}

export function fetchMovements(): Promise<StockMovement[]> {
  return getList<ApiStockMovement, StockMovement>("/api/inventory/movements/", mapStockMovement)
}

export async function createInventoryMovement(payload: CreateInventoryMovementPayload): Promise<void> {
  await api.post("/api/inventory/movements/", {
    product_id: payload.productId,
    movement_type: payload.movementType,
    quantity: payload.quantity,
    date: payload.date ?? new Date().toISOString(),
    description: payload.description ?? "",
  })
}

export async function updateProductRawStock(productId: number, totalGrams: number): Promise<void> {
  await api.patch(`/api/products/${productId}/`, { raw_stock_total_grams: totalGrams })
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    const orderDate = payload.date ? `${payload.date}T00:00:00Z` : undefined
    const orderResponse = await api.post<ApiOrder>("/api/orders/", {
      customer: payload.customerId,
      date: orderDate,
      state: 1,
    })
    const orderId = orderResponse.data?.id

    for (const item of payload.items ?? []) {
      if (!orderId) continue
      try {
        await api.post(`/api/orders/${orderId}/details/`, {
          product: item.productId,
          quantity: item.quantity,
        })
      } catch (error) {
        console.error(`Error adding detail to order ${orderId}`, error)
      }
    }

    return orderId ? fetchOrderDetails(orderId) : mapOrder(orderResponse.data)
  } catch (error) {
    console.error("Error creating order", error)
    return {
      id: Date.now(),
      customerId: payload.customerId ?? 0,
      state: "Registrado",
      date: new Date().toISOString().slice(0, 10),
      requestedDate: payload.date,
      details: (payload.items ?? []).map((item) => ({
        productId: item.productId ?? 0,
        quantity: item.quantity,
      })),
      history: [],
    }
  }
}

export default {
  fetchProducts,
  fetchCategories,
  fetchCustomers,
  createCustomer,
  fetchBackendProducts,
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
  createInventoryMovement,
  updateProductRawStock,
  createOrder,
}
