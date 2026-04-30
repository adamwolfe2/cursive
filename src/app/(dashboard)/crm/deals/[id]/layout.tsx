import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deal | Cursive',
}

export default function DealDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
