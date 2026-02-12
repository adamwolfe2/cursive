import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Cursive',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
