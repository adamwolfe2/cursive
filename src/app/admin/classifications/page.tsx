import { createAdminClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

interface ClassificationRow {
  id: string
  reply_id: string | null
  emailbison_reply_id: string | null
  method: 'keyword' | 'claude'
  confidence: number
  classification: string
  keywords_matched: string[]
  reply_snippet: string | null
  classified_at: string
}

const SENTIMENT_BADGE: Record<string, { variant: 'success' | 'warning' | 'muted' | 'destructive' | 'default'; label: string }> = {
  positive:     { variant: 'success',     label: 'Positive' },
  neutral:      { variant: 'default',     label: 'Neutral' },
  negative:     { variant: 'destructive', label: 'Negative' },
  unsubscribe:  { variant: 'destructive', label: 'Unsub' },
  out_of_office:{ variant: 'muted',       label: 'OOO' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confidenceColor(conf: number): string {
  if (conf >= 0.85) return 'text-green-700'
  if (conf >= 0.65) return 'text-yellow-700'
  return 'text-red-600'
}

export default async function ClassificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; sentiment?: string }>
}) {
  const params = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('reply_classification_logs')
    .select('*')
    .order('classified_at', { ascending: false })
    .limit(200)

  if (params.method === 'keyword' || params.method === 'claude') {
    query = query.eq('method', params.method)
  }

  if (params.sentiment) {
    query = query.eq('classification', params.sentiment)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to load classifications: ${error.message}`)
  }

  const rows = (data ?? []) as ClassificationRow[]

  // Summary stats
  const total = rows.length
  const keywordCount = rows.filter((r) => r.method === 'keyword').length
  const claudeCount = rows.filter((r) => r.method === 'claude').length
  const avgConfidence = total > 0
    ? rows.reduce((sum, r) => sum + r.confidence, 0) / total
    : 0

  const sentimentCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.classification] = (acc[r.classification] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reply Classifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit log for all sentiment classifications. Use this to baseline accuracy and spot misclassifications.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total (last 200)</p>
              <p className="text-xl font-bold text-foreground">{total}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-muted-foreground">Keyword / Claude</p>
            <p className="text-xl font-bold text-foreground">
              {keywordCount} / {claudeCount}
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
            <p className={`text-xl font-bold ${confidenceColor(avgConfidence)}`}>
              {(avgConfidence * 100).toFixed(0)}%
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div>
            <p className="text-xs text-muted-foreground">Sentiment Breakdown</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(sentimentCounts).map(([s, n]) => (
                <span key={s} className="text-[11px] font-medium text-zinc-600">
                  {s}: {n}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <a
          href="/admin/classifications"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${!params.method && !params.sentiment ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          All
        </a>
        <a
          href="/admin/classifications?method=keyword"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${params.method === 'keyword' ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          Keyword only
        </a>
        <a
          href="/admin/classifications?method=claude"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${params.method === 'claude' ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          Claude only
        </a>
        {['positive', 'negative', 'neutral', 'unsubscribe', 'out_of_office'].map((s) => (
          <a
            key={s}
            href={`/admin/classifications?sentiment=${s}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${params.sentiment === s ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
          >
            {s}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No classifications yet</p>
            <p className="text-sm text-muted-foreground">
              Classifications appear here as the reply sync cron runs.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reply Snippet</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Result</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keywords</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reply ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badge = SENTIMENT_BADGE[row.classification] ?? { variant: 'default' as const, label: row.classification }
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(row.classified_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <span className="text-xs text-foreground line-clamp-2">
                          {row.reply_snippet ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${row.method === 'claude' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {row.method}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium text-xs ${confidenceColor(row.confidence)}`}>
                        {(row.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                        {row.keywords_matched?.length > 0
                          ? row.keywords_matched.join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {row.reply_id ? row.reply_id.slice(0, 8) + '…' : row.emailbison_reply_id ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
