import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { useSignals } from '../hooks/useSignals'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { SignalStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

type TabType = 'bullish' | 'rebound'

const columns: Column<SignalStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono text-xs">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'industry', header: '產業', render: (r) => <span className="text-tv-muted text-[11px]">{r.industry}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'ma20', header: 'MA20', align: 'right', render: (r) => <span className="font-mono text-[#2962ff]">{fmt(r.ma20)}</span> },
  { key: 'ma60', header: 'MA60', align: 'right', render: (r) => <span className="font-mono text-[#ff9800]">{fmt(r.ma60)}</span> },
  {
    key: 'macd', header: 'MACD', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.macd_bar))}>
        {r.macd_bar >= 0 ? '+' : ''}{r.macd_bar?.toFixed(3)}
      </span>
    ),
  },
  {
    key: 'kd', header: 'KD', align: 'right',
    render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-mono text-tv-text">K:{r.k_value?.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-tv-muted">D:{r.d_value?.toFixed(1)}</span>
      </div>
    ),
  },
  {
    key: 'rsi', header: 'RSI14', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', r.rsi14 >= 70 ? 'price-up' : r.rsi14 <= 30 ? 'price-down' : 'text-tv-text')}>
        {r.rsi14?.toFixed(1)}
      </span>
    ),
  },
  { key: 'vol', header: '成交量', align: 'right', render: (r) => <span className="text-tv-muted font-mono">{fmtVol(r.volume)}</span> },
]

export default function SignalsPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const [tab, setTab] = useState<TabType>('bullish')
  const { data, isLoading } = useSignals(tab)

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tv-text">偏多訊號</h2>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>

      <div className="tv-card flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-tv-border shrink-0">
          {([['bullish', '偏多訊號'], ['rebound', '短線反彈']] as [TabType, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
                tab === t ? 'border-tv-accent text-tv-text' : 'border-transparent text-tv-muted hover:text-tv-text'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <DataTable<SignalStock>
            columns={columns}
            data={data}
            isLoading={isLoading}
            rowKey={(r) => r.stock_id}
            onRowClick={(r) => openStock(r.stock_id)}
            maxHeight="100%"
          />
        </div>
      </div>
    </div>
  )
}
