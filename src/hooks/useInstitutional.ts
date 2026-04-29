import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { InstitutionalStock } from '../types/api'

export type InstitutionalSort = 'foreign' | 'investment_trust' | 'dealer' | 'total'

export function useInstitutional(limit = 30, sort: InstitutionalSort = 'foreign') {
  return useQuery<InstitutionalStock[]>({
    queryKey: ['institutional', limit, sort],
    queryFn: async () => {
      const { data } = await apiClient.get<InstitutionalStock[]>('/api/institutional', {
        params: { limit, sort },
      })
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
