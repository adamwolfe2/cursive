/**
 * User Data Hook
 * Fetches and caches current user data with React Query
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export interface UserData {
  id: string
  email: string
  full_name: string
  workspace_id: string
  role: 'owner' | 'admin' | 'member' | 'partner'
  plan: 'free' | 'pro' | 'enterprise'
  daily_credit_limit: number
  daily_credits_used: number
  credits_remaining: number
  referral_code: string | null
  referred_by: string | null
  created_at: string
  subscription_status: string | null
  subscription_period_end: string | null
  cancel_at_period_end: boolean | null
  notification_preferences: any
}

export interface UserWithWorkspace extends UserData {
  workspace?: {
    id: string
    name: string
    slug: string
  }
}

export function useUser() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<UserData>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          router.push('/login')
          throw new Error('Unauthorized')
        }
        throw new Error('Failed to fetch user data')
      }
      const data = await response.json()
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      queryClient.clear()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  return {
    user,
    isLoading,
    error,
    refetch,
    logout,
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    isOwner: user?.role === 'owner',
    isPartner: user?.role === 'partner',
    isPro: user?.plan === 'pro' || user?.plan === 'enterprise',
  }
}
