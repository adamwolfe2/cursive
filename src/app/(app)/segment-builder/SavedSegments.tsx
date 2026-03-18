'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Filter,
  Play,
  Trash2,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Segment } from './types'

interface SavedSegmentsProps {
  segments: Segment[]
  segmentsLoading: boolean
  runningSegmentId: string | null
  deleteDisabled: boolean
  onLoadSegment: (segment: Segment) => void
  onRunSegment: (segmentId: string, action: 'preview' | 'pull') => void
  onDeleteSegment: (segmentId: string) => void
}

export function SavedSegments({
  segments,
  segmentsLoading,
  runningSegmentId,
  deleteDisabled,
  onLoadSegment,
  onRunSegment,
  onDeleteSegment,
}: SavedSegmentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Segments</CardTitle>
        <CardDescription>Reusable audience definitions</CardDescription>
      </CardHeader>
      <CardContent>
        {segmentsLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : segments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium text-foreground">No saved segments yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Build a segment using the filters above and click &quot;Save&quot; to reuse it for audience targeting and analytics.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((segment: Segment) => (
              <div
                key={segment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{segment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {segment.description || 'No description'}
                    {segment.last_count !== null && (
                      <> • Last count: {segment.last_count.toLocaleString()}</>
                    )}
                    {segment.last_run_at && (
                      <> • Last run: {new Date(segment.last_run_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={segment.status === 'active' ? 'default' : 'secondary'}>
                    {segment.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadSegment(segment)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRunSegment(segment.id, 'preview')}
                    disabled={runningSegmentId === segment.id}
                  >
                    {runningSegmentId === segment.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="mr-2 h-4 w-4" />
                    )}
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onRunSegment(segment.id, 'pull')}
                    disabled={runningSegmentId === segment.id}
                  >
                    {runningSegmentId === segment.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Pull
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteSegment(segment.id)}
                    disabled={deleteDisabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
