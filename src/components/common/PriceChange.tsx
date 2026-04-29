import clsx from 'clsx'
import { fmtPct } from '../../utils/formatters'

interface PriceChangeProps {
  value: number | null | undefined
  showArrow?: boolean
  className?: string
}

export default function PriceChange({ value, showArrow = true, className }: PriceChangeProps) {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className={clsx('text-tv-muted', className)}>-</span>
  }

  const isUp = value > 0
  const isDown = value < 0

  return (
    <span
      className={clsx(
        'font-mono',
        isUp ? 'price-up' : isDown ? 'price-down' : 'price-neutral',
        className
      )}
    >
      {showArrow && (
        <span className="mr-0.5">
          {isUp ? '▲' : isDown ? '▼' : '─'}
        </span>
      )}
      {fmtPct(Math.abs(value))}
    </span>
  )
}
