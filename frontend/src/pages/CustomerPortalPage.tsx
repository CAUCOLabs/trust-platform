import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Panel } from '../components/ui/Panel'

export default function CustomerPortalPage() {
  return (
    <main className="px-4 pb-12 pt-10 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Panel glow className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/12 via-transparent to-transparent" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Product Access</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Choose how to join Trust Platform.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Create a personal account to manage caller trust and reports, or request a business account to verify company identity, numbers, and call reasons.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Access model</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Public website, product accounts, and internal operations are separate surfaces. This page is for customer access only.
              </p>
            </div>
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel className="p-6 sm:p-8">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Personal account</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">For people who want safer calls.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Personal accounts are for managing caller trust, reviewing lookup history, saving trusted businesses, and reporting suspicious calls.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Trust history', 'See recent checks'],
                  ['Saved callers', 'Keep known businesses close'],
                  ['Spam reports', 'Flag suspicious numbers'],
                  ['Preferences', 'Tune alerts and visibility'],
                ].map(([label, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-700/70 bg-slate-950/75 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{detail}</p>
                  </div>
                ))}
              </div>

              <Button type="button" className="w-full sm:w-auto">
                Create personal account
              </Button>
            </div>
          </Panel>

          <Panel className="p-6 sm:p-8">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Business account</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">For verified companies that call customers.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Business accounts are for managing company identity, team access, trusted phone numbers, and approved call reasons.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-700/70 bg-slate-950/75 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Workspace preview</p>
                    <h4 className="mt-2 text-xl font-semibold text-white">Nordic Health</h4>
                    <p className="mt-1 text-sm text-slate-400">Verified healthcare calling profile</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200 ring-1 ring-emerald-500/20">
                    Verification required
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Team members', '8 active'],
                    ['Trusted numbers', '14 approved'],
                    ['Call reasons', '6 live'],
                    ['Profile status', 'Ready for review'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[20px] border border-slate-700/70 bg-slate-900/70 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="button" className="w-full sm:w-auto">
                Request business access
              </Button>
            </div>
          </Panel>
        </section>

        <Panel className="p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Existing users</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Sign in when your account is active.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Personal sign-in and business workspace access will use this customer-facing surface. Business accounts may require identity and number verification before activation.
              </p>
              <div className="mt-5 rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4 text-sm leading-6 text-slate-400">
                Internal operations remain separate and are not part of customer account access.
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                <Input placeholder="name@example.com" type="email" autoComplete="email" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Account type</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className="rounded-[22px] border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-left text-sm font-semibold text-sky-100">
                    Personal
                  </button>
                  <button type="button" className="rounded-[22px] border border-slate-700/70 bg-slate-950/75 px-4 py-3 text-left text-sm font-semibold text-slate-200">
                    Business
                  </button>
                </div>
              </label>
              <Button type="button" className="w-full">
                Continue
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  )
}
