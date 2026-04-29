/**
 * Format a number as a price string (e.g., 123.45)
 */
export function fmt(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a percentage value (e.g., +1.23% or -1.23%)
 */
export function fmtPct(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format volume with K/M/B suffix
 */
export function fmtVol(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`
  return `${sign}${abs.toLocaleString()}`
}

/**
 * Format institutional net buy/sell in lots (張) or billions
 */
export function fmtLots(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : '+'
  if (abs >= 10_000) return `${sign}${(abs / 10_000).toFixed(1)}萬`
  return `${sign}${abs.toLocaleString()}`
}

/**
 * Returns the CSS class for a price/change value
 * Taiwan market: red = up, green = down
 */
export function priceColor(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'text-tv-muted'
  if (value > 0) return 'price-up'
  if (value < 0) return 'price-down'
  return 'price-neutral'
}

/**
 * Returns the background CSS class for a price/change value
 */
export function priceBg(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return ''
  if (value > 0) return 'bg-up'
  if (value < 0) return 'bg-down'
  return ''
}

/**
 * Format date string to locale display
 */
export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return dateStr
  }
}

/**
 * Format revenue in millions TWD
 */
export function fmtRevenue(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}億`
  if (Math.abs(value) >= 10_000) return `${(value / 10_000).toFixed(0)}萬`
  return value.toLocaleString()
}
