import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { useInstitutional, InstitutionalSort } from '../hooks/useInstitutional'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, priceColor } from '../utils/formatters'
import type { InstitutionalStock } from '../types/api'

interface OutletContext { openStock: (id: string) => void }

function NetCell({ value }: { value: number }) {
  return (
    <span className={clsx('font-mono text-xs', priceColor(value))}>
      {value >= 0 ? '+' : ''}{value.toLocaleString()}
    </span>
  )
}

const columns: Column<InstitutionalStock>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  { key: 'foreign', header: '外資買賣超', align: 'right', render: (r) => <NetCell value={r.foreign_net} /> },
  { key: 'trust', header: '投信買賣超', align: 'right', render: (r) => <NetCell value={r.investment_trust_net} /> },
  { key: 'dealer', header: '自營商買賣超', align: 'right', render: (r) => <NetCell value={r.dealer_net} /> },
  { key: 'total', header: '三大法人合計', align: 'right', render: (r) => <NetCell value={r.total_net} /> },
]

type TabType = { label: string; sort: InstitutionalSort }

const tabs: TabType[] = [
  { label: '外資買超', sort: 'foreign' },
  { label: '投信買超', sort: 'investment_trust' },
  { label: '自營買超', sort: 'dealer' },
  { label: '合計買超', sort: 'total' },
]

export default function InstitutionalPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const [sortType, setSortType] = useState<InstitutionalSort>('foreign')
  const { data, isLoading } = useInstitutional(50, sortType)

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-tv-text">三大法人</h2>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>
      <div className="tv-card flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-tv-border shrink-0">
          {tabs.map((t) => (
            <button
              key={t.sort}
              onClick={() => setSortType(t.sort)}
              className={clsx(
                'px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
                sortType === t.sort ? 'border-tv-accent text-tv-text' : 'border-transparent text-tv-muted hover:text-tv-text'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <DataTable<InstitutionalStock>
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
