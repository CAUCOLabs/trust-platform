import type { StatusType } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface PublicHeroSectionProps {
  phone: string
  status: string
  statusType: StatusType
  loading: boolean
  onPhoneChange: (value: string) => void
  onLookup: () => Promise<void>
}

const statusStyles: Record<StatusType, string> = {
  idle: 'bg-slate-950/70 ring-slate-700/70 text-slate-300',
  loading: 'bg-slate-950/70 ring-sky-500/30 text-sky-200',
  success: 'bg-slate-950/70 ring-emerald-500/15 text-slate-300',
  error: 'bg-rose-500/10 ring-rose-400/20 text-rose-200',
  info: 'bg-slate-950/70 ring-amber-500/15 text-slate-300',
}

function StoreButton({ eyebrow, label }: { eyebrow: string; label: string }) {
  return (
    <button
      type="button"
      className="rounded-[22px] border border-slate-700/70 bg-slate-900/90 px-5 py-3 text-left transition hover:border-sky-400/40 hover:bg-slate-800/90"
    >
      <span className="block text-[10px] uppercase tracking-[0.24em] text-slate-500">{eyebrow}</span>
      <span className="mt-1 block text-base font-semibold text-white">{label}</span>
    </button>
  )
}

function MobileAppMockup() {
  return (
    <div className="mx-auto w-full max-w-[23rem] rounded-[42px] border border-slate-700/80 bg-slate-900 p-3 shadow-[0_40px_100px_-50px_rgba(14,165,233,0.55)]">
      <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Incoming call</p>
            <p className="mt-1 text-sm font-medium text-slate-200">Trust Platform</p>
          </div>
          <Badge level="low">Verified</Badge>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-[28px] bg-slate-900/90 p-5 ring-1 ring-slate-700/70">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Caller</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Nordic Health</h3>
            <p className="mt-2 font-mono text-sm text-slate-400">+358 40 123 4567</p>
          </div>

          <div className="rounded-[28px] bg-slate-900/90 p-5 ring-1 ring-slate-700/70">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Reason</p>
            <p className="mt-3 text-lg font-semibold text-white">Appointment confirmation</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Verified by the business before the call reaches the receiver.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
              <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200/80">Trust</p>
              <p className="mt-2 text-xl font-semibold text-white">94/100</p>
            </div>
            <div className="rounded-[22px] bg-slate-900 p-4 ring-1 ring-slate-700/70">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Action</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">Safe to answer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PublicHeroSection({ phone, status, statusType, loading, onPhoneChange, onLookup }: PublicHeroSectionProps) {
  return (
    <section className="grid min-h-[calc(100vh-5rem)] gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
      <div className="space-y-8">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm uppercase tracking-[0.28em] text-slate-400">
            Verified business calling
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know why a business is calling before you answer.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Trust Platform shows caller identity, call reason, and trust signals so receivers can answer verified business calls with confidence.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-3xl bg-sky-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_45px_-28px_rgba(14,165,233,0.85)] transition hover:bg-sky-400"
          >
            Try the live demo
          </a>
          <a
            href="#business"
            className="inline-flex items-center justify-center rounded-3xl border border-slate-700/80 bg-slate-900/80 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            For business
          </a>
        </div>

        <div id="demo" className="rounded-[32px] border border-slate-700/70 bg-slate-950/80 p-5 sm:p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Live lookup demo</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && !loading && void onLookup()}
              placeholder="+358401234567"
              aria-label="Phone number"
              disabled={loading}
            />
            <Button onClick={onLookup} loading={loading} loadingLabel="Looking up..." className="w-full sm:w-auto">
              Lookup number
            </Button>
          </div>
          <div className={`mt-4 rounded-3xl px-4 py-3 text-sm ring-1 transition-colors duration-200 ${statusStyles[statusType]}`} role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </div>

      <MobileAppMockup />
    </section>
  )
}

export function HowItWorksSection() {
  const steps = [
    {
      title: 'Business verifies the call',
      detail: 'The company registers trusted numbers and attaches a clear call reason before outreach begins.',
    },
    {
      title: 'Receiver sees context',
      detail: 'The app surfaces identity, reason, risk, and trust score in a simple caller card.',
    },
    {
      title: 'Trust improves over time',
      detail: 'Lookup activity, spam reports, sessions, and audit history keep the signal useful for operations.',
    },
  ]

  return (
    <section id="how-it-works" className="py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">How it works</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">Caller identity, reason, and trust in three steps.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-[28px] border border-slate-700/70 bg-slate-900/80 p-6">
            <p className="text-sm font-semibold text-sky-200">0{index + 1}</p>
            <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ReceiverExperienceSection() {
  return (
    <section className="grid gap-6 py-10 lg:grid-cols-2">
      <div className="rounded-[32px] border border-slate-700/70 bg-slate-950/80 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Receiver has the app</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">The call arrives with verified context.</h2>
        <p className="mt-4 text-base leading-7 text-slate-400">
          The receiver sees the business name, call reason, risk level, trust score, and recommendation before deciding what to do.
        </p>
      </div>
      <div className="rounded-[32px] border border-slate-700/70 bg-slate-950/80 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Receiver does not have the app</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Lookup still gives a clear answer.</h2>
        <p className="mt-4 text-base leading-7 text-slate-400">
          The public web lookup can still check a number and show whether a verified caller profile exists.
        </p>
      </div>
    </section>
  )
}

export function BusinessValueSection() {
  const benefits = ['Higher answer rates for legitimate calls', 'Fewer ignored customer contacts', 'Clear reasons that reduce suspicion', 'Admin controls for trusted numbers and audit trails']

  return (
    <section id="business" className="grid gap-8 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">For companies</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">Make legitimate calls feel safe to answer.</h2>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Trust Platform gives businesses a verified calling layer while operations teams manage numbers, call reasons, sessions, and audit history behind the scenes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {benefits.map((benefit) => (
          <div key={benefit} className="rounded-[26px] border border-slate-700/70 bg-slate-900/80 p-5">
            <p className="text-lg font-semibold text-white">{benefit}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SocialProofSection() {
  const brands = ['Nordic Health', 'Aalto Finance', 'City Utilities', 'Helio Support']

  return (
    <section className="rounded-[32px] border border-slate-700/70 bg-slate-950/80 p-6 py-8 sm:p-8">
      <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Trusted by teams like</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((brand) => (
          <div key={brand} className="rounded-[22px] border border-slate-700/70 bg-slate-900/70 px-5 py-4 text-center font-semibold text-slate-200">
            {brand}
          </div>
        ))}
      </div>
    </section>
  )
}

export function DownloadCtaSection() {
  return (
    <section id="download" className="grid gap-6 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Get Trust Platform</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">A receiver app for the public. A console for trusted businesses.</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
          App store buttons are placeholders for the product launch path. Business teams can request a demo today.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr]">
        <StoreButton eyebrow="Download on the" label="App Store" />
        <StoreButton eyebrow="Get it on" label="Google Play" />
        <a
          href="#support"
          className="inline-flex items-center justify-center rounded-[22px] bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 sm:col-span-3 lg:col-span-2"
        >
          Request a business demo
        </a>
      </div>
    </section>
  )
}

export function SupportSection() {
  return (
    <section id="support" className="rounded-[32px] border border-slate-700/70 bg-slate-900/80 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Support and contact</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Need verified calling for your business?</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Contact the Trust Platform team to discuss onboarding, verified number management, and call reason workflows.
          </p>
        </div>
        <a
          href="mailto:support@trustplatform.local"
          className="inline-flex items-center justify-center rounded-3xl border border-slate-700/70 bg-slate-950 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:border-sky-400/40"
        >
          support@trustplatform.local
        </a>
      </div>
    </section>
  )
}
