'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { profileSettingsSchema, type ProfileSettingsFormData } from '@/lib/validation/schemas'
import {
  FormField,
  FormLabel,
  FormInput,
} from '@/components/ui/form'
import { useToast } from '@/lib/hooks/use-toast'
import { z } from 'zod'

const workspaceSettingsSchema = z.object({
  workspace_name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  industry: z.string().optional(),
})

type WorkspaceSettingsFormData = z.infer<typeof workspaceSettingsSchema>

function SettingsNav({ currentPath }: { currentPath: string }) {
  const tabs = [
    { name: 'Profile', href: '/settings' },
    { name: 'Billing', href: '/settings/billing' },
    { name: 'Security', href: '/settings/security' },
    { name: 'Notifications', href: '/settings/notifications' },
  ]

  return (
    <div className="border-b border-zinc-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const toast = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      return response.json()
    },
  })

  const user = userData?.data

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  })

  // Workspace form
  const {
    register: registerWorkspace,
    handleSubmit: handleSubmitWorkspace,
    formState: { errors: workspaceErrors },
  } = useForm<WorkspaceSettingsFormData>({
    resolver: zodResolver(workspaceSettingsSchema),
  })

  // Reset profile form when user data loads
  useState(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name || '',
        email: user.email || '',
      })
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileSettingsFormData) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: data.full_name }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Account deleted successfully. Redirecting...')
      setTimeout(() => {
        router.push('/signup')
      }, 2000)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })

  const onSubmitProfile = (data: ProfileSettingsFormData) => {
    updateProfileMutation.mutate(data)
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    deleteAccountMutation.mutate()
  }

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code)
      toast.success('Referral code copied to clipboard!')
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${user?.referral_code}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="h-96 bg-zinc-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Navigation Tabs */}
      <SettingsNav currentPath="/settings" />

      {/* Profile Form */}
      <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Personal Information
          </h2>

          <div className="space-y-4">
            <FormField error={profileErrors.full_name}>
              <FormLabel htmlFor="full_name" required>
                Full Name
              </FormLabel>
              <FormInput
                id="full_name"
                type="text"
                disabled={updateProfileMutation.isPending}
                error={profileErrors.full_name}
                {...registerProfile('full_name')}
              />
            </FormField>

            <FormField error={profileErrors.email}>
              <FormLabel
                htmlFor="email"
                hint="Email cannot be changed once registered"
              >
                Email Address
              </FormLabel>
              <FormInput
                id="email"
                type="email"
                disabled
                className="bg-zinc-50 text-zinc-500 cursor-not-allowed"
                {...registerProfile('email')}
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || Object.keys(profileErrors).length > 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Account Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Account Information
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Current Plan</span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                user?.plan === 'pro'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-zinc-100 text-zinc-800'
              }`}>
                {user?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              {user?.plan === 'free' && (
                <Link
                  href="/settings/billing"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Upgrade →
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Daily Credits</span>
            <span className="text-sm text-zinc-900">
              {user?.credits_remaining || 0} / {user?.daily_credit_limit || 3} remaining
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Member Since</span>
            <span className="text-sm text-zinc-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-zinc-700">Role</span>
            <span className="text-sm text-zinc-900 capitalize">
              {user?.role || 'Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">
          Referral Program
        </h2>
        <p className="text-sm text-zinc-600 mb-4">
          Share OpenInfo with your network and earn bonus credits when they sign up.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Your Referral Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user?.referral_code || 'Generating...'}
                readOnly
                className="block flex-1 rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm font-mono"
              />
              <button
                onClick={copyReferralCode}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Your Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={
                  user?.referral_code
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${user.referral_code}`
                    : 'Generating...'
                }
                readOnly
                className="block flex-1 rounded-lg border-zinc-300 bg-zinc-50 shadow-sm text-sm font-mono"
              />
              <button
                onClick={copyReferralLink}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-red-900 mb-2">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="block w-full max-w-xs rounded-lg border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="DELETE"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
