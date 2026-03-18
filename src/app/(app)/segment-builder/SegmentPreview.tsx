'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  Users,
  Coins,
  AlertCircle,
} from 'lucide-react'

interface SegmentPreviewProps {
  preview: any
  onPullLeads: () => void
}

export function SegmentPreview({ preview, onPullLeads }: SegmentPreviewProps) {
  if (!preview) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add filters and click &quot;Preview&quot;</p>
              <p className="text-sm mt-2">to see matching leads</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Preview Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-2xl sm:text-4xl font-bold text-primary">
              {preview.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              matching leads
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <div className="font-medium">Cost to pull 25 leads</div>
              <div className="text-muted-foreground">
                ${preview.credit_cost_per_lead}/lead
              </div>
            </div>
            <div className="flex items-center gap-1 text-lg font-bold">
              <Coins className="h-5 w-5 text-yellow-600" />
              {preview.credit_cost.toFixed(2)}
            </div>
          </div>

          {!preview.can_afford && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-900">
                  Insufficient credits
                </div>
              </div>
              <div className="text-xs text-orange-700 mt-1">
                Balance: {preview.current_balance}
              </div>
            </div>
          )}

          <Button
            onClick={onPullLeads}
            disabled={!preview.can_afford}
            className="w-full"
            size="lg"
          >
            <Users className="mr-2 h-4 w-4" />
            Pull 25 Leads
          </Button>
        </CardContent>
      </Card>

      {/* Sample Leads */}
      {preview.sample && preview.sample.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sample Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {preview.sample.slice(0, 3).map((lead: any, idx: number) => (
              <div key={idx} className="p-2 bg-muted rounded text-sm">
                <div className="font-medium">
                  {lead.FIRST_NAME} {lead.LAST_NAME}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lead.JOB_TITLE} • {lead.COMPANY_NAME}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
