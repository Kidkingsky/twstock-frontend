import { ReactNode } from 'react'
import clsx from 'clsx'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | undefined
  isLoading?: boolean
  skeletonRows?: number
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
  emptyText?: string
  className?: string
  maxHeight?: string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="skeleton h-3.5 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  skeletonRows = 8,
  onRowClick,
  rowKey,
  emptyText = '暫無資料',
  className,
  maxHeight,
}: DataTableProps<T>) {
  return (
    <div
      className={clsx('overflow-x-auto overflow-y-auto rounded-md', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="min-w-full border-collapse text-xs md:w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-tv-card border-b border-tv-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-2 py-2 text-tv-muted font-medium whitespace-nowrap sm:px-3',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.width ? `w-[${col.width}]` : ''
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : !data || data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-tv-muted">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-tv-border/50 transition-colors duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-tv-border/40' : ''
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-2 py-2 text-tv-text whitespace-nowrap sm:px-3',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
