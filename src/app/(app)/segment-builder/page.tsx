'use client'

import { useState } from 'react'
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
} from '@/components/ui/select'
import {
  Filter,
  Plus,
  Play,
  Save,
  Trash2,
  TrendingUp,
  Users,
  Coins,
  Download,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface FilterRule {
  id: string
  field: 'industry' | 'state' | 'company_size' | 'job_title' | 'seniority'
  operator: 'equals' | 'contains' | 'in'
  value: string | string[]
}

interface Segment {
  id: string
  name: string
  description: string
  filters: FilterRule[]
  last_count: number
  last_run: string
  status: 'active' | 'paused'
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

export default function SegmentBuilderPage() {
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [segmentName, setSegmentName] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [savedSegments, setSavedSegments] = useState<Segment[]>([])

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

      const response = await fetch('/api/audiencelab/database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...apiFilters,
          action: 'preview',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPreview(data.preview)
        toast.success(`Found ${data.preview.count.toLocaleString()} matching leads`)
      } else {
        toast.error(data.error || 'Failed to preview')
      }
    } catch (error) {
      toast.error('Failed to preview segment')
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

    const newSegment: Segment = {
      id: Math.random().toString(36).substr(2, 9),
      name: segmentName,
      description: `${filters.length} filters applied`,
      filters,
      last_count: preview?.count || 0,
      last_run: new Date().toISOString(),
      status: 'active',
    }

    setSavedSegments([...savedSegments, newSegment])
    toast.success('Segment saved!')
    setSegmentName('')
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

      const response = await fetch('/api/audiencelab/database/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...apiFilters,
          action: 'pull',
          limit: 25,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Pulled ${data.pulled} leads! Charged ${data.credits_charged} credits`)
        setPreview(null)
      } else {
        if (response.status === 402) {
          toast.error(`Insufficient credits: ${data.error}`)
        } else {
          toast.error(data.error || 'Failed to pull leads')
        }
      }
    } catch (error) {
      toast.error('Failed to pull leads')
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
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

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Build Segment</TabsTrigger>
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
                      <p className="text-sm mt-2">Click "Add Filter" to get started</p>
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
                <div className="flex gap-3">
                  <Input
                    placeholder="Segment name (optional)"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleSaveSegment}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Segment
                  </Button>
                  <Button onClick={handlePreview} disabled={loading}>
                    <Play className="mr-2 h-4 w-4" />
                    {loading ? 'Loading...' : 'Preview'}
                  </Button>
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
                        <div className="text-4xl font-bold text-primary">
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
                      <p>Add filters and click "Preview"</p>
                      <p className="text-sm mt-2">to see matching leads</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Saved Segments Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Segments</CardTitle>
              <CardDescription>Reusable audience definitions</CardDescription>
            </CardHeader>
            <CardContent>
              {savedSegments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No saved segments yet</p>
                  <p className="text-sm mt-2">Build a segment and click "Save" to reuse it</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {segment.description} • Last count: {segment.last_count.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={segment.status === 'active' ? 'default' : 'secondary'}>
                          {segment.status}
                        </Badge>
                        <Button size="sm">
                          <Play className="mr-2 h-4 w-4" />
                          Run
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
    </div>
  )
}
