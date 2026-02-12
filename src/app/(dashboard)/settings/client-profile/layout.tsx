import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Profile | Cursive',
}

export default function ClientProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
