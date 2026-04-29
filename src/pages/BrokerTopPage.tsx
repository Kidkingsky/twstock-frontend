import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { Users } from 'lucide-react'
import { useBrokerTop } from '../hooks/useBrokerTop'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { BrokerTopStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<BrokerTopStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  {
    key: 'broker', header: '分點券商', render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-tv-text text-[11px]">{r.broker_name}</span>
        <span className="text-tv-muted text-[10px] font-mono">{r.broker_id}</span>
      </div>
    ),
  },
  { key: 'close', header: '股價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  {
    key: 'net_buy', header: '淨買入(張)', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold', priceColor(r.net_buy))}>
        {r.net_buy >= 0 ? '+' : ''}{r.net_buy?.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'total_buy', header: '總買入(張)', align: 'right',
    render: (r) => <span className="font-mono text-tv-text">{r.total_buy?.toLocaleString()}</span>,
  },
  {
    key: 'days', header: '連買天數', align: 'center',
    render: (r) => (
      <span className={clsx(
        'font-mono px-1.5 py-0.5 rounded text-xs',
        r.days_bought >= 5 ? 'price-up bg-up' :
        r.days_bought >= 3 ? 'text-tv-warn bg-[rgba(255,152,0,0.15)]' :
        'text-tv-text'
      )}>
        {r.days_bought}天
      </span>
    ),
  },
]

export default function BrokerTopPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useBrokerTop()

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">分點追蹤</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">主力券商持續買超個股</span>
        </div>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<BrokerTopStock>
          columns={columns}
          data={data}
          isLoading={isLoading}
          rowKey={(r) => `${r.stock_id}-${r.broker_id}`}
          onRowClick={(r) => openStock(r.stock_id)}
          maxHeight="100%"
        />
      </div>
    </div>
  )
}
