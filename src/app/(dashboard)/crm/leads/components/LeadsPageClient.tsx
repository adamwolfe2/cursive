'use client'

import { useCallback } from 'react'
import { IntegrationExportBar } from '@/components/crm/export/IntegrationExportBar'
import { LeadsTableClient } from './LeadsTableClient'
import { useCRMStore } from '@/lib/crm/crm-state'

export function LeadsPageClient() {
  const { selectedLeadIds, clearSelection } = useCRMStore()

  const handleClearSelection = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  return (
    <>
      <div className="flex h-full flex-col p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Integration Export Bar — visible when leads are selected */}
          <IntegrationExportBar
            selectedLeadIds={selectedLeadIds}
            onClearSelection={handleClearSelection}
          />

          {/* Main table — handles data fetching, filtering, pagination */}
          <LeadsTableClient />
        </div>
      </div>
    </>
  )
}
