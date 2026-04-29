import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { TrendingUp, Activity, Star, Flame, Building2, AlertTriangle } from 'lucide-react'
import { useSummary } from '../hooks/useSummary'
import { useSignals } from '../hooks/useSignals'
import { useHotStocks } from '../hooks/useHotStocks'
import { useInstitutional } from '../hooks/useInstitutional'
import { useMarginAlert } from '../hooks/useMarginAlert'
import { useFiveStar } from '../hooks/useFiveStar'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, fmtPct, priceColor } from '../utils/formatters'
import type { SignalStock, HotStock, InstitutionalStock, MarginAlert, FiveStarStock } from '../types/api'

interface OutletContext {
  openStock: (id: string) => void
}

type LeftTab = 'bullish' | 'rebound' | 'fivestar'
type RightTab = 'hot' | 'foreign' | 'trust' | 'margin'

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="tv-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-tv-muted">{label}</span>
        {icon && <span className="text-tv-muted opacity-60">{icon}</span>}
      </div>
      <span className={clsx('text-xl font-bold font-mono', color || 'text-tv-text')}>{value}</span>
      {sub && <span className="text-[10px] text-tv-muted">{sub}</span>}
    </div>
  )
}

const signalColumns: Column<SignalStock>[] = [
  { key: 'id', header: '代號', width: '60px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  {
    key: 'change', header: '技術', align: 'right',
    render: (r) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className={clsx('text-[10px] font-mono', r.macd_bar > 0 ? 'price-up' : 'price-down')}>MACD:{r.macd_bar > 0 ? '+' : ''}{r.macd_bar?.toFixed(2)}</span>
        <span className="text-[10px] text-tv-muted font-mono">RSI:{r.rsi14?.toFixed(1)}</span>
      </div>
    ),
  },
  { key: 'vol', header: '量', align: 'right', render: (r) => <span className="text-tv-muted font-mono">{fmtVol(r.volume)}</span> },
]

const fiveStarColumns: Column<FiveStarStock>[] = [
  { key: 'id', header: '代號', width: '60px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  {
    key: 'chip', header: '法人', align: 'right',
    render: (r) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className={clsx('text-[10px] font-mono', priceColor(r.foreign_net))}>外:{r.foreign_net >= 0 ? '+' : ''}{r.foreign_net}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(r.investment_trust_net))}>投:{r.investment_trust_net >= 0 ? '+' : ''}{r.investment_trust_net}</span>
      </div>
    ),
  },
  { key: 'rsi', header: 'RSI', align: 'right', render: (r) => <span className="text-tv-muted font-mono">{r.rsi14?.toFixed(1)}</span> },
]

const hotColumns: Column<HotStock>[] = [
  { key: 'id', header: '代號', width: '60px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  { key: 'vol', header: '成交量', align: 'right', render: (r) => <span className="text-tv-muted font-mono">{fmtVol(r.volume)}</span> },
]

const institutionalColumns: Column<InstitutionalStock>[] = [
  { key: 'id', header: '代號', width: '60px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  { key: 'chg', header: '漲跌%', align: 'right', render: (r) => <PriceChange value={r.change_pct} /> },
  {
    key: 'net', header: '外資/投信', align: 'right',
    render: (r) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className={clsx('text-[10px] font-mono', priceColor(r.foreign_net))}>{r.foreign_net >= 0 ? '+' : ''}{r.foreign_net.toLocaleString()}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(r.investment_trust_net))}>{r.investment_trust_net >= 0 ? '+' : ''}{r.investment_trust_net.toLocaleString()}</span>
      </div>
    ),
  },
]

const marginColumns: Column<MarginAlert>[] = [
  { key: 'id', header: '代號', width: '60px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
  {
    key: 'margin', header: '融資餘額', align: 'right',
    render: (r) => <span className="font-mono text-tv-text">{r.margin_balance.toLocaleString()}</span>,
  },
  {
    key: 'change', header: '變動', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono', priceColor(r.margin_change))}>
        {r.margin_change >= 0 ? '+' : ''}{r.margin_change.toLocaleString()}
      </span>
    ),
  },
]

export default function DashboardPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data: summary, isLoading: summaryLoading } = useSummary()
  const [leftTab, setLeftTab] = useState<LeftTab>('bullish')
  const [rightTab, setRightTab] = useState<RightTab>('hot')

  const { data: bullishSignals, isLoading: bullishLoading } = useSignals('bullish')
  const { data: reboundSignals, isLoading: reboundLoading } = useSignals('rebound')
  const { data: fiveStarData, isLoading: fiveStarLoading } = useFiveStar()
  const { data: hotStocks, isLoading: hotLoading } = useHotStocks()
  const { data: foreignData, isLoading: foreignLoading } = useInstitutional(30, 'foreign')
  const { data: trustData, isLoading: trustLoading } = useInstitutional(30, 'investment_trust')
  const { data: marginData, isLoading: marginLoading } = useMarginAlert()

  const taiex = summary?.taiex
  const taiexColor = taiex ? (taiex.change_pct > 0 ? 'text-tv-up' : taiex.change_pct < 0 ? 'text-tv-down' : 'text-tv-muted') : 'text-tv-text'

  const conditionLabel = summary?.market_condition === 'bull' ? '多頭市場' : summary?.market_condition === 'bear' ? '空頭市場' : '中性盤'
  const conditionColor = summary?.market_condition === 'bull' ? 'text-tv-up' : summary?.market_condition === 'bear' ? 'text-tv-down' : 'text-tv-muted'

  const leftLoading = leftTab === 'bullish' ? bullishLoading : leftTab === 'rebound' ? reboundLoading : fiveStarLoading
  const leftData = leftTab === 'bullish' ? bullishSignals : leftTab === 'rebound' ? reboundSignals : undefined

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="加權指數"
          value={taiex ? fmt(taiex.close, 2) : '-'}
          sub={taiex ? `${fmtPct(taiex.change_pct)} 成交 ${fmtVol(taiex.volume)}` : undefined}
          color={taiexColor}
          icon={<Activity size={14} />}
        />
        <StatCard
          label="偏多訊號"
          value={summaryLoading ? '-' : String(summary?.signals.bullish ?? 0)}
          sub="今日符合偏多條件"
          color="text-tv-up"
          icon={<TrendingUp size={14} />}
        />
        <StatCard
          label="反彈訊號"
          value={summaryLoading ? '-' : String(summary?.signals.rebound ?? 0)}
          sub="今日短線反彈候選"
          color="text-tv-warn"
          icon={<Star size={14} />}
        />
        <StatCard
          label="市場狀態"
          value={summaryLoading ? '-' : conditionLabel}
          sub={`資料日期：${summary?.date ?? '-'}`}
          color={conditionColor}
          icon={<Flame size={14} />}
        />
      </div>

      {/* Main panels */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left panel */}
        <div className="flex-1 tv-card flex flex-col min-h-0">
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-tv-border shrink-0">
            {([
              ['bullish', '偏多訊號', <TrendingUp size={12} />],
              ['rebound', '短線反彈', <Activity size={12} />],
              ['fivestar', '五星訊號', <Star size={12} />],
            ] as [LeftTab, string, React.ReactNode][]).map(([tab, label, icon]) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
                  leftTab === tab
                    ? 'border-tv-accent text-tv-text'
                    : 'border-transparent text-tv-muted hover:text-tv-text'
                )}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === 'fivestar' ? (
              <DataTable<FiveStarStock>
                columns={fiveStarColumns}
                data={fiveStarData}
                isLoading={fiveStarLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            ) : (
              <DataTable<SignalStock>
                columns={signalColumns}
                data={leftData}
                isLoading={leftLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 tv-card flex flex-col min-h-0">
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-tv-border shrink-0">
            {([
              ['hot', '熱門成交', <Flame size={12} />],
              ['foreign', '外資買超', <Building2 size={12} />],
              ['trust', '投信買超', <Building2 size={12} />],
              ['margin', '融資異動', <AlertTriangle size={12} />],
            ] as [RightTab, string, React.ReactNode][]).map(([tab, label, icon]) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
                  rightTab === tab
                    ? 'border-tv-accent text-tv-text'
                    : 'border-transparent text-tv-muted hover:text-tv-text'
                )}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'hot' && (
              <DataTable<HotStock>
                columns={hotColumns}
                data={hotStocks}
                isLoading={hotLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'foreign' && (
              <DataTable<InstitutionalStock>
                columns={institutionalColumns}
                data={foreignData}
                isLoading={foreignLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'trust' && (
              <DataTable<InstitutionalStock>
                columns={institutionalColumns}
                data={trustData}
                isLoading={trustLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'margin' && (
              <DataTable<MarginAlert>
                columns={marginColumns}
                data={marginData}
                isLoading={marginLoading}
                rowKey={(r) => r.stock_id}
                onRowClick={(r) => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
