// RabbitSign E-Signature API Client
// Handles contract/SOW creation from templates for client onboarding

import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RABBITSIGN_API_URL = 'https://www.rabbitsign.com/api/v1'

function getConfig() {
  const keyId = process.env.RABBITSIGN_API_KEY_ID
  const secret = process.env.RABBITSIGN_API_SECRET

  if (!keyId) throw new Error('RABBITSIGN_API_KEY_ID not configured')
  if (!secret) throw new Error('RABBITSIGN_API_SECRET not configured')

  return { keyId, secret }
}

// ---------------------------------------------------------------------------
// Authentication — SHA-512 signature
// ---------------------------------------------------------------------------

function generateTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function generateSignature(method: string, path: string, timestamp: string, secret: string): string {
  const payload = `${method.toUpperCase()} ${path} ${timestamp} ${secret}`
  return createHash('sha512').update(payload).digest('hex').toUpperCase()
}

function buildHeaders(method: string, path: string): Record<string, string> {
  const { keyId, secret } = getConfig()
  const timestamp = generateTimestamp()
  const signature = generateSignature(method, path, timestamp, secret)

  return {
    'Content-Type': 'application/json',
    'x-rabbitsign-api-time-utc': timestamp,
    'x-rabbitsign-api-key-id': keyId,
    'x-rabbitsign-api-signature': signature,
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RabbitSignFolder {
  folderId: string
}

export interface RabbitSignFolderStatus {
  folderId: string
  title: string
  signers: Array<{
    name: string
    email: string
    status: 'NOTIFIED' | 'SIGNED'
  }>
  downloadUrl?: string
}

interface CreateFromTemplateParams {
  templateId: string
  title: string
  summary?: string
  senderFieldValues: Record<string, string>
  roles: Array<{
    roleName: string
    signerName: string
    signerEmail: string
  }>
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

/**
 * Create a contract folder from a pre-built template.
 * The template must be created in RabbitSign's UI first.
 */
export async function createContractFromTemplate(
  params: CreateFromTemplateParams
): Promise<RabbitSignFolder> {
  const path = `/api/v1/folderFromTemplate/${params.templateId}`
  const headers = buildHeaders('POST', path)

  const today = new Date().toISOString().split('T')[0]

  const response = await fetch(`${RABBITSIGN_API_URL.replace('/api/v1', '')}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: params.title,
      summary: params.summary || '',
      date: today,
      senderFieldValues: params.senderFieldValues,
      roles: params.roles,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(`RabbitSign API error ${response.status}: ${errorBody.slice(0, 200)}`)
  }

  return response.json()
}

/**
 * Get the current status of a folder (signing progress).
 */
export async function getFolderStatus(folderId: string): Promise<RabbitSignFolderStatus> {
  const path = `/api/v1/folder/${folderId}`
  const headers = buildHeaders('GET', path)

  const response = await fetch(`${RABBITSIGN_API_URL.replace('/api/v1', '')}${path}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(`RabbitSign API error ${response.status}: ${errorBody.slice(0, 200)}`)
  }

  return response.json()
}

/**
 * Send a reminder to unsigned parties.
 */
export async function sendReminder(folderId: string): Promise<void> {
  const path = `/api/v1/folder-notify/${folderId}`
  const headers = buildHeaders('POST', path)

  const response = await fetch(`${RABBITSIGN_API_URL.replace('/api/v1', '')}${path}`, {
    method: 'POST',
    headers,
    body: '{}',
  })

  if (!response.ok) {
    throw new Error(`RabbitSign reminder failed: ${response.status}`)
  }
}

/**
 * Cancel a folder (prevent further signing).
 */
export async function cancelFolder(folderId: string): Promise<void> {
  const path = `/api/v1/folder-cancel/${folderId}`
  const headers = buildHeaders('PUT', path)

  const response = await fetch(`${RABBITSIGN_API_URL.replace('/api/v1', '')}${path}`, {
    method: 'PUT',
    headers,
    body: '{}',
  })

  if (!response.ok) {
    throw new Error(`RabbitSign cancel failed: ${response.status}`)
  }
}

/**
 * Verify a webhook signature from RabbitSign.
 */
export function verifyWebhookSignature(
  method: string,
  path: string,
  timestamp: string,
  receivedSignature: string
): boolean {
  const { secret } = getConfig()
  const expectedSignature = generateSignature(method, path, timestamp, secret)
  return expectedSignature === receivedSignature
}

/**
 * Build sender field values for a Cursive SOW contract template.
 * Maps deal data to the template's sender-fillable fields.
 * Field names must match what's defined in the RabbitSign template.
 */
export function buildContractFields(params: {
  companyName: string
  contactName: string
  contactEmail: string
  setupFee: number
  monthlyFee: number
  infraMonthly: number
  domainAnnualCost?: number
  inboxMonthlyCost?: number
  domains?: number
  inboxes?: number
  emailsPerMonth?: number
  packages: string[]
  billingCadence: string
  outboundTier: string | null
  outboundTierName?: string
  initialTerm?: string        // e.g. "3 months", "6 months"
  startDate: string
  notes?: string
}): Record<string, string> {
  const domainAnnual = params.domainAnnualCost ?? params.infraMonthly * 12
  const inboxMonthly = params.inboxMonthlyCost ?? params.infraMonthly
  const domains = params.domains ?? 0
  const inboxes = params.inboxes ?? 0
  const emailsPerMonth = params.emailsPerMonth ?? 0

  const effectiveDateFormatted = new Date(params.startDate + 'T00:00:00').toLocaleDateString(
    'en-US', { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const cadenceLabel: Record<string, string> = {
    monthly: 'Month-to-Month',
    quarterly: 'Quarterly',
    annual: 'Annual',
  }

  const engagementType = params.outboundTierName
    ? `Outbound Email Activation — ${params.outboundTierName} Tier`
    : 'Outbound Email Activation'

  const targetSendVolume = emailsPerMonth > 0
    ? `${emailsPerMonth.toLocaleString()} emails/month`
    : params.outboundTier
      ? `See ${params.outboundTier} tier`
      : 'Per agreed scope'

  const domainsAndInboxes = domains > 0 || inboxes > 0
    ? `${domains} sending domain${domains !== 1 ? 's' : ''}, ${inboxes} inbox${inboxes !== 1 ? 'es' : ''}`
    : 'Per agreed scope'

  return {
    // ── Commercial Summary table fields ─────────────────────────
    client_company: params.companyName,
    engagement_type: engagementType,
    effective_date: effectiveDateFormatted,
    initial_term: params.initialTerm || '3 months',
    target_send_volume: targetSendVolume,
    domains_and_inboxes: domainsAndInboxes,
    delivery_method: 'Cold Email (SMTP)',

    // ── Body / fee fields ────────────────────────────────────────
    client_name: params.contactName,
    client_email: params.contactEmail,
    setup_fee: `$${params.setupFee.toLocaleString()}`,
    monthly_fee: `$${params.monthlyFee.toLocaleString()}`,
    infra_monthly: `$${params.infraMonthly.toFixed(2)}`,
    domain_annual: `$${domainAnnual.toFixed(2)}`,
    inbox_monthly: `$${inboxMonthly.toFixed(2)}`,
    total_monthly: `$${(params.monthlyFee + params.infraMonthly).toLocaleString()}`,
    packages: params.packages.join(', ') || 'Standard',
    billing_cadence: cadenceLabel[params.billingCadence] ?? params.billingCadence,
    outbound_tier: params.outboundTierName || params.outboundTier || 'Custom',
    start_date: effectiveDateFormatted,
    date: effectiveDateFormatted,
    notes: params.notes || '',
  }
}
