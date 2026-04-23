import type { CallCardData } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface CallCardProps {
  data: CallCardData
}

const riskSummaries: Record<'low' | 'medium' | 'high' | 'unknown', string> = {
  low: 'Lower-risk caller with strong verification signals.',
  medium: 'Use caution. Signals are mixed and require scrutiny.',
  high: 'High-risk caller profile — proceed carefully.',
  unknown: 'Risk level is not available for this caller.',
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-emerald-400'
  if (score >= 45) return 'bg-amber-400'
  return 'bg-rose-400'
}

function trustLabel(score: number) {
  if (score >= 75) return 'Higher trust'
  if (score >= 45) return 'Moderate trust'
  return 'Lower trust'
}

export function CallCard({ data }: CallCardProps) {
  const safeScore = Math.max(0, Math.min(100, data.trust_score ?? 0))

  return (
    <article className="rounded-[28px] border border-slate-700/70 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Caller profile</p>
          <div>
            <h2 className="text-3xl font-semibold text-white">{data.company_name ?? 'Unknown caller'}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {data.phone_number ?? '—'} · {data.label ?? 'No label provided'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge level={data.risk_level} className="text-sm">
            {data.risk_level ? `${data.risk_level} risk` : 'unknown risk'}
          </Badge>
          <span
            className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] ring-1 ${
              data.verified
                ? 'bg-slate-900/90 text-slate-300 ring-slate-700/70'
                : 'bg-slate-900/60 text-slate-500 ring-slate-700/60'
            }`}
          >
            {data.verified ? 'Verified caller' : 'Unverified'}
          </span>
        </div>
      </div>

      <div className="mb-8 rounded-[28px] border border-slate-700/70 bg-slate-950/80 p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="text-sm uppercase tracking-[0.28em] text-slate-500">Trust score</div>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-semibold text-white">{data.trust_score ?? '-'}</p>
              <span className="text-sm uppercase tracking-[0.24em] text-slate-400">/100</span>
            </div>
            <p className="text-sm leading-6 text-slate-400">Higher scores indicate stronger trust in the caller profile and verification signals.</p>
          </div>

          <div className="rounded-[24px] bg-slate-950/90 p-4 text-right">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Risk summary</p>
            <p className="mt-2 text-2xl font-semibold text-white">{data.risk_level ?? 'unknown'}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{riskSummaries[data.risk_level ?? 'unknown']}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full rounded-full transition-[width] duration-300 ${scoreColor(safeScore)}`} style={{ width: `${safeScore}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
            <span>Lower trust</span>
            <span>Higher trust</span>
          </div>
          <p className="text-sm text-slate-400">{trustLabel(safeScore)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/80 p-5">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Lookup count</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.lookup_count ?? '-'}</p>
        </div>
        <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/80 p-5">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Spam reports</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.spam_reports ?? '-'}</p>
        </div>
        <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/80 p-5">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Recommendation</p>
          <p className="mt-3 text-2xl font-semibold text-white">{data.recommendation ?? 'Review'}</p>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-700/70 bg-slate-950/80 px-6 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Reason</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{data.reason_title ?? 'No reason available'}</h3>
          </div>
          <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-400 ring-1 ring-slate-700/70">
            {data.priority ?? 'Normal priority'}
          </span>
        </div>
        <p className="mt-5 max-w-3xl leading-7 text-slate-300">{data.reason_description ?? 'No details were provided for this caller.'}</p>
      </div>
    </article>
  )
}
