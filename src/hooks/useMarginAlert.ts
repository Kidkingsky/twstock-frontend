import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { MarginAlert } from '../types/api'

export function useMarginAlert() {
  return useQuery<MarginAlert[]>({
    queryKey: ['margin-alert'],
    queryFn: async () => {
      const { data } = await apiClient.get<MarginAlert[]>('/api/margin-alert')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
