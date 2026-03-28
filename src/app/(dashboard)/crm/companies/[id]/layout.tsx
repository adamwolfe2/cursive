import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Company | Cursive',
}

export default function CompanyDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
