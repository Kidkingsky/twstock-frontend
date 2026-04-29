import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { BacktestResponse } from '../types/api'

export interface BacktestParams {
  strategy: string
  hold_days: number
  start_date: string
}

export function useBacktest(params: BacktestParams | null) {
  return useQuery<BacktestResponse>({
    queryKey: ['backtest', params],
    queryFn: async () => {
      const { data } = await apiClient.get<BacktestResponse>('/api/backtest', {
        params: params!,
      })
      return data
    },
    enabled: !!params,
    staleTime: 300_000,
  })
}
