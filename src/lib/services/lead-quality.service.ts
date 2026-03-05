/**
 * Lead Quality Gate
 *
 * Shared quality check applied at all lead insertion paths.
 * Ensures every lead delivered to users has the minimum data
 * required to be actionable: first name, last name, company, email,
 * phone, and at least a state/city for location.
 */

export function meetsQualityBar(lead: {
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
}): { passes: boolean; reason?: string } {
  // Name: both parts required, minimum 2 chars each
  const firstName = lead.first_name?.trim() ?? ''
  if (firstName.length < 2) return { passes: false, reason: 'missing_first_name' }
  const lastName = lead.last_name?.trim() ?? ''
  if (lastName.length < 2) return { passes: false, reason: 'missing_last_name' }

  if (!lead.company_name?.trim()) return { passes: false, reason: 'missing_company_name' }

  // Email: must be a real address (local@domain.tld, local part > 1 char)
  const emailRegex = /^[^\s@]{2,}@[^\s@]+\.[a-zA-Z]{2,}$/
  const email = lead.email?.trim() ?? ''
  if (!email || !emailRegex.test(email)) return { passes: false, reason: 'missing_email' }

  // Phone: required — users need a way to reach the lead
  const phone = lead.phone?.trim() ?? ''
  if (!phone || phone.length < 7) return { passes: false, reason: 'missing_phone' }

  // Location: at least a state or city required — "US" alone is not useful
  const hasLocation = !!(lead.city?.trim() || lead.state?.trim())
  if (!hasLocation) return { passes: false, reason: 'missing_location' }

  return { passes: true }
}
