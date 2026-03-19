'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ImpersonationSession {
  isImpersonating: boolean
  workspace: {
    id: string
    name: string
    slug: string
  } | null
  sessionId: string | null
}

/**
 * Banner displayed when admin is impersonating a workspace
 * Shows at the top of the page with workspace info and exit button
 */
export function ImpersonationBanner() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Check impersonation status
  const { data: session, isLoading } = useQuery<ImpersonationSession>({
    queryKey: ['impersonation-session'],
    queryFn: async () => {
      const response = await fetch('/api/admin/impersonate')
      if (!response.ok) {
        return { isImpersonating: false, workspace: null, sessionId: null }
      }
      return response.json()
    },
    // Refresh periodically to catch session changes
    refetchInterval: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  })

  // End impersonation mutation
  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to end impersonation')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impersonation-session'] })
      router.push('/admin/accounts')
    },
  })

  // Don't show if not impersonating
  if (isLoading || !session?.isImpersonating) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-sm font-medium">Admin View</span>
            </span>
            <span className="text-sm text-white/80">|</span>
            <span className="text-sm">
              Viewing as <strong className="font-semibold">{session.workspace?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/accounts')}
              className="text-sm text-white/90 hover:text-white transition-colors"
            >
              Back to Admin
            </button>
            <button
              onClick={() => endImpersonationMutation.mutate()}
              disabled={endImpersonationMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-md transition-colors disabled:opacity-50"
            >
              {endImpersonationMutation.isPending ? (
                'Exiting...'
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Exit View
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Server component wrapper to check impersonation on server side
 * and pass data to client component
 */
export async function ImpersonationBannerServer() {
  // This would be called from a server component
  // For now, we use client-side fetching in the banner
  return <ImpersonationBanner />
}
