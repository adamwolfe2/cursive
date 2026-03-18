'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import {
  Filter,
  Plus,
  Play,
  Save,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  FilterRule,
  INDUSTRIES,
  US_STATES,
  COMPANY_SIZES,
  JOB_TITLES,
  SENIORITY_LEVELS,
} from './types'

interface SegmentRuleEditorProps {
  filters: FilterRule[]
  segmentName: string
  segmentDescription: string
  loading: boolean
  saving: boolean
  onAddFilter: () => void
  onUpdateFilter: (id: string, updates: Partial<FilterRule>) => void
  onRemoveFilter: (id: string) => void
  onSegmentNameChange: (value: string) => void
  onSegmentDescriptionChange: (value: string) => void
  onSave: () => void
  onPreview: () => void
}

export function SegmentRuleEditor({
  filters,
  segmentName,
  segmentDescription,
  loading,
  saving,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onSegmentNameChange,
  onSegmentDescriptionChange,
  onSave,
  onPreview,
}: SegmentRuleEditorProps) {
  return (
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
            <Button onClick={onAddFilter} size="sm">
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
                    onUpdateFilter(filter.id, { field: value, value: '' })
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
                    onUpdateFilter(filter.id, { operator: value })
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
                  onValueChange={(value) => onUpdateFilter(filter.id, { value })}
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
                  onClick={() => onRemoveFilter(filter.id)}
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
              onChange={(e) => onSegmentNameChange(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Description (optional)"
              value={segmentDescription}
              onChange={(e) => onSegmentDescriptionChange(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Segment
            </Button>
            <Button onClick={onPreview} disabled={loading}>
              <Play className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Preview'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
