import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthState {
  // 主站驗證（persist 到 localStorage）
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
  // 投資組合二次驗證（只存 session，不 persist）
  isPortfolioAuth: boolean
  portfolioLogin: (password: string) => boolean
  portfolioLogout: () => void
}

const APP_PASSWORD       = import.meta.env.VITE_APP_PASSWORD       || 'twstock2024'
const PORTFOLIO_PASSWORD = import.meta.env.VITE_PORTFOLIO_PASSWORD  || 'twstock2024'

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
      logout: () => { set({ isAuthenticated: false, isPortfolioAuth: false }) },

      // 投資組合鎖 — 不會被 persist，關分頁就要重新輸入
      isPortfolioAuth: false,
      portfolioLogin: (password: string): boolean => {
        if (password === PORTFOLIO_PASSWORD) {
          set({ isPortfolioAuth: true })
          return true
        }
        return false
      },
      portfolioLogout: () => { set({ isPortfolioAuth: false }) },
    }),
    {
      name: 'twstock-auth',
      // 只 persist 主站登入狀態，不 persist 投資組合驗證
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated } as AuthState),
    }
  )
)
