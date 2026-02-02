import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AIStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
