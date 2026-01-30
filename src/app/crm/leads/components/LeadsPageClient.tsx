'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Plus, Filter, ArrowUpDown } from 'lucide-react'
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
import { formatDistanceToNow } from 'date-fns'
import type { LeadTableRow } from '@/types/crm.types'

interface LeadsPageClientProps {
  initialData: LeadTableRow[]
}

export function LeadsPageClient({ initialData }: LeadsPageClientProps) {
  const [leads] = useState<LeadTableRow[]>(initialData)
  const viewType = useCRMViewStore((state) => state.getViewType('leads'))
  const setViewType = useCRMViewStore((state) => state.setViewType)

  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sidebar content
  const sidebarContent = (
    <div className="flex h-full flex-col p-6">
      <h2 className="bg-gradient-cursive bg-clip-text text-xl font-semibold text-transparent">
        CRM
      </h2>
      <nav className="mt-6 space-y-1.5">
        <div className="rounded-lg bg-gradient-cursive px-3 py-2.5 font-medium text-white shadow-sm">
          Leads
        </div>
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
        <Link
          href="/crm/deals"
          className="block rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:bg-gradient-cursive-subtle"
        >
          Deals
        </Link>
      </nav>
    </div>
  )

  // Table columns configuration
  const tableColumns = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      render: (lead: LeadTableRow) => (
        <div>
          <div className="font-medium text-gray-900">
            {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead'}
          </div>
          <div className="text-sm text-gray-500">{lead.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      width: '20%',
      render: (lead: LeadTableRow) => (
        <span className="text-gray-700">{lead.company_name || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (lead: LeadTableRow) => {
        const colors = {
          new: 'bg-blue-100 text-blue-800',
          contacted: 'bg-amber-100 text-amber-800',
          qualified: 'bg-green-100 text-green-800',
          won: 'bg-emerald-100 text-emerald-800',
          lost: 'bg-red-100 text-red-800',
        }
        const statusLabel = lead.status.charAt(0).toUpperCase() + lead.status.slice(1)
        return (
          <Badge className={colors[lead.status as keyof typeof colors] || ''}>
            {statusLabel}
          </Badge>
        )
      },
    },
    {
      key: 'assigned',
      header: 'Assigned',
      width: '20%',
      render: (lead: LeadTableRow) => (
        <span className="text-sm text-gray-700">
          {lead.assigned_user?.full_name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      width: '20%',
      render: (lead: LeadTableRow) => (
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ]

  // Kanban board configuration
  const newLeads = leads.filter((l) => l.status === 'new')
  const contactedLeads = leads.filter((l) => l.status === 'contacted')
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified')
  const wonLeads = leads.filter((l) => l.status === 'won')

  const boardColumns = [
    { id: 'new', title: 'New', color: '#3B82F6', count: newLeads.length },
    { id: 'contacted', title: 'Contacted', color: '#F59E0B', count: contactedLeads.length },
    { id: 'qualified', title: 'Qualified', color: '#10B981', count: qualifiedLeads.length },
    { id: 'won', title: 'Won', color: '#059669', count: wonLeads.length },
  ]

  const boardData = {
    new: newLeads,
    contacted: contactedLeads,
    qualified: qualifiedLeads,
    won: wonLeads,
  }

  const renderCard = (lead: LeadTableRow) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">
        {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead'}
      </div>
      <div className="text-sm text-gray-600">{lead.company_name || 'N/A'}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{lead.email || 'N/A'}</span>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  )

  const handleRowClick = (lead: LeadTableRow) => {
    setSelectedLead(lead.id)
    setDrawerOpen(true)
  }

  const selectedLeadData = leads.find((l) => l.id === selectedLead)

  return (
    <CRMPageContainer>
      <CRMThreeColumnLayout
        sidebar={
          <div className="hidden lg:block">
            {sidebarContent}
          </div>
        }
      >
        {/* View Bar */}
        <CRMViewBar
          title="Leads"
          icon={<Users className="h-5 w-5" />}
          viewType={viewType}
          onViewTypeChange={(type) => setViewType('leads', type)}
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
              {/* Mobile menu */}
              <div className="lg:hidden">
                <MobileMenu triggerClassName="h-9 px-3">
                  {sidebarContent}
                </MobileMenu>
              </div>

              {/* Add lead button */}
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </>
          }
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {leads.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No leads yet"
              description="Get started by creating your first lead or importing leads from a CSV file."
              primaryAction={{
                label: 'Create Lead',
                onClick: () => console.log('Create lead'),
              }}
              secondaryAction={{
                label: 'Import Leads',
                onClick: () => console.log('Import leads'),
              }}
            />
          ) : (
            <>
              {viewType === 'table' && (
                <CRMTableView
                  data={leads}
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

      {/* Record Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          selectedLeadData
            ? [selectedLeadData.first_name, selectedLeadData.last_name].filter(Boolean).join(' ') || 'Unnamed Lead'
            : ''
        }
        subtitle={selectedLeadData?.company_name}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Contact Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Email: </span>
                <span className="text-sm text-gray-900">{selectedLeadData?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone: </span>
                <span className="text-sm text-gray-900">{selectedLeadData?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Company: </span>
                <span className="text-sm text-gray-900">{selectedLeadData?.company_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">State: </span>
                <span className="text-sm text-gray-900">{selectedLeadData?.state || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Lead Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <Badge className="ml-2">
                  {selectedLeadData?.status ? selectedLeadData.status.charAt(0).toUpperCase() + selectedLeadData.status.slice(1) : 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Assigned: </span>
                <span className="text-sm text-gray-900">
                  {selectedLeadData?.assigned_user?.full_name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedLeadData && formatDistanceToNow(new Date(selectedLeadData.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RecordDrawer>
    </CRMPageContainer>
  )
}
