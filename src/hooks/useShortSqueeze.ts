import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { ShortSqueezeStock } from '../types/api'

export function useShortSqueeze() {
  return useQuery<ShortSqueezeStock[]>({
    queryKey: ['short-squeeze'],
    queryFn: async () => {
      const { data } = await apiClient.get<ShortSqueezeStock[]>('/api/short-squeeze')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
