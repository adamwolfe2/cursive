import Link from 'next/link'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WorkflowNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Workflow not found" />
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This workflow doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/outbound" className="mt-4 inline-block">
          <Button>Back to workflows</Button>
        </Link>
      </Card>
    </PageContainer>
  )
}
