'use client'

import { useEffect, useState } from 'react'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FormField, FormLabel, FormSelect } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '@/components/ui/modal'
import { useToast } from '@/lib/hooks/use-toast'

interface Template {
  id: string
  name: string
  subject: string
  body_html: string
  body_text: string
  tone: string
  structure: string
  cta_type: string
  target_seniority: string[]
  company_types: string[]
  variables: string[]
  source: string
  open_rate: number | null
  click_rate: number | null
  reply_rate: number | null
  created_at: string
}

const TONES = ['informal', 'formal', 'energetic', 'humble']
const STRUCTURES = ['problem_solution', 'value_prop_first', 'social_proof', 'question_based']
const CTA_TYPES = ['demo_request', 'meeting_request', 'free_trial', 'open_question', 'send_resource']
const SENIORITIES = ['c_level', 'vp', 'director', 'manager']

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  first_name: 'Alex',
  last_name: 'Johnson',
  company_name: 'TechCorp Inc.',
  job_title: 'VP of Engineering',
  industry: 'Technology',
  pain_point: 'scaling your engineering team',
  social_proof_company: 'Acme Corp',
  metric_area: 'development time',
  metric_value: '40%',
  sender_name: 'John Smith',
  sender_title: 'Account Executive',
  benefit_1: 'Reduce manual work by 60%',
  benefit_2: 'Improve team productivity',
  benefit_3: 'Scale without hiring',
  topic: 'AI automation',
  timeframe: '30 days',
}

export function TemplateBrowser() {
  const toast = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    tone: '',
    structure: '',
    cta_type: '',
    seniority: '',
  })

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [duplicating, setDuplicating] = useState(false)

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const params = new URLSearchParams()
        if (filters.tone) params.set('tone', filters.tone)
        if (filters.structure) params.set('structure', filters.structure)
        if (filters.cta_type) params.set('cta_type', filters.cta_type)
        if (filters.seniority) params.set('target_seniority', filters.seniority)

        const response = await fetch(`/api/templates?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [filters])

  // Filter by search query
  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.subject.toLowerCase().includes(query) ||
      template.body_text.toLowerCase().includes(query)
    )
  })

  // Replace variables with sample data
  const renderWithSampleData = (text: string) => {
    let result = text
    for (const [key, value] of Object.entries(SAMPLE_DATA)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    // Replace any remaining variables with placeholders
    result = result.replace(/\{\{(\w+)\}\}/g, '[$1]')
    return result
  }

  // Duplicate template
  const handleDuplicate = async () => {
    if (!previewTemplate) return

    setDuplicating(true)
    try {
      const response = await fetch(`/api/templates/${previewTemplate.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${previewTemplate.name} (Copy)`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates((prev) => [data.data, ...prev])
        toast.success('Template duplicated successfully!')
        setPreviewTemplate(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to duplicate template')
      }
    } catch (error) {
      toast.error('Failed to duplicate template')
    } finally {
      setDuplicating(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      tone: '',
      structure: '',
      cta_type: '',
      seniority: '',
    })
    setSearchQuery('')
  }

  const hasActiveFilters = filters.tone || filters.structure || filters.cta_type || filters.seniority || searchQuery

  return (
    <PageContainer>
      <PageHeader
        title="Email Templates"
        description="Browse and manage email templates for your campaigns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Templates' },
        ]}
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <FormField>
            <FormSelect
              value={filters.tone}
              onChange={(e) => setFilters({ ...filters, tone: e.target.value })}
            >
              <option value="">All Tones</option>
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField>
            <FormSelect
              value={filters.structure}
              onChange={(e) => setFilters({ ...filters, structure: e.target.value })}
            >
              <option value="">All Structures</option>
              {STRUCTURES.map((structure) => (
                <option key={structure} value={structure}>
                  {structure.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField>
            <FormSelect
              value={filters.cta_type}
              onChange={(e) => setFilters({ ...filters, cta_type: e.target.value })}
            >
              <option value="">All CTAs</option>
              {CTA_TYPES.map((cta) => (
                <option key={cta} value={cta}>
                  {cta.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField>
            <FormSelect
              value={filters.seniority}
              onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
            >
              <option value="">All Seniorities</option>
              {SENIORITIES.map((seniority) => (
                <option key={seniority} value={seniority}>
                  {seniority.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTemplates.length} of {templates.length} templates
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          title="No templates found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search query.'
              : 'No templates have been created yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setPreviewTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-foreground text-sm truncate pr-2">
                  {template.name}
                </h3>
                {template.source === 'sales_co' && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Sales.co
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {template.subject}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                <Badge variant="outline" className="text-xs">
                  {template.tone}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.structure.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.cta_type.replace(/_/g, ' ')}
                </Badge>
              </div>

              {(template.open_rate || template.reply_rate) && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {template.open_rate && (
                    <span>{(template.open_rate * 100).toFixed(0)}% opens</span>
                  )}
                  {template.reply_rate && (
                    <span>{(template.reply_rate * 100).toFixed(0)}% replies</span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        className="max-w-2xl"
      >
        {previewTemplate && (
          <>
            <ModalHeader onClose={() => setPreviewTemplate(null)}>
              <ModalTitle>{previewTemplate.name}</ModalTitle>
              <ModalDescription>
                Preview this template with sample data
              </ModalDescription>
            </ModalHeader>
            <ModalContent>
              {/* Template Metadata */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{previewTemplate.tone}</Badge>
                <Badge variant="outline">{previewTemplate.structure.replace(/_/g, ' ')}</Badge>
                <Badge variant="outline">{previewTemplate.cta_type.replace(/_/g, ' ')}</Badge>
                {previewTemplate.target_seniority?.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>

              {/* Email Preview */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground">Subject:</p>
                  <p className="text-sm font-medium text-foreground">
                    {renderWithSampleData(previewTemplate.subject)}
                  </p>
                </div>
                <div className="p-4 bg-background">
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: renderWithSampleData(previewTemplate.body_html),
                    }}
                  />
                </div>
              </div>

              {/* Variables Used */}
              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Variables used:</p>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.variables.map((v) => (
                      <code
                        key={v}
                        className="text-xs px-1.5 py-0.5 bg-muted rounded"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button
                onClick={handleDuplicate}
                loading={duplicating}
                disabled={duplicating}
              >
                Duplicate Template
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </PageContainer>
  )
}
