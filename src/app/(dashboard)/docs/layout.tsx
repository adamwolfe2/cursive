import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | Cursive',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
