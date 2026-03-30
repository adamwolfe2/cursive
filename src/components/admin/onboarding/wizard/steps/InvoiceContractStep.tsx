'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import {
  CreditCard, FileSignature, Loader2, Check, ExternalLink,
  AlertTriangle, Upload, Eye, Send, ChevronDown, ChevronUp,
} from 'lucide-react'
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
  // Invoice state
  const [daysUntilDue, setDaysUntilDue] = useState(14)
  const [invoiceReview, setInvoiceReview] = useState(false)
  const [externalInvoiceUrl, setExternalInvoiceUrl] = useState('')
  const [showExternalInvoice, setShowExternalInvoice] = useState(false)

  // Contract state
  const [contractTemplateId, setContractTemplateId] = useState(
    process.env.NEXT_PUBLIC_RABBITSIGN_CONTRACT_TEMPLATE_ID || ''
  )
  const [contractReview, setContractReview] = useState(false)
  const [contractExternalUrl, setContractExternalUrl] = useState('')
  const [showExternalContract, setShowExternalContract] = useState(false)

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])
  const clientEmail = parsedData?.primary_contact_email || ''
  const clientName = parsedData?.company_name || deal.clientName || ''
  const contactName = parsedData?.primary_contact_name || ''

  const lineItems = useMemo(
    () => buildInvoiceLineItems({
      setupFee: pricing.totalSetup,
      monthlyService: pricing.totalRecurring,
      clientName,
      domains: pricing.domains,
      inboxes: pricing.inboxes,
      domainAnnualCost: pricing.domainCostAnnual,
      inboxMonthlyCost: pricing.inboxCostMonthly,
    }),
    [pricing, clientName]
  )
  const totalAmount = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  // Contract fields preview — exactly what RabbitSign will receive
  const contractFields = useMemo(() => ({
    client_company: clientName,
    client_name: contactName,
    client_email: clientEmail,
    setup_fee: `$${pricing.totalSetup.toLocaleString()}`,
    monthly_fee: `$${pricing.totalRecurring.toLocaleString()}`,
    infra_monthly: `$${pricing.infraMonthly.toFixed(2)}`,
    domain_annual: `$${pricing.domainCostAnnual.toFixed(2)}`,
    inbox_monthly: `$${pricing.inboxCostMonthly.toFixed(2)}`,
    total_monthly: `$${(pricing.totalRecurring + pricing.infraMonthly).toLocaleString()}`,
    packages: (parsedData?.packages_selected || []).join(', ') || 'None',
    billing_cadence: deal.billingCadence,
    outbound_tier: deal.outboundTierId || 'N/A',
    start_date: new Date().toISOString().split('T')[0],
    notes: deal.notes || '',
  }), [clientName, contactName, clientEmail, pricing, parsedData, deal])

  // ---------------------------------------------------------------------------
  // Invoice handlers
  // ---------------------------------------------------------------------------

  const handleSendInvoice = useCallback(async () => {
    if (!clientEmail) return
    onInvoiceUpdate({ status: 'creating', error: null })
    setInvoiceReview(false)

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
      onInvoiceUpdate({ status: 'sent', stripeInvoiceId: data.id, stripeInvoiceUrl: data.hostedUrl })
    } catch (error) {
      onInvoiceUpdate({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      })
    }
  }, [clientEmail, clientName, lineItems, daysUntilDue, onInvoiceUpdate])

  const handleMarkInvoiceSentExternally = useCallback(() => {
    onInvoiceUpdate({
      status: 'sent',
      stripeInvoiceId: null,
      stripeInvoiceUrl: externalInvoiceUrl || null,
    })
    setShowExternalInvoice(false)
  }, [externalInvoiceUrl, onInvoiceUpdate])

  const handlePaymentAlreadyReceived = useCallback(() => {
    onInvoiceUpdate({ status: 'paid', stripeInvoiceId: null, stripeInvoiceUrl: externalInvoiceUrl || null })
    setShowExternalInvoice(false)
  }, [externalInvoiceUrl, onInvoiceUpdate])

  // ---------------------------------------------------------------------------
  // Contract handlers
  // ---------------------------------------------------------------------------

  const handleSendContract = useCallback(async () => {
    if (!clientEmail || !contactName) return
    onContractUpdate({ status: 'creating', error: null })
    setContractReview(false)

    try {
      const res = await fetch('/api/admin/rabbitsign/create-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: contractTemplateId || undefined,
          companyName: clientName,
          contactName,
          contactEmail: clientEmail,
          setupFee: pricing.totalSetup,
          monthlyFee: pricing.totalRecurring,
          infraMonthly: pricing.infraMonthly,
          domainAnnualCost: pricing.domainCostAnnual,
          inboxMonthlyCost: pricing.inboxCostMonthly,
          packages: parsedData?.packages_selected || [],
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
      onContractUpdate({ status: 'sent', rabbitsignFolderId: data.folderId })
    } catch (error) {
      onContractUpdate({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create contract',
      })
    }
  }, [clientEmail, contactName, clientName, contractTemplateId, pricing, parsedData, deal, onContractUpdate])

  const handleContractAlreadySigned = useCallback(() => {
    onContractUpdate({ status: 'signed', rabbitsignFolderId: contractExternalUrl || 'external' })
    setShowExternalContract(false)
  }, [contractExternalUrl, onContractUpdate])

  const handleContractSentExternally = useCallback(() => {
    onContractUpdate({ status: 'sent', rabbitsignFolderId: contractExternalUrl || 'external' })
    setShowExternalContract(false)
  }, [contractExternalUrl, onContractUpdate])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* ── Stripe Invoice ─────────────────────────────────────────────────── */}
      <Card padding="sm">
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Stripe Invoice</h2>
          </div>

          {!clientEmail && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Client email required. Fill it in on the Review step first.
            </div>
          )}

          {/* Line items — always visible */}
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 space-y-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Sending to: {clientEmail || '—'}
            </p>
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-600 flex-1 mr-2">{item.name}</span>
                <span className="font-medium">{fmtCurrency(item.unitPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
              <span>Total due</span>
              <span>{fmtCurrency(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due in (days)</label>
            <input
              type="number" min={1} max={90}
              value={daysUntilDue}
              onChange={(e) => setDaysUntilDue(Number(e.target.value))}
              className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {/* ── Idle / Review ── */}
          {invoice.status === 'idle' && !invoiceReview && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setInvoiceReview(true)}
                disabled={!clientEmail}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Review & Send Invoice
              </button>

              {/* External / already-handled options */}
              <button
                type="button"
                onClick={() => setShowExternalInvoice(!showExternalInvoice)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 py-1"
              >
                Sent outside Cursive / already paid
                {showExternalInvoice ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showExternalInvoice && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
                  <p className="text-xs text-gray-500">Optional: paste the invoice URL for your records</p>
                  <input
                    type="url"
                    placeholder="https://mercury.com/invoice/... (optional)"
                    value={externalInvoiceUrl}
                    onChange={(e) => setExternalInvoiceUrl(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleMarkInvoiceSentExternally}
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Mark as Sent
                    </button>
                    <button
                      type="button"
                      onClick={handlePaymentAlreadyReceived}
                      className="flex-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Confirmation step ── */}
          {invoice.status === 'idle' && invoiceReview && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 space-y-3">
              <p className="text-sm font-semibold text-blue-900">Ready to send?</p>
              <p className="text-xs text-blue-700">
                This will create and email a <strong>{fmtCurrency(totalAmount)}</strong> Stripe invoice to{' '}
                <strong>{clientEmail}</strong>, due in {daysUntilDue} days. The email sends immediately.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceReview(false)}
                  className="flex-1 rounded-md border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleSendInvoice}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Send
                </button>
              </div>
            </div>
          )}

          {invoice.status === 'creating' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending invoice...
            </div>
          )}

          {invoice.status === 'sent' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Invoice sent{clientEmail ? ` to ${clientEmail}` : ''}
              </div>
              {invoice.stripeInvoiceUrl && (
                <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  View Invoice <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button type="button" onClick={() => onInvoiceUpdate({ status: 'idle' })}
                className="block text-xs text-gray-400 underline">Undo</button>
            </div>
          )}

          {invoice.status === 'paid' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Payment confirmed
              </div>
              {invoice.stripeInvoiceUrl && (
                <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  View Invoice <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button type="button" onClick={() => onInvoiceUpdate({ status: 'idle' })}
                className="block text-xs text-gray-400 underline">Undo</button>
            </div>
          )}

          {invoice.status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{invoice.error}</p>
              <button type="button" onClick={() => onInvoiceUpdate({ status: 'idle', error: null })}
                className="text-xs text-blue-600 underline">Retry</button>
            </div>
          )}
        </div>
      </Card>

      {/* ── RabbitSign Contract ────────────────────────────────────────────── */}
      <Card padding="sm">
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">RabbitSign Contract</h2>
          </div>

          {!clientEmail && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Client email and contact name required. Fill them in on the Review step first.
            </div>
          )}

          {/* Template selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Contract Template ID
              <span className="ml-1 font-normal text-gray-400">(from RabbitSign Templates page)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. tmpl_abc123"
              value={contractTemplateId}
              onChange={(e) => setContractTemplateId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono"
            />
            {!contractTemplateId && (
              <p className="text-[10px] text-amber-600 mt-1">
                No template ID — set RABBITSIGN_CONTRACT_TEMPLATE_ID in env or enter it above.
              </p>
            )}
          </div>

          {/* Recipient summary */}
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-700 text-[10px] uppercase tracking-wide mb-1">Sending to</p>
            <p className="font-medium text-gray-900">{contactName || '(name required)'}</p>
            <p>{clientEmail || '(email required)'}</p>
          </div>

          {/* ── Idle / Review ── */}
          {contract.status === 'idle' && !contractReview && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setContractReview(true)}
                disabled={!clientEmail || !contactName || !contractTemplateId}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Review Contract Fields
              </button>

              {/* External options */}
              <button
                type="button"
                onClick={() => setShowExternalContract(!showExternalContract)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 py-1"
              >
                Sent outside RabbitSign / already signed
                {showExternalContract ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showExternalContract && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
                  <p className="text-xs text-gray-500">Paste the contract URL for your records (optional)</p>
                  <input
                    type="url"
                    placeholder="https://... (optional)"
                    value={contractExternalUrl}
                    onChange={(e) => setContractExternalUrl(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleContractSentExternally}
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Mark as Sent
                    </button>
                    <button
                      type="button"
                      onClick={handleContractAlreadySigned}
                      className="flex-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      Mark as Signed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Contract field preview ── */}
          {contract.status === 'idle' && contractReview && (
            <div className="space-y-3">
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-3">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Fields that will be filled in the contract:
                </p>
                <div className="space-y-1">
                  {Object.entries(contractFields).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-xs">
                      <span className="text-blue-600 font-mono w-32 shrink-0">{key}</span>
                      <span className="text-blue-900 font-medium truncate">{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs text-amber-700">
                  <strong>Heads up:</strong> Clicking Confirm will immediately create the contract in RabbitSign
                  and email the signing request to <strong>{clientEmail}</strong>. There is no draft mode via the API.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContractReview(false)}
                  className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleSendContract}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Send
                </button>
              </div>
            </div>
          )}

          {contract.status === 'creating' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating contract...
            </div>
          )}

          {contract.status === 'sent' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Contract sent for signature
              </div>
              {contract.rabbitsignFolderId && contract.rabbitsignFolderId !== 'external' && (
                <a href={`https://www.rabbitsign.com/folder/${contract.rabbitsignFolderId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  View in RabbitSign <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button type="button" onClick={() => onContractUpdate({ status: 'idle', rabbitsignFolderId: null })}
                className="block text-xs text-gray-400 underline">Undo</button>
            </div>
          )}

          {contract.status === 'signed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Contract signed
              </div>
              {contract.rabbitsignFolderId && contract.rabbitsignFolderId !== 'external' && (
                <a href={contract.rabbitsignFolderId.startsWith('http')
                    ? contract.rabbitsignFolderId
                    : `https://www.rabbitsign.com/folder/${contract.rabbitsignFolderId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  View Contract <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button type="button" onClick={() => onContractUpdate({ status: 'idle', rabbitsignFolderId: null })}
                className="block text-xs text-gray-400 underline">Undo</button>
            </div>
          )}

          {contract.status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{contract.error}</p>
              <button type="button" onClick={() => onContractUpdate({ status: 'idle', error: null })}
                className="text-xs text-blue-600 underline">Retry</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
