/**
 * Partner program data for the marketing site.
 *
 * MIRROR of the canonical sources in the app repo:
 *   - ramp tiers     → src/lib/affiliate/ramp.ts
 *   - agreement text → src/lib/affiliate/agreement.ts
 *
 * The marketing app can't import the app's `src/`, so this is duplicated for
 * display. The app copy is authoritative — what partners actually sign/earn.
 * Keep in sync when either changes.
 */

export const PORTAL_URL = 'https://leads.meetcursive.com/partners/portal'
export const APPLY_API = 'https://leads.meetcursive.com/api/affiliate/apply'
export const AGREEMENT_VERSION = 'v1.0-2026-06'

export interface RampTier {
  minPaying: number
  rate: number
  label: string
  range: string
}

export const RAMP_TIERS: RampTier[] = [
  { minPaying: 0, rate: 15, label: 'Partner', range: '0–4' },
  { minPaying: 5, rate: 20, label: 'Bronze', range: '5–14' },
  { minPaying: 15, rate: 25, label: 'Silver', range: '15–24' },
  { minPaying: 25, rate: 30, label: 'Gold', range: '25–34' },
  { minPaying: 35, rate: 35, label: 'Platinum', range: '35–44' },
  { minPaying: 45, rate: 40, label: 'Elite', range: '45+' },
]

export interface AgreementSection {
  heading: string
  body: string[]
}

/** Concise public summary of the agreement (full legal copy lives in-portal). */
export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    heading: '1. Relationship',
    body: [
      'You are an independent contractor, not an employee or agent of Cursive. The arrangement is non-exclusive. You are responsible for your own taxes, tools, and outbound infrastructure.',
    ],
  },
  {
    heading: '2. Commission & ramp',
    body: [
      'You earn recurring commission on net recurring revenue Cursive collects from your referred customers, for as long as they keep paying.',
      'Your rate scales with your number of currently-active paying referrals: 0–4 = 15%, 5–14 = 20%, 15–24 = 25%, 25–34 = 30%, 35–44 = 35%, 45+ = 40%. Your current rate applies to your entire active book each cycle. If a referral cancels, your active count (and rate) can decrease.',
    ],
  },
  {
    heading: '3. Attribution',
    body: [
      'Attribution is determined by Cursive’s server-side tracking tied to your referral link at signup (30-day first-touch cookie). Self-referrals and fabricated attribution are prohibited and reversed.',
    ],
  },
  {
    heading: '4. Payouts',
    body: [
      'Commissions are paid monthly via Stripe Connect once you’ve signed this agreement and completed Stripe onboarding (incl. tax info), subject to a $50 minimum. You are responsible for your own taxes; applicable 1099/tax forms are issued via Stripe.',
    ],
  },
  {
    heading: '5. Refunds & clawbacks',
    body: [
      'If a referred payment is refunded, charged back, or reversed, the related commission is reversed and netted from future commissions.',
    ],
  },
  {
    heading: '6. Conduct & compliance',
    body: [
      'You must comply with all applicable laws including CAN-SPAM, GDPR/CCPA, and FTC endorsement rules, disclose your partner relationship where required, make no false or guaranteed-earnings claims, and use only approved Cursive assets. You own your outbound and its consequences.',
    ],
  },
  {
    heading: '7. Term & changes',
    body: [
      'Either party may terminate at any time on written notice. Cursive may update the program prospectively on notice; changes never retroactively reduce commissions already earned. No earnings are guaranteed.',
    ],
  },
]
