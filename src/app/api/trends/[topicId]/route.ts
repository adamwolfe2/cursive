// Trend History API
// GET /api/trends/[topicId] - Get trend history for a topic


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

interface RouteContext {
  params: Promise<{ topicId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { topicId } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch topic details
    const supabase = await createClient()

    const { data: topic, error: topicError } = await supabase
      .from('global_topics')
      .select('id, name, slug, category, description')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Fetch trend history (last 12 weeks)
    const { data: trends, error: trendsError } = await supabase
      .from('trends')
      .select('id, topic_id, week_start, score, volume, sentiment, sources')
      .eq('topic_id', topicId)
      .order('week_start', { ascending: false })
      .limit(12)

    if (trendsError) {
      throw new Error(`Failed to fetch trends: ${trendsError.message}`)
    }

    // Reverse to show oldest to newest
    const sortedTrends = (trends || []).reverse()

    return NextResponse.json({
      success: true,
      data: {
        topic,
        trends: sortedTrends,
      },
    })
  } catch (error: any) {
    safeError('[Trend History] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
