import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { SignalStock } from '../types/api'

export type SignalType = 'bullish' | 'rebound'

export function useSignals(signal_type: SignalType = 'bullish', limit = 50) {
  return useQuery<SignalStock[]>({
    queryKey: ['signals', signal_type, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<SignalStock[]>('/api/signals', {
        params: { signal_type, limit },
      })
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
