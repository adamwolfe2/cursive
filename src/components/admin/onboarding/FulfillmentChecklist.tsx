'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { updateChecklistItem } from '@/app/admin/onboarding/actions'
import type { FulfillmentChecklist as FulfillmentChecklistType, ChecklistItem } from '@/types/onboarding'
import { ClipboardList, CheckCircle } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  pixel: 'Pixel',
  audience: 'Audience',
  outbound: 'Outbound',
  affiliate: 'Affiliate',
  paid_ads: 'Paid Ads',
}

const CATEGORY_ORDER = ['pixel', 'audience', 'outbound', 'affiliate', 'paid_ads']

interface FulfillmentChecklistProps {
  checklist: FulfillmentChecklistType | null
}

export default function FulfillmentChecklist({ checklist }: FulfillmentChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist?.items ?? [])
  const [isPending, startTransition] = useTransition()

  if (!checklist || items.length === 0) {
    return (
      <Card padding="default">
        <CardContent className="flex items-center gap-3 py-6">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No fulfillment checklist has been created for this client yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalCompleted = items.filter((i) => i.completed).length
  const totalItems = items.length
  const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, ChecklistItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) {
      acc[cat] = catItems
    }
    return acc
  }, {})

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleToggle(itemId: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted
    setErrorMessage(null)

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : item
      )
    )

    startTransition(async () => {
      try {
        await updateChecklistItem(checklist.id, itemId, newCompleted)
      } catch {
        // Revert on error
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, completed: currentCompleted, completed_at: currentCompleted ? item.completed_at : null }
              : item
          )
        )
        setErrorMessage('Failed to save checklist update. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <button
            type="button"
            className="text-xs font-medium text-destructive/70 hover:text-destructive underline"
            onClick={() => setErrorMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overall Progress */}
      <Card padding="default">
        <CardContent className="flex items-center gap-4">
          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{totalCompleted}/{totalItems} ({overallPercent}%)</span>
            </div>
            <Progress
              value={totalCompleted}
              max={totalItems}
              variant={overallPercent === 100 ? 'success' : 'default'}
              size="lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Groups */}
      {Object.entries(grouped).map(([category, catItems]) => {
        const catCompleted = catItems.filter((i) => i.completed).length
        const catTotal = catItems.length
        const catPercent = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0

        return (
          <Card key={category} padding="default">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{CATEGORY_LABELS[category] ?? category}</CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {catCompleted}/{catTotal}
                </span>
              </div>
              <Progress
                value={catCompleted}
                max={catTotal}
                variant={catPercent === 100 ? 'success' : 'default'}
                size="sm"
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="mt-3 space-y-2">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-1.5"
                >
                  <Checkbox
                    checked={item.completed}
                    onChange={() => handleToggle(item.id, item.completed)}
                    label={item.label}
                    disabled={isPending}
                  />
                  {item.completed_at && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(item.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
