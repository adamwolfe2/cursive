/**
 * Cursive Outbound Distribution Partner Agreement — canonical content.
 *
 * Single source of truth for the legal text rendered in:
 *   - the in-portal signable contract  (/partners/portal/agreement)
 *   - the public terms page            (marketing /partners/terms)
 *   - the marketing one-pager summary  (marketing /partners)
 *
 * The exact text the partner signs is hashed (sha256) and stored alongside
 * their signature in `affiliate_agreements.document_hash`, so we can always
 * prove WHICH version they agreed to.
 *
 * NOTE: This is a practical template reflecting Cursive's commission policy. It
 * is NOT a substitute for review by licensed counsel before launch. Update
 * COMPANY_LEGAL_NAME and GOVERNING_LAW once finalized.
 */

// Bumped v1.0 -> v1.1: the contracting party is now the actual legal entity
// (AM Collective LLC operating the Cursive program), not the trade name alone.
// A contracting-party change is material, so the version bump forces partners
// to re-accept the corrected text (their prior signature was on v1.0).
export const AGREEMENT_VERSION = 'v1.1-2026-06'

// The legal entity that contracts with and pays partners (matches the Stripe
// Connect platform account). Defined as "Cursive" throughout the agreement.
// NOTE: update if/when the program moves to a Cursive LLC entity.
export const COMPANY_LEGAL_NAME = 'AM Collective LLC (d/b/a Cursive · meetcursive.com)'
export const GOVERNING_LAW = 'the State of Delaware, USA'
export const MIN_PAYOUT_USD = 50

export interface AgreementSection {
  readonly id: string
  readonly heading: string
  readonly body: readonly string[]
}

export const AGREEMENT_SECTIONS: readonly AgreementSection[] = [
  {
    id: 'parties',
    heading: '1. Parties & Relationship',
    body: [
      `This Outbound Distribution Partner Agreement (the "Agreement") is entered into between ${COMPANY_LEGAL_NAME} ("Cursive", "we", "us") and the individual or entity accepting it ("Partner", "you").`,
      'You are an independent contractor. Nothing in this Agreement creates an employment, agency, partnership, or joint-venture relationship. You have no authority to bind Cursive, make representations on its behalf, or incur obligations in its name. You are solely responsible for your own taxes, expenses, tools, and infrastructure.',
      'This Agreement is non-exclusive. Both parties may enter similar arrangements with others.',
    ],
  },
  {
    id: 'program',
    heading: '2. The Program',
    body: [
      'Cursive operates a referral/affiliate program for its lead-generation products, including the Visitor Pixel, Custom Audience, Bundle offers, and higher service tiers. You will be issued a unique referral code and links.',
      'You may promote Cursive through lawful channels of your choosing — including outbound email, LinkedIn, social, paid media (where permitted), content, and direct referral — at your own cost and effort. You own and are solely responsible for your outbound activity and the infrastructure used to perform it.',
      'A "Referred Customer" is a person or business that signs up through your referral link/code and is attributed to you via Cursive’s server-side tracking.',
    ],
  },
  {
    id: 'commission',
    heading: '3. Commission & Ramp',
    body: [
      'You earn a recurring commission on the net recurring revenue actually collected by Cursive from each of your Referred Customers, for as long as that customer maintains an active paid subscription.',
      'Your commission rate scales with the number of your Referred Customers who are currently on active paid subscriptions ("Active Paying Referrals"), per the following ramp: 0–4 = 15%; 5–14 = 20%; 15–24 = 25%; 25–34 = 30%; 35–44 = 35%; 45 or more = 40%.',
      'Your current rate applies to your entire active book during each billing cycle (retroactive whole-book). When you cross a threshold, all of your active referrals are commissioned at the higher rate going forward.',
      'Your tier reflects your CURRENT Active Paying Referrals. If a Referred Customer cancels, downgrades, or otherwise stops paying, your Active Paying Referrals count decreases, which may lower your rate accordingly.',
      'Commission is calculated on amounts actually paid to and retained by Cursive. Taxes, processing fees, discounts, and credits are excluded.',
    ],
  },
  {
    id: 'attribution',
    heading: '4. Attribution',
    body: [
      'Attribution is determined solely by Cursive’s server-side tracking tied to your referral link/code at the time the Referred Customer signs up. A first-touch attribution window of 30 days applies via cookie; the recorded attribution at signup governs.',
      'Self-referrals, referrals of your own accounts or entities you control, and any attempt to attribute customers you did not genuinely refer are prohibited and will be reversed.',
      'Cursive’s records are the authoritative source for attribution, conversions, and amounts. Cursive may correct attribution errors and reverse commissions resulting from fraud, error, or policy violation.',
    ],
  },
  {
    id: 'payouts',
    heading: '5. Payouts',
    body: [
      `Commissions are paid via Stripe Connect. You must complete Stripe Connect onboarding (including identity and tax information) before any payout can be made. Payouts are made monthly for the prior period, subject to a minimum balance of $${MIN_PAYOUT_USD}; balances below the minimum roll forward.`,
      'You are responsible for all taxes on amounts you receive. Where required, Cursive (or Stripe) will collect a W-9/W-8 and issue applicable tax forms (e.g., 1099). Cursive does not withhold taxes on your behalf.',
      'Commissions only become payable after you have accepted this Agreement and completed Stripe Connect onboarding. Until then, earned commissions accrue as pending.',
    ],
  },
  {
    id: 'clawback',
    heading: '6. Refunds, Chargebacks & Clawbacks',
    body: [
      'If a Referred Customer’s payment is refunded, charged back, disputed, or reversed, the associated commission is reversed. If already paid to you, the reversed amount is deducted (netted) from your future commissions or, where necessary, invoiced to you.',
      'Cursive may withhold or delay payouts it reasonably believes to be associated with fraud, abuse, or violation of this Agreement, pending investigation.',
    ],
  },
  {
    id: 'conduct',
    heading: '7. Marketing Conduct & Compliance',
    body: [
      'You will comply with all applicable laws and regulations in your promotion, including the CAN-SPAM Act, GDPR/CCPA where applicable, the FTC Endorsement Guides, and all anti-spam and data-protection laws. You will clearly and conspicuously disclose your affiliate/partner relationship with Cursive wherever required.',
      'You will not: send unsolicited messages in violation of law; make false, misleading, or unauthorized claims about Cursive or its products; guarantee results or earnings; bid on Cursive’s trademarks in paid search without written permission; use spyware/adware, cookie-stuffing, typosquatting, or incentivized/bot traffic; or represent yourself as Cursive.',
      'You will use only Cursive-approved names, logos, and marketing assets, and only as permitted. All goodwill from such use inures to Cursive.',
      'You are solely responsible for your outbound infrastructure, deliverability, sending reputation, list sourcing, and any consequences arising from your activity.',
    ],
  },
  {
    id: 'ip',
    heading: '8. Intellectual Property & Confidentiality',
    body: [
      'Cursive retains all rights in its brand, products, and materials. This Agreement grants only a limited, revocable, non-exclusive, non-transferable license to use approved assets to promote Cursive while this Agreement is in effect.',
      'You will keep confidential any non-public information disclosed to you (including commission structures specific to you, product roadmaps, and customer data) and will not use it except to perform under this Agreement.',
      'You will handle any personal data you collect in compliance with applicable law and will not transfer customer personal data to Cursive except as part of legitimate referral activity.',
    ],
  },
  {
    id: 'term',
    heading: '9. Term, Termination & Changes',
    body: [
      'Either party may terminate this Agreement at any time, for any reason, on written notice (email is sufficient). Upon termination, your referral links are deactivated and your license to use Cursive assets ends.',
      'Commissions earned on subscriptions active as of termination are paid out in the ordinary course, subject to this Agreement (including clawback), unless termination is for fraud or material breach, in which case Cursive may forfeit unpaid commissions.',
      'Cursive may modify the program, commission ramp, or these terms prospectively on notice (including by posting an updated version). Continued participation after the effective date constitutes acceptance. Changes do not retroactively reduce commissions already earned.',
    ],
  },
  {
    id: 'liability',
    heading: '10. No Guarantee, Disclaimers & Liability',
    body: [
      'Cursive makes no representation or guarantee regarding any level of earnings, conversions, or income. Your results depend on your own efforts and factors outside Cursive’s control.',
      'The program is provided "as is". To the maximum extent permitted by law, Cursive disclaims all implied warranties and will not be liable for indirect, incidental, special, or consequential damages. Cursive’s total liability under this Agreement will not exceed the commissions paid to you in the 6 months preceding the claim.',
      'You will indemnify Cursive against claims arising from your marketing activity, your infrastructure, or your breach of this Agreement.',
    ],
  },
  {
    id: 'governing',
    heading: '11. Governing Law & Acceptance',
    body: [
      `This Agreement is governed by the laws of ${GOVERNING_LAW}, without regard to conflict-of-laws rules. The parties consent to the exclusive jurisdiction of the courts located there.`,
      'By typing your name, drawing your signature, and submitting, you acknowledge that you have read, understood, and agree to be bound by this Agreement, and that electronic acceptance is legally binding and equivalent to a handwritten signature.',
    ],
  },
] as const

/** Flatten the agreement to a stable plain-text form for hashing/display. */
export function agreementPlainText(): string {
  const header = `Cursive Outbound Distribution Partner Agreement\nVersion: ${AGREEMENT_VERSION}\n\n`
  const body = AGREEMENT_SECTIONS.map(
    (s) => `${s.heading}\n${s.body.join('\n')}`
  ).join('\n\n')
  return header + body
}
