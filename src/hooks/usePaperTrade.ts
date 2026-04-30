import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface PaperTrade {
  id: number
  stock_id: string
  stock_name: string
  entry_date: string
  entry_price: number
  ai_score: number | null
  timing_score: number | null
  signal: string | null
  hold_days: number
  exit_date: string | null
  exit_price: number | null
  return_pct: number | null
  status: 'open' | 'closed'
  note: string | null
  current_price: number
  current_return: number
  due_date: string | null
}

export interface SignalStats {
  count: number
  win_rate: number | null
  avg_return: number | null
  median_return: number | null
  best: number | null
  worst: number | null
}

export interface PaperPerformance {
  total: number
  evaluable: number
  open: number
  by_signal: Record<string, SignalStats>
  by_timing: Record<string, SignalStats>
  all_trades: PaperTrade[]
}

export function usePaperTrades() {
  return useQuery<PaperTrade[]>({
    queryKey: ['paper-trades'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/paper-trades')
      return data
    },
    refetchInterval: 60_000,
  })
}

export function usePaperPerformance() {
  return useQuery<PaperPerformance>({
    queryKey: ['paper-performance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/paper-trades/performance')
      return data
    },
    refetchInterval: 60_000,
  })
}

export interface AddPaperTradeInput {
  stock_id: string
  entry_price: number
  ai_score?: number
  timing_score?: number
  signal?: string
  hold_days?: number
  note?: string
}

export function useAddPaperTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddPaperTradeInput) => {
      const { data } = await apiClient.post('/api/paper-trade', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper-trades'] })
      qc.invalidateQueries({ queryKey: ['paper-performance'] })
    },
  })
}

export function useClosePaperTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, price }: { id: number; price?: number }) => {
      const params = price ? `?price=${price}` : ''
      const { data } = await apiClient.post(`/api/paper-trade/${id}/close${params}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper-trades'] })
      qc.invalidateQueries({ queryKey: ['paper-performance'] })
    },
  })
}

export function useDeletePaperTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/api/paper-trade/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper-trades'] })
      qc.invalidateQueries({ queryKey: ['paper-performance'] })
    },
  })
}
