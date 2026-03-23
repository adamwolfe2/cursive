'use client'

import { useState } from 'react'
import { Layout, ChevronDown } from 'lucide-react'
import type { OnboardingTemplate, TemplateData } from '@/types/onboarding-templates'

interface TemplatePickerProps {
  templates: OnboardingTemplate[]
  onSelect: (templateData: TemplateData | null) => void
  selectedId: string | null
}

export default function TemplatePicker({
  templates,
  onSelect,
  selectedId,
}: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  const handleSelect = (template: OnboardingTemplate | null) => {
    onSelect(template?.template_data ?? null)
    setIsOpen(false)
  }

  if (templates.length === 0) return null

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Start from template (optional)
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-gray-400" />
          <span className={selectedTemplate ? 'text-gray-900' : 'text-gray-400'}>
            {selectedTemplate ? selectedTemplate.name : 'No template — start blank'}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 ${
              !selectedId ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
            }`}
          >
            No template — start blank
          </button>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template)}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                selectedId === template.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    selectedId === template.id ? 'text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {template.name}
                </span>
                {template.category && (
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                    {template.category}
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
