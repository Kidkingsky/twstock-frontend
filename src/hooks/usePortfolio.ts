import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface TradeOrder {
  id: number
  trade_date: string
  stock_id: string
  stock_name: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee: number
  tax: number
  amount: number
  account: string | null
  strategy_tag: string | null
  note: string | null
}

export interface OpenPosition {
  stock_id: string
  stock_name: string
  quantity: number
  avg_cost: number
  total_cost: number
  current_price: number
  current_value: number
  unrealized_pnl: number
  unrealized_pct: number
}

export interface RealizedTrade {
  stock_id: string
  stock_name: string
  qty: number
  buy_price: number
  sell_price: number
  pnl: number
  trade_date: string
}

export interface MonthlyPnl {
  month: string
  pnl: number
}

export interface PortfolioSummary {
  total_invested: number
  total_current: number
  realized_pnl: number
  unrealized_pnl: number
  total_pnl: number
  total_pnl_pct: number
  open_count: number
  closed_count: number
}

export interface PortfolioData {
  summary: PortfolioSummary
  open_positions: OpenPosition[]
  realized_trades: RealizedTrade[]
  monthly_pnl: MonthlyPnl[]
}

export function usePortfolioSummary() {
  return useQuery<PortfolioData>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<PortfolioData>('/api/portfolio/summary')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function usePortfolioOrders() {
  return useQuery<TradeOrder[]>({
    queryKey: ['portfolio-orders'],
    queryFn: async () => {
      const { data } = await apiClient.get<TradeOrder[]>('/api/portfolio/orders')
      return data
    },
    staleTime: 60_000,
  })
}
