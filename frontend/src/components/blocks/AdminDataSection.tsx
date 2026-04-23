import type { ReactNode } from 'react'
import { DataTable, type DataTableColumn } from '../ui/DataTable'
import { Panel } from '../ui/Panel'

interface AdminDataSectionProps<T> {
  title: string
  description: string
  eyebrow: string
  rows: T[]
  columns: Array<DataTableColumn<T>>
  getRowKey: (row: T) => string | number
  loading: boolean
  error: string | null
  emptyMessage: string
  toolbar?: ReactNode
}

export function AdminDataSection<T>({
  title,
  description,
  eyebrow,
  rows,
  columns,
  getRowKey,
  loading,
  error,
  emptyMessage,
  toolbar,
}: AdminDataSectionProps<T>) {
  let content: ReactNode

  if (loading) {
    content = (
      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <div className="mb-4 flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-sky-200">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" aria-hidden="true" />
          Loading records
        </div>
        <div className="space-y-3 motion-safe:animate-pulse">
          <div className="h-12 rounded-2xl bg-slate-800" />
          <div className="h-12 rounded-2xl bg-slate-800" />
          <div className="h-12 rounded-2xl bg-slate-800" />
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/5 p-6 text-slate-300">
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-200/80">Request failed</p>
        <p className="mt-3 text-base leading-7 text-slate-200">{error}</p>
      </div>
    )
  } else if (!rows.length) {
    content = (
      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">No records</p>
        <p className="mt-3 text-base leading-7 text-slate-300">{emptyMessage}</p>
      </div>
    )
  } else {
    content = <DataTable columns={columns} rows={rows} getRowKey={getRowKey} />
  }

  return (
    <Panel className="p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">{eyebrow}</p>
          <h3 className="text-3xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
        </div>
        {toolbar}
      </div>
      <div className="mt-6">{content}</div>
    </Panel>
  )
}
