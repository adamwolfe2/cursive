// Wizard State Hook
// Manages the unified onboarding wizard state with localStorage persistence

import { useState, useCallback, useEffect, useRef } from 'react'
import type { WizardState, DealState } from '@/types/onboarding-wizard'
import type { ParsedIntakeData, ContextFormat, TemplateData } from '@/types/onboarding-templates'
import type { InvoiceState, ContractState } from '@/types/onboarding-wizard'
import {
  WIZARD_VERSION,
  WIZARD_STORAGE_KEY,
  DEAL_CALCULATOR_HANDOFF_KEY,
  createInitialWizardState,
} from '@/types/onboarding-wizard'

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadDraft(): WizardState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WIZARD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WizardState
    if (parsed.version !== WIZARD_VERSION) return null // stale schema
    // Backfill fields added after initial schema — keeps old drafts usable
    if (parsed.deal.infraMonthlyOverride === undefined) {
      parsed.deal.infraMonthlyOverride = null
    }
    if (!parsed.deal.packagePriceOverrides) {
      parsed.deal.packagePriceOverrides = {}
    }
    if (parsed.deal.customTierDomains === undefined) {
      parsed.deal.customTierDomains = null
      parsed.deal.customTierInboxes = null
      parsed.deal.customTierEmailsPerMonth = null
    }
    return parsed
  } catch {
    return null
  }
}

function saveDraft(state: WizardState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable
  }
}

function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WIZARD_STORAGE_KEY)
}

function loadDealHandoff(): DealState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DEAL_CALCULATOR_HANDOFF_KEY)
    if (!raw) return null
    localStorage.removeItem(DEAL_CALCULATOR_HANDOFF_KEY) // consume once
    return JSON.parse(raw) as DealState
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface WizardActions {
  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  markStepComplete: (step: number) => void

  // Step 1: Deal
  updateDeal: <K extends keyof DealState>(key: K, value: DealState[K]) => void
  setDeal: (deal: DealState) => void

  // Step 2: Call notes
  setRawContext: (text: string) => void
  setContextFormat: (format: ContextFormat) => void
  setTemplateId: (id: string | null) => void
  setTemplateData: (data: TemplateData | null) => void
  setIsParsing: (parsing: boolean) => void

  // Step 3: Parsed data
  setParsedData: (data: ParsedIntakeData | null) => void
  updateParsedField: (field: string, value: unknown) => void

  // Step 4: Invoice & contract
  setInvoice: (invoice: Partial<InvoiceState>) => void
  setContract: (contract: Partial<ContractState>) => void

  // Step 5: Creation
  setCreationStatus: (status: WizardState['creationStatus'], error?: string) => void
  setClientId: (id: string) => void

  // Global
  reset: () => void
  clearSavedDraft: () => void
}

export interface UseWizardStateReturn {
  state: WizardState
  actions: WizardActions
  hasDraft: boolean
  resumeDraft: () => void
  startFresh: () => void
}

export function useWizardState(): UseWizardStateReturn {
  const [state, setState] = useState<WizardState>(createInitialWizardState)
  const [hasDraft, setHasDraft] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Only save after the user has explicitly chosen to resume or start fresh.
  // Prevents the empty initial state from overwriting the saved draft on mount.
  const canSaveRef = useRef(false)

  // Check for existing draft or deal calculator handoff on mount
  useEffect(() => {
    const draft = loadDraft()
    const handoff = loadDealHandoff()

    if (handoff) {
      // Deal calculator handed off — start at Step 2 with deal pre-loaded
      const initial = createInitialWizardState()
      setState({
        ...initial,
        deal: handoff,
        currentStep: 1,
        completedSteps: [0],
      })
      canSaveRef.current = true // handoff: safe to save immediately
    } else if (draft) {
      setHasDraft(true)
      // canSaveRef stays false — don't save until user picks resume/start fresh
    } else {
      canSaveRef.current = true // no draft: safe to save from the start
    }
    setInitialized(true)
  }, [])

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (!initialized || !canSaveRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveDraft({ ...state, lastModified: new Date().toISOString() })
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state, initialized])

  const resumeDraft = useCallback(() => {
    const draft = loadDraft()
    if (draft) {
      setState(draft)
      setHasDraft(false)
      canSaveRef.current = true // now safe to auto-save changes
    }
  }, [])

  const startFresh = useCallback(() => {
    clearDraft()
    setState(createInitialWizardState())
    setHasDraft(false)
    canSaveRef.current = true // now safe to auto-save new session
  }, [])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const actions: WizardActions = {
    goToStep: useCallback((step: number) => {
      setState((prev) => ({ ...prev, currentStep: step }))
    }, []),

    nextStep: useCallback(() => {
      setState((prev) => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, 4),
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      }))
    }, []),

    prevStep: useCallback(() => {
      setState((prev) => ({
        ...prev,
        currentStep: Math.max(prev.currentStep - 1, 0),
      }))
    }, []),

    markStepComplete: useCallback((step: number) => {
      setState((prev) => ({
        ...prev,
        completedSteps: prev.completedSteps.includes(step)
          ? prev.completedSteps
          : [...prev.completedSteps, step],
      }))
    }, []),

    updateDeal: useCallback(<K extends keyof DealState>(key: K, value: DealState[K]) => {
      setState((prev) => ({
        ...prev,
        deal: { ...prev.deal, [key]: value },
      }))
    }, []),

    setDeal: useCallback((deal: DealState) => {
      setState((prev) => ({ ...prev, deal }))
    }, []),

    setRawContext: useCallback((text: string) => {
      setState((prev) => ({ ...prev, rawContext: text }))
    }, []),

    setContextFormat: useCallback((format: ContextFormat) => {
      setState((prev) => ({ ...prev, contextFormat: format }))
    }, []),

    setTemplateId: useCallback((id: string | null) => {
      setState((prev) => ({ ...prev, selectedTemplateId: id }))
    }, []),

    setTemplateData: useCallback((data: TemplateData | null) => {
      setState((prev) => ({ ...prev, templateData: data }))
    }, []),

    setIsParsing: useCallback((parsing: boolean) => {
      setState((prev) => ({ ...prev, isParsing: parsing }))
    }, []),

    setParsedData: useCallback((data: ParsedIntakeData | null) => {
      setState((prev) => ({ ...prev, parsedData: data }))
    }, []),

    updateParsedField: useCallback((field: string, value: unknown) => {
      setState((prev) => {
        if (!prev.parsedData) return prev
        return {
          ...prev,
          parsedData: { ...prev.parsedData, [field]: value } as ParsedIntakeData,
        }
      })
    }, []),

    setInvoice: useCallback((invoice: Partial<InvoiceState>) => {
      setState((prev) => ({
        ...prev,
        invoice: { ...prev.invoice, ...invoice },
      }))
    }, []),

    setContract: useCallback((contract: Partial<ContractState>) => {
      setState((prev) => ({
        ...prev,
        contract: { ...prev.contract, ...contract },
      }))
    }, []),

    setCreationStatus: useCallback((status: WizardState['creationStatus'], error?: string) => {
      setState((prev) => ({
        ...prev,
        creationStatus: status,
        creationError: error ?? null,
      }))
    }, []),

    setClientId: useCallback((id: string) => {
      setState((prev) => ({ ...prev, clientId: id }))
    }, []),

    reset: useCallback(() => {
      clearDraft()
      setState(createInitialWizardState())
    }, []),

    clearSavedDraft: useCallback(() => {
      clearDraft()
    }, []),
  }

  return { state, actions, hasDraft, resumeDraft, startFresh }
}
