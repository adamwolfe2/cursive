import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trends | Cursive',
}

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
