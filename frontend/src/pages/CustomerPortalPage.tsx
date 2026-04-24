import { FormEvent, useCallback, useEffect, useState } from 'react'
import { PortalBusinessWorkspace } from '../components/blocks/PortalBusinessWorkspace'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Panel } from '../components/ui/Panel'
import { loginPortal, signUpBusinessPortal, signUpPersonalPortal } from '../lib/api'
import type { AccountType, PortalCompanySummary, PortalSession } from '../lib/types'

interface CustomerPortalPageProps {
  session: PortalSession | null
  authChecking: boolean
  onLogin: (session: PortalSession) => void
  onLogout: () => void
}

interface PersonalSignupForm {
  full_name: string
  email: string
  phone_number: string
  password: string
}

interface BusinessSignupForm {
  full_name: string
  work_email: string
  phone_number: string
  password: string
  company_name: string
  business_id: string
}

interface SignInForm {
  email: string
  password: string
}

function workspacePath(accountType: AccountType) {
  return accountType === 'business' ? '/workspace/business' : '/workspace/personal'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SurfacePill({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'border border-sky-400/30 bg-sky-500/10 text-sky-100'
          : 'border border-slate-700/70 bg-slate-950/75 text-slate-300 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function CustomerPortalPage({ session, authChecking, onLogin, onLogout }: CustomerPortalPageProps) {
  const [accountType, setAccountType] = useState<AccountType>('personal')
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [personalForm, setPersonalForm] = useState<PersonalSignupForm>({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
  })
  const [businessForm, setBusinessForm] = useState<BusinessSignupForm>({
    full_name: '',
    work_email: '',
    password: '',
    company_name: '',
    business_id: '',
    phone_number: '',
  })
  const [signInForm, setSignInForm] = useState<SignInForm>({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessCompany, setBusinessCompany] = useState<PortalCompanySummary | null>(session?.account.company ?? null)

  useEffect(() => {
    if (!session) {
      return
    }

    window.history.replaceState(null, '', workspacePath(session.account.account_type))
  }, [session])

  useEffect(() => {
    setBusinessCompany(session?.account.company ?? null)
  }, [session])

  const handleBusinessSummaryChange = useCallback((summary: PortalCompanySummary) => {
    setBusinessCompany(summary)
  }, [])

  async function handlePersonalSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const nextSession = await signUpPersonalPortal(personalForm)
      onLogin(nextSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create personal account.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBusinessSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const nextSession = await signUpBusinessPortal(businessForm)
      onLogin(nextSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create business account.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const nextSession = await loginPortal(signInForm.email.trim(), signInForm.password, accountType)
      onLogin(nextSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  if (authChecking) {
    return (
      <main className="px-4 pb-12 pt-10 text-slate-100 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Panel glow className="p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Customer Portal</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">Restoring portal session.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Checking customer access separately from the internal operations console.
            </p>
          </Panel>
        </div>
      </main>
    )
  }

  if (session) {
    const isBusiness = session.account.account_type === 'business'
    const businessSummary = isBusiness ? businessCompany ?? session.account.company ?? null : null

    return (
      <main className="px-4 pb-12 pt-10 text-slate-100 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <Panel glow className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                  {isBusiness ? 'Business Workspace' : 'Personal Workspace'}
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {isBusiness ? businessSummary?.name : session.account.full_name}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                  {isBusiness
                    ? 'Portal access is active for your company workspace. Internal ops remains on a separate admin surface.'
                    : 'Personal portal access is active. Your account is isolated from the public website and the internal operations console.'}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Session</p>
                <p className="mt-3 text-sm text-slate-200">{session.account.email}</p>
                <p className="mt-2 text-sm text-slate-400">Expires {formatDate(session.expires_at)}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" onClick={onLogout} variant="danger" className="px-4 py-3">
                    Sign out
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState(null, '', '/')
                      window.dispatchEvent(new PopStateEvent('popstate'))
                    }}
                    className="rounded-3xl border border-slate-700/70 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:text-white"
                  >
                    Go to public site
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          <section className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Account profile</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Full name</p>
                  <p className="mt-2 text-lg font-semibold text-white">{session.account.full_name}</p>
                </div>
                <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Phone number</p>
                  <p className="mt-2 text-lg font-semibold text-white">{session.account.phone_number}</p>
                </div>
                <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Account type</p>
                  <p className="mt-2 text-lg font-semibold capitalize text-white">{session.account.account_type}</p>
                </div>
                <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Created</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatDate(session.account.created_at)}</p>
                </div>
              </div>
            </Panel>

            {isBusiness && session.account.company ? (
              <Panel className="p-6 sm:p-8">
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Company workspace</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ['Business ID', businessSummary?.business_id ?? '—'],
                    ['Main phone', businessSummary?.phone_number ?? '—'],
                    ['Profile status', businessSummary?.verified ? 'Verified' : 'Pending review'],
                    ['Trusted numbers', String(businessSummary?.verified_number_count ?? 0)],
                    ['Active reasons', String(businessSummary?.active_call_reason_count ?? 0)],
                    ['Workspace owner', session.account.full_name],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
                      <p className="mt-2 text-base font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel className="p-6 sm:p-8">
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Personal workspace</p>
                <div className="mt-6 grid gap-4">
                  {[
                    ['Identity', 'Your portal account is active and linked to this email address.'],
                    ['Phone', session.account.phone_number],
                    ['Session scope', 'This customer session only unlocks the portal surface.'],
                    ['Internal ops', 'Admin access uses separate credentials and separate endpoints.'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </section>

          {isBusiness && businessSummary ? (
            <PortalBusinessWorkspace session={session} companySummary={businessSummary} onCompanySummaryChange={handleBusinessSummaryChange} />
          ) : null}
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 pb-12 pt-10 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Panel glow className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_26%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Product Access</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Real customer access for personal and business accounts.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                The public website stays open. The portal runs its own persisted customer accounts and sessions. Internal operations remain on a separate admin flow.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-700/70 bg-slate-900/70 p-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Surface separation</p>
              <div className="mt-4 grid gap-3">
                {[
                  ['Public website', 'Open access lookup and product marketing'],
                  ['Customer portal', 'Personal and business accounts'],
                  ['Internal ops', 'Separate admin credentials and token'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] border border-slate-700/70 bg-slate-950/75 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel className="p-6 sm:p-8">
            <div className="flex h-full flex-col gap-8">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Choose account type</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Portal onboarding</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Personal accounts are for individual trust activity. Business accounts create a company workspace with a linked organization profile.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <SurfacePill active={accountType === 'personal'} onClick={() => setAccountType('personal')}>
                  Personal account
                </SurfacePill>
                <SurfacePill active={accountType === 'business'} onClick={() => setAccountType('business')}>
                  Business account
                </SurfacePill>
              </div>

              <div className="grid gap-4">
                {(accountType === 'personal'
                  ? [
                      ['Private workspace', 'Profile-based customer access'],
                      ['Email sign-in', 'Stored customer session'],
                      ['Minimal v1', 'Focused on account profile and access'],
                    ]
                  : [
                      ['Company profile', 'Creates a linked business record'],
                      ['Workspace owner', 'Named contact for the account'],
                      ['Verification ready', 'Starts pending until reviewed internally'],
                    ]
                ).map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Access flow</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {mode === 'signup' ? 'Create portal access' : 'Sign in to portal'}
                </h3>
              </div>
              <div className="flex gap-2">
                <SurfacePill active={mode === 'signup'} onClick={() => setMode('signup')}>
                  Sign up
                </SurfacePill>
                <SurfacePill active={mode === 'signin'} onClick={() => setMode('signin')}>
                  Sign in
                </SurfacePill>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">{error}</div>
            ) : null}

            {mode === 'signin' ? (
              <form className="mt-6 space-y-5" onSubmit={handleSignIn}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Account type</span>
                  <div className="flex flex-wrap gap-3">
                    <SurfacePill active={accountType === 'personal'} onClick={() => setAccountType('personal')}>
                      Personal
                    </SurfacePill>
                    <SurfacePill active={accountType === 'business'} onClick={() => setAccountType('business')}>
                      Business
                    </SurfacePill>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={signInForm.email}
                    onChange={(event) => setSignInForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Phone number</span>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    value={personalForm.phone_number}
                    onChange={(event) => setPersonalForm((current) => ({ ...current, phone_number: event.target.value }))}
                    placeholder="+358401234567"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={signInForm.password}
                    onChange={(event) => setSignInForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>

                <Button type="submit" loading={loading} loadingLabel="Signing in..." className="w-full">
                  Sign in to portal
                </Button>
              </form>
            ) : accountType === 'personal' ? (
              <form className="mt-6 space-y-5" onSubmit={handlePersonalSignup}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Full name</span>
                  <Input
                    autoComplete="name"
                    value={personalForm.full_name}
                    onChange={(event) => setPersonalForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Aino Example"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={personalForm.email}
                    onChange={(event) => setPersonalForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="aino@example.com"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Phone number</span>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    value={personalForm.phone_number}
                    onChange={(event) => setPersonalForm((current) => ({ ...current, phone_number: event.target.value }))}
                    placeholder="+358401234567"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={personalForm.password}
                    onChange={(event) => setPersonalForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </label>

                <Button type="submit" loading={loading} loadingLabel="Creating account..." className="w-full">
                  Create personal account
                </Button>
              </form>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={handleBusinessSignup}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Workspace owner</span>
                  <Input
                    autoComplete="name"
                    value={businessForm.full_name}
                    onChange={(event) => setBusinessForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Mikael Manager"
                    required
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Company name</span>
                    <Input
                      value={businessForm.company_name}
                      onChange={(event) => setBusinessForm((current) => ({ ...current, company_name: event.target.value }))}
                      placeholder="Nordic Health"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Business ID</span>
                    <Input
                      value={businessForm.business_id}
                      onChange={(event) => setBusinessForm((current) => ({ ...current, business_id: event.target.value }))}
                      placeholder="1234567-8"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Work email</span>
                    <Input
                      type="email"
                      autoComplete="email"
                      value={businessForm.work_email}
                      onChange={(event) => setBusinessForm((current) => ({ ...current, work_email: event.target.value }))}
                      placeholder="ops@nordichealth.fi"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Phone number</span>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      value={businessForm.phone_number}
                      onChange={(event) => setBusinessForm((current) => ({ ...current, phone_number: event.target.value }))}
                      placeholder="+358401234567"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={businessForm.password}
                    onChange={(event) => setBusinessForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </label>

                <Button type="submit" loading={loading} loadingLabel="Creating workspace..." className="w-full">
                  Create business account
                </Button>
              </form>
            )}
          </Panel>
        </section>
      </div>
    </main>
  )
}
