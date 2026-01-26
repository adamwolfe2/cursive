'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
} from '@/components/ui/form'

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  ai_provider: z.enum(['openai', 'openrouter']),
  ai_model: z.string().min(1, 'Model is required'),
  tone: z.enum(['casual', 'professional', 'friendly', 'formal']),
  emailbison_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
})

type CreateAgentFormData = z.infer<typeof createAgentSchema>

const AI_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  openrouter: [
    { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet' },
  ],
}

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
]

export function NewAgentForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    mode: 'onBlur',
    defaultValues: {
      ai_provider: 'openai',
      ai_model: 'gpt-4o-mini',
      tone: 'professional',
    },
  })

  const selectedProvider = watch('ai_provider')

  const onSubmit = async (data: CreateAgentFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create agent')
      }

      const result = await response.json()
      router.push(`/agents/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create AI Agent"
        description="Set up a new AI agent to handle email responses"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Agents', href: '/agents' },
          { label: 'Create New' },
        ]}
      />

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Agent Name */}
          <FormField error={errors.name}>
            <FormLabel htmlFor="name" required>
              Agent Name
            </FormLabel>
            <FormInput
              id="name"
              type="text"
              placeholder="e.g., Sales Outreach Agent"
              disabled={loading}
              error={errors.name}
              {...register('name')}
            />
          </FormField>

          {/* AI Provider */}
          <FormField error={errors.ai_provider}>
            <FormLabel htmlFor="ai_provider" required>
              AI Provider
            </FormLabel>
            <FormSelect
              id="ai_provider"
              disabled={loading}
              error={errors.ai_provider}
              {...register('ai_provider')}
            >
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
            </FormSelect>
          </FormField>

          {/* AI Model */}
          <FormField error={errors.ai_model}>
            <FormLabel htmlFor="ai_model" required>
              AI Model
            </FormLabel>
            <FormSelect
              id="ai_model"
              disabled={loading}
              error={errors.ai_model}
              {...register('ai_model')}
            >
              {AI_MODELS[selectedProvider as keyof typeof AI_MODELS]?.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Tone */}
          <FormField error={errors.tone}>
            <FormLabel htmlFor="tone" required>
              Response Tone
            </FormLabel>
            <FormSelect
              id="tone"
              disabled={loading}
              error={errors.tone}
              {...register('tone')}
            >
              {TONES.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Email Bison API Key */}
          <FormField error={errors.emailbison_api_key}>
            <FormLabel
              htmlFor="emailbison_api_key"
              optional
              hint="Connect to Email Bison to send and receive emails"
            >
              Email Bison API Key
            </FormLabel>
            <FormInput
              id="emailbison_api_key"
              type="password"
              placeholder="Enter your Email Bison API key"
              disabled={loading}
              error={errors.emailbison_api_key}
              {...register('emailbison_api_key')}
            />
          </FormField>

          {/* OpenAI API Key */}
          <FormField error={errors.openai_api_key}>
            <FormLabel
              htmlFor="openai_api_key"
              optional
              hint="For AI-powered email responses (uses workspace default if not set)"
            >
              OpenAI API Key
            </FormLabel>
            <FormInput
              id="openai_api_key"
              type="password"
              placeholder="sk-..."
              disabled={loading}
              error={errors.openai_api_key}
              {...register('openai_api_key')}
            />
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
                <h4 className="text-sm font-medium text-foreground">
                  What happens next
                </h4>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Add instructions to guide the AI responses</li>
                    <li>Build a knowledge base with company info</li>
                    <li>Configure webhook to receive emails from Email Bison</li>
                    <li>Review and approve AI-generated responses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/agents')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  )
}
