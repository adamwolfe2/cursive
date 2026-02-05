/**
 * Popup Form Submission Handler
 * Handles form submissions from popup components
 */

import { PopupFormData } from './popup-types'

/**
 * Default popup submission handler
 * Replace this with your actual API endpoint
 */
export async function handlePopupSubmission(
  data: PopupFormData
): Promise<void> {
  try {
    // Example: Send to your API endpoint
    const response = await fetch('/api/leads/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        company: data.company,
        firstName: data.firstName,
        source: data.source || 'popup',
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit form')
    }

    const result = await response.json()

    // Optional: Track conversion in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION-ID/CONVERSION-LABEL', // Replace with your conversion ID
        value: 1.0,
        currency: 'USD',
      })
    }

    return result
  } catch (error) {
    console.error('Error submitting popup form:', error)
    throw error
  }
}

/**
 * Newsletter subscription handler
 */
export async function handleNewsletterSubscription(
  email: string
): Promise<void> {
  try {
    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source: 'blog_scroll_popup',
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to subscribe')
    }

    return await response.json()
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    throw error
  }
}

/**
 * Visitor report request handler
 */
export async function handleVisitorReportRequest(
  data: { email: string; company?: string }
): Promise<void> {
  try {
    const response = await fetch('/api/reports/visitor-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        reportType: 'visitor_identification',
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to request report')
    }

    return await response.json()
  } catch (error) {
    console.error('Error requesting visitor report:', error)
    throw error
  }
}
