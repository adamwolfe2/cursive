export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { SdrConfigRepository } from '@/lib/repositories/sdr-config.repository'
import { ConfigWizard } from './ConfigWizard'

export default async function SdrConfigPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const supabase = createAdminClient()
  const [configData, workspaceData, profileData] = await Promise.all([
    new SdrConfigRepository().findByWorkspace(workspaceId),
    supabase.from('workspaces').select('id, name').eq('id', workspaceId).maybeSingle(),
    supabase.from('client_profiles').select('*').eq('workspace_id', workspaceId).maybeSingle(),
  ])

  return (
    <ConfigWizard
      workspaceId={workspaceId}
      workspaceName={workspaceData.data?.name || workspaceId}
      initialConfig={configData}
      clientProfile={profileData.data || null}
    />
  )
}
