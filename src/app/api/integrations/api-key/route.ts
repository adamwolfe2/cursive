// API Key Generation Route
// POST /api/integrations/api-key - Generate or regenerate an API key

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Generate a secure API key with a recognizable prefix
 */
function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return `csk_${randomBytes}`
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify Pro plan
    if (user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'API keys require a Pro plan' },
        { status: 403 }
      )
    }

    // 3. Generate new API key
    const apiKey = generateApiKey()

    // 4. Store the API key on the user record
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update({
        api_key: apiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .eq('workspace_id', user.workspace_id)

    if (error) {
      console.error('[API Key] Failed to store API key:', error)
      return NextResponse.json(
        { error: 'Failed to generate API key' },
        { status: 500 }
      )
    }

    // 5. Return the new API key
    return NextResponse.json({
      success: true,
      api_key: apiKey,
    })
  } catch (error) {
    console.error('[API Key] Error generating API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}
