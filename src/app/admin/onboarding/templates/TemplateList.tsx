'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Star, Package } from 'lucide-react'
import type { OnboardingTemplate, OnboardingTemplateInsert, TemplateCategory } from '@/types/onboarding-templates'
import { TEMPLATE_CATEGORIES } from '@/types/onboarding-templates'
import { PACKAGES, type PackageSlug } from '@/types/onboarding'
import { createTemplate, updateTemplate, deleteTemplate } from './actions'

interface TemplateListProps {
  templates: OnboardingTemplate[]
}

// ---------------------------------------------------------------------------
// Template editor modal
// ---------------------------------------------------------------------------

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: OnboardingTemplate | null // null = create new
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !template

  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'Custom')
  const [isDefault, setIsDefault] = useState(template?.is_default || false)
  const [templateDataStr, setTemplateDataStr] = useState(
    JSON.stringify(template?.template_data || {}, null, 2)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)

    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(templateDataStr)
    } catch {
      setError('Invalid JSON in template data')
      setSaving(false)
      return
    }

    const input: OnboardingTemplateInsert = {
      name,
      description: description || null,
      category,
      is_default: isDefault,
      template_data: parsedData,
    }

    const result = isNew
      ? await createTemplate(input)
      : await updateTemplate(template.id, input)

    if (!result.success) {
      setError(result.error || 'Failed to save template')
      setSaving(false)
      return
    }

    onSaved()
    onClose()
  }, [name, description, category, isDefault, templateDataStr, isNew, template, onClose, onSaved])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? 'Create Template' : 'Edit Template'}
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Agency Owner (GHL)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown in template picker"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              >
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Featured template</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Data (JSON)
            </label>
            <textarea
              value={templateDataStr}
              onChange={(e) => setTemplateDataStr(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Valid fields: packages_selected, target_industries, target_titles, target_geography,
              pain_points, copy_tone, primary_cta, data_use_cases, primary_crm, etc.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main list
// ---------------------------------------------------------------------------

export default function TemplateList({ templates: initialTemplates }: TemplateListProps) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return
    setDeleting(id)
    await deleteTemplate(id)
    setDeleting(null)
    router.refresh()
  }, [router])

  const handleSaved = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setEditingTemplate('new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {initialTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialTemplates.map((template) => {
            const packages = (template.template_data?.packages_selected || []) as PackageSlug[]
            return (
              <div
                key={template.id}
                className="rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      )}
                      {template.category && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                          {template.category}
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    )}
                    {packages.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Package className="h-3 w-3 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {packages.map((pkg) => (
                            <span
                              key={pkg}
                              className="text-[10px] bg-blue-50 text-blue-700 rounded px-1.5 py-0.5"
                            >
                              {PACKAGES[pkg]?.label || pkg}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(template)}
                      className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title="Edit template"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      disabled={deleting === template.id}
                      className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor modal */}
      {editingTemplate !== null && (
        <TemplateEditor
          template={editingTemplate === 'new' ? null : editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
