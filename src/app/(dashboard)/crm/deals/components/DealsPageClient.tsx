'use client'

import { useState, useMemo } from 'react'
import { DragDropKanbanBoard } from '@/components/crm/board/DragDropKanbanBoard'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { CreateDealDialog } from './CreateDealDialog'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { DollarSign, Calendar } from 'lucide-react'
import type { Deal } from '@/types/crm.types'
import { safeError } from '@/lib/utils/log-sanitizer'

interface DealsPageClientProps {
  initialData: Deal[]
}

export function DealsPageClient({ initialData }: DealsPageClientProps) {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>(initialData)
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Compact deal value formatter: $1.2M, $50K, $999
  const formatDealValue = (value: number | null): string => {
    if (!value) return '—'
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toLocaleString()}`
  }

  // Kanban columns and data
  const { boardColumns, boardData } = useMemo(() => {
    const qualifiedDeals = deals.filter((d) => d.stage === 'Qualified')
    const proposalDeals = deals.filter((d) => d.stage === 'Proposal')
    const negotiationDeals = deals.filter((d) => d.stage === 'Negotiation')
    const closedWonDeals = deals.filter((d) => d.stage === 'Closed Won')
    const closedLostDeals = deals.filter((d) => d.stage === 'Closed Lost')

    return {
      boardColumns: [
        { id: 'qualified', title: 'Qualified', color: '#007AFF', count: qualifiedDeals.length },
        { id: 'proposal', title: 'Proposal', color: '#8B5CF6', count: proposalDeals.length },
        { id: 'negotiation', title: 'Negotiation', color: '#F59E0B', count: negotiationDeals.length },
        { id: 'closedWon', title: 'Closed Won', color: '#10B981', count: closedWonDeals.length },
        { id: 'closedLost', title: 'Closed Lost', color: '#EF4444', count: closedLostDeals.length },
      ],
      boardData: {
        qualified: qualifiedDeals,
        proposal: proposalDeals,
        negotiation: negotiationDeals,
        closedWon: closedWonDeals,
        closedLost: closedLostDeals,
      },
    }
  }, [deals])

  // Map column IDs to deal stages
  const columnToStage: Record<string, string> = {
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closedWon: 'Closed Won',
    closedLost: 'Closed Lost',
  }

  const handleCardMove = async (dealId: string, fromColumn: string, toColumn: string) => {
    const newStage = columnToStage[toColumn]
    if (!newStage) return

    // Optimistically update local state
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      )
    )

    // Persist to database
    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!response.ok) {
        throw new Error('Failed to update deal stage')
      }
    } catch (error) {
      // Revert optimistic update on error
      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === dealId ? { ...deal, stage: fromColumn } : deal
        )
      )
      safeError('[DealsPageClient]', 'Error updating deal stage:', error)
    }
  }

  const handleRowClick = (deal: Deal) => {
    setSelectedDeal(deal.id)
    setDrawerOpen(true)
  }

  const handleAddCard = (_columnId: string) => {
    setCreateDialogOpen(true)
  }

  const handleDialogClose = (created: boolean) => {
    setCreateDialogOpen(false)
    if (created) {
      router.refresh()
    }
  }

  const renderCard = (deal: Deal) => (
    <div className="space-y-2">
      <div className="font-medium text-foreground">{deal.name}</div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-foreground">{formatDealValue(deal.value)}</span>
        <span className="text-xs text-muted-foreground">{deal.probability || 0}%</span>
      </div>
      {deal.close_date && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(deal.close_date), 'MMM d')}
        </div>
      )}
      {deal.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{deal.description}</p>
      )}
    </div>
  )

  const selectedDealData = deals.find((d) => d.id === selectedDeal)

  return (
    <div className="flex h-full flex-col">
      {/* Drag-and-drop Kanban Board */}
      {deals.length === 0 ? (
        <div className="m-6 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <DollarSign className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No deals yet</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Deals track revenue opportunities through your pipeline. Connect your integrations in{' '}
            <a href="/settings/integrations" className="text-blue-600 hover:underline">
              Settings &rarr; Integrations
            </a>{' '}
            to sync contacts and create deals automatically.
          </p>
          <div className="mt-6">
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              Add Deal
            </Button>
          </div>
        </div>
      ) : (
        <DragDropKanbanBoard
          columns={boardColumns}
          data={boardData}
          renderCard={renderCard}
          onCardClick={handleRowClick}
          onCardMove={handleCardMove}
          onAddCard={handleAddCard}
        />
      )}

      {/* Create Deal Dialog */}
      <CreateDealDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose(false)
          else setCreateDialogOpen(true)
        }}
      />

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDealData?.name || ''}
        subtitle={selectedDealData?.stage}
      >
        <div className="space-y-6">
          {/* Deal Information */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deal Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Value</span>
                <span className="text-lg font-semibold text-foreground">
                  {selectedDealData && formatCurrency(selectedDealData.value || 0)}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Stage</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {selectedDealData?.stage}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Probability</span>
                <span className="text-sm text-foreground">{selectedDealData?.probability || 0}%</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Close Date</span>
                <span className="text-sm text-foreground">
                  {selectedDealData?.close_date
                    ? format(new Date(selectedDealData.close_date), 'MMMM d, yyyy')
                    : '-'}
                </span>
              </div>
              {selectedDealData?.description && (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">Description</span>
                  <span className="text-sm text-foreground">{selectedDealData.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Weighted Value */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Weighted Value
            </h3>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {selectedDealData &&
                  formatCurrency((selectedDealData.value || 0) * ((selectedDealData.probability || 0) / 100))}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {selectedDealData?.probability || 0}% probability
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Currency</span>
                <span className="text-sm text-foreground">{selectedDealData?.currency || 'USD'}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Created</span>
                <span className="text-sm text-foreground">
                  {selectedDealData &&
                    formatDistanceToNow(new Date(selectedDealData.created_at), {
                      addSuffix: true,
                    })}
                </span>
              </div>
              {selectedDealData?.closed_at && (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">Closed</span>
                  <span className="text-sm text-foreground">
                    {formatDistanceToNow(new Date(selectedDealData.closed_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </RecordDrawer>
    </div>
  )
}
