import { useParams, useNavigate } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import clsx from 'clsx'
import { useStrategy, StrategyCode } from '../hooks/useStrategy'
import DataTable, { Column } from '../components/common/DataTable'
import PriceChange from '../components/common/PriceChange'
import { fmt, fmtVol, priceColor } from '../utils/formatters'
import type {
  StrategyStock,
  StrategyNotesA,
  StrategyNotesB,
  StrategyNotesC,
  StrategyNotesD,
  StrategyNotesE,
  StrategyNotesF,
} from '../types/api'

interface OutletContext { openStock: (id: string) => void }

const strategyMeta: Record<StrategyCode, { label: string; desc: string }> = {
  A: { label: '策略 A', desc: '法人買超 + MACD翻紅 + RSI低檔' },
  B: { label: '策略 B', desc: '空單部位高 + 外資回補 + 近MA20' },
  C: { label: '策略 C', desc: '月營收年增 + 投信加碼 + 外資進場' },
  D: { label: '策略 D', desc: '爆量突破 + RSI強勢 + 急漲初段' },
  E: { label: '策略 E', desc: 'KD超賣回升 + RSI低檔黃金交叉' },
  F: { label: '策略 F', desc: 'EPS年增 + 高毛利率 + 法人加碼' },
}

function NotesCell({ notes, code }: { notes: StrategyStock['notes']; code: StrategyCode }) {
  if (code === 'A') {
    const n = notes as StrategyNotesA
    return (
      <div className="flex flex-col gap-0.5">
        <span className={clsx('text-[10px] font-mono', priceColor(n.foreign_net))}>外:{n.foreign_net >= 0 ? '+' : ''}{n.foreign_net}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.investment_trust_net))}>投:{n.investment_trust_net >= 0 ? '+' : ''}{n.investment_trust_net}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.macd_bar))}>MACD:{n.macd_bar?.toFixed(3)}</span>
        <span className="text-[10px] font-mono text-tv-muted">RSI:{n.rsi14?.toFixed(1)}</span>
      </div>
    )
  }
  if (code === 'B') {
    const n = notes as StrategyNotesB
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-mono text-tv-muted">空單:{n.short_balance?.toLocaleString()}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.short_change))}>空變:{n.short_change >= 0 ? '+' : ''}{n.short_change}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.foreign_net))}>外:{n.foreign_net >= 0 ? '+' : ''}{n.foreign_net}</span>
        <span className="text-[10px] font-mono text-[#2962ff]">MA20:{fmt(n.ma20)}</span>
      </div>
    )
  }
  if (code === 'C') {
    const n = notes as StrategyNotesC
    return (
      <div className="flex flex-col gap-0.5">
        <span className={clsx('text-[10px] font-mono', priceColor(n.revenue_yoy))}>年增:{n.revenue_yoy >= 0 ? '+' : ''}{n.revenue_yoy?.toFixed(1)}%</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.revenue_mom))}>月增:{n.revenue_mom >= 0 ? '+' : ''}{n.revenue_mom?.toFixed(1)}%</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.investment_trust_net))}>投:{n.investment_trust_net >= 0 ? '+' : ''}{n.investment_trust_net}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.foreign_net))}>外:{n.foreign_net >= 0 ? '+' : ''}{n.foreign_net}</span>
      </div>
    )
  }
  if (code === 'D') {
    const n = notes as StrategyNotesD
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-mono text-tv-text">量:{fmtVol(n.volume)}</span>
        <span className="text-[10px] font-mono text-tv-muted">均量:{fmtVol(n.avg_vol_20)}</span>
        <span className={clsx('text-[10px] font-mono', n.rsi14 >= 70 ? 'price-up' : 'text-tv-text')}>RSI:{n.rsi14?.toFixed(1)}</span>
        <PriceChange value={n.change_pct} className="text-[10px]" />
      </div>
    )
  }
  if (code === 'E') {
    const n = notes as StrategyNotesE
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-mono text-tv-text">K:{n.k_value?.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-tv-muted">D:{n.d_value?.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-tv-text">RSI14:{n.rsi14?.toFixed(1)}</span>
        <span className="text-[10px] font-mono text-tv-muted">RSI6:{n.rsi6?.toFixed(1)}</span>
      </div>
    )
  }
  if (code === 'F') {
    const n = notes as StrategyNotesF
    return (
      <div className="flex flex-col gap-0.5">
        <span className={clsx('text-[10px] font-mono', priceColor(n.eps_yoy_pct))}>EPS年增:{n.eps_yoy_pct >= 0 ? '+' : ''}{n.eps_yoy_pct?.toFixed(1)}%</span>
        <span className="text-[10px] font-mono text-tv-text">毛利:{n.gross_margin?.toFixed(1)}%</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.foreign_net))}>外:{n.foreign_net >= 0 ? '+' : ''}{n.foreign_net}</span>
        <span className={clsx('text-[10px] font-mono', priceColor(n.investment_trust_net))}>投:{n.investment_trust_net >= 0 ? '+' : ''}{n.investment_trust_net}</span>
      </div>
    )
  }
  return null
}

function makeColumns(code: StrategyCode): Column<StrategyStock>[] {
  return [
    { key: 'rank', header: '#', width: '36px', render: (_, i) => <span className="text-tv-muted font-mono">{i + 1}</span> },
    { key: 'id', header: '代號', width: '70px', render: (r) => <span className="text-tv-accent font-mono">{r.stock_id}</span> },
    { key: 'name', header: '名稱', render: (r) => <span className="text-tv-text">{r.stock_name}</span> },
    { key: 'close', header: '收盤', align: 'right', render: (r) => <span className="font-mono">{fmt(r.close)}</span> },
    { key: 'vol', header: '量', align: 'right', render: (r) => <span className="font-mono text-tv-muted">{fmtVol(r.volume)}</span> },
    {
      key: 'score', header: '分數', align: 'right',
      render: (r) => (
        <span className={clsx(
          'font-mono font-semibold text-xs',
          r.score >= 80 ? 'price-up' : r.score >= 60 ? 'text-tv-warn' : 'text-tv-text'
        )}>
          {r.score}
        </span>
      ),
    },
    {
      key: 'notes', header: '策略指標', width: '160px',
      render: (r) => <NotesCell notes={r.notes} code={code} />,
    },
  ]
}

const validCodes: StrategyCode[] = ['A', 'B', 'C', 'D', 'E', 'F']

export default function StrategyPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { openStock } = useOutletContext<OutletContext>()

  const activeCode = (validCodes.includes(code as StrategyCode) ? code : 'A') as StrategyCode
  const { data, isLoading } = useStrategy(activeCode)
  const meta = strategyMeta[activeCode]

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-tv-text">{meta.label}</h2>
          <p className="text-[11px] text-tv-muted mt-0.5">{meta.desc}</p>
        </div>
        <span className="text-[11px] text-tv-muted">{data?.length ?? 0} 筆</span>
      </div>

      <div className="tv-card flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-tv-border shrink-0">
          {validCodes.map((c) => (
            <button
              key={c}
              onClick={() => navigate(`/strategy/${c}`)}
              className={clsx(
                'px-3 py-2 text-xs border-b-2 transition-colors -mb-px font-mono',
                activeCode === c ? 'border-tv-accent text-tv-text' : 'border-transparent text-tv-muted hover:text-tv-text'
              )}
            >
              策略{c}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <DataTable<StrategyStock>
            columns={makeColumns(activeCode)}
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
