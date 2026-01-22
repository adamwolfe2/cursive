'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [successMessage, setSuccessMessage] = useState('')

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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      full_name: string
    }) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    updateProfileMutation.mutate({
      full_name: formData.get('full_name') as string,
    })
  }

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code)
      setSuccessMessage('Referral code copied!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${user?.referral_code}`
    navigator.clipboard.writeText(link)
    setSuccessMessage('Referral link copied!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/settings"
            className="border-blue-500 text-blue-600 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Profile
          </Link>
          <Link
            href="/settings/notifications"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Notifications
          </Link>
          <Link
            href="/settings/security"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Security
          </Link>
          <Link
            href="/settings/billing"
            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Billing
          </Link>
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                defaultValue={user?.full_name || ''}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={user?.email || ''}
                disabled
                className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed once registered
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Workspace Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Workspace Information
        </h2>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <span className="ml-2 text-sm text-gray-900 capitalize">
              {user?.role || 'Member'}
            </span>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Plan:</span>
            <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {user?.plan || 'free'}
            </span>
            {user?.plan === 'free' && (
              <Link
                href="/pricing"
                className="ml-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Upgrade to Pro →
              </Link>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              Credits Remaining:
            </span>
            <span className="ml-2 text-sm text-gray-900">
              {user?.credits_remaining || 0} /{' '}
              {user?.daily_credit_limit || 3} today
            </span>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              Member since:
            </span>
            <span className="ml-2 text-sm text-gray-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Referral Program
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Share OpenInfo with your network and earn bonus credits when they
          sign up using your referral link.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Referral Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={user?.referral_code || 'Generating...'}
                readOnly
                className="block flex-1 rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
              <button
                onClick={copyReferralCode}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Copy Code
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Referral Link
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={
                  user?.referral_code
                    ? `${window.location.origin}/signup?ref=${user.referral_code}`
                    : 'Generating...'
                }
                readOnly
                className="block flex-1 rounded-md border-gray-300 bg-gray-50 shadow-sm text-sm"
              />
              <button
                onClick={copyReferralLink}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
