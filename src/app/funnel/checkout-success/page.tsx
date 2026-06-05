/**
 * Post-Stripe success landing.
 *
 * Stripe redirects here with ?session_id=... after a successful funnel
 * checkout. We try to redirect server-side; if the webhook hasn't landed yet
 * we fall through to a client-side poller that retries every 2s.
 */
import { redirect } from 'next/navigation'
import {
  getOrderByStripeSession,
  getPortalTokenForOrder,
  portalUrlForToken,
} from '@/lib/funnel/order.service'
import { WaitingPoller } from './WaitingPoller'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId) {
    redirect('/get-leads')
  }

  const order = await getOrderByStripeSession(sessionId)
  if (order) {
    const token = await getPortalTokenForOrder(order.id)
    if (token) {
      redirect(portalUrlForToken(token.token))
    }
  }

  // Webhook hasn't landed yet — poll on the client.
  return <WaitingPoller sessionId={sessionId} />
}
