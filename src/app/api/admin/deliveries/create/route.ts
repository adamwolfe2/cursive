import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDeliveryNotificationEmail } from '@/lib/email/service-emails'

/**
 * POST /api/admin/deliveries/create
 * Create a new delivery and upload file to storage
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const subscriptionId = formData.get('subscription_id') as string
    const deliveryType = formData.get('delivery_type') as string
    const periodStart = formData.get('period_start') as string
    const periodEnd = formData.get('period_end') as string
    const sendEmail = formData.get('send_email') === 'true'
    const file = formData.get('file') as File

    if (!subscriptionId || !deliveryType || !periodStart || !periodEnd || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('service_subscriptions')
      .select(`
        id,
        workspace_id,
        service_tiers (name),
        users!inner (email, full_name)
      `)
      .eq('id', subscriptionId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Create delivery record first
    const { data: delivery, error: deliveryError } = await supabase
      .from('service_deliveries')
      .insert({
        service_subscription_id: subscriptionId,
        delivery_period_start: periodStart,
        delivery_period_end: periodEnd,
        delivery_type: deliveryType,
        status: 'delivered', // Mark as delivered immediately
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (deliveryError || !delivery) {
      throw new Error(`Failed to create delivery: ${deliveryError?.message}`)
    }

    // Upload file to storage
    // Path: workspace_id/delivery_id/filename.csv
    const fileName = file.name
    const filePath = `${subscription.workspace_id}/${delivery.id}/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('service-deliveries')
      .upload(filePath, fileBuffer, {
        contentType: 'text/csv',
        upsert: false,
      })

    if (uploadError) {
      // Rollback delivery creation if upload fails
      await supabase
        .from('service_deliveries')
        .delete()
        .eq('id', delivery.id)

      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Update delivery with file info
    const { error: updateError } = await supabase
      .from('service_deliveries')
      .update({
        file_path: filePath,
        file_name: fileName,
        file_size: file.size,
      })
      .eq('id', delivery.id)

    if (updateError) {
      console.error('[Admin] Failed to update delivery with file info:', updateError)
    }

    // Send notification email if requested
    if (sendEmail) {
      try {
        const user = Array.isArray(subscription.users) ? subscription.users[0] : subscription.users
        const tier = subscription.service_tiers as any

        // Generate download URL (signed URL valid for 7 days)
        const { data: urlData } = await supabase.storage
          .from('service-deliveries')
          .createSignedUrl(filePath, 7 * 24 * 60 * 60) // 7 days

        if (urlData?.signedUrl) {
          await sendDeliveryNotificationEmail({
            customerEmail: user.email,
            customerName: user.full_name || user.email.split('@')[0],
            deliveryType: deliveryType,
            downloadUrl: urlData.signedUrl,
          })

          // Delivery notification sent successfully
        }
      } catch (emailError: any) {
        console.error('[Admin] Failed to send delivery email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      delivery_id: delivery.id,
      message: 'Delivery created successfully'
    })
  } catch (error) {
    console.error('[API] Error creating delivery:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery' },
      { status: 500 }
    )
  }
}
