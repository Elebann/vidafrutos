import type {
  Category,
  Customer,
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
  "Despachado",
  "Facturado",
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
    active: true,
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
    date: order.date ?? new Date().toISOString().slice(0, 10),
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
