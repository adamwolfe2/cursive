import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Campaigns | Cursive',
  description: 'Create and manage AI-powered ad campaigns',
}

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
