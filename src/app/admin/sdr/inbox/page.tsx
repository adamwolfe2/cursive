import { getAllWorkspaces } from '@/lib/auth/admin'
import { InboxClient } from './InboxClient'

export default async function SdrInboxPage() {
  const result = await getAllWorkspaces({ limit: 200 })

  return <InboxClient workspaces={result.workspaces || []} />
}
