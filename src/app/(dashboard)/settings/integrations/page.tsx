import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = { title: 'Integrations | Cursive' }
import IntegrationsLoading from './loading'

const IntegrationsClient = dynamic(
  () => import('./IntegrationsClient'),
  { loading: () => <IntegrationsLoading /> }
)

export default function IntegrationsPage() {
  return <IntegrationsClient />
}
