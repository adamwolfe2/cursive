// Global Search API
// GET /api/search?q=<query>&limit=8

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const searchSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(100, 'Query too long'),
  limit: z.coerce.number().min(1).max(20).optional().default(8),
})

export interface SearchLead {
  id: string
  full_name: string | null
  email: string | null
  company_name: string
  job_title: string | null
}

export interface SearchContact {
  id: string
  email: string
  company_name: string
}

export interface SearchCampaign {
  id: string
  name: string
  status: string
}

export interface SearchResults {
  leads: SearchLead[]
  contacts: SearchContact[]
  campaigns: SearchCampaign[]
}

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input
    const searchParams = request.nextUrl.searchParams
    const params = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '8',
    }

    const validated = searchSchema.parse(params)
    const { q, limit } = validated
    const workspaceId = user.workspace_id

    // Escape SQL wildcard characters so literal % and _ in search terms are treated as literals
    const escapedQ = q.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escapedQ}%`

    // 3. Use createClient() (respects RLS, filters to user's workspace automatically)
    const supabase = await createClient()

    // Run all three searches in parallel for performance
    const [leadsResult, contactsResult, campaignsResult] = await Promise.all([
      // Search leads by email, full_name, or company_name — top 3
      supabase
        .from('leads')
        .select('id, full_name, email, company_name, job_title')
        .eq('workspace_id', workspaceId)
        .or(`email.ilike.${pattern},full_name.ilike.${pattern},company_name.ilike.${pattern}`)
        .limit(3),

      // Search buyers (contacts) by email or company_name — top 3
      supabase
        .from('buyers')
        .select('id, email, company_name')
        .eq('workspace_id', workspaceId)
        .or(`email.ilike.${pattern},company_name.ilike.${pattern}`)
        .limit(3),

      // Search email_campaigns by name — top 2
      supabase
        .from('email_campaigns')
        .select('id, name, status')
        .eq('workspace_id', workspaceId)
        .ilike('name', pattern)
        .limit(2),
    ])

    // 4. Return results (suppress errors gracefully — empty array if table missing / RLS blocks)
    return NextResponse.json({
      results: {
        leads: (leadsResult.data ?? []) as SearchLead[],
        contacts: (contactsResult.data ?? []) as SearchContact[],
        campaigns: (campaignsResult.data ?? []) as SearchCampaign[],
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
