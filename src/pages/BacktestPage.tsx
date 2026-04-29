import { useState } from 'react'
import clsx from 'clsx'
import { FlaskConical, TrendingUp, TrendingDown, BarChart2, Trophy } from 'lucide-react'
import { useBacktest, BacktestParams } from '../hooks/useBacktest'
import DataTable, { Column } from '../components/common/DataTable'
import { fmt, fmtPct, fmtDate } from '../utils/formatters'
import type { BacktestTrade } from '../types/api'

const STRATEGIES = [
  { value: 'A', label: '策略 A - 法人+MACD' },
  { value: 'B', label: '策略 B - 軋空布局' },
  { value: 'C', label: '策略 C - 營收法人' },
  { value: 'D', label: '策略 D - 量能突破' },
  { value: 'E', label: '策略 E - KD超賣' },
  { value: 'F', label: '策略 F - 財報強勢' },
]

const HOLD_DAYS = [3, 5, 10, 15, 20]

function getDefaultStartDate() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().split('T')[0]
}

function StatCard({ label, value, sub, color, icon }: {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="tv-card p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-tv-muted">{label}</span>
        {icon && <span className="text-tv-muted opacity-60">{icon}</span>}
      </div>
      <span className={clsx('text-lg font-bold font-mono', color || 'text-tv-text')}>{value}</span>
      {sub && <span className="text-[10px] text-tv-muted">{sub}</span>}
    </div>
  )
}

const tradeColumns: Column<BacktestTrade>[] = [
  { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
  { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
  { key: 'signal_date', header: '訊號日', render: (r) => <span className="font-mono text-tv-muted text-[11px]">{r.signal_date}</span> },
  { key: 'entry_date', header: '進場日', render: (r) => <span className="font-mono text-[11px]">{r.entry_date}</span> },
  { key: 'entry_price', header: '進場價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.entry_price)}</span> },
  { key: 'exit_date', header: '出場日', render: (r) => <span className="font-mono text-[11px]">{r.exit_date}</span> },
  { key: 'exit_price', header: '出場價', align: 'right', render: (r) => <span className="font-mono">{fmt(r.exit_price)}</span> },
  {
    key: 'return', header: '報酬率', align: 'right',
    render: (r) => (
      <span className={clsx('font-mono font-semibold', r.return_pct >= 0 ? 'price-up' : 'price-down')}>
        {r.return_pct >= 0 ? '+' : ''}{r.return_pct?.toFixed(2)}%
      </span>
    ),
  },
  {
    key: 'win', header: '勝負', align: 'center',
    render: (r) => r.win
      ? <span className="bg-up price-up text-[10px] px-1.5 py-0.5 rounded">獲利</span>
      : <span className="bg-[rgba(38,166,154,0.15)] price-down text-[10px] px-1.5 py-0.5 rounded">虧損</span>,
  },
]

export default function BacktestPage() {
  const [strategy, setStrategy] = useState('A')
  const [holdDays, setHoldDays] = useState(5)
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [params, setParams] = useState<BacktestParams | null>(null)

  const { data, isLoading } = useBacktest(params)

  const handleRun = () => {
    setParams({ strategy, hold_days: holdDays, start_date: startDate })
  }

  const winRate = data?.win_rate ?? 0
  const sortedTrades = data?.trades ? [...data.trades].sort((a, b) => b.return_pct - a.return_pct) : []

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <FlaskConical size={15} className="text-tv-accent" />
        <h2 className="text-sm font-semibold text-tv-text">策略回測</h2>
      </div>

      {/* Controls */}
      <div className="tv-card p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-tv-muted">選擇策略</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="tv-input min-w-[180px] bg-tv-bg"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-tv-muted">持有天數</label>
          <div className="flex gap-1">
            {HOLD_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setHoldDays(d)}
                className={clsx(
                  'px-3 py-1.5 rounded text-xs font-mono transition-colors',
                  holdDays === d ? 'bg-tv-accent text-white' : 'bg-tv-border text-tv-muted hover:text-tv-text'
                )}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-tv-muted">起始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="tv-input bg-tv-bg font-mono"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={isLoading}
          className={clsx(
            'tv-btn-primary flex items-center gap-2',
            isLoading ? 'opacity-60 cursor-not-allowed' : ''
          )}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              計算中...
            </>
          ) : (
            <>
              <FlaskConical size={13} />
              執行回測
            </>
          )}
        </button>
      </div>

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="勝率"
              value={`${(winRate * 100).toFixed(1)}%`}
              sub={`${data.completed_trades} 筆完成交易`}
              color={winRate >= 0.6 ? 'price-up' : winRate >= 0.45 ? 'text-tv-warn' : 'price-down'}
              icon={<Trophy size={14} />}
            />
            <StatCard
              label="平均報酬率"
              value={`${data.avg_return >= 0 ? '+' : ''}${data.avg_return?.toFixed(2)}%`}
              sub={`中位數 ${data.median_return?.toFixed(2)}%`}
              color={data.avg_return >= 0 ? 'price-up' : 'price-down'}
              icon={<TrendingUp size={14} />}
            />
            <StatCard
              label="最大獲利 / 最大虧損"
              value={`+${data.max_win?.toFixed(2)}%`}
              sub={`最大虧損 ${data.max_loss?.toFixed(2)}%`}
              color="price-up"
              icon={<BarChart2 size={14} />}
            />
            <StatCard
              label="獲利因子"
              value={data.profit_factor?.toFixed(2)}
              sub={`訊號 ${data.total_signals} 筆`}
              color={data.profit_factor >= 1.5 ? 'price-up' : data.profit_factor >= 1 ? 'text-tv-warn' : 'price-down'}
              icon={<TrendingDown size={14} />}
            />
          </div>

          {/* Win rate bar */}
          <div className="tv-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-tv-muted">勝率分布</span>
              <span className="text-xs text-tv-text font-mono">
                勝 {Math.round(winRate * data.completed_trades)} / 敗 {Math.round((1 - winRate) * data.completed_trades)}
              </span>
            </div>
            <div className="h-4 bg-tv-border rounded overflow-hidden flex">
              <div
                className="h-full bg-tv-up transition-all duration-500"
                style={{ width: `${winRate * 100}%` }}
              />
              <div
                className="h-full bg-tv-down transition-all duration-500"
                style={{ width: `${(1 - winRate) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[10px]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 bg-tv-up rounded" />獲利</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 bg-tv-down rounded" />虧損</div>
            </div>
          </div>

          {/* Trade list */}
          <div className="tv-card flex-1 flex flex-col min-h-0">
            <div className="px-4 pt-3 pb-2 border-b border-tv-border shrink-0">
              <span className="text-xs font-semibold text-tv-text">交易明細</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <DataTable<BacktestTrade>
                columns={tradeColumns}
                data={sortedTrades}
                rowKey={(r) => `${r.stock_id}-${r.signal_date}`}
                maxHeight="100%"
              />
            </div>
          </div>
        </>
      )}

      {!data && !isLoading && (
        <div className="tv-card flex-1 flex items-center justify-center">
          <div className="text-center">
            <FlaskConical size={40} className="text-tv-border mx-auto mb-3" />
            <p className="text-tv-muted text-sm">選擇策略與參數後點擊「執行回測」</p>
          </div>
        </div>
      )}
    </div>
  )
}
