/**
 * Partner Lead Upload API
 * CSV upload with validation and deduplication
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-messages'
import { z } from 'zod'

// CSV row validation schema
const csvRowSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  marketplace_price: z.number().min(0).optional(),
})

const uploadSchema = z.object({
  leads: z.array(csvRowSchema).min(1).max(1000),
  auto_list: z.boolean().default(false),
  default_price: z.number().min(0).optional(),
})

/**
 * POST /api/partner/leads/upload
 * Upload leads via CSV (max 1000 per request)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leads: rawLeads, auto_list, default_price } = uploadSchema.parse(body)

    const supabase = await createClient()

    // Check if user has partner status
    const { data: partner } = await supabase
      .from('partners')
      .select('id, commission_rate')
      .eq('user_id', user.id)
      .single()

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner status required. Contact support to become a partner.' },
        { status: 403 }
      )
    }

    // Validate and clean leads
    const validLeads: any[] = []
    const errors: Array<{ row: number; errors: string[] }> = []

    for (let i = 0; i < rawLeads.length; i++) {
      const lead = rawLeads[i]
      const rowErrors: string[] = []

      // Must have at least email or phone
      if (!lead.email && !lead.phone) {
        rowErrors.push('Must have email or phone')
      }

      // Must have first/last name or company
      if (!lead.first_name && !lead.last_name && !lead.company_name) {
        rowErrors.push('Must have name or company')
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors })
      } else {
        validLeads.push(lead)
      }
    }

    if (validLeads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found', validation_errors: errors },
        { status: 400 }
      )
    }

    // Check for duplicates using dedup_hash
    const emails = validLeads.map(l => l.email).filter(Boolean)
    const phones = validLeads.map(l => l.phone).filter(Boolean)

    const { data: existingLeads } = await supabase.rpc('check_duplicate_emails', {
      p_workspace_id: user.workspace_id,
      p_emails: emails,
    })

    const existingEmails = new Set(
      (existingLeads || []).filter((l: any) => l.exists).map((l: any) => l.email)
    )

    // Filter out duplicates
    const newLeads = validLeads.filter(
      (lead) => !existingEmails.has(lead.email?.toLowerCase())
    )

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true,
        uploaded: 0,
        skipped: validLeads.length,
        message: 'All leads already exist in your workspace',
        validation_errors: errors,
      })
    }

    // Prepare leads for insertion
    const leadsToInsert = newLeads.map((lead) => ({
      workspace_id: user.workspace_id,
      partner_id: partner.id,
      email: lead.email?.toLowerCase() || null,
      first_name: lead.first_name || null,
      last_name: lead.last_name || null,
      company_name: lead.company_name || null,
      job_title: lead.job_title || null,
      phone: lead.phone || null,
      linkedin_url: lead.linkedin_url || null,
      industry: lead.industry || null,
      company_size: lead.company_size || null,
      state: lead.state || null,
      city: lead.city || null,
      source: 'partner_upload' as const,
      verification_status: 'pending' as const,
      is_marketplace_listed: auto_list,
      marketplace_price: lead.marketplace_price || default_price || null,
    }))

    // Insert leads
    const { data: insertedLeads, error: insertError } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select()

    if (insertError) {
      safeError('[Partner Upload] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to upload leads' },
        { status: 500 }
      )
    }

    safeLog('[Partner Upload] Success:', {
      partner_id: partner.id,
      uploaded: newLeads.length,
      skipped: validLeads.length - newLeads.length,
      auto_listed: auto_list,
    })

    // Calculate potential earnings preview
    const potentialEarnings = auto_list
      ? insertedLeads.reduce(
          (sum, lead) => sum + (lead.marketplace_price || 0) * partner.commission_rate,
          0
        )
      : 0

    return NextResponse.json({
      success: true,
      uploaded: insertedLeads.length,
      skipped: validLeads.length - newLeads.length,
      validation_errors: errors.length > 0 ? errors : undefined,
      potential_earnings: potentialEarnings,
      leads: insertedLeads,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid data format',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    safeError('[Partner Upload] Error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
