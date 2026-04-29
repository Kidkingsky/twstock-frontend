import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Circle } from 'lucide-react'
import clsx from 'clsx'
import apiClient from '../../api/client'
import { useSummary } from '../../hooks/useSummary'
import { fmt, fmtPct, priceColor } from '../../utils/formatters'
import type { SearchResult } from '../../types/api'

interface HeaderProps {
  onStockSelect?: (stockId: string) => void
}

export default function Header({ onStockSelect }: HeaderProps) {
  const navigate = useNavigate()
  const { data: summary, dataUpdatedAt } = useSummary()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataUpdatedAt) {
        const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000)
        setCountdown(Math.max(0, 60 - elapsed))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  // Search debounce
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

  // Click outside to close
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
    <header className="h-12 bg-tv-card border-b border-tv-border flex items-center px-4 gap-4 shrink-0">
      {/* Search */}
      <div ref={searchRef} className="relative flex-shrink-0">
        <div className="flex items-center bg-tv-border rounded px-2.5 py-1 gap-2 w-64">
          <Search size={13} className="text-tv-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length > 0 && setShowDropdown(true)}
            placeholder="搜尋股票代號或名稱..."
            className="bg-transparent text-tv-text text-xs outline-none flex-1 placeholder-tv-muted"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowDropdown(false) }}
              className="text-tv-muted hover:text-tv-text text-xs leading-none"
            >
              ×
            </button>
          )}
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-tv-card border border-tv-border rounded shadow-xl z-50 max-h-72 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.stock_id}
                onClick={() => handleSelectStock(r)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-tv-border text-left transition-colors"
              >
                <span className="text-tv-accent font-mono text-xs w-14 shrink-0">{r.stock_id}</span>
                <span className="text-tv-text text-xs flex-1">{r.stock_name}</span>
                <span className="text-tv-muted text-[10px] shrink-0">{r.market}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Market status */}
      <div className="flex items-center gap-1.5">
        <Circle
          size={8}
          className={clsx(isMarketOpen ? 'text-tv-down fill-tv-down' : 'text-tv-muted fill-tv-muted')}
        />
        <span className={clsx('text-xs', isMarketOpen ? 'text-tv-down' : 'text-tv-muted')}>
          {isMarketOpen ? '交易中' : '已收盤'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-tv-border" />

      {/* TAIEX */}
      <div className="flex items-center gap-2">
        <span className="text-tv-muted text-xs">加權指數</span>
        <span className={clsx('text-sm font-semibold font-mono', taiexColor)}>
          {taiex ? fmt(taiex.close, 2) : '-'}
        </span>
        <span className={clsx('text-xs font-mono', taiexColor)}>
          {taiex ? fmtPct(taiex.change_pct) : '-'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-tv-border" />

      {/* Signal counts */}
      {summary && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-tv-muted">偏多</span>
            <span className="text-xs font-semibold text-tv-up">{summary.signals.bullish}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-tv-muted">反彈</span>
            <span className="text-xs font-semibold text-tv-warn">{summary.signals.rebound}</span>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date */}
      {summary?.date && (
        <span className="text-[10px] text-tv-muted">資料日期：{summary.date}</span>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-tv-border" />

      {/* Refresh countdown */}
      <div className="flex items-center gap-1.5 text-tv-muted">
        <RefreshCw size={11} className={clsx(countdown <= 5 ? 'text-tv-accent animate-spin' : '')} />
        <span className="text-[10px] font-mono">{countdown}s</span>
      </div>
    </header>
  )
}
