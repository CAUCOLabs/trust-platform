import { FormEvent, useEffect, useState } from 'react'
import {
  createPortalCallReason,
  createPortalVerifiedNumber,
  getPortalBusinessWorkspace,
  updatePortalBusinessCompany,
} from '../../lib/api'
import type {
  CallReason,
  PortalBusinessWorkspace,
  PortalCompanySummary,
  PortalSession,
  UpdateCompanyPayload,
  VerifiedNumber,
} from '../../lib/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { Textarea } from '../ui/Textarea'

interface PortalBusinessWorkspaceProps {
  session: PortalSession
  companySummary: PortalCompanySummary
  onCompanySummaryChange: (summary: PortalCompanySummary) => void
}

interface CompanyFormState {
  name: string
  business_id: string
  phone_number: string
}

interface NumberFormState {
  phone_number: string
  label: string
}

interface ReasonFormState {
  title: string
  description: string
  priority: string
}

interface SubmitState {
  loading: boolean
  success: string | null
  error: string | null
}

const initialSubmitState: SubmitState = {
  loading: false,
  success: null,
  error: null,
}

function formatDate(value?: string) {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildSummary(workspace: PortalBusinessWorkspace): PortalCompanySummary {
  return {
    id: workspace.company.id,
    name: workspace.company.name,
    business_id: workspace.company.business_id,
    phone_number: workspace.company.phone_number,
    verified: workspace.company.verified,
    verified_number_count: workspace.verified_numbers.length,
    active_call_reason_count: workspace.call_reasons.filter((reason) => reason.active).length,
  }
}

function MessageBanner({ state }: { state: SubmitState }) {
  if (state.error) {
    return <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{state.error}</div>
  }

  if (state.success) {
    return <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{state.success}</div>
  }

  return null
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-700/70 bg-slate-950/60 px-5 py-5">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

export function PortalBusinessWorkspace({ session, companySummary, onCompanySummaryChange }: PortalBusinessWorkspaceProps) {
  const [workspace, setWorkspace] = useState<PortalBusinessWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [companyForm, setCompanyForm] = useState<CompanyFormState>({
    name: companySummary.name,
    business_id: companySummary.business_id,
    phone_number: companySummary.phone_number,
  })
  const [numberForm, setNumberForm] = useState<NumberFormState>({
    phone_number: '',
    label: '',
  })
  const [reasonForm, setReasonForm] = useState<ReasonFormState>({
    title: '',
    description: '',
    priority: 'normal',
  })

  const [companyState, setCompanyState] = useState<SubmitState>(initialSubmitState)
  const [numberState, setNumberState] = useState<SubmitState>(initialSubmitState)
  const [reasonState, setReasonState] = useState<SubmitState>(initialSubmitState)

  useEffect(() => {
    setCompanyForm({
      name: companySummary.name,
      business_id: companySummary.business_id,
      phone_number: companySummary.phone_number,
    })
  }, [companySummary])

  useEffect(() => {
    let cancelled = false

    async function loadWorkspace() {
      setLoading(true)
      setLoadError(null)

      try {
        const nextWorkspace = await getPortalBusinessWorkspace()
        if (cancelled) {
          return
        }

        setWorkspace(nextWorkspace)
        onCompanySummaryChange(buildSummary(nextWorkspace))
        setCompanyForm({
          name: nextWorkspace.company.name,
          business_id: nextWorkspace.company.business_id,
          phone_number: nextWorkspace.company.phone_number,
        })
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load business workspace.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [session.account.company?.id, onCompanySummaryChange])

  async function refreshWorkspace(successMessage?: string) {
    const nextWorkspace = await getPortalBusinessWorkspace()
    setWorkspace(nextWorkspace)
    onCompanySummaryChange(buildSummary(nextWorkspace))
    setCompanyForm({
      name: nextWorkspace.company.name,
      business_id: nextWorkspace.company.business_id,
      phone_number: nextWorkspace.company.phone_number,
    })

    if (successMessage) {
      return {
        success: successMessage,
        error: null,
        loading: false,
      } satisfies SubmitState
    }

    return initialSubmitState
  }

  async function handleCompanySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCompanyState({ loading: true, success: null, error: null })

    try {
      const payload: UpdateCompanyPayload = {
        name: companyForm.name.trim(),
        business_id: companyForm.business_id.trim(),
        phone_number: companyForm.phone_number.trim(),
      }
      await updatePortalBusinessCompany(payload)
      setCompanyState(await refreshWorkspace('Company profile updated.'))
    } catch (error) {
      setCompanyState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to update company profile.',
      })
    }
  }

  async function handleNumberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNumberState({ loading: true, success: null, error: null })

    try {
      await createPortalVerifiedNumber({
        phone_number: numberForm.phone_number.trim(),
        label: numberForm.label.trim(),
      })
      setNumberForm({ phone_number: '', label: '' })
      setNumberState(await refreshWorkspace('Trusted number created.'))
    } catch (error) {
      setNumberState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to create trusted number.',
      })
    }
  }

  async function handleReasonSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setReasonState({ loading: true, success: null, error: null })

    try {
      await createPortalCallReason({
        title: reasonForm.title.trim(),
        description: reasonForm.description.trim(),
        priority: reasonForm.priority.trim(),
      })
      setReasonForm({ title: '', description: '', priority: 'normal' })
      setReasonState(await refreshWorkspace('Call reason created.'))
    } catch (error) {
      setReasonState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to create call reason.',
      })
    }
  }

  const verifiedNumbers: VerifiedNumber[] = workspace?.verified_numbers ?? []
  const callReasons: CallReason[] = workspace?.call_reasons ?? []

  if (loading) {
    return (
      <Panel className="p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Business workspace</p>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Loading company management</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
          Retrieving your business profile, trusted numbers, and call reasons for this portal account.
        </p>
      </Panel>
    )
  }

  if (loadError) {
    return (
      <Panel className="p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Business workspace</p>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">We couldn&apos;t load this workspace</h3>
        <div className="mt-5 rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">{loadError}</div>
      </Panel>
    )
  }

  return (
    <div className="grid gap-6">
      <Panel className="p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Business workspace</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Company status', companySummary.verified ? 'Verified' : 'Pending review'],
            ['Trusted numbers', String(verifiedNumbers.length)],
            ['Active reasons', String(callReasons.filter((reason) => reason.active).length)],
            ['Workspace owner', session.account.full_name],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
              <p className="mt-2 text-base font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Company profile</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Keep your business identity current</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This is the customer-facing company profile linked to the signed-in business account.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleCompanySubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Company name</span>
              <Input value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Business ID</span>
                <Input
                  value={companyForm.business_id}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, business_id: event.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Main phone</span>
                <Input
                  type="tel"
                  value={companyForm.phone_number}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, phone_number: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Created</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatDate(workspace?.company.created_at)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Updated</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatDate(workspace?.company.updated_at)}</p>
              </div>
            </div>

            <MessageBanner state={companyState} />

            <Button type="submit" loading={companyState.loading} loadingLabel="Saving company..." className="w-full sm:w-auto">
              Save company profile
            </Button>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Trusted numbers</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Manage caller numbers</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {verifiedNumbers.length > 0 ? (
                verifiedNumbers.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{item.label}</p>
                        <p className="mt-2 font-mono text-sm text-slate-400">{item.phone_number}</p>
                      </div>
                      <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                        {item.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No trusted numbers yet"
                  detail="Add the first number your business uses for outbound calls so customers can recognise it in the portal and public lookup."
                />
              )}
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleNumberSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Phone number</span>
                  <Input
                    type="tel"
                    value={numberForm.phone_number}
                    onChange={(event) => setNumberForm((current) => ({ ...current, phone_number: event.target.value }))}
                    placeholder="+358401234567"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Label</span>
                  <Input
                    value={numberForm.label}
                    onChange={(event) => setNumberForm((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Customer support"
                    required
                  />
                </label>
              </div>

              <MessageBanner state={numberState} />

              <Button type="submit" loading={numberState.loading} loadingLabel="Creating number..." className="w-full sm:w-auto">
                Add trusted number
              </Button>
            </form>
          </Panel>

          <Panel className="p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Call reasons</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Explain why you are calling</h3>

            <div className="mt-6 space-y-4">
              {callReasons.length > 0 ? (
                callReasons.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-700/70 bg-slate-950/75 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                          {item.priority}
                        </span>
                        <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No call reasons yet"
                  detail="Create the reasons your business commonly uses so verified numbers can present useful context to receivers."
                />
              )}
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleReasonSubmit}>
              <div className="grid gap-5 sm:grid-cols-[1fr_0.5fr]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Title</span>
                  <Input
                    value={reasonForm.title}
                    onChange={(event) => setReasonForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Billing follow-up"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Priority</span>
                  <Input
                    value={reasonForm.priority}
                    onChange={(event) => setReasonForm((current) => ({ ...current, priority: event.target.value }))}
                    placeholder="normal"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Description</span>
                <Textarea
                  value={reasonForm.description}
                  onChange={(event) => setReasonForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Explain the context customers should see when this reason is active."
                  required
                />
              </label>

              <MessageBanner state={reasonState} />

              <Button type="submit" loading={reasonState.loading} loadingLabel="Creating reason..." className="w-full sm:w-auto">
                Add call reason
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  )
}
