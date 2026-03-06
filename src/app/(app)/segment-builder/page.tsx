'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
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
import {
  Filter,
  Plus,
  Play,
  Save,
  Trash2,
  TrendingUp,
  Users,
  Coins,
  AlertCircle,
  Loader2,
  Search,
  Library,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SkeletonCard } from '@/components/ui/skeleton'
import { UpgradeModal } from '@/components/marketplace/UpgradeModal'
import { useUpgradeModal } from '@/lib/hooks/use-upgrade-modal'

interface FilterRule {
  id: string
  field: 'industry' | 'state' | 'company_size' | 'job_title' | 'seniority'
  operator: 'equals' | 'contains' | 'in'
  value: string | string[]
}

interface Segment {
  id: string
  name: string
  description: string | null
  filters: Record<string, any>
  last_count: number | null
  last_run_at: string | null
  status: 'active' | 'paused' | 'archived'
  created_at: string
  workspace_id: string
  user_id: string
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Construction',
  'Education',
  'Hospitality',
]

const US_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'IL', name: 'Illinois' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'OH', name: 'Ohio' },
  { code: 'GA', name: 'Georgia' },
]

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
]

const JOB_TITLES = [
  'CEO',
  'CTO',
  'CFO',
  'VP',
  'Director',
  'Manager',
  'Engineer',
  'Designer',
  'Sales',
  'Marketing',
]

const SENIORITY_LEVELS = [
  'C-Level',
  'VP',
  'Director',
  'Manager',
  'Individual Contributor',
]

interface CatalogSegment {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  description: string | null
  type: 'B2B' | 'B2C'
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
    // Map the catalog category to an industry filter
    const newFilter: FilterRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: 'industry',
      operator: 'equals',
      value: seg.category,
    }
    setFilters((prev) => {
      // Don't duplicate
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

      // Convert filters to API format
      const apiFilters: any = {}
      filters.forEach((filter) => {
        if (filter.value) {
          const fieldMap: any = {
            industry: 'industries',
            state: 'states',
            company_size: 'company_sizes',
            job_title: 'job_titles',
            seniority: 'seniority_levels',
          }
          const apiField = fieldMap[filter.field]
          if (!apiFilters[apiField]) apiFilters[apiField] = []
          if (Array.isArray(filter.value)) {
            apiFilters[apiField].push(...filter.value)
          } else {
            apiFilters[apiField].push(filter.value)
          }
        }
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

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

    // Convert FilterRule[] to API format
    const apiFilters: Record<string, any> = {}
    filters.forEach((filter) => {
      if (filter.value) {
        const fieldMap: any = {
          industry: 'industries',
          state: 'states',
          company_size: 'company_sizes',
          job_title: 'job_titles',
          seniority: 'seniority_levels',
        }
        const apiField = fieldMap[filter.field]
        if (!apiFilters[apiField]) apiFilters[apiField] = []
        if (Array.isArray(filter.value)) {
          apiFilters[apiField].push(...filter.value)
        } else {
          apiFilters[apiField].push(filter.value)
        }
      }
    })

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
      const apiFilters: any = {}
      filters.forEach((filter) => {
        if (filter.value) {
          const fieldMap: any = {
            industry: 'industries',
            state: 'states',
            company_size: 'company_sizes',
            job_title: 'job_titles',
            seniority: 'seniority_levels',
          }
          const apiField = fieldMap[filter.field]
          if (!apiFilters[apiField]) apiFilters[apiField] = []
          if (Array.isArray(filter.value)) {
            apiFilters[apiField].push(...filter.value)
          } else {
            apiFilters[apiField].push(filter.value)
          }
        }
      })

      const pullController = new AbortController()
      const pullTimeoutId = setTimeout(() => pullController.abort(), 30000)

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
    // Convert API filters back to FilterRule[]
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
            {/* Left: Filter Builder */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Filters</CardTitle>
                      <CardDescription>
                        Build your audience by adding filters
                      </CardDescription>
                    </div>
                    <Button onClick={addFilter} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filters.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No filters added yet</p>
                      <p className="text-sm mt-2">Click &quot;Add Filter&quot; to get started</p>
                    </div>
                  ) : (
                    filters.map((filter, idx) => (
                      <div
                        key={filter.id}
                        className="flex items-center gap-3 p-4 border rounded-lg"
                      >
                        <div className="flex-shrink-0 text-sm font-medium text-muted-foreground">
                          {idx + 1}
                        </div>

                        {/* Field Selector */}
                        <Select
                          value={filter.field}
                          onValueChange={(value: any) =>
                            updateFilter(filter.id, { field: value, value: '' })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="industry">Industry</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                            <SelectItem value="company_size">Company Size</SelectItem>
                            <SelectItem value="job_title">Job Title</SelectItem>
                            <SelectItem value="seniority">Seniority Level</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Operator */}
                        <Select
                          value={filter.operator}
                          onValueChange={(value: any) =>
                            updateFilter(filter.id, { operator: value })
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">equals</SelectItem>
                            <SelectItem value="in">is one of</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Value Selector */}
                        <Select
                          value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
                          onValueChange={(value) => updateFilter(filter.id, { value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select value..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.field === 'industry' &&
                              INDUSTRIES.map((ind) => (
                                <SelectItem key={ind} value={ind}>
                                  {ind}
                                </SelectItem>
                              ))}
                            {filter.field === 'state' &&
                              US_STATES.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            {filter.field === 'company_size' &&
                              COMPANY_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size} employees
                                </SelectItem>
                              ))}
                            {filter.field === 'job_title' &&
                              JOB_TITLES.map((title) => (
                                <SelectItem key={title} value={title}>
                                  {title}
                                </SelectItem>
                              ))}
                            {filter.field === 'seniority' &&
                              SENIORITY_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {filters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Segment name"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={segmentDescription}
                      onChange={(e) => setSegmentDescription(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveSegment}
                      disabled={saveSegmentMutation.isPending}
                    >
                      {saveSegmentMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Segment
                    </Button>
                    <Button onClick={handlePreview} disabled={loading}>
                      <Play className="mr-2 h-4 w-4" />
                      {loading ? 'Loading...' : 'Preview'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              {preview ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4">
                        <div className="text-2xl sm:text-4xl font-bold text-primary">
                          {preview.count.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          matching leads
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium">Cost to pull 25 leads</div>
                          <div className="text-muted-foreground">
                            ${preview.credit_cost_per_lead}/lead
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <Coins className="h-5 w-5 text-yellow-600" />
                          {preview.credit_cost.toFixed(2)}
                        </div>
                      </div>

                      {!preview.can_afford && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <div className="text-sm text-orange-900">
                              Insufficient credits
                            </div>
                          </div>
                          <div className="text-xs text-orange-700 mt-1">
                            Balance: {preview.current_balance}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handlePullLeads}
                        disabled={!preview.can_afford}
                        className="w-full"
                        size="lg"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Pull 25 Leads
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Sample Leads */}
                  {preview.sample && preview.sample.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Sample Leads</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {preview.sample.slice(0, 3).map((lead: any, idx: number) => (
                          <div key={idx} className="p-2 bg-muted rounded text-sm">
                            <div className="font-medium">
                              {lead.FIRST_NAME} {lead.LAST_NAME}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.JOB_TITLE} • {lead.COMPANY_NAME}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Add filters and click &quot;Preview&quot;</p>
                      <p className="text-sm mt-2">to see matching leads</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search 19,000+ pre-built segments..."
                value={catalogSearch}
                onChange={(e) => handleCatalogSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={catalogType || 'all'} onValueChange={(v) => { setCatalogType(v === 'all' ? '' : v); setCatalogPage(1) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="B2B">B2B</SelectItem>
                <SelectItem value="B2C">B2C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catalogCategory || 'all'} onValueChange={(v) => { setCatalogCategory(v === 'all' ? '' : v); setCatalogPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {catalogCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-28 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : catalogSegments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Library className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No segments found</p>
              <p className="text-sm mt-1">Try a different search or filter</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{catalogTotal.toLocaleString()} segments{debouncedSearch ? ` matching "${debouncedSearch}"` : ''}</span>
                <span>Page {catalogPage} of {catalogTotalPages}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catalogSegments.map((seg) => (
                  <div
                    key={seg.segment_id}
                    className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{seg.name}</p>
                        <Badge variant={seg.type === 'B2B' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {seg.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-0.5">{seg.category}{seg.sub_category ? ` › ${seg.sub_category}` : ''}</p>
                      {seg.description && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">{seg.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full gap-1.5 text-xs"
                      onClick={() => handleUseCatalogSegment(seg)}
                    >
                      Use this segment
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {catalogTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                    disabled={catalogPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {catalogPage} / {catalogTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                    disabled={catalogPage >= catalogTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Saved Segments Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Segments</CardTitle>
              <CardDescription>Reusable audience definitions</CardDescription>
            </CardHeader>
            <CardContent>
              {segmentsLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : savedSegments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm font-medium text-foreground">No saved segments yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Build a segment using the filters above and click &quot;Save&quot; to reuse it for audience targeting and analytics.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSegments.map((segment: Segment) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {segment.description || 'No description'}
                          {segment.last_count !== null && (
                            <> • Last count: {segment.last_count.toLocaleString()}</>
                          )}
                          {segment.last_run_at && (
                            <> • Last run: {new Date(segment.last_run_at).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={segment.status === 'active' ? 'default' : 'secondary'}>
                          {segment.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadSegment(segment)}
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunSavedSegment(segment.id, 'preview')}
                          disabled={runningSegmentId === segment.id}
                        >
                          {runningSegmentId === segment.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <TrendingUp className="mr-2 h-4 w-4" />
                          )}
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRunSavedSegment(segment.id, 'pull')}
                          disabled={runningSegmentId === segment.id}
                        >
                          {runningSegmentId === segment.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Pull
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmDeleteSegment(segment.id)}
                          disabled={deleteSegmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
