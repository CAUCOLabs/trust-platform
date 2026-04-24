export type RiskLevel = 'low' | 'medium' | 'high'
export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'info'
export type AppView = 'public' | 'portal' | 'internal'
export type AccountType = 'personal' | 'business'

export interface AdminSession {
  username: string
  role: 'admin'
  expires_at: string
}

export interface AdminLoginResponse {
  token: string
  session: AdminSession
  expires_at: string
}

export interface PortalCompanySummary {
  id: number
  name: string
  business_id: string
  phone_number: string
  verified: boolean
  verified_number_count: number
  active_call_reason_count: number
}

export interface PortalAccount {
  id: number
  account_type: AccountType
  email: string
  full_name: string
  phone_number: string
  company?: PortalCompanySummary
  created_at: string
}

export interface PortalSession {
  token: string
  account: PortalAccount
  expires_at: string
}

export interface PortalBusinessWorkspace {
  company: Company
  verified_numbers: VerifiedNumber[]
  call_reasons: CallReason[]
}

export interface CallCardData {
  found: boolean
  phone_number?: string
  company_name?: string
  risk_level?: RiskLevel
  summary?: string
  label?: string
  verified?: boolean
  trust_score?: number
  spam_reports?: number
  lookup_count?: number
  reason_title?: string
  reason_description?: string
  priority?: string
  recommendation?: string
}

export interface Company {
  id: number
  name: string
  business_id: string
  phone_number: string
  verified: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateCompanyPayload {
  name: string
  business_id: string
  phone_number: string
}

export interface UpdateCompanyPayload {
  name: string
  business_id: string
  phone_number: string
}

export interface VerifiedNumber {
  id: number
  company_id: number
  phone_number: string
  label: string
  verified: boolean
  created_at?: string
}

export interface CreateVerifiedNumberPayload {
  company_id: number
  phone_number: string
  label: string
}

export interface UpdateVerifiedNumberPayload {
  company_id: number
  phone_number: string
  label: string
}

export interface CallReason {
  id: number
  company_id: number
  title: string
  description: string
  active: boolean
  priority: string
  expires_at?: string | null
  created_at?: string
}

export interface CreateCallReasonPayload {
  company_id: number
  title: string
  description: string
  priority: string
  expires_at?: string
}

export interface UpdateCallReasonPayload {
  company_id: number
  title: string
  description: string
  priority: string
  expires_at?: string
}

export interface CallSession {
  id: number
  phone_number: string
  company_id?: number
  company_name?: string
  verified_number_id?: number
  verified_number_phone?: string
  verified_number_label?: string
  call_reason_id?: number
  call_reason_title?: string
  risk_level: string
  trust_score: number
  created_at: string
}

export interface AuditLog {
  id: number
  event_type: string
  resource_type: string
  resource_id: number
  message: string
  created_at: string
}
