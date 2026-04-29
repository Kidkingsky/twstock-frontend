import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { AlertTriangle } from 'lucide-react'
import { useMarginAlert } from '../hooks/useMarginAlert'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, priceColor } from '../utils/formatters'
import type { MarginAlert } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<MarginAlert>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '股價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  {
    key: 'balance', header: '融資餘額', align: 'right',
    render: (r) => <span className="font-mono text-tv-text">{r.margin_balance?.toLocaleString()}</span>,
  },
  {
    key: 'prev', header: '前日餘額', align: 'right',
    render: (r) => <span className="font-mono text-tv-muted">{r.prev_balance?.toLocaleString()}</span>,
  },
  {
    key: 'change', header: '變動量', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold', priceColor(r.margin_change))}>
        {r.margin_change >= 0 ? '+' : ''}{r.margin_change?.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'change_pct', header: '變動%', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.change_pct))}>
        {r.change_pct >= 0 ? '+' : ''}{r.change_pct?.toFixed(2)}%
      </span>
    ),
  },
  {
    key: 'alert', header: '警示', align: 'center',
    render: (r) => {
      if (r.change_pct <= -10) return <span className="bg-[rgba(239,83,80,0.2)] price-up text-[10px] px-1.5 py-0.5 rounded">急降</span>
      if (r.change_pct >= 10) return <span className="bg-[rgba(255,152,0,0.15)] text-tv-warn text-[10px] px-1.5 py-0.5 rounded">急增</span>
      return <span className="text-tv-muted">-</span>
    },
  },
]

export default function MarginAlertPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useMarginAlert()

  const sortedData = data ? [...data].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)) : undefined

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-tv-warn" />
          <h2 className="text-sm font-semibold text-tv-text">融資警示</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">融資餘額大幅異動警示</span>
        </div>
        <span className="text-[11px] text-tv-muted">{sortedData?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<MarginAlert>
          columns={columns}
          data={sortedData}
          isLoading={isLoading}
          rowKey={(r) => r.stock_id}
          onRowClick={(r) => openStock(r.stock_id)}
          maxHeight="100%"
        />
      </div>
    </div>
  )
}
