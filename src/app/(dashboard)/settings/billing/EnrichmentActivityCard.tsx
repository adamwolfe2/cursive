'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EnrichmentEntry {
  id: string
  lead_id: string
  status: 'success' | 'failed' | 'no_data'
  credits_used: number
  fields_added: string[]
  created_at: string
}

interface EnrichmentActivityCardProps {
  enrichments: EnrichmentEntry[]
  stats: { total: number; successful: number; today: number }
}

export function EnrichmentActivityCard({ enrichments, stats }: EnrichmentActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Enrichment Activity</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{stats.today} today</span>
            <span className="text-border">|</span>
            <span>{stats.total} total</span>
            <span className="text-border">|</span>
            <span className="text-green-600">
              {stats.total > 0
                ? Math.round((stats.successful / stats.total) * 100)
                : 0}% success
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {enrichments.slice(0, 20).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-2 w-2 rounded-full ${
                  entry.status === 'success' ? 'bg-green-500' :
                  entry.status === 'no_data' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                  {entry.lead_id.slice(0, 8)}...
                </span>
                {entry.status === 'success' && entry.fields_added.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{entry.fields_added.length} field{entry.fields_added.length !== 1 ? 's' : ''}
                  </span>
                )}
                {entry.status === 'no_data' && (
                  <span className="text-xs text-amber-600">No data found</span>
                )}
                {entry.status === 'failed' && (
                  <span className="text-xs text-red-600">Failed</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{entry.credits_used} credit</span>
                <span>
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
