// Unified Onboarding Wizard Types
// Combines deal calculator state + AI-parsed intake data + invoice/contract tracking

import type { ContextFormat, TemplateData, ParsedIntakeData } from './onboarding-templates'
import type { PackageSlug } from './onboarding'

// ---------------------------------------------------------------------------
// Deal configuration (from deal calculator)
// ---------------------------------------------------------------------------

export interface DealState {
  clientName: string
  outboundTierId: string | null
  selectedPackages: string[]
  selectedIcpSegments: string[]  // Multi-select ICP audience segments
  customDomains: number
  customInboxes: number
  useCustomInfra: boolean
  domainCostPer: number
  inboxCostPer: number
  setupFeeOverride: number | null
  recurringOverride: number | null
  billingCadence: 'monthly' | 'quarterly' | 'annual'
  notes: string
  // Per-service-package price overrides (key = package id, value = monthly price)
  packagePriceOverrides: Record<string, number>
  // Custom tier infrastructure spec (used when PricingConfigurator tier = 'custom')
  customTierDomains: number | null
  customTierInboxes: number | null
  customTierEmailsPerMonth: number | null
}

// ---------------------------------------------------------------------------
// Invoice & contract tracking
// ---------------------------------------------------------------------------

export interface InvoiceState {
  status: 'idle' | 'creating' | 'sent' | 'paid' | 'error'
  stripeInvoiceId: string | null
  stripeInvoiceUrl: string | null
  error: string | null
}

export interface ContractState {
  status: 'idle' | 'creating' | 'sent' | 'signed' | 'error'
  rabbitsignFolderId: string | null
  error: string | null
}

// ---------------------------------------------------------------------------
// Full wizard state
// ---------------------------------------------------------------------------

export interface WizardState {
  version: number // for localStorage schema migration
  currentStep: number
  completedSteps: number[]
  lastModified: string

  // Step 1: Deal configuration
  deal: DealState

  // Step 2: Call notes / AI parsing
  rawContext: string
  contextFormat: ContextFormat
  selectedTemplateId: string | null
  templateData: TemplateData | null
  isParsing: boolean

  // Step 3: Parsed + merged client data
  parsedData: ParsedIntakeData | null

  // Step 4: Invoice & contract
  invoice: InvoiceState
  contract: ContractState

  // Step 5: Creation
  creationStatus: 'idle' | 'creating' | 'complete' | 'error'
  creationError: string | null
  clientId: string | null
}

export const WIZARD_VERSION = 1

export const WIZARD_STEPS = [
  { id: 'deal', label: 'Configure Deal', shortLabel: 'Deal' },
  { id: 'notes', label: 'Call Notes', shortLabel: 'Notes' },
  { id: 'review', label: 'Review & Complete', shortLabel: 'Review' },
  { id: 'invoice', label: 'Invoice & Contract', shortLabel: 'Invoice' },
  { id: 'create', label: 'Create Client', shortLabel: 'Create' },
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

// ---------------------------------------------------------------------------
// Deal pricing result (computed from DealState)
// ---------------------------------------------------------------------------

export interface DealPricing {
  outboundSetup: number
  packageSetup: number
  totalSetup: number
  outboundMonthly: number
  packageMonthly: number
  discountRate: number
  discountAmount: number
  subtotalMonthly: number
  totalRecurring: number
  infraMonthly: number
  totalMonthlyClientPays: number
  cadenceMultiplier: number
  cadenceLabel: string
  cadencePayment: number
  annualServiceCost: number
  annualInfraCost: number
  annualTotal: number
  firstYearTotal: number
  domainUpfront: number
  domains: number
  inboxes: number
  domainCostMonthly: number
  inboxCostMonthly: number
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function createInitialWizardState(): WizardState {
  return {
    version: WIZARD_VERSION,
    currentStep: 0,
    completedSteps: [],
    lastModified: new Date().toISOString(),

    deal: {
      clientName: '',
      outboundTierId: null,
      selectedPackages: [],
      selectedIcpSegments: [],
      customDomains: 0,
      customInboxes: 0,
      useCustomInfra: false,
      domainCostPer: 12,
      inboxCostPer: 7,
      setupFeeOverride: null,
      recurringOverride: null,
      billingCadence: 'monthly',
      notes: '',
      packagePriceOverrides: {},
      customTierDomains: null,
      customTierInboxes: null,
      customTierEmailsPerMonth: null,
    },

    rawContext: '',
    contextFormat: 'mixed',
    selectedTemplateId: null,
    templateData: null,
    isParsing: false,

    parsedData: null,

    invoice: {
      status: 'idle',
      stripeInvoiceId: null,
      stripeInvoiceUrl: null,
      error: null,
    },

    contract: {
      status: 'idle',
      rabbitsignFolderId: null,
      error: null,
    },

    creationStatus: 'idle',
    creationError: null,
    clientId: null,
  }
}

// ---------------------------------------------------------------------------
// localStorage key
// ---------------------------------------------------------------------------

export const WIZARD_STORAGE_KEY = 'cursive_onboarding_wizard_draft'
export const DEAL_CALCULATOR_HANDOFF_KEY = 'cursive_deal_calculator_handoff'
