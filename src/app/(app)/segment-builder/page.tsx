'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Filter, Library, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PREVIEW_TIMEOUT_MS, BULK_OPERATION_TIMEOUT_MS } from '@/lib/constants/timeouts'
import { UpgradeModal } from '@/components/marketplace/UpgradeModal'
import { useUpgradeModal } from '@/lib/hooks/use-upgrade-modal'

import { FilterRule, Segment, CatalogSegment } from './types'
import { SegmentRuleEditor } from './SegmentRuleEditor'
import { SegmentPreview } from './SegmentPreview'
import { SegmentCatalog } from './SegmentCatalog'
import { SavedSegments } from './SavedSegments'

// ---------------------------------------------------------------------------
// Preset segments
// ---------------------------------------------------------------------------

interface PresetSegment {
  name: string
  description: string
  filters: FilterRule[]
}

function makeId() {
  return Math.random().toString(36).substr(2, 9)
}

const PRESET_SEGMENTS: PresetSegment[] = [
  {
    name: 'Decision Makers at SMBs',
    description: 'VP/Director/Head/CEO titles at companies with 10–200 employees',
    filters: [
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'VP' },
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'Director' },
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'Head' },
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'CEO' },
      { id: makeId(), field: 'company_size', operator: 'equals', value: '11-50' },
      { id: makeId(), field: 'company_size', operator: 'equals', value: '51-200' },
    ],
  },
  {
    name: 'SaaS VP+ Leaders',
    description: 'VP/Chief/CTO/CMO in the Software industry',
    filters: [
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'VP' },
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'CTO' },
      { id: makeId(), field: 'job_title', operator: 'equals', value: 'CMO' },
      { id: makeId(), field: 'seniority', operator: 'equals', value: 'C-Level' },
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Technology' },
    ],
  },
  {
    name: 'Local Service Businesses',
    description: 'Construction, healthcare, and local service industries',
    filters: [
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Construction' },
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Healthcare' },
    ],
  },
  {
    name: 'E-commerce Brands',
    description: 'Retail and e-commerce industry',
    filters: [
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Retail' },
    ],
  },
  {
    name: 'Professional Services',
    description: 'Legal, accounting, and consulting firms',
    filters: [
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Professional Services' },
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Finance' },
    ],
  },
  {
    name: 'Manufacturing & Industrial',
    description: 'Manufacturing industry',
    filters: [
      { id: makeId(), field: 'industry', operator: 'equals', value: 'Manufacturing' },
    ],
  },
]

function filtersToApiFormat(filters: FilterRule[]): Record<string, any> {
  const apiFilters: Record<string, any> = {}
  const fieldMap: Record<string, string> = {
    industry: 'industries',
    state: 'states',
    company_size: 'company_sizes',
    job_title: 'job_titles',
    seniority: 'seniority_levels',
  }
  filters.forEach((filter) => {
    if (filter.value) {
      const apiField = fieldMap[filter.field]
      if (!apiFilters[apiField]) apiFilters[apiField] = []
      if (Array.isArray(filter.value)) {
        apiFilters[apiField].push(...filter.value)
      } else {
        apiFilters[apiField].push(filter.value)
      }
    }
  })
  return apiFilters
}

export default function SegmentBuilderPage() {
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [segmentName, setSegmentName] = useState('')
  const [segmentDescription, setSegmentDescription] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null)
  const [runningSegmentId, setRunningSegmentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('builder')

  // Ref to track the in-flight preview AbortController so we can cancel it
  const previewControllerRef = useRef<AbortController | null>(null)

  // Abort any pending preview request when the component unmounts
  useEffect(() => {
    return () => {
      previewControllerRef.current?.abort()
    }
  }, [])

  // Catalog state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogType, setCatalogType] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleCatalogSearchChange = useCallback((value: string) => {
    setCatalogSearch(value)
    if (debounceRef[0]) clearTimeout(debounceRef[0])
    debounceRef[1](setTimeout(() => {
      setDebouncedSearch(value)
      setCatalogPage(1)
    }, 350))
  }, [debounceRef])

  const queryClient = useQueryClient()

  // Upgrade modal — shown when 402 / insufficient_credits is returned
  const { isOpen: upgradeModalOpen, trigger: upgradeTrigger, context: upgradeContext, showUpgradeModal, closeModal: closeUpgradeModal } = useUpgradeModal()

  // Fetch saved segments
  const { data: segmentsData, isLoading: segmentsLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await fetch('/api/segments')
      if (!response.ok) throw new Error('Failed to fetch segments')
      return response.json()
    },
  })

  const savedSegments = segmentsData?.segments || []

  // Catalog query
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['segment-catalog', debouncedSearch, catalogType, catalogCategory, catalogPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(catalogPage), per_page: '24' })
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (catalogType) params.set('type', catalogType)
      if (catalogCategory) params.set('category', catalogCategory)
      const res = await fetch(`/api/segments/catalog?${params}`)
      if (!res.ok) throw new Error('Failed to fetch catalog')
      return res.json()
    },
    enabled: activeTab === 'catalog',
    staleTime: 60_000,
  })

  const catalogSegments: CatalogSegment[] = catalogData?.segments ?? []
  const catalogTotal: number = catalogData?.total ?? 0
  const catalogTotalPages: number = catalogData?.total_pages ?? 1
  const catalogCategories: string[] = catalogData?.categories ?? []

  const handleUseCatalogSegment = (seg: CatalogSegment) => {
    const newFilter: FilterRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: 'industry',
      operator: 'equals',
      value: seg.category,
    }
    setFilters((prev) => {
      const already = prev.some((f) => f.field === 'industry' && f.value === seg.category)
      return already ? prev : [...prev, newFilter]
    })
    setSegmentName(seg.name)
    setSegmentDescription(seg.description ?? seg.sub_category ?? '')
    setActiveTab('builder')
    toast.success(`Loaded "${seg.name}" into builder`)
  }

  // Save segment mutation
  const saveSegmentMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; filters: Record<string, any> }) => {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save segment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment saved successfully!')
      setSegmentName('')
      setSegmentDescription('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete segment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: 'industry',
      operator: 'equals',
      value: '',
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id))
  }

  const handlePreview = async () => {
    if (filters.length === 0) {
      toast.error('Add at least one filter to preview')
      return
    }

    try {
      setLoading(true)

      const apiFilters = filtersToApiFormat(filters)

      // Abort any previous in-flight preview request before starting a new one
      previewControllerRef.current?.abort()
      const controller = new AbortController()
      previewControllerRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch('/api/audiencelab/database/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...apiFilters, action: 'preview' }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
        if (previewControllerRef.current === controller) {
          previewControllerRef.current = null
        }
      }

      const data = await response.json()

      if (response.ok) {
        setPreview(data.preview)
        toast.success(`Found ${data.preview.count.toLocaleString()} matching leads`)
      } else {
        toast.error(data.error || 'Failed to preview')
      }
    } catch (_error: any) {
      if (_error?.name === 'AbortError') {
        toast.error('Preview timed out — the audience database is slow right now. Try again in a moment.')
      } else {
        toast.error('Failed to preview segment')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSegment = () => {
    if (!segmentName.trim()) {
      toast.error('Please enter a segment name')
      return
    }

    if (filters.length === 0) {
      toast.error('Add at least one filter')
      return
    }

    const apiFilters = filtersToApiFormat(filters)

    saveSegmentMutation.mutate({
      name: segmentName,
      description: segmentDescription || `${filters.length} filters applied`,
      filters: apiFilters,
    })
  }

  const handlePullLeads = async () => {
    if (!preview) {
      toast.error('Preview the segment first')
      return
    }

    try {
      const apiFilters = filtersToApiFormat(filters)

      const pullController = new AbortController()
      const pullTimeoutId = setTimeout(() => pullController.abort(), BULK_OPERATION_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch('/api/audiencelab/database/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...apiFilters, action: 'pull', limit: 25 }),
          signal: pullController.signal,
        })
      } finally {
        clearTimeout(pullTimeoutId)
      }

      const data = await response.json()

      if (response.ok) {
        toast.success(`Pulled ${data.pulled} leads! Charged ${data.credits_charged} credits`)
        setPreview(null)
        queryClient.invalidateQueries({ queryKey: ['segments'] })
      } else {
        if (response.status === 402) {
          showUpgradeModal(
            'credits_empty',
            data.error || "You don't have enough credits to pull leads from this segment."
          )
        } else {
          toast.error(data.error || 'Failed to pull leads')
        }
      }
    } catch (_error: any) {
      if (_error?.name === 'AbortError') {
        toast.error('Pull timed out — please try again in a moment.')
      } else {
        toast.error('Failed to pull leads')
      }
    }
  }

  const handleRunSavedSegment = async (segmentId: string, action: 'preview' | 'pull') => {
    setRunningSegmentId(segmentId)
    try {
      const response = await fetch(`/api/segments/${segmentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, limit: 25 }),
      })

      const data = await response.json()

      if (response.ok) {
        if (action === 'preview') {
          setPreview(data.preview)
          toast.success(`Found ${data.preview.count.toLocaleString()} matching leads`)
        } else {
          toast.success(data.message || `Pulled ${data.pulled} leads! Charged ${data.credits_charged} credits`)
          queryClient.invalidateQueries({ queryKey: ['segments'] })
        }
      } else {
        if (response.status === 402) {
          showUpgradeModal(
            'credits_empty',
            data.error || "You don't have enough credits to run this segment."
          )
        } else {
          toast.error(data.error || 'Failed to run segment')
        }
      }
    } catch (_error) {
      toast.error('Failed to run segment')
    } finally {
      setRunningSegmentId(null)
    }
  }

  const handleLoadSegment = (segment: Segment) => {
    const filterRules: FilterRule[] = []
    const apiFilters = segment.filters

    const reverseFieldMap: Record<string, FilterRule['field']> = {
      industries: 'industry',
      states: 'state',
      company_sizes: 'company_size',
      job_titles: 'job_title',
      seniority_levels: 'seniority',
    }

    Object.entries(apiFilters).forEach(([apiField, values]) => {
      const field = reverseFieldMap[apiField]
      if (field && Array.isArray(values) && values.length > 0) {
        values.forEach((value) => {
          filterRules.push({
            id: Math.random().toString(36).substr(2, 9),
            field,
            operator: 'equals',
            value,
          })
        })
      }
    })

    setFilters(filterRules)
    setSegmentName(segment.name)
    setSegmentDescription(segment.description || '')
    toast.success('Segment loaded into builder')
  }

  const confirmDeleteSegment = (segmentId: string) => {
    setSegmentToDelete(segmentId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSegment = () => {
    if (segmentToDelete) {
      deleteSegmentMutation.mutate(segmentToDelete)
      setDeleteDialogOpen(false)
      setSegmentToDelete(null)
    }
  }

  const applyPreset = (preset: PresetSegment) => {
    // Re-generate IDs so each application is unique
    const freshFilters: FilterRule[] = preset.filters.map((f) => ({
      ...f,
      id: Math.random().toString(36).substr(2, 9),
    }))
    setFilters(freshFilters)
    setSegmentName(preset.name)
    setSegmentDescription(preset.description)
    setActiveTab('builder')
    toast.success(`Loaded "${preset.name}" into builder`)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Upgrade modal — triggered on 402 credit errors */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={closeUpgradeModal}
        trigger={upgradeTrigger}
        context={upgradeContext}
      />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Filter className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Segment Builder</h1>
        </div>
        <p className="text-muted-foreground">
          Create custom audience segments from 280M+ verified contacts
        </p>
      </div>

      {/* Preset Segments */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Quick Presets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SEGMENTS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              title={preset.description}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/5 hover:border-primary/40 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} defaultValue="builder" onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Build Segment</TabsTrigger>
          <TabsTrigger value="catalog">
            <Library className="h-3.5 w-3.5 mr-1.5" />
            Browse Catalog
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved Segments ({savedSegments.length})
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SegmentRuleEditor
              filters={filters}
              segmentName={segmentName}
              segmentDescription={segmentDescription}
              loading={loading}
              saving={saveSegmentMutation.isPending}
              onAddFilter={addFilter}
              onUpdateFilter={updateFilter}
              onRemoveFilter={removeFilter}
              onSegmentNameChange={setSegmentName}
              onSegmentDescriptionChange={setSegmentDescription}
              onSave={handleSaveSegment}
              onPreview={handlePreview}
            />

            <SegmentPreview
              preview={preview}
              onPullLeads={handlePullLeads}
            />
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          <SegmentCatalog
            catalogSearch={catalogSearch}
            catalogType={catalogType}
            catalogCategory={catalogCategory}
            catalogPage={catalogPage}
            catalogLoading={catalogLoading}
            catalogSegments={catalogSegments}
            catalogTotal={catalogTotal}
            catalogTotalPages={catalogTotalPages}
            catalogCategories={catalogCategories}
            debouncedSearch={debouncedSearch}
            onSearchChange={handleCatalogSearchChange}
            onTypeChange={(v) => { setCatalogType(v); setCatalogPage(1) }}
            onCategoryChange={(v) => { setCatalogCategory(v); setCatalogPage(1) }}
            onPageChange={setCatalogPage}
            onUseCatalogSegment={handleUseCatalogSegment}
          />
        </TabsContent>

        {/* Saved Segments Tab */}
        <TabsContent value="saved">
          <SavedSegments
            segments={savedSegments}
            segmentsLoading={segmentsLoading}
            runningSegmentId={runningSegmentId}
            deleteDisabled={deleteSegmentMutation.isPending}
            onLoadSegment={handleLoadSegment}
            onRunSegment={handleRunSavedSegment}
            onDeleteSegment={confirmDeleteSegment}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this segment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSegmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSegment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
