import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customer Profiles | Cursive',
  description: 'AI-generated buyer personas and ideal customer profiles',
}

export default function ProfilesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
