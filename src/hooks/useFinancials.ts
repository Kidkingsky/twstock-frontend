import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { FinancialQuarter } from '../types/api'

export function useFinancials(stockId: string | null) {
  return useQuery<FinancialQuarter[]>({
    queryKey: ['financials', stockId],
    queryFn: async () => {
      const { data } = await apiClient.get<FinancialQuarter[]>(`/api/financials/${stockId}`)
      return data
    },
    enabled: !!stockId,
    staleTime: 300_000,
  })
}
