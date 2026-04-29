import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { Scissors } from 'lucide-react'
import { useShortSqueeze } from '../hooks/useShortSqueeze'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { ShortSqueezeStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<ShortSqueezeStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'industry', header: '產業', render: (r) => <span className="text-tv-muted text-[11px]">{r.industry}</span> },
  { key: 'close', header: '股價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  {
    key: 'short', header: '空單餘額', align: 'right',
    render: (r) => <span className="font-mono text-tv-text">{r.short_balance?.toLocaleString()}</span>,
  },
  {
    key: 'short_chg', header: '空單變動', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', r.short_change < 0 ? 'price-up' : r.short_change > 0 ? 'price-down' : 'text-tv-muted')}>
        {r.short_change >= 0 ? '+' : ''}{r.short_change?.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'margin', header: '融資餘額', align: 'right',
    render: (r) => <span className="font-mono text-tv-muted">{r.margin_balance?.toLocaleString()}</span>,
  },
  {
    key: 'foreign', header: '外資', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono text-[11px]', priceColor(r.foreign_net))}>
        {r.foreign_net >= 0 ? '+' : ''}{r.foreign_net}
      </span>
    ),
  },
  {
    key: 'total', header: '法人合計', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold text-[11px]', priceColor(r.total_net))}>
        {r.total_net >= 0 ? '+' : ''}{r.total_net}
      </span>
    ),
  },
  { key: 'ma20', header: 'MA20', align: 'right', render: (r) => <span className="font-mono text-[#2962ff]">{fmt(r.ma20)}</span> },
  {
    key: 'signal', header: '偏多', align: 'center',
    render: (r) => r.signal_bullish ? <span className="bg-up price-up text-[10px] px-1.5 py-0.5 rounded">多</span> : <span className="text-tv-muted">-</span>,
  },
]

export default function ShortSqueezePage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useShortSqueeze()

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">軋空候選</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">空單高且外資回補，具軋空潛力</span>
        </div>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<ShortSqueezeStock>
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
