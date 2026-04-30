'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, Check, Rocket, CreditCard, FileSignature, AlertTriangle, Copy, Mail } from 'lucide-react'
import type { ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState, InvoiceState, ContractState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency } from '@/lib/utils/deal-pricing'
import { createClientFromIntake } from '@/app/admin/onboarding/new/actions'
import type { CreateClientOptions } from '@/app/admin/onboarding/new/actions'

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
  const [portalSendStatus, setPortalSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [portalSendError, setPortalSendError] = useState<string | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleSendPortal = useCallback(async () => {
    if (!clientId) return
    setPortalSendStatus('sending')
    setPortalSendError(null)

    try {
      const res = await fetch('/api/admin/portal/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setPortalSendStatus('error')
        setPortalSendError(data.error ?? 'Failed to send portal invite')
        return
      }

      setPortalUrl(data.portalUrl ?? null)
      setPortalSendStatus('sent')
    } catch {
      setPortalSendStatus('error')
      setPortalSendError('Network error — please try again')
    }
  }, [clientId])

  const handleCopyLink = useCallback(async () => {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // Clipboard not available
    }
  }, [portalUrl])

  const canCreate = parsedData?.company_name && parsedData?.primary_contact_name && parsedData?.primary_contact_email && parsedData?.packages_selected?.length

  const handleCreate = useCallback(async () => {
    if (!parsedData) return
    onStatusChange('creating')

    try {
      const options: CreateClientOptions = {
        deal,
        sowSigned: contract.status === 'signed',
        paymentConfirmed: invoice.status === 'paid',
        infraMonthlyFee: pricing.infraMonthly || null,
      }

      const result = await createClientFromIntake(parsedData, options)
      if (!result.success) {
        onStatusChange('error', result.error || 'Failed to create client')
        return
      }

      // Update onboarding record with invoice/contract tracking data
      const hasTracking =
        invoice.stripeInvoiceId ||
        contract.rabbitsignFolderId ||
        contract.status === 'signed' ||
        invoice.status === 'paid'

      if (result.clientId && hasTracking) {
        try {
          await fetch('/api/admin/onboarding/update-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: result.clientId,
              stripe_invoice_id: invoice.stripeInvoiceId,
              stripe_invoice_url: invoice.stripeInvoiceUrl,
              stripe_invoice_status: invoice.status === 'paid' ? 'paid' : invoice.status === 'sent' ? 'sent' : 'none',
              rabbitsign_folder_id: contract.rabbitsignFolderId,
              rabbitsign_status: contract.status === 'signed' ? 'signed' : contract.status === 'sent' ? 'sent' : 'none',
              sow_signed: contract.status === 'signed',
              payment_confirmed: invoice.status === 'paid',
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
  }, [parsedData, deal, pricing, invoice, contract, onStatusChange, onClientCreated, onClearDraft])

  if (creationStatus === 'complete' && clientId) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        {/* Success header */}
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Client Created</h2>
          <p className="text-sm text-gray-500">
            {parsedData?.company_name} is now in the pipeline. The automation pipeline is running.
          </p>
        </div>

        {/* Send Client Portal section */}
        <Card padding="sm">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Send Client Portal</h3>

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-4 text-sm text-blue-800">
              Send your client their onboarding portal so they can sign the contract, pay the invoice, and approve domains &amp; copy — all in one place.
            </div>

            {portalSendStatus === 'sent' && portalUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  Portal link sent to {parsedData?.primary_contact_email}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-mono text-gray-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {portalSendStatus === 'error' && portalSendError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-3">
                    {portalSendError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSendPortal}
                  disabled={portalSendStatus === 'sending'}
                  className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {portalSendStatus === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Portal Email
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </Card>

        {/* View client button */}
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => router.push(`/admin/onboarding/${clientId}`)}
            className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            View Client
          </button>
        </div>
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
              <span className={invoice.status === 'sent' || invoice.status === 'paid' ? 'text-green-700' : 'text-gray-400'}>
                {invoice.status === 'paid' ? 'Payment confirmed' : invoice.status === 'sent' ? 'Invoice sent' : invoice.status === 'idle' ? 'No invoice sent' : invoice.status}
              </span>
              {(invoice.status === 'sent' || invoice.status === 'paid') && <Check className="h-3 w-3 text-green-600" />}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FileSignature className="h-3.5 w-3.5 text-gray-400" />
              <span className={contract.status === 'sent' || contract.status === 'signed' ? 'text-green-700' : 'text-gray-400'}>
                {contract.status === 'signed' ? 'Contract signed' : contract.status === 'sent' ? 'Contract sent for signing' : contract.status === 'idle' ? 'No contract sent' : contract.status}
              </span>
              {(contract.status === 'sent' || contract.status === 'signed') && <Check className="h-3 w-3 text-green-600" />}
            </div>
          </div>

          {/* Warnings */}
          {!canCreate && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-4">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Missing required fields: company name, contact name, contact email, or packages. Go back to Review step.
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
