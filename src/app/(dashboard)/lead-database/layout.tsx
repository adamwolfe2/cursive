import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lead Database | Cursive',
}

export default function LeadDatabaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
