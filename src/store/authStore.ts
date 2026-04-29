import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthState {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'twstock2024'

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set) => ({
      isAuthenticated: false,
      login: (password: string): boolean => {
        if (password === APP_PASSWORD) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },
      logout: () => { set({ isAuthenticated: false }) },
    }),
    {
      name: 'twstock-auth',
    }
  )
)
