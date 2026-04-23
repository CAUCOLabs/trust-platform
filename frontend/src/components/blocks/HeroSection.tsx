import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { StatusType } from '../../lib/types'

interface HeroSectionProps {
  phone: string
  status: string
  statusType: StatusType
  loading: boolean
  onPhoneChange: (value: string) => void
  onLookup: () => Promise<void>
}

const statusStyles: Record<HeroSectionProps['statusType'], string> = {
  idle: 'bg-slate-950/70 ring-slate-700/70 text-slate-300',
  loading: 'bg-slate-950/70 ring-sky-500/30 text-sky-200',
  success: 'bg-slate-950/70 ring-emerald-500/15 text-slate-300',
  error: 'bg-rose-500/10 ring-rose-400/20 text-rose-200',
  info: 'bg-slate-950/70 ring-amber-500/15 text-slate-300',
}

export function HeroSection({ phone, status, statusType, loading, onPhoneChange, onLookup }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-slate-700/60 bg-slate-950/80 px-6 py-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm uppercase tracking-[0.3em] text-slate-400">
            Public caller check
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Check whether a caller is trusted.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Enter a phone number to see the caller, risk level, reason for calling, and trust signals from the verified registry.
            </p>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-700/80 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <div className="mb-4 text-sm uppercase tracking-[0.28em] text-slate-500">Number lookup</div>
          <div className="space-y-4">
            <Input
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && !loading && void onLookup()}
              placeholder="+358401234567"
              aria-label="Phone number"
              disabled={loading}
            />
            <Button onClick={onLookup} loading={loading} loadingLabel="Looking up..." className="w-full" variant="primary">
              Lookup number
            </Button>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">Results appear below as a call card with clear next actions.</p>
          <div className={`mt-6 rounded-3xl px-4 py-3 text-sm ring-1 transition-colors duration-200 ${statusStyles[statusType]}`} role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </div>
    </section>
  )
}
