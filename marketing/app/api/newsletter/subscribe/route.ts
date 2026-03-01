/**
 * Newsletter Subscription API Route
 * Handles blog scroll popup newsletter signups
 *
 * - Validates email
 * - Rate limits by IP (max 3 signups per IP per hour)
 * - Sends welcome email to subscriber via Resend
 * - Notifies hello@meetcursive.com of each new signup
 * - Returns success/error
 *
 * NOTE: No local file storage — Vercel filesystem is read-only at runtime.
 * Subscriber deduplication relies on Resend welcome email suppression.
 */

import { NextRequest, NextResponse } from 'next/server'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// In-memory rate limit store: IP -> array of timestamps
// (per-instance only — acceptable for spam prevention at edge)
const rateLimitMap = new Map<string, number[]>()

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Check rate limit for a given IP address.
 * Returns true if the request is allowed, false if rate-limited.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const recentTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return false
  }

  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)
  return true
}

/**
 * Escape HTML to prevent XSS in email templates
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Send emails via Resend: welcome email to subscriber + notification to admin
 */
async function sendNewsletterEmails(email: string, source: string, ip: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || 'Cursive <noreply@meetcursive.com>'

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const welcomeEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Cursive Weekly</h2>

      <p style="color: #666; line-height: 1.6;">
        Thanks for subscribing! You'll now receive our weekly insights on B2B marketing, visitor identification, and revenue intelligence.
      </p>

      <div style="background: #f7f9fb; border-left: 4px solid #007aff; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #666;">
          <strong>What to expect:</strong>
        </p>
        <ul style="margin: 12px 0; padding-left: 20px; color: #666;">
          <li>Weekly tips on identifying anonymous website visitors</li>
          <li>Strategies for B2B lead generation and enrichment</li>
          <li>Product updates and new feature announcements</li>
          <li>Industry insights and comparison guides</li>
        </ul>
      </div>

      <p style="color: #666; line-height: 1.6;">
        While you're here, check out some of our most popular resources:
      </p>

      <ul style="margin: 12px 0; padding-left: 20px; color: #666;">
        <li><a href="https://www.meetcursive.com/blog" style="color: #007aff; text-decoration: none;">Our Blog</a> — Deep dives on B2B marketing</li>
        <li><a href="https://www.meetcursive.com/platform" style="color: #007aff; text-decoration: none;">Platform Overview</a> — See what Cursive can do</li>
        <li><a href="https://cal.com/gotdarrenhill/30min" style="color: #007aff; text-decoration: none;">Book a Demo</a> — Get a personalized walkthrough</li>
      </ul>

      <p style="color: #666; line-height: 1.6;">
        Best regards,<br/>
        The Cursive Team
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px; margin: 0;">
        Cursive AI | <a href="https://www.meetcursive.com" style="color: #007aff; text-decoration: none;">meetcursive.com</a>
      </p>
      <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">
        You're receiving this because you subscribed at meetcursive.com. If this wasn't you, you can safely ignore this email.
      </p>
    </div>
  `

  const notificationHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #333; margin-bottom: 4px;">New Newsletter Subscriber</h3>
      <p style="color: #888; font-size: 13px; margin-top: 0;">meetcursive.com</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px 12px; background: #f7f9fb; font-size: 13px; color: #888; width: 100px;">Email</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #333;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f7f9fb; font-size: 13px; color: #888;">Source</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #333;">${escapeHtml(source)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f7f9fb; font-size: 13px; color: #888;">Time</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #333;">${new Date().toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f7f9fb; font-size: 13px; color: #888;">IP</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #333;">${escapeHtml(ip)}</td>
        </tr>
      </table>
    </div>
  `

  // Send both emails in parallel
  await Promise.all([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: 'Welcome to Cursive Weekly',
        html: welcomeEmailHtml,
      }),
    }),
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: 'hello@meetcursive.com',
        subject: `New newsletter subscriber: ${email}`,
        html: notificationHtml,
      }),
    }),
  ])
}

/**
 * POST handler for newsletter subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    // Extract IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many subscription attempts. Please try again later.',
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()

    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    const source = typeof body.source === 'string' ? body.source : 'blog_scroll_popup'

    // Send welcome email to subscriber + notification to admin
    await sendNewsletterEmails(email, source, ip)

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    })
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your subscription. Please try again later.',
      },
      { status: 500 }
    )
  }
}
