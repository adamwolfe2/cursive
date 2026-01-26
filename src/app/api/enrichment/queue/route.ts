/**
 * Enrichment Queue API
 * POST /api/enrichment/queue - Queue leads for enrichment
 * GET /api/enrichment/queue - Get enrichment queue status
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/inngest/client'
import {
  queueEnrichment,
  getEnrichmentStats,
  type EnrichmentProvider,
  type EnrichmentPriority,
} from '@/lib/services/enrichment/enrichment-queue.service'

// Validation schema
const queueEnrichmentSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(100),
  providers: z.array(z.enum([
    'clay', 'clearbit', 'apollo', 'zoominfo',
    'email_validation', 'ai_analysis', 'web_scrape'
  ])).optional().default(['email_validation', 'ai_analysis', 'clay']),
  priority: z.enum(['critical', 'high', 'normal', 'low']).optional().default('normal'),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate input
    const body = await req.json()
    const { lead_ids, providers, priority } = queueEnrichmentSchema.parse(body)

    // Verify leads belong to workspace
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .in('id', lead_ids)
      .eq('workspace_id', user.workspace_id)

    if (leadsError) {
      return NextResponse.json({ error: 'Failed to verify leads' }, { status: 500 })
    }

    const validLeadIds = leads?.map((l) => l.id) || []

    if (validLeadIds.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 400 })
    }

    // Queue enrichment via Inngest
    await inngest.send({
      name: 'enrichment/batch',
      data: {
        workspace_id: user.workspace_id,
        lead_ids: validLeadIds,
        providers,
        priority,
      },
    })

    return NextResponse.json({
      success: true,
      queued: validLeadIds.length,
      providers,
      priority,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Enrichment queue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get stats
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
    const stats = await getEnrichmentStats(user.workspace_id, days)

    // Get recent jobs
    const { data: recentJobs } = await supabase
      .from('enrichment_jobs')
      .select('id, lead_id, provider, status, created_at, completed_at')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      stats,
      recentJobs,
    })
  } catch (error: any) {
    console.error('Enrichment stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
