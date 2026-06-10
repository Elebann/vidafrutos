import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return ""

  return new Date(date).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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