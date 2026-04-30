import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Cursive',
}

export default function ContactDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
