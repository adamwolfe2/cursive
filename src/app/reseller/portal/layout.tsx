import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursive Partner Portal',
  description: 'View your reseller usage and pixels.',
  robots: { index: false, follow: false },
}

export default function ResellerPortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
