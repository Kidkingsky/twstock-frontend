import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { FiveStarStock } from '../types/api'

export function useFiveStar() {
  return useQuery<FiveStarStock[]>({
    queryKey: ['five-star'],
    queryFn: async () => {
      const { data } = await apiClient.get<FiveStarStock[]>('/api/five-star')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
