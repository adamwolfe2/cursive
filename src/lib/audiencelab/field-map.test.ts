import { describe, it, expect } from 'vitest'
import { normalizeALPayload, isLeadWorthy } from './field-map'

// Regression for the live bug: real-time pixel/webhook events carry
// *_VERIFIED_EMAILS but OMIT *_EMAIL_VALIDATION_STATUS, so identified visitors
// with verified emails were dropped as "not lead worthy". (vendingpreneurs.com)

const webhookVisitor = {
  FIRST_NAME: 'Carol',
  LAST_NAME: 'Smith',
  COMPANY_NAME: 'Village Creek Bible Camp',
  PERSONAL_VERIFIED_EMAILS: 'carole_smith7171@hotmail.com',
  PERSONAL_EMAILS: 'c_smith9833@yahoo.com,carole_smith7171@hotmail.com',
  PERSONAL_PHONE: '+15125550123',
  PERSONAL_STATE: 'TX',
  PERSONAL_CITY: 'Austin',
  // note: NO *_EMAIL_VALIDATION_STATUS (as real webhook events)
}

describe('normalizeALPayload — verified-email handling', () => {
  it('treats a present verified email as valid even without a status field', () => {
    const id = normalizeALPayload(webhookVisitor)
    expect(id.email_validation_status).toBe('valid')
  })

  it('selects the verified email as primary', () => {
    const id = normalizeALPayload(webhookVisitor)
    expect(id.primary_email).toBe('carole_smith7171@hotmail.com')
  })

  it('leaves status null when there is no verified email', () => {
    const id = normalizeALPayload({ FIRST_NAME: 'X', LAST_NAME: 'Y', PERSONAL_EMAILS: 'x@y.com' })
    expect(id.email_validation_status).toBeNull()
  })

  it('makes a verified-email visitor lead-worthy (the fix)', () => {
    const id = normalizeALPayload(webhookVisitor)
    expect(id.deliverability_score).toBeGreaterThan(0)
    const worthy = isLeadWorthy({
      eventType: 'identify',
      deliverabilityScore: id.deliverability_score,
      hasVerifiedEmail: id.email_validation_status === 'valid',
      hasBusinessEmail: id.business_emails.length > 0,
      hasPhone: id.phones.length > 0,
      hasName: !!(id.first_name && id.last_name),
      hasCompany: !!id.company_name,
    })
    expect(worthy).toBe(true)
  })
})
