import type { ReactNode } from 'react'
import { Panel } from '../ui/Panel'

interface AdminOverviewProps {
  companyCount: number
  verifiedNumberCount: number
  callReasonCount: number
  callSessionCount: number
  auditLogCount: number
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-[26px] border border-slate-700/70 bg-slate-900/90 p-5">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

function SidebarItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

export function AdminOverview({ companyCount, verifiedNumberCount, callReasonCount, callSessionCount, auditLogCount }: AdminOverviewProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel glow className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/12 via-transparent to-transparent" />
        <div className="relative space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Console overview</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Operate the trusted caller registry.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Manage the data that powers public lookup, then monitor sessions, changes, and platform activity from one protected console.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Companies" value={companyCount} detail="Organizations available for trusted caller matching." />
            <StatCard label="Verified Numbers" value={verifiedNumberCount} detail="Trusted phone numbers linked to companies." />
            <StatCard label="Call Reasons" value={callReasonCount} detail="Readable explanations for why a trusted caller may be calling." />
            <StatCard label="Call Sessions" value={callSessionCount} detail="Recent lookup and call activity captured by the platform." />
            <StatCard label="Audit Logs" value={auditLogCount} detail="Recent product operations recorded for traceability." />
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Console scope</p>
        <div className="mt-5 grid gap-3">
          <SidebarItem label="Surface" value="Protected admin console" />
          <SidebarItem label="Purpose" value="Operations, data management, sessions, audit, and analytics" />
          <SidebarItem label="Public app" value="Lookup remains available outside the console" />
        </div>
      </Panel>
    </section>
  )
}
