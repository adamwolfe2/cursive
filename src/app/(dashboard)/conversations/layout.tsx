import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conversations | Cursive',
  description: 'View and manage your conversations',
}

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
