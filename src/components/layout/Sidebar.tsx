import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Flame,
  Building2,
  Star,
  ScanLine,
  GitMerge,
  BarChart2,
  Scissors,
  Landmark,
  Users,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Zap,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: '大盤總覽', path: '/', icon: <LayoutDashboard size={16} /> },
  { label: 'AI 評分排行', path: '/prediction', icon: <Zap size={16} /> },
  { label: '偏多訊號', path: '/signals', icon: <TrendingUp size={16} /> },
  { label: '熱門成交', path: '/hot', icon: <Flame size={16} /> },
  { label: '三大法人', path: '/institutional', icon: <Building2 size={16} /> },
  { label: '五星訊號', path: '/five-star', icon: <Star size={16} /> },
  {
    label: '策略掃描',
    path: '/strategy',
    icon: <ScanLine size={16} />,
    children: [
      { label: '策略 A - 法人+MACD', path: '/strategy/A' },
      { label: '策略 B - 軋空布局', path: '/strategy/B' },
      { label: '策略 C - 營收法人', path: '/strategy/C' },
      { label: '策略 D - 量能突破', path: '/strategy/D' },
      { label: '策略 E - KD超賣', path: '/strategy/E' },
      { label: '策略 F - 財報強勢', path: '/strategy/F' },
    ],
  },
  { label: '多訊號共振', path: '/multi-signal', icon: <GitMerge size={16} /> },
  { label: '營收爆發', path: '/revenue', icon: <BarChart2 size={16} /> },
  { label: '軋空候選', path: '/short-squeeze', icon: <Scissors size={16} /> },
  { label: '官股護盤', path: '/gov-bank', icon: <Landmark size={16} /> },
  { label: '分點追蹤', path: '/broker', icon: <Users size={16} /> },
  { label: '融資警示', path: '/margin', icon: <AlertTriangle size={16} /> },
  { label: '策略回測', path: '/backtest', icon: <FlaskConical size={16} /> },
  { label: 'AI 模擬盤驗證', path: '/paper-trade', icon: <FlaskConical size={16} /> },
  { label: '我的投資組合', path: '/portfolio', icon: <Wallet size={16} /> },
]

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation()
  const [strategyOpen, setStrategyOpen] = useState(
    location.pathname.startsWith('/strategy')
  )

  return (
    <>
      <button
        type="button"
        aria-label="關閉側邊選單"
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex h-full w-[260px] max-w-[85vw] flex-col overflow-y-auto border-r border-tv-border bg-tv-card shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-[220px] md:min-w-[220px] md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 border-b border-tv-border px-4 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-tv-accent text-sm font-bold text-white">
            台
          </div>
          <span className="text-sm font-semibold tracking-wide text-tv-text">台股儀表板</span>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            if (item.children) {
              const isParentActive = location.pathname.startsWith('/strategy')
              return (
                <div key={item.path}>
                  <button
                    onClick={() => setStrategyOpen((v) => !v)}
                    className={clsx(
                      'flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100',
                      isParentActive
                        ? 'bg-tv-border text-tv-text'
                        : 'text-tv-muted hover:bg-tv-border/50 hover:text-tv-text'
                    )}
                  >
                    <span className="text-tv-muted">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {strategyOpen ? (
                      <ChevronDown size={12} className="text-tv-muted" />
                    ) : (
                      <ChevronRight size={12} className="text-tv-muted" />
                    )}
                  </button>

                  {strategyOpen && (
                    <div className="bg-tv-bg/40">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center py-2 pl-10 pr-4 text-xs transition-colors duration-100',
                              isActive
                                ? 'border-r-2 border-tv-accent bg-tv-accent/10 text-tv-accent'
                                : 'text-tv-muted hover:bg-tv-border/30 hover:text-tv-text'
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100',
                    isActive
                      ? 'border-r-2 border-tv-accent bg-tv-accent/10 text-tv-accent'
                      : 'text-tv-muted hover:bg-tv-border/50 hover:text-tv-text'
                  )
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-tv-border px-4 py-3">
          <p className="text-[10px] text-tv-muted">台股智能選股系統</p>
          <p className="text-[10px] text-tv-muted/60">v0.1.0</p>
        </div>
      </aside>
    </>
  )
}
