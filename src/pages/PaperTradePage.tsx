import { useState } from 'react'
import clsx from 'clsx'
import { FlaskConical, TrendingUp, CheckCircle, XCircle, Clock, X, Trash2 } from 'lucide-react'
import { usePaperTrades, usePaperPerformance, useClosePaperTrade, useDeletePaperTrade, type PaperTrade, type SignalStats } from '../hooks/usePaperTrade'
import { fmt, fmtPct, priceColor } from '../utils/formatters'

// ── 訊號顏色 ─────────────────────────────────────────────────────
const SIGNAL_LABEL: Record<string, { label: string; cls: string }> = {
  STRONG_BUY:  { label: '強買',   cls: 'bg-tv-up/20 text-tv-up border-tv-up/30' },
  BUY:         { label: '買入',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  WATCH:       { label: '強但熱', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  NEUTRAL:     { label: '中性',   cls: 'bg-tv-border text-tv-muted border-tv-border' },
  SELL:        { label: '賣出',   cls: 'bg-tv-down/20 text-tv-down border-tv-down/30' },
}

function SignalTag({ signal }: { signal: string | null }) {
  if (!signal) return null
  const { label, cls } = SIGNAL_LABEL[signal] ?? { label: signal, cls: 'bg-tv-border text-tv-muted border-tv-border' }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border font-medium', cls)}>{label}</span>
  )
}

// ── 勝率環圖 ─────────────────────────────────────────────────────
function WinRateRing({ rate, count }: { rate: number; count: number }) {
  const r = 22; const circ = 2 * Math.PI * r
  const color = rate >= 60 ? '#26a69a' : rate >= 40 ? '#ff9800' : '#ef5350'
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#2a2e39" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(rate / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center leading-tight">
        <span className="text-[11px] font-bold font-mono" style={{ color }}>{rate}%</span>
        <span className="text-[8px] text-tv-muted">{count}筆</span>
      </div>
    </div>
  )
}

// ── 訊號統計卡 ───────────────────────────────────────────────────
function SignalCard({ signal, stats }: { signal: string; stats: SignalStats }) {
  if (stats.count === 0) return null
  const { label, cls } = SIGNAL_LABEL[signal] ?? { label: signal, cls: 'bg-tv-border text-tv-muted border-tv-border' }
  const winRate = stats.win_rate ?? 0
  return (
    <div className="tv-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={clsx('text-xs px-2 py-0.5 rounded border font-semibold', cls)}>{label}</span>
        <span className="text-[10px] text-tv-muted">{stats.count} 筆已到期</span>
      </div>
      <div className="flex items-center gap-4">
        <WinRateRing rate={winRate} count={stats.count} />
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex gap-2">
            <span className="text-tv-muted w-14">平均報酬</span>
            <span className={clsx('font-mono font-semibold', priceColor(stats.avg_return ?? 0))}>
              {(stats.avg_return ?? 0) >= 0 ? '+' : ''}{stats.avg_return?.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-tv-muted w-14">中位報酬</span>
            <span className={clsx('font-mono', priceColor(stats.median_return ?? 0))}>
              {(stats.median_return ?? 0) >= 0 ? '+' : ''}{stats.median_return?.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-tv-muted w-14">最佳 / 最差</span>
            <span className="font-mono text-tv-up text-[10px]">+{stats.best?.toFixed(1)}%</span>
            <span className="text-tv-muted text-[10px]">/</span>
            <span className="font-mono text-tv-down text-[10px]">{stats.worst?.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 平倉確認 Dialog ───────────────────────────────────────────────
function CloseDialog({ trade, onClose }: { trade: PaperTrade; onClose: () => void }) {
  const [price, setPrice] = useState(String(trade.current_price))
  const { mutate: closeTrade, isPending } = useClosePaperTrade()

  const handleClose = () => {
    closeTrade({ id: trade.id, price: parseFloat(price) || undefined }, {
      onSuccess: onClose,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-tv-card border border-tv-border rounded-lg p-5 w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-tv-text">平倉確認</p>
          <button onClick={onClose} className="text-tv-muted hover:text-tv-text"><X size={16} /></button>
        </div>
        <p className="text-xs text-tv-muted">
          {trade.stock_id} {trade.stock_name}｜入場 {fmt(trade.entry_price, 2)}
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-tv-muted">出場價格</label>
          <input
            type="number" step="0.1" value={price}
            onChange={e => setPrice(e.target.value)}
            className="rounded border border-tv-border bg-tv-border px-3 py-2 text-sm text-tv-text outline-none focus:border-tv-accent"
          />
          {price && (
            <p className={clsx('text-xs font-mono text-right', priceColor((parseFloat(price) - trade.entry_price) / trade.entry_price * 100))}>
              報酬：{(((parseFloat(price) || 0) - trade.entry_price) / trade.entry_price * 100).toFixed(2)}%
            </p>
          )}
        </div>
        <button onClick={handleClose} disabled={isPending}
          className="rounded bg-tv-accent py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
          {isPending ? '處理中...' : '確認平倉'}
        </button>
      </div>
    </div>
  )
}

// ── 持倉中 Table ─────────────────────────────────────────────────
function OpenTradesTable({ trades }: { trades: PaperTrade[] }) {
  const [closing, setClosing]   = useState<PaperTrade | null>(null)
  const { mutate: deleteTrade } = useDeletePaperTrade()

  if (!trades.length) return (
    <div className="tv-card p-6 text-center text-tv-muted text-sm">
      目前無持倉中的模擬單
    </div>
  )

  return (
    <>
      <div className="tv-card overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-tv-border">
          <p className="text-xs font-semibold text-tv-text">持倉中 ({trades.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-tv-border bg-tv-bg/50 text-tv-muted">
                <th className="text-left px-3 py-2 font-medium">股票</th>
                <th className="text-left px-3 py-2 font-medium">AI訊號</th>
                <th className="text-right px-3 py-2 font-medium">品質</th>
                <th className="text-right px-3 py-2 font-medium">時機</th>
                <th className="text-right px-3 py-2 font-medium">入場價</th>
                <th className="text-right px-3 py-2 font-medium">現價</th>
                <th className="text-right px-3 py-2 font-medium">浮動報酬</th>
                <th className="text-right px-3 py-2 font-medium">入場日</th>
                <th className="text-right px-3 py-2 font-medium">到期日</th>
                <th className="text-center px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const isDue = t.due_date && t.due_date <= new Date().toISOString().slice(0, 10)
                return (
                  <tr key={t.id} className={clsx(
                    'border-b border-tv-border/30 hover:bg-tv-border/20',
                    isDue && 'bg-amber-500/5'
                  )}>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-tv-accent">{t.stock_id}</span>
                      <span className="ml-2 text-tv-text">{t.stock_name}</span>
                    </td>
                    <td className="px-3 py-2.5"><SignalTag signal={t.signal} /></td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span className={clsx(
                        (t.ai_score ?? 0) >= 75 ? 'text-tv-up' :
                        (t.ai_score ?? 0) >= 62 ? 'text-blue-400' : 'text-tv-muted'
                      )}>{t.ai_score?.toFixed(0) ?? '-'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span className={clsx(
                        (t.timing_score ?? 50) >= 65 ? 'text-tv-up' :
                        (t.timing_score ?? 50) >= 50 ? 'text-amber-400' : 'text-tv-down'
                      )}>{t.timing_score?.toFixed(0) ?? '-'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-tv-muted">{fmt(t.entry_price, 2)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-tv-text">{fmt(t.current_price, 2)}</td>
                    <td className={clsx('px-3 py-2.5 text-right font-mono font-semibold', priceColor(t.current_return))}>
                      {t.current_return >= 0 ? '+' : ''}{t.current_return.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5 text-right text-[10px] text-tv-muted">{t.entry_date}</td>
                    <td className="px-3 py-2.5 text-right text-[10px]">
                      <span className={clsx(isDue ? 'text-amber-400 font-semibold' : 'text-tv-muted')}>
                        {isDue ? '⏰ 到期' : t.due_date}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setClosing(t)}
                          className="px-2 py-0.5 text-[10px] rounded bg-tv-border hover:bg-tv-accent/20 hover:text-tv-accent text-tv-muted transition-colors">
                          平倉
                        </button>
                        <button
                          onClick={() => { if (confirm(`確定刪除 ${t.stock_name} 模擬單？`)) deleteTrade(t.id) }}
                          className="p-0.5 rounded text-tv-muted hover:text-tv-down hover:bg-tv-down/10 transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {closing && <CloseDialog trade={closing} onClose={() => setClosing(null)} />}
    </>
  )
}

// ── 已平倉 Table ─────────────────────────────────────────────────
function ClosedTradesTable({ trades }: { trades: PaperTrade[] }) {
  const { mutate: deleteTrade } = useDeletePaperTrade()
  if (!trades.length) return null
  return (
    <div className="tv-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-tv-border">
        <p className="text-xs font-semibold text-tv-text">已平倉紀錄 ({trades.length})</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-tv-border bg-tv-bg/50 text-tv-muted">
              <th className="text-left px-3 py-2 font-medium">股票</th>
              <th className="text-left px-3 py-2 font-medium">訊號</th>
              <th className="text-right px-3 py-2 font-medium">品質</th>
              <th className="text-right px-3 py-2 font-medium">時機</th>
              <th className="text-right px-3 py-2 font-medium">入場價</th>
              <th className="text-right px-3 py-2 font-medium">出場價</th>
              <th className="text-right px-3 py-2 font-medium">報酬率</th>
              <th className="text-center px-3 py-2 font-medium">結果</th>
              <th className="text-right px-3 py-2 font-medium">出場日</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                <td className="px-3 py-2.5">
                  <span className="font-mono text-tv-accent">{t.stock_id}</span>
                  <span className="ml-2 text-tv-text">{t.stock_name}</span>
                </td>
                <td className="px-3 py-2.5"><SignalTag signal={t.signal} /></td>
                <td className="px-3 py-2.5 text-right font-mono text-tv-muted">{t.ai_score?.toFixed(0) ?? '-'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-tv-muted">{t.timing_score?.toFixed(0) ?? '-'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-tv-muted">{fmt(t.entry_price, 2)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-tv-text">{t.exit_price ? fmt(t.exit_price, 2) : '-'}</td>
                <td className={clsx('px-3 py-2.5 text-right font-mono font-semibold', priceColor(t.return_pct ?? 0))}>
                  {t.return_pct != null ? `${t.return_pct >= 0 ? '+' : ''}${t.return_pct.toFixed(2)}%` : '-'}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {t.return_pct != null && (
                    t.return_pct > 0
                      ? <CheckCircle size={14} className="text-tv-up mx-auto" />
                      : <XCircle size={14} className="text-tv-down mx-auto" />
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-[10px] text-tv-muted">{t.exit_date ?? '-'}</td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    onClick={() => { if (confirm(`確定刪除 ${t.stock_name} 紀錄？`)) deleteTrade(t.id) }}
                    className="p-0.5 rounded text-tv-muted hover:text-tv-down hover:bg-tv-down/10 transition-colors"
                    title="刪除"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 時機分效果驗證 ───────────────────────────────────────────────
function TimingValidation({ byTiming }: { byTiming: Record<string, SignalStats> }) {
  const entries = Object.entries(byTiming).filter(([, s]) => s.count > 0)
  if (!entries.length) return null

  return (
    <div className="tv-card p-4">
      <p className="text-xs font-semibold text-tv-text mb-3">⏱ 時機分驗證（時機好的是否表現更佳？）</p>
      <div className="flex flex-col gap-2">
        {entries.map(([label, stats]) => {
          const ret = stats.avg_return ?? 0
          const maxAbs = Math.max(...entries.map(([, s]) => Math.abs(s.avg_return ?? 0)), 1)
          const barW = Math.abs(ret) / maxAbs * 100
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[11px] text-tv-muted w-24 shrink-0">{label}</span>
              <div className="flex-1 h-5 bg-tv-border rounded overflow-hidden relative">
                <div
                  className={clsx('h-full rounded transition-all', ret >= 0 ? 'bg-tv-up/60' : 'bg-tv-down/60')}
                  style={{ width: `${barW}%` }}
                />
                <span className={clsx('absolute right-2 top-0.5 text-[10px] font-mono', priceColor(ret))}>
                  {ret >= 0 ? '+' : ''}{ret.toFixed(2)}% ({stats.win_rate}%勝)
                </span>
              </div>
              <span className="text-[10px] text-tv-muted w-8 text-right">{stats.count}筆</span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-tv-muted/60 mt-2">理論上：時機分高 → 平均報酬應高於時機分低的情況</p>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────
export default function PaperTradePage() {
  const [tab, setTab] = useState<'positions' | 'performance'>('positions')

  const { data: trades,      isLoading: tradesLoading  } = usePaperTrades()
  const { data: performance, isLoading: perfLoading    } = usePaperPerformance()

  const openTrades   = (trades ?? []).filter(t => t.status === 'open')
  const closedTrades = (trades ?? []).filter(t => t.status === 'closed')

  const totalReturn = closedTrades.reduce((s, t) => s + (t.return_pct ?? 0), 0)
  const wins        = closedTrades.filter(t => (t.return_pct ?? 0) > 0).length
  const overallWinRate = closedTrades.length ? Math.round(wins / closedTrades.length * 100) : null

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-tv-accent" />
          <h1 className="text-sm font-semibold text-tv-text">AI 模擬盤驗證</h1>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">
            前向驗證 AI 訊號準確率
          </span>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-tv-muted">
            <Clock size={11} />持倉 {openTrades.length}
          </span>
          <span className="flex items-center gap-1 text-tv-muted">
            <CheckCircle size={11} />平倉 {closedTrades.length}
          </span>
          {overallWinRate !== null && (
            <span className={clsx('flex items-center gap-1 font-semibold', overallWinRate >= 50 ? 'text-tv-up' : 'text-tv-down')}>
              <TrendingUp size={11} />總勝率 {overallWinRate}%
            </span>
          )}
        </div>
      </div>

      {/* 說明 */}
      <div className="tv-card p-3 text-[11px] text-tv-muted flex gap-2 items-start">
        <span className="text-base">💡</span>
        <div>
          在 <strong className="text-tv-text">AI 評分排行</strong> 頁面點擊任一股票列的
          <span className="text-tv-accent mx-1">「+ 模擬盤」</span>
          按鈕，即可記錄當下 AI 分數與入場價。
          幾天後回來查看，系統會自動計算報酬率並統計 AI 訊號的命中率。
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { key: 'positions', label: '倉位管理' },
          { key: 'performance', label: 'AI 準確率分析' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={clsx(
              'px-3 py-1.5 rounded text-xs transition-colors',
              tab === key ? 'bg-tv-accent text-white' : 'bg-tv-border text-tv-muted hover:text-tv-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 倉位管理 Tab */}
      {tab === 'positions' && (
        <>
          {tradesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : (
            <>
              <OpenTradesTable trades={openTrades} />
              <ClosedTradesTable trades={closedTrades} />
            </>
          )}
        </>
      )}

      {/* AI 準確率 Tab */}
      {tab === 'performance' && (
        <>
          {perfLoading ? (
            <div className="skeleton h-64 rounded" />
          ) : !performance || performance.evaluable === 0 ? (
            <div className="tv-card p-8 text-center flex flex-col items-center gap-3 text-tv-muted">
              <FlaskConical size={32} className="opacity-30" />
              <p className="text-sm">尚無到期紀錄可分析</p>
              <p className="text-xs opacity-60">從 AI 排行加入模擬單，等 hold_days 天後即可看到統計</p>
            </div>
          ) : (
            <>
              {/* 訊號準確率卡 */}
              <div>
                <p className="text-xs text-tv-muted mb-2">📊 各訊號命中率（已到期 {performance.evaluable} 筆）</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(performance.by_signal).map(([sig, stats]) => (
                    <SignalCard key={sig} signal={sig} stats={stats} />
                  ))}
                </div>
              </div>

              {/* 時機分驗證 */}
              <TimingValidation byTiming={performance.by_timing} />

              {/* 總覽 */}
              {closedTrades.length > 0 && (
                <div className="tv-card p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-tv-muted">總勝率</p>
                    <p className={clsx('text-lg font-bold font-mono', (overallWinRate ?? 0) >= 50 ? 'text-tv-up' : 'text-tv-down')}>
                      {overallWinRate ?? '-'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-tv-muted">累計平均報酬</p>
                    <p className={clsx('text-lg font-bold font-mono', priceColor(totalReturn / Math.max(closedTrades.length, 1)))}>
                      {(totalReturn / Math.max(closedTrades.length, 1) >= 0 ? '+' : '')}
                      {(totalReturn / Math.max(closedTrades.length, 1)).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-tv-muted">已驗證筆數</p>
                    <p className="text-lg font-bold font-mono text-tv-text">{closedTrades.length}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
