'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ContextInput from '@/components/admin/onboarding/intake/ContextInput'
import TemplatePicker from '@/components/admin/onboarding/intake/TemplatePicker'
import ParsedPreview from '@/components/admin/onboarding/intake/ParsedPreview'
import { createClientFromIntake } from './actions'
import type { OnboardingTemplate, ParsedIntakeData, ContextFormat, TemplateData } from '@/types/onboarding-templates'
import { ChevronDown } from 'lucide-react'

interface InternalIntakeFormProps {
  templates: OnboardingTemplate[]
}

export default function InternalIntakeForm({ templates }: InternalIntakeFormProps) {
  const router = useRouter()
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedIntakeData | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateData, setTemplateData] = useState<TemplateData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawInputCollapsed, setRawInputCollapsed] = useState(true)
  const [rawInputText, setRawInputText] = useState('')

  const handleTemplateSelect = useCallback(
    (data: TemplateData | null) => {
      const template = data
        ? templates.find((t) => JSON.stringify(t.template_data) === JSON.stringify(data))
        : null
      setSelectedTemplateId(template?.id ?? null)
      setTemplateData(data)
    },
    [templates]
  )

  const handleParse = useCallback(
    async (rawContext: string, format: ContextFormat) => {
      setIsParsing(true)
      setError(null)
      setRawInputText(rawContext)

      try {
        const response = await fetch('/api/onboarding/parse-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_context: rawContext,
            context_format: format,
            template_data: templateData ?? undefined,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        setParsedData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse context')
      } finally {
        setIsParsing(false)
      }
    },
    [templateData]
  )

  const handleDataChange = useCallback((updated: ParsedIntakeData) => {
    setParsedData(updated)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!parsedData) return
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createClientFromIntake(parsedData)

      if (!result.success) {
        setError(result.error || 'Failed to create client')
        return
      }

      router.push(`/admin/onboarding/${result.clientId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setIsSubmitting(false)
    }
  }, [parsedData, router])

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Input section (shown when no parsed data yet) */}
      {!parsedData && (
        <>
          <TemplatePicker
            templates={templates}
            onSelect={handleTemplateSelect}
            selectedId={selectedTemplateId}
          />
          <ContextInput onParse={handleParse} isParsing={isParsing} />
        </>
      )}

      {/* Parsed preview */}
      {parsedData && (
        <>
          <ParsedPreview
            data={parsedData}
            onChange={handleDataChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {/* Raw input reference (collapsible) */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <button
              type="button"
              onClick={() => setRawInputCollapsed(!rawInputCollapsed)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Raw Input
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  rawInputCollapsed ? '' : 'rotate-180'
                }`}
              />
            </button>
            {!rawInputCollapsed && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {rawInputText}
                </pre>
              </div>
            )}
          </div>

          {/* Re-parse button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setParsedData(null)
                setError(null)
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Start over with new context
            </button>
          </div>
        </>
      )}
    </div>
  )
}
