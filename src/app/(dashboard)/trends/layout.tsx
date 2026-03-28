import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trending Topics | Cursive',
}

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
