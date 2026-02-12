import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security | Cursive',
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
