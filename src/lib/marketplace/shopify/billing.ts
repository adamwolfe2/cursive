// Shopify Billing API — appSubscriptionCreate.
//
// Shopify requires merchant payments for marketplace apps to flow through
// their Billing API. We define plans here as code (single source of truth)
// and call appSubscriptionCreate during the post-install confirmation
// step.
//
// Plan tiers per product decision:
//   trial    — 14 days free, all features
//   starter  — entry tier
//   growth   — adds Meta CA + Lookalikes (post-MVP, AudienceLab handles sync)
//   scale    — adds AI segment recommendations + priority support
//
// Pricing intentionally placeholder (per "what you have is fine"). Final
// numbers can be set without code changes via env (SHOPIFY_PLAN_*_PRICE).

const SHOPIFY_API_VERSION = '2024-10'

export type ShopifyPlanTier = 'trial' | 'starter' | 'growth' | 'scale'

export interface ShopifyPlan {
  tier: ShopifyPlanTier
  name: string
  monthlyPrice: number
  trialDays: number
  features: string[]
}

/**
 * Plan catalog. Updating prices is one-line per tier; no Shopify partner
 * dashboard config required (Billing API takes price at request time).
 */
export const SHOPIFY_PLANS: Record<Exclude<ShopifyPlanTier, 'trial'>, ShopifyPlan> = {
  starter: {
    tier: 'starter',
    name: 'Cursive — Starter',
    monthlyPrice: Number(process.env.SHOPIFY_PLAN_STARTER_PRICE ?? '99'),
    trialDays: 14,
    features: [
      'Identify high-intent visitors',
      'Sync to Cursive dashboard',
      'Customer metafield writeback',
      'Shopify Flow triggers',
    ],
  },
  growth: {
    tier: 'growth',
    name: 'Cursive — Growth',
    monthlyPrice: Number(process.env.SHOPIFY_PLAN_GROWTH_PRICE ?? '299'),
    trialDays: 14,
    features: [
      'Everything in Starter',
      'Meta Custom Audiences + 6 Lookalikes',
      'Klaviyo profile sync',
      'Suppression on checkout (no wasted ad spend on customers)',
    ],
  },
  scale: {
    tier: 'scale',
    name: 'Cursive — Scale',
    monthlyPrice: Number(process.env.SHOPIFY_PLAN_SCALE_PRICE ?? '599'),
    trialDays: 14,
    features: [
      'Everything in Growth',
      'AI segment recommendations',
      'MCP access for AI automation agencies',
      'Priority support',
    ],
  },
}

interface AppSubscriptionCreateResult {
  confirmationUrl: string | null
  appSubscriptionId: string | null
  errors: Array<{ field?: string[]; message: string }>
}

/**
 * Create a Shopify app subscription. Returns a confirmationUrl that the
 * merchant must visit to authorize the recurring charge. Until the merchant
 * confirms, the subscription is in PENDING state and we don't grant the
 * paid plan features.
 *
 * Test mode (test=true) is used in dev stores — Shopify accepts any price
 * without actually charging.
 */
export async function appSubscriptionCreate(params: {
  shop: string
  accessToken: string
  plan: ShopifyPlan
  returnUrl: string
  test?: boolean
}): Promise<AppSubscriptionCreateResult> {
  const res = await fetch(
    `https://${params.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: `mutation appSubscriptionCreate(
          $name: String!
          $returnUrl: URL!
          $trialDays: Int
          $test: Boolean
          $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
          appSubscriptionCreate(
            name: $name
            returnUrl: $returnUrl
            trialDays: $trialDays
            test: $test
            lineItems: $lineItems
          ) {
            appSubscription { id status }
            confirmationUrl
            userErrors { field message }
          }
        }`,
        variables: {
          name: params.plan.name,
          returnUrl: params.returnUrl,
          trialDays: params.plan.trialDays,
          test: params.test ?? false,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: params.plan.monthlyPrice, currencyCode: 'USD' },
                  interval: 'EVERY_30_DAYS',
                },
              },
            },
          ],
        },
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Shopify appSubscriptionCreate failed: ${res.status} — ${text}`)
  }

  const json = (await res.json()) as {
    data?: {
      appSubscriptionCreate: {
        appSubscription: { id: string; status: string } | null
        confirmationUrl: string | null
        userErrors: Array<{ field?: string[]; message: string }>
      }
    }
    errors?: unknown
  }

  if (json.errors || !json.data) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`)
  }

  return {
    confirmationUrl: json.data.appSubscriptionCreate.confirmationUrl,
    appSubscriptionId: json.data.appSubscriptionCreate.appSubscription?.id ?? null,
    errors: json.data.appSubscriptionCreate.userErrors ?? [],
  }
}

/**
 * Cancel an active subscription. Used on uninstall.
 */
export async function appSubscriptionCancel(params: {
  shop: string
  accessToken: string
  subscriptionId: string
}): Promise<void> {
  await fetch(
    `https://${params.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `mutation appSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription { id status }
            userErrors { field message }
          }
        }`,
        variables: { id: params.subscriptionId },
      }),
    },
  )
}
