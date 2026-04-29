import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { MultiSignalStock } from '../types/api'

export function useMultiSignal() {
  return useQuery<MultiSignalStock[]>({
    queryKey: ['multi-signal'],
    queryFn: async () => {
      const { data } = await apiClient.get<MultiSignalStock[]>('/api/multi-signal')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
