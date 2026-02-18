
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

const downloadSchema = z.object({
  delivery_id: z.string().uuid()
})

/**
 * POST /api/services/deliveries/download
 * Generate signed URL for delivery file download
 * Only accessible to the workspace that owns the delivery
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || !userData.workspace_id) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validated = downloadSchema.parse(body)

    // Get delivery and verify ownership
    const { data: delivery, error: deliveryError } = await supabase
      .from('service_deliveries')
      .select(`
        id,
        file_path,
        file_name,
        status,
        service_subscription:service_subscriptions!inner (
          workspace_id
        )
      `)
      .eq('id', validated.delivery_id)
      .single()

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const subscription = delivery.service_subscription as any
    if (subscription.workspace_id !== userData.workspace_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if delivery is ready
    if (delivery.status !== 'delivered' || !delivery.file_path) {
      return NextResponse.json(
        { error: 'Delivery not ready for download' },
        { status: 400 }
      )
    }

    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('service-deliveries')
      .createSignedUrl(delivery.file_path, 60 * 60) // 1 hour

    if (urlError || !urlData?.signedUrl) {
      throw new Error('Failed to generate download URL')
    }

    return NextResponse.json({
      download_url: urlData.signedUrl,
      file_name: delivery.file_name
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[Service Deliveries Download] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
