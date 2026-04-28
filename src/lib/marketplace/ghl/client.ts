// GHL marketplace API client.
//
// Wraps the small set of REST calls the marketplace app makes:
//   - exchange OAuth code for tokens
//   - enumerate installed locations (bulk install)
//   - mint per-location tokens
//   - read/write Custom Values on a location
//   - upsert/tag contacts (used by the 6h sync cron)
//
// All calls go through getValidAccessTokenForInstall() upstream for
// proactive refresh. This client itself is stateless.

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

interface GhlError extends Error {
  status?: number
}

async function ghlFetch<T>(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<T> {
  const { accessToken, ...rest } = init
  const res = await fetch(`${GHL_API_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Version: GHL_API_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(rest.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`GHL ${path} → ${res.status}: ${text}`) as GhlError
    err.status = res.status
    throw err
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// OAuth token exchange
// ---------------------------------------------------------------------------

export interface GhlTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  userType?: 'Company' | 'Location'
  locationId?: string
  companyId?: string
  userId?: string
}

export async function exchangeGhlCode(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<GhlTokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
  })

  const res = await fetch(`${GHL_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GHL token exchange failed: ${res.status} — ${text}`)
  }

  return res.json() as Promise<GhlTokenResponse>
}

// ---------------------------------------------------------------------------
// Bulk install — enumerate agency's locations and get per-location tokens
// ---------------------------------------------------------------------------

export interface GhlInstalledLocation {
  _id: string
  name: string
  address?: string
  isInstalled: boolean
}

export async function listInstalledLocations(params: {
  agencyAccessToken: string
  appId: string
  companyId: string
  limit?: number
}): Promise<GhlInstalledLocation[]> {
  const url = `/oauth/installedLocations?appId=${encodeURIComponent(params.appId)}&companyId=${encodeURIComponent(params.companyId)}&limit=${params.limit ?? 500}`

  const json = await ghlFetch<{ locations: GhlInstalledLocation[] }>(url, {
    method: 'GET',
    accessToken: params.agencyAccessToken,
  })

  return json.locations ?? []
}

export interface GhlLocationToken {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
  locationId: string
  userId?: string
}

export async function mintLocationToken(params: {
  agencyAccessToken: string
  companyId: string
  locationId: string
}): Promise<GhlLocationToken> {
  const body = new URLSearchParams({
    companyId: params.companyId,
    locationId: params.locationId,
  })

  return ghlFetch<GhlLocationToken>('/oauth/locationToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    accessToken: params.agencyAccessToken,
  })
}

// ---------------------------------------------------------------------------
// Custom Values on a location
// ---------------------------------------------------------------------------

export interface GhlCustomValue {
  id?: string
  name: string
  fieldKey?: string
  value: string
}

export async function listCustomValues(params: {
  accessToken: string
  locationId: string
}): Promise<GhlCustomValue[]> {
  const json = await ghlFetch<{ customValues: GhlCustomValue[] }>(
    `/locations/${encodeURIComponent(params.locationId)}/customValues`,
    { method: 'GET', accessToken: params.accessToken },
  )
  return json.customValues ?? []
}

export async function upsertCustomValue(params: {
  accessToken: string
  locationId: string
  name: string
  value: string
}): Promise<GhlCustomValue> {
  // Try to find existing
  const existing = await listCustomValues({
    accessToken: params.accessToken,
    locationId: params.locationId,
  })
  const match = existing.find((cv) => cv.name === params.name)

  if (match?.id) {
    return ghlFetch<GhlCustomValue>(
      `/locations/${encodeURIComponent(params.locationId)}/customValues/${encodeURIComponent(match.id)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: params.name, value: params.value }),
        accessToken: params.accessToken,
      },
    )
  }

  return ghlFetch<GhlCustomValue>(
    `/locations/${encodeURIComponent(params.locationId)}/customValues`,
    {
      method: 'POST',
      body: JSON.stringify({ name: params.name, value: params.value }),
      accessToken: params.accessToken,
    },
  )
}

// ---------------------------------------------------------------------------
// Contact upsert + tagging (used by 6h visitor sync)
// ---------------------------------------------------------------------------

export interface GhlContactInput {
  locationId: string
  email?: string
  phone?: string // E.164 format required
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  postalCode?: string
  companyName?: string
  tags?: string[]
  source?: string
  customFields?: Array<{ key: string; field_value: string }>
}

export async function upsertContact(params: {
  accessToken: string
  contact: GhlContactInput
}): Promise<{ contact: { id: string; email?: string; phone?: string } }> {
  return ghlFetch<{ contact: { id: string; email?: string; phone?: string } }>(
    '/contacts/upsert',
    {
      method: 'POST',
      body: JSON.stringify(params.contact),
      accessToken: params.accessToken,
    },
  )
}

export async function addContactTags(params: {
  accessToken: string
  contactId: string
  tags: string[]
}): Promise<void> {
  await ghlFetch(
    `/contacts/${encodeURIComponent(params.contactId)}/tags`,
    {
      method: 'POST',
      body: JSON.stringify({ tags: params.tags }),
      accessToken: params.accessToken,
    },
  )
}

/**
 * Convert a phone number to E.164 format (+1XXXXXXXXXX for US).
 * Returns null if the input can't be normalized to a valid E.164 number.
 */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  // Already E.164-ish (starts with country code, 10–15 digits)
  if (raw.startsWith('+')) {
    return raw.replace(/[^\d+]/g, '')
  }
  // US default: 10 digits → +1XXXXXXXXXX, 11 digits starting with 1 → +1XXXXXXXXXX
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}
