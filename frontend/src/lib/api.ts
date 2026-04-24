import type {
  AccountType,
  AdminLoginResponse,
  AdminSession,
  CallCardData,
  AuditLog,
  CallSession,
  PortalBusinessWorkspace,
  PortalSession,
  CallReason,
  Company,
  CreateCallReasonPayload,
  CreateCompanyPayload,
  CreateVerifiedNumberPayload,
  UpdateCallReasonPayload,
  UpdateCompanyPayload,
  UpdateVerifiedNumberPayload,
  VerifiedNumber,
} from './types'

const API_BASE = 'http://localhost:8080'
const ADMIN_TOKEN_STORAGE_KEY = 'trust-platform-admin-token'
const PORTAL_TOKEN_STORAGE_KEY = 'trust-platform-portal-token'

let adminToken = typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) : null
let portalToken = typeof window !== 'undefined' ? window.localStorage.getItem(PORTAL_TOKEN_STORAGE_KEY) : null

function adminHeaders(headers?: HeadersInit): HeadersInit {
  return {
    ...headers,
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
  }
}

function portalHeaders(headers?: HeadersInit): HeadersInit {
  return {
    ...headers,
    ...(portalToken ? { Authorization: `Bearer ${portalToken}` } : {}),
  }
}

export function getStoredAdminToken() {
  return adminToken
}

export function getStoredPortalToken() {
  return portalToken
}

export function clearAdminToken() {
  adminToken = null
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function clearPortalToken() {
  portalToken = null
  window.localStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY)
}

function storeAdminToken(token: string) {
  adminToken = token
  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
}

function storePortalToken(token: string) {
  portalToken = token
  window.localStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, token)
}

async function readJson<T>(input: string, headers?: HeadersInit): Promise<T> {
  const url = new URL(input)
  url.searchParams.set('_ts', Date.now().toString())

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text()
  const message = text.trim()

  if (!message) {
    return fallback
  }

  return message
}

function findNestedArray<T>(value: unknown): T[] | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (Array.isArray(entry)) {
      return entry as T[]
    }
  }

  for (const entry of Object.values(value as Record<string, unknown>)) {
    const nestedArray = findNestedArray<T>(entry)
    if (nestedArray) {
      return nestedArray
    }
  }

  return null
}

function normalizeListPayload<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    for (const key of keys) {
      const value = record[key]
      if (Array.isArray(value)) {
        return value as T[]
      }
    }

    const arrayValues = Object.values(record).filter(Array.isArray)
    if (arrayValues.length === 1) {
      return arrayValues[0] as T[]
    }

    const nestedArray = findNestedArray<T>(record)
    if (nestedArray) {
      return nestedArray
    }
  }

  return []
}

async function readListJson<T>(input: string, keys: string[], headers?: HeadersInit): Promise<T[]> {
  const payload = await readJson<unknown>(input, headers)
  return normalizeListPayload<T>(payload, keys)
}

async function postJson<TResponse, TPayload>(
  input: string,
  payload: TPayload,
  fallbackError: string,
  headers?: HeadersInit
): Promise<TResponse> {
  return writeJson<TResponse, TPayload>('POST', input, payload, fallbackError, headers)
}

async function putJson<TResponse, TPayload>(
  input: string,
  payload: TPayload,
  fallbackError: string,
  headers?: HeadersInit
): Promise<TResponse> {
  return writeJson<TResponse, TPayload>('PUT', input, payload, fallbackError, headers)
}

async function deleteRequest(input: string, fallbackError: string): Promise<void> {
  const response = await fetch(input, {
    method: 'DELETE',
    headers: adminHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackError))
  }
}

async function writeJson<TResponse, TPayload>(
  method: 'POST' | 'PUT',
  input: string,
  payload: TPayload,
  fallbackError: string,
  headers?: HeadersInit
): Promise<TResponse> {
  const response = await fetch(input, {
    method,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackError))
  }

  return response.json() as Promise<TResponse>
}

export async function lookupCallCard(phoneNumber: string): Promise<CallCardData> {
  const url = new URL(`${API_BASE}/call-card`)
  url.searchParams.set('phone_number', phoneNumber)

  return readJson<CallCardData>(url.toString())
}

export async function reportSpam(phoneNumber: string): Promise<void> {
  const response = await fetch(`${API_BASE}/report-spam`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone_number: phoneNumber }),
  })

  if (!response.ok) {
    throw new Error('Spam report request failed')
  }
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const response = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Invalid admin credentials.'))
  }

  const payload = (await response.json()) as AdminLoginResponse
  storeAdminToken(payload.token)
  return payload.session
}

export async function validateAdminSession(): Promise<AdminSession> {
  if (!adminToken) {
    throw new Error('No active admin session.')
  }

  return readJson<AdminSession>(`${API_BASE}/admin/auth/me`, adminHeaders())
}

export async function logoutAdmin(): Promise<void> {
  if (!adminToken) {
    clearAdminToken()
    return
  }

  try {
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      headers: adminHeaders(),
    })
  } finally {
    clearAdminToken()
  }
}

export async function signUpPersonalPortal(payload: {
  full_name: string
  email: string
  phone_number: string
  password: string
}): Promise<PortalSession> {
  const session = await postJson<PortalSession, typeof payload>(
    `${API_BASE}/portal/auth/signup/personal`,
    payload,
    'Failed to create personal account.'
  )
  storePortalToken(session.token)
  return session
}

export async function signUpBusinessPortal(payload: {
  full_name: string
  work_email: string
  password: string
  company_name: string
  business_id: string
  phone_number: string
}): Promise<PortalSession> {
  const session = await postJson<PortalSession, typeof payload>(
    `${API_BASE}/portal/auth/signup/business`,
    payload,
    'Failed to create business account.'
  )
  storePortalToken(session.token)
  return session
}

export async function loginPortal(email: string, password: string, accountType: AccountType): Promise<PortalSession> {
  const session = await postJson<PortalSession, { email: string; password: string; account_type: AccountType }>(
    `${API_BASE}/portal/auth/login`,
    { email, password, account_type: accountType },
    'Invalid portal credentials.'
  )
  storePortalToken(session.token)
  return session
}

export async function validatePortalSession(): Promise<PortalSession> {
  if (!portalToken) {
    throw new Error('No active portal session.')
  }

  return readJson<PortalSession>(`${API_BASE}/portal/auth/me`, portalHeaders())
}

export async function logoutPortal(): Promise<void> {
  if (!portalToken) {
    clearPortalToken()
    return
  }

  try {
    await fetch(`${API_BASE}/portal/auth/logout`, {
      method: 'POST',
      headers: portalHeaders(),
    })
  } finally {
    clearPortalToken()
  }
}

export async function getPortalBusinessWorkspace(): Promise<PortalBusinessWorkspace> {
  return readJson<PortalBusinessWorkspace>(`${API_BASE}/portal/business/workspace`, portalHeaders())
}

export async function updatePortalBusinessCompany(payload: UpdateCompanyPayload): Promise<Company> {
  return putJson<Company, UpdateCompanyPayload>(
    `${API_BASE}/portal/business/company`,
    payload,
    'Failed to update business company.',
    portalHeaders()
  )
}

export async function createPortalVerifiedNumber(payload: { phone_number: string; label: string }): Promise<VerifiedNumber> {
  return postJson<VerifiedNumber, typeof payload>(
    `${API_BASE}/portal/business/verified-numbers`,
    payload,
    'Failed to create trusted number.',
    portalHeaders()
  )
}

export async function createPortalCallReason(payload: {
  title: string
  description: string
  priority: string
  expires_at?: string
}): Promise<CallReason> {
  return postJson<CallReason, typeof payload>(
    `${API_BASE}/portal/business/call-reasons`,
    payload,
    'Failed to create call reason.',
    portalHeaders()
  )
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  return postJson<Company, CreateCompanyPayload>(`${API_BASE}/companies`, payload, 'Failed to create company.', adminHeaders())
}

export async function updateCompany(id: number, payload: UpdateCompanyPayload): Promise<Company> {
  return putJson<Company, UpdateCompanyPayload>(`${API_BASE}/companies/${id}`, payload, 'Failed to update company.', adminHeaders())
}

export async function deleteCompany(id: number): Promise<void> {
  return deleteRequest(`${API_BASE}/companies/${id}`, 'Failed to delete company.')
}

export async function createVerifiedNumber(payload: CreateVerifiedNumberPayload): Promise<VerifiedNumber> {
  return postJson<VerifiedNumber, CreateVerifiedNumberPayload>(
    `${API_BASE}/verified-numbers`,
    payload,
    'Failed to create verified number.',
    adminHeaders()
  )
}

export async function updateVerifiedNumber(id: number, payload: UpdateVerifiedNumberPayload): Promise<VerifiedNumber> {
  return putJson<VerifiedNumber, UpdateVerifiedNumberPayload>(
    `${API_BASE}/verified-numbers/${id}`,
    payload,
    'Failed to update verified number.',
    adminHeaders()
  )
}

export async function deleteVerifiedNumber(id: number): Promise<void> {
  return deleteRequest(`${API_BASE}/verified-numbers/${id}`, 'Failed to delete verified number.')
}

export async function createCallReason(payload: CreateCallReasonPayload): Promise<CallReason> {
  return postJson<CallReason, CreateCallReasonPayload>(`${API_BASE}/call-reasons`, payload, 'Failed to create call reason.', adminHeaders())
}

export async function updateCallReason(id: number, payload: UpdateCallReasonPayload): Promise<CallReason> {
  return putJson<CallReason, UpdateCallReasonPayload>(`${API_BASE}/call-reasons/${id}`, payload, 'Failed to update call reason.', adminHeaders())
}

export async function deleteCallReason(id: number): Promise<void> {
  return deleteRequest(`${API_BASE}/call-reasons/${id}`, 'Failed to delete call reason.')
}

export async function listCompanies(): Promise<Company[]> {
  return readListJson<Company>(`${API_BASE}/companies`, ['companies', 'company', 'data', 'items', 'results'], adminHeaders())
}

export async function listVerifiedNumbers(): Promise<VerifiedNumber[]> {
  return readListJson<VerifiedNumber>(`${API_BASE}/verified-numbers`, [
    'verified_numbers',
    'verifiedNumbers',
    'verified_number',
    'verifiedNumber',
    'numbers',
    'data',
    'items',
    'results',
  ], adminHeaders())
}

export async function listCallReasons(): Promise<CallReason[]> {
  return readListJson<CallReason>(`${API_BASE}/call-reasons`, [
    'call_reasons',
    'callReasons',
    'call_reason',
    'callReason',
    'reasons',
    'data',
    'items',
    'results',
  ], adminHeaders())
}

export async function listCallSessions(): Promise<CallSession[]> {
  return readListJson<CallSession>(`${API_BASE}/call-sessions`, [
    'call_sessions',
    'callSessions',
    'call_session',
    'callSession',
    'sessions',
    'data',
    'items',
    'results',
  ], adminHeaders())
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  return readListJson<AuditLog>(`${API_BASE}/audit-logs`, [
    'audit_logs',
    'auditLogs',
    'audit_log',
    'auditLog',
    'logs',
    'data',
    'items',
    'results',
  ], adminHeaders())
}
