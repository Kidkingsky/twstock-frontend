import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import type { ValuationStock, ChipCleanStock, NewsSentimentResponse } from '../types/api'

export function useValuation(sort = 'dividend_yield', order = 'desc', limit = 120) {
  return useQuery<ValuationStock[]>({
    queryKey: ['valuation', sort, order, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/valuation', {
        params: { sort, order, limit },
      })
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function useChipClean(limit = 40) {
  return useQuery<ChipCleanStock[]>({
    queryKey: ['chip-clean', limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/chip-clean', { params: { limit } })
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export function useNewsSentiment(query = '台股 股市', limit = 15) {
  return useQuery<NewsSentimentResponse>({
    queryKey: ['news-sentiment', query, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/news-sentiment', {
        params: { query, limit },
      })
      return data
    },
    staleTime: 10 * 60_000,   // 新聞 10 分鐘 cache
  })
}
