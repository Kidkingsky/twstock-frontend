import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useOutletContext } from 'react-router-dom'
import { Activity, Globe, Zap, Radio } from 'lucide-react'
import { usePredictionTop, useMacroIndicators } from '../hooks/usePrediction'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { useSummary } from '../hooks/useSummary'
import { fmt, fmtPct, fmtVol, priceColor } from '../utils/formatters'
import type { PredictionStock, LiveQuote } from '../types/api'

// ── 評分雷達條 ─────────────────────────────────────────────────────
function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-tv-muted w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-tv-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono w-7 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 信號標籤 ──────────────────────────────────────────────────────
function SignalBadge({ signal }: { signal: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    STRONG_BUY: { label: '強買', cls: 'bg-tv-up/20 text-tv-up border border-tv-up/30' },
    BUY:        { label: '買入', cls: 'bg-tv-up/10 text-tv-up/80 border border-tv-up/20' },
    NEUTRAL:    { label: '中性', cls: 'bg-tv-border text-tv-muted border border-tv-border' },
    SELL:       { label: '賣出', cls: 'bg-tv-down/10 text-tv-down/80 border border-tv-down/20' },
    STRONG_SELL:{ label: '強賣', cls: 'bg-tv-down/20 text-tv-down border border-tv-down/30' },
  }
  const { label, cls } = map[signal] ?? { label: signal, cls: 'bg-tv-border text-tv-muted border border-tv-border' }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', cls)}>{label}</span>
  )
}

// ── 分數圓圈 ─────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? '#26a69a' : score >= 60 ? '#2962ff' : score >= 50 ? '#787b86' : '#ef5350'
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#2a2e39" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 總體面卡片 ───────────────────────────────────────────────────
function MacroCard() {
  const { data: macro, isLoading } = useMacroIndicators()

  if (isLoading) return <div className="tv-card p-4 skeleton h-28" />
  if (!macro || !macro.trade_date) return null

  const items = [
    { label: 'VIX', value: fmt(macro.vix, 2), chg: null, note: (macro.vix ?? 20) < 15 ? '低恐慌' : (macro.vix ?? 20) > 25 ? '高恐慌' : '中性' },
    { label: '費半', value: fmt(macro.sox, 2), chg: macro.sox_chg, note: null },
    { label: 'S&P500', value: fmt(macro.sp500, 2), chg: macro.sp500_chg, note: null },
    { label: '美債10Y', value: macro.us10y ? `${fmt(macro.us10y, 2)}%` : '-', chg: macro.us10y_chg, note: null },
    { label: 'USD/TWD', value: fmt(macro.usd_twd, 3), chg: macro.usd_twd_chg, note: null },
    { label: '原油', value: fmt(macro.crude_oil, 2), chg: macro.crude_oil_chg, note: null },
  ]

  const moodColor = macro.mood_color === 'bull' ? 'text-tv-up' : macro.mood_color === 'bear' ? 'text-tv-down' : 'text-tv-muted'

  return (
    <div className="tv-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-tv-muted" />
          <span className="text-xs font-semibold text-tv-text">總體面 ({macro.trade_date})</span>
        </div>
        <span className={clsx('text-xs font-semibold', moodColor)}>市場情緒：{macro.market_mood}</span>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-[10px] text-tv-muted mb-0.5">{it.label}</div>
            <div className="text-xs font-mono text-tv-text">{it.value ?? '-'}</div>
            {it.chg != null && (
              <div className={clsx('text-[10px] font-mono', priceColor(it.chg))}>
                {it.chg >= 0 ? '+' : ''}{it.chg.toFixed(2)}%
              </div>
            )}
            {it.note && (
              <div className={clsx('text-[10px]', it.label === 'VIX' ? (it.note === '低恐慌' ? 'text-tv-up' : it.note === '高恐慌' ? 'text-tv-down' : 'text-tv-muted') : 'text-tv-muted')}>
                {it.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 個股評分卡 ───────────────────────────────────────────────────
function StockScoreRow({ stock, onOpen, live, isMarketOpen }: {
  stock: PredictionStock
  onOpen: (id: string) => void
  live?: LiveQuote
  isMarketOpen: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-tv-border/30 hover:bg-tv-border/20 cursor-pointer transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <ScoreCircle score={stock.total_score} />
            <div>
              <button
                className="text-tv-accent font-mono text-xs font-semibold hover:underline"
                onClick={(e) => { e.stopPropagation(); onOpen(stock.stock_id) }}
              >
                {stock.stock_id}
              </button>
              <div className="text-[11px] text-tv-text">{stock.stock_name}</div>
              <div className="text-[10px] text-tv-muted">{stock.industry}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-2">
          <SignalBadge signal={stock.signal} />
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-tv-text">
                {fmt(live?.price ?? stock.close, 2)}
              </span>
              {isMarketOpen && live?.price && (
                <span className="w-1.5 h-1.5 rounded-full bg-tv-up animate-pulse" />
              )}
            </div>
          </div>
        </td>
        <td className={clsx('px-3 py-2 text-right font-mono text-xs', priceColor(isMarketOpen && live?.change_pct != null ? live.change_pct : stock.change_pct))}>
          {fmtPct(isMarketOpen && live?.change_pct != null ? live.change_pct : stock.change_pct)}
        </td>
        <td className="px-3 py-2 hidden md:table-cell">
          {/* Mini score bars */}
          <div className="flex gap-1 items-center">
            {[
              { v: stock.score_tech,     c: '#2962ff', t: '技' },
              { v: stock.score_chip,     c: '#ff9800', t: '籌' },
              { v: stock.score_fund,     c: '#26a69a', t: '基' },
              { v: stock.score_macro,    c: '#9c27b0', t: '總' },
              { v: stock.score_momentum, c: '#e91e63', t: '動' },
            ].map(({ v, c, t }) => (
              <div key={t} className="flex flex-col items-center gap-0.5" title={`${t}: ${v}`}>
                <div className="w-5 h-10 bg-tv-border rounded-sm overflow-hidden flex flex-col justify-end">
                  <div className="w-full rounded-sm" style={{ height: `${v}%`, backgroundColor: c, opacity: 0.8 }} />
                </div>
                <span className="text-[8px] text-tv-muted">{t}</span>
              </div>
            ))}
          </div>
        </td>
        <td className="px-3 py-2 text-right font-mono text-[10px] text-tv-muted hidden lg:table-cell">
          {fmtVol(stock.volume)}
        </td>
        <td className="px-3 py-2 text-right text-[10px] text-tv-muted hidden lg:table-cell">
          {stock.details?.revenue_yoy != null ? (
            <span className={priceColor(stock.details.revenue_yoy)}>
              {stock.details.revenue_yoy >= 0 ? '+' : ''}{stock.details.revenue_yoy.toFixed(1)}%
            </span>
          ) : '-'}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-tv-bg/60 border-b border-tv-border/30">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex gap-8 flex-wrap">
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                <ScoreBar label="技術面" score={stock.score_tech} color="#2962ff" />
                <ScoreBar label="籌碼面" score={stock.score_chip} color="#ff9800" />
                <ScoreBar label="基本面" score={stock.score_fund} color="#26a69a" />
                <ScoreBar label="總體面" score={stock.score_macro} color="#9c27b0" />
                <ScoreBar label="動能面" score={stock.score_momentum} color="#e91e63" />
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
                <div className="flex gap-2"><span className="text-tv-muted">外資</span><span className={clsx('font-mono', priceColor(stock.details?.foreign_net))}>{(stock.details?.foreign_net ?? 0).toLocaleString()}</span></div>
                <div className="flex gap-2"><span className="text-tv-muted">投信</span><span className={clsx('font-mono', priceColor(stock.details?.trust_net))}>{(stock.details?.trust_net ?? 0).toLocaleString()}</span></div>
                <div className="flex gap-2"><span className="text-tv-muted">RSI14</span><span className="font-mono text-tv-text">{stock.details?.rsi14?.toFixed(1)}</span></div>
                <div className="flex gap-2"><span className="text-tv-muted">K值</span><span className="font-mono text-tv-text">{stock.details?.k_value?.toFixed(1)}</span></div>
                <div className="flex gap-2"><span className="text-tv-muted">量比</span><span className="font-mono text-tv-text">{stock.details?.vol_ratio?.toFixed(2)}x</span></div>
                <div className="flex gap-2"><span className="text-tv-muted">營收YoY</span><span className={clsx('font-mono', priceColor(stock.details?.revenue_yoy))}>{stock.details?.revenue_yoy?.toFixed(1)}%</span></div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────
type OutletCtx = { openStock: (id: string) => void }

const SIGNALS = ['', 'STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL'] as const
const SIGNAL_LABELS: Record<string, string> = {
  '': '全部',
  STRONG_BUY: '強買',
  BUY: '買入',
  NEUTRAL: '中性',
  SELL: '賣出',
}

export default function PredictionPage() {
  const { openStock } = useOutletContext<OutletCtx>()
  const [signal, setSignal] = useState('')
  const [minScore, setMinScore] = useState(55)

  const { data: summary } = useSummary()
  const isMarketOpen = summary?.market_open ?? false

  const { data: stocks, isLoading } = usePredictionTop({
    signal: signal || undefined,
    minScore,
    limit: 100,
  })

  // 取前100高分股票的即時報價
  const topIds = useMemo(() => (stocks ?? []).slice(0, 100).map(s => s.stock_id), [stocks])
  const { data: liveData } = useLiveQuotes(topIds)
  const liveMap: Record<string, LiveQuote> = useMemo(() => liveData ?? {}, [liveData])

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-tv-accent" />
          <h1 className="text-sm font-semibold text-tv-text">AI 綜合評分排行</h1>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">
            技術 25% + 籌碼 35% + 基本 20% + 總體 10% + 動能 10%
          </span>
          {isMarketOpen && (
            <span className="flex items-center gap-1 text-[10px] text-tv-up px-1.5 py-0.5 rounded bg-tv-up/10 border border-tv-up/20">
              <Radio size={10} className="animate-pulse" />盤中即時
            </span>
          )}
        </div>
        {stocks && (
          <span className="text-[10px] text-tv-muted">共 {stocks.length} 支</span>
        )}
      </div>

      {/* Macro */}
      <MacroCard />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {SIGNALS.map((s) => (
            <button
              key={s}
              onClick={() => setSignal(s)}
              className={clsx(
                'px-2.5 py-1 rounded text-xs transition-colors',
                signal === s
                  ? 'bg-tv-accent text-white'
                  : 'bg-tv-border text-tv-muted hover:text-tv-text'
              )}
            >
              {SIGNAL_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-tv-muted">最低分</span>
          {[50, 55, 60, 65].map((v) => (
            <button
              key={v}
              onClick={() => setMinScore(v)}
              className={clsx(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                minScore === v
                  ? 'bg-tv-accent text-white'
                  : 'bg-tv-border text-tv-muted hover:text-tv-text'
              )}
            >
              {v}+
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="tv-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded" />
            ))}
          </div>
        ) : !stocks || stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-tv-muted gap-2">
            <Activity size={32} className="opacity-30" />
            <p className="text-sm">暫無符合條件的股票</p>
            <p className="text-xs opacity-60">請先在伺服器執行 score_engine.py</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-tv-border bg-tv-bg/50 sticky top-0">
                  <th className="text-left px-3 py-2 text-tv-muted font-medium">股票</th>
                  <th className="text-left px-3 py-2 text-tv-muted font-medium">訊號</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">收盤</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">漲跌</th>
                  <th className="px-3 py-2 text-tv-muted font-medium hidden md:table-cell">技/籌/基/總/動</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium hidden lg:table-cell">成交量</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium hidden lg:table-cell">營收YoY</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <StockScoreRow
                    key={s.stock_id}
                    stock={s}
                    onOpen={openStock}
                    live={liveMap[s.stock_id]}
                    isMarketOpen={isMarketOpen}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { c: '#2962ff', label: '技術面' },
          { c: '#ff9800', label: '籌碼面' },
          { c: '#26a69a', label: '基本面' },
          { c: '#9c27b0', label: '總體面' },
          { c: '#e91e63', label: '動能面' },
        ].map(({ c, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-tv-muted">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-tv-muted/50 ml-2">點擊行展開詳細分數 · 點擊代碼開K線</span>
      </div>
    </div>
  )
}
