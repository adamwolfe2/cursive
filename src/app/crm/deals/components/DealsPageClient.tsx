'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { TrendingUp, Plus, Filter, ArrowUpDown, Inbox, DollarSign, Calendar } from 'lucide-react'
import { CRMPageContainer } from '@/components/crm/layout/CRMPageContainer'
import { CRMViewBar } from '@/components/crm/layout/CRMViewBar'
import { CRMThreeColumnLayout } from '@/components/crm/layout/CRMThreeColumnLayout'
import { CRMTableView } from '@/components/crm/views/CRMTableView'
import { KanbanBoard } from '@/components/crm/board/KanbanBoard'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { EmptyState } from '@/components/crm/empty-states/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCRMViewStore } from '@/lib/stores/crm-view-store'
import { useToast } from '@/lib/hooks/use-toast'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { CreateDealDialog } from './CreateDealDialog'
import type { Deal } from '@/types/crm.types'

interface DealsPageClientProps {
  initialData: Deal[]
}

export function DealsPageClient({ initialData }: DealsPageClientProps) {
  const [deals] = useState<Deal[]>(initialData)
  const viewType = useCRMViewStore((state) => state.getViewType('deals'))
  const setViewType = useCRMViewStore((state) => state.setViewType)
  const toast = useToast()

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

  const tableColumns = [
    {
      key: 'name',
      header: 'Deal',
      width: '30%',
      render: (deal: Deal) => (
        <div>
          <div className="font-medium text-gray-900">{deal.name}</div>
          <div className="text-sm text-gray-500">{deal.stage}</div>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      width: '20%',
      render: (deal: Deal) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{formatCurrency(deal.value || 0)}</span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      width: '15%',
      render: (deal: Deal) => {
        const colors = {
          Qualified: 'bg-blue-100 text-blue-800',
          Proposal: 'bg-cyan-100 text-cyan-800',
          Negotiation: 'bg-amber-100 text-amber-800',
          'Closed Won': 'bg-green-100 text-green-800',
          'Closed Lost': 'bg-red-100 text-red-800',
        }
        return (
          <Badge className={colors[deal.stage as keyof typeof colors] || ''}>
            {deal.stage}
          </Badge>
        )
      },
    },
    {
      key: 'probability',
      header: 'Probability',
      width: '10%',
      render: (deal: Deal) => (
        <span className="text-sm text-gray-700">{deal.probability || 0}%</span>
      ),
    },
    {
      key: 'close_date',
      header: 'Close Date',
      width: '25%',
      render: (deal: Deal) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          {deal.close_date ? format(new Date(deal.close_date), 'MMM d, yyyy') : 'N/A'}
        </div>
      ),
    },
  ]

  const { boardColumns, boardData } = useMemo(() => {
    const qualifiedDeals = deals.filter((d) => d.stage === 'Qualified')
    const proposalDeals = deals.filter((d) => d.stage === 'Proposal')
    const negotiationDeals = deals.filter((d) => d.stage === 'Negotiation')
    const closedWonDeals = deals.filter((d) => d.stage === 'Closed Won')
    const closedLostDeals = deals.filter((d) => d.stage === 'Closed Lost')

    return {
      boardColumns: [
        { id: 'qualified', title: 'Qualified', color: '#3B82F6', count: qualifiedDeals.length },
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

  const renderCard = useCallback((deal: Deal) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">{deal.name}</div>
      <div className="text-sm text-gray-600">{deal.stage}</div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">{formatCurrency(deal.value || 0)}</span>
        <span className="text-xs text-gray-500">{deal.probability || 0}%</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        {deal.close_date ? format(new Date(deal.close_date), 'MMM d') : 'N/A'}
      </div>
    </div>
  ), [])

  const handleRowClick = useCallback((deal: Deal) => {
    setSelectedDeal(deal.id)
    setDrawerOpen(true)
  }, [])

  const selectedDealData = deals.find((d) => d.id === selectedDeal)

  return (
    <CRMPageContainer>
      <CRMThreeColumnLayout >
        <CRMViewBar
          title="Deals"
          icon={<TrendingUp className="h-5 w-5" />}
          viewType={viewType}
          onViewTypeChange={(type) => setViewType('deals', type)}
          filterButton={
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          }
          sortButton={
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          }
          actions={
            <>
              <div className="lg:hidden">
              </div>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </Button>
            </>
          }
        />

        <div className="flex-1 overflow-hidden">
          {deals.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-12 w-12" />}
              title="No deals yet"
              description="Start tracking your sales opportunities. Create deals, set stages, and close more business with organized pipeline management."
              primaryAction={{
                label: 'Create Deal',
                onClick: () => setCreateDialogOpen(true),
              }}
              secondaryAction={{
                label: 'Import Deals',
                onClick: () => toast.info('Import deals functionality coming soon'),
              }}
            />
          ) : (
            <>
              {viewType === 'table' && (
                <CRMTableView
                  data={deals}
                  columns={tableColumns}
                  onRowClick={handleRowClick}
                />
              )}
              {viewType === 'board' && (
                <KanbanBoard
                  columns={boardColumns}
                  data={boardData}
                  renderCard={renderCard}
                  onCardClick={handleRowClick}
                  onAddCard={(columnId) => toast.info(`Add deal to ${columnId} - coming soon`)}
                />
              )}
            </>
          )}
        </div>
      </CRMThreeColumnLayout>

      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDealData?.name || ''}
        subtitle={selectedDealData?.stage}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Deal Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Value: </span>
                <span className="text-lg font-semibold text-gray-900">
                  {selectedDealData && formatCurrency(selectedDealData.value || 0)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Stage: </span>
                <Badge className="ml-2">{selectedDealData?.stage}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Probability: </span>
                <span className="text-sm text-gray-900">{selectedDealData?.probability || 0}%</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Close Date: </span>
                <span className="text-sm text-gray-900">
                  {selectedDealData?.close_date
                    ? format(new Date(selectedDealData.close_date), 'MMMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <span className="text-sm text-gray-900">{selectedDealData?.status || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedDealData &&
                    formatDistanceToNow(new Date(selectedDealData.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Weighted Value</h3>
            <div className="text-2xl font-bold text-gray-900">
              {selectedDealData &&
                formatCurrency((selectedDealData.value || 0) * ((selectedDealData.probability || 0) / 100))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Based on {selectedDealData?.probability || 0}% probability
            </p>
          </div>
        </div>
      </RecordDrawer>

      <CreateDealDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </CRMPageContainer>
  )
}
