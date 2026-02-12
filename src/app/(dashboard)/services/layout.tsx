import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services | Cursive',
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
