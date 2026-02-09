"use client"

import { ViewProvider } from '@/lib/view-context'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ViewProvider>{children}</ViewProvider>
}
