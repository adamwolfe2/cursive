import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pixel Setup | Cursive',
}

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
