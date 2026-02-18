// New Agent Page

import type { Metadata } from 'next'
import { NewAgentForm } from '@/components/agents/new-agent-form'

export const metadata: Metadata = { title: 'New Agent | Cursive' }

export default async function NewAgentPage() {
  // Layout already verified auth
  return <NewAgentForm />
}
