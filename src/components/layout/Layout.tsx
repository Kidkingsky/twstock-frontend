import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import StockModal from '../common/StockModal'

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
          <Outlet context={{ openStock: (id: string) => setSelectedStockId(id) }} />
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
