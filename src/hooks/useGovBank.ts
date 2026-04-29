import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { GovBankStock } from '../types/api'

export function useGovBank() {
  return useQuery<GovBankStock[]>({
    queryKey: ['gov-bank'],
    queryFn: async () => {
      const { data } = await apiClient.get<GovBankStock[]>('/api/gov-bank')
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
