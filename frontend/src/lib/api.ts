import type { CallCardData, CallReason, Company, VerifiedNumber } from './types'

const API_BASE = 'http://localhost:8080'

async function readJson<T>(input: string): Promise<T> {
  const url = new URL(input)
  url.searchParams.set('_ts', Date.now().toString())

  const response = await fetch(url.toString(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
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

async function readListJson<T>(input: string, keys: string[]): Promise<T[]> {
  const payload = await readJson<unknown>(input)
  return normalizeListPayload<T>(payload, keys)
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

export async function listCompanies(): Promise<Company[]> {
  return readListJson<Company>(`${API_BASE}/companies`, ['companies', 'company', 'data', 'items', 'results'])
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
  ])
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
  ])
}
