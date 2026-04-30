import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { useOutletContext } from 'react-router-dom'
import { Activity, Globe, Zap, Radio, AlertTriangle, Plus, Check, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePredictionTop, useMacroIndicators } from '../hooks/usePrediction'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { useSummary } from '../hooks/useSummary'
import { useAddPaperTrade } from '../hooks/usePaperTrade'
import { fmt, fmtPct, fmtVol, priceColor } from '../utils/formatters'
import type { PredictionStock, PredictionSignal, LiveQuote } from '../types/api'

// ── 品質分圓圈 ────────────────────────────────────────────────────
function QualityCircle({ score }: { score: number }) {
  const color = score >= 75 ? '#26a69a' : score >= 62 ? '#2962ff' : score >= 50 ? '#787b86' : '#ef5350'
  const r = 16
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#2a2e39" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 時機分小圓 ────────────────────────────────────────────────────
function TimingBadge({ score }: { score: number }) {
  const color = score >= 65 ? '#26a69a' : score >= 50 ? '#ff9800' : '#ef5350'
  const label = score >= 65 ? '好' : score >= 50 ? '尚可' : '差'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[8px] text-tv-muted">時機</span>
      <span
        className="text-[10px] font-bold font-mono px-1 rounded"
        style={{ color, backgroundColor: `${color}20` }}
      >
        {label}
      </span>
      <span className="text-[9px] font-mono" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 評分條 ────────────────────────────────────────────────────────
function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-tv-muted w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-tv-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono w-7 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 跳詳情頁小圖示 ───────────────────────────────────────────────
function StockDetailLink({ id }: { id: string }) {
  const navigate = useNavigate()
  return (
    <button
      title="開啟詳情頁"
      onClick={(e) => { e.stopPropagation(); navigate(`/stock/${id}`) }}
      className="text-tv-muted hover:text-tv-accent transition-colors"
    >
      <ExternalLink size={10} />
    </button>
  )
}

// ── 信號標籤 ──────────────────────────────────────────────────────
const SIGNAL_MAP: Record<PredictionSignal, { label: string; cls: string }> = {
  STRONG_BUY:  { label: '強買',   cls: 'bg-tv-up/20 text-tv-up border border-tv-up/40' },
  BUY:         { label: '買入',   cls: 'bg-tv-up/10 text-tv-up/80 border border-tv-up/20' },
  WATCH:       { label: '強但熱', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  NEUTRAL:     { label: '中性',   cls: 'bg-tv-border text-tv-muted border border-tv-border' },
  SELL:        { label: '賣出',   cls: 'bg-tv-down/10 text-tv-down/80 border border-tv-down/20' },
  STRONG_SELL: { label: '強賣',   cls: 'bg-tv-down/20 text-tv-down border border-tv-down/40' },
}

function SignalBadge({ signal }: { signal: PredictionSignal }) {
  const { label, cls } = SIGNAL_MAP[signal] ?? { label: signal, cls: 'bg-tv-border text-tv-muted border border-tv-border' }
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap', cls)}>{label}</span>
  )
}

// ── 總體面卡片 ───────────────────────────────────────────────────
function MacroCard() {
  const { data: macro, isLoading } = useMacroIndicators()
  if (isLoading) return <div className="tv-card p-4 skeleton h-28" />
  if (!macro?.trade_date) return null

  const items = [
    { label: 'VIX',     value: fmt(macro.vix, 2),         chg: null,              note: (macro.vix ?? 20) < 15 ? '低恐慌' : (macro.vix ?? 20) > 25 ? '高恐慌' : '中性' },
    { label: '費半',    value: fmt(macro.sox, 2),          chg: macro.sox_chg,     note: null },
    { label: 'S&P500',  value: fmt(macro.sp500, 2),        chg: macro.sp500_chg,   note: null },
    { label: '美債10Y', value: macro.us10y ? `${fmt(macro.us10y, 2)}%` : '-', chg: macro.us10y_chg, note: null },
    { label: 'USD/TWD', value: fmt(macro.usd_twd, 3),      chg: macro.usd_twd_chg, note: null },
    { label: '原油',    value: fmt(macro.crude_oil, 2),    chg: macro.crude_oil_chg, note: null },
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
              <div className={clsx('text-[10px]',
                it.label === 'VIX'
                  ? it.note === '低恐慌' ? 'text-tv-up' : it.note === '高恐慌' ? 'text-tv-down' : 'text-tv-muted'
                  : 'text-tv-muted'
              )}>{it.note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 加入模擬盤按鈕 ────────────────────────────────────────────────
function AddPaperBtn({ stock, livePrice }: { stock: PredictionStock; livePrice?: number }) {
  const { mutate, isPending, isSuccess } = useAddPaperTrade()
  const [showMenu, setShowMenu] = useState(false)

  const handleAdd = (days: number) => {
    const price = livePrice ?? stock.close
    mutate({
      stock_id:     stock.stock_id,
      entry_price:  price,
      ai_score:     stock.total_score,
      timing_score: stock.timing_score,
      signal:       stock.signal,
      hold_days:    days,
      note:         `AI評分排行加入 品質${stock.total_score} 時機${stock.timing_score}`,
    })
    setShowMenu(false)
  }

  if (isSuccess) return (
    <span className="flex items-center gap-1 text-[10px] text-tv-up">
      <Check size={11} />已加入
    </span>
  )

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setShowMenu(v => !v)}
        disabled={isPending}
        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-tv-accent/10 text-tv-accent border border-tv-accent/30 hover:bg-tv-accent/20 transition-colors disabled:opacity-50"
      >
        <Plus size={10} />模擬
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-tv-card border border-tv-border rounded shadow-xl">
          <p className="px-3 py-1.5 text-[10px] text-tv-muted border-b border-tv-border">持有天數</p>
          {[3, 5, 10, 20].map(d => (
            <button key={d} onClick={() => handleAdd(d)}
              className="flex w-full items-center px-3 py-1.5 text-xs text-tv-text hover:bg-tv-border whitespace-nowrap">
              {d} 天後驗證
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 個股評分列 ───────────────────────────────────────────────────
function StockScoreRow({ stock, onOpen, live, isMarketOpen }: {
  stock: PredictionStock
  onOpen: (id: string) => void
  live?: LiveQuote
  isMarketOpen: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const timingScore = stock.timing_score ?? 50
  const warns = stock.details?.timing_warns ?? []
  const isWatch = stock.signal === 'WATCH'

  return (
    <>
      <tr
        className={clsx(
          'border-b border-tv-border/30 cursor-pointer transition-colors',
          isWatch ? 'hover:bg-amber-500/5' : 'hover:bg-tv-border/20'
        )}
        onClick={() => setExpanded(v => !v)}
      >
        {/* 股票 */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <QualityCircle score={stock.total_score} />
            <div>
              <div className="flex items-center gap-1">
                <button
                  className="text-tv-accent font-mono text-xs font-semibold hover:underline"
                  onClick={(e) => { e.stopPropagation(); onOpen(stock.stock_id) }}
                >
                  {stock.stock_id}
                </button>
                <StockDetailLink id={stock.stock_id} />
              </div>
              <div className="text-[11px] text-tv-text leading-tight">{stock.stock_name}</div>
              <div className="text-[10px] text-tv-muted">{stock.industry}</div>
            </div>
          </div>
        </td>

        {/* 訊號 */}
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1 items-start">
            <SignalBadge signal={stock.signal} />
          </div>
        </td>

        {/* 品質分 + 時機分 */}
        <td className="px-3 py-2 hidden sm:table-cell">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-tv-muted">品質</span>
              <span className={clsx('text-sm font-bold font-mono',
                stock.total_score >= 75 ? 'text-tv-up' : stock.total_score >= 62 ? 'text-blue-400' : 'text-tv-muted'
              )}>{stock.total_score}</span>
            </div>
            <TimingBadge score={timingScore} />
          </div>
        </td>

        {/* 價格 */}
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
            <span className={clsx('text-[10px] font-mono', priceColor(
              isMarketOpen && live?.change_pct != null ? live.change_pct : stock.change_pct
            ))}>
              {fmtPct(isMarketOpen && live?.change_pct != null ? live.change_pct : stock.change_pct)}
            </span>
          </div>
        </td>

        {/* 迷你柱狀圖 */}
        <td className="px-3 py-2 hidden md:table-cell">
          <div className="flex gap-1 items-end">
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

        {/* 量 */}
        <td className="px-3 py-2 text-right font-mono text-[10px] text-tv-muted hidden lg:table-cell">
          {fmtVol(stock.volume)}
        </td>

        {/* 距MA20 */}
        <td className="px-3 py-2 text-right hidden lg:table-cell">
          {stock.details?.dev_ma20 != null ? (
            <span className={clsx('text-[10px] font-mono',
              Math.abs(stock.details.dev_ma20) <= 5 ? 'text-tv-up' :
              stock.details.dev_ma20 > 15 ? 'text-tv-down' : 'text-tv-muted'
            )}>
              {stock.details.dev_ma20 >= 0 ? '+' : ''}{stock.details.dev_ma20.toFixed(1)}%
            </span>
          ) : '-'}
        </td>

        {/* 加入模擬盤 */}
        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
          <AddPaperBtn stock={stock} livePrice={live?.price} />
        </td>
      </tr>

      {/* 展開詳情 */}
      {expanded && (
        <tr className="bg-tv-bg/60 border-b border-tv-border/30">
          <td colSpan={9} className="px-4 py-3">
            <div className="flex gap-6 flex-wrap">

              {/* 品質分雷達 */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <p className="text-[10px] text-tv-muted font-medium mb-1">📊 標的品質分 ({stock.total_score})</p>
                <ScoreBar label="技術面" score={stock.score_tech}     color="#2962ff" />
                <ScoreBar label="籌碼面" score={stock.score_chip}     color="#ff9800" />
                <ScoreBar label="基本面" score={stock.score_fund}     color="#26a69a" />
                <ScoreBar label="總體面" score={stock.score_macro}    color="#9c27b0" />
                <ScoreBar label="動能面" score={stock.score_momentum} color="#e91e63" />
              </div>

              {/* 進場時機分 */}
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <p className="text-[10px] text-tv-muted font-medium mb-1">
                  ⏱ 進場時機分 (
                  <span className={clsx('font-bold',
                    timingScore >= 65 ? 'text-tv-up' : timingScore >= 50 ? 'text-amber-400' : 'text-tv-down'
                  )}>{timingScore}</span>)
                </p>
                {/* 時機分條 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-tv-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${timingScore}%`,
                        backgroundColor: timingScore >= 65 ? '#26a69a' : timingScore >= 50 ? '#ff9800' : '#ef5350'
                      }} />
                  </div>
                  <span className={clsx('text-xs font-bold font-mono w-8 text-right',
                    timingScore >= 65 ? 'text-tv-up' : timingScore >= 50 ? 'text-amber-400' : 'text-tv-down'
                  )}>{timingScore}</span>
                </div>
                {/* 距MA20 */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-tv-muted w-16">距MA20</span>
                  <span className={clsx('font-mono',
                    Math.abs(stock.details?.dev_ma20 ?? 0) <= 5 ? 'text-tv-up' :
                    (stock.details?.dev_ma20 ?? 0) > 15 ? 'text-tv-down' : 'text-amber-400'
                  )}>
                    {(stock.details?.dev_ma20 ?? 0) >= 0 ? '+' : ''}{(stock.details?.dev_ma20 ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-tv-muted w-16">RSI14</span>
                  <span className={clsx('font-mono',
                    (stock.details?.rsi14 ?? 50) > 70 ? 'text-tv-down' :
                    (stock.details?.rsi14 ?? 50) < 40 ? 'text-tv-up' : 'text-tv-text'
                  )}>{(stock.details?.rsi14 ?? 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-tv-muted w-16">5日漲幅</span>
                  <span className={clsx('font-mono', priceColor(stock.details?.price_5d_chg ?? 0))}>
                    {(stock.details?.price_5d_chg ?? 0) >= 0 ? '+' : ''}{(stock.details?.price_5d_chg ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-tv-muted w-16">融資變化</span>
                  <span className={clsx('font-mono', (stock.details?.margin_change ?? 0) > 200 ? 'text-tv-down' : 'text-tv-muted')}>
                    {(stock.details?.margin_change ?? 0) >= 0 ? '+' : ''}{(stock.details?.margin_change ?? 0).toFixed(0)}張
                  </span>
                </div>

                {/* 時機警示 */}
                {warns.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {warns.map((w, i) => (
                      <div key={i} className="flex items-start gap-1 text-[10px] text-amber-400">
                        <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 籌碼細節 */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] content-start">
                <p className="col-span-2 text-[10px] text-tv-muted font-medium mb-1">📌 籌碼細節</p>
                <div className="flex gap-2">
                  <span className="text-tv-muted">外資</span>
                  <span className={clsx('font-mono', priceColor(stock.details?.foreign_net ?? 0))}>
                    {(stock.details?.foreign_net ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-tv-muted">投信</span>
                  <span className={clsx('font-mono', priceColor(stock.details?.trust_net ?? 0))}>
                    {(stock.details?.trust_net ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-tv-muted">K值</span>
                  <span className="font-mono text-tv-text">{(stock.details?.k_value ?? 0).toFixed(1)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-tv-muted">量比</span>
                  <span className="font-mono text-tv-text">{(stock.details?.vol_ratio ?? 1).toFixed(2)}x</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-tv-muted">20日漲幅</span>
                  <span className={clsx('font-mono', priceColor(stock.details?.price_20d_chg ?? 0))}>
                    {(stock.details?.price_20d_chg ?? 0) >= 0 ? '+' : ''}{(stock.details?.price_20d_chg ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-tv-muted">營收YoY</span>
                  <span className={clsx('font-mono', priceColor(stock.details?.revenue_yoy ?? 0))}>
                    {(stock.details?.revenue_yoy ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* WATCH 說明框 */}
              {isWatch && (
                <div className="w-full mt-1 p-3 rounded border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-300">
                  <p className="font-semibold mb-1">⚠️ 強但熱 — 方向偏多，但時機不漂亮</p>
                  <p className="text-amber-300/70">
                    此股標的品質評分良好，但當前進場位置風險報酬比偏差。
                    建議等待回調至 MA20 附近或整理後再行評估。
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────
type OutletCtx = { openStock: (id: string) => void }

const SIGNALS = ['', 'STRONG_BUY', 'BUY', 'WATCH', 'NEUTRAL', 'SELL'] as const
const SIGNAL_LABELS: Record<string, string> = {
  '':          '全部',
  STRONG_BUY:  '強買',
  BUY:         '買入',
  WATCH:       '強但熱',
  NEUTRAL:     '中性',
  SELL:        '賣出',
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

  const topIds = useMemo(() => (stocks ?? []).slice(0, 100).map(s => s.stock_id), [stocks])
  const { data: liveData } = useLiveQuotes(topIds)
  const liveMap: Record<string, LiveQuote> = useMemo(() => liveData ?? {}, [liveData])

  const watchCount  = useMemo(() => (stocks ?? []).filter(s => s.signal === 'WATCH').length, [stocks])
  const strongCount = useMemo(() => (stocks ?? []).filter(s => s.signal === 'STRONG_BUY').length, [stocks])
  const buyCount    = useMemo(() => (stocks ?? []).filter(s => s.signal === 'BUY').length, [stocks])

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Zap size={16} className="text-tv-accent" />
          <h1 className="text-sm font-semibold text-tv-text">AI 雙層評分排行</h1>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded hidden sm:inline">
            品質：技25% 籌35% 基20% 總10% 動10%
          </span>
          {isMarketOpen && (
            <span className="flex items-center gap-1 text-[10px] text-tv-up px-1.5 py-0.5 rounded bg-tv-up/10 border border-tv-up/20">
              <Radio size={10} className="animate-pulse" />盤中即時
            </span>
          )}
        </div>
        {stocks && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-tv-up">強買 {strongCount}</span>
            <span className="text-blue-400">買入 {buyCount}</span>
            <span className="text-amber-400">強但熱 {watchCount}</span>
            <span className="text-tv-muted">共 {stocks.length} 支</span>
          </div>
        )}
      </div>

      {/* 雙層說明 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="tv-card p-3 flex flex-col gap-1">
          <p className="font-semibold text-tv-text">🏆 品質分（左圓圈）</p>
          <p className="text-tv-muted">回答：這檔值不值得看多？趨勢是否偏多？</p>
          <p className="text-tv-muted">技術 + 籌碼 + 基本 + 總體 + 動能 加權</p>
        </div>
        <div className="tv-card p-3 flex flex-col gap-1">
          <p className="font-semibold text-tv-text">⏱ 時機分（右小標）</p>
          <p className="text-tv-muted">回答：現在這個位置追進去划不划算？</p>
          <p className="text-tv-muted">距MA20乖離 + RSI超買 + 融資暴增 + 單週暴拉</p>
        </div>
      </div>

      {/* Macro */}
      <MacroCard />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {SIGNALS.map((s) => (
            <button key={s} onClick={() => setSignal(s)}
              className={clsx(
                'px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap',
                signal === s
                  ? s === 'WATCH' ? 'bg-amber-500 text-white' : 'bg-tv-accent text-white'
                  : s === 'WATCH' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-tv-border text-tv-muted hover:text-tv-text'
              )}
            >
              {SIGNAL_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-tv-muted">最低品質分</span>
          {[50, 55, 60, 65].map((v) => (
            <button key={v} onClick={() => setMinScore(v)}
              className={clsx(
                'px-2 py-0.5 rounded text-[10px] transition-colors',
                minScore === v ? 'bg-tv-accent text-white' : 'bg-tv-border text-tv-muted hover:text-tv-text'
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
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
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
                  <th className="text-center px-3 py-2 text-tv-muted font-medium hidden sm:table-cell">品質／時機</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">即時/收盤</th>
                  <th className="px-3 py-2 text-tv-muted font-medium hidden md:table-cell">技/籌/基/總/動</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium hidden lg:table-cell">成交量</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium hidden lg:table-cell">距MA20</th>
                  <th className="text-center px-3 py-2 text-tv-muted font-medium"></th>
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
      <div className="flex flex-wrap gap-4 items-center">
        {[
          { c: '#2962ff', label: '技術' },
          { c: '#ff9800', label: '籌碼' },
          { c: '#26a69a', label: '基本' },
          { c: '#9c27b0', label: '總體' },
          { c: '#e91e63', label: '動能' },
        ].map(({ c, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-tv-muted">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-tv-muted/50">點擊列展開詳情 · 點代碼看K線</span>
      </div>
    </div>
  )
}
