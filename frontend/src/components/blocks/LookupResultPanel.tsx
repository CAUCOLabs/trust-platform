import type { CallCardData, StatusType } from '../../lib/types'
import { CallCard } from './CallCard'

interface LookupResultPanelProps {
  loading: boolean
  notFound: boolean
  callCard: CallCardData | null
  status: string
  statusType: StatusType
}

export function LookupResultPanel({ loading, notFound, callCard, status, statusType }: LookupResultPanelProps) {
  return (
    <div className="rounded-[36px] border border-slate-700/60 bg-slate-950/80 p-8 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:p-10">
      <div className="mb-8 space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Result panel</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Caller trust card.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Lookup results stay focused on the caller, the risk level, and the safest next action.
        </p>
      </div>

      <div className="min-h-[28rem] transition-all duration-300">
        {loading ? (
          <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-10">
            <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-sky-200">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" aria-hidden="true" />
              Looking up
            </div>
            <div className="motion-safe:animate-pulse space-y-6">
              <div className="h-6 w-3/5 rounded-full bg-slate-800" />
              <div className="h-44 rounded-[28px] bg-slate-800" />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="h-24 rounded-[24px] bg-slate-800" />
                <div className="h-24 rounded-[24px] bg-slate-800" />
                <div className="h-24 rounded-[24px] bg-slate-800" />
              </div>
              <div className="h-32 rounded-[28px] bg-slate-800" />
            </div>
          </div>
        ) : statusType === 'error' ? (
          <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/5 p-10 text-slate-300 transition-all duration-300">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">Lookup error</p>
            <h3 className="mt-4 text-3xl font-semibold text-white">We couldn't load caller insights</h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{status}</p>
          </div>
        ) : notFound ? (
          <div className="rounded-[28px] border border-slate-700/70 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 p-10 text-slate-300 transition-all duration-300">
            <div className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              No verified record
            </div>
            <h3 className="mt-6 text-3xl font-semibold text-white">No caller profile is available yet</h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              No verified call record is currently available for this phone number. Continue with caution, or ask the caller to identify themselves.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-medium text-slate-100">No match in verified records</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Next step</p>
                <p className="mt-2 text-sm font-medium text-slate-100">Re-run lookup or verify the caller directly</p>
              </div>
            </div>
          </div>
        ) : callCard ? (
          <div className="transition-all duration-300">
            <CallCard data={callCard} />
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-10 text-slate-400 transition-all duration-300">
            <p className="text-lg leading-8">Enter a phone number and tap lookup to reveal verified caller insights.</p>
          </div>
        )}
      </div>
    </div>
  )
}
