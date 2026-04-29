import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { BrokerTopStock } from '../types/api'

export function useBrokerTop() {
  return useQuery<BrokerTopStock[]>({
    queryKey: ['broker-top'],
    queryFn: async () => {
      const { data } = await apiClient.get<BrokerTopStock[]>('/api/broker-top')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
