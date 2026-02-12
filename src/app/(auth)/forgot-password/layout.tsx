import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password | Cursive',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
