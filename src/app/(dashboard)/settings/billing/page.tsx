import dynamic from 'next/dynamic'
import BillingLoading from './loading'

const BillingClient = dynamic(
  () => import('./BillingClient'),
  { loading: () => <BillingLoading /> }
)

export default function BillingSettingsPage() {
  return <BillingClient />
}
