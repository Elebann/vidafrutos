import type {
  Category,
  Customer,
  DeliveryEvidence,
  Forecast,
  ForecastDiagnostics,
  ForecastStatus,
  Invoice,
  Order,
  OrderState,
  PackagedStock,
  Product,
  RawStock,
  Role,
  RoleName,
  StockMovement,
  StockMovementType,
  User,
} from "@/types/domain"
import type {
  ApiCategory,
  ApiCustomer,
  ApiDeliveryEvidence,
  ApiForecast,
  ApiForecastDiagnostics,
  ApiForecastStatus,
  ApiId,
  ApiInvoice,
  ApiOrder,
  ApiOrderDetail,
  ApiProduct,
  ApiRole,
  ApiStockMovement,
  ApiUser,
} from "@/lib/apiTypes"

const ORDER_STATES: readonly OrderState[] = [
  "Registrado",
  "Validado",
  "En produccion",
  "Listo para despacho",
  "Enviado",
  "Pago confirmado",
]

const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = ["ENTRADA", "SALIDA", "AJUSTE", "MERMA"]

function numberFrom(value: number | string | null | undefined, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function stringFrom(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback
}

function idFrom(value: ApiId | { id: number }, fallback = 0): number {
  if (typeof value === "object" && value !== null) return value.id
  return numberFrom(value, fallback)
}

function orderStateFrom(value: ApiOrder["state"]): OrderState {
  const state = typeof value === "object" && value !== null ? value.state : value
  return ORDER_STATES.includes(state as OrderState) ? (state as OrderState) : "Registrado"
}

function movementTypeFrom(value: string | null | undefined): StockMovementType {
  return STOCK_MOVEMENT_TYPES.includes(value as StockMovementType) ? (value as StockMovementType) : "AJUSTE"
}

export function mapProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    categoryId: idFrom(product.category),
    name: product.name,
    price: numberFrom(product.price),
    grams: numberFrom(product.grams),
    active: product.active ?? true,
  }
}

export function mapCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    name: category.name,
  }
}

export function mapCustomer(customer: ApiCustomer): Customer {
  return {
    id: customer.id,
    rut: stringFrom(customer.rut),
    name: stringFrom(customer.name),
    address: stringFrom(customer.address),
    lastOrderDate: customer.last_order_date ?? undefined,
    balance: numberFrom(customer.balance),
  }
}

export function mapPackagedStock(product: ApiProduct): PackagedStock {
  return {
    productId: product.id,
    availableStock: numberFrom(product.packaged_stock?.available_stock),
    allocatedStock: numberFrom(product.packaged_stock?.allocated_stock),
    minimumStock: numberFrom(product.packaged_stock?.minimum_stock),
  }
}

export function mapRawStock(product: ApiProduct): RawStock {
  return {
    productId: product.id,
    totalGrams: numberFrom(
      product.raw_stock?.total_grams ?? product.raw_stock?.quantity_kilogram ?? product.raw_stock?.quantity
    ),
  }
}

export function mapRole(role: ApiRole): Role {
  return {
    id: role.id,
    name: role.name as RoleName,
    permissions: role.permissions ?? [],
  }
}

export function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    rut: user.rut ?? "",
    username: user.username ?? "",
    name: user.username ?? "",
    roleId: user.rol?.id ?? user.roleId ?? 0,
    active: user.is_active ?? true,
  }
}

function mapOrderDetail(detail: ApiOrderDetail) {
  const price = detail.price ?? detail.unit_price

  return {
    productId: idFrom(detail.product),
    quantity: numberFrom(detail.quantity),
    ...(price === null || price === undefined ? {} : { price: numberFrom(price) }),
  }
}

export function mapOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    customerId: idFrom(order.customer),
    state: orderStateFrom(order.state),
    date: order.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    requestedDate: order.requested_date ?? undefined,
    details: (order.details ?? []).map(mapOrderDetail),
    history: (order.history ?? []).map((history) => ({
      date: history.change_date ?? history.date ?? "",
      user: typeof history.user === "object" && history.user !== null ? history.user.username ?? "" : history.user ?? "",
      field: history.affected_field ?? history.field ?? "",
      previousValue: history.prev_value ?? history.previousValue ?? "",
      newValue: history.new_value ?? history.newValue ?? "",
    })),
  }
}

export function mapInvoice(invoice: ApiInvoice): Invoice {
  return {
    id: invoice.id,
    orderId: idFrom(invoice.order),
    userId: idFrom(invoice.user),
    date: invoice.date ?? "",
    total: numberFrom(invoice.total),
    paymentMethod: invoice.payment_method ?? "Efectivo",
  }
}

export function mapStockMovement(movement: ApiStockMovement): StockMovement {
  return {
    id: movement.id,
    productId: idFrom(movement.product),
    userId: idFrom(movement.user),
    movementType: movementTypeFrom(movement.movement_type),
    quantity: numberFrom(movement.quantity),
    date: movement.date ?? "",
    description: movement.description ?? "",
  }
}

export function mapDeliveryEvidence(evidence: ApiDeliveryEvidence): DeliveryEvidence {
  return {
    id: evidence.id,
    orderId: numberFrom(evidence.order_id),
    publicId: stringFrom(evidence.public_id),
    extension: stringFrom(evidence.extension),
    bytes: numberFrom(evidence.bytes),
    uploadedBy: {
      id: idFrom(evidence.uploaded_by, 0),
      username: evidence.uploaded_by?.username ?? "",
    },
    uploadedAt: evidence.uploaded_at ?? "",
    isArchived: Boolean(evidence.is_archived),
    url: stringFrom(evidence.url),
    evidence_type: numberFrom(evidence.evidence_type),
  }
}

export function mapForecast(forecast: ApiForecast): Forecast {
  return {
    productId: forecast.productId,
    productName: forecast.productName,
    expectedSales: forecast.expectedSales,
    suggestedProduction: forecast.suggestedProduction,
    confidence: forecast.confidence,
    risk: forecast.risk,
    availableStock: forecast.availableStock,
    allocatedStock: forecast.allocatedStock,
    minimumStock: forecast.minimumStock,
    productionPlan: forecast.productionPlan ?? [],
  }
}

export function mapForecastStatus(status: ApiForecastStatus): ForecastStatus {
  return {
    trained: Boolean(status.trained),
    lastTrainedAt: status.last_trained_at,
    lastTrainedIso: status.last_trained_iso,
    nRows: numberFrom(status.n_rows),
    nProducts: numberFrom(status.n_products),
    nEstimators: numberFrom(status.n_estimators),
    maxDepth: numberFrom(status.max_depth),
    testMae: numberFrom(status.test_mae),
    testR2: numberFrom(status.test_r2),
    testMape: numberFrom(status.test_mape),
    lookbackDays: numberFrom(status.lookback_days),
    topFeatures: (status.top_features ?? []).map((f) => ({
      name: f.name,
      importance: numberFrom(f.importance),
    })),
    classificationMetrics: (status.classification_metrics ?? []).map((metric) => ({
      className: metric.class_name,
      accuracy: numberFrom(metric.accuracy),
      recall: numberFrom(metric.recall),
      precision: numberFrom(metric.precision),
      f1Score: numberFrom(metric.f1_score),
      support: numberFrom(metric.support),
    })),
  }
}

export function mapForecastDiagnostics(diagnostics: ApiForecastDiagnostics): ForecastDiagnostics {
  return {
    summary: mapForecastStatus(diagnostics.summary),
    confusionMatrix: {
      labels: diagnostics.confusion_matrix.labels,
      edges: diagnostics.confusion_matrix.edges,
      matrix: diagnostics.confusion_matrix.matrix,
    },
    confidenceTable: (diagnostics.confidence_table ?? []).map((row) => ({
      date: row.date,
      productId: row.product_id,
      productName: row.product_name,
      actual: row.actual,
      predicted: row.predicted,
      lower: row.lower,
      upper: row.upper,
      confidence: row.confidence,
      actualClass: row.actual_class,
      predictedClass: row.predicted_class,
      insideInterval: row.inside_interval,
      confidenceMethod: row.confidence_method,
    })),
    message: diagnostics.message,
  }
}
