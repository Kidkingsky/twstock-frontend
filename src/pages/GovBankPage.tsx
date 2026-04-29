import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { Landmark } from 'lucide-react'
import { useGovBank } from '../hooks/useGovBank'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type { GovBankStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const columns: Column<GovBankStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'industry', header: '產業', render: (r) => <span className="text-tv-muted text-[11px]">{r.industry}</span> },
  { key: 'close', header: '股價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  {
    key: 'gov5d', header: '官股5日買超', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold', priceColor(r.gov_net_5d))}>
        {r.gov_net_5d >= 0 ? '+' : ''}{r.gov_net_5d?.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'days', header: '連續天數', align: 'center',
    render: (r) => (
      <span className={clsx(
        'font-mono px-1.5 py-0.5 rounded text-xs',
        r.trading_days >= 5 ? 'price-up bg-up' :
        r.trading_days >= 3 ? 'text-tv-warn bg-[rgba(255,152,0,0.15)]' :
        'text-tv-text'
      )}>
        {r.trading_days}天
      </span>
    ),
  },
  { key: 'vol', header: '成交量', align: 'right', render: (r) => <span className="font-mono text-tv-muted">{fmtVol(r.volume)}</span> },
  {
    key: 'signal', header: '偏多', align: 'center',
    render: (r) => r.signal_bullish ? <span className="bg-up price-up text-[10px] px-1.5 py-0.5 rounded">多</span> : <span className="text-tv-muted">-</span>,
  },
]

export default function GovBankPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useGovBank()

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">官股護盤</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">政府基金連續買超護盤個股</span>
        </div>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<GovBankStock>
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
