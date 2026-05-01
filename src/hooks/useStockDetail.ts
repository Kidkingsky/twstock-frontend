import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { StockDetailResponse } from '../types/api'

export function useStockDetail(stockId: string | null, days = 120) {
  return useQuery<StockDetailResponse>({
    queryKey: ['stock-detail', stockId, days],
    queryFn: async () => {
      const { data } = await apiClient.get<StockDetailResponse>(
        `/api/stock/${stockId}`,
        { params: { days } }
      )
      return data
    },
    enabled: !!stockId,
    staleTime: 60_000,
  })
}

export interface AIAnalysisResponse {
  analysis: string
  enabled: boolean
  cached: boolean
  stock_name?: string
}

export function useStockAIAnalysis(stockId: string | null) {
  return useQuery<AIAnalysisResponse>({
    queryKey: ['stock-ai-analysis', stockId],
    queryFn: async () => {
      const { data } = await apiClient.get<AIAnalysisResponse>(
        `/api/stock/${stockId}/ai-analysis`
      )
      return data
    },
    enabled: false,          // 只在手動觸發時執行
    staleTime: 30 * 60_000,  // 快取 30 分鐘
    retry: 1,
  })
}
