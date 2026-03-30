// Stripe Invoice Client for Onboarding Deals
// Creates and sends Stripe invoices from deal calculator pricing

import { getStripeClient } from '@/lib/stripe/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvoiceLineItem {
  name: string
  quantity: number
  unitPrice: number // in dollars (converted to cents for Stripe)
}

interface CreateInvoiceParams {
  customerEmail: string
  customerName: string
  lineItems: InvoiceLineItem[]
  daysUntilDue?: number // default 14
  memo?: string
  sendEmail: boolean
  metadata?: Record<string, string>
}

export interface StripeInvoiceResult {
  id: string
  hostedUrl: string | null
  status: string
  amountDue: number // in cents
  currency: string
}

// ---------------------------------------------------------------------------
// Invoice Creation
// ---------------------------------------------------------------------------

/**
 * Create a Stripe invoice for a client deal.
 * Creates or finds a Stripe customer, adds line items, and optionally sends.
 */
export async function createDealInvoice(params: CreateInvoiceParams): Promise<StripeInvoiceResult> {
  const stripe = getStripeClient()

  // Find or create customer by email
  const existingCustomers = await stripe.customers.list({
    email: params.customerEmail,
    limit: 1,
  })

  let customerId: string
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id
  } else {
    const customer = await stripe.customers.create({
      email: params.customerEmail,
      name: params.customerName,
      metadata: params.metadata || {},
    })
    customerId = customer.id
  }

  // Create invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: params.daysUntilDue ?? 14,
    description: params.memo || `Cursive AI — Services for ${params.customerName}`,
    metadata: {
      source: 'deal_calculator',
      ...params.metadata,
    },
  })

  // Add line items
  for (const item of params.lineItems) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      description: item.name,
      quantity: item.quantity,
      unit_amount: Math.round(item.unitPrice * 100), // dollars → cents
      currency: 'usd',
    })
  }

  // Finalize the invoice
  const finalized = await stripe.invoices.finalizeInvoice(invoice.id)

  // Send if requested
  if (params.sendEmail) {
    await stripe.invoices.sendInvoice(invoice.id)
  }

  return {
    id: finalized.id,
    hostedUrl: finalized.hosted_invoice_url ?? null,
    status: finalized.status || 'draft',
    amountDue: finalized.amount_due,
    currency: finalized.currency,
  }
}

/**
 * Get invoice status
 */
export async function getInvoiceStatus(invoiceId: string): Promise<StripeInvoiceResult> {
  const stripe = getStripeClient()
  const invoice = await stripe.invoices.retrieve(invoiceId)

  return {
    id: invoice.id,
    hostedUrl: invoice.hosted_invoice_url ?? null,
    status: invoice.status || 'unknown',
    amountDue: invoice.amount_due,
    currency: invoice.currency,
  }
}

/**
 * Build Stripe invoice line items from deal configuration.
 * Domains are billed annually (one-time on first invoice); inboxes are monthly.
 */
export function buildInvoiceLineItems(params: {
  setupFee: number
  monthlyService: number
  clientName: string
  domains: number
  inboxes: number
  domainAnnualCost: number   // total annual cost for all domains (e.g. $401.81/yr)
  inboxMonthlyCost: number   // total monthly cost for all inboxes (e.g. $288/mo)
}): InvoiceLineItem[] {
  const { setupFee, monthlyService, clientName, domains, inboxes, domainAnnualCost, inboxMonthlyCost } = params
  const items: InvoiceLineItem[] = []

  if (setupFee > 0) {
    items.push({
      name: `Cursive AI — One-Time Setup Fee (${clientName})`,
      quantity: 1,
      unitPrice: setupFee,
    })
  }

  if (monthlyService > 0) {
    items.push({
      name: `Cursive AI — Monthly Service Fee (${clientName})`,
      quantity: 1,
      unitPrice: monthlyService,
    })
  }

  if (domainAnnualCost > 0) {
    items.push({
      name: `Sending Domains — ${domains} domains (annual, at-cost)`,
      quantity: 1,
      unitPrice: Math.round(domainAnnualCost * 100) / 100,
    })
  }

  if (inboxMonthlyCost > 0) {
    items.push({
      name: `Email Inboxes — ${inboxes} inboxes (monthly, at-cost)`,
      quantity: 1,
      unitPrice: Math.round(inboxMonthlyCost * 100) / 100,
    })
  }

  return items
}
