import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { GitMerge } from 'lucide-react'
import { useMultiSignal } from '../hooks/useMultiSignal'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol } from '../utils/formatters'
import type { MultiSignalStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const STRATEGY_COLORS: Record<string, string> = {
  A: 'bg-[rgba(41,98,255,0.2)] text-[#2962ff]',
  B: 'bg-[rgba(239,83,80,0.15)] text-tv-up',
  C: 'bg-[rgba(38,166,154,0.15)] text-tv-down',
  D: 'bg-[rgba(255,152,0,0.15)] text-tv-warn',
  E: 'bg-[rgba(156,39,176,0.15)] text-purple-400',
  F: 'bg-[rgba(0,188,212,0.15)] text-cyan-400',
}

const columns: Column<MultiSignalStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  { key: 'vol', header: '量', align: 'right', render: (r) => <span className="font-mono text-tv-muted">{fmtVol(r.volume)}</span> },
  {
    key: 'count', header: '共振數', align: 'center',
    render: (r) => (
      <div className="flex justify-center">
        <span className={clsx(
          'font-mono font-bold text-sm px-2 py-0.5 rounded',
          r.signal_count >= 5 ? 'price-up bg-up' :
          r.signal_count >= 3 ? 'text-tv-warn bg-[rgba(255,152,0,0.15)]' :
          'text-tv-text bg-tv-border'
        )}>
          {r.signal_count}
        </span>
      </div>
    ),
  },
  {
    key: 'strategies', header: '觸發策略', render: (r) => (
      <div className="flex gap-1 flex-wrap">
        {r.strategies.map((s) => (
          <span
            key={s}
            className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold',
              STRATEGY_COLORS[s] || 'bg-tv-border text-tv-muted'
            )}
          >
            {s}
          </span>
        ))}
      </div>
    ),
  },
]

export default function MultiSignalPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data, isLoading } = useMultiSignal()

  const sortedData = data ? [...data].sort((a, b) => b.signal_count - a.signal_count) : undefined

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitMerge size={15} className="text-tv-accent" />
          <h2 className="text-sm font-semibold text-tv-text">多訊號共振</h2>
          <span className="text-[10px] text-tv-muted bg-tv-border px-1.5 py-0.5 rounded">同時符合多個策略的強勢股</span>
        </div>
        <span className="text-[11px] text-tv-muted">{sortedData?.length ?? 0} 筆</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-tv-muted">策略色碼：</span>
        {Object.entries(STRATEGY_COLORS).map(([code, cls]) => (
          <span key={code} className={clsx('px-1.5 py-0.5 rounded font-mono font-semibold', cls)}>
            {code}
          </span>
        ))}
      </div>

      <div className="tv-card flex-1 flex flex-col min-h-0">
        <DataTable<MultiSignalStock>
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
