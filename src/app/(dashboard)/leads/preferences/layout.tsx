import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lead Preferences | Cursive',
}

export default function LeadPreferencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
