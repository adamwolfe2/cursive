'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { ReactNode } from 'react'

interface MobileFiltersProps {
  children: ReactNode
  filterCount?: number
}

/**
 * Mobile filter sheet component
 * Displays filters in a slide-up drawer on mobile devices
 */
export function MobileFilters({ children, filterCount = 0 }: MobileFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="touch-default"
          className="relative lg:hidden"
          aria-label="Open filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span>Filters</span>
          {filterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {filterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Filter Leads</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
