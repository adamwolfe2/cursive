'use client'

import { useState } from 'react'
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
import { MobileMenu } from '@/components/ui/mobile-menu'
import { formatDistanceToNow, format } from 'date-fns'

// Mock data
const mockDeals = [
  {
    id: '1',
    name: 'Enterprise Plan - Acme Corp',
    company: 'Acme Corp',
    value: 50000,
    stage: 'Proposal',
    probability: 60,
    closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    contact: 'Sarah Johnson',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: '2',
    name: 'Pro Plan - Tech Corp',
    company: 'Tech Corp',
    value: 25000,
    stage: 'Negotiation',
    probability: 80,
    closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
    contact: 'Michael Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: '3',
    name: 'Starter Plan - Startup Inc',
    company: 'Startup Inc',
    value: 10000,
    stage: 'Qualified',
    probability: 40,
    closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
    contact: 'Emily Rodriguez',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
]

export function DealsPageClient() {
  const viewType = useCRMViewStore((state) => state.getViewType('deals'))
  const setViewType = useCRMViewStore((state) => state.setViewType)

  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sidebarContent = (
    <div className="flex h-full flex-col p-6">
      <h2 className="bg-gradient-cursive bg-clip-text text-xl font-semibold text-transparent">
        CRM
      </h2>
      <nav className="mt-6 space-y-1.5">
        <Link
          href="/crm/leads"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Leads
        </Link>
        <Link
          href="/crm/companies"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Companies
        </Link>
        <Link
          href="/crm/contacts"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Contacts
        </Link>
        <div className="rounded-lg bg-gradient-cursive px-3 py-2.5 font-medium text-white shadow-sm">
          Deals
        </div>
      </nav>
    </div>
  )

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
      render: (deal: typeof mockDeals[0]) => (
        <div>
          <div className="font-medium text-gray-900">{deal.name}</div>
          <div className="text-sm text-gray-500">{deal.company}</div>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      width: '15%',
      render: (deal: typeof mockDeals[0]) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{formatCurrency(deal.value)}</span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      width: '15%',
      render: (deal: typeof mockDeals[0]) => {
        const colors = {
          Qualified: 'bg-blue-100 text-blue-800',
          Proposal: 'bg-purple-100 text-purple-800',
          Negotiation: 'bg-amber-100 text-amber-800',
          Closed: 'bg-green-100 text-green-800',
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
      render: (deal: typeof mockDeals[0]) => (
        <span className="text-sm text-gray-700">{deal.probability}%</span>
      ),
    },
    {
      key: 'closeDate',
      header: 'Close Date',
      width: '15%',
      render: (deal: typeof mockDeals[0]) => (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4 text-gray-400" />
          {format(deal.closeDate, 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      width: '15%',
      render: (deal: typeof mockDeals[0]) => (
        <span className="text-sm text-gray-700">{deal.contact}</span>
      ),
    },
  ]

  const boardColumns = [
    { id: 'qualified', title: 'Qualified', color: '#3B82F6', count: 1 },
    { id: 'proposal', title: 'Proposal', color: '#8B5CF6', count: 1 },
    { id: 'negotiation', title: 'Negotiation', color: '#F59E0B', count: 1 },
    { id: 'closed', title: 'Closed Won', color: '#10B981', count: 0 },
  ]

  const boardData = {
    qualified: mockDeals.filter((d) => d.stage === 'Qualified'),
    proposal: mockDeals.filter((d) => d.stage === 'Proposal'),
    negotiation: mockDeals.filter((d) => d.stage === 'Negotiation'),
    closed: mockDeals.filter((d) => d.stage === 'Closed'),
  }

  const renderCard = (deal: typeof mockDeals[0]) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">{deal.name}</div>
      <div className="text-sm text-gray-600">{deal.company}</div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">{formatCurrency(deal.value)}</span>
        <span className="text-xs text-gray-500">{deal.probability}%</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        {format(deal.closeDate, 'MMM d')}
      </div>
    </div>
  )

  const handleRowClick = (deal: typeof mockDeals[0]) => {
    setSelectedDeal(deal.id)
    setDrawerOpen(true)
  }

  const selectedDealData = mockDeals.find((d) => d.id === selectedDeal)

  return (
    <CRMPageContainer>
      <CRMThreeColumnLayout sidebar={<div className="hidden lg:block">{sidebarContent}</div>}>
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
                <MobileMenu triggerClassName="h-9 px-3">{sidebarContent}</MobileMenu>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </Button>
            </>
          }
        />

        <div className="flex-1 overflow-hidden">
          {mockDeals.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-12 w-12" />}
              title="No deals yet"
              description="Start tracking your sales opportunities. Create deals, set stages, and close more business with organized pipeline management."
              primaryAction={{
                label: 'Create Deal',
                onClick: () => console.log('Create deal'),
              }}
              secondaryAction={{
                label: 'Import Deals',
                onClick: () => console.log('Import deals'),
              }}
            />
          ) : (
            <>
              {viewType === 'table' && (
                <CRMTableView
                  data={mockDeals}
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
                  onAddCard={(columnId) => console.log('Add card to', columnId)}
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
        subtitle={selectedDealData?.company}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Deal Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Value: </span>
                <span className="text-lg font-semibold text-gray-900">
                  {selectedDealData && formatCurrency(selectedDealData.value)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Stage: </span>
                <Badge className="ml-2">{selectedDealData?.stage}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Probability: </span>
                <span className="text-sm text-gray-900">{selectedDealData?.probability}%</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Close Date: </span>
                <span className="text-sm text-gray-900">
                  {selectedDealData && format(selectedDealData.closeDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Contact: </span>
                <span className="text-sm text-gray-900">{selectedDealData?.contact}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Company: </span>
                <span className="text-sm text-gray-900">{selectedDealData?.company}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedDealData &&
                    formatDistanceToNow(selectedDealData.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Weighted Value</h3>
            <div className="text-2xl font-bold text-gray-900">
              {selectedDealData &&
                formatCurrency(selectedDealData.value * (selectedDealData.probability / 100))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Based on {selectedDealData?.probability}% probability
            </p>
          </div>
        </div>
      </RecordDrawer>
    </CRMPageContainer>
  )
}
