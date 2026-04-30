'use client'

import { useState } from 'react'
import { EnhancedCompaniesTable } from '@/components/crm/table/EnhancedCompaniesTable'
import { RecordDrawer } from '@/components/crm/drawer/RecordDrawer'
import { CreateCompanyDialog } from './CreateCompanyDialog'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import type { Company } from '@/types/crm.types'

interface CompaniesPageClientProps {
  initialData: Company[]
}

export function CompaniesPageClient({ initialData }: CompaniesPageClientProps) {
  const router = useRouter()
  const [companies] = useState<Company[]>(initialData)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company.id)
    setDrawerOpen(true)
  }

  const handleCreateClick = () => {
    setCreateDialogOpen(true)
  }

  const handleDialogClose = (created: boolean) => {
    setCreateDialogOpen(false)
    if (created) {
      router.refresh()
    }
  }

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  return (
    <div className="flex h-full flex-col p-6">
      {/* Enhanced square-ui inspired table */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Building2 className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No companies yet</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Companies are synced automatically as visitors are identified. Connect your integrations in{' '}
            <a href="/settings/integrations" className="text-blue-600 hover:underline">
              Settings &rarr; Integrations
            </a>{' '}
            to sync companies automatically.
          </p>
          <div className="mt-6">
            <Button size="sm" onClick={handleCreateClick}>
              Add Company
            </Button>
          </div>
        </div>
      ) : (
        <EnhancedCompaniesTable
          data={companies}
          onRowClick={handleRowClick}
          onCreateClick={handleCreateClick}
        />
      )}

      {/* Create Company Dialog */}
      <CreateCompanyDialog
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
        title={selectedCompanyData?.name || ''}
        subtitle={selectedCompanyData?.industry || undefined}
      >
        <div className="space-y-6">
          {/* Company Information */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Company Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Industry</span>
                <span className="text-sm text-foreground">
                  {selectedCompanyData?.industry || '-'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Website</span>
                {selectedCompanyData?.website ? (
                  <a
                    href={selectedCompanyData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedCompanyData.website}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Employees</span>
                <span className="text-sm text-foreground">
                  {selectedCompanyData?.employees_range || '-'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Revenue</span>
                <span className="text-sm text-foreground">
                  {selectedCompanyData?.revenue_range || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {selectedCompanyData?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Created</span>
                <span className="text-sm text-foreground">
                  {selectedCompanyData &&
                    formatDistanceToNow(new Date(selectedCompanyData.created_at), {
                      addSuffix: true,
                    })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </RecordDrawer>
    </div>
  )
}
