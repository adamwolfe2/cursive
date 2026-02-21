import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'People Search | Cursive',
}

export default function PeopleSearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
