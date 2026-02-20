
/**
 * GET /api/leads/segment-check?industry=hvac&location=ca
 *
 * Quick lookup to check if an AudienceLab segment exists
 * for a given industry + location combination.
 * Used by the targeting preferences form for live feedback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const industry = searchParams.get('industry')
  const location = searchParams.get('location')

  if (!industry || !location) {
    return NextResponse.json({ has_segment: false, segment_name: null })
  }

  const industryKey = industry.toLowerCase().replace(/\s+/g, '_')
  const locationKey = location.toLowerCase()

  const { data: segment } = await supabase
    .from('audience_lab_segments')
    .select('segment_name')
    .eq('industry', industryKey)
    .eq('location', locationKey)
    .maybeSingle()

  return NextResponse.json({
    has_segment: !!segment,
    segment_name: segment?.segment_name ?? null,
  })
}
