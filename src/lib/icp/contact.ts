import type { IcpProfile } from './profile'
import type { IcpFitInput } from './score'

export interface LeadContact {
  email: string | null
  secondaryEmail: string | null
  /** B2B workspace + work email + full name + company: deliverable even without an AL-verified email. */
  b2bQualified: boolean
}

/**
 * Which email a lead is created under. B2B workspaces (preferWorkEmail) get the
 * work email as primary and keep the personal address as secondary; everyone
 * else keeps the field-map's primary selection unchanged.
 */
export function resolveLeadContact(
  normalized: { primary_email: string | null; first_name: string | null; last_name: string | null; company_name: string | null },
  icp: IcpProfile | null,
  icpInput: IcpFitInput | null
): LeadContact {
  const primary = normalized.primary_email?.toLowerCase() || null
  const work = icpInput?.workEmail?.toLowerCase() || null
  if (!icp || !icp.preferWorkEmail || !work) {
    return { email: primary, secondaryEmail: null, b2bQualified: false }
  }
  return {
    email: work,
    secondaryEmail: primary && primary !== work ? primary : null,
    b2bQualified: !!(normalized.first_name && normalized.last_name && normalized.company_name?.trim()),
  }
}
