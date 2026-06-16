import type { LucideIcon } from "lucide-react"

export type RoleName = "Administracion" | "Ventas" | "Operario" | "Despacho"

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  categoryId: number
  name: string
  price: number
  grams: number
  active: boolean
}

export interface Customer {
  id: number
  rut: string
  name: string
  address: string
  lastOrderDate?: string
  balance: number
}

export interface OrderDetail {
  productId: number
  quantity: number
  /** Line total = unit price × quantity, as stored by the backend. */
  price?: number
}

export type OrderState =
  | "Registrado"
  | "Validado"
  | "En produccion"
  | "Listo para despacho"
  | "Enviado"
  | "Pago confirmado"

export interface OrderHistory {
  orderId: number
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
  requestedDate?: string
  details: OrderDetail[]
  history: OrderHistory[]
}

export interface Invoice {
  id: number
  orderId: number
  userId: number
  date: string
  total: number
  paymentMethod: string
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
  totalGrams: number
}

export interface PackagedStock {
  productId: number
  availableStock: number
  allocatedStock: number
  minimumStock: number
  product: Product
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
  productName?: string
  expectedSales: number
  suggestedProduction: number
  confidence: number
  risk: "Bajo" | "Medio" | "Alto"
  availableStock?: number
  allocatedStock?: number
  minimumStock?: number
  productionPlan?: {
    date: string
    expectedSales: number
    suggestedProduction: number
    confidence: number
    risk: "Bajo" | "Medio" | "Alto"
  }[]
}

export interface ForecastStatus {
  trained: boolean
  lastTrainedAt: number | null
  lastTrainedIso: string | null
  nRows: number
  nProducts: number
  nEstimators: number
  maxDepth: number
  testMae: number
  testR2: number
  testMape: number
  lookbackDays: number
  topFeatures: { name: string; importance: number }[]
  classificationMetrics: {
    className: string
    accuracy: number
    recall: number
    precision: number
    f1Score: number
    support: number
  }[]
}

export interface ForecastDiagnostics {
  summary: ForecastStatus
  confusionMatrix: {
    labels: string[]
    edges?: number[]
    matrix: number[][]
  }
  confidenceTable: {
    date: string
    productId: number
    productName: string
    actual: number
    predicted: number
    lower: number
    upper: number
    confidence: number
    actualClass: string
    predictedClass: string
    insideInterval: boolean
    confidenceMethod?: "calibrated" | "tree_agreement" | "calibrated_error_agreement"
  }[]
  message?: string
}

export interface NavGroup {
  label: string
  items: Array<{
    title: string
    url: string
    icon: LucideIcon
  }>
}

export interface DeliveryEvidence {
  id: number
  orderId: number
  publicId: string
  extension: string
  bytes: number
  uploadedBy: {
    id: number
    username: string
  }
  uploadedAt: string
  isArchived: boolean
  url: string
  evidence_type: number
}

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
