import { useAuthStore } from "@/store/auth-store"

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, register, logout, checkAuth } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  }
}
