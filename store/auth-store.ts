import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/lib/api-client"

export interface User {
  id: string
  email: string
  name: string
  role: "STUDENT" | "TEACHER" | "ADMIN"
  studentProfile?: {
    id: string
    interests: string[]
    careerGoals: string
  }
  teacherProfile?: {
    id: string
    department: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post("/api/auth/login", { email, password })
          const { user, token } = response.data

          localStorage.setItem("auth-token", token)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string, name: string, role: string) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post("/api/auth/register", {
            email,
            password,
            name,
            role,
          })
          const { user, token } = response.data

          localStorage.setItem("auth-token", token)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem("auth-token")
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const token = localStorage.getItem("auth-token")
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          const response = await apiClient.get("/api/auth/me")
          set({ user: response.data, token, isAuthenticated: true })
        } catch (error) {
          localStorage.removeItem("auth-token")
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    },
  ),
)
