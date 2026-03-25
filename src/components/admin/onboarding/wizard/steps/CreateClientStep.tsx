'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, Check, Rocket, CreditCard, FileSignature, AlertTriangle } from 'lucide-react'
import type { ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState, InvoiceState, ContractState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency } from '@/lib/utils/deal-pricing'
import { createClientFromIntake } from '@/app/admin/onboarding/new/actions'

interface CreateClientStepProps {
  deal: DealState
  parsedData: ParsedIntakeData | null
  invoice: InvoiceState
  contract: ContractState
  creationStatus: 'idle' | 'creating' | 'complete' | 'error'
  creationError: string | null
  clientId: string | null
  onStatusChange: (status: 'idle' | 'creating' | 'complete' | 'error', error?: string) => void
  onClientCreated: (id: string) => void
  onClearDraft: () => void
}

export default function CreateClientStep({
  deal,
  parsedData,
  invoice,
  contract,
  creationStatus,
  creationError,
  clientId,
  onStatusChange,
  onClientCreated,
  onClearDraft,
}: CreateClientStepProps) {
  const router = useRouter()
  const pricing = calculateDealPricing(deal)

  const canCreate = parsedData?.company_name && parsedData?.primary_contact_email && parsedData?.packages_selected?.length

  const handleCreate = useCallback(async () => {
    if (!parsedData) return
    onStatusChange('creating')

    try {
      const result = await createClientFromIntake(parsedData)
      if (!result.success) {
        onStatusChange('error', result.error || 'Failed to create client')
        return
      }

      // Update onboarding record with invoice/contract data if available
      if (result.clientId && (invoice.stripeInvoiceId || contract.rabbitsignFolderId)) {
        try {
          await fetch('/api/admin/onboarding/update-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: result.clientId,
              stripe_invoice_id: invoice.stripeInvoiceId,
              stripe_invoice_url: invoice.stripeInvoiceUrl,
              stripe_invoice_status: invoice.status === 'sent' ? 'sent' : 'none',
              rabbitsign_folder_id: contract.rabbitsignFolderId,
              rabbitsign_status: contract.status === 'sent' ? 'sent' : 'none',
            }),
          })
        } catch {
          // Non-fatal — client is created, tracking update can be retried
        }
      }

      onClientCreated(result.clientId!)
      onClearDraft()
      onStatusChange('complete')
    } catch (error) {
      onStatusChange('error', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [parsedData, invoice, contract, onStatusChange, onClientCreated, onClearDraft])

  if (creationStatus === 'complete' && clientId) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Rocket className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Client Created</h2>
        <p className="text-sm text-gray-500 mb-6">
          {parsedData?.company_name} is now in the pipeline. The automation pipeline is running.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/admin/onboarding/${clientId}`)}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View Client
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Card padding="sm">
        <div className="px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Create Client</h2>

          {/* Summary */}
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Company</span>
              <span className="font-medium text-gray-900">{parsedData?.company_name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Contact</span>
              <span className="font-medium text-gray-900">{parsedData?.primary_contact_email || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Packages</span>
              <span className="font-medium text-gray-900">{(parsedData?.packages_selected || []).length} selected</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Setup Fee</span>
              <span className="font-medium text-gray-900">{fmtCurrency(pricing.totalSetup)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly</span>
              <span className="font-bold text-blue-700">{fmtCurrency(pricing.totalMonthlyClientPays)}/mo</span>
            </div>
          </div>

          {/* Invoice/Contract status */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center gap-2 text-xs">
              <CreditCard className="h-3.5 w-3.5 text-gray-400" />
              <span className={invoice.status === 'sent' ? 'text-green-700' : 'text-gray-400'}>
                {invoice.status === 'sent' ? 'Invoice sent' : invoice.status === 'idle' ? 'No invoice sent' : invoice.status}
              </span>
              {invoice.status === 'sent' && <Check className="h-3 w-3 text-green-600" />}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FileSignature className="h-3.5 w-3.5 text-gray-400" />
              <span className={contract.status === 'sent' ? 'text-green-700' : 'text-gray-400'}>
                {contract.status === 'sent' ? 'Contract sent for signing' : contract.status === 'idle' ? 'No contract sent' : contract.status}
              </span>
              {contract.status === 'sent' && <Check className="h-3 w-3 text-green-600" />}
            </div>
          </div>

          {/* Warnings */}
          {!canCreate && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-4">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Missing required fields: company name, contact email, or packages. Go back to Review step.
            </div>
          )}

          {creationError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-4">
              {creationError}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate || creationStatus === 'creating'}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creationStatus === 'creating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Create Client & Launch Pipeline
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center mt-2">
            Creates the onboarding record and fires: ICP enrichment, copy generation, Slack alert, confirmation email, CRM sync
          </p>
        </div>
      </Card>
    </div>
  )
}
