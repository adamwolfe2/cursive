/**
 * Campaign Builder API - Export Campaign
 * Export campaign to EmailBison (CSV, JSON, manual copy, or direct API push)
 *
 * GET  - Export as CSV/JSON/manual text
 * POST - Push directly to EmailBison via API (creates campaign, adds sequence steps)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { exportCampaignToEmailBison } from '@/lib/integrations/emailbison'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import type { CampaignDraft } from '@/types/campaign-builder'

const _exportSchema = z.object({
  format: z.enum(['csv', 'json', 'manual']),
  mark_as_exported: z.boolean().default(true),
})

const emailbisonExportSchema = z.object({
  settings: z.object({
    max_emails_per_day: z.number().optional(),
    max_new_leads_per_day: z.number().optional(),
    plain_text: z.boolean().optional(),
    open_tracking: z.boolean().optional(),
  }).optional(),
  auto_add_sender_emails: z.boolean().default(true),
})

/**
 * GET /api/campaign-builder/[id]/export
 * Export campaign for EmailBison
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get('format') as 'csv' | 'json' | 'manual' || 'csv'
    const markAsExported = searchParams.get('mark_as_exported') !== 'false'

    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, user.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (draft.status !== 'approved' && draft.status !== 'exported') {
      return NextResponse.json(
        { error: 'Campaign must be approved before export' },
        { status: 400 }
      )
    }

    if (!draft.generated_emails || draft.generated_emails.length === 0) {
      return NextResponse.json(
        { error: 'Campaign has no generated emails' },
        { status: 400 }
      )
    }

    const exportData = formatExport(draft, format)

    if (markAsExported && draft.status !== 'exported') {
      await repo.markExported(id, user.workspace_id, { format: format as any })
    }

    if (format === 'csv') {
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="campaign-${draft.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      format,
      content: exportData,
      campaign_name: draft.name,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Format campaign for export
 */
function formatExport(draft: CampaignDraft, format: 'csv' | 'json' | 'manual'): string {
  const emails = draft.generated_emails || []

  if (format === 'csv') {
    // CSV format for EmailBison import
    const headers = ['Step', 'Day', 'Subject', 'Body', 'Personalization Notes']
    const rows = emails.map((email) => [
      email.step.toString(),
      email.day.toString(),
      `"${email.subject.replace(/"/g, '""')}"`, // Escape quotes
      `"${email.body.replace(/"/g, '""')}"`,
      `"${(email.personalization_notes || '').replace(/"/g, '""')}"`,
    ])

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  }

  if (format === 'json') {
    // JSON format with full campaign context
    return JSON.stringify(
      {
        campaign_name: draft.name,
        company: {
          name: draft.company_name,
          industry: draft.industry,
          value_proposition: draft.value_proposition,
        },
        icp: {
          target_titles: draft.target_titles,
          target_industries: draft.target_industries,
          pain_points: draft.pain_points,
        },
        sequence: {
          type: draft.sequence_type,
          goal: draft.sequence_goal,
          email_count: draft.email_count,
          days_between: draft.days_between_emails,
        },
        tone: {
          tone: draft.tone,
          length: draft.email_length,
          personalization: draft.personalization_level,
        },
        emails: emails.map((email) => ({
          step: email.step,
          day: email.day,
          subject: email.subject,
          body: email.body,
          personalization_notes: email.personalization_notes,
          variables: email.variables,
        })),
      },
      null,
      2
    )
  }

  // Manual format (readable text)
  return `
# ${draft.name}

## Campaign Overview
- Company: ${draft.company_name}
- Industry: ${draft.industry}
- Target: ${draft.target_titles?.join(', ')}
- Sequence Type: ${draft.sequence_type}
- Tone: ${draft.tone}

## Email Sequence (${emails.length} emails)

${emails
  .map(
    (email) => `
---
### Email ${email.step} - Day ${email.day}

**Subject:** ${email.subject}

**Body:**
${email.body}

**Personalization Notes:**
${email.personalization_notes || 'None'}

**Variables:** ${email.variables?.join(', ') || 'None'}
`
  )
  .join('\n')}

---

## Export Instructions for EmailBison

1. Copy each email's subject and body
2. Paste into EmailBison sequence builder
3. Set email delays to ${draft.days_between_emails} days
4. Configure personalization variables: ${draft.personalization_level} level
5. Test with a small batch before full send

Generated by Campaign Builder - ${new Date(draft.generated_at || '').toLocaleDateString()}
`.trim()
}

/**
 * POST /api/campaign-builder/[id]/export
 * Push campaign directly to EmailBison via API
 *
 * Creates the campaign, adds sequence steps with AI-generated copy,
 * configures settings, adds sender emails, and sets a weekday schedule.
 * Campaign starts paused for final review in EmailBison dashboard.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await req.json()
    const validated = emailbisonExportSchema.parse(body)

    const repo = new CampaignBuilderRepository()
    const draft = await repo.getById(id, user.workspace_id)

    if (!draft) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (draft.status !== 'approved' && draft.status !== 'exported') {
      return NextResponse.json(
        { error: 'Campaign must be approved before export to EmailBison' },
        { status: 400 }
      )
    }

    if (!draft.generated_emails || draft.generated_emails.length === 0) {
      return NextResponse.json(
        { error: 'Campaign has no generated emails' },
        { status: 400 }
      )
    }

    const result = await exportCampaignToEmailBison({
      name: draft.name,
      emails: draft.generated_emails.map((email) => ({
        step: email.step,
        day: email.day,
        subject: email.subject,
        body: email.body,
      })),
      settings: validated.settings,
      autoAddSenderEmails: validated.auto_add_sender_emails,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: `EmailBison export failed: ${result.error}` },
        { status: 502 }
      )
    }

    await repo.markExported(id, user.workspace_id, {
      format: 'emailbison' as any,
      emailbison_campaign_id: result.campaignId,
    })

    return NextResponse.json({
      success: true,
      emailbison_campaign_id: result.campaignId,
      steps_added: result.stepsAdded,
      leads_added: result.leadsAdded,
      message: 'Campaign pushed to EmailBison. It starts paused — review and activate in your EmailBison dashboard.',
      dashboard_url: 'https://send.meetcursive.com',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
