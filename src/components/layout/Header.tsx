import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Circle, LogOut, Menu } from 'lucide-react'
import clsx from 'clsx'
import apiClient from '../../api/client'
import { useSummary } from '../../hooks/useSummary'
import { fmt, fmtPct, priceColor } from '../../utils/formatters'
import { useAuthStore, type AuthState } from '../../store/authStore'
import type { SearchResult } from '../../types/api'

interface HeaderProps {
  onStockSelect?: (stockId: string) => void
  onMenuClick?: () => void
}

export default function Header({ onStockSelect, onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s: AuthState) => s.logout)
  const { data: summary, dataUpdatedAt } = useSummary()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (dataUpdatedAt) {
        const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000)
        setCountdown(Math.max(0, 60 - elapsed))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await apiClient.get<SearchResult[]>('/api/search', { params: { q } })
        setResults(data.slice(0, 10))
        setShowDropdown(true)
      } catch {
        setResults([])
      }
    }, 300)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectStock = (stock: SearchResult) => {
    setQuery(`${stock.stock_id} ${stock.stock_name}`)
    setShowDropdown(false)
    if (onStockSelect) {
      onStockSelect(stock.stock_id)
    }
  }

  const taiex = summary?.taiex
  const taiexColor = priceColor(taiex?.change_pct ?? 0)
  const isMarketOpen = summary?.market_open ?? false

  return (
    <header className="border-b border-tv-border bg-tv-card px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-tv-border text-tv-muted transition-colors hover:bg-tv-border hover:text-tv-text md:hidden"
            aria-label="開啟側邊選單"
          >
            <Menu size={18} />
          </button>

          <div ref={searchRef} className="relative min-w-0 flex-1 lg:max-w-sm">
            <div className="flex w-full items-center gap-2 rounded border border-tv-border bg-tv-border px-2.5 py-2">
              <Search size={13} className="shrink-0 text-tv-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query.length > 0 && setShowDropdown(true)}
                placeholder="搜尋股票代號或名稱..."
                className="min-w-0 flex-1 bg-transparent text-xs text-tv-text outline-none placeholder-tv-muted"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setShowDropdown(false)
                  }}
                  className="text-xs leading-none text-tv-muted hover:text-tv-text"
                >
                  ×
                </button>
              )}
            </div>
            {showDropdown && results.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded border border-tv-border bg-tv-card shadow-xl sm:w-80">
                {results.map((r) => (
                  <button
                    key={r.stock_id}
                    onClick={() => handleSelectStock(r)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-tv-border"
                  >
                    <span className="w-14 shrink-0 font-mono text-xs text-tv-accent">{r.stock_id}</span>
                    <span className="flex-1 text-xs text-tv-text">{r.stock_name}</span>
                    <span className="shrink-0 text-[10px] text-tv-muted">{r.market}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="登出"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded border border-tv-border text-tv-muted transition-colors hover:border-red-400/40 hover:text-red-400 lg:hidden"
          >
            <LogOut size={14} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:gap-x-4">
          <div className="flex items-center gap-1.5 rounded-full bg-tv-bg/70 px-2.5 py-1">
            <Circle
              size={8}
              className={clsx(isMarketOpen ? 'text-tv-down fill-tv-down' : 'text-tv-muted fill-tv-muted')}
            />
            <span className={clsx(isMarketOpen ? 'text-tv-down' : 'text-tv-muted')}>
              {isMarketOpen ? '交易中' : '已收盤'}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-tv-muted">加權指數</span>
            <span className={clsx('font-mono text-sm font-semibold', taiexColor)}>
              {taiex ? fmt(taiex.close, 2) : '-'}
            </span>
            <span className={clsx('font-mono', taiexColor)}>
              {taiex ? fmtPct(taiex.change_pct) : '-'}
            </span>
          </div>

          {summary && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-tv-muted">偏多</span>
                <span className="font-semibold text-tv-up">{summary.signals.bullish}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-tv-muted">反彈</span>
                <span className="font-semibold text-tv-warn">{summary.signals.rebound}</span>
              </div>
            </div>
          )}

          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-[10px] text-tv-muted sm:text-xs">
            {summary?.date && <span>資料日期：{summary.date}</span>}

            <div className="flex items-center gap-1.5 rounded-full bg-tv-bg/70 px-2.5 py-1">
              <RefreshCw size={11} className={clsx(countdown <= 5 ? 'animate-spin text-tv-accent' : '')} />
              <span className="font-mono">{countdown}s</span>
            </div>

            <button
              onClick={handleLogout}
              title="登出"
              className="hidden items-center gap-1 rounded border border-tv-border px-2.5 py-1 text-tv-muted transition-colors hover:border-red-400/40 hover:text-red-400 lg:inline-flex"
            >
              <LogOut size={13} />
              <span>登出</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
