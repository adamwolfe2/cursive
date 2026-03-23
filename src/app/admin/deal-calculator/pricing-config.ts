// Cursive Deal Calculator — Pricing Configuration
// All costs, tiers, and infrastructure pricing in one place

// ---------------------------------------------------------------------------
// Infrastructure costs (at-cost to client)
// ---------------------------------------------------------------------------

export const INFRA_COSTS = {
  domain: { min: 10, max: 15, default: 12, unit: 'year' as const, label: 'Sending Domain' },
  inbox: { min: 6, max: 8, default: 7, unit: 'month' as const, label: 'Email Inbox' },
} as const

// ---------------------------------------------------------------------------
// Outbound tiers — defines infrastructure + volume + pricing
// ---------------------------------------------------------------------------

export interface OutboundTier {
  id: string
  name: string
  domains: number
  inboxes: number
  emailsPerMonth: number
  monthlyPrice: number
  setupFee: number
  description: string
}

export const OUTBOUND_TIERS: OutboundTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    domains: 3,
    inboxes: 6,
    emailsPerMonth: 5000,
    monthlyPrice: 1000,
    setupFee: 500,
    description: '3 domains, 6 inboxes, up to 5K emails/mo',
  },
  {
    id: 'growth',
    name: 'Growth',
    domains: 5,
    inboxes: 15,
    emailsPerMonth: 15000,
    monthlyPrice: 2500,
    setupFee: 1000,
    description: '5 domains, 15 inboxes, up to 15K emails/mo',
  },
  {
    id: 'scale',
    name: 'Scale',
    domains: 10,
    inboxes: 30,
    emailsPerMonth: 50000,
    monthlyPrice: 5000,
    setupFee: 1500,
    description: '10 domains, 30 inboxes, up to 50K emails/mo',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    domains: 20,
    inboxes: 60,
    emailsPerMonth: 100000,
    monthlyPrice: 10000,
    setupFee: 2500,
    description: 'Custom domains/inboxes, unlimited volume',
  },
]

// ---------------------------------------------------------------------------
// Service packages (add-ons / standalone)
// ---------------------------------------------------------------------------

export interface ServicePackage {
  id: string
  name: string
  description: string
  monthlyPrice: number
  setupFee: number
  requiresOutbound: boolean
  category: 'core' | 'addon' | 'standalone'
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'super_pixel',
    name: 'Super Pixel',
    description: 'Website visitor identification + audience building',
    monthlyPrice: 500,
    setupFee: 250,
    requiresOutbound: false,
    category: 'core',
  },
  {
    id: 'audience',
    name: 'Audience / Lead Lists',
    description: 'Enriched lead lists built to exact ICP specifications',
    monthlyPrice: 750,
    setupFee: 0,
    requiresOutbound: false,
    category: 'core',
  },
  {
    id: 'enrichment',
    name: 'List Enrichment',
    description: 'Enrich existing contact/company lists with fresh data',
    monthlyPrice: 500,
    setupFee: 0,
    requiresOutbound: false,
    category: 'addon',
  },
  {
    id: 'paid_ads',
    name: 'Paid Ads Activation',
    description: 'Sync identified audiences to ad platforms for retargeting',
    monthlyPrice: 500,
    setupFee: 250,
    requiresOutbound: false,
    category: 'addon',
  },
  {
    id: 'data_delivery',
    name: 'Data Delivery',
    description: 'CSV, Google Sheet, or CRM sync data delivery',
    monthlyPrice: 250,
    setupFee: 0,
    requiresOutbound: false,
    category: 'addon',
  },
]

// ---------------------------------------------------------------------------
// Bundle discounts
// ---------------------------------------------------------------------------

export const BUNDLE_DISCOUNT = {
  pixel_plus_outbound: 0.10, // 10% off total when bundling pixel + outbound
  three_plus_services: 0.05, // 5% off when 3+ services selected
} as const

// ---------------------------------------------------------------------------
// Service tier mapping (enterprise DFY tiers)
// ---------------------------------------------------------------------------

export const SERVICE_TIERS = [
  {
    id: 'cursive-data',
    name: 'Cursive Data',
    monthlyPrice: 1000,
    setupFee: 0,
    description: 'Custom lead research, 500-1500 leads/month',
  },
  {
    id: 'cursive-outbound',
    name: 'Cursive Outbound',
    monthlyPrice: 2500,
    setupFee: 0,
    description: 'Data + custom email sequences, AI personalization, dedicated manager',
  },
  {
    id: 'cursive-pipeline',
    name: 'Cursive Automated Pipeline',
    monthlyPrice: 5000,
    setupFee: 0,
    description: 'Multi-channel outreach, AI SDR, meeting booking, CRM integration',
  },
  {
    id: 'cursive-venture',
    name: 'Cursive Venture Studio',
    monthlyPrice: 25000,
    setupFee: 0,
    description: 'Full growth team, strategic consulting, equity partnership option',
  },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function calculateInfraCost(
  domains: number,
  inboxes: number,
  domainCostPer: number = INFRA_COSTS.domain.default,
  inboxCostPer: number = INFRA_COSTS.inbox.default
): { domainCostMonthly: number; inboxCostMonthly: number; totalMonthly: number; totalAnnual: number } {
  const domainCostMonthly = (domains * domainCostPer) / 12 // domains are annual, convert to monthly
  const inboxCostMonthly = inboxes * inboxCostPer
  const totalMonthly = domainCostMonthly + inboxCostMonthly
  return {
    domainCostMonthly: Math.round(domainCostMonthly * 100) / 100,
    inboxCostMonthly: Math.round(inboxCostMonthly * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalMonthly * 12 * 100) / 100,
  }
}
