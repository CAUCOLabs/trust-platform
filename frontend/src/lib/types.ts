export type RiskLevel = 'low' | 'medium' | 'high'
export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'info'
export type AppView = 'lookup' | 'admin'

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
}

export interface VerifiedNumber {
  id: number
  company_id: number
  phone_number: string
  label: string
  verified: boolean
}

export interface CallReason {
  id: number
  company_id: number
  title: string
  description: string
  active: boolean
  priority: string
}
