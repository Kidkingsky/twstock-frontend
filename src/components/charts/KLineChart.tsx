import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesOptions,
  type Time,
} from 'lightweight-charts'
import type { KlineBar } from '../../types/api'

interface KLineChartProps {
  data: KlineBar[]
  height?: number
}

export default function KLineChart({ data, height = 320 }: KLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#787b86',
        fontSize: 11,
        fontFamily: 'Consolas, Courier New, monospace',
      },
      grid: {
        vertLines: { color: '#2a2e39', style: LineStyle.Dotted },
        horzLines: { color: '#2a2e39', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#787b86', style: LineStyle.Dashed, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#787b86', style: LineStyle.Dashed, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        textColor: '#787b86',
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: false,
        secondsVisible: false,
        tickMarkFormatter: (time: unknown) => {
          // trade_date is "YYYY-MM-DD" string — parse directly, don't multiply
          const s = String(time)
          const parts = s.split('-')
          if (parts.length === 3) {
            return `${parseInt(parts[1])}/${parseInt(parts[2])}`
          }
          // fallback for unix timestamp
          const d = new Date(Number(time) * 1000)
          return `${d.getMonth() + 1}/${d.getDate()}`
        },
      },
      handleScale: { mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
    })

    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderUpColor: '#ef5350',
      borderDownColor: '#26a69a',
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    } as Partial<CandlestickSeriesOptions>)
    candleRef.current = candleSeries

    // MA20 (blue)
    const ma20Series = chart.addLineSeries({
      color: '#2962ff',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma20Ref.current = ma20Series

    // MA60 (orange)
    const ma60Series = chart.addLineSeries({
      color: '#ff9800',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma60Ref.current = ma60Series

    // ResizeObserver
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      chart.applyOptions({ width })
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // Update data
  useEffect(() => {
    if (!data || data.length === 0 || !candleRef.current) return

    const sorted = [...data].sort((a, b) => a.trade_date.localeCompare(b.trade_date))

    const candleData = sorted.map((d) => ({
      time: d.trade_date as unknown as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    const ma20Data = sorted
      .filter((d) => d.ma20 > 0)
      .map((d) => ({ time: d.trade_date as unknown as Time, value: d.ma20 }))

    const ma60Data = sorted
      .filter((d) => d.ma60 > 0)
      .map((d) => ({ time: d.trade_date as unknown as Time, value: d.ma60 }))

    candleRef.current.setData(candleData)
    ma20Ref.current?.setData(ma20Data)
    ma60Ref.current?.setData(ma60Data)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return (
    <div
      ref={containerRef}
      className="w-full tv-chart-container"
      style={{ height }}
    />
  )
}
