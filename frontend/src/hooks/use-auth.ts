import { useContext } from "react"
import { AuthContext } from "@/contexts/auth-context-value"

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}

