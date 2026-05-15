import type { LucideIcon } from "lucide-react"

export type RoleName = "Administracion" | "Ventas" | "Produccion"

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  categoryId: number
  name: string
  price: number
  active: boolean
}

export interface Customer {
  id: number
  rut: string
  name: string
  address: string
  lastOrderDate: string
  balance: number
}

export interface OrderDetail {
  productId: number
  quantity: number
}

export type OrderState =
  | "Registrado"
  | "Validado"
  | "En produccion"
  | "Listo para despacho"
  | "Despachado"
  | "Facturado"

export interface OrderHistory {
  date: string
  user: string
  field: string
  previousValue: string
  newValue: string
}

export interface Order {
  id: number
  customerId: number
  state: OrderState
  date: string
  requestedDate: string
  details: OrderDetail[]
  history: OrderHistory[]
}

export interface Invoice {
  id: number
  orderId: number
  userId: number
  date: string
  total: number
  paymentMethod: "Efectivo" | "Transferencia" | "Debito" | "Credito"
}

export interface Role {
  id: number
  name: RoleName
  permissions: string[]
}

export interface User {
  id: number
  rut: string
  username: string
  name: string
  roleId: number
  active: boolean
}

export interface RawStock {
  productId: number
  quantityKilogram: number
}

export interface PackagedStock {
  productId: number
  availableStock: number
  allocatedStock: number
  minimumStock: number
}

export type StockMovementType = "ENTRADA" | "SALIDA" | "AJUSTE" | "MERMA"

export interface StockMovement {
  id: number
  productId: number
  userId: number
  movementType: StockMovementType
  quantity: number
  date: string
  description: string
}

export interface Forecast {
  productId: number
  expectedSales: number
  suggestedProduction: number
  confidence: number
  risk: "Bajo" | "Medio" | "Alto"
}

export interface NavGroup {
  label: string
  items: Array<{
    title: string
    url: string
    icon: LucideIcon
  }>
}
