import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface MarketBreadth {
  trade_date: string
  advancing: number
  declining: number
  unchanged: number
  total: number
  limit_up: number
  limit_down: number
  advance_decline_ratio: number
}

export function useMarketBreadth() {
  return useQuery<MarketBreadth>({
    queryKey: ['market-breadth'],
    queryFn: async () => {
      const { data } = await apiClient.get<MarketBreadth>('/api/market-breadth')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
