import { useEffect, useRef } from 'react'
import { X, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'
import { useStockDetail } from '../../hooks/useStockDetail'
import { useFinancials } from '../../hooks/useFinancials'
import KLineChart from '../charts/KLineChart'
import { fmt, fmtPct, fmtVol, fmtRevenue, priceColor, fmtDate } from '../../utils/formatters'

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

export default function StockModal({ stockId, onClose }: StockModalProps) {
  const { data: detail, isLoading: detailLoading } = useStockDetail(stockId)
  const { data: financials } = useFinancials(stockId)
  const overlayRef = useRef<HTMLDivElement>(null)

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
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-tv-border text-tv-muted hover:text-tv-text transition-colors"
          >
            <X size={16} />
          </button>
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
