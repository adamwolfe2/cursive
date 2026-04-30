import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Keys | Cursive',
  description: 'Manage API keys for programmatic access to Cursive',
}

export default function ApiKeysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
