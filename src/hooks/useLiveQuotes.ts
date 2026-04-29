import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { LiveQuotesResponse } from '../types/api'

export function useLiveQuotes(ids: string[]) {
  return useQuery<LiveQuotesResponse>({
    queryKey: ['live-quotes', ids.join(',')],
    queryFn: async () => {
      const { data } = await apiClient.get<LiveQuotesResponse>('/api/live-quotes', {
        params: { ids: ids.join(',') },
      })
      return data
    },
    refetchInterval: 10_000,
    staleTime: 8_000,
    enabled: ids.length > 0,
  })
}
