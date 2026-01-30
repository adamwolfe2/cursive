'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, Filter, ArrowUpDown } from 'lucide-react'
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
import type { Company } from '@/types/crm.types'

interface CompaniesPageClientProps {
  initialData: Company[]
}

export function CompaniesPageClient({ initialData }: CompaniesPageClientProps) {
  const [companies] = useState<Company[]>(initialData)
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
      render: (company: Company) => (
        <div>
          <div className="font-medium text-gray-900">{company.name}</div>
          <div className="text-sm text-gray-500">{company.industry || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'employees',
      header: 'Employees',
      width: '15%',
      render: (company: Company) => (
        <span className="text-gray-700">{company.employees_range || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (company: Company) => {
        const colors = {
          Active: 'bg-green-100 text-green-800',
          Prospect: 'bg-blue-100 text-blue-800',
          Inactive: 'bg-gray-100 text-gray-800',
          Lost: 'bg-red-100 text-red-800',
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
      render: (company: Company) => (
        <span className="font-medium text-gray-900">{company.revenue_range || 'N/A'}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      width: '15%',
      render: (company: Company) => (
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ]

  const prospectCompanies = companies.filter((c) => c.status === 'Prospect')
  const activeCompanies = companies.filter((c) => c.status === 'Active')
  const inactiveCompanies = companies.filter((c) => c.status === 'Inactive')
  const lostCompanies = companies.filter((c) => c.status === 'Lost')

  const boardColumns = [
    { id: 'prospect', title: 'Prospect', color: '#3B82F6', count: prospectCompanies.length },
    { id: 'active', title: 'Active', color: '#10B981', count: activeCompanies.length },
    { id: 'inactive', title: 'Inactive', color: '#6B7280', count: inactiveCompanies.length },
    { id: 'lost', title: 'Lost', color: '#EF4444', count: lostCompanies.length },
  ]

  const boardData = {
    prospect: prospectCompanies,
    active: activeCompanies,
    inactive: inactiveCompanies,
    lost: lostCompanies,
  }

  const renderCard = (company: Company) => (
    <div className="space-y-2">
      <div className="font-medium text-gray-900">{company.name}</div>
      <div className="text-sm text-gray-600">{company.industry || 'N/A'}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{company.revenue_range || 'N/A'}</span>
        <span className="text-xs text-gray-500">{company.employees_range || 'N/A'}</span>
      </div>
    </div>
  )

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company.id)
    setDrawerOpen(true)
  }

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

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
          {companies.length === 0 ? (
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
                  data={companies}
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
        subtitle={selectedCompanyData?.industry || undefined}
      >
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">Company Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Industry: </span>
                <span className="text-sm text-gray-900">{selectedCompanyData?.industry || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Employees: </span>
                <span className="text-sm text-gray-900">{selectedCompanyData?.employees_range || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status: </span>
                <Badge className="ml-2">{selectedCompanyData?.status}</Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Revenue: </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedCompanyData?.revenue_range || 'N/A'}
                </span>
              </div>
              {selectedCompanyData?.website && (
                <div>
                  <span className="text-sm text-gray-500">Website: </span>
                  <a
                    href={selectedCompanyData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedCompanyData.website}
                  </a>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Created: </span>
                <span className="text-sm text-gray-900">
                  {selectedCompanyData &&
                    formatDistanceToNow(new Date(selectedCompanyData.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RecordDrawer>
    </CRMPageContainer>
  )
}
