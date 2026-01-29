import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { purchaseId: string } }
) {
  const supabase = await createClient()

  // 1. Verify user owns this purchase
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .single()

  // 2. Get purchase and verify ownership
  const { data: purchase } = await supabase
    .from('marketplace_purchases')
    .select(
      `
      id, status, buyer_workspace_id, download_expires_at,
      marketplace_purchase_items (
        lead_id,
        leads (
          company_name, company_domain, company_industry, company_size,
          company_location, contact_data, seniority_level,
          intent_score_calculated, freshness_score, verification_status
        )
      )
    `
    )
    .eq('id', params.purchaseId)
    .eq('buyer_workspace_id', userData?.workspace_id)
    .eq('status', 'completed')
    .single()

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  // 3. Check download expiry (optional: 30 days)
  if (purchase.download_expires_at && new Date(purchase.download_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Download link expired' }, { status: 410 })
  }

  // 4. Generate CSV
  const headers = [
    'Company Name',
    'Domain',
    'Industry',
    'Company Size',
    'City',
    'State',
    'Country',
    'Contact Name',
    'Email',
    'Phone',
    'Job Title',
    'LinkedIn',
    'Intent Score',
    'Freshness Score',
    'Email Verified',
  ]

  const rows = purchase.marketplace_purchase_items.map((item: any) => {
    const lead = item.leads
    const contact = lead.contact_data?.contacts?.[0] || {}
    const location = lead.company_location || {}

    return [
      lead.company_name || '',
      lead.company_domain || '',
      lead.company_industry || '',
      lead.company_size || '',
      location.city || '',
      location.state || '',
      location.country || 'US',
      contact.full_name || '',
      contact.email || '',
      contact.phone || '',
      contact.job_title || lead.seniority_level || '',
      contact.linkedin_url || '',
      lead.intent_score_calculated || '',
      lead.freshness_score || '',
      lead.verification_status || '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
  })

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  // 5. Log download to audit
  await supabase.from('marketplace_audit_log').insert({
    workspace_id: userData?.workspace_id,
    user_id: user.id,
    action: 'leads_downloaded',
    entity_type: 'purchase',
    entity_id: purchase.id,
    metadata: { lead_count: rows.length },
  })

  // 6. Return CSV file
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${params.purchaseId}.csv"`,
    },
  })
}
