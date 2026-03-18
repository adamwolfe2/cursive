'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import {
  Search,
  Library,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { CatalogSegment } from './types'

interface SegmentCatalogProps {
  catalogSearch: string
  catalogType: string
  catalogCategory: string
  catalogPage: number
  catalogLoading: boolean
  catalogSegments: CatalogSegment[]
  catalogTotal: number
  catalogTotalPages: number
  catalogCategories: string[]
  debouncedSearch: string
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPageChange: (page: number) => void
  onUseCatalogSegment: (seg: CatalogSegment) => void
}

export function SegmentCatalog({
  catalogSearch,
  catalogType,
  catalogCategory,
  catalogPage,
  catalogLoading,
  catalogSegments,
  catalogTotal,
  catalogTotalPages,
  catalogCategories,
  debouncedSearch,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onPageChange,
  onUseCatalogSegment,
}: SegmentCatalogProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search 19,000+ pre-built segments..."
            value={catalogSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={catalogType || 'all'} onValueChange={(v) => onTypeChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="B2B">B2B</SelectItem>
            <SelectItem value="B2C">B2C</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catalogCategory || 'all'} onValueChange={(v) => onCategoryChange(v === 'all' ? '' : v)}>
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
                  onClick={() => onUseCatalogSegment(seg)}
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
                onClick={() => onPageChange(Math.max(1, catalogPage - 1))}
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
                onClick={() => onPageChange(Math.min(catalogTotalPages, catalogPage + 1))}
                disabled={catalogPage >= catalogTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
