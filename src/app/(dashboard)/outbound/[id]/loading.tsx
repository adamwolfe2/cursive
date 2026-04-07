import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'

export default function WorkflowLoading() {
  return (
    <PageContainer>
      <PageHeader title="Loading workflow..." />
      <div className="grid gap-6 lg:grid-cols-[minmax(380px,420px)_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 p-5">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-8 w-12 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-96 p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
