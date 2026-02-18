import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import BillingLoading from './loading'

const BillingClient = dynamic(
  () => import('./BillingClient'),
  { loading: () => <BillingLoading /> }
)

export const metadata: Metadata = { title: 'Billing | Cursive' }

export default function BillingSettingsPage() {
  return <BillingClient />
}
