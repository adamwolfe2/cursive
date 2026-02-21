import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Market Trends | Cursive',
}

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
