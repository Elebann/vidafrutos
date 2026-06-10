import { createContext } from "react"

export interface UserInfo {
  username?: string
  rol?: number
  rol_name?: string
  rut: string
}

export interface AuthContextType {
  user: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (rut: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
