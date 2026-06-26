import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface UserInfo {
  name: string
  username?: string
  rol?: number
  rol_name?: string
  rut: string
}

export function getCurrentUser(): UserInfo | null {
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    const user = JSON.parse(userStr)
    return {
      ...user,
      name: user.name || user.username || "",
    }
  } catch {
    return null
  }
}