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
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

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
]

export default function Sidebar() {
  const location = useLocation()
  const [strategyOpen, setStrategyOpen] = useState(
    location.pathname.startsWith('/strategy')
  )

  return (
    <aside className="w-[220px] min-w-[220px] h-full bg-tv-card border-r border-tv-border flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-tv-border flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-tv-accent flex items-center justify-center text-white font-bold text-sm">
          台
        </div>
        <span className="font-semibold text-tv-text text-sm tracking-wide">台股儀表板</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          if (item.children) {
            const isParentActive = location.pathname.startsWith('/strategy')
            return (
              <div key={item.path}>
                <button
                  onClick={() => setStrategyOpen((v) => !v)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100',
                    isParentActive
                      ? 'text-tv-text bg-tv-border'
                      : 'text-tv-muted hover:text-tv-text hover:bg-tv-border/50'
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
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center pl-10 pr-4 py-1.5 text-xs transition-colors duration-100',
                            isActive
                              ? 'text-tv-accent bg-tv-accent/10 border-r-2 border-tv-accent'
                              : 'text-tv-muted hover:text-tv-text hover:bg-tv-border/30'
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
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-100',
                  isActive
                    ? 'text-tv-accent bg-tv-accent/10 border-r-2 border-tv-accent'
                    : 'text-tv-muted hover:text-tv-text hover:bg-tv-border/50'
                )
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-tv-border">
        <p className="text-[10px] text-tv-muted">台股智能選股系統</p>
        <p className="text-[10px] text-tv-muted/60">v0.1.0</p>
      </div>
    </aside>
  )
}
