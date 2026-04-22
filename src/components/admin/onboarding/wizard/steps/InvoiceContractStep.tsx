'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import {
  CreditCard, FileSignature, Loader2, Check, ExternalLink,
  AlertTriangle, Eye, Send, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { ParsedIntakeData } from '@/types/onboarding-templates'
import type { DealState, InvoiceState, ContractState } from '@/types/onboarding-wizard'
import { calculateDealPricing, fmtCurrency } from '@/lib/utils/deal-pricing'
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
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})
  const [includeMonthlyFee, setIncludeMonthlyFee] = useState(false)
  const [recipientOverride, setRecipientOverride] = useState('')
  const [createSubscription, setCreateSubscription] = useState(true)
  const [trialDays, setTrialDays] = useState(14)

  // Contract state
  const [contractTemplateId, setContractTemplateId] = useState(
    process.env.NEXT_PUBLIC_RABBITSIGN_CONTRACT_TEMPLATE_ID || ''
  )
  const [contractReview, setContractReview] = useState(false)
  const [contractExternalUrl, setContractExternalUrl] = useState('')
  const [showExternalContract, setShowExternalContract] = useState(false)
  const [contractEmailOverride, setContractEmailOverride] = useState('')
  const [contractNameOverride, setContractNameOverride] = useState('')

  const pricing = useMemo(() => calculateDealPricing(deal), [deal])
  const clientEmail = parsedData?.primary_contact_email || ''
  const clientName = parsedData?.company_name || deal.clientName || ''
  const contactName = parsedData?.primary_contact_name || ''
  const sendToEmail = recipientOverride.trim() || clientEmail
  const isTestSend = !!recipientOverride.trim() && recipientOverride.trim() !== clientEmail

  const contractSendEmail = contractEmailOverride.trim() || clientEmail
  const contractSendName = contractNameOverride.trim() || (contractEmailOverride.trim() ? 'Test Recipient' : contactName)
  const isContractTest = !!contractEmailOverride.trim() && contractEmailOverride.trim() !== clientEmail

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

  const editableLineItems = useMemo(() => {
    const filtered = includeMonthlyFee
      ? lineItems
      : lineItems.filter((item) => !item.name.includes('Monthly Service Fee'))
    return filtered.map((item) => ({
      ...item,
      unitPrice: priceOverrides[item.name] ?? item.unitPrice,
    }))
  }, [lineItems, includeMonthlyFee, priceOverrides])

  const totalAmount = editableLineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  // Subscription line items — monthly service + infra that recur
  const subscriptionItems = useMemo(() => {
    const items: { name: string; amount: number }[] = []
    if (pricing.totalRecurring > 0) {
      items.push({
        name: `Cursive AI — Monthly Service (${clientName})`,
        amount: priceOverrides[`sub:service`] ?? pricing.totalRecurring,
      })
    }
    if (pricing.inboxCostMonthly > 0) {
      items.push({
        name: `Email Inboxes — ${pricing.inboxes} inboxes (monthly, at-cost)`,
        amount: priceOverrides[`sub:inboxes`] ?? pricing.inboxCostMonthly,
      })
    }
    return items
  }, [pricing, clientName, priceOverrides])

  const subscriptionMonthlyTotal = subscriptionItems.reduce((s, i) => s + i.amount, 0)

  // Subscription start date (for display)
  const subscriptionStartDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + trialDays)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [trialDays])

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
    if (!sendToEmail) return
    onInvoiceUpdate({ status: 'creating', error: null })
    setInvoiceReview(false)

    const customerName = isTestSend ? `TEST — ${clientName}` : clientName
    const memo = isTestSend
      ? `[TEST] Cursive AI services for ${clientName}`
      : `Cursive AI services for ${clientName}`

    try {
      if (createSubscription && subscriptionItems.length > 0) {
        // Combined invoice + subscription
        const res = await fetch('/api/admin/stripe/create-invoice-with-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: sendToEmail,
            customerName,
            invoiceLineItems: editableLineItems,
            daysUntilDue,
            memo,
            subscriptionItems,
            billingCadence: deal.billingCadence,
            trialDays,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed' }))
          throw new Error(err.error || 'Failed to create invoice + subscription')
        }
        const { data } = await res.json()
        onInvoiceUpdate({
          status: 'sent',
          stripeInvoiceId: data.invoice.id,
          stripeInvoiceUrl: data.invoice.hostedUrl,
          stripeSubscriptionId: data.subscription.id,
        })
      } else {
        // Invoice only
        const res = await fetch('/api/admin/stripe/create-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: sendToEmail,
            customerName,
            lineItems: editableLineItems,
            daysUntilDue,
            memo,
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
          stripeSubscriptionId: null,
        })
      }
    } catch (error) {
      onInvoiceUpdate({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      })
    }
  }, [
    sendToEmail, clientName, isTestSend, editableLineItems, daysUntilDue,
    createSubscription, subscriptionItems, deal.billingCadence, trialDays,
    onInvoiceUpdate,
  ])

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
    if (!contractSendEmail || !contractSendName) return
    onContractUpdate({ status: 'creating', error: null })
    setContractReview(false)

    try {
      const res = await fetch('/api/admin/rabbitsign/create-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: contractTemplateId || undefined,
          companyName: isContractTest ? `TEST — ${clientName}` : clientName,
          contactName: contractSendName,
          contactEmail: contractSendEmail,
          setupFee: pricing.totalSetup,
          monthlyFee: pricing.totalRecurring,
          infraMonthly: pricing.infraMonthly,
          domainAnnualCost: pricing.domainCostAnnual,
          inboxMonthlyCost: pricing.inboxCostMonthly,
          packages: parsedData?.packages_selected || [],
          billingCadence: deal.billingCadence,
          outboundTier: deal.outboundTierId,
          notes: isContractTest ? `[TEST SEND] ${deal.notes}` : deal.notes,
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
  }, [
    contractSendEmail, contractSendName, isContractTest, clientName,
    contractTemplateId, pricing, parsedData, deal, onContractUpdate,
  ])

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

          {/* Test recipient override */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Send to (override)
              <span className="ml-1 font-normal text-gray-400">— leave blank to send to client</span>
            </label>
            <input
              type="email"
              placeholder={clientEmail || 'your@email.com'}
              value={recipientOverride}
              onChange={(e) => setRecipientOverride(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400"
            />
            {isTestSend && (
              <p className="text-[10px] text-amber-600 mt-1">
                Test mode — invoice will be addressed to &ldquo;TEST — {clientName}&rdquo; and sent to {recipientOverride.trim()}
              </p>
            )}
          </div>

          {/* Line items — editable */}
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Sending to: {sendToEmail || '—'}{isTestSend ? ' (test)' : ''}
            </p>
            {editableLineItems.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 flex-1">{item.name}</span>
                <div className="relative w-24 shrink-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={priceOverrides[item.name] ?? item.unitPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setPriceOverrides((prev) => ({
                        ...prev,
                        [item.name]: isNaN(val) ? 0 : val,
                      }))
                    }}
                    className="w-full rounded border border-gray-300 pl-5 pr-1 py-0.5 text-xs text-right font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5 mt-1">
              <span>Total due</span>
              <span>{fmtCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Monthly fee toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeMonthlyFee}
              onChange={(e) => setIncludeMonthlyFee(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">Include first month&apos;s service fee on this invoice</span>
          </label>

          {/* Subscription */}
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createSubscription}
                onChange={(e) => setCreateSubscription(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">Start monthly subscription automatically</span>
            </label>

            {createSubscription && subscriptionItems.length > 0 && (
              <div className="space-y-2 pl-5">
                <div className="space-y-1">
                  {subscriptionItems.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 flex-1 truncate">{item.name}</span>
                      <div className="relative w-24 shrink-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={priceOverrides[`sub:${item.name.includes('Inboxes') ? 'inboxes' : 'service'}`] ?? item.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            const key = `sub:${item.name.includes('Inboxes') ? 'inboxes' : 'service'}`
                            setPriceOverrides((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }))
                          }}
                          className="w-full rounded border border-gray-300 pl-5 pr-1 py-0.5 text-xs text-right font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                        />
                      </div>
                      <span className="text-gray-400 text-[10px] w-8">/mo</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold text-gray-700 border-t border-gray-200 pt-1 mt-0.5">
                    <span>Total recurring</span>
                    <span>{fmtCurrency(subscriptionMonthlyTotal)}/mo</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 whitespace-nowrap">Subscription starts after</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-16 rounded border border-gray-300 px-2 py-0.5 text-xs text-center"
                  />
                  <span className="text-xs text-gray-600">days</span>
                </div>

                <p className="text-[10px] text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                  First charge of <strong>{fmtCurrency(subscriptionMonthlyTotal)}/mo</strong> on <strong>{subscriptionStartDate}</strong>. Renews {deal.billingCadence}.
                </p>
              </div>
            )}

            {createSubscription && subscriptionItems.length === 0 && (
              <p className="text-[11px] text-amber-600 pl-5">No recurring fees configured — set a monthly service fee in Deal Config.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due in (days)</label>
            <input
              type="number" min={1} max={90}
              value={daysUntilDue}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDaysUntilDue(v)
                setTrialDays(v)
              }}
              className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Subscription trial synced to invoice due date</p>
          </div>

          {/* ── Idle / Review ── */}
          {invoice.status === 'idle' && !invoiceReview && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setInvoiceReview(true)}
                disabled={!sendToEmail}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {isTestSend ? 'Review & Send Test Invoice' : 'Review & Send Invoice'}
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
            <div className={`rounded-md border px-4 py-3 space-y-3 ${isTestSend ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
              <p className={`text-sm font-semibold ${isTestSend ? 'text-amber-900' : 'text-blue-900'}`}>
                {isTestSend ? 'Send test invoice?' : 'Ready to send?'}
              </p>
              <p className={`text-xs ${isTestSend ? 'text-amber-700' : 'text-blue-700'}`}>
                {isTestSend
                  ? <>This will send a <strong>{fmtCurrency(totalAmount)}</strong> <strong>TEST</strong> invoice to <strong>{sendToEmail}</strong> (not the client). The customer name will be prefixed with &ldquo;TEST —&rdquo;.</>
                  : <>This will create and email a <strong>{fmtCurrency(totalAmount)}</strong> Stripe invoice to <strong>{sendToEmail}</strong>, due in {daysUntilDue} days.</>
                }
                {createSubscription && subscriptionItems.length > 0 && (
                  <> A <strong>{fmtCurrency(subscriptionMonthlyTotal)}/mo</strong> subscription will also be created and will start billing on <strong>{subscriptionStartDate}</strong>.</>
                )}
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
              {createSubscription ? 'Creating invoice + subscription...' : 'Sending invoice...'}
            </div>
          )}

          {invoice.status === 'sent' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="h-4 w-4" />
                Invoice sent{clientEmail ? ` to ${clientEmail}` : ''}
              </div>
              {invoice.stripeSubscriptionId && (
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <Check className="h-3.5 w-3.5" />
                  Subscription created — billing starts {subscriptionStartDate}
                </div>
              )}
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

          {/* Test recipient override */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Send to (override)
              <span className="ml-1 font-normal text-gray-400">— leave blank to send to client</span>
            </label>
            <input
              type="email"
              placeholder={clientEmail || 'your@email.com'}
              value={contractEmailOverride}
              onChange={(e) => setContractEmailOverride(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400"
            />
            {isContractTest && (
              <input
                type="text"
                placeholder="Signer name (e.g. Adam Wolfe)"
                value={contractNameOverride}
                onChange={(e) => setContractNameOverride(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm mt-1.5 placeholder:text-gray-400"
              />
            )}
            {isContractTest && (
              <p className="text-[10px] text-amber-600 mt-1">
                Test mode — signing request will go to {contractEmailOverride.trim()}, company shown as &ldquo;TEST — {clientName}&rdquo;
              </p>
            )}
          </div>

          {/* Recipient summary */}
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-700 text-[10px] uppercase tracking-wide mb-1">
              Signing request goes to{isContractTest ? ' (test)' : ''}
            </p>
            <p className="font-medium text-gray-900">{contractSendName || '(name required)'}</p>
            <p>{contractSendEmail || '(email required)'}</p>
          </div>

          {/* ── Idle / Review ── */}
          {contract.status === 'idle' && !contractReview && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setContractReview(true)}
                disabled={!contractSendEmail || !contractSendName || !contractTemplateId}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {isContractTest ? 'Review & Send Test Contract' : 'Review Contract Fields'}
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

              <div className={`rounded-md border px-3 py-2 ${isContractTest ? 'border-amber-300 bg-amber-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className="text-xs text-amber-700">
                  {isContractTest
                    ? <><strong>Test send:</strong> Signing request goes to <strong>{contractSendEmail}</strong> (not the client). Company will appear as &ldquo;TEST — {clientName}&rdquo; in the contract.</>
                    : <><strong>Heads up:</strong> Clicking Confirm will immediately create the contract in RabbitSign and email the signing request to <strong>{contractSendEmail}</strong>. There is no draft mode via the API.</>
                  }
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
