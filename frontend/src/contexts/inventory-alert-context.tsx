import { createContext, useContext, useState, type ReactNode } from "react"

export interface LowStockProduct {
  productName: string
  kgDisponible: number
  gramsRequeridos: number
  paquetesPosibles: number
}

interface InventoryAlertContextValue {
  lowStockProducts: LowStockProduct[]
  setLowStockProducts: (products: LowStockProduct[]) => void
}

const InventoryAlertContext = createContext<InventoryAlertContextValue | null>(null)

export function InventoryAlertProvider({ children }: { children: ReactNode }) {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])

  return (
    <InventoryAlertContext.Provider value={{ lowStockProducts, setLowStockProducts }}>
      {children}
    </InventoryAlertContext.Provider>
  )
}

export function useInventoryAlerts() {
  const ctx = useContext(InventoryAlertContext)
  if (!ctx) throw new Error("useInventoryAlerts must be used within InventoryAlertProvider")
  return ctx
}
