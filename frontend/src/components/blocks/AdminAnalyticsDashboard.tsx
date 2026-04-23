import { Panel } from '../ui/Panel'
import type { AuditLog, CallSession } from '../../lib/types'

interface AdminAnalyticsDashboardProps {
  companyCount: number
  verifiedNumberCount: number
  callReasonCount: number
  callSessionCount: number
  auditLogCount: number
  callSessions: CallSession[]
  auditLogs: AuditLog[]
}

interface MetricCardProps {
  label: string
  value: string | number
  detail: string
}

interface BreakdownItemProps {
  label: string
  value: number
  total: number
  tone?: 'sky' | 'emerald' | 'amber' | 'rose'
}

const toneClasses = {
  sky: 'bg-sky-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
}

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="rounded-[26px] border border-slate-700/70 bg-slate-900/90 p-5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

function InsightCard({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 p-5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

function BreakdownItem({ label, value, total, tone = 'sky' }: BreakdownItemProps) {
  const width = total > 0 ? Math.max((value / total) * 100, value > 0 ? 8 : 0) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-400">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${toneClasses[tone]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/70 p-5">
      <p className="text-sm font-medium text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

function formatTimestamp(value?: string) {
  if (!value) return 'No activity yet'
  return new Date(value).toLocaleString()
}

export function AdminAnalyticsDashboard({
  companyCount,
  verifiedNumberCount,
  callReasonCount,
  callSessionCount,
  auditLogCount,
  callSessions,
  auditLogs,
}: AdminAnalyticsDashboardProps) {
  const highRiskCount = callSessions.filter((session) => session.risk_level === 'high').length
  const lowRiskCount = callSessions.filter((session) => session.risk_level === 'low').length
  const mediumRiskCount = callSessions.filter((session) => session.risk_level === 'medium').length
  const averageTrustScore =
    callSessions.length > 0 ? Math.round(callSessions.reduce((sum, session) => sum + session.trust_score, 0) / callSessions.length) : 0

  const mostRecentAudit = auditLogs[0]
  const mostRecentCallSession = callSessions[0]

  const auditEventCounts = auditLogs.reduce<Record<string, number>>((accumulator, log) => {
    accumulator[log.event_type] = (accumulator[log.event_type] ?? 0) + 1
    return accumulator
  }, {})

  const sortedAuditEventCounts = Object.entries(auditEventCounts).sort((left, right) => right[1] - left[1]).slice(0, 6)

  const recentActivity = [
    ...auditLogs.slice(0, 4).map((log) => ({
      id: `audit-${log.id}`,
      type: 'Audit event',
      title: log.event_type,
      detail: log.message,
      timestamp: log.created_at,
    })),
    ...callSessions.slice(0, 4).map((session) => ({
      id: `session-${session.id}`,
      type: 'Call session',
      title: session.company_name || session.phone_number,
      detail: `${session.risk_level} risk · trust score ${session.trust_score}`,
      timestamp: session.created_at,
    })),
  ]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 6)

  return (
    <section className="space-y-6">
      <Panel glow className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/12 via-transparent to-transparent" />
        <div className="relative space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Operations dashboard</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Read the platform at a glance.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              These metrics are derived from the same live datasets already used by the admin, so the overview stays current without extra backend complexity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Companies" value={companyCount} detail="Registered organizations currently tracked by the platform." />
            <MetricCard label="Verified Numbers" value={verifiedNumberCount} detail="Trusted phone numbers available for matching and call card lookup." />
            <MetricCard label="Call Reasons" value={callReasonCount} detail="Operational reasons currently linked to company workflows." />
            <MetricCard label="Call Sessions" value={callSessionCount} detail="Captured call-session records created through lookup or admin actions." />
            <MetricCard label="Audit Logs" value={auditLogCount} detail="Recorded product events for traceability and operational review." />
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Operational signals</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MetricCard label="High-risk sessions" value={highRiskCount} detail="Sessions currently classified as high risk." />
            <MetricCard label="Low-risk sessions" value={lowRiskCount} detail="Sessions currently classified as low risk." />
            <MetricCard label="Average trust score" value={callSessions.length ? `${averageTrustScore}/100` : 'No data'} detail="Average across all recorded call sessions." />
            <MetricCard label="Medium-risk sessions" value={mediumRiskCount} detail="Sessions currently classified as medium risk." />
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Latest activity</p>
          <div className="mt-6 space-y-4">
            {mostRecentAudit ? (
              <InsightCard
                label="Most recent audit event"
                title={mostRecentAudit.event_type}
                detail={`${mostRecentAudit.message} · ${formatTimestamp(mostRecentAudit.created_at)}`}
              />
            ) : (
              <EmptyState title="No audit events yet" detail="Audit records will appear here once admin or product write paths generate them." />
            )}

            {mostRecentCallSession ? (
              <InsightCard
                label="Most recent call session"
                title={mostRecentCallSession.company_name || mostRecentCallSession.phone_number}
                detail={`${mostRecentCallSession.risk_level} risk · trust score ${mostRecentCallSession.trust_score} · ${formatTimestamp(
                  mostRecentCallSession.created_at
                )}`}
              />
            ) : (
              <EmptyState title="No call sessions yet" detail="Call-session activity will appear once the product starts recording lookups or admin session entries." />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Call sessions by risk</p>
          <div className="mt-6 space-y-4">
            <BreakdownItem label="High risk" value={highRiskCount} total={callSessionCount} tone="rose" />
            <BreakdownItem label="Medium risk" value={mediumRiskCount} total={callSessionCount} tone="amber" />
            <BreakdownItem label="Low risk" value={lowRiskCount} total={callSessionCount} tone="emerald" />
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Audit events by type</p>
          <div className="scroll-fade-shell mt-6 overflow-hidden rounded-[22px]">
            <div
              className="premium-scrollbar max-h-[24rem] space-y-4 overflow-y-auto pr-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
              tabIndex={0}
            >
              {sortedAuditEventCounts.length ? (
                sortedAuditEventCounts.map(([eventType, count]) => (
                  <BreakdownItem key={eventType} label={eventType} value={count} total={auditLogCount} tone="sky" />
                ))
              ) : (
                <EmptyState title="No audit-event breakdown yet" detail="Event-type distribution appears after the first audit records are written." />
              )}
            </div>
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Recent activity</p>
          <div className="scroll-fade-shell mt-6 overflow-hidden rounded-[22px]">
            <div
              className="premium-scrollbar max-h-[30rem] space-y-4 overflow-y-auto pr-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-500/40"
              tabIndex={0}
            >
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-slate-700/70 bg-slate-950/75 p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{item.type}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                    <p className="mt-3 text-xs text-slate-500">{formatTimestamp(item.timestamp)}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No recent activity" detail="The dashboard will surface the latest audit and call-session activity once data starts flowing." />
              )}
            </div>
          </div>
        </Panel>
      </div>
    </section>
  )
}
