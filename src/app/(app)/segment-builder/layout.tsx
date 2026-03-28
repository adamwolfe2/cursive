import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Segment Builder | Cursive',
  description: 'Build and manage audience segments',
}

export default function SegmentBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
