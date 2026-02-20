'use client'

import { useEffect, useState } from 'react'
import { safeError } from '@/lib/utils/log-sanitizer'
import { FormField, FormLabel, FormInput, FormTextarea } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CampaignFormData } from '../campaign-wizard'

interface ClientProfile {
  id: string
  company_name: string
  value_propositions: Array<{
    id: string
    name: string
    description: string
    target_segments?: string[]
  }>
  trust_signals: Array<{
    id: string
    type: string
    content: string
    title?: string
  }>
}

interface StepValuePropsProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepValueProps({ formData, updateFormData }: StepValuePropsProps) {
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddValueProp, setShowAddValueProp] = useState(false)
  const [showAddTrustSignal, setShowAddTrustSignal] = useState(false)
  const [newValueProp, setNewValueProp] = useState({ name: '', description: '' })
  const [newTrustSignal, setNewTrustSignal] = useState({ type: 'metric', content: '' })

  useEffect(() => {
    async function fetchClientProfile() {
      try {
        const response = await fetch('/api/client-profiles')
        if (response.ok) {
          const result = await response.json()
          if (result.data && result.data.length > 0) {
            setClientProfile(result.data[0])
          }
        }
      } catch (error) {
        safeError('[StepValueProps]', 'Failed to fetch client profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClientProfile()
  }, [])

  const importFromProfile = (type: 'value_propositions' | 'trust_signals') => {
    if (!clientProfile) return

    if (type === 'value_propositions' && clientProfile.value_propositions) {
      updateFormData({
        value_propositions: clientProfile.value_propositions.map((vp) => ({
          id: vp.id,
          name: vp.name,
          description: vp.description,
          target_segments: vp.target_segments,
        })),
      })
    } else if (type === 'trust_signals' && clientProfile.trust_signals) {
      updateFormData({
        trust_signals: clientProfile.trust_signals.map((ts) => ({
          id: ts.id,
          type: ts.type,
          content: ts.content,
        })),
      })
    }
  }

  const addValueProp = () => {
    if (!newValueProp.name || !newValueProp.description) return

    const newItem = {
      id: `vp-${Date.now()}`,
      name: newValueProp.name,
      description: newValueProp.description,
      target_segments: [],
    }

    updateFormData({
      value_propositions: [...formData.value_propositions, newItem],
    })

    setNewValueProp({ name: '', description: '' })
    setShowAddValueProp(false)
  }

  const removeValueProp = (id: string) => {
    updateFormData({
      value_propositions: formData.value_propositions.filter((vp) => vp.id !== id),
    })
  }

  const addTrustSignal = () => {
    if (!newTrustSignal.content) return

    const newItem = {
      id: `ts-${Date.now()}`,
      type: newTrustSignal.type,
      content: newTrustSignal.content,
    }

    updateFormData({
      trust_signals: [...formData.trust_signals, newItem],
    })

    setNewTrustSignal({ type: 'metric', content: '' })
    setShowAddTrustSignal(false)
  }

  const removeTrustSignal = (id: string) => {
    updateFormData({
      trust_signals: formData.trust_signals.filter((ts) => ts.id !== id),
    })
  }

  return (
    <div className="space-y-8">
      {/* Value Propositions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Value Propositions</h3>
            <p className="text-xs text-muted-foreground">
              Key benefits and value you offer to prospects
            </p>
          </div>
          <div className="flex gap-2">
            {clientProfile && clientProfile.value_propositions?.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => importFromProfile('value_propositions')}
              >
                Import from Profile
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddValueProp(true)}
            >
              Add Custom
            </Button>
          </div>
        </div>

        {showAddValueProp && (
          <Card className="p-4 mb-4 border-dashed">
            <div className="space-y-3">
              <FormField>
                <FormLabel htmlFor="vp-name">Name</FormLabel>
                <FormInput
                  id="vp-name"
                  placeholder="e.g., Cost Reduction"
                  value={newValueProp.name}
                  onChange={(e) => setNewValueProp({ ...newValueProp, name: e.target.value })}
                />
              </FormField>
              <FormField>
                <FormLabel htmlFor="vp-desc">Description</FormLabel>
                <FormTextarea
                  id="vp-desc"
                  placeholder="Describe how this benefits the prospect..."
                  value={newValueProp.description}
                  onChange={(e) => setNewValueProp({ ...newValueProp, description: e.target.value })}
                  rows={2}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddValueProp(false)}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={addValueProp}>
                  Add
                </Button>
              </div>
            </div>
          </Card>
        )}

        {formData.value_propositions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <svg className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-medium text-foreground mb-1">No value propositions added yet</p>
            <p className="text-xs text-muted-foreground">
              Import from your client profile or add custom ones. Value props help the AI craft personalized outreach.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {formData.value_propositions.map((vp) => (
              <div
                key={vp.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{vp.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{vp.description}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeValueProp(vp.id)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Signals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Trust Signals</h3>
            <p className="text-xs text-muted-foreground">
              Social proof, metrics, and credibility indicators
            </p>
          </div>
          <div className="flex gap-2">
            {clientProfile && clientProfile.trust_signals?.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => importFromProfile('trust_signals')}
              >
                Import from Profile
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddTrustSignal(true)}
            >
              Add Custom
            </Button>
          </div>
        </div>

        {showAddTrustSignal && (
          <Card className="p-4 mb-4 border-dashed">
            <div className="space-y-3">
              <FormField>
                <FormLabel htmlFor="ts-type">Type</FormLabel>
                <select
                  id="ts-type"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={newTrustSignal.type}
                  onChange={(e) => setNewTrustSignal({ ...newTrustSignal, type: e.target.value })}
                >
                  <option value="metric">Metric</option>
                  <option value="case_study">Case Study</option>
                  <option value="testimonial">Testimonial</option>
                  <option value="logo">Logo/Client</option>
                </select>
              </FormField>
              <FormField>
                <FormLabel htmlFor="ts-content">Content</FormLabel>
                <FormTextarea
                  id="ts-content"
                  placeholder="e.g., Helped 500+ companies reduce costs by 40%"
                  value={newTrustSignal.content}
                  onChange={(e) => setNewTrustSignal({ ...newTrustSignal, content: e.target.value })}
                  rows={2}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTrustSignal(false)}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={addTrustSignal}>
                  Add
                </Button>
              </div>
            </div>
          </Card>
        )}

        {formData.trust_signals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <svg className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm font-medium text-foreground mb-1">No trust signals added yet</p>
            <p className="text-xs text-muted-foreground">
              Import from your client profile or add custom ones. Trust signals build credibility in your outreach.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {formData.trust_signals.map((ts) => (
              <div
                key={ts.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary mb-1">
                    {ts.type.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-foreground">{ts.content}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeTrustSignal(ts.id)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading client profile...</p>
      )}
    </div>
  )
}
