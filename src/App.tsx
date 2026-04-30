import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import SignalsPage from './pages/SignalsPage'
import HotStocksPage from './pages/HotStocksPage'
import InstitutionalPage from './pages/InstitutionalPage'
import FiveStarPage from './pages/FiveStarPage'
import StrategyPage from './pages/StrategyPage'
import MultiSignalPage from './pages/MultiSignalPage'
import RevenueAlertPage from './pages/RevenueAlertPage'
import ShortSqueezePage from './pages/ShortSqueezePage'
import GovBankPage from './pages/GovBankPage'
import BrokerTopPage from './pages/BrokerTopPage'
import MarginAlertPage from './pages/MarginAlertPage'
import BacktestPage from './pages/BacktestPage'
import PredictionPage from './pages/PredictionPage'
import PortfolioPage from './pages/PortfolioPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
    },
  },
})

function PageFallback() {
  return (
    <div className="flex flex-col gap-3 p-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-8 rounded" />
      ))}
      <div className="tv-card p-0 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-2 border-b border-tv-border/40">
            <div className="skeleton h-3.5 w-14 rounded" />
            <div className="skeleton h-3.5 w-24 rounded" />
            <div className="skeleton h-3.5 w-16 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={
              <Suspense fallback={<PageFallback />}>
                <DashboardPage />
              </Suspense>
            } />
            <Route path="signals" element={
              <Suspense fallback={<PageFallback />}>
                <SignalsPage />
              </Suspense>
            } />
            <Route path="hot" element={
              <Suspense fallback={<PageFallback />}>
                <HotStocksPage />
              </Suspense>
            } />
            <Route path="institutional" element={
              <Suspense fallback={<PageFallback />}>
                <InstitutionalPage />
              </Suspense>
            } />
            <Route path="five-star" element={
              <Suspense fallback={<PageFallback />}>
                <FiveStarPage />
              </Suspense>
            } />
            <Route path="strategy" element={<Navigate to="/strategy/A" replace />} />
            <Route path="strategy/:code" element={
              <Suspense fallback={<PageFallback />}>
                <StrategyPage />
              </Suspense>
            } />
            <Route path="multi-signal" element={
              <Suspense fallback={<PageFallback />}>
                <MultiSignalPage />
              </Suspense>
            } />
            <Route path="revenue" element={
              <Suspense fallback={<PageFallback />}>
                <RevenueAlertPage />
              </Suspense>
            } />
            <Route path="short-squeeze" element={
              <Suspense fallback={<PageFallback />}>
                <ShortSqueezePage />
              </Suspense>
            } />
            <Route path="gov-bank" element={
              <Suspense fallback={<PageFallback />}>
                <GovBankPage />
              </Suspense>
            } />
            <Route path="broker" element={
              <Suspense fallback={<PageFallback />}>
                <BrokerTopPage />
              </Suspense>
            } />
            <Route path="margin" element={
              <Suspense fallback={<PageFallback />}>
                <MarginAlertPage />
              </Suspense>
            } />
            <Route path="backtest" element={
              <Suspense fallback={<PageFallback />}>
                <BacktestPage />
              </Suspense>
            } />
            <Route path="prediction" element={
              <Suspense fallback={<PageFallback />}>
                <PredictionPage />
              </Suspense>
            } />
            <Route path="portfolio" element={
              <Suspense fallback={<PageFallback />}>
                <PortfolioPage />
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
