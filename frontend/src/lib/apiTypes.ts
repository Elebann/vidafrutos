export type ApiId = number | string | null | undefined

export interface ApiCategory {
  id: number
  name: string
}

export interface ApiProduct {
  id: number
  category?: ApiId
  name: string
  price?: number | string | null
  grams?: number | string | null
  active?: boolean
  raw_stock?: {
    total_grams?: number | string | null
    quantity_kilogram?: number | string | null
    quantity?: number | string | null
  } | null
  packaged_stock?: {
    available_stock?: number | string | null
    allocated_stock?: number | string | null
    minimum_stock?: number | string | null
  } | null
}

export interface ApiCustomer {
  id: number
  rut?: string | null
  name?: string | null
  address?: string | null
  last_order_date?: string | null
  balance?: number | string | null
}

export interface ApiRole {
  id: number
  name: string
  permissions?: string[] | null
}

export interface ApiUser {
  id: number
  rut?: string | null
  username?: string | null
  rol?: { id: number } | null
  roleId?: number | null
  is_active?: boolean
}

export interface ApiOrderDetail {
  product?: ApiId | { id: number }
  quantity?: number | string | null
  price?: number | string | null
  unit_price?: number | string | null
}

export interface ApiOrderHistory {
  change_date?: string | null
  date?: string | null
  user?: string | { username?: string | null } | null
  affected_field?: string | null
  field?: string | null
  prev_value?: string | null
  previousValue?: string | null
  new_value?: string | null
  newValue?: string | null
}

export interface ApiOrder {
  id: number
  customer?: ApiId | { id: number }
  state?: string | { state?: string | null } | null
  date?: string | null
  requested_date?: string | null
  details?: ApiOrderDetail[] | null
  history?: ApiOrderHistory[] | null
}

export interface ApiInvoice {
  id: number
  order?: ApiId | { id: number }
  user?: ApiId | { id: number }
  date?: string | null
  total?: number | string | null
  payment_method?: string | null
}

export interface ApiStockMovement {
  id: number
  product?: ApiId | { id: number }
  user?: ApiId | { id: number }
  movement_type?: string | null
  quantity?: number | string | null
  date?: string | null
  description?: string | null
}

export interface CreateOrderPayload {
  customerId: number | null
  date?: string
  items?: { productId: number | null; quantity: number }[]
}

export interface CreateInventoryMovementPayload {
  productId: number
  movementType: string
  quantity: number
  date?: string
  description?: string
}

export interface CreateUserPayload {
  username: string
  rut: string
  password: string
  rol?: number
}

export interface ApiDeliveryEvidence {
  id: number
  order_id: number
  public_id: string
  extension: string
  bytes: number
  uploaded_by?: { id: number; username?: string | null } | null
  uploaded_at: string
  is_archived: boolean
  url: string
  evidence_type: number
}

export interface CreateDeliveryEvidencePayload {
  publicId: string
  extension: string
  bytes: number
  evidence_type: number
}

export interface ApiForecast {
  productId: number
  productName: string
  expectedSales: number
  suggestedProduction: number
  confidence: number
  risk: "Bajo" | "Medio" | "Alto"
  availableStock: number
  allocatedStock: number
  minimumStock: number
  productionPlan?: {
    date: string
    expectedSales: number
    suggestedProduction: number
    confidence: number
    risk: "Bajo" | "Medio" | "Alto"
  }[]
}

export interface ApiForecastMetric {
  class_name: string
  accuracy: number
  recall: number
  precision: number
  f1_score: number
  support: number
}

export interface ApiForecastStatus {
  trained: boolean
  last_trained_at: number | null
  last_trained_iso: string | null
  n_rows: number
  n_products: number
  n_estimators: number
  max_depth: number
  test_mae: number
  test_r2: number
  test_mape: number
  lookback_days: number
  top_features: { name: string; importance: number }[]
  classification_metrics?: ApiForecastMetric[]
}

export interface ApiForecastTrainResult {
  status: ApiForecastStatus
  suggestions: ApiForecast[]
  elapsed_seconds: number
}

export interface ApiForecastConfusionMatrix {
  labels: string[]
  edges?: number[]
  matrix: number[][]
}

export interface ApiForecastConfidenceRow {
  date: string
  product_id: number
  product_name: string
  actual: number
  predicted: number
  lower: number
  upper: number
  confidence: number
  actual_class: string
  predicted_class: string
  inside_interval: boolean
  confidence_method?: "calibrated" | "tree_agreement" | "calibrated_error_agreement"
}

export interface ApiForecastDiagnostics {
  summary: ApiForecastStatus
  confusion_matrix: ApiForecastConfusionMatrix
  confidence_table: ApiForecastConfidenceRow[]
  message?: string
}
