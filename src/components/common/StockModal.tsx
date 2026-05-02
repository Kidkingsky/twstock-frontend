import { useEffect, useRef } from 'react'
import { X, ExternalLink, Sparkles, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useStockDetail, useStockAIAnalysis } from '../../hooks/useStockDetail'
import { useFinancials } from '../../hooks/useFinancials'
import { usePredictionStock } from '../../hooks/usePrediction'
import KLineChart from '../charts/KLineChart'
import { fmt, fmtPct, fmtVol, fmtRevenue, priceColor } from '../../utils/formatters'

const SIGNAL_BADGE_MAP: Record<string, { label: string; cls: string }> = {
  STRONG_BUY:   { label: '強買',   cls: 'bg-tv-up/20 text-tv-up' },
  BUY:          { label: '買入',   cls: 'bg-tv-up/10 text-tv-up/80' },
  WATCH:        { label: '強但熱', cls: 'bg-amber-500/20 text-amber-400' },
  ACCUMULATING: { label: '蓄積中', cls: 'bg-cyan-500/20 text-cyan-400' },
  NEUTRAL:      { label: '中性',   cls: 'bg-tv-border text-tv-muted' },
  SELL:         { label: '賣出',   cls: 'bg-tv-down/10 text-tv-down/80' },
  STRONG_SELL:  { label: '強賣',   cls: 'bg-tv-down/20 text-tv-down' },
}

interface StockModalProps {
  stockId: string
  onClose: () => void
}

function StatItem({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-tv-muted">{label}</span>
      <span className={clsx('text-xs font-mono font-medium', colorClass || 'text-tv-text')}>{value}</span>
    </div>
  )
}

// ── 評分雷達條 ─────────────────────────────────────────────────────
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

export default function StockModal({ stockId, onClose }: StockModalProps) {
  const navigate = useNavigate()
  const { data: detail, isLoading: detailLoading } = useStockDetail(stockId)
  const { data: financials }   = useFinancials(stockId)
  const { data: scoreHistory } = usePredictionStock(stockId)
  const { data: aiData, isFetching: aiLoading, refetch: fetchAI } = useStockAIAnalysis(stockId)
  const overlayRef = useRef<HTMLDivElement>(null)

  // 取最新評分
  const latestScore = scoreHistory && Array.isArray(scoreHistory) && scoreHistory.length > 0
    ? scoreHistory[scoreHistory.length - 1]
    : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const rt = detail?.realtime
  const info = detail?.info
  const changePct = rt?.change_pct ?? 0
  const changeColor = priceColor(changePct)
  const latestSignal = latestScore?.signal ? SIGNAL_BADGE_MAP[latestScore.signal] : null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-tv-card border border-tv-border rounded-lg w-[900px] max-w-[96vw] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-tv-border shrink-0">
          <div className="flex items-center gap-3">
            <div>
              {detailLoading ? (
                <div className="skeleton h-5 w-32 rounded" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-tv-accent font-mono font-bold text-base">{info?.stock_id}</span>
                  <span className="text-tv-text font-semibold text-base">{info?.stock_name}</span>
                  <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">{info?.market}</span>
                  <span className="text-[10px] text-tv-muted">{info?.industry}</span>
                </div>
              )}
            </div>
            {rt && (
              <div className="flex items-center gap-2 ml-4">
                <span className={clsx('text-2xl font-mono font-bold', changeColor)}>{fmt(rt.price, 2)}</span>
                <div className="flex flex-col">
                  <span className={clsx('text-xs font-mono', changeColor)}>{fmtPct(changePct)}</span>
                  <span className={clsx('text-xs font-mono', changeColor)}>
                    {rt.change >= 0 ? '+' : ''}{fmt(rt.change, 2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); navigate(`/stock/${stockId}`) }}
              title="開啟完整詳情頁（含 MACD / RSI / 估值）"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-tv-accent/10 text-tv-accent border border-tv-accent/30 hover:bg-tv-accent/20 transition-colors"
            >
              <ExternalLink size={11} />
              詳情頁
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-tv-border text-tv-muted hover:text-tv-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick stats */}
          {rt && (
            <div className="grid grid-cols-5 gap-3 p-3 bg-tv-bg rounded border border-tv-border">
              <StatItem label="開盤" value={fmt(rt.open)} />
              <StatItem label="最高" value={fmt(rt.high)} colorClass="price-up" />
              <StatItem label="最低" value={fmt(rt.low)} colorClass="price-down" />
              <StatItem label="昨收" value={fmt(rt.yesterday)} />
              <StatItem label="成交量" value={fmtVol(rt.volume)} />
            </div>
          )}

          {/* AI Score Card */}
          {latestScore && (
            <div className="tv-card p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-tv-text">AI 綜合評分</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tv-muted">{latestScore.trade_date}</span>
                  <span className={clsx(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    latestScore.total_score >= 70 ? 'bg-tv-up/20 text-tv-up' :
                    latestScore.total_score >= 60 ? 'bg-tv-accent/20 text-tv-accent' :
                    latestScore.total_score >= 50 ? 'bg-tv-border text-tv-muted' :
                    'bg-tv-down/20 text-tv-down'
                  )}>
                    {latestScore.total_score} 分
                  </span>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    latestSignal?.cls ?? 'bg-tv-border text-tv-muted'
                  )}>
                    {latestSignal?.label ?? latestScore.signal}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <ScoreBar label="技術" score={latestScore.score_tech} color="#2962ff" />
                <ScoreBar label="籌碼" score={latestScore.score_chip} color="#ff9800" />
                <ScoreBar label="基本" score={latestScore.score_fund} color="#26a69a" />
                <ScoreBar label="總體" score={latestScore.score_macro} color="#9c27b0" />
                <ScoreBar label="動能" score={latestScore.score_momentum} color="#e91e63" />
              </div>
            </div>
          )}

          {/* AI 白話解讀 */}
          <div className="tv-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-xs font-semibold text-tv-text">AI 白話解讀</span>
                {aiData?.cached && <span className="text-[10px] text-tv-muted">（快取）</span>}
              </div>
              <button
                onClick={() => fetchAI()}
                disabled={aiLoading}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                  aiData
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                    : 'bg-tv-accent/10 text-tv-accent border border-tv-accent/30 hover:bg-tv-accent/20',
                  aiLoading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {aiLoading
                  ? <><Loader2 size={9} className="animate-spin" />分析中</>
                  : <><Sparkles size={9} />{aiData ? '重新' : 'AI 解讀'}</>
                }
              </button>
            </div>
            {!aiData && !aiLoading && (
              <p className="text-[10px] text-tv-muted">點擊按鈕，由 AI 整合技術面、籌碼面與新聞產生白話分析。</p>
            )}
            {aiLoading && (
              <div className="flex items-center gap-2 py-2 text-[10px] text-tv-muted">
                <Loader2 size={11} className="animate-spin text-cyan-400" />約需 5~15 秒…
              </div>
            )}
            {aiData?.analysis && !aiLoading && (
              <p className={clsx(
                'text-[11px] leading-relaxed p-2 rounded border',
                aiData.enabled
                  ? 'border-cyan-500/20 bg-cyan-500/5 text-tv-text'
                  : 'border-tv-border text-tv-muted'
              )}>
                {aiData.analysis}
              </p>
            )}
          </div>

          {/* K-Line Chart */}
          <div className="tv-card p-3">
            <div className="flex items-center gap-3 mb-3 text-[10px]">
              <span className="text-tv-muted font-medium">日K線圖</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#2962ff]" />MA20</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#ff9800]" />MA60</span>
            </div>
            {detailLoading ? (
              <div className="skeleton h-72 rounded" />
            ) : detail?.kline && detail.kline.length > 0 ? (
              <KLineChart data={detail.kline} height={300} />
            ) : (
              <div className="h-72 flex items-center justify-center text-tv-muted text-sm">無K線資料</div>
            )}
          </div>

          {/* Chip Data */}
          {detail?.chip && detail.chip.length > 0 && (
            <div className="tv-card p-3">
              <h4 className="text-xs font-semibold text-tv-text mb-3">籌碼分析（近20日）</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-tv-border">
                      <th className="text-left px-2 py-1.5 text-tv-muted font-medium">日期</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">外資</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">投信</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">自營商</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.chip.slice(-20).reverse().map((c) => (
                      <tr key={c.trade_date} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                        <td className="px-2 py-1 text-tv-muted font-mono">{c.trade_date}</td>
                        <td className={clsx('px-2 py-1 text-right font-mono', priceColor(c.foreign_net))}>
                          {c.foreign_net >= 0 ? '+' : ''}{c.foreign_net.toLocaleString()}
                        </td>
                        <td className={clsx('px-2 py-1 text-right font-mono', priceColor(c.investment_trust_net))}>
                          {c.investment_trust_net >= 0 ? '+' : ''}{c.investment_trust_net.toLocaleString()}
                        </td>
                        <td className={clsx('px-2 py-1 text-right font-mono', priceColor(c.dealer_net))}>
                          {c.dealer_net >= 0 ? '+' : ''}{c.dealer_net.toLocaleString()}
                        </td>
                        <td className={clsx('px-2 py-1 text-right font-mono font-semibold', priceColor(c.total_net))}>
                          {c.total_net >= 0 ? '+' : ''}{c.total_net.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revenue */}
          {detail?.revenue && detail.revenue.length > 0 && (
            <div className="tv-card p-3">
              <h4 className="text-xs font-semibold text-tv-text mb-3">月營收</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-tv-border">
                      <th className="text-left px-2 py-1.5 text-tv-muted font-medium">期間</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">月營收</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">年增率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.revenue.slice(-12).reverse().map((r) => (
                      <tr key={`${r.revenue_year}-${r.revenue_month}`} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                        <td className="px-2 py-1 text-tv-muted font-mono">
                          {r.revenue_year}/{String(r.revenue_month).padStart(2, '0')}
                        </td>
                        <td className="px-2 py-1 text-right font-mono text-tv-text">{fmtRevenue(r.revenue)}</td>
                        <td className={clsx('px-2 py-1 text-right font-mono', priceColor(r.revenue_yoy))}>
                          {r.revenue_yoy >= 0 ? '+' : ''}{r.revenue_yoy.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financials */}
          {financials && financials.length > 0 && (
            <div className="tv-card p-3">
              <h4 className="text-xs font-semibold text-tv-text mb-3">財務數據</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-tv-border">
                      <th className="text-left px-2 py-1.5 text-tv-muted font-medium">期間</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">營收</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">毛利率</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">營益率</th>
                      <th className="text-right px-2 py-1.5 text-tv-muted font-medium">EPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financials.slice(-8).reverse().map((f) => (
                      <tr key={`${f.year}Q${f.quarter}`} className="border-b border-tv-border/30 hover:bg-tv-border/20">
                        <td className="px-2 py-1 text-tv-muted font-mono">{f.year}Q{f.quarter}</td>
                        <td className="px-2 py-1 text-right font-mono text-tv-text">{fmtRevenue(f.revenue)}</td>
                        <td className={clsx('px-2 py-1 text-right font-mono', f.gross_margin >= 30 ? 'price-up' : 'text-tv-text')}>
                          {f.gross_margin.toFixed(1)}%
                        </td>
                        <td className={clsx('px-2 py-1 text-right font-mono', f.op_margin >= 10 ? 'price-up' : 'text-tv-text')}>
                          {f.op_margin.toFixed(1)}%
                        </td>
                        <td className={clsx('px-2 py-1 text-right font-mono font-semibold', priceColor(f.eps))}>
                          {f.eps >= 0 ? '' : '-'}{Math.abs(f.eps).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
