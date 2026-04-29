import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { Star } from 'lucide-react'
import { useFiveStar } from '../hooks/useFiveStar'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { FiveStarStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<FiveStarStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'industry', header: '產業', render: (r) => <span className="text-tv-muted text-[11px]">{r.industry}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'vol', header: '量', align: 'right', render: (r) => <span className="font-mono text-tv-muted">{fmtVol(r.volume)}</span> },
  { key: 'ma20', header: 'MA20', align: 'right', render: (r) => <span className="font-mono text-[#2962ff]">{fmt(r.ma20)}</span> },
  { key: 'ma60', header: 'MA60', align: 'right', render: (r) => <span className="font-mono text-[#ff9800]">{fmt(r.ma60)}</span> },
  {
    key: 'macd', header: 'MACD柱', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.macd_bar))}>
        {r.macd_bar >= 0 ? '+' : ''}{r.macd_bar?.toFixed(3)}
      </span>
    ),
  },
  {
    key: 'kd', header: 'K值', align: 'right',
    render: (r) => <span className="font-mono">{r.k_value?.toFixed(1)}</span>,
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
    key: 'foreign', header: '外資', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.foreign_net))}>
        {r.foreign_net >= 0 ? '+' : ''}{r.foreign_net.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'trust', header: '投信', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.investment_trust_net))}>
        {r.investment_trust_net >= 0 ? '+' : ''}{r.investment_trust_net.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'total', header: '合計', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold', priceColor(r.total_net))}>
        {r.total_net >= 0 ? '+' : ''}{r.total_net.toLocaleString()}
      </span>
    ),
  },
]

export default function FiveStarPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useFiveStar()

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={15} className="text-tv-warn" />
          <h2 className="text-sm font-semibold text-tv-text">五星訊號</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">技術面 + 籌碼面 + 趨勢面 五項共振</span>
        </div>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<FiveStarStock>
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
