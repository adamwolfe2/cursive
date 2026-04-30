// Cursive Web Pixel — Shopify storefront sandbox runtime.
//
// Subscribes to 5 analytics events. Resolution calls go directly to Cursive's
// resolution endpoint (no AudienceLab branding ever surfaces). The endpoint
// internally maps pixel_id → workspace and stamps the lead correctly.
//
// Sandbox constraints:
//   - No DOM access (cannot do document.createElement)
//   - fetch() IS available
//   - browser.cookie / browser.localStorage available
//   - All analytics.subscribe handlers must check consent first
//
// Settings shape arrives at runtime from analytics.init.data per webPixelCreate.

declare const analytics: {
  subscribe: (event: string, handler: (e: any) => void | Promise<void>) => void
  visitor: {
    consent: {
      analyticsAllowed: () => boolean
      marketingAllowed: () => boolean
    }
  }
}

declare const init: {
  data: {
    pixelId: string
  }
}

declare const browser: {
  cookie: {
    get: (name: string) => Promise<string | null>
    set: (name: string, value: string, opts?: { maxAge?: number; path?: string }) => Promise<void>
  }
}

const RESOLUTION_ENDPOINT = 'https://leads.meetcursive.com/api/webhooks/audiencelab/superpixel'

function consentOk(): boolean {
  try {
    return (
      analytics.visitor.consent.analyticsAllowed() &&
      analytics.visitor.consent.marketingAllowed()
    )
  } catch {
    return false
  }
}

async function getOrCreateClientId(): Promise<string> {
  try {
    const existing = await browser.cookie.get('_cursive_cid')
    if (existing) return existing
    const cid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    await browser.cookie.set('_cursive_cid', cid, { maxAge: 60 * 60 * 24 * 365, path: '/' })
    return cid
  } catch {
    return ''
  }
}

async function fire(eventType: string, payload: Record<string, unknown>): Promise<void> {
  if (!init.data?.pixelId) return
  const clientId = await getOrCreateClientId()

  try {
    await fetch(RESOLUTION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixel_id: init.data.pixelId,
        event_type: eventType,
        client_id: clientId,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
      keepalive: true,
    })
  } catch {
    // pixel sandbox swallows errors silently — best effort
  }
}

// page_viewed — primary resolution signal
analytics.subscribe('page_viewed', async (event: any) => {
  if (!consentOk()) return
  await fire('page_viewed', {
    page_url: event?.context?.document?.location?.href,
    referrer: event?.context?.document?.referrer,
    title: event?.context?.document?.title,
  })
})

// product_viewed — product-level intent
analytics.subscribe('product_viewed', async (event: any) => {
  if (!consentOk()) return
  await fire('product_viewed', {
    page_url: event?.context?.document?.location?.href,
    product_id: event?.data?.productVariant?.product?.id,
    product_title: event?.data?.productVariant?.product?.title,
    product_price: event?.data?.productVariant?.price?.amount,
  })
})

// product_added_to_cart — high-intent
analytics.subscribe('product_added_to_cart', async (event: any) => {
  if (!consentOk()) return
  await fire('product_added_to_cart', {
    cart_total: event?.data?.cartLine?.cost?.totalAmount?.amount,
    product_id: event?.data?.cartLine?.merchandise?.product?.id,
    quantity: event?.data?.cartLine?.quantity,
  })
})

// checkout_started — very high-intent
analytics.subscribe('checkout_started', async (event: any) => {
  if (!consentOk()) return
  await fire('checkout_started', {
    checkout_total: event?.data?.checkout?.totalPrice?.amount,
    line_count: event?.data?.checkout?.lineItems?.length ?? 0,
  })
})

// checkout_completed — conversion (no consent gate; conversions are
// suppression signal and required for compliance even when ads are denied)
analytics.subscribe('checkout_completed', async (event: any) => {
  await fire('checkout_completed', {
    order_id: event?.data?.checkout?.order?.id,
    email: event?.data?.checkout?.email,
    phone: event?.data?.checkout?.shippingAddress?.phone,
    total: event?.data?.checkout?.totalPrice?.amount,
  })
})
