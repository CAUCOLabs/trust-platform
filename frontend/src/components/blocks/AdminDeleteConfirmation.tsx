import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

interface AdminDeleteConfirmationProps {
  title: string
  description: string
  warning?: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  error: string | null
}

export function AdminDeleteConfirmation({
  title,
  description,
  warning,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  error,
}: AdminDeleteConfirmationProps) {
  return (
    <Panel className="border-rose-500/20 bg-slate-950/95 p-6 sm:p-8">
      <p className="text-sm uppercase tracking-[0.32em] text-rose-200/80">Delete record</p>
      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
      {warning ? (
        <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="danger" onClick={onConfirm} loading={loading} loadingLabel="Deleting..." className="sm:w-auto">
          {confirmLabel}
        </Button>
        <Button type="button" onClick={onCancel} disabled={loading} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
          Cancel
        </Button>
      </div>
    </Panel>
  )
}
