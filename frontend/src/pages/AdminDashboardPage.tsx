import { useEffect, useRef, useState } from 'react'
import {
  CreateCallReasonSection,
  CreateCompanySection,
  EditCallReasonSection,
  EditCompanySection,
  EditVerifiedNumberSection,
  CreateVerifiedNumberSection,
} from '../components/blocks/AdminCreateSections'
import { AdminDeleteConfirmation } from '../components/blocks/AdminDeleteConfirmation'
import { AdminAnalyticsDashboard } from '../components/blocks/AdminAnalyticsDashboard'
import { AdminDataSection } from '../components/blocks/AdminDataSection'
import { AdminOverview } from '../components/blocks/AdminOverview'
import { AdminRowActions } from '../components/blocks/AdminRowActions'
import { BooleanBadge } from '../components/ui/BooleanBadge'
import { Button } from '../components/ui/Button'
import type { DataTableColumn } from '../components/ui/DataTable'
import { FilterInput } from '../components/ui/FilterInput'
import { FilterSelect } from '../components/ui/FilterSelect'
import { SectionTabs } from '../components/ui/SectionTabs'
import {
  listCallSessions,
  listAuditLogs,
  createCallReason,
  createCompany,
  createVerifiedNumber,
  deleteCallReason,
  deleteCompany,
  deleteVerifiedNumber,
  listCallReasons,
  listCompanies,
  listVerifiedNumbers,
  updateCallReason,
  updateCompany,
  updateVerifiedNumber,
} from '../lib/api'
import type {
  CallSession,
  AuditLog,
  CallReason,
  Company,
  CreateCallReasonPayload,
  CreateCompanyPayload,
  CreateVerifiedNumberPayload,
  UpdateCallReasonPayload,
  UpdateCompanyPayload,
  UpdateVerifiedNumberPayload,
  VerifiedNumber,
} from '../lib/types'

type AdminSection = 'dashboard' | 'companies' | 'verifiedNumbers' | 'callReasons' | 'callSessions' | 'auditLogs'
type DeletableAdminSection = Exclude<AdminSection, 'callSessions' | 'auditLogs'>

interface ResourceState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

interface DeleteIntent {
  section: DeletableAdminSection
  id: number
  title: string
  description: string
  warning?: string
  confirmLabel: string
  successMessage: string
}

interface DeleteState {
  section: DeletableAdminSection | null
  id: number | null
  loading: boolean
  success: string | null
  error: string | null
}

const companyColumns: Array<DataTableColumn<Company>> = [
  {
    key: 'name',
    header: 'Company',
    className: 'min-w-[14rem]',
    render: (company) => (
      <div className="space-y-1">
        <div className="font-medium text-slate-100">{company.name}</div>
        <div className="text-xs text-slate-500">Company ID {company.id}</div>
      </div>
    ),
  },
  { key: 'business_id', header: 'Business ID', render: (company) => <span className="font-mono text-slate-300">{company.business_id}</span> },
  { key: 'phone_number', header: 'Phone Number', render: (company) => <span className="font-mono text-slate-300">{company.phone_number}</span> },
  { key: 'verified', header: 'Verified', render: (company) => <BooleanBadge value={company.verified} trueLabel="Verified" falseLabel="Pending" /> },
]

const verifiedNumberColumns: Array<DataTableColumn<VerifiedNumber>> = [
  {
    key: 'phone_number',
    header: 'Trusted Number',
    className: 'min-w-[14rem]',
    render: (number) => (
      <div className="space-y-1">
        <div className="font-mono text-slate-200">{number.phone_number}</div>
        <div className="text-xs text-slate-500">Verified number ID {number.id}</div>
      </div>
    ),
  },
  { key: 'label', header: 'Label', className: 'min-w-[12rem]', render: (number) => <span className="font-medium text-slate-100">{number.label}</span> },
  { key: 'verified', header: 'Verified', render: (number) => <BooleanBadge value={number.verified} trueLabel="Verified" falseLabel="Pending" /> },
]

const callReasonColumns: Array<DataTableColumn<CallReason>> = [
  {
    key: 'title',
    header: 'Call Reason',
    className: 'min-w-[14rem]',
    render: (reason) => (
      <div className="space-y-1">
        <div className="font-medium text-slate-100">{reason.title}</div>
        <div className="text-xs text-slate-500">Reason ID {reason.id}</div>
      </div>
    ),
  },
  { key: 'description', header: 'Description', className: 'min-w-[18rem]', render: (reason) => <span className="text-slate-300">{reason.description}</span> },
  { key: 'active', header: 'Active', render: (reason) => <BooleanBadge value={reason.active} trueLabel="Active" falseLabel="Inactive" /> },
  { key: 'priority', header: 'Priority', render: (reason) => <span className="font-medium text-slate-100">{reason.priority}</span> },
]

function createInitialState<T>(): ResourceState<T> {
  return {
    data: [],
    loading: true,
    error: null,
  }
}

function createInitialDeleteState(): DeleteState {
  return {
    section: null,
    id: null,
    loading: false,
    success: null,
    error: null,
  }
}

function normalizedText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).toLowerCase()
}

function matchesTextQuery(fields: unknown[], query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return fields.some((field) => normalizedText(field).includes(normalizedQuery))
}

function uniqueSortedValues(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim())))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function humanizeToken(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatResourceType(value: string): string {
  if (value === 'verified_number') {
    return 'Verified number'
  }

  if (value === 'call_reason') {
    return 'Call reason'
  }

  return humanizeToken(value)
}

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  const [openCreateSection, setOpenCreateSection] = useState<AdminSection | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingVerifiedNumber, setEditingVerifiedNumber] = useState<VerifiedNumber | null>(null)
  const [editingCallReason, setEditingCallReason] = useState<CallReason | null>(null)
  const [companies, setCompanies] = useState<ResourceState<Company>>(createInitialState)
  const [verifiedNumbers, setVerifiedNumbers] = useState<ResourceState<VerifiedNumber>>(createInitialState)
  const [callReasons, setCallReasons] = useState<ResourceState<CallReason>>(createInitialState)
  const [callSessions, setCallSessions] = useState<ResourceState<CallSession>>(createInitialState)
  const [auditLogs, setAuditLogs] = useState<ResourceState<AuditLog>>(createInitialState)
  const [companySearch, setCompanySearch] = useState('')
  const [verifiedNumberSearch, setVerifiedNumberSearch] = useState('')
  const [callReasonSearch, setCallReasonSearch] = useState('')
  const [callReasonPriorityFilter, setCallReasonPriorityFilter] = useState('all')
  const [callSessionSearch, setCallSessionSearch] = useState('')
  const [callSessionRiskFilter, setCallSessionRiskFilter] = useState('all')
  const [auditLogSearch, setAuditLogSearch] = useState('')
  const [auditLogEventFilter, setAuditLogEventFilter] = useState('all')
  const [auditLogResourceFilter, setAuditLogResourceFilter] = useState('all')
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(createInitialDeleteState)
  const [refreshing, setRefreshing] = useState(false)
  const latestRefreshId = useRef(0)

  async function refreshData() {
    const refreshId = latestRefreshId.current + 1
    latestRefreshId.current = refreshId
    setRefreshing(true)
    setCompanies((current) => ({ ...current, loading: true, error: null }))
    setVerifiedNumbers((current) => ({ ...current, loading: true, error: null }))
    setCallReasons((current) => ({ ...current, loading: true, error: null }))
    setCallSessions((current) => ({ ...current, loading: true, error: null }))
    setAuditLogs((current) => ({ ...current, loading: true, error: null }))

    const [companiesResult, verifiedNumbersResult, callReasonsResult, callSessionsResult, auditLogsResult] = await Promise.allSettled([
      listCompanies(),
      listVerifiedNumbers(),
      listCallReasons(),
      listCallSessions(),
      listAuditLogs(),
    ])

    if (refreshId !== latestRefreshId.current) {
      return
    }

    setCompanies({
      data: companiesResult.status === 'fulfilled' ? companiesResult.value : [],
      loading: false,
      error: companiesResult.status === 'rejected' ? 'We could not load the company registry. Try refreshing after checking the API connection.' : null,
    })

    setVerifiedNumbers({
      data: verifiedNumbersResult.status === 'fulfilled' ? verifiedNumbersResult.value : [],
      loading: false,
      error:
        verifiedNumbersResult.status === 'rejected'
          ? 'We could not load trusted phone numbers. Try refreshing after checking the API connection.'
          : null,
    })

    setCallReasons({
      data: callReasonsResult.status === 'fulfilled' ? callReasonsResult.value : [],
      loading: false,
      error:
        callReasonsResult.status === 'rejected'
          ? 'We could not load call reasons. Try refreshing after checking the API connection.'
          : null,
    })

    setCallSessions({
      data: callSessionsResult.status === 'fulfilled' ? callSessionsResult.value : [],
      loading: false,
      error:
        callSessionsResult.status === 'rejected'
          ? 'We could not load recent call activity. Try refreshing after checking the API connection.'
          : null,
    })

    setAuditLogs({
      data: auditLogsResult.status === 'fulfilled' ? auditLogsResult.value : [],
      loading: false,
      error:
        auditLogsResult.status === 'rejected'
          ? 'We could not load product activity. Try refreshing after checking the API connection.'
          : null,
    })
    setRefreshing(false)
  }

  useEffect(() => {
    void refreshData()
  }, [])

  useEffect(() => {
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setDeleteIntent(null)
  }, [activeSection])

  function resetDeleteFeedback(section?: DeletableAdminSection) {
    setDeleteState((current) => {
      if (current.loading) {
        return current
      }
      if (section && current.section !== section) {
        return current
      }
      return createInitialDeleteState()
    })
  }

  const sectionOptions = [
    { value: 'dashboard' as const, label: 'Dashboard' },
    { value: 'companies' as const, label: 'Companies', count: companies.data.length },
    { value: 'verifiedNumbers' as const, label: 'Verified Numbers', count: verifiedNumbers.data.length },
    { value: 'callReasons' as const, label: 'Call Reasons', count: callReasons.data.length },
    { value: 'callSessions' as const, label: 'Call Sessions', count: callSessions.data.length },
    { value: 'auditLogs' as const, label: 'Audit Log', count: auditLogs.data.length },
  ]

  const companyById = new Map(companies.data.map((company) => [company.id, company]))
  const companyNameById = new Map(companies.data.map((company) => [company.id, company.name]))
  const verifiedNumberById = new Map(verifiedNumbers.data.map((number) => [number.id, number]))
  const callReasonById = new Map(callReasons.data.map((reason) => [reason.id, reason]))

  const filteredCompanies = companies.data.filter((company) =>
    matchesTextQuery([company.name, company.business_id, company.phone_number], companySearch)
  )

  const filteredVerifiedNumbers = verifiedNumbers.data.filter((number) => {
    const companyName = companyNameById.get(number.company_id)
    return matchesTextQuery([number.phone_number, number.label, companyName, number.company_id], verifiedNumberSearch)
  })

  const callReasonPriorityOptions = uniqueSortedValues(callReasons.data.map((reason) => reason.priority))
  const filteredCallReasons = callReasons.data.filter((reason) => {
    const companyName = companyNameById.get(reason.company_id)
    if (!matchesTextQuery([reason.title, reason.description, reason.priority, companyName, reason.company_id], callReasonSearch)) {
      return false
    }

    if (callReasonPriorityFilter !== 'all' && reason.priority !== callReasonPriorityFilter) {
      return false
    }

    return true
  })

  const filteredCallSessions = callSessions.data.filter((session) => {
    const companyName = session.company_id ? companyNameById.get(session.company_id) : undefined
    const verifiedNumber = session.verified_number_id ? verifiedNumberById.get(session.verified_number_id) : undefined
    const callReason = session.call_reason_id ? callReasonById.get(session.call_reason_id) : undefined
    if (
      !matchesTextQuery(
        [
          session.phone_number,
          session.company_name,
          companyName,
          verifiedNumber?.phone_number,
          verifiedNumber?.label,
          session.verified_number_phone,
          session.verified_number_label,
          callReason?.title,
          session.call_reason_title,
          session.risk_level,
        ],
        callSessionSearch
      )
    ) {
      return false
    }

    if (callSessionRiskFilter !== 'all' && session.risk_level !== callSessionRiskFilter) {
      return false
    }

    return true
  })

  const auditLogEventOptions = uniqueSortedValues(auditLogs.data.map((log) => log.event_type))
  const auditLogResourceOptions = uniqueSortedValues(auditLogs.data.map((log) => log.resource_type))
  const filteredAuditLogs = auditLogs.data.filter((log) => {
    const relatedCompany = log.resource_type === 'company' ? companyNameById.get(log.resource_id) : undefined
    const relatedNumber = log.resource_type === 'verified_number' ? verifiedNumberById.get(log.resource_id) : undefined
    const relatedReason = log.resource_type === 'call_reason' ? callReasonById.get(log.resource_id) : undefined
    if (
      !matchesTextQuery(
        [
          log.event_type,
          humanizeToken(log.event_type),
          log.resource_type,
          formatResourceType(log.resource_type),
          log.message,
          relatedCompany,
          relatedNumber?.phone_number,
          relatedNumber?.label,
          relatedReason?.title,
        ],
        auditLogSearch
      )
    ) {
      return false
    }

    if (auditLogEventFilter !== 'all' && log.event_type !== auditLogEventFilter) {
      return false
    }

    if (auditLogResourceFilter !== 'all' && log.resource_type !== auditLogResourceFilter) {
      return false
    }

    return true
  })

  const companyFilterActive = companySearch.trim().length > 0
  const verifiedNumberFilterActive = verifiedNumberSearch.trim().length > 0
  const callReasonFilterActive = callReasonSearch.trim().length > 0 || callReasonPriorityFilter !== 'all'
  const callSessionFilterActive = callSessionSearch.trim().length > 0 || callSessionRiskFilter !== 'all'
  const auditLogFilterActive =
    auditLogSearch.trim().length > 0 || auditLogEventFilter !== 'all' || auditLogResourceFilter !== 'all'

  const companyToolbar = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex flex-col gap-3 sm:flex-row">
        <FilterInput
          value={companySearch}
          onChange={(event) => setCompanySearch(event.target.value)}
          placeholder="Search name, business ID, or phone"
          aria-label="Search companies"
        />
        <Button type="button" onClick={() => toggleCreatePanel('companies')} className="w-full sm:w-auto">
          {openCreateSection === 'companies' ? 'Hide create form' : 'Create company'}
        </Button>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {filteredCompanies.length} of {companies.data.length} records
      </p>
    </div>
  )

  const verifiedNumberToolbar = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex flex-col gap-3 sm:flex-row">
        <FilterInput
          value={verifiedNumberSearch}
          onChange={(event) => setVerifiedNumberSearch(event.target.value)}
          placeholder="Search phone, label, or company"
          aria-label="Search verified numbers"
        />
        <Button type="button" onClick={() => toggleCreatePanel('verifiedNumbers')} className="w-full sm:w-auto">
          {openCreateSection === 'verifiedNumbers' ? 'Hide create form' : 'Create verified number'}
        </Button>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {filteredVerifiedNumbers.length} of {verifiedNumbers.data.length} records
      </p>
    </div>
  )

  const callReasonToolbar = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex flex-col gap-3 sm:flex-row">
        <FilterInput
          value={callReasonSearch}
          onChange={(event) => setCallReasonSearch(event.target.value)}
          placeholder="Search title, company, priority, or notes"
          aria-label="Search call reasons"
        />
        <FilterSelect
          value={callReasonPriorityFilter}
          onChange={(event) => setCallReasonPriorityFilter(event.target.value)}
          aria-label="Filter call reasons by priority"
        >
          <option value="all">All priorities</option>
          {callReasonPriorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </FilterSelect>
        <Button type="button" onClick={() => toggleCreatePanel('callReasons')} className="w-full sm:w-auto">
          {openCreateSection === 'callReasons' ? 'Hide create form' : 'Create call reason'}
        </Button>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {filteredCallReasons.length} of {callReasons.data.length} records
      </p>
    </div>
  )

  const callSessionToolbar = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex flex-col gap-3 sm:flex-row">
        <FilterInput
          value={callSessionSearch}
          onChange={(event) => setCallSessionSearch(event.target.value)}
          placeholder="Search phone, company, reason, or risk"
          aria-label="Search call sessions"
        />
        <FilterSelect
          value={callSessionRiskFilter}
          onChange={(event) => setCallSessionRiskFilter(event.target.value)}
          aria-label="Filter call sessions by risk level"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </FilterSelect>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {filteredCallSessions.length} of {callSessions.data.length} records
      </p>
    </div>
  )

  const auditLogToolbar = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
      <div className="flex flex-col gap-3 sm:flex-row">
        <FilterInput
          value={auditLogSearch}
          onChange={(event) => setAuditLogSearch(event.target.value)}
          placeholder="Search event, resource, name, or message"
          aria-label="Search audit logs"
        />
        <FilterSelect
          value={auditLogEventFilter}
          onChange={(event) => setAuditLogEventFilter(event.target.value)}
          aria-label="Filter audit logs by event type"
        >
          <option value="all">All events</option>
          {auditLogEventOptions.map((eventType) => (
            <option key={eventType} value={eventType}>
              {humanizeToken(eventType)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={auditLogResourceFilter}
          onChange={(event) => setAuditLogResourceFilter(event.target.value)}
          aria-label="Filter audit logs by resource type"
        >
          <option value="all">All resources</option>
          {auditLogResourceOptions.map((resourceType) => (
            <option key={resourceType} value={resourceType}>
              {formatResourceType(resourceType)}
            </option>
          ))}
        </FilterSelect>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {filteredAuditLogs.length} of {auditLogs.data.length} records
      </p>
    </div>
  )

  function toggleCreatePanel(section: AdminSection) {
    resetDeleteFeedback(section === 'companies' || section === 'verifiedNumbers' || section === 'callReasons' ? section : undefined)
    setDeleteIntent(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setOpenCreateSection((current) => (current === section ? null : section))
  }

  function openCompanyEdit(company: Company) {
    resetDeleteFeedback('companies')
    setDeleteIntent(null)
    setOpenCreateSection(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setEditingCompany(company)
  }

  function openVerifiedNumberEdit(item: VerifiedNumber) {
    resetDeleteFeedback('verifiedNumbers')
    setDeleteIntent(null)
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingCallReason(null)
    setEditingVerifiedNumber(item)
  }

  function openCallReasonEdit(item: CallReason) {
    resetDeleteFeedback('callReasons')
    setDeleteIntent(null)
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(item)
  }

  function openCompanyDelete(company: Company) {
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setDeleteState(createInitialDeleteState())
    setDeleteIntent({
      section: 'companies',
      id: company.id,
      title: `Delete ${company.name}`,
      description: `Delete ${company.name}. This removes the company record from the admin registry.`,
      warning:
        'This company delete can cascade to related verified numbers and call reasons. Existing call sessions are expected to remain, but linked foreign keys may be cleared by the database.',
      confirmLabel: 'Delete company',
      successMessage: `${company.name} deleted and admin data refreshed.`,
    })
  }

  function openVerifiedNumberDelete(item: VerifiedNumber) {
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setDeleteState(createInitialDeleteState())
    setDeleteIntent({
      section: 'verifiedNumbers',
      id: item.id,
      title: `Delete ${item.phone_number}`,
      description: `Delete ${item.phone_number} (${item.label}) from the verified number list.`,
      confirmLabel: 'Delete verified number',
      successMessage: `${item.phone_number} deleted and admin data refreshed.`,
    })
  }

  function openCallReasonDelete(item: CallReason) {
    setOpenCreateSection(null)
    setEditingCompany(null)
    setEditingVerifiedNumber(null)
    setEditingCallReason(null)
    setDeleteState(createInitialDeleteState())
    setDeleteIntent({
      section: 'callReasons',
      id: item.id,
      title: `Delete ${item.title}`,
      description: `Delete the call reason "${item.title}" from the company workflow catalog.`,
      confirmLabel: 'Delete call reason',
      successMessage: `${item.title} deleted and admin data refreshed.`,
    })
  }

  async function handleDeleteConfirm() {
    if (!deleteIntent) return

    setDeleteState({
      section: deleteIntent.section,
      id: deleteIntent.id,
      loading: true,
      success: null,
      error: null,
    })

    try {
      if (deleteIntent.section === 'companies') {
        await deleteCompany(deleteIntent.id)
      } else if (deleteIntent.section === 'verifiedNumbers') {
        await deleteVerifiedNumber(deleteIntent.id)
      } else {
        await deleteCallReason(deleteIntent.id)
      }

      await refreshData()
      setDeleteIntent(null)
      setDeleteState({
        section: deleteIntent.section,
        id: deleteIntent.id,
        loading: false,
        success: deleteIntent.successMessage,
        error: null,
      })
    } catch (error) {
      setDeleteState({
        section: deleteIntent.section,
        id: deleteIntent.id,
        loading: false,
        success: null,
        error: error instanceof Error ? error.message : 'Delete request failed.',
      })
    }
  }

  async function handleCompanyCreate(payload: CreateCompanyPayload) {
    resetDeleteFeedback('companies')
    await createCompany(payload)
    await refreshData()
  }

  async function handleCompanyUpdate(payload: UpdateCompanyPayload) {
    if (!editingCompany) return
    resetDeleteFeedback('companies')
    await updateCompany(editingCompany.id, payload)
    await refreshData()
  }

  async function handleVerifiedNumberCreate(payload: CreateVerifiedNumberPayload) {
    resetDeleteFeedback('verifiedNumbers')
    await createVerifiedNumber(payload)
    await refreshData()
  }

  async function handleVerifiedNumberUpdate(payload: UpdateVerifiedNumberPayload) {
    if (!editingVerifiedNumber) return
    resetDeleteFeedback('verifiedNumbers')
    await updateVerifiedNumber(editingVerifiedNumber.id, payload)
    await refreshData()
  }

  async function handleCallReasonCreate(payload: CreateCallReasonPayload) {
    resetDeleteFeedback('callReasons')
    await createCallReason(payload)
    await refreshData()
  }

  async function handleCallReasonUpdate(payload: UpdateCallReasonPayload) {
    if (!editingCallReason) return
    resetDeleteFeedback('callReasons')
    await updateCallReason(editingCallReason.id, payload)
    await refreshData()
  }

  const companyColumnsWithActions: Array<DataTableColumn<Company>> = [
    ...companyColumns,
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[1%] whitespace-nowrap',
      render: (company) => (
        <AdminRowActions
          onEdit={() => openCompanyEdit(company)}
          onDelete={() => openCompanyDelete(company)}
          deleteDisabled={deleteState.loading && deleteState.section === 'companies' && deleteState.id === company.id}
        />
      ),
    },
  ]

  const callSessionColumnsWithResolvedRefs: Array<DataTableColumn<CallSession>> = [
    {
      key: 'phone_number',
      header: 'Caller',
      className: 'min-w-[13rem]',
      render: (session) => (
        <div className="space-y-1">
          <div className="font-mono text-slate-200">{session.phone_number}</div>
          <div className="text-xs text-slate-500">Session ID {session.id}</div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      className: 'min-w-[14rem]',
      render: (session) => {
        const resolvedCompanyName = session.company_id ? companyNameById.get(session.company_id) : undefined
        const companyDisplay = resolvedCompanyName || session.company_name || (session.company_id ? 'Deleted company' : 'No linked company')

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-100">{companyDisplay}</div>
            <div className="text-xs text-slate-500">{session.company_id ? `Company ID ${session.company_id}` : 'No company ID'}</div>
          </div>
        )
      },
    },
    {
      key: 'verified_number',
      header: 'Verified Number',
      className: 'min-w-[16rem]',
      render: (session) => {
        const resolvedNumber = session.verified_number_id ? verifiedNumberById.get(session.verified_number_id) : undefined
        const phoneDisplay =
          resolvedNumber?.phone_number || session.verified_number_phone || (session.verified_number_id ? 'Deleted verified number' : 'No linked number')
        const labelDisplay =
          resolvedNumber?.label || session.verified_number_label || (session.verified_number_id ? 'Original label unavailable' : 'No linked label')

        return (
          <div className="space-y-1">
            <div className={resolvedNumber || session.verified_number_phone ? 'font-mono text-slate-200' : 'font-medium text-slate-100'}>
              {phoneDisplay}
            </div>
            <div className="text-sm text-slate-400">{labelDisplay}</div>
            <div className="text-xs text-slate-500">
              {session.verified_number_id ? `Verified number ID ${session.verified_number_id}` : 'No verified number ID'}
            </div>
          </div>
        )
      },
    },
    {
      key: 'call_reason',
      header: 'Call Reason',
      className: 'min-w-[14rem]',
      render: (session) => {
        const resolvedReason = session.call_reason_id ? callReasonById.get(session.call_reason_id) : undefined
        const reasonDisplay =
          resolvedReason?.title || session.call_reason_title || (session.call_reason_id ? 'Deleted call reason' : 'No linked reason')

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-100">{reasonDisplay}</div>
            <div className="text-xs text-slate-500">
              {session.call_reason_id ? `Reason ID ${session.call_reason_id}` : 'No reason ID'}
            </div>
          </div>
        )
      },
    },
    { key: 'risk_level', header: 'Risk', render: (session) => <span className="font-medium text-slate-100">{session.risk_level}</span> },
    { key: 'trust_score', header: 'Trust Score', render: (session) => session.trust_score },
    {
      key: 'created_at',
      header: 'Created At',
      className: 'min-w-[11rem]',
      render: (session) => <span className="text-slate-300">{new Date(session.created_at).toLocaleString()}</span>,
    },
  ]

  const verifiedNumberColumnsWithActions: Array<DataTableColumn<VerifiedNumber>> = [
    ...verifiedNumberColumns.slice(0, 1),
    {
      key: 'company',
      header: 'Company',
      className: 'min-w-[14rem]',
      render: (item) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-100">{companyNameById.get(item.company_id) || 'Deleted company'}</div>
          <div className="text-xs text-slate-500">Company ID {item.company_id}</div>
        </div>
      ),
    },
    ...verifiedNumberColumns.slice(1),
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[1%] whitespace-nowrap',
      render: (item) => (
        <AdminRowActions
          onEdit={() => openVerifiedNumberEdit(item)}
          onDelete={() => openVerifiedNumberDelete(item)}
          deleteDisabled={deleteState.loading && deleteState.section === 'verifiedNumbers' && deleteState.id === item.id}
        />
      ),
    },
  ]

  const callReasonColumnsWithActions: Array<DataTableColumn<CallReason>> = [
    ...callReasonColumns.slice(0, 1),
    {
      key: 'company',
      header: 'Company',
      className: 'min-w-[14rem]',
      render: (item) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-100">{companyNameById.get(item.company_id) || 'Deleted company'}</div>
          <div className="text-xs text-slate-500">Company ID {item.company_id}</div>
        </div>
      ),
    },
    ...callReasonColumns.slice(1),
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[1%] whitespace-nowrap',
      render: (item) => (
        <AdminRowActions
          onEdit={() => openCallReasonEdit(item)}
          onDelete={() => openCallReasonDelete(item)}
          deleteDisabled={deleteState.loading && deleteState.section === 'callReasons' && deleteState.id === item.id}
        />
      ),
    },
  ]

  const auditLogColumns: Array<DataTableColumn<AuditLog>> = [
    {
      key: 'event_type',
      header: 'Event',
      className: 'min-w-[14rem]',
      render: (log) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-100">{humanizeToken(log.event_type)}</div>
          <div className="text-xs text-slate-500">Audit ID {log.id}</div>
        </div>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      className: 'min-w-[15rem]',
      render: (log) => {
        const company = log.resource_type === 'company' ? companyById.get(log.resource_id) : undefined
        const number = log.resource_type === 'verified_number' ? verifiedNumberById.get(log.resource_id) : undefined
        const reason = log.resource_type === 'call_reason' ? callReasonById.get(log.resource_id) : undefined
        const resourceName =
          company?.name ||
          number?.label ||
          reason?.title ||
          (log.resource_type === 'company'
            ? 'Deleted company'
            : log.resource_type === 'verified_number'
              ? 'Deleted verified number'
              : log.resource_type === 'call_reason'
                ? 'Deleted call reason'
                : formatResourceType(log.resource_type))

        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-100">{resourceName}</div>
            <div className="text-xs text-slate-500">
              {formatResourceType(log.resource_type)} ID {log.resource_id}
            </div>
          </div>
        )
      },
    },
    { key: 'message', header: 'Message', className: 'min-w-[22rem]', render: (log) => <span className="text-slate-300">{log.message}</span> },
    {
      key: 'created_at',
      header: 'Created At',
      className: 'min-w-[11rem]',
      render: (log) => <span className="text-slate-300">{new Date(log.created_at).toLocaleString()}</span>,
    },
  ]

  const activeDeleteFeedback = deleteState.section === activeSection ? deleteState : createInitialDeleteState()

  return (
    <main className="px-4 pb-10 pt-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <AdminOverview
          companyCount={companies.data.length}
          verifiedNumberCount={verifiedNumbers.data.length}
          callReasonCount={callReasons.data.length}
          callSessionCount={callSessions.data.length}
          auditLogCount={auditLogs.data.length}
        />

        <section className="flex flex-col gap-5 rounded-[32px] border border-slate-700/60 bg-slate-950/80 p-6 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Dataset navigation</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Manage trusted operations</h2>
            </div>
            <Button onClick={() => void refreshData()} className="w-full sm:w-auto" loading={refreshing} loadingLabel="Refreshing...">
              Refresh all data
            </Button>
          </div>

          <SectionTabs value={activeSection} onChange={setActiveSection} options={sectionOptions} />

          {activeSection === 'dashboard' ? (
            <AdminAnalyticsDashboard
              companyCount={companies.data.length}
              verifiedNumberCount={verifiedNumbers.data.length}
              callReasonCount={callReasons.data.length}
              callSessionCount={callSessions.data.length}
              auditLogCount={auditLogs.data.length}
              callSessions={callSessions.data}
              auditLogs={auditLogs.data}
            />
          ) : null}

          {activeSection === 'companies' ? (
            <>
              {deleteIntent?.section === 'companies' ? (
                <AdminDeleteConfirmation
                  title={deleteIntent.title}
                  description={deleteIntent.description}
                  warning={deleteIntent.warning}
                  confirmLabel={deleteIntent.confirmLabel}
                  onConfirm={() => void handleDeleteConfirm()}
                  onCancel={() => {
                    setDeleteIntent(null)
                    resetDeleteFeedback('companies')
                  }}
                  loading={deleteState.loading}
                  error={deleteState.error}
                />
              ) : null}
              {openCreateSection === 'companies' ? (
                <CreateCompanySection onCancel={() => setOpenCreateSection(null)} onSubmit={handleCompanyCreate} />
              ) : null}
              {editingCompany ? (
                <EditCompanySection company={editingCompany} onCancel={() => setEditingCompany(null)} onSubmit={handleCompanyUpdate} />
              ) : null}
              <AdminDataSection
                eyebrow="Companies view"
                title="Company registry"
                description="Organizations that can be matched to trusted phone numbers and call reasons."
                rows={filteredCompanies}
                columns={companyColumnsWithActions}
                getRowKey={(company) => company.id}
                loading={companies.loading}
                error={companies.error}
                emptyMessage={
                  companyFilterActive ? 'No companies match this search.' : 'Create the first company to start building the trusted caller registry.'
                }
                statusMessage={activeDeleteFeedback.success}
                toolbar={companyToolbar}
              />
            </>
          ) : null}

          {activeSection === 'verifiedNumbers' ? (
            <>
              {deleteIntent?.section === 'verifiedNumbers' ? (
                <AdminDeleteConfirmation
                  title={deleteIntent.title}
                  description={deleteIntent.description}
                  confirmLabel={deleteIntent.confirmLabel}
                  onConfirm={() => void handleDeleteConfirm()}
                  onCancel={() => {
                    setDeleteIntent(null)
                    resetDeleteFeedback('verifiedNumbers')
                  }}
                  loading={deleteState.loading}
                  error={deleteState.error}
                />
              ) : null}
              {openCreateSection === 'verifiedNumbers' ? (
                <CreateVerifiedNumberSection
                  companies={companies.data}
                  onCancel={() => setOpenCreateSection(null)}
                  onSubmit={handleVerifiedNumberCreate}
                />
              ) : null}
              {editingVerifiedNumber ? (
                <EditVerifiedNumberSection
                  companies={companies.data}
                  verifiedNumber={editingVerifiedNumber}
                  onCancel={() => setEditingVerifiedNumber(null)}
                  onSubmit={handleVerifiedNumberUpdate}
                />
              ) : null}
              <AdminDataSection
                eyebrow="Verified numbers view"
                title="Trusted phone numbers"
                description="Phone numbers that are safe to recognize during public lookup."
                rows={filteredVerifiedNumbers}
                columns={verifiedNumberColumnsWithActions}
                getRowKey={(number) => number.id}
                loading={verifiedNumbers.loading}
                error={verifiedNumbers.error}
                emptyMessage={
                  verifiedNumberFilterActive
                    ? 'No trusted numbers match this search.'
                    : 'Add a trusted phone number once at least one company exists.'
                }
                statusMessage={activeDeleteFeedback.success}
                tableMaxHeightClassName="max-h-[38rem]"
                toolbar={verifiedNumberToolbar}
              />
            </>
          ) : null}

          {activeSection === 'callReasons' ? (
            <>
              {deleteIntent?.section === 'callReasons' ? (
                <AdminDeleteConfirmation
                  title={deleteIntent.title}
                  description={deleteIntent.description}
                  confirmLabel={deleteIntent.confirmLabel}
                  onConfirm={() => void handleDeleteConfirm()}
                  onCancel={() => {
                    setDeleteIntent(null)
                    resetDeleteFeedback('callReasons')
                  }}
                  loading={deleteState.loading}
                  error={deleteState.error}
                />
              ) : null}
              {openCreateSection === 'callReasons' ? (
                <CreateCallReasonSection
                  companies={companies.data}
                  onCancel={() => setOpenCreateSection(null)}
                  onSubmit={handleCallReasonCreate}
                />
              ) : null}
              {editingCallReason ? (
                <EditCallReasonSection
                  companies={companies.data}
                  callReason={editingCallReason}
                  onCancel={() => setEditingCallReason(null)}
                  onSubmit={handleCallReasonUpdate}
                />
              ) : null}
              <AdminDataSection
                eyebrow="Call reasons view"
                title="Call reason catalog"
                description="Human-readable reasons that explain why a trusted company may be calling."
                rows={filteredCallReasons}
                columns={callReasonColumnsWithActions}
                getRowKey={(reason) => reason.id}
                loading={callReasons.loading}
                error={callReasons.error}
                emptyMessage={
                  callReasonFilterActive ? 'No call reasons match these filters.' : 'Create call reasons to make verified calls easier to understand.'
                }
                statusMessage={activeDeleteFeedback.success}
                tableMaxHeightClassName="max-h-[34rem]"
                toolbar={callReasonToolbar}
              />
            </>
          ) : null}

          {activeSection === 'callSessions' ? (
            <AdminDataSection
              eyebrow="Call sessions view"
              title="Recent call activity"
              description="Recent lookup activity with the clearest available company, number, and reason references."
              rows={filteredCallSessions}
              columns={callSessionColumnsWithResolvedRefs}
              getRowKey={(session) => session.id}
              loading={callSessions.loading}
              error={callSessions.error}
              emptyMessage={
                callSessionFilterActive
                  ? 'No call sessions match these filters.'
                  : 'Recent lookup activity will appear here once callers are checked.'
              }
              tableMaxHeightClassName="max-h-[42rem]"
              toolbar={callSessionToolbar}
            />
          ) : null}

          {activeSection === 'auditLogs' ? (
            <AdminDataSection
              eyebrow="Audit log view"
              title="Recent product activity"
              description="A readable trail of admin changes and product events."
              rows={filteredAuditLogs}
              columns={auditLogColumns}
              getRowKey={(log) => log.id}
              loading={auditLogs.loading}
              error={auditLogs.error}
              emptyMessage={
                auditLogFilterActive
                  ? 'No product activity matches these filters.'
                  : 'Product activity will appear here after the first create, update, delete, or lookup event.'
              }
              tableMaxHeightClassName="max-h-[42rem]"
              toolbar={auditLogToolbar}
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}
