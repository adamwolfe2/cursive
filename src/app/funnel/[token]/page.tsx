import { getOrderByToken, offerForOrder } from '@/lib/funnel/order.service'
import { FunnelPortal } from './FunnelPortal'
import { SUPPORT_EMAIL } from '@/lib/config/urls'

interface PageProps {
  params: Promise<{ token: string }>
}

export const dynamic = 'force-dynamic'

export default async function FunnelTokenPage({ params }: PageProps) {
  const { token } = await params
  const lookup = await getOrderByToken(token)

  if (!lookup.ok) {
    if (lookup.error === 'expired') return <ExpiredLink />
    if (lookup.error === 'revoked') return <ExpiredLink />
    return <InvalidLink />
  }

  const { order } = lookup.data
  const offer = offerForOrder(order)

  return <FunnelPortal token={token} order={order} offerLabel={offer.label} />
}

function ExpiredLink() {
  return (
    <Centered title="This link has expired">
      Your setup link is no longer valid. Reach out and we&apos;ll send you a
      fresh one.
    </Centered>
  )
}

function InvalidLink() {
  return (
    <Centered title="This link is not valid">
      We couldn&apos;t find a setup portal for this link. Double-check the URL
      or reach out for a fresh one.
    </Centered>
  )
}

function Centered({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 rounded-full bg-gray-100 p-5">
        <svg
          className="h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mb-8 max-w-sm text-base text-gray-500">{children}</p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        Contact ${SUPPORT_EMAIL}
      </a>
    </div>
  )
}
