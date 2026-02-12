import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Branding | Cursive',
}

export default function BrandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
