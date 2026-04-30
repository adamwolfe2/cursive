'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DailyLeadsView } from './daily-leads-view'
import { MyLeadsRealtime } from './my-leads-realtime'
import { AllLeadsTable } from './all-leads-table'
import type { Lead } from './lead-card'

interface LeadsPageTabsProps {
  dailyLeadsProps: {
    leads: Lead[]
    todayCount: number
    weekCount: number
    monthCount: number
    dailyLimit: number
    plan: string
    industrySegment?: string | null
    locationSegment?: string | null
  }
  assignedLeadsProps: {
    userId: string
    workspaceId: string
  }
  allLeadsProps: {
    workspaceId: string
  }
}

type TabValue = 'today' | 'assigned' | 'all'

const VALID_TABS: TabValue[] = ['today', 'assigned', 'all']

function LeadsPageTabsInner({
  dailyLeadsProps,
  assignedLeadsProps,
  allLeadsProps,
}: LeadsPageTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const tabParam = searchParams.get('tab') as TabValue | null
  const defaultTab: TabValue = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'today'

  function handleTabChange(value: string) {
    const newTab = value as TabValue
    const params = new URLSearchParams(searchParams.toString())
    if (newTab === 'today') {
      params.delete('tab')
    } else {
      params.set('tab', newTab)
    }
    const qs = params.toString()
    router.replace(qs ? `/leads?${qs}` : '/leads', { scroll: false })
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="assigned">Assigned</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>

      <TabsContent value="today">
        <DailyLeadsView {...dailyLeadsProps} />
      </TabsContent>

      <TabsContent value="assigned">
        <MyLeadsRealtime
          userId={assignedLeadsProps.userId}
          workspaceId={assignedLeadsProps.workspaceId}
        />
      </TabsContent>

      <TabsContent value="all">
        <AllLeadsTable workspaceId={allLeadsProps.workspaceId} />
      </TabsContent>
    </Tabs>
  )
}

export function LeadsPageTabs(props: LeadsPageTabsProps) {
  return (
    <Suspense fallback={null}>
      <LeadsPageTabsInner {...props} />
    </Suspense>
  )
}
