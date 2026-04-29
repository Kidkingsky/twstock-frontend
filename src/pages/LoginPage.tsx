import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, type AuthState } from '../store/authStore'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s: AuthState) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(false)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const ok = login(password)
    setLoading(false)
    if (ok) {
      navigate(from, { replace: true })
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-tv-bg flex items-center justify-center p-4">
      {/* Background subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#787b86 1px, transparent 1px), linear-gradient(90deg, #787b86 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            {/* Chart icon */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#2962ff" />
              <path
                d="M6 22 L11 14 L16 18 L21 9 L26 13"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="26" cy="13" r="2" fill="white" />
            </svg>
            <span className="text-tv-text font-bold text-xl tracking-tight">TW Stock</span>
          </div>
          <p className="text-tv-muted text-sm">台灣股市技術分析儀表板</p>
        </div>

        {/* Card */}
        <div className="tv-card p-6">
          <h2 className="text-tv-text font-semibold text-base mb-5">請輸入訪問密碼</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-tv-muted text-xs mb-1.5">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                placeholder="••••••••"
                autoFocus
                className={`w-full bg-tv-bg border rounded px-3 py-2 text-sm text-tv-text placeholder-tv-muted/40 outline-none transition-colors
                  ${error
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-tv-border focus:border-tv-accent'
                  }`}
              />
              {error && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm.5 7.5h-1v-1h1v1zm0-2h-1V3.5h1V6.5z"/>
                  </svg>
                  密碼錯誤，請重試
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="tv-btn-primary w-full py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  驗證中...
                </>
              ) : (
                '進入系統'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-tv-muted/40 text-xs mt-5">
          © {new Date().getFullYear()} TW Stock Dashboard
        </p>
      </div>
    </div>
  )
}
