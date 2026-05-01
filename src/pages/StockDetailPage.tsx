import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowLeft, RefreshCw, Sparkles, Loader2 } from 'lucide-react'
import { useStockDetail, useStockAIAnalysis } from '../hooks/useStockDetail'
import { useFinancials } from '../hooks/useFinancials'
import { usePredictionStock } from '../hooks/usePrediction'
import StockFullChart from '../components/charts/StockFullChart'
import { fmt, fmtPct, fmtVol, fmtRevenue, priceColor } from '../utils/formatters'

// ── 工具函式 ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] text-tv-muted">{label}</span>
      <span className={clsx('text-sm font-mono font-semibold truncate', color || 'text-tv-text')}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-tv-muted">{sub}</span>}
    </div>
  )
}

function ValCard({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2 bg-tv-bg rounded border border-tv-border/50 min-w-[72px]">
      <span className="text-[10px] text-tv-muted">{label}</span>
      <span className="text-sm font-mono font-bold text-tv-text">{value ?? '-'}</span>
      {hint && <span className="text-[9px] text-tv-muted">{hint}</span>}
    </div>
  )
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-tv-muted w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-tv-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

// ── 主頁面 ────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const [days, setDays] = useState(120)
  const [tab, setTab]   = useState<'chip' | 'revenue' | 'financials'>('chip')

  const { data: detail, isLoading, refetch } = useStockDetail(id ?? null)
  const { data: financials }   = useFinancials(id ?? null)
  const { data: scoreHistory } = usePredictionStock(id ?? null)
  const { data: aiData, isFetching: aiLoading, refetch: fetchAI } = useStockAIAnalysis(id ?? null)

  const latestScore = Array.isArray(scoreHistory) && scoreHistory.length > 0
    ? scoreHistory[scoreHistory.length - 1]
    : null

  const rt   = detail?.realtime
  const info = detail?.info
  const val  = detail?.valuation
  const changePct  = rt?.change_pct ?? 0
  const changeColor = priceColor(changePct)

  const signalLabel: Record<string, string> = {
    STRONG_BUY: '強買', BUY: '買入', WATCH: '觀察',
    NEUTRAL: '中性', SELL: '賣出', STRONG_SELL: '強賣',
  }

  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      {/* ── 頂部導航 ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[11px] text-tv-muted hover:text-tv-text transition-colors"
        >
          <ArrowLeft size={13} />
          返回
        </button>
        <button
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-1 text-[11px] text-tv-muted hover:text-tv-text transition-colors"
        >
          <RefreshCw size={12} />
          更新
        </button>
      </div>

      {/* ── 股票標頭 ── */}
      {isLoading ? (
        <div className="tv-card p-4">
          <div className="skeleton h-8 w-56 rounded mb-2" />
          <div className="skeleton h-10 w-36 rounded" />
        </div>
      ) : (
        <div className="tv-card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-tv-accent font-mono font-bold text-xl">{info?.stock_id}</span>
                <span className="text-tv-text font-semibold text-xl">{info?.stock_name}</span>
                {info?.market && (
                  <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">{info.market}</span>
                )}
                {info?.industry && (
                  <span className="text-[10px] text-tv-muted">{info.industry}</span>
                )}
              </div>
              {rt && (
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={clsx('text-3xl font-mono font-bold', changeColor)}>
                    {fmt(rt.price, 2)}
                  </span>
                  <span className={clsx('text-base font-mono', changeColor)}>
                    {rt.change >= 0 ? '+' : ''}{fmt(rt.change, 2)} ({fmtPct(changePct)})
                  </span>
                </div>
              )}
            </div>

            {/* AI 評分徽章 */}
            {latestScore && (
              <div className="flex items-center gap-2 shrink-0">
                <div className={clsx(
                  'text-center px-3 py-2 rounded border',
                  latestScore.total_score >= 70 ? 'border-tv-up/40 bg-tv-up/10' :
                  latestScore.total_score >= 60 ? 'border-tv-accent/40 bg-tv-accent/10' :
                  'border-tv-border bg-tv-bg'
                )}>
                  <div className="text-[10px] text-tv-muted">AI 品質分</div>
                  <div className={clsx(
                    'text-xl font-bold font-mono',
                    latestScore.total_score >= 70 ? 'text-tv-up' :
                    latestScore.total_score >= 60 ? 'text-tv-accent' : 'text-tv-muted'
                  )}>{latestScore.total_score}</div>
                </div>
                {latestScore.signal && (
                  <span className={clsx(
                    'text-xs font-bold px-2 py-1 rounded',
                    latestScore.signal === 'STRONG_BUY' ? 'bg-tv-up/20 text-tv-up' :
                    latestScore.signal === 'BUY'        ? 'bg-tv-up/10 text-tv-up/80' :
                    latestScore.signal === 'WATCH'      ? 'bg-yellow-500/20 text-yellow-400' :
                    latestScore.signal === 'SELL'       ? 'bg-tv-down/10 text-tv-down/80' :
                    'bg-tv-border text-tv-muted'
                  )}>
                    {signalLabel[latestScore.signal] ?? latestScore.signal}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 今日行情 */}
          {rt && (
            <div className="grid grid-cols-5 gap-3 mt-3 pt-3 border-t border-tv-border">
              <StatCard label="開盤" value={fmt(rt.open)} />
              <StatCard label="最高" value={fmt(rt.high)} color="price-up" />
              <StatCard label="最低" value={fmt(rt.low)}  color="price-down" />
              <StatCard label="昨收" value={fmt(rt.yesterday)} />
              <StatCard label="成交量" value={fmtVol(rt.volume)} />
            </div>
          )}
        </div>
      )}

      {/* ── 估值資料 PER / PBR / 殖利率 ── */}
      {(val || isLoading) && (
        <div className="tv-card p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-tv-text">估值指標</span>
            <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">TWSE OpenAPI</span>
          </div>
          {isLoading ? (
            <div className="flex gap-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-14 w-20 rounded" />)}
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <ValCard label="本益比 PER" value={val?.per != null ? val.per.toFixed(2) : null} hint="低→便宜" />
              <ValCard label="股價淨值 PBR" value={val?.pbr != null ? val.pbr.toFixed(2) : null} hint="<1 → 淨值以下" />
              <ValCard label="殖利率" value={val?.dividend_yield != null ? `${val.dividend_yield.toFixed(2)}%` : null} hint="越高越好" />
            </div>
          )}
        </div>
      )}

      {/* ── AI 評分細項 ── */}
      {latestScore && (
        <div className="tv-card p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-tv-text">AI 評分細項</span>
            <span className="text-[10px] text-tv-muted">{latestScore.trade_date}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <ScoreBar label="技術" score={latestScore.score_tech}     color="#2962ff" />
            <ScoreBar label="籌碼" score={latestScore.score_chip}     color="#ff9800" />
            <ScoreBar label="基本" score={latestScore.score_fund}     color="#26a69a" />
            <ScoreBar label="總體" score={latestScore.score_macro}    color="#9c27b0" />
            <ScoreBar label="動能" score={latestScore.score_momentum} color="#e91e63" />
          </div>
        </div>
      )}

      {/* ── AI 白話解讀 ── */}
      <div className="tv-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-tv-text">AI 白話解讀</span>
            <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">Groq LLaMA-3.3-70B</span>
            {aiData?.cached && (
              <span className="text-[10px] text-tv-muted">（快取）</span>
            )}
          </div>
          <button
            onClick={() => fetchAI()}
            disabled={aiLoading}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors',
              aiData
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-tv-accent text-white hover:bg-tv-accent/80',
              aiLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {aiLoading
              ? <><Loader2 size={11} className="animate-spin" />分析中…</>
              : <><Sparkles size={11} />{aiData ? '重新解讀' : '🤖 AI 解讀'}</>
            }
          </button>
        </div>

        {!aiData && !aiLoading && (
          <p className="text-[11px] text-tv-muted py-2">
            點擊「AI 解讀」按鈕，由 Groq LLaMA 整合技術面、籌碼面、近期新聞，產生個股白話分析。
          </p>
        )}

        {aiLoading && (
          <div className="flex items-center gap-2 py-4 text-[11px] text-tv-muted">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            正在整合資料並呼叫 Groq 模型，約需 5~15 秒…
          </div>
        )}

        {aiData?.analysis && !aiLoading && (
          <div className={clsx(
            'mt-1 p-3 rounded border text-[12px] leading-relaxed',
            aiData.enabled
              ? 'border-cyan-500/25 bg-cyan-500/5 text-tv-text'
              : 'border-tv-border bg-tv-bg text-tv-muted'
          )}>
            {aiData.analysis}
          </div>
        )}
      </div>

      {/* ── K 線圖（含 Volume / MACD / RSI）── */}
      <div className="tv-card overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="text-xs font-semibold text-tv-text">K 線圖</span>
          <div className="flex gap-1">
            {([60, 120, 240] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={clsx(
                  'text-[10px] px-2 py-0.5 rounded transition-colors',
                  days === d
                    ? 'bg-tv-accent text-white'
                    : 'text-tv-muted hover:text-tv-text hover:bg-tv-border'
                )}
              >
                {d}日
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="skeleton h-[560px] m-3 rounded" />
        ) : detail?.kline && detail.kline.length > 0 ? (
          <StockFullChart data={detail.kline.slice(-days)} />
        ) : (
          <div className="h-48 flex items-center justify-center text-tv-muted text-sm">無K線資料</div>
        )}
      </div>

      {/* ── 籌碼 / 營收 / 財報 分頁 ── */}
      <div className="tv-card p-0 overflow-hidden">
        <div className="flex border-b border-tv-border">
          {(['chip', 'revenue', 'financials'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-4 py-2 text-xs transition-colors',
                tab === t
                  ? 'border-b-2 border-tv-accent text-tv-text font-medium'
                  : 'text-tv-muted hover:text-tv-text'
              )}
            >
              {{ chip: '法人籌碼', revenue: '月營收', financials: '財務數據' }[t]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {/* 法人籌碼 */}
          {tab === 'chip' && (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-tv-border">
                  {['日期','外資','投信','自營商','合計'].map((h) => (
                    <th key={h} className="px-3 py-2 text-tv-muted font-medium text-left first:text-left last:text-right [&:not(:first-child)]:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail?.chip?.slice().reverse().map((c) => (
                  <tr key={c.trade_date} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                    <td className="px-3 py-1.5 text-tv-muted font-mono">{c.trade_date}</td>
                    {[c.foreign_net, c.investment_trust_net, c.dealer_net, c.total_net].map((v, i) => (
                      <td key={i} className={clsx('px-3 py-1.5 text-right font-mono', i === 3 && 'font-semibold', priceColor(v))}>
                        {v >= 0 ? '+' : ''}{v.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 月營收 */}
          {tab === 'revenue' && (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-tv-border">
                  {['期間','月營收','年增率'].map((h) => (
                    <th key={h} className="px-3 py-2 text-tv-muted font-medium text-left [&:not(:first-child)]:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail?.revenue?.map((r) => (
                  <tr key={`${r.revenue_year}-${r.revenue_month}`} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                    <td className="px-3 py-1.5 text-tv-muted font-mono">{r.revenue_year}/{String(r.revenue_month).padStart(2,'0')}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-tv-text">{fmtRevenue(r.revenue)}</td>
                    <td className={clsx('px-3 py-1.5 text-right font-mono', priceColor(r.revenue_yoy))}>
                      {r.revenue_yoy >= 0 ? '+' : ''}{r.revenue_yoy?.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 財務數據 */}
          {tab === 'financials' && (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-tv-border">
                  {['期間','營收','毛利率','營益率','EPS'].map((h) => (
                    <th key={h} className="px-3 py-2 text-tv-muted font-medium text-left [&:not(:first-child)]:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financials?.slice().reverse().map((f) => (
                  <tr key={`${f.year}Q${f.quarter}`} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                    <td className="px-3 py-1.5 text-tv-muted font-mono">{f.year}Q{f.quarter}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-tv-text">{fmtRevenue(f.revenue)}</td>
                    <td className={clsx('px-3 py-1.5 text-right font-mono', f.gross_margin >= 30 ? 'price-up' : 'text-tv-text')}>{f.gross_margin.toFixed(1)}%</td>
                    <td className={clsx('px-3 py-1.5 text-right font-mono', f.op_margin >= 10 ? 'price-up' : 'text-tv-text')}>{f.op_margin.toFixed(1)}%</td>
                    <td className={clsx('px-3 py-1.5 text-right font-mono font-semibold', priceColor(f.eps))}>{f.eps >= 0 ? '' : '-'}{Math.abs(f.eps).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
