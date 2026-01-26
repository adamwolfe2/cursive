// New Agent Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { NewAgentForm } from '@/components/agents/new-agent-form'

export default async function NewAgentPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <NewAgentForm />
}
