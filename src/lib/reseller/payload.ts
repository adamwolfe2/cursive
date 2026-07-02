/**
 * Reseller Outbound Payload Builder (pure)
 *
 * Builds the documented `lead.identified` payload from a normalized lead row.
 * When `throttled` is true, the payload is reduced to name + company + email
 * (phone, job title, and location are dropped) as a pricing lever.
 */

import type { LeadRow, OutboundLeadPayload } from './types'

export function buildOutboundPayload(params: {
  lead: LeadRow
  pixelId: string
  externalCustomerRef: string
  throttled: boolean
}): OutboundLeadPayload {
  const { lead, pixelId, externalCustomerRef, throttled } = params

  const identifiedAt = lead.created_at ?? new Date().toISOString()

  return {
    event: 'lead.identified',
    pixel_id: pixelId,
    external_customer_ref: externalCustomerRef,
    identified_at: identifiedAt,
    throttled,
    lead: {
      email: lead.email ?? null,
      first_name: lead.first_name ?? null,
      last_name: lead.last_name ?? null,
      full_name:
        lead.full_name ??
        ([lead.first_name, lead.last_name].filter(Boolean).join(' ') || null),
      company: {
        name: lead.company_name ?? null,
        domain: lead.company_domain ?? null,
        // Reduced payload drops job title.
        title: throttled ? null : lead.job_title ?? null,
      },
      // Reduced payload drops location entirely.
      location: throttled
        ? null
        : {
            city: lead.city ?? null,
            state: lead.state_code ?? lead.state ?? null,
          },
      // Reduced payload drops phone.
      phone: throttled ? null : lead.phone ?? null,
    },
  }
}
