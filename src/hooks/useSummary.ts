import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { SummaryResponse } from '../types/api'

export function useSummary() {
  return useQuery<SummaryResponse>({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<SummaryResponse>('/api/summary')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
