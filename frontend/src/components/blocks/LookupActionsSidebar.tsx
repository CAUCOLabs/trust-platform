import type { CallCardData } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface LookupActionsSidebarProps {
  callCard: CallCardData | null
  loading: boolean
  reporting: boolean
  reportSuccess: boolean
  onLookup: () => Promise<void>
  onReportSpam: () => Promise<void>
}

export function LookupActionsSidebar({
  callCard,
  loading,
  reporting,
  reportSuccess,
  onLookup,
  onReportSpam,
}: LookupActionsSidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-5 rounded-[36px] border border-slate-700/60 bg-slate-950/80 p-8 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:p-10">
      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Risk summary</p>
            <p className="mt-2 text-xl font-semibold text-white">Premium signal visibility</p>
          </div>
          <Badge level={callCard?.risk_level} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Review the current risk signal alongside the caller recommendation before taking action.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Recommendation</p>
            <p className="mt-2 text-sm font-medium text-slate-100">{callCard?.recommendation ?? 'Lookup required'}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Priority</p>
            <p className="mt-2 text-sm font-medium text-slate-100">{callCard?.priority ?? 'Normal priority'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Actions</p>
        {reportSuccess ? (
          <div className="mt-4 rounded-2xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-slate-700/70" role="status" aria-live="polite">
            Spam report submitted. Refreshing caller data.
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          <Button onClick={onReportSpam} disabled={!callCard || loading} loading={reporting} loadingLabel="Reporting..." variant="danger" className="w-full">
            Report spam
          </Button>
          <Button onClick={onLookup} loading={loading} loadingLabel="Refreshing..." variant="primary" className="w-full">
            Refresh results
          </Button>
        </div>
      </div>
    </aside>
  )
}
