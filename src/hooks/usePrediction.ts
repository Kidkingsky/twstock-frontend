import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { PredictionStock, MacroIndicators } from '../types/api'

export function usePredictionTop(opts?: { minScore?: number; signal?: string; limit?: number }) {
  const params = {
    limit: opts?.limit ?? 50,
    min_score: opts?.minScore ?? 55,
    ...(opts?.signal ? { signal: opts.signal } : {}),
  }
  return useQuery<PredictionStock[]>({
    queryKey: ['prediction-top', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PredictionStock[]>('/api/prediction/top', { params })
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function usePredictionStock(stockId: string | null) {
  return useQuery({
    queryKey: ['prediction-stock', stockId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/prediction/stock/${stockId}`)
      return data
    },
    enabled: !!stockId,
    staleTime: 5 * 60_000,
  })
}

export function useMacroIndicators() {
  return useQuery<MacroIndicators>({
    queryKey: ['macro-indicators'],
    queryFn: async () => {
      const { data } = await apiClient.get<MacroIndicators>('/api/prediction/macro')
      return data
    },
    staleTime: 30 * 60_000,
  })
}
