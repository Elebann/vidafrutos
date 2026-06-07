import axios from "axios"
import type { AxiosInstance } from "axios"

const DEFAULT_API_BASE = `${location.protocol}//${location.hostname}:8000`
// const DEFAULT_API_BASE = 'https://server-production-36cb.up.railway.app'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || DEFAULT_API_BASE

console.info("API base URL:", API_BASE_URL)
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          })

          localStorage.setItem("access_token", response.data.access)
          api.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`
          originalRequest.headers["Authorization"] = `Bearer ${response.data.access}`

          return api(originalRequest)
        }
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export default api

