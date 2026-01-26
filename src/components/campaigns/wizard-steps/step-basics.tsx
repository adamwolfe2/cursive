'use client'

import { useEffect, useState } from 'react'
import { FormField, FormLabel, FormInput, FormSelect, FormTextarea } from '@/components/ui/form'
import type { CampaignFormData } from '../campaign-wizard'

interface Agent {
  id: string
  name: string
}

interface StepBasicsProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepBasics({ formData, updateFormData }: StepBasicsProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/agents')
        if (response.ok) {
          const result = await response.json()
          setAgents(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setLoadingAgents(false)
      }
    }
    fetchAgents()
  }, [])

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <FormField>
        <FormLabel htmlFor="name" required>
          Campaign Name
        </FormLabel>
        <FormInput
          id="name"
          type="text"
          placeholder="e.g., Q1 Enterprise Outreach"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          A descriptive name to identify this campaign
        </p>
      </FormField>

      {/* Description */}
      <FormField>
        <FormLabel htmlFor="description">Description</FormLabel>
        <FormTextarea
          id="description"
          placeholder="Describe the goals and context of this campaign..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={3}
        />
      </FormField>

      {/* AI Agent Selection */}
      <FormField>
        <FormLabel htmlFor="agent_id">AI Agent (Optional)</FormLabel>
        <FormSelect
          id="agent_id"
          value={formData.agent_id || ''}
          onChange={(e) => updateFormData({ agent_id: e.target.value || undefined })}
          disabled={loadingAgents}
        >
          <option value="">No agent (manual replies only)</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </FormSelect>
        <p className="mt-1 text-xs text-muted-foreground">
          Select an AI agent to help draft responses to replies
        </p>
      </FormField>

      {/* Info Box */}
      <div className="rounded-lg bg-muted p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-muted-foreground"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-foreground">About Campaigns</h4>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Campaigns organize your cold email outreach. Each campaign can target
                specific audiences with tailored messaging and track performance metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
