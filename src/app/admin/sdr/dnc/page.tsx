import { getAllWorkspaces } from '@/lib/auth/admin'
import { DncClient } from './DncClient'

export default async function DncPage() {
  const result = await getAllWorkspaces({ limit: 200 })

  return <DncClient workspaces={result.workspaces || []} />
}
