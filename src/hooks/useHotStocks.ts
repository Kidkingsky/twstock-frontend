import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { HotStock } from '../types/api'

export function useHotStocks(limit = 30) {
  return useQuery<HotStock[]>({
    queryKey: ['hot-stocks', limit],
    queryFn: async () => {
      const { data } = await apiClient.get<HotStock[]>('/api/hot-stocks', {
        params: { limit },
      })
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
