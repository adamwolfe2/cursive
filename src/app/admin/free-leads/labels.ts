/** Display helpers shared by the free-leads admin pages. */

export const STEP_LABELS: Record<string, string> = {
  paste: 'Pasted a site',
  scan_done: 'ICP shown',
  icp_approved: 'ICP approved',
  icp_emailed: 'ICP emailed to self',
  preview: 'Preview shown',
  claim: 'Work email submitted',
  link_opened: 'Magic link opened',
  delivered: 'Leads delivered',
  leads_viewed: 'Leads viewed',
  csv: 'CSV downloaded',
  upgrade_weekly_leads: 'Interest: weekly leads',
  upgrade_linkedin_outreach: 'Interest: LinkedIn outreach',
  upgrade_ai_dashboard: 'Interest: AI dashboard',
}

export const UPGRADE_LABELS: Record<string, string> = {
  weekly_leads: 'Weekly leads',
  linkedin_outreach: 'LinkedIn outreach',
  ai_dashboard: 'AI dashboard',
}

export const fmtUsd = (n: number | null): string => (n === null ? '-' : `$${n < 1 ? n.toFixed(4) : n.toFixed(2)}`)

export const fmtPct = (fraction: number | null): string => (fraction === null ? '-' : `${(fraction * 100).toFixed(1)}%`)

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
