'use client'

import { createContext, useContext } from 'react'

export type DashboardData = {
  userProfile: {
    id: string
    authUserId: string
    fullName: string | null
    email: string
    plan: string | null
    role: string
    workspaceId: string | null
    dailyCreditLimit: number
    dailyCreditsUsed: number
  }
  workspace: {
    name: string
    subdomain?: string
    websiteUrl?: string | null
    branding?: {
      logo_url?: string | null
      favicon_url?: string | null
      primary_color?: string
    } | null
  } | null
  creditBalance: number
  todayLeadCount: number
}

const DashboardContext = createContext<DashboardData | null>(null)

export function DashboardProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: DashboardData
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardData {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return ctx
}
