import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Creatives | Cursive',
  description: 'Generate and manage ad creatives',
}

export default function CreativesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
