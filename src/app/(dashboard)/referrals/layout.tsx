import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refer & Earn | Cursive',
  description: 'Earn rewards by referring others to Cursive',
}

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
