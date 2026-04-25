// Shopify marketplace API client.
//
// Wraps OAuth + Admin GraphQL calls for the marketplace install flow:
//   - exchange OAuth code for access token
//   - call webPixelCreate to auto-inject the Cursive pixel
//   - look up customer by email/phone for metafield writeback
//   - write customer metafields
//   - create app subscription via Billing API
//
// Shop-domain-scoped — the host header for every call is `<shop>.myshopify.com`.

const SHOPIFY_API_VERSION = '2024-10'

interface ShopifyError extends Error {
  status?: number
  errors?: unknown
}

async function shopifyAdminGraphql<T>(params: {
  shop: string
  accessToken: string
  query: string
  variables?: Record<string, unknown>
}): Promise<T> {
  const res = await fetch(
    `https://${params.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: params.query, variables: params.variables }),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Shopify GraphQL ${params.shop} → ${res.status}: ${text}`) as ShopifyError
    err.status = res.status
    throw err
  }

  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) {
    const err = new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`) as ShopifyError
    err.errors = json.errors
    throw err
  }

  return json.data as T
}

// ---------------------------------------------------------------------------
// OAuth token exchange
// ---------------------------------------------------------------------------

export interface ShopifyTokenResponse {
  access_token: string
  scope: string
}

export async function exchangeShopifyCode(params: {
  shop: string
  code: string
  apiKey: string
  apiSecret: string
}): Promise<ShopifyTokenResponse> {
  const res = await fetch(`https://${params.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: params.apiKey,
      client_secret: params.apiSecret,
      code: params.code,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Shopify token exchange failed: ${res.status} — ${text}`)
  }

  return res.json() as Promise<ShopifyTokenResponse>
}

// ---------------------------------------------------------------------------
// Web Pixel auto-injection (webPixelCreate)
// ---------------------------------------------------------------------------

export interface CreateWebPixelResult {
  webPixelId: string | null
  errors: Array<{ field?: string[]; message: string }>
}

export async function createWebPixel(params: {
  shop: string
  accessToken: string
  pixelId: string
}): Promise<CreateWebPixelResult> {
  // Settings shape MUST match the schema declared in shopify.extension.toml
  const settings = JSON.stringify({ pixelId: params.pixelId })

  const data = await shopifyAdminGraphql<{
    webPixelCreate: {
      webPixel: { id: string; settings: string } | null
      userErrors: Array<{ field?: string[]; message: string }>
    }
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `mutation webPixelCreate($webPixel: WebPixelInput!) {
      webPixelCreate(webPixel: $webPixel) {
        webPixel { id settings }
        userErrors { field message }
      }
    }`,
    variables: { webPixel: { settings } },
  })

  return {
    webPixelId: data.webPixelCreate.webPixel?.id ?? null,
    errors: data.webPixelCreate.userErrors ?? [],
  }
}

export async function deleteWebPixel(params: {
  shop: string
  accessToken: string
  webPixelId: string
}): Promise<void> {
  await shopifyAdminGraphql({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `mutation webPixelDelete($id: ID!) {
      webPixelDelete(id: $id) {
        deletedWebPixelId
        userErrors { field message }
      }
    }`,
    variables: { id: params.webPixelId },
  })
}

// ---------------------------------------------------------------------------
// Shop info lookup (used at OAuth callback to get name + email)
// ---------------------------------------------------------------------------

export interface ShopInfo {
  name: string
  email: string
  domain: string
  primaryDomainHost: string
}

export async function getShopInfo(params: {
  shop: string
  accessToken: string
}): Promise<ShopInfo> {
  const data = await shopifyAdminGraphql<{
    shop: {
      name: string
      email: string
      myshopifyDomain: string
      primaryDomain: { host: string; url: string }
    }
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `query { shop {
      name
      email
      myshopifyDomain
      primaryDomain { host url }
    } }`,
  })

  return {
    name: data.shop.name,
    email: data.shop.email,
    domain: data.shop.myshopifyDomain,
    primaryDomainHost: data.shop.primaryDomain.host,
  }
}

// ---------------------------------------------------------------------------
// Customer metafield writeback
// ---------------------------------------------------------------------------

export async function findCustomerByEmail(params: {
  shop: string
  accessToken: string
  email: string
}): Promise<{ id: string; email: string } | null> {
  const data = await shopifyAdminGraphql<{
    customers: { edges: Array<{ node: { id: string; email: string } }> }
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `query findCustomer($q: String!) {
      customers(first: 1, query: $q) {
        edges { node { id email } }
      }
    }`,
    variables: { q: `email:${params.email}` },
  })

  return data.customers.edges[0]?.node ?? null
}

export async function writeCustomerMetafields(params: {
  shop: string
  accessToken: string
  customerId: string
  intentScore: number
  lastResolvedAt: Date
  resolutionSource?: string
}): Promise<void> {
  await shopifyAdminGraphql({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { field message }
      }
    }`,
    variables: {
      input: {
        id: params.customerId,
        metafields: [
          {
            namespace: 'cursive',
            key: 'intent_score',
            type: 'number_integer',
            value: String(Math.round(params.intentScore)),
          },
          {
            namespace: 'cursive',
            key: 'last_resolved_at',
            type: 'date_time',
            value: params.lastResolvedAt.toISOString(),
          },
          {
            namespace: 'cursive',
            key: 'resolution_source',
            type: 'single_line_text_field',
            value: params.resolutionSource ?? 'pixel_v4',
          },
        ],
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Webhook subscription (used at install for GDPR + lifecycle webhooks)
// ---------------------------------------------------------------------------

export type ShopifyWebhookTopic =
  | 'CUSTOMERS_DATA_REQUEST'
  | 'CUSTOMERS_REDACT'
  | 'SHOP_REDACT'
  | 'APP_UNINSTALLED'
  | 'APP_SUBSCRIPTIONS_UPDATE'
  | 'CHECKOUTS_COMPLETED'
  | 'ORDERS_PAID'

export async function createWebhookSubscription(params: {
  shop: string
  accessToken: string
  topic: ShopifyWebhookTopic
  callbackUrl: string
}): Promise<{ id: string | null; errors: Array<{ message: string }> }> {
  const data = await shopifyAdminGraphql<{
    webhookSubscriptionCreate: {
      webhookSubscription: { id: string } | null
      userErrors: Array<{ field?: string[]; message: string }>
    }
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription { id }
        userErrors { field message }
      }
    }`,
    variables: {
      topic: params.topic,
      webhookSubscription: {
        callbackUrl: params.callbackUrl,
        format: 'JSON',
      },
    },
  })

  return {
    id: data.webhookSubscriptionCreate.webhookSubscription?.id ?? null,
    errors: data.webhookSubscriptionCreate.userErrors ?? [],
  }
}

// ---------------------------------------------------------------------------
// Validate shop domain (defense against open-redirect / SSRF in OAuth)
// ---------------------------------------------------------------------------

const SHOPIFY_DOMAIN_RE = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/i

export function isValidShopDomain(shop: string | null | undefined): boolean {
  if (!shop) return false
  return SHOPIFY_DOMAIN_RE.test(shop)
}
