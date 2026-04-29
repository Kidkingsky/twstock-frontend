import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { StrategyStock } from '../types/api'

export type StrategyCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export function useStrategy(code: StrategyCode) {
  return useQuery<StrategyStock[]>({
    queryKey: ['strategy', code],
    queryFn: async () => {
      const { data } = await apiClient.get<StrategyStock[]>(`/api/strategy/${code}`)
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !!code,
  })
}
