import { useState, Component, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import StockModal from '../common/StockModal'

class PageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-tv-muted">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm">頁面載入失敗</p>
          <p className="text-xs font-mono text-tv-down">{(this.state.error as Error).message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-xs px-3 py-1 rounded bg-tv-border hover:bg-tv-border/70 text-tv-text transition-colors"
          >重新載入</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Layout() {
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-tv-bg text-tv-text">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onStockSelect={(id) => setSelectedStockId(id)}
        />

        <main className="flex-1 overflow-auto p-3 sm:p-4">
          <PageErrorBoundary>
            <Outlet context={{ openStock: (id: string) => setSelectedStockId(id) }} />
          </PageErrorBoundary>
        </main>
      </div>

      {selectedStockId && (
        <StockModal
          stockId={selectedStockId}
          onClose={() => setSelectedStockId(null)}
        />
      )}
    </div>
  )
}
