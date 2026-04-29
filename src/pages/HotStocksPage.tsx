import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { useHotStocks } from '../hooks/useHotStocks'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { HotStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<HotStock>[] = [
  { key: 'rank', header: '#', width: '36px', render: (_, i) => <span className="text-tv-muted font-mono">{i + 1}</span> },
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'industry', header: '產業', render: (r) => <span className="text-tv-muted text-[11px]">{r.industry}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'open', header: '開盤', align: 'right', render: (r) => <span className="font-mono text-tv-muted">{fmt(r.open)}</span> },
  { key: 'high', header: '最高', align: 'right', render: (r) => <span className="font-mono price-up">{fmt(r.high)}</span> },
  { key: 'low', header: '最低', align: 'right', render: (r) => <span className="font-mono price-down">{fmt(r.low)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  { key: 'vol', header: '成交量', align: 'right', render: (r) => <span className="font-mono text-tv-text">{fmtVol(r.volume)}</span> },
  {
    key: 'kd', header: 'KD', align: 'right',
    render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-mono">K:{r.k_value?.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-tv-muted">D:{r.d_value?.toFixed(1)}</span>
      </div>
    ),
  },
  {
    key: 'rsi', header: 'RSI', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', r.rsi14 >= 70 ? 'price-up' : r.rsi14 <= 30 ? 'price-down' : 'text-tv-text')}>
        {r.rsi14?.toFixed(1)}
      </span>
    ),
  },
  {
    key: 'signal', header: '訊號', align: 'center',
    render: (r) => (
      <div className="flex gap-1 justify-center">
        {r.signal_bullish && <span className="bg-up text-tv-up text-[9px] px-1 py-0.5 rounded">多</span>}
        {r.signal_rebound && <span className="bg-[rgba(255,152,0,0.15)] text-tv-warn text-[9px] px-1 py-0.5 rounded">彈</span>}
      </div>
    ),
  },
]

export default function HotStocksPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useHotStocks(50)

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tv-text">熱門成交</h2>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<HotStock>
          columns={columns}
          data={data}
          isLoading={isLoading}
          rowKey={(r) => r.stock_id}
          onRowClick={(r) => openStock(r.stock_id)}
          maxHeight="100%"
        />
      </div>
    </div>
  )
}
