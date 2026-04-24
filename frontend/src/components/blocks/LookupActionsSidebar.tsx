import type { CallCardData } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface LookupActionsSidebarProps {
  callCard: CallCardData | null
  loading: boolean
  reporting: boolean
  reportSuccess: boolean
  isLiveResult: boolean
  scenario: {
    eyebrow: string
    outcomeLabel: string
    meaning: string
    nextStep: string
  }
  onLookup: () => Promise<void>
  onReportSpam: () => Promise<void>
}

export function LookupActionsSidebar({
  callCard,
  loading,
  reporting,
  reportSuccess,
  isLiveResult,
  scenario,
  onLookup,
  onReportSpam,
}: LookupActionsSidebarProps) {
  return (
    <aside className="flex h-full flex-col gap-5 rounded-[36px] border border-slate-700/60 bg-slate-950/80 p-8 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:p-10">
      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{isLiveResult ? 'Live outcome guide' : 'Scenario guide'}</p>
            <p className="mt-2 text-xl font-semibold text-white">{isLiveResult ? 'Understand the current result' : scenario.eyebrow}</p>
          </div>
          <Badge level={callCard?.risk_level} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          {isLiveResult
            ? 'Review the current risk signal alongside the caller recommendation before taking action.'
            : 'Use the guided scenario to explain the result before asking the user to experiment on their own.'}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] leading-tight text-slate-500 whitespace-normal break-words">Outcome</p>
            <p className="mt-2 text-sm font-medium text-slate-100 break-words">{callCard?.recommendation ?? scenario.outcomeLabel}</p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] leading-tight text-slate-500 whitespace-normal break-words">Next step</p>
            <p className="mt-2 text-sm font-medium text-slate-100 break-words">{scenario.nextStep}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.18em] leading-tight text-slate-500 whitespace-normal break-words">Meaning</p>
          <p className="mt-2 text-sm leading-6 text-slate-300 break-words">{scenario.meaning}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Live registry actions</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Real lookup stays available. Spam reporting is only enabled after a live lookup returns a caller profile from the registry.
        </p>
        {reportSuccess ? (
          <div className="mt-4 rounded-2xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-slate-700/70" role="status" aria-live="polite">
            Spam report submitted. Refreshing caller data.
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          <Button
            onClick={onReportSpam}
            disabled={!isLiveResult || !callCard || loading}
            loading={reporting}
            loadingLabel="Reporting..."
            variant="danger"
            className="w-full"
          >
            Report spam
          </Button>
          <Button onClick={onLookup} loading={loading} loadingLabel="Refreshing..." variant="primary" className="w-full">
            Run live lookup
          </Button>
        </div>
      </div>
    </aside>
  )
}
