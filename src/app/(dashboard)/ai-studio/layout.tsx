import type { Metadata } from 'next'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { StudioSidebar } from '@/components/ai-studio/studio-sidebar'

export const metadata: Metadata = {
  title: 'AI Studio | Cursive',
}

export default function AIStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen">
        {/* AI Studio Sidebar */}
        <StudioSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}
