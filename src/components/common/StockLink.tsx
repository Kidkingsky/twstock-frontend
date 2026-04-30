import { useNavigate } from 'react-router-dom'

interface StockLinkProps {
  id: string
  name?: string
  /** 'id' = 只顯示代號 | 'name' = 只顯示名稱 | 'both' = 代號 + 名稱 */
  show?: 'id' | 'name' | 'both'
  className?: string
}

/**
 * 可點擊的股票代號/名稱，點擊後跳轉到 /stock/:id 詳情頁。
 */
export default function StockLink({ id, name, show = 'id', className }: StockLinkProps) {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()   // 避免觸發父層 onRowClick
    navigate(`/stock/${id}`)
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as unknown as React.MouseEvent)}
      className={
        className ??
        'text-tv-accent font-mono font-semibold hover:underline cursor-pointer'
      }
    >
      {show === 'id'   && id}
      {show === 'name' && (name ?? id)}
      {show === 'both' && (
        <span className="flex items-center gap-1.5">
          <span>{id}</span>
          {name && <span className="text-tv-text font-normal font-sans">{name}</span>}
        </span>
      )}
    </span>
  )
}
