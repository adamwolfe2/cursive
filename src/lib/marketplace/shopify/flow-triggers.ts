// Shopify Flow trigger emitter.
//
// Triggers are server-side events fired from Cursive's Inngest jobs into
// the merchant's Shopify Flow workflows. Once a merchant has built a Flow
// using one of our triggers, any matching event will run their entire
// downstream automation chain (Klaviyo, SMS, Slack, etc.) without us
// touching their code.
//
// Trigger handles MUST match shopify.extension.toml. Field keys MUST match
// what the TOML declares — Shopify rejects payloads with extra/missing
// fields against the registered schema.

const SHOPIFY_API_VERSION = '2024-10'

export type FlowTriggerHandle =
  | 'cursive-visitor-resolved'
  | 'cursive-high-intent-detected'
  | 'cursive-checkout-abandoned-high-intent'

export interface FlowTriggerPayload {
  // Common across all triggers
  email: string
  // Optional / per-trigger
  first_name?: string
  last_name?: string
  phone?: string
  intent_score?: number
  city?: string
  state?: string
  page_url?: string
  products_viewed?: string
  cart_total?: string
  products_in_cart?: string
}

interface FireResult {
  success: boolean
  error?: string
}

/**
 * Fire a Flow trigger. Per Shopify, server-side triggers are dispatched
 * via the Admin GraphQL `flowTriggerReceive` mutation, which forwards the
 * event into any Flow workflow the merchant has built using our trigger.
 *
 * Failure modes:
 *  - Merchant hasn't built a Flow on this trigger → success, but no Flow runs
 *  - Trigger handle doesn't match TOML → userErrors, we log
 *  - Token expired → 401, caller should refresh and retry
 */
export async function fireFlowTrigger(params: {
  shop: string
  accessToken: string
  triggerHandle: FlowTriggerHandle
  payload: FlowTriggerPayload
}): Promise<FireResult> {
  try {
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
          query: `mutation flowTriggerReceive($handle: String!, $payload: JSON) {
            flowTriggerReceive(handle: $handle, payload: $payload) {
              userErrors { field message }
            }
          }`,
          variables: {
            handle: params.triggerHandle,
            payload: params.payload,
          },
        }),
      },
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { success: false, error: `${res.status}: ${text}` }
    }

    const json = (await res.json()) as {
      data?: {
        flowTriggerReceive: { userErrors: Array<{ field?: string[]; message: string }> }
      }
      errors?: unknown
    }

    if (json.errors) {
      return { success: false, error: JSON.stringify(json.errors) }
    }

    const userErrors = json.data?.flowTriggerReceive.userErrors ?? []
    if (userErrors.length > 0) {
      return { success: false, error: userErrors.map((e) => e.message).join('; ') }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Convenience: fire visitor_resolved + (conditionally) high_intent_detected
 * for a single resolved lead. Called from the Shopify metafield writeback
 * job after each successful visitor resolution.
 */
export async function fireVisitorResolvedTriggers(params: {
  shop: string
  accessToken: string
  payload: FlowTriggerPayload
  highIntentThreshold?: number
}): Promise<{
  visitor_resolved: FireResult
  high_intent_detected?: FireResult
}> {
  const threshold = params.highIntentThreshold ?? 80

  const visitor_resolved = await fireFlowTrigger({
    shop: params.shop,
    accessToken: params.accessToken,
    triggerHandle: 'cursive-visitor-resolved',
    payload: params.payload,
  })

  let high_intent_detected: FireResult | undefined
  if ((params.payload.intent_score ?? 0) >= threshold) {
    high_intent_detected = await fireFlowTrigger({
      shop: params.shop,
      accessToken: params.accessToken,
      triggerHandle: 'cursive-high-intent-detected',
      payload: params.payload,
    })
  }

  return { visitor_resolved, high_intent_detected }
}
