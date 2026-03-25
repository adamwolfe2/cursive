'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { CreditCard, FileSignature, Loader2, Check, ExternalLink, AlertTriangle } from 'lucide-react'
import type { ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState, InvoiceState, ContractState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency, fmtCurrencyDecimal } from '@/lib/utils/deal-pricing'
import { buildInvoiceLineItems } from '@/lib/integrations/stripe-invoice'

interface InvoiceContractStepProps {
  deal: DealState
  parsedData: ParsedIntakeData | null
  invoice: InvoiceState
  contract: ContractState
  onInvoiceUpdate: (update: Partial<InvoiceState>) => void
  onContractUpdate: (update: Partial<ContractState>) => void
}

export default function InvoiceContractStep({
  deal,
  parsedData,
  invoice,
  contract,
  onInvoiceUpdate,
  onContractUpdate,
}: InvoiceContractStepProps) {
  const [daysUntilDue, setDaysUntilDue] = useState(14)

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])
  const clientEmail = parsedData?.primary_contact_email || ''
  const clientName = parsedData?.company_name || deal.clientName || ''

  const lineItems = useMemo(
    () => buildInvoiceLineItems(pricing.totalSetup, pricing.totalRecurring, pricing.infraMonthly, clientName),
    [pricing, clientName]
  )

  const totalAmount = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  // ---------------------------------------------------------------------------
  // Send invoice
  // ---------------------------------------------------------------------------

  const handleSendInvoice = useCallback(async () => {
    if (!clientEmail) return
    onInvoiceUpdate({ status: 'creating', error: null })

    try {
      const res = await fetch('/api/admin/stripe/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: clientEmail,
          customerName: clientName,
          lineItems,
          daysUntilDue,
          memo: `Cursive AI services for ${clientName}`,
          sendEmail: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        throw new Error(err.error || 'Failed to create invoice')
      }

      const { data } = await res.json()
      onInvoiceUpdate({
        status: 'sent',
        stripeInvoiceId: data.id,
        stripeInvoiceUrl: data.hostedUrl,
      })
    } catch (error) {
      onInvoiceUpdate({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      })
    }
  }, [clientEmail, clientName, lineItems, daysUntilDue, onInvoiceUpdate])

  // ---------------------------------------------------------------------------
  // Send contract
  // ---------------------------------------------------------------------------

  const handleSendContract = useCallback(async () => {
    if (!clientEmail || !parsedData?.primary_contact_name) return
    onContractUpdate({ status: 'creating', error: null })

    try {
      const res = await fetch('/api/admin/rabbitsign/create-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: clientName,
          contactName: parsedData.primary_contact_name,
          contactEmail: clientEmail,
          setupFee: pricing.totalSetup,
          monthlyFee: pricing.totalRecurring,
          infraMonthly: pricing.infraMonthly,
          packages: parsedData.packages_selected || [],
          billingCadence: deal.billingCadence,
          outboundTier: deal.outboundTierId,
          notes: deal.notes,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }))
        throw new Error(err.error || 'Failed to create contract')
      }

      const { data } = await res.json()
      onContractUpdate({
        status: 'sent',
        rabbitsignFolderId: data.folderId,
      })
    } catch (error) {
      onContractUpdate({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create contract',
      })
    }
  }, [clientEmail, clientName, parsedData, pricing, deal, onContractUpdate])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Stripe Invoice */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Stripe Invoice</h2>
          </div>

          {!clientEmail && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-4">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Client email required. Fill it in on the Review step first.
            </div>
          )}

          {/* Line items preview */}
          <div className="space-y-1.5 mb-4">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">{item.name}</span>
                <span className="font-medium text-gray-900">{fmtCurrency(item.unitPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
              <span>Total</span>
              <span>{fmtCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Due in (days)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={daysUntilDue}
              onChange={(e) => setDaysUntilDue(Number(e.target.value))}
              className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {invoice.status === 'idle' && (
            <button
              type="button"
              onClick={handleSendInvoice}
              disabled={!clientEmail}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Send Invoice
            </button>
          )}

          {invoice.status === 'creating' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating invoice...
            </div>
          )}

          {invoice.status === 'sent' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Invoice sent to {clientEmail}
              </div>
              {invoice.stripeInvoiceUrl && (
                <a
                  href={invoice.stripeInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  View Invoice <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {invoice.status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{invoice.error}</p>
              <button type="button" onClick={() => onInvoiceUpdate({ status: 'idle', error: null })} className="text-xs text-blue-600 underline">
                Retry
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* RabbitSign Contract */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <FileSignature className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">RabbitSign Contract</h2>
          </div>

          {!clientEmail && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-4">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Client email and name required. Fill them in on the Review step first.
            </div>
          )}

          <div className="space-y-1 mb-4 text-sm text-gray-600">
            <p>SOW/Contract will be sent for e-signature to:</p>
            <p className="font-medium text-gray-900">{parsedData?.primary_contact_name || '(name required)'}</p>
            <p className="text-gray-500">{clientEmail || '(email required)'}</p>
          </div>

          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 mb-4 text-xs text-gray-500 space-y-0.5">
            <p>Setup: {fmtCurrency(pricing.totalSetup)}</p>
            <p>Monthly: {fmtCurrency(pricing.totalRecurring)} + {fmtCurrencyDecimal(pricing.infraMonthly)} infra</p>
            <p>Packages: {(parsedData?.packages_selected || []).join(', ') || 'None selected'}</p>
          </div>

          {contract.status === 'idle' && (
            <button
              type="button"
              onClick={handleSendContract}
              disabled={!clientEmail || !parsedData?.primary_contact_name}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FileSignature className="h-4 w-4" />
              Send Contract
            </button>
          )}

          {contract.status === 'creating' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating contract...
            </div>
          )}

          {contract.status === 'sent' && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="h-4 w-4" />
              Contract sent for signature
            </div>
          )}

          {contract.status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{contract.error}</p>
              <button type="button" onClick={() => onContractUpdate({ status: 'idle', error: null })} className="text-xs text-blue-600 underline">
                Retry
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
