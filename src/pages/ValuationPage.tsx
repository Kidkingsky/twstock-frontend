import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BarChart3, Droplets, RefreshCw } from 'lucide-react'
import { useValuation, useChipClean } from '../hooks/useValuation'
import { fmt, priceColor } from '../utils/formatters'

type ValSort = 'dividend_yield' | 'per' | 'pbr'

// ── 排序按鈕 ─────────────────────────────────────────────────────
function SortBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'text-[11px] px-3 py-1 rounded transition-colors',
        active ? 'bg-tv-accent text-white' : 'text-tv-muted bg-tv-border hover:text-tv-text'
      )}
    >
      {label}
    </button>
  )
}

export default function ValuationPage() {
  const navigate = useNavigate()
  const [tab, setTab]   = useState<'valuation' | 'chip-clean'>('valuation')
  const [sort, setSort] = useState<ValSort>('dividend_yield')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const { data: valData, isLoading: valLoading, refetch: refetchVal } = useValuation(sort, order)
  const { data: chipData, isLoading: chipLoading, refetch: refetchChip } = useChipClean()

  const openStock = (id: string) => navigate(`/stock/${id}`)

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── 頁面標頭 ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">估值分析</h2>
        </div>
        <button
          onClick={() => tab === 'valuation' ? refetchVal() : refetchChip()}
          className="flex items-center gap-1 text-[11px] text-tv-muted hover:text-tv-text transition-colors"
        >
          <RefreshCw size={11} />
          更新
        </button>
      </div>

      {/* ── 分頁切換 ── */}
      <div className="flex gap-1 border-b border-tv-border pb-0">
        {([
          { key: 'valuation',  label: '🏦 PER / PBR / 殖利率' },
          { key: 'chip-clean', label: '🧹 籌碼洗淨' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-4 py-2 text-xs transition-colors border-b-2',
              tab === key
                ? 'border-tv-accent text-tv-text font-medium'
                : 'border-transparent text-tv-muted hover:text-tv-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════ 估值排行 ══════════════════════ */}
      {tab === 'valuation' && (
        <>
          {/* 排序控制 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-tv-muted">排序：</span>
            <SortBtn active={sort === 'dividend_yield'} label="殖利率↓" onClick={() => { setSort('dividend_yield'); setOrder('desc') }} />
            <SortBtn active={sort === 'per' && order === 'asc'} label="PER↑低" onClick={() => { setSort('per'); setOrder('asc') }} />
            <SortBtn active={sort === 'pbr' && order === 'asc'} label="PBR↑低" onClick={() => { setSort('pbr'); setOrder('asc') }} />
          </div>

          <div className="tv-card flex-1 overflow-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 bg-tv-card">
                <tr className="border-b border-tv-border">
                  <th className="text-left px-3 py-2 text-tv-muted font-medium w-16">代號</th>
                  <th className="text-left px-3 py-2 text-tv-muted font-medium">名稱</th>
                  <th className="text-left px-3 py-2 text-tv-muted font-medium hidden sm:table-cell">產業</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">股價</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">PER</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">PBR</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">殖利率</th>
                </tr>
              </thead>
              <tbody>
                {valLoading
                  ? Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="border-b border-tv-border/30">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-3 py-2">
                            <div className="skeleton h-3.5 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : valData?.map((row) => (
                      <tr
                        key={row.stock_id}
                        className="border-b border-tv-border/30 hover:bg-tv-border/30 cursor-pointer"
                        onClick={() => openStock(row.stock_id)}
                      >
                        <td className="px-3 py-2 text-tv-accent font-mono font-semibold">{row.stock_id}</td>
                        <td className="px-3 py-2 text-tv-text">{row.stock_name}</td>
                        <td className="px-3 py-2 text-tv-muted hidden sm:table-cell text-[11px]">{row.industry ?? '-'}</td>
                        <td className="px-3 py-2 text-right font-mono text-tv-text">{row.close != null ? fmt(row.close) : '-'}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {row.per != null ? (
                            <span className={clsx(
                              row.per < 15 ? 'text-tv-up' : row.per > 30 ? 'text-tv-down' : 'text-tv-text'
                            )}>{row.per.toFixed(1)}</span>
                          ) : <span className="text-tv-muted">-</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {row.pbr != null ? (
                            <span className={clsx(row.pbr < 1 ? 'text-tv-up' : 'text-tv-text')}>
                              {row.pbr.toFixed(2)}
                            </span>
                          ) : <span className="text-tv-muted">-</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {row.dividend_yield != null ? (
                            <span className={clsx(
                              row.dividend_yield >= 6 ? 'text-tv-up font-semibold' :
                              row.dividend_yield >= 4 ? 'text-tv-text' : 'text-tv-muted'
                            )}>{row.dividend_yield.toFixed(2)}%</span>
                          ) : <span className="text-tv-muted">-</span>}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-tv-muted">
            資料來源：TWSE OpenAPI（每日更新）．
            需先執行 <code className="bg-tv-border px-1 rounded">POST /api/admin/sync-valuation</code> 初始化
          </p>
        </>
      )}

      {/* ══════════════════════ 籌碼洗淨 ══════════════════════ */}
      {tab === 'chip-clean' && (
        <>
          <div className="flex items-center gap-2">
            <Droplets size={13} className="text-tv-accent" />
            <span className="text-[11px] text-tv-muted">觀察期（約10個交易日）內融資遞減 ≥ 200張 且股價同期上漲</span>
          </div>

          <div className="tv-card flex-1 overflow-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 bg-tv-card">
                <tr className="border-b border-tv-border">
                  <th className="text-left px-3 py-2 text-tv-muted font-medium w-16">代號</th>
                  <th className="text-left px-3 py-2 text-tv-muted font-medium">名稱</th>
                  <th className="text-left px-3 py-2 text-tv-muted font-medium hidden sm:table-cell">產業</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">現價</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">股價漲幅</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">融資減幅</th>
                  <th className="text-right px-3 py-2 text-tv-muted font-medium">籌碼差距</th>
                </tr>
              </thead>
              <tbody>
                {chipLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-tv-border/30">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-3 py-2"><div className="skeleton h-3.5 rounded" /></td>
                        ))}
                      </tr>
                    ))
                  : chipData?.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-tv-muted">目前無籌碼洗淨訊號</td>
                    </tr>
                  )
                  : chipData?.map((row) => {
                    const diff = row.price_chg_pct - Math.abs(row.margin_chg_pct)
                    return (
                      <tr
                        key={row.stock_id}
                        className="border-b border-tv-border/30 hover:bg-tv-border/30 cursor-pointer"
                        onClick={() => openStock(row.stock_id)}
                      >
                        <td className="px-3 py-2 text-tv-accent font-mono font-semibold">{row.stock_id}</td>
                        <td className="px-3 py-2 text-tv-text">{row.stock_name}</td>
                        <td className="px-3 py-2 text-tv-muted hidden sm:table-cell text-[11px]">{row.industry}</td>
                        <td className="px-3 py-2 text-right font-mono text-tv-text">{fmt(row.close)}</td>
                        <td className={clsx('px-3 py-2 text-right font-mono', priceColor(row.price_chg_pct))}>
                          +{row.price_chg_pct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-tv-up">
                          {row.margin_chg_pct.toFixed(1)}%
                        </td>
                        <td className={clsx('px-3 py-2 text-right font-mono font-semibold', diff > 5 ? 'text-tv-up' : 'text-tv-text')}>
                          +{diff.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {/* 說明 */}
          <div className="tv-card p-3 text-[11px] text-tv-muted space-y-1">
            <p>📌 <strong className="text-tv-text">籌碼差距</strong> = 股價漲幅 - 融資減幅，數字越大代表「股票漲、槓桿退場」現象越明顯</p>
            <p>✅ 解讀：散戶融資持續退場但股價仍創高，代表有更強的買盤（法人/大戶）在撐盤，是相對健康的上漲訊號</p>
          </div>
        </>
      )}
    </div>
  )
}
