import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { TrendingUp, Activity, Star, Flame, Building2, AlertTriangle, Radio } from 'lucide-react'
import { useSummary } from '../hooks/useSummary'
import { useSignals } from '../hooks/useSignals'
import { useHotStocks } from '../hooks/useHotStocks'
import { useInstitutional } from '../hooks/useInstitutional'
import { useMarginAlert } from '../hooks/useMarginAlert'
import { useFiveStar } from '../hooks/useFiveStar'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { useMarketBreadth } from '../hooks/useMarketBreadth'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, fmtPct, priceColor } from '../utils/formatters'
import type { SignalStock, HotStock, InstitutionalStock, MarginAlert, FiveStarStock, LiveQuote } from '../types/api'

interface OutletContext { openStock: (id: string) => void }
type LeftTab = 'bullish' | 'rebound' | 'fivestar'
type RightTab = 'hot' | 'foreign' | 'trust' | 'margin'

// ── 即時價格指示器 ────────────────────────────────────────────────
function LiveDot({ isLive }: { isLive: boolean }) {
  if (!isLive) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] text-tv-up font-mono ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-tv-up animate-pulse" />
      LIVE
    </span>
  )
}

// ── 價格單元（優先顯示即時，次顯示歷史）────────────────────────────
function LivePrice({ stockId, fallback, liveMap, isMarketOpen }: {
  stockId: string
  fallback: number | null
  liveMap: Record<string, LiveQuote>
  isMarketOpen: boolean
}) {
  const live = liveMap[stockId]
  const price = live?.price ?? fallback
  const isLive = !!live?.price && isMarketOpen

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center">
        <span className="font-mono text-xs text-tv-text">{fmt(price)}</span>
        <LiveDot isLive={isLive} />
      </div>
      {live?.change_pct != null && isMarketOpen && (
        <span className={clsx('text-[10px] font-mono', priceColor(live.change_pct))}>
          {live.change_pct >= 0 ? '+' : ''}{live.change_pct.toFixed(2)}%
        </span>
      )}
    </div>
  )
}

// ── 大盤廣度條 ────────────────────────────────────────────────────
function BreadthBar({ advancing, declining, unchanged }: {
  advancing: number; declining: number; unchanged: number
}) {
  const total = advancing + declining + unchanged || 1
  const advPct = (advancing / total) * 100
  const decPct = (declining / total) * 100
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden flex">
      <div className="h-full bg-tv-up" style={{ width: `${advPct}%` }} />
      <div className="h-full bg-tv-muted" style={{ width: `${100 - advPct - decPct}%` }} />
      <div className="h-full bg-tv-down" style={{ width: `${decPct}%` }} />
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, extra }: {
  label: string; value: string; sub?: string; color?: string
  icon?: React.ReactNode; extra?: React.ReactNode
}) {
  return (
    <div className="tv-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-tv-muted">{label}</span>
        {icon && <span className="text-tv-muted opacity-60">{icon}</span>}
      </div>
      <span className={clsx('text-xl font-bold font-mono', color || 'text-tv-text')}>{value}</span>
      {sub && <span className="text-[10px] text-tv-muted">{sub}</span>}
      {extra}
    </div>
  )
}

export default function DashboardPage() {
  const { openStock } = useOutletContext<OutletContext>()
  const { data: summary, isLoading: summaryLoading } = useSummary()
  const { data: breadth } = useMarketBreadth()
  const [leftTab, setLeftTab] = useState<LeftTab>('bullish')
  const [rightTab, setRightTab] = useState<RightTab>('hot')

  const { data: bullishSignals, isLoading: bullishLoading } = useSignals('bullish')
  const { data: reboundSignals, isLoading: reboundLoading } = useSignals('rebound')
  const { data: fiveStarData, isLoading: fiveStarLoading } = useFiveStar()
  const { data: hotStocks, isLoading: hotLoading } = useHotStocks()
  const { data: foreignData, isLoading: foreignLoading } = useInstitutional(30, 'foreign')
  const { data: trustData, isLoading: trustLoading } = useInstitutional(30, 'investment_trust')
  const { data: marginData, isLoading: marginLoading } = useMarginAlert()

  const isMarketOpen = summary?.market_open ?? false

  // ── 收集所有可見股票 ID，送給 live-quotes ─────────────────────
  const allIds = useMemo(() => {
    const ids = new Set<string>()
    ;[bullishSignals, reboundSignals, fiveStarData, hotStocks, foreignData, trustData, marginData]
      .forEach(arr => arr?.forEach((r: { stock_id: string }) => ids.add(r.stock_id)))
    return Array.from(ids).slice(0, 100)
  }, [bullishSignals, reboundSignals, fiveStarData, hotStocks, foreignData, trustData, marginData])

  const { data: liveData } = useLiveQuotes(allIds)
  const liveMap: Record<string, LiveQuote> = useMemo(() => liveData ?? {}, [liveData])

  // ── 注入即時價格的資料 ─────────────────────────────────────────
  const enhanceWithLive = <T extends { stock_id: string; close: number; change_pct?: number }>(
    arr: T[] | undefined
  ): T[] => {
    if (!arr) return []
    return arr.map(item => {
      const live = liveMap[item.stock_id]
      if (!live || !isMarketOpen) return item
      return {
        ...item,
        close: live.price ?? item.close,
        change_pct: live.change_pct ?? item.change_pct,
      }
    })
  }

  // ── Column definitions (close-over liveMap) ───────────────────
  const liveCell = (r: { stock_id: string; close: number }) => (
    <LivePrice stockId={r.stock_id} fallback={r.close} liveMap={liveMap} isMarketOpen={isMarketOpen} />
  )

  const signalColumns: Column<SignalStock>[] = [
    { key: 'id',    header: '代號', width: '60px', render: r => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name',  header: '名稱',               render: r => <span className="text-tv-text text-xs">{r.stock_name}</span> },
    { key: 'close', header: '即時/收盤', align: 'right', render: liveCell },
    { key: 'tech',  header: '技術', align: 'right',
      render: r => (
        <div className="flex flex-col items-end gap-0.5">
          <span className={clsx('text-[10px] font-mono', r.macd_bar > 0 ? 'price-up' : 'price-down')}>MACD:{r.macd_bar > 0 ? '+' : ''}{r.macd_bar?.toFixed(2)}</span>
          <span className="text-[10px] text-tv-muted font-mono">RSI:{r.rsi14?.toFixed(1)}</span>
        </div>
      ),
    },
    { key: 'vol', header: '量', align: 'right', render: r => <span className="text-tv-muted font-mono text-xs">{fmtVol(r.volume)}</span> },
  ]

  const fiveStarColumns: Column<FiveStarStock>[] = [
    { key: 'id',    header: '代號', width: '60px', render: r => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name',  header: '名稱',               render: r => <span className="text-tv-text text-xs">{r.stock_name}</span> },
    { key: 'close', header: '即時/收盤', align: 'right', render: liveCell },
    { key: 'chip',  header: '法人', align: 'right',
      render: r => (
        <div className="flex flex-col items-end gap-0.5">
          <span className={clsx('text-[10px] font-mono', priceColor(r.foreign_net))}>外:{r.foreign_net >= 0 ? '+' : ''}{r.foreign_net}</span>
          <span className={clsx('text-[10px] font-mono', priceColor(r.investment_trust_net))}>投:{r.investment_trust_net >= 0 ? '+' : ''}{r.investment_trust_net}</span>
        </div>
      ),
    },
    { key: 'rsi', header: 'RSI', align: 'right', render: r => <span className="text-tv-muted font-mono text-xs">{r.rsi14?.toFixed(1)}</span> },
  ]

  const hotColumns: Column<HotStock>[] = [
    { key: 'id',    header: '代號', width: '60px', render: r => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name',  header: '名稱',               render: r => <span className="text-tv-text text-xs">{r.stock_name}</span> },
    { key: 'close', header: '即時/收盤', align: 'right', render: liveCell },
    { key: 'chg',   header: '漲跌%', align: 'right',
      render: r => {
        const live = liveMap[r.stock_id]
        const chg = (isMarketOpen && live?.change_pct != null) ? live.change_pct : r.change_pct
        return <PriceChange value={chg} />
      },
    },
    { key: 'vol', header: '成交量', align: 'right', render: r => <span className="text-tv-muted font-mono text-xs">{fmtVol(r.volume)}</span> },
  ]

  const institutionalColumns: Column<InstitutionalStock>[] = [
    { key: 'id',    header: '代號', width: '60px', render: r => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name',  header: '名稱',               render: r => <span className="text-tv-text text-xs">{r.stock_name}</span> },
    { key: 'close', header: '即時/收盤', align: 'right', render: liveCell },
    { key: 'chg',   header: '漲跌%', align: 'right',
      render: r => {
        const live = liveMap[r.stock_id]
        const chg = (isMarketOpen && live?.change_pct != null) ? live.change_pct : r.change_pct
        return <PriceChange value={chg} />
      },
    },
    { key: 'net', header: '外資/投信', align: 'right',
      render: r => (
        <div className="flex flex-col items-end gap-0.5">
          <span className={clsx('text-[10px] font-mono', priceColor(r.foreign_net))}>{r.foreign_net >= 0 ? '+' : ''}{r.foreign_net.toLocaleString()}</span>
          <span className={clsx('text-[10px] font-mono', priceColor(r.investment_trust_net))}>{r.investment_trust_net >= 0 ? '+' : ''}{r.investment_trust_net.toLocaleString()}</span>
        </div>
      ),
    },
  ]

  const marginColumns: Column<MarginAlert>[] = [
    { key: 'id',    header: '代號', width: '60px', render: r => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name',  header: '名稱',               render: r => <span className="text-tv-text text-xs">{r.stock_name}</span> },
    { key: 'close', header: '即時/收盤', align: 'right', render: liveCell },
    { key: 'margin', header: '融資餘額', align: 'right',
      render: r => <span className="font-mono text-xs text-tv-text">{r.margin_balance.toLocaleString()}</span>,
    },
    { key: 'change', header: '變動', align: 'right',
      render: r => (
        <span className={clsx('font-mono text-xs', priceColor(r.margin_change))}>
          {r.margin_change >= 0 ? '+' : ''}{r.margin_change.toLocaleString()}
        </span>
      ),
    },
  ]

  // ── Derived values ────────────────────────────────────────────
  const taiex = summary?.taiex
  const taiexColor = taiex ? (taiex.change_pct > 0 ? 'text-tv-up' : taiex.change_pct < 0 ? 'text-tv-down' : 'text-tv-muted') : 'text-tv-text'

  const leftLoading = leftTab === 'bullish' ? bullishLoading : leftTab === 'rebound' ? reboundLoading : fiveStarLoading

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Live indicator banner */}
      {isMarketOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tv-up/10 border border-tv-up/20 rounded text-[11px] text-tv-up">
          <Radio size={12} className="animate-pulse" />
          <span>盤中即時模式 — 價格每 10 秒自動更新</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* TAIEX */}
        <StatCard
          label={`加權指數${isMarketOpen ? ' 🔴 LIVE' : ''}`}
          value={taiex ? fmt(taiex.close, 2) : '-'}
          sub={taiex ? `${fmtPct(taiex.change_pct)} 成交 ${fmtVol(taiex.volume)}` : undefined}
          color={taiexColor}
          icon={<Activity size={14} />}
        />
        {/* 偏多訊號 */}
        <StatCard
          label="偏多訊號"
          value={summaryLoading ? '-' : String(summary?.signals.bullish ?? 0)}
          sub="今日符合偏多條件"
          color="text-tv-up"
          icon={<TrendingUp size={14} />}
        />
        {/* 反彈訊號 */}
        <StatCard
          label="反彈訊號"
          value={summaryLoading ? '-' : String(summary?.signals.rebound ?? 0)}
          sub="今日短線反彈候選"
          color="text-tv-warn"
          icon={<Star size={14} />}
        />
        {/* 大盤廣度 */}
        <div className="tv-card p-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-tv-muted">大盤廣度</span>
            <Flame size={14} className="text-tv-muted opacity-60" />
          </div>
          {breadth ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-tv-up font-bold font-mono text-xl">{breadth.advancing}</span>
                <span className="text-tv-muted text-xs">/</span>
                <span className="text-tv-down font-bold font-mono text-xl">{breadth.declining}</span>
              </div>
              <BreadthBar advancing={breadth.advancing} declining={breadth.declining} unchanged={breadth.unchanged} />
              <div className="flex justify-between text-[9px] text-tv-muted mt-0.5">
                <span>漲停 <span className="text-tv-up font-mono">{breadth.limit_up}</span></span>
                <span>A/D比 <span className="font-mono">{breadth.advance_decline_ratio.toFixed(2)}</span></span>
                <span>跌停 <span className="text-tv-down font-mono">{breadth.limit_down}</span></span>
              </div>
            </>
          ) : (
            <span className="text-tv-muted text-sm">-</span>
          )}
        </div>
      </div>

      {/* Main panels */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
        {/* Left panel */}
        <div className="flex-1 tv-card flex flex-col min-h-0">
          <div className="flex flex-wrap items-center gap-1 border-b border-tv-border px-3 pb-0 pt-3 shrink-0 sm:px-4">
            {([
              ['bullish', '偏多訊號', <TrendingUp size={12} />],
              ['rebound', '短線反彈', <Activity size={12} />],
              ['fivestar', '五星訊號', <Star size={12} />],
            ] as [LeftTab, string, React.ReactNode][]).map(([tab, label, icon]) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={clsx(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-t px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
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
                data={enhanceWithLive(fiveStarData) as FiveStarStock[]}
                isLoading={fiveStarLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            ) : (
              <DataTable<SignalStock>
                columns={signalColumns}
                data={enhanceWithLive(leftTab === 'bullish' ? bullishSignals : reboundSignals) as SignalStock[]}
                isLoading={leftLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 tv-card flex flex-col min-h-0">
          <div className="flex flex-wrap items-center gap-1 border-b border-tv-border px-3 pb-0 pt-3 shrink-0 sm:px-4">
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
                  'flex items-center gap-1.5 whitespace-nowrap rounded-t px-3 py-2 text-xs border-b-2 transition-colors -mb-px',
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
                data={enhanceWithLive(hotStocks) as HotStock[]}
                isLoading={hotLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'foreign' && (
              <DataTable<InstitutionalStock>
                columns={institutionalColumns}
                data={enhanceWithLive(foreignData) as InstitutionalStock[]}
                isLoading={foreignLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'trust' && (
              <DataTable<InstitutionalStock>
                columns={institutionalColumns}
                data={enhanceWithLive(trustData) as InstitutionalStock[]}
                isLoading={trustLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
            {rightTab === 'margin' && (
              <DataTable<MarginAlert>
                columns={marginColumns}
                data={marginData}
                isLoading={marginLoading}
                rowKey={r => r.stock_id}
                onRowClick={r => openStock(r.stock_id)}
                maxHeight="100%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
