import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

interface PremiumFeatureSectionProps {
  phone: string
  loading: boolean
  onPhoneChange: (value: string) => void
  onLookup: () => Promise<void>
}

export function PremiumFeatureSection({ phone, loading, onPhoneChange, onLookup }: PremiumFeatureSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[44px] border border-slate-700/70 bg-slate-950/80 px-5 py-8 shadow-[0_40px_120px_-70px_rgba(15,23,42,0.9)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute -right-10 top-8 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10"
        >
          <span className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/90 px-4 py-2 text-sm uppercase tracking-[0.32em] text-slate-500">
            Verified signals
          </span>
          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Know who is calling before you answer.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
                Trust Platform brings high-end call intelligence into a polished workspace, with fast lookup and clear verified call previews.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Input
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && !loading && void onLookup()}
                placeholder="+358401234567"
                aria-label="Phone number"
                disabled={loading}
              />
              <Button onClick={onLookup} loading={loading} loadingLabel="Looking up..." variant="primary" className="w-full sm:w-auto">
                Lookup now
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Instant action', value: 'sub-second lookup' },
                { label: 'Verified', value: 'Trusted caller signals' },
                { label: 'Aligned', value: 'Backend-ready API' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4 text-sm text-slate-300">
                  <p className="font-medium text-slate-100">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="relative z-10"
        >
          <div className="overflow-hidden rounded-[32px] border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900/95 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                  Incoming call
                </span>
                <Badge level="low">Verified</Badge>
              </div>

              <div className="space-y-3 rounded-[28px] bg-slate-950/95 p-6 ring-1 ring-slate-700/70">
                <div className="space-y-2">
                  <p className="text-2xl font-semibold text-white">Trusted caller</p>
                  <p className="text-sm text-slate-400">Signal strength and verified risk are shown here as a card preview.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-900/90 p-4 text-slate-300 ring-1 ring-slate-700/80">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Signal</p>
                    <p className="mt-2 text-lg font-semibold text-white">High confidence</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/90 p-4 text-slate-300 ring-1 ring-slate-700/80">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Priority</p>
                    <p className="mt-2 text-lg font-semibold text-white">Action ready</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/90 p-5 ring-1 ring-slate-700/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Caller</p>
                    <p className="mt-2 text-xl font-semibold text-white">Unknown number</p>
                  </div>
                  <div className="rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
                    Live preview
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="h-3 rounded-full bg-slate-800/90" />
                  <div className="h-3 rounded-full bg-slate-800/90 w-4/5" />
                  <div className="h-3 rounded-full bg-slate-800/90 w-3/5" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  )
}
