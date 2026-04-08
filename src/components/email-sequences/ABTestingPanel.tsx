'use client'

/**
 * A/B Testing Panel
 * Placeholder for sequence-level A/B testing (coming soon)
 *
 * The A/B testing infrastructure exists for campaigns (ab_experiments table
 * references campaign_id), but email_sequences don't have a campaign_id
 * column and email_campaigns don't have a sequence_id column, so the bridge
 * between sequences and A/B experiments doesn't exist yet.
 */

import { FlaskConical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface ABTestingPanelProps {
  sequenceId: string
}

export function ABTestingPanel({ sequenceId: _sequenceId }: ABTestingPanelProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <FlaskConical className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium text-foreground">A/B Testing</h3>
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm">
          Split-test subject lines, email body content, and send times to optimize
          your sequence performance. A/B testing for sequences is currently under development.
        </p>
        <p className="text-xs text-muted-foreground mt-3 max-w-sm">
          A/B testing is available now for individual email campaigns.
        </p>
      </CardContent>
    </Card>
  )
}
