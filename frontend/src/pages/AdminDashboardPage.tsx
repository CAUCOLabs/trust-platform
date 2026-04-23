import { useEffect, useRef, useState } from 'react'
import { AdminDataSection } from '../components/blocks/AdminDataSection'
import { AdminOverview } from '../components/blocks/AdminOverview'
import { BooleanBadge } from '../components/ui/BooleanBadge'
import { Button } from '../components/ui/Button'
import type { DataTableColumn } from '../components/ui/DataTable'
import { SectionTabs } from '../components/ui/SectionTabs'
import { listCallReasons, listCompanies, listVerifiedNumbers } from '../lib/api'
import type { CallReason, Company, VerifiedNumber } from '../lib/types'

type AdminSection = 'companies' | 'verifiedNumbers' | 'callReasons'

interface ResourceState<T> {
  data: T[]
  loading: boolean
  error: string | null
}

const companyColumns: Array<DataTableColumn<Company>> = [
  { key: 'id', header: 'ID', render: (company) => <span className="font-medium text-white">{company.id}</span> },
  { key: 'name', header: 'Name', render: (company) => company.name },
  { key: 'business_id', header: 'Business ID', render: (company) => <span className="font-mono text-slate-300">{company.business_id}</span> },
  { key: 'phone_number', header: 'Phone Number', render: (company) => <span className="font-mono text-slate-300">{company.phone_number}</span> },
  { key: 'verified', header: 'Verified', render: (company) => <BooleanBadge value={company.verified} trueLabel="Verified" falseLabel="Pending" /> },
]

const verifiedNumberColumns: Array<DataTableColumn<VerifiedNumber>> = [
  { key: 'id', header: 'ID', render: (number) => <span className="font-medium text-white">{number.id}</span> },
  { key: 'company_id', header: 'Company ID', render: (number) => number.company_id },
  { key: 'phone_number', header: 'Phone Number', render: (number) => <span className="font-mono text-slate-300">{number.phone_number}</span> },
  { key: 'label', header: 'Label', render: (number) => number.label },
  { key: 'verified', header: 'Verified', render: (number) => <BooleanBadge value={number.verified} trueLabel="Verified" falseLabel="Pending" /> },
]

const callReasonColumns: Array<DataTableColumn<CallReason>> = [
  { key: 'id', header: 'ID', render: (reason) => <span className="font-medium text-white">{reason.id}</span> },
  { key: 'company_id', header: 'Company ID', render: (reason) => reason.company_id },
  { key: 'title', header: 'Title', render: (reason) => reason.title },
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

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('companies')
  const [companies, setCompanies] = useState<ResourceState<Company>>(createInitialState)
  const [verifiedNumbers, setVerifiedNumbers] = useState<ResourceState<VerifiedNumber>>(createInitialState)
  const [callReasons, setCallReasons] = useState<ResourceState<CallReason>>(createInitialState)
  const [refreshing, setRefreshing] = useState(false)
  const latestRefreshId = useRef(0)

  async function refreshData() {
    const refreshId = latestRefreshId.current + 1
    latestRefreshId.current = refreshId
    setRefreshing(true)
    setCompanies((current) => ({ ...current, loading: true, error: null }))
    setVerifiedNumbers((current) => ({ ...current, loading: true, error: null }))
    setCallReasons((current) => ({ ...current, loading: true, error: null }))

    const [companiesResult, verifiedNumbersResult, callReasonsResult] = await Promise.allSettled([
      listCompanies(),
      listVerifiedNumbers(),
      listCallReasons(),
    ])

    if (refreshId !== latestRefreshId.current) {
      return
    }

    setCompanies({
      data: companiesResult.status === 'fulfilled' ? companiesResult.value : [],
      loading: false,
      error: companiesResult.status === 'rejected' ? 'Could not load companies.' : null,
    })

    setVerifiedNumbers({
      data: verifiedNumbersResult.status === 'fulfilled' ? verifiedNumbersResult.value : [],
      loading: false,
      error: verifiedNumbersResult.status === 'rejected' ? 'Could not load verified numbers.' : null,
    })

    setCallReasons({
      data: callReasonsResult.status === 'fulfilled' ? callReasonsResult.value : [],
      loading: false,
      error: callReasonsResult.status === 'rejected' ? 'Could not load call reasons.' : null,
    })
    setRefreshing(false)
  }

  useEffect(() => {
    void refreshData()
  }, [])

  const sectionOptions = [
    { value: 'companies' as const, label: 'Companies', count: companies.data.length },
    { value: 'verifiedNumbers' as const, label: 'Verified Numbers', count: verifiedNumbers.data.length },
    { value: 'callReasons' as const, label: 'Call Reasons', count: callReasons.data.length },
  ]

  return (
    <main className="px-4 pb-10 pt-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <AdminOverview
          companyCount={companies.data.length}
          verifiedNumberCount={verifiedNumbers.data.length}
          callReasonCount={callReasons.data.length}
        />

        <section className="flex flex-col gap-5 rounded-[32px] border border-slate-700/60 bg-slate-950/80 p-6 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Dataset navigation</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Inspect backend records</h2>
            </div>
            <Button onClick={() => void refreshData()} className="w-full sm:w-auto" loading={refreshing} loadingLabel="Refreshing...">
              Refresh all data
            </Button>
          </div>

          <SectionTabs value={activeSection} onChange={setActiveSection} options={sectionOptions} />

          {activeSection === 'companies' ? (
            <AdminDataSection
              eyebrow="Companies view"
              title="Company registry"
              description="Live records from `GET /companies`, focused on the primary company fields exposed by the backend."
              rows={companies.data}
              columns={companyColumns}
              getRowKey={(company) => company.id}
              loading={companies.loading}
              error={companies.error}
              emptyMessage="No companies are available from the backend yet."
            />
          ) : null}

          {activeSection === 'verifiedNumbers' ? (
            <AdminDataSection
              eyebrow="Verified numbers view"
              title="Trusted phone numbers"
              description="Live records from `GET /verified-numbers`, showing which numbers are attached to which companies."
              rows={verifiedNumbers.data}
              columns={verifiedNumberColumns}
              getRowKey={(number) => number.id}
              loading={verifiedNumbers.loading}
              error={verifiedNumbers.error}
              emptyMessage="No verified numbers are available from the backend yet."
            />
          ) : null}

          {activeSection === 'callReasons' ? (
            <AdminDataSection
              eyebrow="Call reasons view"
              title="Call reason catalog"
              description="Live records from `GET /call-reasons`, including activity and priority details."
              rows={callReasons.data}
              columns={callReasonColumns}
              getRowKey={(reason) => reason.id}
              loading={callReasons.loading}
              error={callReasons.error}
              emptyMessage="No call reasons are available from the backend yet."
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}
