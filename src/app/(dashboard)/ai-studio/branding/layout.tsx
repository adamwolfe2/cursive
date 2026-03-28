import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Identity | Cursive',
  description: 'View and manage your brand identity and visual DNA',
}

export default function AiStudioBrandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
