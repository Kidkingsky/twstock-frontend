import { useState } from 'react'
import clsx from 'clsx'
import { Lock, TrendingUp, TrendingDown, DollarSign, BarChart2, Eye, EyeOff, LogOut } from 'lucide-react'
import { useAuthStore, type AuthState } from '../store/authStore'
import { usePortfolioSummary, usePortfolioOrders } from '../hooks/usePortfolio'
import type { MonthlyPnl, OpenPosition, RealizedTrade, TradeOrder } from '../hooks/usePortfolio'
import { fmt, fmtPct, priceColor } from '../utils/formatters'

// ── 密碼鎖畫面 ────────────────────────────────────────────────────
function PortfolioLock() {
  const portfolioLogin = useAuthStore((s: AuthState) => s.portfolioLogin)
  const [pw, setPw]       = useState('')
  const [error, setError] = useState(false)
  const [show, setShow]   = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (portfolioLogin(pw)) {
      setError(false)
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-tv-border flex items-center justify-center">
          <Lock size={28} className="text-tv-muted" />
        </div>
        <h2 className="text-lg font-semibold text-tv-text">個人投資組合</h2>
        <p className="text-xs text-tv-muted">此頁面需要額外驗證才能查看</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-72">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="輸入個人密碼"
            autoFocus
            className={clsx(
              'w-full rounded border bg-tv-border px-4 py-2.5 pr-10 text-sm text-tv-text outline-none placeholder-tv-muted',
              error ? 'border-tv-down/60' : 'border-tv-border focus:border-tv-accent'
            )}
          />
          <button type="button" onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tv-muted hover:text-tv-text">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {error && <p className="text-xs text-tv-down text-center">密碼錯誤，請重試</p>}
        <button type="submit"
          className="rounded bg-tv-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          解鎖
        </button>
      </form>
    </div>
  )
}

// ── 統計卡片 ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div className="tv-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-tv-muted">{label}</span>
        <span className="text-tv-muted opacity-60">{icon}</span>
      </div>
      <span className={clsx('text-xl font-bold font-mono', color || 'text-tv-text')}>{value}</span>
      {sub && <span className="text-[10px] text-tv-muted">{sub}</span>}
    </div>
  )
}

// ── 月損益長條圖 ─────────────────────────────────────────────────
function MonthlyBarChart({ data }: { data: MonthlyPnl[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => Math.abs(d.pnl)), 1)

  return (
    <div className="tv-card p-4">
      <p className="text-xs font-semibold text-tv-text mb-4">月損益</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => {
          const pct = (Math.abs(d.pnl) / max) * 100
          const isPos = d.pnl >= 0
          return (
            <div key={d.month} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className={clsx('text-[9px] font-mono', isPos ? 'text-tv-up' : 'text-tv-down')}>
                {d.pnl >= 0 ? '+' : ''}{(d.pnl / 1000).toFixed(1)}k
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className={clsx('w-full rounded-t transition-all', isPos ? 'bg-tv-up' : 'bg-tv-down')}
                  style={{ height: `${pct * 0.8}%`, minHeight: '4px' }}
                />
              </div>
              <span className="text-[9px] text-tv-muted truncate w-full text-center">{d.month.slice(5)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 持倉環圖 ─────────────────────────────────────────────────────
function HoldingsPie({ positions }: { positions: OpenPosition[] }) {
  if (!positions.length) return null
  const total = positions.reduce((s, p) => s + p.current_value, 0)
  const colors = ['#2962ff', '#26a69a', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4']

  let cumAngle = 0
  const slices = positions.map((p, i) => {
    const pct = p.current_value / total
    const startAngle = cumAngle
    cumAngle += pct * 360
    return { ...p, pct, startAngle, endAngle: cumAngle, color: colors[i % colors.length] }
  })

  const polarToXY = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) }
  }

  return (
    <div className="tv-card p-4">
      <p className="text-xs font-semibold text-tv-text mb-3">持倉配置</p>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
          {slices.map((s) => {
            const start = polarToXY(s.startAngle, 38)
            const end   = polarToXY(s.endAngle, 38)
            const large = s.pct > 0.5 ? 1 : 0
            return (
              <path
                key={s.stock_id}
                d={`M 50 50 L ${start.x} ${start.y} A 38 38 0 ${large} 1 ${end.x} ${end.y} Z`}
                fill={s.color}
                opacity={0.85}
              />
            )
          })}
          <circle cx="50" cy="50" r="22" fill="#1e222d" />
          <text x="50" y="54" textAnchor="middle" fontSize="8" fill="#787b86">持倉</text>
        </svg>
        <div className="flex flex-col gap-1.5 flex-1">
          {slices.map((s) => (
            <div key={s.stock_id} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] text-tv-text flex-1">{s.stock_name}</span>
              <span className="text-[11px] font-mono text-tv-muted">{(s.pct * 100).toFixed(0)}%</span>
              <span className={clsx('text-[10px] font-mono', priceColor(s.unrealized_pnl))}>
                {s.unrealized_pnl >= 0 ? '+' : ''}{s.unrealized_pnl.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 持倉明細表 ───────────────────────────────────────────────────
function OpenPositionsTable({ positions }: { positions: OpenPosition[] }) {
  return (
    <div className="tv-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-tv-border">
        <p className="text-xs font-semibold text-tv-text">目前持倉</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-tv-border bg-tv-bg/50 text-tv-muted">
              <th className="text-left px-4 py-2 font-medium">股票</th>
              <th className="text-right px-4 py-2 font-medium">張數</th>
              <th className="text-right px-4 py-2 font-medium">均成本</th>
              <th className="text-right px-4 py-2 font-medium">現價</th>
              <th className="text-right px-4 py-2 font-medium">市值</th>
              <th className="text-right px-4 py-2 font-medium">未實現損益</th>
              <th className="text-right px-4 py-2 font-medium">報酬率</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.stock_id} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                <td className="px-4 py-2.5">
                  <span className="font-mono text-tv-accent text-[11px]">{p.stock_id}</span>
                  <span className="ml-2 text-tv-text text-[11px]">{p.stock_name}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{p.quantity}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-muted">{fmt(p.avg_cost, 2)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{fmt(p.current_price, 2)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{p.current_value.toLocaleString()}</td>
                <td className={clsx('px-4 py-2.5 text-right font-mono font-semibold', priceColor(p.unrealized_pnl))}>
                  {p.unrealized_pnl >= 0 ? '+' : ''}{p.unrealized_pnl.toLocaleString()}
                </td>
                <td className={clsx('px-4 py-2.5 text-right font-mono', priceColor(p.unrealized_pct))}>
                  {fmtPct(p.unrealized_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 已實現損益表 ─────────────────────────────────────────────────
function RealizedTable({ trades }: { trades: RealizedTrade[] }) {
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  return (
    <div className="tv-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-tv-border flex items-center justify-between">
        <p className="text-xs font-semibold text-tv-text">已實現損益</p>
        <span className={clsx('text-xs font-bold font-mono', priceColor(totalPnl))}>
          {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString()}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-tv-border bg-tv-bg/50 text-tv-muted">
              <th className="text-left px-4 py-2 font-medium">股票</th>
              <th className="text-right px-4 py-2 font-medium">數量</th>
              <th className="text-right px-4 py-2 font-medium">買入均價</th>
              <th className="text-right px-4 py-2 font-medium">賣出均價</th>
              <th className="text-right px-4 py-2 font-medium">損益</th>
              <th className="text-right px-4 py-2 font-medium">報酬率</th>
              <th className="text-right px-4 py-2 font-medium">賣出日期</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const pct = ((t.sell_price - t.buy_price) / t.buy_price) * 100
              return (
                <tr key={i} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-tv-accent text-[11px]">{t.stock_id}</span>
                    <span className="ml-2 text-tv-text text-[11px]">{t.stock_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-tv-text">{t.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-tv-muted">{fmt(t.buy_price, 2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-tv-text">{fmt(t.sell_price, 2)}</td>
                  <td className={clsx('px-4 py-2.5 text-right font-mono font-semibold', priceColor(t.pnl))}>
                    {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString()}
                  </td>
                  <td className={clsx('px-4 py-2.5 text-right font-mono', priceColor(pct))}>
                    {fmtPct(pct)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[10px] text-tv-muted">{t.trade_date}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 交易明細表 ───────────────────────────────────────────────────
function OrdersTable({ orders }: { orders: TradeOrder[] }) {
  return (
    <div className="tv-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-tv-border">
        <p className="text-xs font-semibold text-tv-text">全部交易明細</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-tv-border bg-tv-bg/50 text-tv-muted">
              <th className="text-left px-4 py-2 font-medium">日期</th>
              <th className="text-left px-4 py-2 font-medium">股票</th>
              <th className="text-center px-4 py-2 font-medium">方向</th>
              <th className="text-right px-4 py-2 font-medium">數量</th>
              <th className="text-right px-4 py-2 font-medium">成交價</th>
              <th className="text-right px-4 py-2 font-medium">金額</th>
              <th className="text-right px-4 py-2 font-medium hidden md:table-cell">手續費</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">備註</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                <td className="px-4 py-2.5 font-mono text-[10px] text-tv-muted">{o.trade_date}</td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-tv-accent text-[11px]">{o.stock_id}</span>
                  <span className="ml-2 text-tv-text text-[11px]">{o.stock_name}</span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                    o.side === 'buy'
                      ? 'bg-tv-up/20 text-tv-up'
                      : 'bg-tv-down/20 text-tv-down'
                  )}>
                    {o.side === 'buy' ? '買入' : '賣出'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{o.quantity}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{fmt(o.price, 2)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-text">{Number(o.amount).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right font-mono text-tv-muted hidden md:table-cell">
                  {o.fee > 0 ? o.fee : '-'}
                </td>
                <td className="px-4 py-2.5 text-[10px] text-tv-muted hidden lg:table-cell max-w-[200px] truncate">
                  {o.note ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────
export default function PortfolioPage() {
  const isPortfolioAuth  = useAuthStore((s: AuthState) => s.isPortfolioAuth)
  const portfolioLogout  = useAuthStore((s: AuthState) => s.portfolioLogout)

  const { data: portfolio, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: orders,    isLoading: ordersLoading  } = usePortfolioOrders()

  if (!isPortfolioAuth) return <PortfolioLock />

  const s = portfolio?.summary

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-tv-accent" />
          <h1 className="text-sm font-semibold text-tv-text">個人投資組合</h1>
        </div>
        <button
          onClick={portfolioLogout}
          className="flex items-center gap-1 text-[11px] text-tv-muted hover:text-tv-down transition-colors"
        >
          <LogOut size={12} />鎖定
        </button>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}
        </div>
      ) : s && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="目前持倉市值"
            value={`$${s.total_current.toLocaleString()}`}
            sub={`成本 $${s.total_invested.toLocaleString()}`}
            color="text-tv-text"
            icon={<DollarSign size={14} />}
          />
          <StatCard
            label="已實現損益"
            value={`${s.realized_pnl >= 0 ? '+' : ''}$${s.realized_pnl.toLocaleString()}`}
            sub={`已平倉 ${s.closed_count} 檔`}
            color={priceColor(s.realized_pnl)}
            icon={<TrendingUp size={14} />}
          />
          <StatCard
            label="未實現損益"
            value={`${s.unrealized_pnl >= 0 ? '+' : ''}$${s.unrealized_pnl.toLocaleString()}`}
            sub={`持倉 ${s.open_count} 檔`}
            color={priceColor(s.unrealized_pnl)}
            icon={<TrendingDown size={14} />}
          />
          <StatCard
            label="總損益"
            value={`${s.total_pnl >= 0 ? '+' : ''}$${s.total_pnl.toLocaleString()}`}
            sub={`總報酬 ${s.total_pnl_pct >= 0 ? '+' : ''}${s.total_pnl_pct}%`}
            color={priceColor(s.total_pnl)}
            icon={<BarChart2 size={14} />}
          />
        </div>
      )}

      {/* Charts Row */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HoldingsPie positions={portfolio.open_positions} />
          <MonthlyBarChart data={portfolio.monthly_pnl} />
        </div>
      )}

      {/* Open Positions */}
      {portfolio?.open_positions?.length ? (
        <OpenPositionsTable positions={portfolio.open_positions} />
      ) : null}

      {/* Realized Trades */}
      {portfolio?.realized_trades?.length ? (
        <RealizedTable trades={portfolio.realized_trades} />
      ) : null}

      {/* All Orders */}
      {ordersLoading ? (
        <div className="skeleton h-32 rounded" />
      ) : orders?.length ? (
        <OrdersTable orders={orders} />
      ) : null}
    </div>
  )
}
