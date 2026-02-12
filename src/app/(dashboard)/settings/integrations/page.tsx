import dynamic from 'next/dynamic'
import IntegrationsLoading from './loading'

const IntegrationsClient = dynamic(
  () => import('./IntegrationsClient'),
  { loading: () => <IntegrationsLoading /> }
)

export default function IntegrationsPage() {
  return <IntegrationsClient />
}
