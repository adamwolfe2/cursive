/**
 * Copy Generation V3 — helper tests.
 *
 * These cover the pure derivation functions that drive the copy pipeline:
 *   - deriveAovTier
 *   - deriveVoiceProfile
 *   - deriveSpintaxEnabled
 *   - wordCapForStep
 *
 * Network-bound functions (writeCopy, selectAngles, regenerateSingleEmail)
 * are NOT tested here — those go through Claude and are integration-tested
 * separately. These tests cover the deterministic glue.
 */

import { describe, it, expect } from 'vitest'
import {
  deriveAovTier,
  deriveVoiceProfile,
  deriveSpintaxEnabled,
  wordCapForStep,
  WORD_CAPS_BY_POSITION,
} from '../copy-generation'
import type { OnboardingClient } from '@/types/onboarding'

function makeClient(overrides: Partial<OnboardingClient> = {}): OnboardingClient {
  return {
    id: 'test-id',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status: 'onboarding',
    company_name: 'Test Co',
    company_website: 'test.co',
    industry: 'creative services',
    primary_contact_name: 'Test Person',
    primary_contact_email: 'test@test.co',
    primary_contact_phone: '',
    billing_contact_name: null,
    billing_contact_email: null,
    team_members: null,
    communication_channel: 'Email',
    slack_url: null,
    referral_source: null,
    referral_detail: null,
    packages_selected: ['outbound'],
    setup_fee: null,
    recurring_fee: null,
    billing_cadence: null,
    outbound_tier: null,
    custom_tier_details: null,
    payment_method: null,
    invoice_email: null,
    domain_cost_acknowledged: false,
    audience_cost_acknowledged: false,
    pixel_cost_acknowledged: false,
    additional_audience_noted: false,
    icp_description: null,
    target_industries: [],
    sub_industries: [],
    target_company_sizes: [],
    target_titles: [],
    target_geography: [],
    specific_regions: null,
    must_have_traits: null,
    exclusion_criteria: null,
    pain_points: null,
    intent_keywords: [],
    competitor_names: [],
    best_customers: null,
    sample_accounts: null,
    sending_volume: null,
    lead_volume: null,
    start_timeline: null,
    sender_names: null,
    domain_variations: null,
    domains_approval_url: null,
    domain_provider: null,
    existing_domains: null,
    copy_tone: null,
    primary_cta: null,
    custom_cta: null,
    calendar_link: null,
    reply_routing_email: null,
    backup_reply_email: null,
    compliance_disclaimers: null,
    voice_profile: null,
    spintax_enabled: null,
    case_studies: [],
    prospect_signal_template: null,
    pixel_urls: null,
    uses_gtm: null,
    gtm_container_id: null,
    pixel_installer: null,
    developer_email: null,
    pixel_delivery: [],
    pixel_delivery_other: null,
    pixel_crm_name: null,
    conversion_events: null,
    monthly_traffic: null,
    audience_refresh: null,
    data_use_cases: [],
    primary_crm: null,
    custom_platform: null,
    data_format: null,
    audience_count: null,
    has_existing_list: null,
    copy_approval: false,
    sender_identity_approval: false,
    sow_signed: false,
    payment_confirmed: false,
    data_usage_ack: false,
    privacy_ack: false,
    billing_terms_ack: false,
    additional_notes: null,
    signature_name: null,
    signature_date: null,
    intake_source: 'internal_intake',
    campaign_deployed: false,
    emailbison_campaign_ids: [],
    campaign_stats: null,
    assigned_workspace_id: null,
    eb_workspace_id: null,
    is_test_client: false,
    stripe_invoice_id: null,
    stripe_invoice_url: null,
    stripe_invoice_status: null,
    rabbitsign_folder_id: null,
    rabbitsign_status: null,
    contract_signed_at: null,
    portal_invite_sent_at: null,
    portal_last_visited_at: null,
    enriched_icp_brief: null,
    enrichment_status: 'pending',
    draft_sequences: null,
    copy_generation_status: 'pending',
    copy_approval_status: 'pending',
    slack_notification_sent: false,
    confirmation_email_sent: false,
    crm_record_id: null,
    crm_sync_status: 'pending',
    onboarding_complete: false,
    automation_log: [],
    admin_notes: null,
    ...overrides,
  }
}

describe('deriveAovTier', () => {
  it('returns "low" for $0-$5K', () => {
    expect(deriveAovTier(makeClient({ setup_fee: 4000 }))).toBe('low')
    expect(deriveAovTier(makeClient({ setup_fee: 0, recurring_fee: 0 }))).toBe('low')
  })

  it('returns "mid" for $5K-$15K', () => {
    expect(deriveAovTier(makeClient({ setup_fee: 7500 }))).toBe('mid')
    expect(deriveAovTier(makeClient({ setup_fee: 14999 }))).toBe('mid')
  })

  it('returns "high" for $15K-$75K', () => {
    expect(deriveAovTier(makeClient({ setup_fee: 35000 }))).toBe('high')
    expect(deriveAovTier(makeClient({ setup_fee: 74999 }))).toBe('high')
  })

  it('returns "enterprise" for $75K+', () => {
    expect(deriveAovTier(makeClient({ setup_fee: 100000 }))).toBe('enterprise')
    expect(deriveAovTier(makeClient({ setup_fee: 250000 }))).toBe('enterprise')
  })

  it('takes the larger of (setup_fee, 6 * recurring_fee)', () => {
    // recurring of $5K/month -> annualized 6 months = $30K -> high
    expect(deriveAovTier(makeClient({ setup_fee: 1000, recurring_fee: 5000 }))).toBe('high')
    // setup of $50K -> high (recurring is small)
    expect(deriveAovTier(makeClient({ setup_fee: 50000, recurring_fee: 100 }))).toBe('high')
  })
})

describe('deriveVoiceProfile', () => {
  it('honors explicit voice_profile when set', () => {
    expect(deriveVoiceProfile(makeClient({ voice_profile: 'consultant_authoritative', setup_fee: 4000 }))).toBe(
      'consultant_authoritative',
    )
  })

  it('defaults to founder_direct for high-AOV', () => {
    expect(deriveVoiceProfile(makeClient({ setup_fee: 35000 }))).toBe('founder_direct')
  })

  it('defaults to consultant_authoritative for enterprise', () => {
    expect(deriveVoiceProfile(makeClient({ setup_fee: 100000 }))).toBe('consultant_authoritative')
  })

  it('defaults to agency_professional for low/mid AOV', () => {
    expect(deriveVoiceProfile(makeClient({ setup_fee: 4000 }))).toBe('agency_professional')
    expect(deriveVoiceProfile(makeClient({ setup_fee: 10000 }))).toBe('agency_professional')
  })

  it('downshifts agency_professional -> founder_direct when copy_tone signals informal', () => {
    expect(
      deriveVoiceProfile(makeClient({ setup_fee: 4000, copy_tone: 'Direct/Bold' })),
    ).toBe('founder_direct')
    expect(
      deriveVoiceProfile(makeClient({ setup_fee: 4000, copy_tone: 'Friendly/Casual' })),
    ).toBe('founder_direct')
  })

  it('does NOT downshift consultant_authoritative or founder_direct', () => {
    // setup_fee = 100K -> tier 'enterprise' -> default consultant_authoritative
    // copy_tone "Direct/Bold" should NOT change this (only agency -> founder)
    expect(
      deriveVoiceProfile(makeClient({ setup_fee: 100000, copy_tone: 'Direct/Bold' })),
    ).toBe('consultant_authoritative')
  })
})

describe('deriveSpintaxEnabled', () => {
  it('honors explicit spintax_enabled when set', () => {
    expect(deriveSpintaxEnabled(makeClient({ spintax_enabled: true, setup_fee: 35000 }))).toBe(true)
    expect(deriveSpintaxEnabled(makeClient({ spintax_enabled: false, setup_fee: 4000 }))).toBe(false)
  })

  it('defaults to false for high-AOV (precision doctrine)', () => {
    expect(deriveSpintaxEnabled(makeClient({ setup_fee: 35000 }))).toBe(false)
    expect(deriveSpintaxEnabled(makeClient({ setup_fee: 100000 }))).toBe(false)
  })

  it('defaults to true for low/mid-AOV (volume doctrine)', () => {
    expect(deriveSpintaxEnabled(makeClient({ setup_fee: 4000 }))).toBe(true)
    expect(deriveSpintaxEnabled(makeClient({ setup_fee: 10000 }))).toBe(true)
  })
})

describe('wordCapForStep', () => {
  it('returns 75 for step 1', () => {
    expect(wordCapForStep(1)).toBe(75)
    expect(wordCapForStep(0)).toBe(75) // edge
  })

  it('returns 60 for steps 2 and 3', () => {
    expect(wordCapForStep(2)).toBe(60)
    expect(wordCapForStep(3)).toBe(60)
  })

  it('returns 40 for step 4 (breakup) and beyond', () => {
    expect(wordCapForStep(4)).toBe(40)
    expect(wordCapForStep(5)).toBe(40)
  })

  it('exposed constants match per-step values', () => {
    expect(WORD_CAPS_BY_POSITION.email_1).toBe(75)
    expect(WORD_CAPS_BY_POSITION.email_2_3).toBe(60)
    expect(WORD_CAPS_BY_POSITION.email_4_breakup).toBe(40)
  })
})
