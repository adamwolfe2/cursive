/**
 * Client Profiles API
 *
 * GET /api/clients - List all client profiles
 * POST /api/clients - Create a new client profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const CreateClientSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_code: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),

  // Industry targeting
  target_sic_codes: z.array(z.string()).optional(),
  target_industry_categories: z.array(z.string().uuid()).optional(),
  target_sic_prefix: z.array(z.string()).optional(),

  // Geographic targeting
  target_states: z.array(z.string().length(2)).optional(),
  target_cities: z.array(z.string()).optional(),
  target_zips: z.array(z.string()).optional(),
  target_zip_prefixes: z.array(z.string()).optional(),
  target_counties: z.array(z.string()).optional(),
  target_dmas: z.array(z.number()).optional(),

  // Radius targeting
  target_radius_miles: z.number().positive().optional(),
  target_radius_center_lat: z.number().min(-90).max(90).optional(),
  target_radius_center_lng: z.number().min(-180).max(180).optional(),
  target_radius_address: z.string().optional(),

  // Lead caps
  daily_lead_cap: z.number().positive().optional(),
  weekly_lead_cap: z.number().positive().optional(),
  monthly_lead_cap: z.number().positive().optional(),
  total_lead_cap: z.number().positive().optional(),

  // Routing
  routing_priority: z.number().min(1).max(1000).default(100),
  routing_weight: z.number().min(1).max(100).default(1),
  is_exclusive: z.boolean().default(false),

  // Filters
  min_quality_score: z.number().min(1).max(10).optional(),
  require_email: z.boolean().default(false),
  require_phone: z.boolean().default(false),
  require_company: z.boolean().default(false),
  excluded_domains: z.array(z.string()).optional(),

  // Delivery
  webhook_url: z.string().url().optional(),
  webhook_secret: z.string().optional(),
  notification_emails: z.array(z.string().email()).optional(),
  delivery_format: z.enum(['json', 'csv', 'email']).default('json'),

  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    let query = supabase
      .from('client_profiles')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('routing_priority', { ascending: true })

    // Filter by active status
    const activeOnly = searchParams.get('active')
    if (activeOnly === 'true') {
      query = query.eq('is_active', true).is('paused_at', null)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = CreateClientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        ...parsed.data,
        workspace_id: user.workspace_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A client with this code already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
