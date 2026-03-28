import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offers | Cursive',
  description: 'Manage your products and service offers',
}

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
