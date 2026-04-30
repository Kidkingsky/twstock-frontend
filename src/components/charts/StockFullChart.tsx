import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type LogicalRange,
} from 'lightweight-charts'
import type { KlineBar } from '../../types/api'

interface Props {
  data: KlineBar[]
}

const CHART_BG   = '#1e222d'
const GRID_COLOR = '#2a2e39'
const TEXT_COLOR = '#787b86'

function baseOpts(height: number) {
  return {
    layout: {
      background: { type: ColorType.Solid, color: CHART_BG },
      textColor:  TEXT_COLOR,
      fontSize:   10,
      fontFamily: 'Consolas, monospace',
    },
    grid: {
      vertLines: { color: GRID_COLOR, style: LineStyle.Dotted },
      horzLines: { color: GRID_COLOR, style: LineStyle.Dotted },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: '#787b86', style: LineStyle.Dashed, labelBackgroundColor: '#2a2e39' },
      horzLine: { color: '#787b86', style: LineStyle.Dashed, labelBackgroundColor: '#2a2e39' },
    },
    rightPriceScale: { borderColor: GRID_COLOR, textColor: TEXT_COLOR },
    timeScale: {
      borderColor:    GRID_COLOR,
      timeVisible:    false,
      secondsVisible: false,
      tickMarkFormatter: (time: unknown) => {
        const s = String(time)
        const p = s.split('-')
        if (p.length === 3) return `${parseInt(p[1])}/${parseInt(p[2])}`
        const d = new Date(Number(time) * 1000)
        return `${d.getMonth() + 1}/${d.getDate()}`
      },
    },
    handleScale:  { mouseWheel: true, pinch: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
    height,
    width: 0,
  }
}

export default function StockFullChart({ data }: Props) {
  const mainRef = useRef<HTMLDivElement>(null)
  const volRef  = useRef<HTMLDivElement>(null)
  const macdRef = useRef<HTMLDivElement>(null)
  const rsiRef  = useRef<HTMLDivElement>(null)

  const chartsRef = useRef<IChartApi[]>([])
  const seriesRef = useRef<{
    candle:  ISeriesApi<'Candlestick'>
    ma5:     ISeriesApi<'Line'>
    ma20:    ISeriesApi<'Line'>
    ma60:    ISeriesApi<'Line'>
    vol:     ISeriesApi<'Histogram'>
    macdBar: ISeriesApi<'Histogram'>
    dif:     ISeriesApi<'Line'>
    dea:     ISeriesApi<'Line'>
    rsi:     ISeriesApi<'Line'>
  } | null>(null)

  // ── 建立圖表 ──────────────────────────────────────────────
  useEffect(() => {
    if (!mainRef.current || !volRef.current || !macdRef.current || !rsiRef.current) return

    const mainChart = createChart(mainRef.current,  { ...baseOpts(300) })
    const volChart  = createChart(volRef.current,   { ...baseOpts(80), rightPriceScale: { borderColor: GRID_COLOR, textColor: TEXT_COLOR, scaleMargins: { top: 0.1, bottom: 0 } } })
    const macdChart = createChart(macdRef.current,  { ...baseOpts(90) })
    const rsiChart  = createChart(rsiRef.current,   { ...baseOpts(80) })

    chartsRef.current = [mainChart, volChart, macdChart, rsiChart]

    // ── 主圖：K線 + MA ─────────────────────────────
    const candle = mainChart.addCandlestickSeries({
      upColor: '#ef5350', downColor: '#26a69a',
      borderUpColor: '#ef5350', borderDownColor: '#26a69a',
      wickUpColor: '#ef5350', wickDownColor: '#26a69a',
    })
    const ma5  = mainChart.addLineSeries({ color: '#f59e0b',  lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const ma20 = mainChart.addLineSeries({ color: '#2962ff',  lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    const ma60 = mainChart.addLineSeries({ color: '#ff9800',  lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })

    // ── 成交量 ─────────────────────────────────────
    const vol = volChart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'right',
    })
    volChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } })

    // ── MACD ───────────────────────────────────────
    const macdBar = macdChart.addHistogramSeries({ color: '#26a69a', priceScaleId: 'right' })
    const dif     = macdChart.addLineSeries({ color: '#2962ff', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const dea     = macdChart.addLineSeries({ color: '#ff9800', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    // ── RSI ────────────────────────────────────────
    const rsi = rsiChart.addLineSeries({ color: '#e91e63', lineWidth: 1, priceLineVisible: false })
    // overbought / oversold lines
    rsiChart.addLineSeries({ color: '#ef535050', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      .setData([])   // will be set with data

    seriesRef.current = { candle, ma5, ma20, ma60, vol, macdBar, dif, dea, rsi }

    // ── 同步時間軸縮放 ─────────────────────────────
    const allCharts = [mainChart, volChart, macdChart, rsiChart]
    allCharts.forEach((src, si) => {
      src.timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
        if (!range) return
        allCharts.forEach((dst, di) => {
          if (di !== si) dst.timeScale().setVisibleLogicalRange(range)
        })
      })
    })

    // ── ResizeObserver（主容器）────────────────────
    const resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      chartsRef.current.forEach((c) => c.applyOptions({ width: w }))
    })
    if (mainRef.current.parentElement) resizeObserver.observe(mainRef.current.parentElement)

    return () => {
      resizeObserver.disconnect()
      chartsRef.current.forEach((c) => c.remove())
      chartsRef.current = []
      seriesRef.current = null
    }
  }, [])

  // ── 更新資料 ──────────────────────────────────────────────
  useEffect(() => {
    if (!data?.length || !seriesRef.current) return
    const s = seriesRef.current

    const sorted = [...data].sort((a, b) => a.trade_date.localeCompare(b.trade_date))
    const toTime = (d: KlineBar) => d.trade_date as unknown as Time

    s.candle.setData(sorted.map((d) => ({
      time: toTime(d), open: d.open, high: d.high, low: d.low, close: d.close,
    })))

    s.ma5.setData(sorted.filter((d) => d.ma5  > 0).map((d) => ({ time: toTime(d), value: d.ma5  })))
    s.ma20.setData(sorted.filter((d) => d.ma20 > 0).map((d) => ({ time: toTime(d), value: d.ma20 })))
    s.ma60.setData(sorted.filter((d) => d.ma60 > 0).map((d) => ({ time: toTime(d), value: d.ma60 })))

    s.vol.setData(sorted.map((d) => ({
      time: toTime(d),
      value: d.volume,
      color: d.close >= d.open ? '#ef535060' : '#26a69a60',
    })))

    s.macdBar.setData(sorted.filter((d) => d.macd_bar != null).map((d) => ({
      time:  toTime(d),
      value: d.macd_bar,
      color: d.macd_bar >= 0 ? '#ef535080' : '#26a69a80',
    })))
    s.dif.setData(sorted.filter((d) => d.dif != null).map((d) => ({ time: toTime(d), value: d.dif })))
    s.dea.setData(sorted.filter((d) => d.dea != null).map((d) => ({ time: toTime(d), value: d.dea })))

    s.rsi.setData(sorted.filter((d) => d.rsi14 != null).map((d) => ({ time: toTime(d), value: d.rsi14 })))

    chartsRef.current[0]?.timeScale().fitContent()
  }, [data])

  const legendRow = (color: string, label: string) => (
    <span className="flex items-center gap-1 text-[10px] text-tv-muted">
      <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
  )

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* 主圖 */}
      <div className="flex items-center gap-3 px-2 pt-2 pb-1">
        {legendRow('#f59e0b', 'MA5')}
        {legendRow('#2962ff', 'MA20')}
        {legendRow('#ff9800', 'MA60')}
      </div>
      <div ref={mainRef} className="w-full" />

      {/* 成交量 */}
      <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
        <span className="text-[10px] text-tv-muted">成交量</span>
      </div>
      <div ref={volRef} className="w-full" />

      {/* MACD */}
      <div className="flex items-center gap-3 px-2 pt-1 pb-0.5">
        <span className="text-[10px] text-tv-muted">MACD</span>
        {legendRow('#2962ff', 'DIF')}
        {legendRow('#ff9800', 'DEA')}
      </div>
      <div ref={macdRef} className="w-full" />

      {/* RSI */}
      <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
        <span className="text-[10px] text-tv-muted">RSI(14)</span>
      </div>
      <div ref={rsiRef} className="w-full" />
    </div>
  )
}
