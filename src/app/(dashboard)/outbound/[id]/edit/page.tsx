import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgentRepository } from '@/lib/repositories/agent.repository'
import { SetupForm } from '@/components/outbound/setup-form'

export const metadata: Metadata = { title: 'Edit Outbound Workflow | Cursive' }

export default async function EditOutboundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  const agentRepo = new AgentRepository()
  const agent = await agentRepo.findOutboundById(id, userData.workspace_id)
  if (!agent) notFound()

  return <SetupForm mode="edit" initialAgent={agent} />
}
