/**
 * Slack Test Connection Route
 * Cursive Platform
 *
 * Sends a test message to the user's configured Slack webhook
 * to verify the connection is working.
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Check that the user has a Slack webhook configured
    if (!user.slack_webhook_url) {
      return NextResponse.json(
        { error: 'Slack is not connected. Please connect Slack first.' },
        { status: 400 }
      )
    }

    // Send test message to the webhook URL
    const testMessage = {
      text: 'Cursive is connected! You will receive lead notifications here.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Cursive is connected!*\nYou will receive lead notifications in this channel.',
          },
        },
      ],
    }

    const webhookResponse = await fetch(user.slack_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      safeError('[Slack OAuth] Test message failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to send test message to Slack. The webhook may be invalid.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test message sent to Slack successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
