import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { FormField } from '../ui/FormField'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import type {
  CallReason,
  Company,
  CreateCallReasonPayload,
  CreateCompanyPayload,
  CreateVerifiedNumberPayload,
  UpdateCallReasonPayload,
  UpdateCompanyPayload,
  UpdateVerifiedNumberPayload,
  VerifiedNumber,
} from '../../lib/types'

interface AdminCreatePanelProps {
  eyebrow: string
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}

interface SubmitState {
  loading: boolean
  success: string | null
  error: string | null
}

interface CreateCompanySectionProps {
  onCancel: () => void
  onSubmit: (payload: CreateCompanyPayload) => Promise<void>
}

interface EditCompanySectionProps {
  company: Company
  onCancel: () => void
  onSubmit: (payload: UpdateCompanyPayload) => Promise<void>
}

interface CreateVerifiedNumberSectionProps {
  companies: Company[]
  onCancel: () => void
  onSubmit: (payload: CreateVerifiedNumberPayload) => Promise<void>
}

interface EditVerifiedNumberSectionProps {
  companies: Company[]
  verifiedNumber: VerifiedNumber
  onCancel: () => void
  onSubmit: (payload: UpdateVerifiedNumberPayload) => Promise<void>
}

interface CreateCallReasonSectionProps {
  companies: Company[]
  onCancel: () => void
  onSubmit: (payload: CreateCallReasonPayload) => Promise<void>
}

interface EditCallReasonSectionProps {
  companies: Company[]
  callReason: CallReason
  onCancel: () => void
  onSubmit: (payload: UpdateCallReasonPayload) => Promise<void>
}

type FieldErrors<T extends string> = Partial<Record<T, string>>

function AdminCreatePanel({ eyebrow, title, description, onClose, children }: AdminCreatePanelProps) {
  return (
    <Panel glow className="border-sky-500/20 bg-slate-950/95 p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-200/80">{eyebrow}</p>
          <h3 className="text-3xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
        </div>
        <Button type="button" onClick={onClose} className="w-full bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
          Close
        </Button>
      </div>
      <div className="mt-8">{children}</div>
    </Panel>
  )
}

function FormStatus({ success, error }: Pick<SubmitState, 'success' | 'error'>) {
  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
        {error}
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
        {success}
      </div>
    )
  }

  return null
}

function companyOptions(companies: Company[]) {
  return companies.map((company) => ({
    value: String(company.id),
    label: `${company.name} · ${company.business_id}`,
  }))
}

function normalizeExpiresAt(value?: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}

function toExpiresAtPayload(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return date.toISOString()
}

export function CreateCompanySection({ onCancel, onSubmit }: CreateCompanySectionProps) {
  const [form, setForm] = useState<CreateCompanyPayload>({
    name: '',
    business_id: '',
    phone_number: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof CreateCompanyPayload>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof CreateCompanyPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<keyof CreateCompanyPayload> = {}
    if (!form.name.trim()) nextErrors.name = 'Company name is required.'
    if (!form.business_id.trim()) nextErrors.business_id = 'Business ID is required.'
    if (!form.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        name: form.name.trim(),
        business_id: form.business_id.trim(),
        phone_number: form.phone_number.trim(),
      })
      setForm({ name: '', business_id: '', phone_number: '' })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Company created and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to create company.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Create company"
      title="Add a company to the registry"
      description="Create a new company record with the exact backend payload used by `POST /companies`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label="Name" htmlFor="company-name" error={fieldErrors.name}>
            <Input id="company-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Nordic Utility Services" />
          </FormField>
          <FormField label="Business ID" htmlFor="company-business-id" error={fieldErrors.business_id}>
            <Input
              id="company-business-id"
              value={form.business_id}
              onChange={(event) => updateField('business_id', event.target.value)}
              placeholder="1234567-8"
            />
          </FormField>
          <FormField label="Phone Number" htmlFor="company-phone-number" error={fieldErrors.phone_number}>
            <Input
              id="company-phone-number"
              value={form.phone_number}
              onChange={(event) => updateField('phone_number', event.target.value)}
              placeholder="+358401234567"
            />
          </FormField>
        </div>
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Creating company..." className="sm:w-auto">
            Create company
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}

export function EditCompanySection({ company, onCancel, onSubmit }: EditCompanySectionProps) {
  const [form, setForm] = useState<UpdateCompanyPayload>({
    name: company.name,
    business_id: company.business_id,
    phone_number: company.phone_number,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof UpdateCompanyPayload>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof UpdateCompanyPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<keyof UpdateCompanyPayload> = {}
    if (!form.name.trim()) nextErrors.name = 'Company name is required.'
    if (!form.business_id.trim()) nextErrors.business_id = 'Business ID is required.'
    if (!form.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        name: form.name.trim(),
        business_id: form.business_id.trim(),
        phone_number: form.phone_number.trim(),
      })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Company updated and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to update company.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Edit company"
      title={`Update company #${company.id}`}
      description="Edit an existing company record using the backend payload accepted by `PUT /companies/{id}`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label="Name" htmlFor="edit-company-name" error={fieldErrors.name}>
            <Input id="edit-company-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </FormField>
          <FormField label="Business ID" htmlFor="edit-company-business-id" error={fieldErrors.business_id}>
            <Input id="edit-company-business-id" value={form.business_id} onChange={(event) => updateField('business_id', event.target.value)} />
          </FormField>
          <FormField label="Phone Number" htmlFor="edit-company-phone-number" error={fieldErrors.phone_number}>
            <Input id="edit-company-phone-number" value={form.phone_number} onChange={(event) => updateField('phone_number', event.target.value)} />
          </FormField>
        </div>
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Saving company..." className="sm:w-auto">
            Save company
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}

export function CreateVerifiedNumberSection({ companies, onCancel, onSubmit }: CreateVerifiedNumberSectionProps) {
  const options = useMemo(() => companyOptions(companies), [companies])
  const [form, setForm] = useState({
    company_id: '',
    phone_number: '',
    label: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'company_id' | 'phone_number' | 'label'>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<'company_id' | 'phone_number' | 'label'> = {}
    if (!form.company_id) nextErrors.company_id = 'Company is required.'
    if (!form.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.'
    if (!form.label.trim()) nextErrors.label = 'Label is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        company_id: Number(form.company_id),
        phone_number: form.phone_number.trim(),
        label: form.label.trim(),
      })
      setForm({ company_id: '', phone_number: '', label: '' })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Verified number created and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to create verified number.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Create verified number"
      title="Attach a trusted number to a company"
      description="Create a verified number with the exact backend payload used by `POST /verified-numbers`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label="Company" htmlFor="verified-number-company" error={fieldErrors.company_id}>
            <Select id="verified-number-company" value={form.company_id} onChange={(event) => updateField('company_id', event.target.value)}>
              <option value="">Select company</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Phone Number" htmlFor="verified-number-phone" error={fieldErrors.phone_number}>
            <Input
              id="verified-number-phone"
              value={form.phone_number}
              onChange={(event) => updateField('phone_number', event.target.value)}
              placeholder="+358401234567"
            />
          </FormField>
          <FormField label="Label" htmlFor="verified-number-label" error={fieldErrors.label}>
            <Input
              id="verified-number-label"
              value={form.label}
              onChange={(event) => updateField('label', event.target.value)}
              placeholder="Customer support"
            />
          </FormField>
        </div>
        {!companies.length ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Create at least one company first so the new verified number can be linked to a valid `company_id`.
          </div>
        ) : null}
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Creating verified number..." className="sm:w-auto" disabled={!companies.length}>
            Create verified number
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}

export function EditVerifiedNumberSection({
  companies,
  verifiedNumber,
  onCancel,
  onSubmit,
}: EditVerifiedNumberSectionProps) {
  const options = useMemo(() => companyOptions(companies), [companies])
  const [form, setForm] = useState({
    company_id: String(verifiedNumber.company_id),
    phone_number: verifiedNumber.phone_number,
    label: verifiedNumber.label,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'company_id' | 'phone_number' | 'label'>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<'company_id' | 'phone_number' | 'label'> = {}
    if (!form.company_id) nextErrors.company_id = 'Company is required.'
    if (!form.phone_number.trim()) nextErrors.phone_number = 'Phone number is required.'
    if (!form.label.trim()) nextErrors.label = 'Label is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        company_id: Number(form.company_id),
        phone_number: form.phone_number.trim(),
        label: form.label.trim(),
      })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Verified number updated and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to update verified number.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Edit verified number"
      title={`Update verified number #${verifiedNumber.id}`}
      description="Edit an existing verified number using the backend payload accepted by `PUT /verified-numbers/{id}`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-3">
          <FormField label="Company" htmlFor="edit-verified-number-company" error={fieldErrors.company_id}>
            <Select id="edit-verified-number-company" value={form.company_id} onChange={(event) => updateField('company_id', event.target.value)}>
              <option value="">Select company</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Phone Number" htmlFor="edit-verified-number-phone" error={fieldErrors.phone_number}>
            <Input id="edit-verified-number-phone" value={form.phone_number} onChange={(event) => updateField('phone_number', event.target.value)} />
          </FormField>
          <FormField label="Label" htmlFor="edit-verified-number-label" error={fieldErrors.label}>
            <Input id="edit-verified-number-label" value={form.label} onChange={(event) => updateField('label', event.target.value)} />
          </FormField>
        </div>
        {!companies.length ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Create at least one company first so the verified number can be linked to a valid `company_id`.
          </div>
        ) : null}
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Saving verified number..." className="sm:w-auto" disabled={!companies.length}>
            Save verified number
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}

export function CreateCallReasonSection({ companies, onCancel, onSubmit }: CreateCallReasonSectionProps) {
  const options = useMemo(() => companyOptions(companies), [companies])
  const [form, setForm] = useState({
    company_id: '',
    title: '',
    description: '',
    priority: 'normal',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'company_id' | 'title' | 'description' | 'priority'>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<'company_id' | 'title' | 'description' | 'priority'> = {}
    if (!form.company_id) nextErrors.company_id = 'Company is required.'
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.priority.trim()) nextErrors.priority = 'Priority is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        company_id: Number(form.company_id),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority.trim(),
      })
      setForm({ company_id: '', title: '', description: '', priority: 'normal' })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Call reason created and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to create call reason.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Create call reason"
      title="Add a call reason to a company"
      description="Create a call reason with the exact backend payload used by `POST /call-reasons`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Company" htmlFor="call-reason-company" error={fieldErrors.company_id}>
            <Select id="call-reason-company" value={form.company_id} onChange={(event) => updateField('company_id', event.target.value)}>
              <option value="">Select company</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="call-reason-priority" error={fieldErrors.priority} hint="Sent as a plain string to match the backend contract.">
            <Input
              id="call-reason-priority"
              value={form.priority}
              onChange={(event) => updateField('priority', event.target.value)}
              placeholder="normal"
            />
          </FormField>
          <FormField label="Title" htmlFor="call-reason-title" error={fieldErrors.title} className="lg:col-span-2">
            <Input id="call-reason-title" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Billing follow-up" />
          </FormField>
          <FormField label="Description" htmlFor="call-reason-description" error={fieldErrors.description} className="lg:col-span-2">
            <Textarea
              id="call-reason-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Used when the agent calls back about an open invoice or payment plan."
            />
          </FormField>
        </div>
        {!companies.length ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Create at least one company first so the new call reason can be linked to a valid `company_id`.
          </div>
        ) : null}
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Creating call reason..." className="sm:w-auto" disabled={!companies.length}>
            Create call reason
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}

export function EditCallReasonSection({ companies, callReason, onCancel, onSubmit }: EditCallReasonSectionProps) {
  const options = useMemo(() => companyOptions(companies), [companies])
  const [form, setForm] = useState({
    company_id: String(callReason.company_id),
    title: callReason.title,
    description: callReason.description,
    priority: callReason.priority,
    expires_at: normalizeExpiresAt(callReason.expires_at),
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<'company_id' | 'title' | 'description' | 'priority'>>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ loading: false, success: null, error: null })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitState((current) => ({ ...current, success: null, error: null }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors<'company_id' | 'title' | 'description' | 'priority'> = {}
    if (!form.company_id) nextErrors.company_id = 'Company is required.'
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.description.trim()) nextErrors.description = 'Description is required.'
    if (!form.priority.trim()) nextErrors.priority = 'Priority is required.'

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setSubmitState({ loading: false, success: null, error: 'Fill the required fields before submitting.' })
      return
    }

    setSubmitState({ loading: true, success: null, error: null })

    try {
      await onSubmit({
        company_id: Number(form.company_id),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority.trim(),
        expires_at: toExpiresAtPayload(form.expires_at),
      })
      setFieldErrors({})
      setSubmitState({ loading: false, success: 'Call reason updated and admin data refreshed.', error: null })
    } catch (error) {
      setSubmitState({
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Failed to update call reason.',
      })
    }
  }

  return (
    <AdminCreatePanel
      eyebrow="Edit call reason"
      title={`Update call reason #${callReason.id}`}
      description="Edit an existing call reason using the backend payload accepted by `PUT /call-reasons/{id}`."
      onClose={onCancel}
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Company" htmlFor="edit-call-reason-company" error={fieldErrors.company_id}>
            <Select id="edit-call-reason-company" value={form.company_id} onChange={(event) => updateField('company_id', event.target.value)}>
              <option value="">Select company</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="edit-call-reason-priority" error={fieldErrors.priority}>
            <Input id="edit-call-reason-priority" value={form.priority} onChange={(event) => updateField('priority', event.target.value)} />
          </FormField>
          <FormField label="Title" htmlFor="edit-call-reason-title" error={fieldErrors.title} className="lg:col-span-2">
            <Input id="edit-call-reason-title" value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          </FormField>
          <FormField label="Description" htmlFor="edit-call-reason-description" error={fieldErrors.description} className="lg:col-span-2">
            <Textarea id="edit-call-reason-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </FormField>
          <FormField
            label="Expires At"
            htmlFor="edit-call-reason-expires-at"
            hint="Optional. Saved to the backend as RFC3339 when provided."
            className="lg:col-span-2"
          >
            <Input id="edit-call-reason-expires-at" type="datetime-local" value={form.expires_at} onChange={(event) => updateField('expires_at', event.target.value)} />
          </FormField>
        </div>
        {!companies.length ? (
          <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            Create at least one company first so the call reason can be linked to a valid `company_id`.
          </div>
        ) : null}
        <FormStatus success={submitState.success} error={submitState.error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" loading={submitState.loading} loadingLabel="Saving call reason..." className="sm:w-auto" disabled={!companies.length}>
            Save call reason
          </Button>
          <Button type="button" onClick={onCancel} className="bg-slate-800 text-slate-100 hover:bg-slate-700 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </AdminCreatePanel>
  )
}
