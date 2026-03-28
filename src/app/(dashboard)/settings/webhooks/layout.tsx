import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Webhooks | Cursive',
  description: 'Manage outbound webhook endpoints for real-time event delivery',
}

export default function WebhooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
