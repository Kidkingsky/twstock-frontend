import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import StockModal from '../common/StockModal'

export default function Layout() {
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-tv-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onStockSelect={(id) => setSelectedStockId(id)} />
        <main className="flex-1 overflow-auto p-4">
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
