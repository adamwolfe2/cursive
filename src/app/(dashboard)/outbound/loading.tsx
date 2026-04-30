import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'

export default function OutboundLoading() {
  return (
    <PageContainer>
      <PageHeader title="Outbound Agent" description="Loading workflows..." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-40 p-5">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-1/2 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
