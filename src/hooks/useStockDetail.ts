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
