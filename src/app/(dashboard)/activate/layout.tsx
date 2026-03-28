import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activate | Cursive',
}

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
