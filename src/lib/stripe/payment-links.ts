/**
 * Stripe Payment Links Configuration
 * Centralized payment link URLs using custom domain pay.meetcursive.com
 */

export const PAYMENT_LINKS = {
  // === Service Tier Payment Links (Marketing Pages) ===
  services: {
    data: {
      name: 'Cursive Data',
      url: 'https://pay.meetcursive.com/b/6oU9AT3rnfZX6kZg9R8g003',
      plink: 'plink_1SxHLUEmhKaqBpAEG2WuxMyM',
    },
    outbound: {
      name: 'Cursive Outbound',
      url: 'https://pay.meetcursive.com/b/8x27sLaTPcNL7p38Hp8g002',
      plink: 'plink_1SxHJKEmhKaqBpAErwukEcwo',
    },
    pipeline: {
      name: 'Cursive Automated Pipeline',
      url: 'https://pay.meetcursive.com/b/bJe7sLge9bJHgZD2j18g001',
      plink: 'plink_1SxHINEmhKaqBpAETu1A9XTg',
    },
  },

  // === Subscription Plan Payment Links ===
  subscriptions: {
    starter: {
      monthly: {
        name: 'Cursive Starter',
        url: 'https://pay.meetcursive.com/b/14AbJ1aTP1535gV5vd8g008',
        plink: 'plink_1SxHOuEmhKaqBpAE79yS8yGp',
      },
      annual: {
        name: 'Cursive Starter',
        url: 'https://pay.meetcursive.com/b/bJebJ1bXT153cJn2j18g00d',
        plink: 'plink_1SxHR1EmhKaqBpAEZRkBs81g',
      },
    },
    pro: {
      monthly: {
        name: 'Cursive Pro',
        url: 'https://pay.meetcursive.com/b/fZubJ12njaFD38NbTB8g00b',
        plink: 'plink_1SxHQMEmhKaqBpAEcS5T3lHy',
      },
      annual: {
        name: 'Cursive Pro',
        url: 'https://pay.meetcursive.com/b/dRmbJ17HDeVT6kZ3n58g00c',
        plink: 'plink_1SxHQfEmhKaqBpAEpjg540E3',
      },
    },
    enterprise: {
      monthly: {
        name: 'Cursive Enterprise',
        url: 'https://pay.meetcursive.com/b/aFacN56DzfZX9xb9Lt8g009',
        plink: 'plink_1SxHPUEmhKaqBpAEmrYYZgUI',
      },
      annual: {
        name: 'Cursive Enterprise',
        url: 'https://pay.meetcursive.com/b/8x2dR90fb1538t7bTB8g00a',
        plink: 'plink_1SxHPlEmhKaqBpAESUys5NDR',
      },
    },
  },

  // === Credit Purchase Payment Links ===
  credits: {
    leadPurchase: {
      name: 'Cursive Lead Purchase',
      url: 'https://pay.meetcursive.com/b/dRm4gz6DzeVTgZD1eX8g007',
      plink: 'plink_1SxHO4EmhKaqBpAEKecEn5KY',
    },
    starter: {
      name: 'Starter Credits',
      url: 'https://pay.meetcursive.com/b/aFa00jbXTdRPdNrbTB8g006',
      plink: 'plink_1SxHMlEmhKaqBpAEFKOGjbfb',
    },
    professional: {
      name: 'Professional Credits',
      url: 'https://pay.meetcursive.com/b/bJe28r5zv3dbcJn0aT8g005',
      plink: 'plink_1SxHMQEmhKaqBpAEVCDBntNF',
    },
    enterprise: {
      name: 'Enterprise Credits',
      url: 'https://pay.meetcursive.com/b/fZu3cv5zveVT8t76zh8g004',
      plink: 'plink_1SxHLoEmhKaqBpAEj1HPztiU',
    },
  },
} as const

/** Helper to get subscription link by plan name and billing cycle */
export function getSubscriptionLink(
  plan: 'starter' | 'pro' | 'enterprise',
  cycle: 'monthly' | 'annual'
): string {
  return PAYMENT_LINKS.subscriptions[plan][cycle].url
}

/** Helper to get service link by service name */
export function getServiceLink(
  service: 'data' | 'outbound' | 'pipeline'
): string {
  return PAYMENT_LINKS.services[service].url
}

/** Helper to get credit purchase link */
export function getCreditLink(
  tier: 'leadPurchase' | 'starter' | 'professional' | 'enterprise'
): string {
  return PAYMENT_LINKS.credits[tier].url
}
