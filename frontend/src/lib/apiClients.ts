import api from "@/lib/api"
import { getProduct, getPackagedStock, updatePackagedStockInCache } from "@/lib/dataCache"
import { ensureIsoDateOnly, getTodayLocalIsoDate } from "@/lib/format"
import {
  mapCategory,
  mapCustomer,
  mapDeliveryEvidence,
  mapForecast,
  mapForecastDiagnostics,
  mapForecastStatus,
  mapInvoice,
  mapOrder,
  mapOrderHistory,
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
  DeliveryEvidence,
  Forecast,
  ForecastDiagnostics,
  ForecastStatus,
  Invoice,
  Order,
  OrderHistory,
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
  ApiDeliveryEvidence,
  ApiForecast,
  ApiForecastDiagnostics,
  ApiForecastStatus,
  ApiForecastTrainResult,
  ApiInvoice,
  ApiOrder,
  ApiOrderHistory,
  ApiProduct,
  ApiRole,
  ApiStockMovement,
  ApiUser,
  CreateDeliveryEvidencePayload,
  CreateInventoryMovementPayload,
  CreateOrderPayload,
  CreateUserPayload,
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
    const response = await api.get<ApiProduct[]>(
      "/api/products/")
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

export async function createUser(payload: CreateUserPayload): Promise<User | null> {
  try {
    const response = await api.post<ApiUser>("/api/accounts/users/", payload)
    return mapUser(response.data)
  } catch (error) {
    console.error("Error creating user", error)
    return null
  }
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
      date: getTodayLocalIsoDate(),
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

export async function fetchOrderHistory(orderId: number): Promise<OrderHistory[]> {
  try {
    const response = await api.get<ApiOrderHistory[]>(`/api/orders/${orderId}/history/`)
    return response.data.map(mapOrderHistory)
  } catch (error) {
    console.error(`Error loading order ${orderId} history`, error)
    return []
  }
}

export interface PaginatedHistory {
  count: number
  next: string | null
  previous: string | null
  results: OrderHistory[]
}

export async function fetchAllHistory(page = 1, pageSize = 20): Promise<PaginatedHistory> {
  try {
    const response = await api.get<{ count: number; next: string | null; previous: string | null; results: ApiOrderHistory[] }>(
      "/api/orders/history/",
      { params: { page, page_size: pageSize } }
    )
    return {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: response.data.results.map(mapOrderHistory),
    }
  } catch (error) {
    console.error("Error loading history", error)
    return { count: 0, next: null, previous: null, results: [] }
  }
}

export function fetchInvoices(): Promise<Invoice[]> {
  return getList<ApiInvoice, Invoice>("/api/billing/invoices/", mapInvoice)
}

export async function createInvoice(payload: {
  orderId: number
  paymentMethod: string
  total: number
}): Promise<Invoice | null> {
  try {
    const paymentMethodMap: Record<string, string> = {
      Transferencia: "TRANSFER",
      Efectivo: "CASH",
      Debito: "DEBIT_CARD",
      Credito: "CREDIT_CARD",
    }
    const response = await api.post<ApiInvoice>("/api/billing/invoices/", {
      order: payload.orderId,
      total: payload.total,
      payment_method: paymentMethodMap[payload.paymentMethod] ?? payload.paymentMethod,
    })
    return mapInvoice(response.data)
  } catch (error) {
    console.error("Error creating invoice", error)
    return null
  }
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

export async function updateProductPackagedStock(productId: number, availableStock: number): Promise<void> {
  await api.patch(`/api/products/${productId}/`, { packaged_stock_available_stock: availableStock })
}

export async function updateProductMinimumStock(productId: number, minimumStock: number): Promise<void> {
  await api.patch(`/api/products/${productId}/`, { packaged_stock_minimum_stock: minimumStock })
}

export async function toggleProductActive(
  productId: number,
  active: boolean
): Promise<ApiProduct | null> {
  try {
    const response = await api.patch<ApiProduct>(
      `/api/products/${productId}/`,
      { active }
    )
    return response.data
  } catch (error) {
    console.error(`Error toggling product ${productId} active state`, error)
    return null
  }
}

export async function fetchOrderEvidence(
  orderId: number,
  evidence_type: number
): Promise<DeliveryEvidence | null> {
  console.log("Buscando evidencia", orderId, evidence_type)

  try {
    const response = await api.get<ApiDeliveryEvidence | null>(
      `/api/orders/${orderId}/evidence/`,
      {
        params: {
          evidence_type,
        },
      }
    )

    console.log(response.data)

    if (!response.data) return null
    return mapDeliveryEvidence(response.data)
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function uploadDeliveryEvidence(
  orderId: number,
  payload: CreateDeliveryEvidencePayload,
): Promise<DeliveryEvidence | null> {
  try {
    const response = await api.post<ApiDeliveryEvidence>(`/api/orders/${orderId}/evidence/`, {
      public_id: payload.publicId,
      extension: payload.extension,
      bytes: payload.bytes,
      evidence_type: payload.evidence_type
    })
    return mapDeliveryEvidence(response.data)
  } catch (error) {
    console.error(`Error uploading evidence for order ${orderId}`, error)
    return null
  }
}

export async function fetchForecasts(): Promise<Forecast[]> {
  try {
    const response = await api.get<ApiForecast[]>("/api/forecast/")
    return response.data.map(mapForecast)
  } catch (error) {
    console.error("Error loading forecasts", error)
    return []
  }
}

export async function trainForecasts(): Promise<{ suggestions: Forecast[]; status: ForecastStatus; elapsedSeconds: number }> {
  const response = await api.post<ApiForecastTrainResult>("/api/forecast/train/")
  return {
    suggestions: (response.data.suggestions ?? []).map(mapForecast),
    status: mapForecastStatus(response.data.status),
    elapsedSeconds: response.data.elapsed_seconds,
  }
}

export async function fetchForecastStatus(): Promise<ForecastStatus> {
  const response = await api.get<ApiForecastStatus>("/api/forecast/status/")
  return mapForecastStatus(response.data)
}

export async function fetchForecastDiagnostics(): Promise<ForecastDiagnostics> {
  const response = await api.get<ApiForecastDiagnostics>("/api/forecast/diagnostics/")
  return mapForecastDiagnostics(response.data)
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  try {
    const orderDate = payload.date ? ensureIsoDateOnly(payload.date) : undefined
    const orderResponse = await api.post<ApiOrder>("/api/orders/", {
      customer: payload.customerId,
      date: orderDate,
      state: 3, //en producción
    })
    const orderId = orderResponse.data?.id

    for (const item of payload.items ?? []) {
      if (!orderId) continue
      const productId = item.productId
      const quantity = item.quantity
      if (!productId || quantity <= 0) continue

      // Line total = unit price * quantity (stored on the detail)
      const unitPrice = getProduct(productId)?.price ?? 0
      const lineTotal = unitPrice * quantity

      // 1) Create the order detail with the correct line total
      try {
        await api.post(`/api/orders/${orderId}/details/`, {
          product: productId,
          quantity,
          price: lineTotal,
        })
      } catch (error) {
        console.error(`Error adding detail to order ${orderId}`, error)
        continue
      }

      // 2) Move stock from available → allocated
      try {
        const currentStock = getPackagedStock(productId)
        const newAvailable = (currentStock?.availableStock ?? 0) - quantity
        const newAllocated = (currentStock?.allocatedStock ?? 0) + quantity
        await api.patch(`/api/products/${productId}/`, {
          packaged_stock_available_stock: newAvailable,
          packaged_stock_allocated_stock: newAllocated,
        })
        updatePackagedStockInCache(productId, {
          availableStock: newAvailable,
          allocatedStock: newAllocated,
        })
      } catch (error) {
        console.error(`Error updating stock for product ${productId}`, error)
      }
    }

    return orderId ? fetchOrderDetails(orderId) : mapOrder(orderResponse.data)
  } catch (error) {
    console.error("Error creating order", error)
    return {
      id: Date.now(),
      customerId: payload.customerId ?? 0,
      state: "Registrado",
      date: payload.date ? ensureIsoDateOnly(payload.date) : getTodayLocalIsoDate(),
      requestedDate: payload.date ? ensureIsoDateOnly(payload.date) : undefined,
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
  createUser,
  fetchOrders,
  fetchOrderStates,
  updateOrderState,
  fetchOrderDetails,
  fetchOrderHistory,
  fetchAllHistory,
  fetchInvoices,
  createInvoice,
  fetchMovements,
  createInventoryMovement,
  updateProductRawStock,
  updateProductPackagedStock,
  updateProductMinimumStock,
  createOrder,
  toggleProductActive,
  fetchOrderEvidence,
  uploadDeliveryEvidence,
  fetchForecasts,
  trainForecasts,
  fetchForecastStatus,
  fetchForecastDiagnostics,
}
