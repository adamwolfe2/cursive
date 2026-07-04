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
    loadError?: boolean
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
  /** Funnel/managed buyers get a single clean leads view — no Today/Assigned/All
   *  tabs (those are marketplace concepts). */
  managed?: boolean
}

type TabValue = 'today' | 'assigned' | 'all'

const VALID_TABS: TabValue[] = ['today', 'assigned', 'all']

function LeadsPageTabsInner({
  dailyLeadsProps,
  assignedLeadsProps,
  allLeadsProps,
  managed,
}: LeadsPageTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Managed / funnel buyers: their only leads nav is "Your Audience"
  // (/leads?tab=all) plus the dashboard CTAs (/leads). Both must show the FULL
  // audience they paid for — NOT the marketplace "Today" slice, which
  // leads/page.tsx filters to `delivered_at = today` and is therefore empty on
  // any day after delivery (audience leads are stamped delivered_at once). The
  // old managed branch rendered DailyLeadsView, whose internal tab defaults to
  // "today", so a paid buyer landed on 0 rows and thought nothing was delivered.
  // AllLeadsTable is a single clean, paginated list of every lead in the
  // workspace, so the delivered audience is always visible on first paint.
  if (managed) {
    return <AllLeadsTable workspaceId={allLeadsProps.workspaceId} />
  }

  const tabParam = searchParams.get('tab') as TabValue | null
  const defaultTab: TabValue =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'today'

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
    <Tabs
      defaultValue={defaultTab}
      onValueChange={handleTabChange}
      className="space-y-6"
    >
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
