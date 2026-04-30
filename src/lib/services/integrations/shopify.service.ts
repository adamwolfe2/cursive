/**
 * Shopify Integration Service
 * Cursive Platform
 *
 * Provides API operations against a merchant's Shopify store using the
 * permanent access token stored in crm_connections. Shopify tokens don't
 * expire — no refresh logic needed.
 */

import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getErrorMessage } from '@/lib/utils/error-helpers'

const SHOPIFY_API_VERSION = '2025-01'

// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface ShopifyConnection {
  id: string
  workspaceId: string
  shopDomain: string
  accessToken: string
  scopes: string[]
}

export interface ShopifyCustomer {
  id?: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  tags?: string
  note?: string
}

export interface ShopifyOrder {
  id: number
  order_number: number
  total_price: string
  financial_status: string
  fulfillment_status: string | null
  customer?: { id: number; email?: string }
  created_at: string
}

// ─── CONNECTION ─────────────────────────────────────────────────────────────

/**
 * Fetch the active Shopify connection for a workspace.
 */
export async function getShopifyConnection(
  workspaceId: string
): Promise<ShopifyConnection | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('crm_connections')
    .select('id, access_token, metadata')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'shopify')
    .eq('status', 'active')
    .maybeSingle()

  const row = data as {
    id: string
    access_token: string
    metadata: Record<string, unknown> | null
  } | null

  if (!row) return null

  const meta = row.metadata || {}
  return {
    id: row.id,
    workspaceId,
    shopDomain: typeof meta.shop_domain === 'string' ? meta.shop_domain : '',
    accessToken: row.access_token,
    scopes: Array.isArray(meta.scopes)
      ? (meta.scopes as string[])
      : [],
  }
}

// ─── API CLIENT ────────────────────────────────────────────────────────────

async function shopifyFetch<T = unknown>(
  connection: ShopifyConnection,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://${connection.shopDomain}/admin/api/${SHOPIFY_API_VERSION}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': connection.accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as Record<string, unknown>).errors?.toString() ||
      `Shopify API error ${response.status}`
    )
  }

  return response.json() as Promise<T>
}

// ─── CUSTOMERS ─────────────────────────────────────────────────────────────

/**
 * Create or update a customer in Shopify.
 * Searches by email first; creates if not found.
 */
export async function syncCustomerToShopify(
  workspaceId: string,
  customer: ShopifyCustomer
): Promise<{ success: boolean; customerId?: number; error?: string }> {
  const connection = await getShopifyConnection(workspaceId)
  if (!connection) return { success: false, error: 'Shopify not connected' }

  try {
    if (customer.email) {
      const existing = await findShopifyCustomerByEmail(connection, customer.email)
      if (existing) {
        const updated = await shopifyFetch<{ customer: { id: number } }>(
          connection,
          `/customers/${existing.id}.json`,
          { method: 'PUT', body: JSON.stringify({ customer }) }
        )
        return { success: true, customerId: updated.customer.id }
      }
    }

    const created = await shopifyFetch<{ customer: { id: number } }>(
      connection,
      '/customers.json',
      { method: 'POST', body: JSON.stringify({ customer }) }
    )
    return { success: true, customerId: created.customer.id }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

async function findShopifyCustomerByEmail(
  connection: ShopifyConnection,
  email: string
): Promise<{ id: number } | null> {
  try {
    const result = await shopifyFetch<{ customers: Array<{ id: number }> }>(
      connection,
      `/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`
    )
    return result.customers[0] ?? null
  } catch {
    return null
  }
}

// ─── STORE INFO ────────────────────────────────────────────────────────────

/**
 * Fetch basic shop info (used for connection health checks).
 */
export async function getShopInfo(
  workspaceId: string
): Promise<{ name: string; domain: string; email: string } | null> {
  const connection = await getShopifyConnection(workspaceId)
  if (!connection) return null

  try {
    const result = await shopifyFetch<{
      shop: { name: string; domain: string; email: string }
    }>(connection, '/shop.json')
    return result.shop
  } catch (error: unknown) {
    safeError('[Shopify] Failed to fetch shop info:', error)
    return null
  }
}

// ─── LEAD → CUSTOMER PUSH ──────────────────────────────────────────────────

/**
 * Map a Cursive lead to a Shopify customer and push it.
 * Used by the Inngest bulk-sync job.
 */
export async function pushLeadToShopify(
  workspaceId: string,
  lead: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    companyName?: string
    industry?: string
  }
): Promise<{ success: boolean; customerId?: number; error?: string }> {
  const tags = ['cursive-lead', ...(lead.companyName ? [`company:${lead.companyName.slice(0, 40)}`] : [])]

  return syncCustomerToShopify(workspaceId, {
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    tags: tags.join(', '),
    note: `Identified via Cursive. Company: ${lead.companyName || 'Unknown'}. Industry: ${lead.industry || 'Unknown'}.`,
  })
}
