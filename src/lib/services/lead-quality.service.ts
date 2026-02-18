/**
 * Lead Quality Gate
 *
 * Shared quality check applied at all lead insertion paths.
 * Ensures every lead delivered to users has the minimum data
 * required to be actionable: first name, last name, company, and email.
 */

export function meetsQualityBar(lead: {
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  email?: string | null
}): { passes: boolean; reason?: string } {
  if (!lead.first_name?.trim()) return { passes: false, reason: 'missing_first_name' }
  if (!lead.last_name?.trim()) return { passes: false, reason: 'missing_last_name' }
  if (!lead.company_name?.trim()) return { passes: false, reason: 'missing_company_name' }
  if (!lead.email?.trim() || !lead.email.includes('@')) return { passes: false, reason: 'missing_email' }
  return { passes: true }
}
