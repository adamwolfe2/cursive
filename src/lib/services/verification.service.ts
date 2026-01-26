// Email and Phone Verification Service
// Integrates with NeverBounce, ZeroBounce, and Twilio Lookup

import { createClient } from '@/lib/supabase/server'
import { twilioService } from './twilio.service'

export interface EmailVerificationResult {
  status: 'valid' | 'invalid' | 'risky' | 'unknown'
  confidence: number
  deliverable: boolean
  disposable: boolean
  roleBasedEmail: boolean
  freeProvider: boolean
  mxFound: boolean
  smtpValid: boolean
  provider: string
  rawResult: Record<string, any>
}

export interface PhoneVerificationResult {
  valid: boolean
  type: 'mobile' | 'landline' | 'voip' | 'unknown'
  carrier: string | null
  country: string | null
  provider: string
  rawResult: Record<string, any>
}

export class VerificationService {
  /**
   * Verify an email address
   */
  async verifyEmail(
    workspaceId: string,
    email: string,
    leadId?: string
  ): Promise<EmailVerificationResult> {
    const supabase = await createClient()
    const provider = process.env.EMAIL_VERIFICATION_PROVIDER || 'neverbounce'

    try {
      let result: EmailVerificationResult

      switch (provider) {
        case 'neverbounce':
          result = await this.verifyWithNeverBounce(email)
          break
        case 'zerobounce':
          result = await this.verifyWithZeroBounce(email)
          break
        default:
          // Fallback to basic validation
          result = this.basicEmailValidation(email)
      }

      // Store result in database
      await supabase.from('verification_results').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        verification_type: 'email',
        verified_value: email,
        status: result.status,
        confidence_score: result.confidence,
        provider,
        provider_result: result.rawResult,
        email_deliverable: result.deliverable,
        email_disposable: result.disposable,
        email_role_based: result.roleBasedEmail,
        email_free_provider: result.freeProvider,
        email_mx_found: result.mxFound,
        email_smtp_valid: result.smtpValid,
      })

      return result
    } catch (error: any) {
      console.error('[VerificationService] Email verification error:', error)
      throw error
    }
  }

  /**
   * Verify a phone number
   */
  async verifyPhone(
    workspaceId: string,
    phone: string,
    leadId?: string
  ): Promise<PhoneVerificationResult> {
    const supabase = await createClient()

    try {
      // Use Twilio Lookup
      const lookup = await twilioService.lookupPhoneNumber(phone)

      const result: PhoneVerificationResult = {
        valid: lookup.valid,
        type: (lookup.type as any) || 'unknown',
        carrier: lookup.carrier || null,
        country: lookup.country || null,
        provider: 'twilio_lookup',
        rawResult: lookup,
      }

      // Store result
      await supabase.from('verification_results').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        verification_type: 'phone',
        verified_value: phone,
        status: result.valid ? 'valid' : 'invalid',
        confidence_score: result.valid ? 100 : 0,
        provider: 'twilio_lookup',
        provider_result: lookup,
        phone_valid: result.valid,
        phone_type: result.type,
        phone_carrier: result.carrier,
        phone_country: result.country,
      })

      return result
    } catch (error: any) {
      console.error('[VerificationService] Phone verification error:', error)
      throw error
    }
  }

  /**
   * Verify with NeverBounce
   */
  private async verifyWithNeverBounce(email: string): Promise<EmailVerificationResult> {
    const apiKey = process.env.NEVERBOUNCE_API_KEY
    if (!apiKey) throw new Error('NeverBounce API key not configured')

    const response = await fetch(
      `https://api.neverbounce.com/v4/single/check?key=${apiKey}&email=${encodeURIComponent(email)}`
    )

    if (!response.ok) throw new Error('NeverBounce API error')

    const data = await response.json()

    // Map NeverBounce results
    const statusMap: Record<string, EmailVerificationResult['status']> = {
      valid: 'valid',
      invalid: 'invalid',
      disposable: 'risky',
      catchall: 'risky',
      unknown: 'unknown',
    }

    return {
      status: statusMap[data.result] || 'unknown',
      confidence: data.result === 'valid' ? 95 : data.result === 'invalid' ? 5 : 50,
      deliverable: data.result === 'valid',
      disposable: data.result === 'disposable',
      roleBasedEmail: data.flags?.includes('role_account') || false,
      freeProvider: data.flags?.includes('free_email_host') || false,
      mxFound: !data.flags?.includes('has_dns') || true,
      smtpValid: data.result === 'valid',
      provider: 'neverbounce',
      rawResult: data,
    }
  }

  /**
   * Verify with ZeroBounce
   */
  private async verifyWithZeroBounce(email: string): Promise<EmailVerificationResult> {
    const apiKey = process.env.ZEROBOUNCE_API_KEY
    if (!apiKey) throw new Error('ZeroBounce API key not configured')

    const response = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`
    )

    if (!response.ok) throw new Error('ZeroBounce API error')

    const data = await response.json()

    // Map ZeroBounce results
    const statusMap: Record<string, EmailVerificationResult['status']> = {
      valid: 'valid',
      invalid: 'invalid',
      'catch-all': 'risky',
      spamtrap: 'invalid',
      abuse: 'risky',
      'do_not_mail': 'risky',
      unknown: 'unknown',
    }

    return {
      status: statusMap[data.status] || 'unknown',
      confidence: data.status === 'valid' ? 98 : data.status === 'invalid' ? 2 : 50,
      deliverable: data.status === 'valid',
      disposable: data.disposable === 'true',
      roleBasedEmail: data.role_email === 'true',
      freeProvider: data.free_email === 'true',
      mxFound: data.mx_found === 'true',
      smtpValid: data.smtp_provider !== null,
      provider: 'zerobounce',
      rawResult: data,
    }
  }

  /**
   * Basic email validation (fallback)
   */
  private basicEmailValidation(email: string): EmailVerificationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)

    // Check for common disposable domains
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com']
    const domain = email.split('@')[1]?.toLowerCase()
    const isDisposable = disposableDomains.some(d => domain?.includes(d))

    // Check for free email providers
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
    const isFreeProvider = freeProviders.includes(domain || '')

    // Check for role-based emails
    const roleEmails = ['admin', 'info', 'support', 'sales', 'contact', 'hello', 'help']
    const localPart = email.split('@')[0]?.toLowerCase()
    const isRoleBased = roleEmails.some(r => localPart?.includes(r))

    return {
      status: isValid ? (isDisposable ? 'risky' : 'valid') : 'invalid',
      confidence: isValid ? 70 : 10,
      deliverable: isValid && !isDisposable,
      disposable: isDisposable,
      roleBasedEmail: isRoleBased,
      freeProvider: isFreeProvider,
      mxFound: true, // Cannot check without DNS lookup
      smtpValid: true, // Cannot check without SMTP verification
      provider: 'basic',
      rawResult: { email, isValid, isDisposable, isFreeProvider, isRoleBased },
    }
  }

  /**
   * Bulk verify emails
   */
  async bulkVerifyEmails(
    workspaceId: string,
    emails: Array<{ email: string; leadId?: string }>
  ): Promise<Map<string, EmailVerificationResult>> {
    const results = new Map<string, EmailVerificationResult>()

    // Process in batches
    const batchSize = 10
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(({ email, leadId }) => this.verifyEmail(workspaceId, email, leadId))
      )

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.set(batch[idx].email, result.value)
        }
      })

      // Rate limiting delay
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }
}

export const verificationService = new VerificationService()
