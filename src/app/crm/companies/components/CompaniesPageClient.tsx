'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, Filter, ArrowUpDown, Inbox } from 'lucide-react'
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

// Mock data
const mockCompanies = [
  {
    id: '1',
    name: 'Acme Corp',
    industry: 'Technology',
    employees: '500-1000',
    status: 'Active',
    revenue: '$5M ARR',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: '2',
    name: 'Tech Industries',
    industry: 'Software',
    employees: '100-500',
    status: 'Active',
    revenue: '$2M ARR',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: '3',
    name: 'Global Solutions Inc',
    industry: 'Consulting',
    employees: '1000+',
    status: 'Prospect',
    revenue: '$15M ARR',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
]

export function CompaniesPageClient() {
  const viewType = useCRMViewStore((state) => state.getViewType('companies'))
  const setViewType = useCRMViewStore((state) => state.setViewType)

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
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
        <div className="rounded-lg bg-gradient-cursive px-3 py-2.5 font-medium text-white shadow-sm">
          Companies
        </div>
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

  const tableColumns = [
    {
      key: 'name',
      header: 'Company',
      width: '30%',
      render: (company: typeof mockCompanies[0]) => (
        <div>
          <div className="font-medium text-gray-900">{company.name}</div>
          <div className="text-sm text-gray-500">{company.industry}</div>
        </div>
      ),
    },
    {
      key: 'employees',
      header: 'Employees',
      width: '15%',
      render: (company: typeof mockCompanies[0]) => (
        <span className="text-gray-700">{company.employees}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (company: typeof mockCompanies[0]) => {
        const colors = {
          Active: 'bg-green-100 text-green-800',
          Prospect: 'bg-blue-100 text-blue-800',
          Inactive: 'bg-gray-100 text-gray-800',
        }
        return (
          <Badge className={colors[company.status as keyof typeof colors] || ''}>
            {company.status}
          </Badge>
        )
      },
    },
    {
      key: 'revenue',
      header: 'Revenue',
      width: '15%',
      render: (company: typeof mockCompanies[0]) => (
        <span className="font-medium text-gray-900">{company.revenue}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      width: '15%',
      render: (company: typeof mockCompanies[0]) => (
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(company.createdAt, { addSuffix: true })}
        </span>
      ),
    },
  ]

  const boardColumns = [
    { id: 'prospect', title: 'Prospect', color: '#3B82F6', count: 1 },
    { id: 'active', title: 'Active', color: '#10B981', count: 2 },
    { id: 'inactive', title: 'Inactive', color: '#6B7280', count: 0 },
  ]

  const boardData = {
    prospect: mockCompanies.filter((c) => c.status === 'Prospect'),
    active: mockCompanies.filter((c) => c.status === 'Active'),
    inactive: mockCompanies.filter((c) => c.status === 'Inactive'),
  }

  const renderCard = (company: typeof mockCompanies[0]) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">{company.name}</div>
      <div className="text-sm text-gray-600">{company.industry}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{company.revenue}</span>
        <span className="text-xs text-gray-500">{company.employees}</span>
      </div>
    </div>
  )

  const handleRowClick = (company: typeof mockCompanies[0]) => {
    setSelectedCompany(company.id)
    setDrawerOpen(true)
  }

  const selectedCompanyData = mockCompanies.find((c) => c.id === selectedCompany)

  return (
    <CRMPageContainer>
      <CRMThreeColumnLayout sidebar={<div className="hidden lg:block">{sidebarContent}</div>}>
        <CRMViewBar
          title="Companies"
          icon={<Building2 className="h-5 w-5" />}
          viewType={viewType}
          onViewTypeChange={(type) => setViewType('companies', type)}
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
                Add Company
              </Button>
            </>
          }
        />

        <div className="flex-1 overflow-hidden">
          {mockCompanies.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="No companies yet"
              description="Start managing your business accounts by adding your first company. Track deals, contacts, and activities all in one place."
              primaryAction={{
                label: 'Create Company',
                onClick: () => console.log('Create company'),
              }}
              secondaryAction={{
                label: 'Import Companies',
                onClick: () => console.log('Import companies'),
              }}
            />
          ) : (
            <>
              {viewType === 'table' && (
                <CRMTableView
                  data={mockCompanies}
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
        title={selectedCompanyData?.name || ''}
        subtitle={selectedCompanyData?.industry}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Company Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Industry: </span>
                <span className="text-sm text-gray-900">{selectedCompanyData?.industry}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Employees: </span>
                <span className="text-sm text-gray-900">{selectedCompanyData?.employees}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <Badge className="ml-2">{selectedCompanyData?.status}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Revenue: </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedCompanyData?.revenue}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedCompanyData &&
                    formatDistanceToNow(selectedCompanyData.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RecordDrawer>
    </CRMPageContainer>
  )
}
