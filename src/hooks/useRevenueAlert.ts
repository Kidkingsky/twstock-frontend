import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { RevenueAlertStock } from '../types/api'

export function useRevenueAlert() {
  return useQuery<RevenueAlertStock[]>({
    queryKey: ['revenue-alert'],
    queryFn: async () => {
      const { data } = await apiClient.get<RevenueAlertStock[]>('/api/revenue-alert')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
