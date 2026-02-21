import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website Visitors | Cursive',
}

export default function WebsiteVisitorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
