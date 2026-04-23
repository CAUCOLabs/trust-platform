import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  rows: T[]
  getRowKey: (row: T) => string | number
  maxHeightClassName?: string
}

export function DataTable<T>({ columns, rows, getRowKey, maxHeightClassName }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-hidden rounded-[28px] border border-slate-700/70 bg-slate-950/70', maxHeightClassName && 'scroll-fade-shell')}>
      <div
        className={cn('premium-scrollbar overflow-auto focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40', maxHeightClassName)}
        tabIndex={0}
      >
        <table className="min-w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-slate-500 ${column.className ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-t border-slate-800/90">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 align-top text-sm text-slate-200 ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
