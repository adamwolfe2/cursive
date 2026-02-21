import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started | Cursive',
}

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
