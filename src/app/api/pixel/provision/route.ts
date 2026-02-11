import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

export const runtime = 'edge'

const provisionSchema = z.object({
  website_url: z.string().url(),
  website_name: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id, full_name')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const body = await request.json()
    const validated = provisionSchema.parse(body)

    // Check if workspace already has a pixel
    const adminSupabase = createAdminClient()
    const { data: existingPixel } = await adminSupabase
      .from('audiencelab_pixels')
      .select('pixel_id')
      .eq('workspace_id', userData.workspace_id)
      .maybeSingle()

    if (existingPixel) {
      return NextResponse.json(
        { error: 'Workspace already has a pixel. Only one pixel per workspace is allowed.' },
        { status: 409 }
      )
    }

    // Extract domain from URL
    const domain = new URL(validated.website_url).hostname

    // Provision pixel via AudienceLab API
    const websiteName = validated.website_name || domain
    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: validated.website_url,
    })

    // Build snippet from AL response or generate a default
    const snippet = result.script ||
      `<script src="${result.install_url || `https://t.audiencelab.io/pixel/${result.pixel_id}`}" async></script>`

    // Store in audiencelab_pixels
    const { error: insertError } = await adminSupabase
      .from('audiencelab_pixels')
      .insert({
        pixel_id: result.pixel_id,
        workspace_id: userData.workspace_id,
        domain,
        is_active: true,
        label: websiteName,
        snippet,
      })

    if (insertError) {
      console.error('[API] Pixel insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save pixel' }, { status: 500 })
    }

    // Fire-and-forget Slack notification
    sendSlackAlert({
      type: 'pipeline_update',
      severity: 'info',
      message: `New pixel provisioned for ${domain}`,
      metadata: {
        workspace_id: userData.workspace_id,
        user: userData.full_name || user.email,
        pixel_id: result.pixel_id,
        domain,
      },
    }).catch(() => {})

    return NextResponse.json({
      pixel_id: result.pixel_id,
      snippet,
      domain,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[API] Pixel provision error:', error)
    return NextResponse.json(
      { error: 'Failed to provision pixel. Please try again.' },
      { status: 500 }
    )
  }
}
