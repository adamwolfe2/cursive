/**
 * Reseller / White-Label Layer — Shared Types
 */

export type ResellerStatus = 'active' | 'suspended'
export type PeriodKind = 'month' | 'day'
export type ResellerPixelStatus = 'active' | 'inactive'

export type DeliveryOutcome =
  | 'delivered'
  | 'throttled'
  | 'skipped_cap'
  | 'failed'
  | 'no_destination'
  // Distinct skip reasons so inactive/suspended skips are not miscounted as
  // cap skips in the daily rollup (see reseller_record_delivery).
  | 'skipped_inactive'
  | 'skipped_suspended'

export interface Reseller {
  id: string
  name: string
  status: ResellerStatus
  period_kind: PeriodKind
  lead_cap_per_period: number | null
  default_lead_cap_per_period: number | null
  default_throttle_mode: boolean
  period_start: string // YYYY-MM-DD
  leads_delivered_period: number
  leads_delivered_lifetime: number
  billing_external_ref: string | null
  created_at: string
  updated_at: string
}

export interface ResellerApiKey {
  id: string
  reseller_id: string
  key_hash: string
  key_prefix: string
  name: string | null
  scopes: string[]
  last_used_at: string | null
  revoked: boolean
  created_at: string
}

export interface ResellerPixel {
  id: string
  reseller_id: string
  workspace_id: string
  pixel_id: string
  external_customer_ref: string
  website_url: string
  domain: string | null
  status: ResellerPixelStatus
  destination_url: string | null
  signing_secret: string | null
  lead_cap_per_period: number | null
  throttle_mode: boolean | null
  period_start: string
  leads_delivered_period: number
  leads_delivered_lifetime: number
  last_delivered_at: string | null
  created_at: string
  updated_at: string
}

/** Decision returned by the pure metering logic. */
export interface DeliveryDecision {
  deliver: boolean
  throttled: boolean
  /** Present when deliver=false. One of the cap reasons. */
  reason?: 'reseller_cap' | 'pixel_cap' | 'inactive' | 'reseller_suspended'
}

/** Outbound lead payload shape delivered to a partner endpoint. */
export interface OutboundLeadPayload {
  event: 'lead.identified'
  pixel_id: string
  external_customer_ref: string
  identified_at: string
  throttled: boolean
  lead: {
    email: string | null
    first_name: string | null
    last_name: string | null
    full_name: string | null
    company: {
      name: string | null
      domain: string | null
      title: string | null
    }
    location: {
      city: string | null
      state: string | null
    } | null
    phone: string | null
  }
}

/** Minimal lead row shape consumed by the payload builder. */
export interface LeadRow {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
  phone: string | null
  city: string | null
  state: string | null
  state_code: string | null
  created_at: string | null
}
