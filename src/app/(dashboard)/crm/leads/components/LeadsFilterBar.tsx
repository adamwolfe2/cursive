// Leads Filter Bar Component
// Search and filter controls for leads table

'use client'

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCRMStore } from '@/lib/crm/crm-state'
import { useDebounce } from '@/hooks/use-debounce'
import type { LeadStatus } from '@/types/crm.types'

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-700' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-700' },
]

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'audiencelab', label: 'SuperPixel' },
  { value: 'audiencelab_database', label: 'Database Pull' },
  { value: 'audiencelab_pull', label: 'Auto-Pull' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'query', label: 'Auto-Match' },
  { value: 'import', label: 'Import' },
  { value: 'manual', label: 'Manual' },
]

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Construction',
  'Transportation',
  'Other',
]

const STATE_OPTIONS = [
  'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
  'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
]

export interface LeadsFilterBarRef {
  focusSearch: () => void
}

export const LeadsFilterBar = forwardRef<LeadsFilterBarRef>((props, ref) => {
  const { filters, setFilters, clearFilters, setSearch } = useCRMStore()
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchInput, 300)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus()
    },
  }))

  // Update search in store when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch)
  }, [debouncedSearch, setSearch])

  const toggleStatus = (status: LeadStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]
    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined })
  }

  const toggleSource = (source: string) => {
    const currentSources = filters.sources || []
    const newSources = currentSources.includes(source)
      ? currentSources.filter((s) => s !== source)
      : [...currentSources, source]
    setFilters({ sources: newSources.length > 0 ? newSources : undefined })
  }

  const toggleIndustry = (industry: string) => {
    const currentIndustries = filters.industries || []
    const newIndustries = currentIndustries.includes(industry)
      ? currentIndustries.filter((i) => i !== industry)
      : [...currentIndustries, industry]
    setFilters({ industries: newIndustries.length > 0 ? newIndustries : undefined })
  }

  const toggleState = (state: string) => {
    const currentStates = filters.states || []
    const newStates = currentStates.includes(state)
      ? currentStates.filter((s) => s !== state)
      : [...currentStates, state]
    setFilters({ states: newStates.length > 0 ? newStates : undefined })
  }

  const activeFilterCount = [
    filters.status?.length || 0,
    filters.sources?.length || 0,
    filters.industries?.length || 0,
    filters.states?.length || 0,
    filters.hasPhone ? 1 : 0,
    filters.hasVerifiedEmail ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search leads by name, email, or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search leads"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              Status
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {filters.status.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.status?.includes(option.value)}
                onCheckedChange={() => toggleStatus(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Source filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              Source
              {filters.sources && filters.sources.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {filters.sources.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SOURCE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.sources?.includes(option.value)}
                onCheckedChange={() => toggleSource(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Industry filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              Industry
              {filters.industries && filters.industries.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {filters.industries.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Industry</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {INDUSTRY_OPTIONS.map((industry) => (
                <DropdownMenuCheckboxItem
                  key={industry}
                  checked={filters.industries?.includes(industry)}
                  onCheckedChange={() => toggleIndustry(industry)}
                >
                  {industry}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* State filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              State
              {filters.states && filters.states.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {filters.states.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by State</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto grid grid-cols-2 gap-0.5">
              {STATE_OPTIONS.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state}
                  checked={filters.states?.includes(state)}
                  onCheckedChange={() => toggleState(state)}
                  className="text-xs"
                >
                  {state}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              More
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Additional Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.hasPhone || false}
              onCheckedChange={(checked) => setFilters({ hasPhone: checked || undefined })}
            >
              Has Phone Number
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.hasVerifiedEmail || false}
              onCheckedChange={(checked) => setFilters({ hasVerifiedEmail: checked || undefined })}
            >
              Verified Email
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filter pills */}
      {(filters.status?.length || filters.sources?.length || filters.industries?.length || filters.states?.length) ? (
        <div className="flex flex-wrap gap-2">
          {filters.status?.map((status) => {
            const option = STATUS_OPTIONS.find((o) => o.value === status)
            return (
              <Badge key={status} variant="secondary" className="gap-1">
                {option?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleStatus(status as LeadStatus)}
                />
              </Badge>
            )
          })}
          {filters.sources?.map((src) => {
            const option = SOURCE_OPTIONS.find((o) => o.value === src)
            return (
              <Badge key={src} variant="secondary" className="gap-1">
                {option?.label ?? src}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleSource(src)}
                />
              </Badge>
            )
          })}
          {filters.industries?.map((industry) => (
            <Badge key={industry} variant="secondary" className="gap-1">
              {industry}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleIndustry(industry)}
              />
            </Badge>
          ))}
          {filters.states?.map((state) => (
            <Badge key={state} variant="secondary" className="gap-1">
              {state}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleState(state)}
              />
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
})

LeadsFilterBar.displayName = 'LeadsFilterBar'
