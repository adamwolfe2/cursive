/**
 * Newsletter Subscription API Route
 * Handles blog scroll popup newsletter signups
 *
 * - Validates email
 * - Rate limits by IP (max 3 signups per IP per hour)
 * - Sends welcome email via Resend
 * - Stores subscriber to JSON file
 * - Returns success/error
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// In-memory rate limit store: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>()

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Path to subscriber storage file
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'newsletter-subscribers.json')

interface Subscriber {
  email: string
  source: string
  subscribedAt: string
  ip: string
}

/**
 * Check rate limit for a given IP address.
 * Returns true if the request is allowed, false if rate-limited.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Filter to only timestamps within the current window
  const recentTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return false
  }

  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)
  return true
}

/**
 * Load existing subscribers from the JSON file.
 */
async function loadSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // File doesn't exist yet or is invalid
    return []
  }
}

/**
 * Save subscribers to the JSON file.
 */
async function saveSubscribers(subscribers: Subscriber[]): Promise<void> {
  const dir = path.dirname(SUBSCRIBERS_FILE)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8')
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
 * Send welcome email to the new subscriber via Resend
 */
async function sendWelcomeEmail(email: string): Promise<void> {
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
        <li><a href="https://meetcursive.com/blog" style="color: #007aff; text-decoration: none;">Our Blog</a> - Deep dives on B2B marketing</li>
        <li><a href="https://meetcursive.com/platform" style="color: #007aff; text-decoration: none;">Platform Overview</a> - See what Cursive can do</li>
        <li><a href="https://cal.com/adamwolfe/cursive-ai-audit" style="color: #007aff; text-decoration: none;">Book a Demo</a> - Get a personalized walkthrough</li>
      </ul>

      <p style="color: #666; line-height: 1.6;">
        Best regards,<br/>
        The Cursive Team
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px; margin: 0;">
        Cursive AI | <a href="https://meetcursive.com" style="color: #007aff; text-decoration: none;">meetcursive.com</a>
      </p>
      <p style="color: #999; font-size: 12px; margin: 4px 0 0 0;">
        You're receiving this because you subscribed at meetcursive.com. If this wasn't you, you can safely ignore this email.
      </p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: 'Welcome to Cursive Weekly',
      html: welcomeEmailHtml,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Failed to send welcome email: ${JSON.stringify(errorData)}`)
  }
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
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const email = body.email.trim().toLowerCase()

    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Load existing subscribers and check for duplicates
    const subscribers = await loadSubscribers()
    const alreadySubscribed = subscribers.some((sub) => sub.email === email)

    if (alreadySubscribed) {
      // Return success to avoid leaking subscription status,
      // but don't send another welcome email or duplicate the entry
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
      })
    }

    // Store the new subscriber
    const newSubscriber: Subscriber = {
      email,
      source: body.source || 'blog_scroll_popup',
      subscribedAt: body.timestamp || new Date().toISOString(),
      ip,
    }
    const updatedSubscribers = [...subscribers, newSubscriber]
    await saveSubscribers(updatedSubscribers)

    // Send welcome email via Resend
    await sendWelcomeEmail(email)

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
