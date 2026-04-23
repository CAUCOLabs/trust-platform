import type { ReactNode } from 'react'
import { Panel } from '../ui/Panel'

interface AdminOverviewProps {
  companyCount: number
  verifiedNumberCount: number
  callReasonCount: number
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

export function AdminOverview({ companyCount, verifiedNumberCount, callReasonCount }: AdminOverviewProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel glow className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/12 via-transparent to-transparent" />
        <div className="relative space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Internal admin dashboard</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Live record inspection in the same premium workspace.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              This view reads directly from the existing backend endpoints and keeps the public lookup journey separate.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Companies" value={companyCount} detail="Registered company profiles available through the backend." />
            <StatCard label="Verified Numbers" value={verifiedNumberCount} detail="Trusted phone numbers linked to companies." />
            <StatCard label="Call Reasons" value={callReasonCount} detail="Operational reason records currently exposed by the API." />
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin notes</p>
        <div className="mt-5 grid gap-3">
          <SidebarItem label="Mode" value="Read-only v1" />
          <SidebarItem label="Data source" value="Live backend fetches from localhost:8080" />
          <SidebarItem label="Scope" value="Companies, verified numbers, and call reasons" />
        </div>
      </Panel>
    </section>
  )
}
